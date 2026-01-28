import { apiClient } from "./client";
import type { Document, Deck, Flashcard } from "@/types";

export const documentsApi = {
  list: () => apiClient.get<Document[]>("/documents"),
  get: (id: string) => apiClient.get<Document>(`/documents/${id}`),
  getOutline: (id: string) => apiClient.get<any>(`/documents/${id}/outline`),
  getDecks: (id: string) => apiClient.get<Deck[]>(`/documents/${id}/decks`),
  create: (data: FormData) => apiClient.post<Document>("/documents", data),
  delete: (id: string) => apiClient.delete<void>(`/documents/${id}`),
};

export const decksApi = {
  list: () => apiClient.get<Deck[]>("/decks"),
  get: (id: string) => apiClient.get<Deck>(`/decks/${id}`),
  create: (data: { name: string; documentId?: string }) =>
    apiClient.post<Deck>("/decks", data),
  delete: (id: string) => apiClient.delete<void>(`/decks/${id}`),
  getCards: (deckId: string) =>
    apiClient.get<Flashcard[]>(`/decks/${deckId}/cards`),
};

export const cardsApi = {
  list: () => apiClient.get<Flashcard[]>("/cards"),
  get: (id: string) => apiClient.get<Flashcard>(`/cards/${id}`),
  create: (data: { deckId: string; front: string; back: string }) =>
    apiClient.post<Flashcard>("/cards", data),
  update: (id: string, data: Partial<Flashcard>) =>
    apiClient.patch<Flashcard>(`/cards/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/cards/${id}`),
  review: (id: string, quality: number) =>
    apiClient.post<Flashcard>(`/cards/${id}/review`, { quality }),
};
