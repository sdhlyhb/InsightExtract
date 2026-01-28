export interface Document {
  id: string;
  title: string;
  sourceType: "pdf" | "text" | "url" | "docx";
  kind?: "document" | "flashcards-csv" | "summary";
  status: "uploaded" | "processing" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
  fileSize?: number;
  pageCount?: number;
  mimeType?: string;
  content?: string;
  sourceFileName?: string;
  cardCount?: number;
  meta?: Record<string, any>;
}

export interface Outline {
  documentId: string;
  mainPoints: string[];
  outline: OutlineNode[];
  citations: Citation[];
}

export interface OutlineNode {
  title: string;
  children?: OutlineNode[];
  page?: number;
}

export interface Citation {
  id: string;
  page: number;
  quote: string;
  context?: string;
}

export interface Deck {
  id: string;
  documentId: string;
  title: string;
  cardCount: number;
  dueCount: number;
  createdAt: string;
  tags: string[];
}

export interface Flashcard {
  id: string;
  deckId: string;
  type: "qa" | "cloze" | "truefalse";
  front: string;
  back: string;
  citations: Citation[];
  tags: string[];
  ease: number;
  interval: number;
  repetition: number;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface StudySession {
  id: string;
  deckId: string;
  startedAt: string;
  completedAt?: string;
  cardCount: number;
  reviewedCount: number;
}

export interface Review {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
