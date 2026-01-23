import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Download, Filter } from "lucide-react";
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

const mockCards: Flashcard[] = [
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
  {
    id: "card-2",
    deckId: "deck-123",
    type: "cloze",
    front: "The learning rate determines [...] in gradient descent.",
    back: "the step size",
    citations: [
      {
        id: "cit-2",
        page: 8,
        quote:
          "The learning rate is a hyperparameter that controls the step size.",
      },
    ],
    tags: ["Methods"],
    ease: 2.5,
    interval: 0,
    repetition: 0,
    dueDate: new Date().toISOString(),
  },
];

export function DeckPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deck] = useState<Deck>(mockDeck);
  const [cards, setCards] = useState<Flashcard[]>(mockCards);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredCards = selectedTag
    ? cards.filter((card) => card.tags.includes(selectedTag))
    : cards;

  const handleUpdateCard = (cardId: string, updates: Partial<Flashcard>) => {
    setCards((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, ...updates } : card)),
    );
  };

  const handleStartStudy = () => {
    navigate(`/study/${deck.id}`);
  };

  const handleExport = () => {
    // TODO: Implement export
    console.log("Export deck:", deck.id);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/documents/${deck.documentId}`)}
          className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Document
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{deck.title}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{deck.cardCount} cards</span>
              <span>{deck.dueCount} due for review</span>
              <span>
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleStartStudy} disabled={deck.dueCount === 0}>
              <Play className="h-4 w-4 mr-2" />
              Study ({deck.dueCount})
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter by Tag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant={selectedTag === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTag(null)}>
                  All Cards ({cards.length})
                </Button>
                {deck.tags.map((tag) => {
                  const count = cards.filter((c) =>
                    c.tags.includes(tag),
                  ).length;
                  return (
                    <Button
                      key={tag}
                      variant={selectedTag === tag ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedTag(tag)}>
                      {tag} ({count})
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total Cards</dt>
                  <dd className="font-medium">{deck.cardCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Due Today</dt>
                  <dd className="font-medium text-primary">{deck.dueCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Mastered</dt>
                  <dd className="font-medium">
                    {cards.filter((c) => c.interval > 21).length}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Flashcards</CardTitle>
              <CardDescription>
                {selectedTag
                  ? `Showing ${filteredCards.length} cards tagged with "${selectedTag}"`
                  : `Showing all ${filteredCards.length} cards`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCards.map((card) => (
                  <FlashcardEditor
                    key={card.id}
                    card={card}
                    onSave={(updates) => handleUpdateCard(card.id, updates)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
