import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, AlertCircle } from "lucide-react";
import { OutlineTree } from "@/components/OutlineTree";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as Tabs from "@radix-ui/react-tabs";
import type { Document, Outline } from "@/types";

interface FlashCard {
  front: string;
  back: string;
}

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [outline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isCreatingFlashcards, setIsCreatingFlashcards] = useState(false);

  // Fetch document on mount
  useEffect(() => {
    if (!id) return;

    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/documents/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Document not found");
          } else {
            throw new Error("Failed to fetch document");
          }
          return;
        }

        const doc = await response.json();

        // Transform snake_case API response to camelCase
        const transformedDoc: Document = {
          id: doc.id,
          title: doc.title,
          sourceType: doc.source_type,
          kind: doc.kind,
          status: doc.status,
          createdAt: doc.created_at,
          updatedAt: doc.updated_at,
          fileSize: doc.file_size,
          pageCount: doc.page_count,
          mimeType: doc.mime_type,
          content: doc.content,
          sourceFileName: doc.source_file_name,
          cardCount: doc.card_count,
          meta: doc.meta,
        };

        setDocument(transformedDoc);

        // If it's a CSV flashcards document, parse the content
        if (
          transformedDoc.kind === "flashcards-csv" &&
          transformedDoc.content
        ) {
          const parsedCards = parseCSVContent(transformedDoc.content);
          setCards(parsedCards);
        }
      } catch (err) {
        console.error("Failed to fetch document:", err);
        setError("Failed to load document. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const parseCSVContent = (csvContent: string): FlashCard[] => {
    try {
      const lines = csvContent.split("\n");
      const dataLines = lines.slice(1); // Skip header

      return dataLines
        .filter((line) => line.trim())
        .map((line) => {
          // Handle CSV parsing with proper comma handling
          const match = line.match(/^"?([^"]*)"?,\s*"?([^"]*)"?$/);
          if (match && match[1] && match[2]) {
            return {
              front: match[1].trim(),
              back: match[2].trim(),
            };
          }
          // Fallback to simple split
          const [front, back] = line.split(",");
          return {
            front: front?.trim() || "",
            back: back?.trim() || "",
          };
        })
        .filter((card) => card.front && card.back);
    } catch (err) {
      console.error("Failed to parse CSV:", err);
      return [];
    }
  };

  const handleCreateFlashcards = async () => {
    if (!document || !cards.length) return;

    try {
      setIsCreatingFlashcards(true);

      // Create deck name from filename (remove .csv and flashcards suffix, kebab-case)
      const deckName = document.title
        .replace(/\.csv$/i, "")
        .replace(/-flashcards(-\d{8}-\d{6}-[a-f0-9]+)?$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Store in sessionStorage for flashcard creation page
      sessionStorage.setItem("pendingFlashcards", JSON.stringify(cards));
      sessionStorage.setItem("flashcardSource", deckName);
      sessionStorage.setItem("sourceDocumentId", document.id);

      // Navigate to flashcard creation page
      navigate("/flashcards/create");
    } catch (err) {
      console.error("Failed to prepare flashcards:", err);
      alert("Failed to prepare flashcards. Please try again.");
    } finally {
      setIsCreatingFlashcards(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const isCSVDocument = document?.kind === "flashcards-csv";
  const isProcessing = document?.status === "processing";
  const hasOutline = outline !== null;

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {error === "Document not found"
                ? "Document Not Found"
                : "Error Loading Document"}
            </CardTitle>
            <CardDescription>
              {error || "An unexpected error occurred"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/")}>Go to Home</Button>
              {error !== "Document not found" && (
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

  // CSV Flashcards Document View
  if (isCSVDocument) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleCancel} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <FileText className="h-8 w-8" />
                Flashcards CSV — {document.title}
              </h1>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{document.cardCount || cards.length} cards</span>
                <span>
                  Created {new Date(document.createdAt).toLocaleDateString()}
                </span>
                {document.sourceFileName && (
                  <span>Source: {document.sourceFileName}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flashcard Content</CardTitle>
              <CardDescription>
                Review the flashcards below, then click "Create Flashcards" to
                add them to your study deck
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cards.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold w-12">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold w-1/2">
                            Front
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold w-1/2">
                            Back
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cards.map((card, idx) => (
                          <tr
                            key={idx}
                            className="border-t hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3 text-sm">{card.front}</td>
                            <td className="px-4 py-3 text-sm">{card.back}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No flashcards found in this CSV</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCreatingFlashcards}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFlashcards}
                  disabled={cards.length === 0 || isCreatingFlashcards}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isCreatingFlashcards ? "Creating..." : "Create Flashcards"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular Document View (PDF/DOCX)
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="h-8 w-8" />
              {document.title}
            </h1>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {document.pageCount && <span>{document.pageCount} pages</span>}
              {document.fileSize && (
                <span>{(document.fileSize / 1024 / 1024).toFixed(2)} MB</span>
              )}
              <span>
                Uploaded {new Date(document.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {hasOutline && !isProcessing && (
            <Button onClick={() => navigate(`/documents/${id}/decks`)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Flashcards
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Tabs.Root defaultValue="outline" className="w-full">
            <Tabs.List className="flex border-b">
              <Tabs.Trigger
                value="outline"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
                Outline
              </Tabs.Trigger>
              <Tabs.Trigger
                value="main-points"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
                Main Points
              </Tabs.Trigger>
              <Tabs.Trigger
                value="citations"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
                Citations
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="outline" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Outline</CardTitle>
                  <CardDescription>
                    Hierarchical structure of the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasOutline ? (
                    <OutlineTree outline={outline?.outline || []} />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Outline will appear once processing is complete
                    </div>
                  )}
                </CardContent>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="main-points" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Key Takeaways</CardTitle>
                  <CardDescription>
                    Main points extracted from the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasOutline ? (
                    <ul className="space-y-3">
                      {outline?.mainPoints.map((point, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="font-semibold text-primary mt-0.5">
                            {idx + 1}.
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Main points will appear once processing is complete
                    </div>
                  )}
                </CardContent>
              </Card>
            </Tabs.Content>

            <Tabs.Content value="citations" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Citations</CardTitle>
                  <CardDescription>
                    Referenced passages from the document
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    Citations will appear once processing is complete
                  </div>
                </CardContent>
              </Card>
            </Tabs.Content>
          </Tabs.Root>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                PDF preview coming soon
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
