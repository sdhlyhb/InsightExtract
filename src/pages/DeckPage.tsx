import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Download,
  AlertCircle,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
    new Set(),
  );
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
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

  // Filter cards by tag and search query
  const filteredCards = cards.filter((card) => {
    const matchesTag = selectedTag ? card.tags.includes(selectedTag) : true;
    const matchesSearch =
      !searchQuery ||
      card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.back.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  // Get unique cards (dedupe by front+back)
  const uniqueCards = Array.from(
    new Map(
      filteredCards.map((card) => [`${card.front}||${card.back}`, card]),
    ).values(),
  );

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

      // Remove from selected cards if it was selected
      setSelectedCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });

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

  const handleStartStudy = () => {
    if (deck) {
      console.log("=== Study Session Start ===");
      console.log("Selected card IDs:", Array.from(selectedCardIds));
      console.log("All unique cards count:", uniqueCards.length);

      // Use selected cards or all cards
      const cardsToStudy =
        selectedCardIds.size > 0
          ? cards.filter((card) => selectedCardIds.has(card.id))
          : cards;

      console.log("Cards to study count:", cardsToStudy.length);
      console.log(
        "Cards to study IDs:",
        cardsToStudy.map((c) => c.id),
      );

      if (cardsToStudy.length === 0) {
        alert("No cards to study. Please select at least one card.");
        return;
      }

      // Store cards in sessionStorage for study mode
      const cardIds = cardsToStudy.map((c) => c.id);
      console.log("Storing cards for study:", cardIds);
      sessionStorage.setItem("studyCards", JSON.stringify(cardIds));

      // Verify storage
      const stored = sessionStorage.getItem("studyCards");
      console.log("Verified stored cards:", stored);
      console.log("=== Navigating to study page ===");

      navigate(`/study/${deck.id}`);
    }
  };

  const handleExport = () => {
    // TODO: Implement export
    if (deck) {
      console.log("Export deck:", deck.id);
    }
  };

  const handleToggleCardSelection = (cardId: string) => {
    setSelectedCardIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedCardIds(new Set(uniqueCards.map((card) => card.id)));
  };

  const handleDeselectAll = () => {
    setSelectedCardIds(new Set());
  };

  const handleFlipCard = (cardId: string) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
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
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
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
              : navigate("/")
          }
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {deck.documentId ? "Back to Document" : "Back to Home"}
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
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleStartStudy}
              disabled={uniqueCards.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              Study
              {selectedCardIds.size > 0
                ? ` (${selectedCardIds.size})`
                : ` (${uniqueCards.length})`}
            </Button>
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Flashcards</CardTitle>
              <CardDescription>
                {selectedCardIds.size > 0
                  ? `${selectedCardIds.size} card${selectedCardIds.size !== 1 ? "s" : ""} selected`
                  : "Select cards to study"}
              </CardDescription>
            </div>
          </div>
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

          {/* Search and Filter Controls */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search flashcards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {viewMode === "grid" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={uniqueCards.length === 0}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedCardIds.size === 0}>
                    <Square className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                </>
              )}
              {deck.tags.length > 0 && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Filter:</span>
                  <Button
                    variant={selectedTag === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(null)}>
                    All
                  </Button>
                  {deck.tags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTag(tag)}>
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cards Display - Grid or Editor Mode */}
          {uniqueCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cards match your search criteria.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 max-h-[600px] overflow-y-auto">
              {uniqueCards.map((card) => {
                const isFlipped = flippedCards.has(card.id);
                const isSelected = selectedCardIds.has(card.id);

                return (
                  <div
                    key={card.id}
                    className={`border rounded-lg transition-all ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}>
                    {/* Selection Checkbox */}
                    <div className="p-3 border-b flex items-center gap-2">
                      <button
                        onClick={() => handleToggleCardSelection(card.id)}
                        className="flex items-center gap-2 hover:opacity-70">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                      <span className="text-xs text-muted-foreground flex-1">
                        {card.type.toUpperCase()}
                      </span>
                      {card.tags.length > 0 && (
                        <div className="flex gap-1">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 bg-muted rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div
                      className="p-4 cursor-pointer min-h-[120px] flex flex-col"
                      onClick={() => handleFlipCard(card.id)}>
                      {!isFlipped ? (
                        <div className="flex-1">
                          <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
                            Q:
                          </div>
                          <p className="text-lg font-bold">{card.front}</p>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded mb-2">
                            A:
                          </div>
                          <p className="text-base">{card.back}</p>
                        </div>
                      )}
                      <div className="text-center mt-4">
                        <span className="text-xs text-muted-foreground">
                          Click to flip
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {uniqueCards.map((card) => (
                <FlashcardEditor
                  key={card.id}
                  card={card}
                  onSave={(updates) => handleUpdateCard(card.id, updates)}
                  onDelete={() => handleDeleteCard(card.id)}
                />
              ))}
            </div>
          )}

          {/* Study Selected Button */}
          {selectedCardIds.size > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleStartStudy}>
                <Play className="h-4 w-4 mr-2" />
                Study Selected ({selectedCardIds.size})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
