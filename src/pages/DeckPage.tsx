import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, AlertCircle, GraduationCap } from "lucide-react";
import { FlashcardEditor } from "@/components/FlashcardEditor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Deck, Flashcard } from "@/types";

export function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "editor">("grid");

  // Fetch deck and cards on mount
  useEffect(() => {
    if (!id) return;

    const fetchDeckData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch deck info
        const deckResponse = await fetch(`/api/decks/${id}`);
        if (!deckResponse.ok) {
          if (deckResponse.status === 404) {
            setError("Deck not found");
          } else {
            throw new Error("Failed to fetch deck");
          }
          return;
        }

        const deckData = await deckResponse.json();

        // Transform snake_case to camelCase
        const transformedDeck: Deck = {
          id: deckData.id,
          documentId: deckData.document_id,
          title: deckData.title,
          cardCount: deckData.card_count,
          dueCount: deckData.due_count,
          createdAt: deckData.created_at,
          tags: deckData.tags || [],
        };

        setDeck(transformedDeck);

        // Fetch cards
        const cardsResponse = await fetch(`/api/decks/${id}/cards`);
        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch cards");
        }

        const cardsData = await cardsResponse.json();

        // Transform snake_case to camelCase
        const transformedCards: Flashcard[] = cardsData.map((card: any) => ({
          id: card.id,
          deckId: card.deck_id,
          type: card.type,
          front: card.front,
          back: card.back,
          citations: card.citations || [],
          tags: card.tags || [],
          ease: card.ease,
          interval: card.interval,
          repetition: card.repetition,
          dueDate: card.due_date,
          lastReviewedAt: card.last_reviewed_at,
        }));

        setCards(transformedCards);
      } catch (err) {
        console.error("Failed to fetch deck data:", err);
        setError("Failed to load deck. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDeckData();
  }, [id]);

  const handleUpdateCard = (cardId: string, updates: Partial<Flashcard>) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card)),
    );
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      // Remove card from local state
      setCards((prev) => prev.filter((card) => card.id !== cardId));

      // Update deck counts
      if (deck) {
        setDeck({
          ...deck,
          cardCount: deck.cardCount - 1,
        });
      }
    } catch (err) {
      console.error("Failed to delete card:", err);
      alert("Failed to delete card. Please try again.");
    }
  };

  const handleExport = () => {
    // TODO: Implement export
    if (deck) {
      console.log("Export deck:", deck.id);
    }
  };

  const handleStartStudy = () => {
    if (deck) {
      navigate(`/study/${deck.id}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading deck...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/decks")}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to All Decks
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error === "Deck not found"
                ? "Deck Not Found"
                : "Error Loading Deck"}
            </CardTitle>
            <CardDescription>
              {error || "An unexpected error occurred"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/")}>Go to Home</Button>
              {error !== "Deck not found" && (
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}>
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() =>
            deck.documentId
              ? navigate(`/documents/${deck.documentId}`)
              : navigate("/")
          }
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {deck.documentId ? "Back to Document" : "Back to Home"}
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{deck.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                This deck has no flashcards yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() =>
            deck.documentId
              ? navigate(`/documents/${deck.documentId}`)
              : navigate("/decks")
          }
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {deck.documentId ? "Back to Document" : "Back to All Decks"}
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {deck.title}
            </h1>
            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>{deck.cardCount} cards</span>
              <span>{deck.dueCount} due for review</span>
              <span>
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleStartStudy}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Start Study
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>All Flashcards</CardTitle>
          <CardDescription>
            {cards.length} card{cards.length !== 1 ? "s" : ""} in this deck
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* View Mode Tabs */}
          <div className="mb-4 flex gap-2 border-b">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === "grid"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              Grid View
            </button>
            <button
              onClick={() => setViewMode("editor")}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === "editor"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              Editor View
            </button>
          </div>

          {/* Cards Display - Grid or Editor Mode */}
          {cards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cards in this deck.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[600px] overflow-y-auto">
              {cards.map((card) => (
                <div key={card.id} className="border rounded-lg">
                  <div className="p-3 border-b flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex-1">
                      {card.type.toUpperCase()}
                    </span>
                    {card.tags.length > 0 && (
                      <div className="flex gap-1">
                        {card.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-muted rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 min-h-[160px] flex flex-col gap-3">
                    <div>
                      <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
                        Q
                      </div>
                      <p className="text-sm font-medium">{card.front}</p>
                    </div>
                    <div className="border-t pt-3">
                      <div className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded mb-2">
                        A
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {card.back}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {cards.map((card) => (
                <FlashcardEditor
                  key={card.id}
                  card={card}
                  onSave={(updates) => handleUpdateCard(card.id, updates)}
                  onDelete={() => handleDeleteCard(card.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
