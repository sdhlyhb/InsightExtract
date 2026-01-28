import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Deck } from "@/types";

export function DecksListPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/decks");
        if (!response.ok) {
          throw new Error("Failed to fetch decks");
        }

        const data = await response.json();

        // Transform snake_case to camelCase
        const transformedDecks: Deck[] = data.map((deck: any) => ({
          id: deck.id,
          documentId: deck.document_id,
          title: deck.title,
          cardCount: deck.card_count,
          dueCount: deck.due_count,
          createdAt: deck.created_at,
          tags: deck.tags || [],
        }));

        setDecks(transformedDecks);
      } catch (err) {
        console.error("Failed to fetch decks:", err);
        setError("Failed to load flashcard decks. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
              Error Loading Decks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/")}>Go to Home</Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      <div className="mb-6 sm:mb-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Flashcards</h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Manage and study your flashcard decks
        </p>
      </div>

      {decks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl sm:text-2xl font-bold mb-4">
              No Flashcard Decks Yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first flashcard deck by uploading and analyzing a
              document on the home page.
            </p>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/decks/${deck.id}`)}>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl line-clamp-2">
                  {deck.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Cards</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {deck.cardCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Today</p>
                    <p className="text-xl sm:text-2xl font-bold text-primary">
                      {deck.dueCount}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    Created {new Date(deck.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {deck.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {deck.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-muted rounded">
                        {tag}
                      </span>
                    ))}
                    {deck.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        +{deck.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
