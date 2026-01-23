import { apiClient } from "./client";
import type { Document, Outline, Deck, Flashcard, Review } from "@/types";

export const documentsApi = {
  create: (formData: FormData) =>
    apiClient.post<Document>("/documents", formData),

  get: (id: string) => apiClient.get<Document>(`/documents/${id}`),

  getOutline: (id: string) =>
    apiClient.get<Outline>(`/documents/${id}/outline`),

  generate: (id: string) =>
    apiClient.post<{ jobId: string }>(`/documents/${id}/generate`),

  getDecks: (id: string) => apiClient.get<Deck[]>(`/documents/${id}/decks`),

  list: () => apiClient.get<Document[]>("/documents"),

  delete: (id: string) => apiClient.delete(`/documents/${id}`),
};

export const decksApi = {
  get: (id: string) => apiClient.get<Deck>(`/decks/${id}`),

  getCards: (id: string) => apiClient.get<Flashcard[]>(`/decks/${id}/cards`),

  export: (id: string, format: "csv" | "anki") =>
    apiClient.post<Blob>(`/decks/${id}/export`, { format }),
};

export const cardsApi = {
  update: (id: string, data: Partial<Flashcard>) =>
    apiClient.patch<Flashcard>(`/cards/${id}`, data),

  review: (id: string, quality: number) =>
    apiClient.post<Flashcard>(`/cards/${id}/review`, { quality }),
};

export const searchApi = {
  search: (query: string) =>
    apiClient.get<Document[]>(`/search?query=${encodeURIComponent(query)}`),
};

export const jobsApi = {
  getStream: (jobId: string) =>
    apiClient.createEventSource(`/jobs/${jobId}/stream`),
};
