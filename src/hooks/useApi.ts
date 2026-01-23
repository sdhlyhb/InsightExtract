import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi, decksApi, cardsApi } from "@/api/endpoints";
import type { Document, Outline, Deck, Flashcard } from "@/types";

// Document hooks
export function useDocument(id: string) {
  return useQuery<Document>({
    queryKey: ["documents", id],
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useDocumentOutline(id: string) {
  return useQuery<Outline>({
    queryKey: ["documents", id, "outline"],
    queryFn: () => documentsApi.getOutline(id),
    enabled: !!id,
  });
}

export function useDocumentDecks(id: string) {
  return useQuery<Deck[]>({
    queryKey: ["documents", id, "decks"],
    queryFn: () => documentsApi.getDecks(id),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

// Deck hooks
export function useDeck(id: string) {
  return useQuery<Deck>({
    queryKey: ["decks", id],
    queryFn: () => decksApi.get(id),
    enabled: !!id,
  });
}

export function useDeckCards(deckId: string) {
  return useQuery<Flashcard[]>({
    queryKey: ["decks", deckId, "cards"],
    queryFn: () => decksApi.getCards(deckId),
    enabled: !!deckId,
  });
}

// Card hooks
export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Flashcard> }) =>
      cardsApi.update(id, data),
    onSuccess: (updatedCard) => {
      void queryClient.invalidateQueries({
        queryKey: ["decks", updatedCard.deckId, "cards"],
      });
    },
  });
}

export function useReviewCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quality }: { id: string; quality: number }) =>
      cardsApi.review(id, quality),
    onSuccess: (updatedCard) => {
      void queryClient.invalidateQueries({
        queryKey: ["decks", updatedCard.deckId, "cards"],
      });
    },
  });
}
