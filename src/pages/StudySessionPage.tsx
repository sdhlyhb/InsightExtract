import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, AlertCircle } from "lucide-react";
import { SrsControls } from "@/components/SrsControls";
import { CitationPopover } from "@/components/CitationPopover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as Progress from "@radix-ui/react-progress";
import type { Flashcard, Deck } from "@/types";

export function StudySessionPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch deck and cards on mount
  useEffect(() => {
    if (!deckId) return;

    const fetchStudyData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch deck info
        const deckResponse = await fetch(`/api/decks/${deckId}`);
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
        const cardsResponse = await fetch(`/api/decks/${deckId}/cards`);
        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch cards");
        }

        const cardsData = await cardsResponse.json();

        // Transform snake_case to camelCase
        let transformedCards: Flashcard[] = cardsData.map((card: any) => ({
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

        // Check if specific cards were selected in sessionStorage
        const studyCardsJson = sessionStorage.getItem("studyCards");
        if (studyCardsJson) {
          try {
            const selectedCardIds = JSON.parse(studyCardsJson) as string[];
            transformedCards = transformedCards.filter((card) =>
              selectedCardIds.includes(card.id),
            );
            // Clear after use
            sessionStorage.removeItem("studyCards");
          } catch (err) {
            console.error("Failed to parse study cards:", err);
          }
        }

        // Shuffle cards for randomized study
        const shuffled = [...transformedCards].sort(() => Math.random() - 0.5);
        setDueCards(shuffled);
      } catch (err) {
        console.error("Failed to fetch study data:", err);
        setError("Failed to load study session. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudyData();
  }, [deckId]);

  const currentCard = dueCards[currentCardIndex];
  const totalCards = dueCards.length;
  const progress = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0;
  const hasMoreCards = currentCardIndex < totalCards - 1;

  useEffect(() => {
    // Reset answer visibility when card changes
    setShowAnswer(false);
  }, [currentCardIndex]);

  const handleRate = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return;

    setIsSubmitting(true);
    try {
      // Submit review to API
      const response = await fetch(`/api/cards/${currentCard.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quality }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setReviewedCount((prev) => prev + 1);

      if (hasMoreCards) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // Session complete
        navigate(`/decks/${deckId}`);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
      // Continue anyway - don't block user
      setReviewedCount((prev) => prev + 1);
      if (hasMoreCards) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        navigate(`/decks/${deckId}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleRestart = () => {
    setCurrentCardIndex(0);
    setReviewedCount(0);
    setShowAnswer(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading study session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
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
                : "Error Loading Study Session"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "An unexpected error occurred"}
            </p>
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

  // No cards to study
  if (dueCards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(`/decks/${deckId}`)}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Deck
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-4">No Cards to Study</h2>
            <p className="text-muted-foreground mb-6">
              This deck doesn't have any cards to study right now.
            </p>
            <Button onClick={() => navigate(`/decks/${deckId}`)}>
              Back to Deck
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Session Complete! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You've reviewed all {totalCards} cards.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Session
              </Button>
              <Button onClick={() => navigate(`/decks/${deckId}`)}>
                Back to Deck
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/decks/${deckId}`)}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Study Session
        </Button>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{deck.title}</span>
            <span>
              {reviewedCount} / {totalCards} reviewed
            </span>
          </div>
          <Progress.Root
            className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
            value={progress}>
            <Progress.Indicator
              className="h-full bg-primary transition-all"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                {currentCard.type.toUpperCase()} - Card {currentCardIndex + 1}{" "}
                of {totalCards}
              </CardTitle>
              <div className="flex gap-2">
                {currentCard.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="min-h-[120px] flex items-center justify-center">
              <p className="text-xl text-center">{currentCard.front}</p>
            </div>

            {showAnswer && (
              <>
                <div className="border-t pt-6">
                  <p className="text-lg text-center text-muted-foreground">
                    {currentCard.back}
                  </p>
                </div>

                {currentCard.citations.length > 0 && (
                  <div className="border-t pt-4">
                    <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                      Citations
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentCard.citations.map((citation) => (
                        <CitationPopover key={citation.id} citation={citation}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs">
                            Page {citation.page}
                          </Button>
                        </CitationPopover>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {!showAnswer ? (
          <Button size="lg" className="w-full" onClick={handleShowAnswer}>
            Show Answer
          </Button>
        ) : (
          <SrsControls onRate={handleRate} isLoading={isSubmitting} />
        )}
      </div>
    </div>
  );
}
