import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { SrsControls } from "@/components/SrsControls";
import { CitationPopover } from "@/components/CitationPopover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as Progress from "@radix-ui/react-progress";
import type { Flashcard, Deck } from "@/types";

// Mock data
const mockDeck: Deck = {
  id: "deck-123",
  documentId: "doc-123",
  title: "Sample Research Paper - Flashcards",
  cardCount: 12,
  dueCount: 5,
  createdAt: new Date().toISOString(),
  tags: ["Introduction", "Methods", "Results"],
};

const mockDueCards: Flashcard[] = [
  {
    id: "card-1",
    deckId: "deck-123",
    type: "qa",
    front: "What is backpropagation?",
    back: "Backpropagation is an algorithm used to train neural networks by calculating gradients of the loss function with respect to the weights.",
    citations: [
      {
        id: "cit-1",
        page: 5,
        quote:
          "Backpropagation calculates gradients efficiently through the chain rule.",
        context: "Section 2.1",
      },
    ],
    tags: ["Methods"],
    ease: 2.5,
    interval: 0,
    repetition: 0,
    dueDate: new Date().toISOString(),
  },
];

export function StudySessionPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck] = useState<Deck>(mockDeck);
  const [dueCards, setDueCards] = useState<Flashcard[]>(mockDueCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCard = dueCards[currentCardIndex];
  const totalCards = dueCards.length;
  const progress = (reviewedCount / totalCards) * 100;
  const hasMoreCards = currentCardIndex < totalCards - 1;

  useEffect(() => {
    // Reset answer visibility when card changes
    setShowAnswer(false);
  }, [currentCardIndex]);

  const handleRate = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    if (!currentCard) return;

    setIsSubmitting(true);
    try {
      // TODO: Submit review to API
      console.log("Review:", { cardId: currentCard.id, quality });

      setReviewedCount((prev) => prev + 1);

      if (hasMoreCards) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // Session complete
        navigate(`/decks/${deckId}`);
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
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
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
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
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            Page {citation.page}
                          </span>
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
