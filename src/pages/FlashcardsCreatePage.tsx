import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FlashCard {
  front: string;
  back: string;
}

export function FlashcardsCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [deckName, setDeckName] = useState("");
  const [sourceDocumentId, setSourceDocumentId] = useState<string | null>(null);
  const [createdDeckId, setCreatedDeckId] = useState<string | null>(null);

  useEffect(() => {
    // Load data from sessionStorage
    try {
      const pendingCards = sessionStorage.getItem("pendingFlashcards");
      const source = sessionStorage.getItem("flashcardSource");
      const docId = sessionStorage.getItem("sourceDocumentId");

      if (!pendingCards) {
        setError("No flashcards found. Please go back and try again.");
        setLoading(false);
        return;
      }

      const parsedCards = JSON.parse(pendingCards);
      setCards(parsedCards);
      setDeckName(source || "Untitled Deck");
      setSourceDocumentId(docId);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
      setError("Failed to load flashcard data. Please try again.");
      setLoading(false);
    }
  }, []);

  const handleCreateFlashcards = async () => {
    if (!cards.length) return;

    try {
      setCreating(true);
      setError(null);

      // Create deck with cards
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: deckName,
          documentId: sourceDocumentId,
          cards: cards.map((card) => ({
            front: card.front,
            back: card.back,
            type: "qa",
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create flashcards");
      }

      const result = await response.json();
      setCreatedDeckId(result.id);
      setSuccess(true);

      // Clear sessionStorage
      sessionStorage.removeItem("pendingFlashcards");
      sessionStorage.removeItem("flashcardSource");
      sessionStorage.removeItem("sourceDocumentId");

      // Navigate after a short delay
      setTimeout(() => {
        navigate(`/decks/${result.id}`);
      }, 2000);
    } catch (err) {
      console.error("Failed to create flashcards:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create flashcards",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    // Clear sessionStorage
    sessionStorage.removeItem("pendingFlashcards");
    sessionStorage.removeItem("flashcardSource");
    sessionStorage.removeItem("sourceDocumentId");
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !cards.length) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Flashcards
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Flashcards Created Successfully!
            </CardTitle>
            <CardDescription>
              Created {cards.length} flashcard{cards.length !== 1 ? "s" : ""} in
              deck "{deckName}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Redirecting to your new deck...
            </p>
            {createdDeckId && (
              <Button onClick={() => navigate(`/decks/${createdDeckId}`)}>
                View Deck Now
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create Flashcard Deck</h1>
        <p className="text-muted-foreground">
          Review and confirm creating {cards.length} flashcard
          {cards.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Deck Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Deck Name
                </label>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter deck name"
                />
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{cards.length} cards</span>
                {sourceDocumentId && <span>From CSV document</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flashcard Preview</CardTitle>
            <CardDescription>First 10 cards from your deck</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cards.slice(0, 10).map((card, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        FRONT
                      </div>
                      <div className="text-sm">{card.front}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-muted-foreground mb-1">
                        BACK
                      </div>
                      <div className="text-sm">{card.back}</div>
                    </div>
                  </div>
                </div>
              ))}
              {cards.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {cards.length - 10} more card
                  {cards.length - 10 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={creating}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateFlashcards}
                disabled={creating || !deckName.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                {creating ? "Creating..." : "Create Flashcards"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
