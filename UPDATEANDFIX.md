# **Landing Page + Step 3 Updates + Recent Documents Fix**

**ROLE:**

You are a senior full‑stack engineer working in my repository. Implement the following UI/UX and logic updates across the landing page, homepage, Step 3, and Recent Documents behaviors.

---

## **1. CONTEXT (Existing Behavior)**

- The app currently loads directly into a page that combines landing content and upload/parse/summarization steps.
- Step 3 includes a **Save CSV** button (to be removed).
- In the **Recent Documents** section, clicking a file opens a modal preview showing CSV content + a “proceed to make cards” button.
- The date under each file in Recent Documents is currently displayed as **“Invalid Date”** (bug).
- Step 2 generates **Summary / Key Points / Outline**, but the save‑to‑database flow needs alignment with the new UX.

---

## **2. GOAL**

Implement the following changes:

---

## **3. REQUIRED CHANGES**

### **A) Split Landing Page into Its Own Page (`/landing`)**

- Move current landing content into a **dedicated Landing Page**, e.g. `/landing` or `/`.
- Add two buttons on the landing page:
  1. **“Get Started”** → Navigate to the **Homepage** (`/home`) where Step 1–3 workflows live.
  2. **“View My Flashcards”** → Navigate to `/my-flashcards` (existing decks page).
- The **Homepage** must now contain only:
  - Step 1 (upload & parse)
  - Step 2 (AI summary generation)
  - Step 3 (Preview & Make Flashcards UI)

---

### **B) Step 3: Preview & Make Flashcards (CSV) — Remove Save CSV Button**

- Delete the **“Save CSV”** button.
- Step 3 should now simply:
  - Show preview of generated CSV.
  - Offer **Make Flashcards** and **Cancel** buttons.
- Flashcards should be created only when the user selects **Make Flashcards** (no database write before that).

---

### **C) Recent Documents — Replace CSV Preview Modal**

Current behavior: Clicking a Recent Document opens a modal showing the CSV content + a “proceed to make cards” button.

**Replace this with a new behavior:**

- When user clicks a Recent Document, open a modal that displays:
  - **Summary**
  - **Key Points**
  - **Outline**

These are the AI‑generated results from **Step 2**, saved earlier.

**No flashcard creation button should appear here anymore.**

---

### **D) Fix “Invalid Date” Bug in Recent Documents**

- Correctly parse the timestamp from the database.
- Display the date in a user‑friendly format:
  ```
  Jan 24, 2026  •  10:32 PM

  ```
- Ensure timezone is consistent with current user timezone (ET / GMT‑05:00).

---

### **E) Saving Summaries to Database**

When the user finishes Step 2 (LLM summary), show a **“Save Result”** button.

On click:

1. Save the Step 2 output (`summary`, `keyPoints`, `outline`) into the database.
2. Automatically generate a filename:

   ```
   <baseName>-summary-<timestamp>-<hash>.json

   ```

3. Add this new document to **Recent Documents**.
4. Clicking its name in Recent Documents opens a modal showing the saved Step 2 results.

---

### **F) Adjust Recent Documents Logic**

- Recent Documents should list both:
  - CSV‑generated documents (from Step 3)
  - Summary‑generated documents (from Step 2)
- Each document type has a modal:
  - **Summary Document:** Show Summary, Key Points, Outline
  - **CSV Document:** (If still accessible somewhere) Show CSV preview only—_not_ in Recent Documents modal anymore per new spec.

---

## **4. TECHNICAL REQUIREMENTS**

### **Document Model Must Store:**

TypeScript

interface DocumentRecord {

id: string;

name: string;

kind: "summary" | "flashcards-csv";

createdAt: string;

content: string; // JSON string for summary, CSV string for csv-kind

sourceFile?: string;

}

Show more lines

### **Fetching Behavior**

- Recent Documents lists all documents belonging to the user.
- Clicking a document:
  - Fetch full record
  - Render modal based on `kind`

---

## **5. ACCEPTANCE CRITERIA (MUST PASS)**

1. Landing page is separate, clean, and routes correctly:
   - “Get Started” → Homepage
   - “View My Flashcards” → `/my-flashcards`
2. Step 3 has **NO Save CSV button**.
3. Recent Documents modal shows **only AI‑summary content**, not CSV or “proceed to make cards.”
4. Recent Documents dates display correctly and never show “Invalid Date.”
5. Step 2 includes a **Save Result** button, saves summary to DB, and appears in Recent Documents instantly.
6. Clicking the file name shows saved Summary/Key Points/Outline in a modal.
7. Flashcards can only be created from Step 3 (CSV flow), not from Recent Documents.
8. No changes to `llm.py` prompts or upstream summarization logic.

---

## **6. WHAT TO AVOID**

- Do not alter Step 1 or Step 2 logic except to add the Save button and DB logic.
- Do not reintroduce the old CSV modal or the “proceed to make cards” flow.
- Do not break existing deck/flashcard creation routes.
- Do not alter database schema unless absolutely necessary—reuse existing fields and add only required keys.
