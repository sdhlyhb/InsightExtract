## 1 Why this project?

Reading dense PDFs and long-form content is slow; extracting the _right_ main points and retaining them is even harder. This app lets users **upload a PDF or paste long text**, then uses an LLM (with MCP‑based tools) to:

1. extract & structure the content,
2. distill key points with citations, and
3. generate high‑quality flashcards with **spaced repetition** scheduling.

The goal is a fast, privacy‑respecting study companion that works in the browser and on mobile.

## 2 Goals & Non‑Goals

### Goals

- **Reliable ingestion** of PDFs and long text (including OCR for scanned PDFs).
- **Accurate summaries** with citations (quote spans + page numbers).
- **Flashcard generation** (Q/A, cloze deletions, concept → definition) with quality checks.
- **Spaced repetition** (SM‑2 variant) and study sessions with progress tracking.
- **Responsive UI** with React + Tailwind.
- **API** in Node.js (TypeScript, **NestJS**) _or_ **FastAPI** (Python) with Postgres.
- **Vector search (pgvector)** for retrieval‑augmented generation (RAG).
- **MCP tools** to cleanly separate capabilities (pdf loading, text chunking, embeddings, retriever, flashcard writer, srs scheduler).
- **CI/CD** pipeline and one‑click deploy.

## 3 Users & Use Cases

- **Learners & professionals**: turn articles, whitepapers, or manuals into flashcards.
- **Engineers/product**: quickly grok RFCs, internal docs, design specs.
- **Educators**: create decks for a syllabus or chapter.

**Key flows**

1. Upload PDF → generate outline → approve → generate flashcards → study.
2. Paste long text/URL → same as above.
3. Return later → continue SRS session.

---

## 4 Success Metrics

- **Quality**: human rating ≥ 4/5 for summary accuracy & flashcard usefulness.
- **Coverage**: % of key sections represented in flashcards (compared to auto TOC).
- **Efficiency**: p95 end‑to‑end generation time under a practical threshold.
- **Retention**: study completion rate and 7‑day review adherence (SRS).
- **Privacy**: zero PII/secret incidents; zero blocked deployments for policy violations.

## 5 High‑Level Architecture

```

                  ┌──────────────────────────┐
                  │         React UI         │
                  │  (Vite + Tailwind CSS)   │
                  └───────┬─────────┬────────┘
                          │         │
                  (HTTP)  │         │  (SSE / WebSocket for progress)
                          │         │
         ┌────────────────▼─────────▼────────────────┐
         │           API Service (Backend)           │
         │  Option A: Node.js (NestJS + TS)          │
         │  Option B: FastAPI (Python)               │
         │                                            │
         │  • Uploads (S3/Azure Blob/Disk)            │
         │  • Task Orchestrator (queue)               │
         │  • MCP Client → Tools                      │
         │  • RAG Pipeline                            │
         │  • AuthN/Z                                 │
         └───────────────┬───────────────┬────────────┘
                         │               │
                         │               │
              ┌──────────▼───────┐   ┌──▼───────────────────┐
              │PostgreSQL +      │   │ Object Storage       │
              │pgvector (embeds) │   │ (PDFs, assets)       │
              └──────────────────┘   └──────────────────────┘

MCP Tools (managed by backend):
  • pdf_loader    • text_preprocessor  • chunker
  • embedder      • vector_store       • retriever
  • flashcard_writer  • srs_scheduler  • safety_checker

```

## 6 Technology Choices

### Frontend

- **React 18 + Vite**, **Tailwind CSS** (dark mode out of box).
- **React Query (TanStack)** for data fetching & cache.
- **Radix UI** or Headless UI for accessible components.
- **SSE** or **WebSocket** progress channel during long jobs.

### Backend (choose one; both plans provided)

- **Option A — Node.js**: **NestJS + TypeScript**, **BullMQ** (Redis) for background tasks.
- **Option B — FastAPI**: **FastAPI**, **RQ/Celery** (Redis) or **Arq** for tasks.

### LLM & Embeddings

- **Model**: Azure OpenAI, OpenAI, or other compatible provider.
- **Embeddings**: 1536–3072‑dim model; store in **pgvector**.

### Storage

- **PostgreSQL 15+ with pgvector**.

### Observability

- **OpenTelemetry** for traces/metrics/logs.
- **Sentry** (frontend & backend) for errors.

---

## 7 Data Model (ERD + SQL)

**Entities**

- `user`
- `document` (one per upload or paste)
- `document_asset` (original file, page images, text JSON)
- `chunk` (RAG chunks + metadata)
- `embedding` (pgvector column, 1:1 with chunk or multi‑vector)
- `summary` (structured outline + citations)
- `flashcard_deck` and `flashcard`
- `study_session` and `review` (SRS logs)
- `job` (long‑running pipeline tracking)

## 8 Ingestion & Processing Pipeline

### Steps

1. **Upload/Paste**
   - PDF → stored in object storage; generate file hash to dedupe.
   - Pasted text/URL → stored as a "virtual" document with raw text asset.
2. **Extraction**
   - **Native text PDFs**: `pdfplumber`/`PyMuPDF` (backend) or `pdf.js` (optional page previews).
   - **Scanned PDFs**: OCR via **Tesseract** or cloud OCR (Azure Form Recognizer) if enabled.
3. **Normalization**
   - Remove headers/footers, dehyphenate, preserve lists/tables where possible.
   - Page anchors like: `doc:{document_id}:page:{n}`.
4. **Chunking**
   - **Hybrid**: rule‑based (by headings & paragraphs) + token‑budget (e.g., 700–1200 tokens).
   - Store `page_from/page_to`, section titles, and `token_count`.
5. **Embeddings**
   - Batch embed chunks; write to `embedding.vector`.
   - Record provider + model version for reproducibility.
6. **RAG Summarization**
   - Query retriever with document‑level query templates: _“Provide outline, key arguments, methods, results, limitations, and takeaways with citations.”_
   - Produce **hierarchical outline** + **main points** with **inline citations** referencing quotes/page numbers.
7. **Flashcard Generation**
   - For each main point/section: generate **2–4** cards:
     - Q/A (“What is…”, “Why does…”)
     - Cloze deletion (fill‑in‑the‑blank)
     - True/False where appropriate
   - Enforce rules:
     - each card references at least **one citation** (quote + page).
     - avoid double‑barreled questions; ensure single fact per card.
     - generate **tags** by section (e.g., _Intro, Methods, Conclusion_).
8. **SRS Scheduling**
   - Initialize SM‑2 fields (`ease=2.5`, `interval=0`, `repetition=0`, due=today).
   - Update per review using user’s **quality** (0–5).
9. **Safety & QA**
   - Run **safety_checker**: PII scan, toxicity, prohibited content.
   - **Self‑consistency**: regenerate cards that lack supporting citations.
   - Dedup near‑identical cards (embedding similarity threshold).

Define MCP‑compatible tools the backend will call; each runs within a sandboxed server process.

```json
[
  {
    "name": "pdf_loader",
    "description": "Load PDF bytes, extract text per page, and produce page-level metadata.",
    "args": { "uri": "string", "ocr": "boolean", "lang": "string?" },
    "returns": { "pages": "Array<{page:int, text:string, bbox?:any}>" }
  },
  {
    "name": "text_preprocessor",
    "description": "Normalize text (dehyphenate, dedupe headers/footers), detect sections/headings.",
    "args": { "pages": "array", "language": "string" }
  },
  {
    "name": "chunker",
    "description": "Chunk preprocessed text using hybrid rules + token budget.",
    "args": { "pages": "array", "target_tokens": "int" }
  },
  {
    "name": "embedder",
    "description": "Compute embeddings for chunks using the selected provider.",
    "args": { "chunks": "array", "model": "string" }
  },
  {
    "name": "vector_store",
    "description": "Persist embeddings in Postgres/pgvector and query top-k.",
    "args": { "mode": "put|search", "data": "any" }
  },
  {
    "name": "retriever",
    "description": "RAG: retrieve relevant chunks for a prompt and return citations.",
    "args": { "document_id": "uuid", "query": "string", "k": "int" }
  },
  {
    "name": "flashcard_writer",
    "description": "Given outline/main points + citations, write flashcards that follow constraints.",
    "args": {
      "outline": "json",
      "citations": "array",
      "style": "qa|cloze|mixed"
    }
  },
  {
    "name": "srs_scheduler",
    "description": "Compute next due date based on SM-2 parameters and quality (0..5).",
    "args": {
      "ease": "float",
      "interval": "int",
      "repetition": "int",
      "quality": "int"
    }
  },
  {
    "name": "safety_checker",
    "description": "Scan text for PII/tokens/policy-sensitive content; redact or block.",
    "args": { "text": "string", "policy": "json" }
  }
]
```

- REST (or HTTP+JSON) Endpoints

```json

POST   /api/documents                 # create doc by upload/paste/url
GET    /api/documents/:id             # metadata + status
GET    /api/documents/:id/outline     # outline + main points + citations
POST   /api/documents/:id/generate    # (re)run pipeline
GET    /api/documents/:id/decks       # list decks
POST   /api/decks/:deckId/export      # export to CSV/Anki

GET    /api/decks/:deckId/cards       # list flashcards
PATCH  /api/cards/:cardId             # edit a card
POST   /api/cards/:cardId/review      # record SRS review {quality}

GET    /api/search?query=...          # cross-document vector search
GET    /api/jobs/:jobId/stream        # SSE progress
``

```

```json

POST /api/documents
Content-Type: multipart/form-data
-- file: research.pdf
-- source_type: pdf
--> { "id": "uuid", "status": "uploaded" }

```

```json

GET /api/documents/:id/outline
--> {
  "documentId": "uuid",
  "mainPoints": ["X", "Y", "Z"],
  "outline": [{ "title": "1. Intro", "children": [...] }],
  "citations": [{ "page": 5, "quote": "..." }]
}
``

```

## 11 Frontend Spec (React + Tailwind)

**Pages**

- **Home**: upload/paste, recent documents.
- **Document**: progress timeline, outline, citations, “Generate Flashcards” CTA.
- **Deck**: list of cards, filters by tag/section, export.
- **Study Session**: one card at a time, buttons 0–5 (Again → Easy), keyboard shortcuts, streaks.

**Components**

- `FileDropzone`, `PdfPreview` (canvas with `pdf.js`), `OutlineTree`, `CitationPopover`, `FlashcardEditor`, `SrsControls`, `JobProgress`.

**UX**

- Show deterministic **steps** with clear sub‑statuses (extract → chunk → embed → summarize → cards).
- Allow **inline edits** for any card; auto‑save with optimistic UI.
- Respect **reduced motion** & accessibility.

## 12 Backend Spec

### Option A — **NestJS (Node.js + TS)**

- Modules: `AuthModule`, `DocumentModule`, `PipelineModule`, `DeckModule`, `StudyModule`, `SearchModule`.
- Queue: **BullMQ** (Redis). Jobs: `ExtractJob`, `EmbedJob`, `SummarizeJob`, `CardsJob`.
- ORM: **Prisma** or **TypeORM**.
- Testing: **Jest** + **Supertest**.
- Streaming: SSE endpoint; `@nestjs/event-emitter` for internal events.

## 13 Prompts (RAG‑first)

> System: “You are a precise study assistant. Use only the retrieved context. When unsure, say you don’t know. Always attach citations with page numbers.”
>
> **Summarization Prompt**
>
> _Given the retrieved chunks, produce:_
>
> 1. a hierarchical outline, 2) 8–15 main points, 3) explicit citations per point._Style:_ concise, neutral, no marketing language.
>
> **Flashcard Prompt**
>
> “Generate `qa` and `cloze` cards. Each card must be supported by a direct quote (citation). Avoid double‑barreled questions; break them into separate cards. Prefer atomic facts. For cloze, mask only key terms.”

**Hallucination guards**

- Max generation strictly limited to retrieved chunks.
- For any claim without supporting quote, regenerate with a higher `k` or different retrieval seeds.

---

## 14 Security, Privacy, Compliance

- **Never log** raw document contents. Use hashed IDs in logs.
- **Encrypt at rest** (Postgres disk, object storage).
- **Signed URLs** with short TTL for asset access.
- **Content scanning** via `safety_checker` MCP (PII patterns, secrets).
- **Document deletion** path with recursive wipe of chunks and embeddings.
- **Tenant considerations**: Align with **sensitivity labels** and avoid breaking collaboration flows. When deploying in our M365 environment, coordinate with security to validate labeling behavior on stored files (prior incident demonstrates impact of label propagation). [[RCA_UMA_Se...labels_104 | Word]](https://vocateeducation.sharepoint.com/sites/ITOutageNotifications/_layouts/15/Doc.aspx?sourcedoc=%7B9A1C5E81-77B7-4DCD-8BCE-E4C2D53F8989%7D&file=RCA_UMA_Sensitivty_labels_104.docx&action=default&mobileredirect=true&DefaultItemOpen=1)

---

## 15 Testing Strategy

- **Unit**: chunker, scheduler (SM‑2), prompt templates (snapshot tests).
- **Integration**: end‑to‑end pipeline with a small sample PDF fixture.
- **Golden set**: curated document + expected outline/cards; regression checks.
- **Load**: concurrent uploads; p95 on embedding & generation steps.
- **UX**: Cypress/Playwright flows (upload → cards → study → review).

---

## 16 CI/CD & Environments

### Branching

- `main` (protected), `dev` (integration), feature branches PR → `dev`.

### Checks

- Lint (ESLint / Ruff), type checks (TS), tests, coverage gate.
- Secret scanning (GitHub Advanced Security or Gitleaks).
- Docker build & SBOM (Syft/Grype).

## Key Directories

- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions
- `src/api/` - API client code
- `tests/` - Test files

## Code Style

- TypeScript strict mode enabled
- Prefer `interface` over `type` (except unions/intersections)
- No `any` - use `unknown` instead
- Use early returns, avoid nested conditionals
- Prefer composition over inheritance

## Git Conventions

- **Branch naming**: `{initials}/{description}` (e.g., `jd/fix-login`)
- **Commit format**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **PR titles**: Same as commit format

## Critical Rules

### Error Handling

- NEVER swallow errors silently
- Always show user feedback for errors
- Log errors for debugging

### UI States

- Always handle: loading, error, empty, success states
- Show loading ONLY when no data exists
- Every list needs an empty state

### Mutations

- Disable buttons during async operations
- Show loading indicator on buttons
- Always have onError handler with user feedback

## Testing

- Write failing test first (TDD)
- Use factory pattern: `getMockX(overrides)`
- Test behavior, not implementation
- Run tests before committing

## Skill Activation

Before implementing ANY task, check if relevant skills apply:

- UI components → `react-ui-patterns` skill
