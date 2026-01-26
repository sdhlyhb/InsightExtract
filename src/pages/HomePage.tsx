import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  Upload,
  Sparkles,
  Copy,
  AlertCircle,
  CheckCircle,
  Download,
  X,
  CreditCard,
  BookOpen,
  Zap,
  Brain,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Document } from "@/types";
import {
  buildFlashcardsCSV,
  type Step2Result,
} from "@/lib/flashcards/csvFromStep2";
import { makeFlashcardCsvName } from "@/lib/flashcards/name";

interface ParsedTextData {
  filename: string;
  file_size: number;
  page_count?: number;
  paragraph_count?: number;
  text: string;
  char_count: number;
}

interface AnalysisResult {
  outline?: {
    title: string;
    sections: Array<{
      level: number;
      title: string;
      children?: any[];
    }>;
  };
  main_points?: Array<{
    point: string;
    explanation?: string;
  }>;
  key_terms?: Array<{
    term: string;
    definition: string;
  }>;
}

interface FlashCard {
  front: string;
  back: string;
}

interface Step3State {
  name: string;
  cards: FlashCard[];
  csv: string;
  isReady: boolean;
  isSaved: boolean;
  isSaving: boolean;
  error: string | null;
  documentId?: string;
}

interface CSVDocument {
  id: string;
  title: string;
  kind: string;
  mimeType: string;
  size: number;
  cardCount: number;
  content: string;
  createdAt: string;
}

interface CSVModalState {
  isOpen: boolean;
  document: CSVDocument | null;
}

export function HomePage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTextData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Step 3 state
  const [step3State, setStep3State] = useState<Step3State>({
    name: "",
    cards: [],
    csv: "",
    isReady: false,
    isSaved: false,
    isSaving: false,
    error: null,
  });

  // Recent documents and modal
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [csvModal, setCSVModal] = useState<CSVModalState>({
    isOpen: false,
    document: null,
  });
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Load recent documents on mount
  useEffect(() => {
    loadRecentDocuments();
  }, []);

  const loadRecentDocuments = async () => {
    setIsLoadingRecent(true);
    try {
      const response = await fetch("/api/documents/recent?limit=10");
      if (response.ok) {
        const docs = await response.json();
        setRecentDocuments(docs);
      }
    } catch (error) {
      console.error("Failed to load recent documents:", error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  // Generate flashcards when Step 2 completes
  useEffect(() => {
    if (analysisResult && !step3State.isReady && selectedFile && parsedData) {
      try {
        // Build Step2Result
        const step2Result: Step2Result = {
          main_points: analysisResult.main_points,
          key_terms: analysisResult.key_terms,
          outline: analysisResult.outline,
          sourceFile: {
            originalName: selectedFile.name,
          },
        };

        // Generate CSV
        const { cards, csv } = buildFlashcardsCSV(step2Result);

        // Generate unique filename
        const csvName = makeFlashcardCsvName(
          selectedFile.name,
          JSON.stringify(step2Result),
        );

        setStep3State({
          name: csvName,
          cards,
          csv,
          isReady: true,
          isSaved: false,
          isSaving: false,
          error: null,
        });
      } catch (error) {
        setStep3State((prev) => ({
          ...prev,
          error: "Couldn't generate CSV. Please retry or return to Step 2.",
        }));
      }
    }
  }, [analysisResult, step3State.isReady, selectedFile, parsedData]);

  // Reset Step 3 when Step 1 or Step 2 inputs change
  useEffect(() => {
    if (!analysisResult) {
      setStep3State({
        name: "",
        cards: [],
        csv: "",
        isReady: false,
        isSaved: false,
        isSaving: false,
        error: null,
      });
    }
  }, [analysisResult]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const filename = file.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      setParseError(
        "Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).",
      );
      setSelectedFile(null);
      setParsedText(null);
      setParsedData(null);
      setAnalysisResult(null);
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setParsedText(null);
    setParsedData(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setStep3State({
      name: "",
      cards: [],
      csv: "",
      isReady: false,
      isSaved: false,
      isSaving: false,
      error: null,
    });
  };

  const handleParse = async () => {
    if (!selectedFile) return;

    setIsParsing(true);
    setParseError(null);
    setParsedText(null);
    setParsedData(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`/api/documents/extract-text`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || "Failed to extract text");
      }

      const data: ParsedTextData = await response.json();

      // Check if text is empty or whitespace only
      if (!data.text || data.text.trim().length === 0) {
        setParseError(
          "No text detected. If this is a scanned PDF, ensure it has selectable text or use an OCR-enabled PDF. Acceptable formats: PDF (.pdf) with embedded text, Word (.docx).",
        );
        return;
      }

      setParsedData(data);
      setParsedText(data.text);
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : "Failed to parse document",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!parsedText) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch(`/api/documents/analyze-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: parsedText.substring(0, 60000), // Limit to ~15k tokens
          max_points: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || "Failed to analyze text");
      }

      const data: AnalysisResult = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Failed to generate summary",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyText = () => {
    if (parsedText) {
      navigator.clipboard.writeText(parsedText);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  // Step 3 handlers
  const handleSaveCSV = async () => {
    if (!step3State.csv || !step3State.name) return;

    setStep3State((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const step2Digest = analysisResult
        ? makeFlashcardCsvName("", JSON.stringify(analysisResult))
            .split("-")
            .pop()
            ?.replace(".csv", "")
        : undefined;

      const response = await fetch("/api/documents/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: step3State.name,
          mimeType: "text/csv",
          size: step3State.csv.length,
          content: step3State.csv,
          sourceFileName: selectedFile?.name,
          meta: {
            cardCount: step3State.cards.length,
            step2Digest,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Unknown error" }));
        throw new Error(
          errorData.detail || "We couldn't save the CSV. Please retry.",
        );
      }

      const result = await response.json();

      setStep3State((prev) => ({
        ...prev,
        isSaved: true,
        isSaving: false,
        documentId: result.id,
      }));

      // Reload recent documents
      await loadRecentDocuments();

      // Show success toast (you can replace this with your toast component)
      alert(`Saved as ${step3State.name}`);
    } catch (error) {
      setStep3State((prev) => ({
        ...prev,
        isSaving: false,
        error:
          error instanceof Error
            ? error.message
            : "We couldn't save the CSV. Please retry.",
      }));
    }
  };

  const handleDownloadCSV = () => {
    if (!step3State.csv || !step3State.name) return;

    const blob = new Blob([step3State.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = step3State.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCSV = async () => {
    if (!step3State.csv) return;

    try {
      await navigator.clipboard.writeText(step3State.csv);
      alert("CSV copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy CSV:", error);
    }
  };

  const handleMakeFlashcards = async () => {
    // Save first if not saved
    if (!step3State.isSaved) {
      await handleSaveCSV();
    }

    // Navigate to flashcard creation (placeholder - adjust to your routing)
    if (step3State.documentId) {
      // Parse CSV and navigate to flashcard component
      const cards = step3State.cards.map((card) => ({
        front: card.front,
        back: card.back,
      }));

      // Store in sessionStorage for flashcard creation page
      sessionStorage.setItem("pendingFlashcards", JSON.stringify(cards));
      sessionStorage.setItem("flashcardSource", step3State.name);

      // Navigate to flashcards page (adjust route as needed)
      navigate("/flashcards/create");
    }
  };

  const handleCancelFlashcards = () => {
    if (confirm("Flashcard CSV will be discarded. Continue?")) {
      setStep3State({
        name: "",
        cards: [],
        csv: "",
        isReady: false,
        isSaved: false,
        isSaving: false,
        error: null,
      });
    }
  };

  const handleOpenCSVModal = async (docId: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`);
      if (!response.ok) throw new Error("Failed to load CSV");

      const doc = await response.json();
      setCSVModal({
        isOpen: true,
        document: doc,
      });
    } catch (error) {
      console.error("Failed to open CSV:", error);
      alert("Failed to load CSV document");
    }
  };

  const handleCloseCSVModal = () => {
    setCSVModal({
      isOpen: false,
      document: null,
    });
  };

  const handleProceedToCreateFlashcards = () => {
    if (!csvModal.document) return;

    // Parse CSV content
    const lines = csvModal.document.content.split("\n").slice(1); // Skip header
    const cards = lines
      .filter((line) => line.trim())
      .map((line) => {
        const [front, back] = line.split(",");
        return { front: front?.trim() || "", back: back?.trim() || "" };
      })
      .filter((card) => card.front && card.back);

    // Store in sessionStorage
    sessionStorage.setItem("pendingFlashcards", JSON.stringify(cards));
    sessionStorage.setItem("flashcardSource", csvModal.document.title);

    // Navigate to flashcard creation
    navigate("/flashcards/create");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 max-w-6xl">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            InsightExtract
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Transform PDFs and documents into structured knowledge and
            intelligent flashcards
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("upload-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="w-full sm:w-auto text-base sm:text-lg py-5 sm:py-6 px-6 sm:px-8">
              <Upload className="h-5 w-5 mr-2" />
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/decks")}
              className="w-full sm:w-auto text-base sm:text-lg py-5 sm:py-6 px-6 sm:px-8">
              <BookOpen className="h-5 w-5 mr-2" />
              View My Flashcards
            </Button>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  Easy Upload
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload PDFs or DOCX files and extract text instantly
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  AI Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Generate outlines, key points, and term definitions
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  Smart Flashcards
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create flashcard decks with spaced repetition
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-base sm:text-lg">
                  Track Progress
                </h3>
                <p className="text-sm text-muted-foreground">
                  Study efficiently with SRS algorithm and analytics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div
          id="upload-section"
          className="space-y-6 sm:space-y-8 px-4 sm:px-0">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Upload & Parse */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Step 1: Upload & Parse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload a PDF or Word document to extract the text (no AI
                    processing)
                  </p>

                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-sm font-medium mb-1">
                        Click to select or drag & drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF (.pdf) or Word (.docx) • Max 50MB
                      </p>
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleParse}
                        disabled={isParsing || !!parsedText}
                        className="w-full">
                        {isParsing
                          ? "Parsing..."
                          : parsedText
                            ? "Parsed ✓"
                            : "Parse Document"}
                      </Button>
                    </div>
                  )}

                  {parseError && (
                    <div className="flex gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Parse Error
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {parseError}
                        </p>
                      </div>
                    </div>
                  )}

                  {parsedData && parsedText && (
                    <div className="space-y-3">
                      <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            Text Extracted Successfully!
                          </p>
                          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Characters
                              </p>
                              <p className="font-medium">
                                {parsedData.char_count.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {parsedData.page_count ? "Pages" : "Paragraphs"}
                              </p>
                              <p className="font-medium">
                                {parsedData.page_count ||
                                  parsedData.paragraph_count ||
                                  "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Words</p>
                              <p className="font-medium">
                                {Math.round(
                                  parsedText.split(/\s+/).length,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Text Preview (first 1000 chars)
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyText}
                            className="gap-2">
                            <Copy className="h-3 w-3" />
                            Copy All
                          </Button>
                        </div>
                        <div className="bg-muted rounded-lg p-4 max-h-64 overflow-y-auto">
                          <pre className="text-xs whitespace-pre-wrap font-mono">
                            {parsedText.substring(0, 1000)}
                            {parsedText.length > 1000 &&
                              "\n\n... [Truncated for display]"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Summarize */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Step 2: Get Summary, Main Points & Key Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Generate AI-powered summary and extract key information from
                    the parsed text
                  </p>

                  <Button
                    onClick={handleGenerateSummary}
                    disabled={!parsedText || isAnalyzing}
                    className="w-full">
                    {isAnalyzing ? "Generating Summary..." : "Generate Summary"}
                  </Button>

                  {analysisError && (
                    <div className="flex gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Analysis Error
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {analysisError}
                        </p>
                      </div>
                    </div>
                  )}

                  {analysisResult && (
                    <div className="space-y-6">
                      <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Analysis completed with 1 API call!
                        </p>
                      </div>

                      {/* Main Points */}
                      {analysisResult.main_points &&
                        analysisResult.main_points.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-lg">
                              📌 Main Points
                            </h4>
                            <ul className="space-y-3">
                              {analysisResult.main_points.map(
                                (point, index) => (
                                  <li key={index} className="text-sm">
                                    <p className="font-medium">{point.point}</p>
                                    {point.explanation && (
                                      <p className="text-muted-foreground mt-1">
                                        {point.explanation}
                                      </p>
                                    )}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {/* Key Terms */}
                      {analysisResult.key_terms &&
                        analysisResult.key_terms.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-lg">
                              🔑 Key Terms
                            </h4>
                            <dl className="space-y-3">
                              {analysisResult.key_terms.map((term, index) => (
                                <div key={index} className="text-sm">
                                  <dt className="font-medium text-primary">
                                    {term.term}
                                  </dt>
                                  <dd className="text-muted-foreground mt-1 ml-4">
                                    {term.definition}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}

                      {/* Outline */}
                      {analysisResult.outline &&
                        analysisResult.outline.sections && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-lg">
                              📋 Outline
                            </h4>
                            <div className="text-sm space-y-2">
                              {analysisResult.outline.sections.map(
                                (section, index) => (
                                  <div key={index} className="ml-4">
                                    <p className="font-medium">
                                      {index + 1}. {section.title}
                                    </p>
                                    {section.children &&
                                      section.children.length > 0 && (
                                        <ul className="ml-4 mt-1 space-y-1">
                                          {section.children.map(
                                            (
                                              child: any,
                                              childIndex: number,
                                            ) => (
                                              <li
                                                key={childIndex}
                                                className="text-muted-foreground">
                                                • {child.title}
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 3: Flashcard CSV & Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Step 3: Preview & Make Flashcards (CSV)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Convert your Step 2 results into a flashcard-ready CSV.
                    Review the preview below, then choose Make Flashcards or
                    Cancel.
                  </p>

                  {!analysisResult && (
                    <div className="flex gap-2 p-4 bg-muted rounded-lg">
                      <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Complete Step 2 to enable CSV preview.
                      </p>
                    </div>
                  )}

                  {step3State.error && (
                    <div className="flex gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          CSV Generation Error
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step3State.error}
                        </p>
                      </div>
                    </div>
                  )}

                  {step3State.isSaved && (
                    <div className="flex gap-2 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Saved as {step3State.name}
                      </p>
                    </div>
                  )}

                  {step3State.isReady && step3State.cards.length > 0 && (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Preview (showing{" "}
                            {Math.min(20, step3State.cards.length)} of{" "}
                            {step3State.cards.length} cards)
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyCSV}
                              className="gap-2"
                              aria-label="Copy CSV to clipboard">
                              <Copy className="h-3 w-3" />
                              Copy CSV
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadCSV}
                              className="gap-2"
                              aria-label="Download CSV">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted sticky top-0">
                                <tr>
                                  <th className="text-left p-3 font-semibold border-b">
                                    Front
                                  </th>
                                  <th className="text-left p-3 font-semibold border-b">
                                    Back
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {step3State.cards
                                  .slice(0, 20)
                                  .map((card, index) => (
                                    <tr
                                      key={index}
                                      className="border-b last:border-b-0 hover:bg-muted/50">
                                      <td className="p-3 align-top max-w-xs">
                                        <div className="line-clamp-3">
                                          {card.front}
                                        </div>
                                      </td>
                                      <td className="p-3 align-top max-w-md">
                                        <div className="line-clamp-3 text-muted-foreground">
                                          {card.back}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {step3State.cards.length > 20 && (
                          <p className="text-xs text-muted-foreground text-center">
                            ... and {step3State.cards.length - 20} more cards
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        {!step3State.isSaved && (
                          <Button
                            onClick={handleSaveCSV}
                            disabled={step3State.isSaving}
                            className="flex-1 gap-2"
                            aria-label="Save CSV">
                            <Download className="h-4 w-4" />
                            {step3State.isSaving ? "Saving..." : "Save CSV"}
                          </Button>
                        )}
                        <Button
                          onClick={handleMakeFlashcards}
                          disabled={step3State.isSaving}
                          className="flex-1 gap-2"
                          aria-label="Make Flashcards">
                          <CreditCard className="h-4 w-4" />
                          Make Flashcards
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelFlashcards}
                          className="gap-2"
                          aria-label="Cancel">
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRecent ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="text-sm">Loading...</p>
                    </div>
                  ) : recentDocuments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No documents yet</p>
                      <p className="text-xs mt-1">
                        Upload your first document to get started
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentDocuments.map((doc) => {
                        const isCSV = doc.kind === "flashcards-csv";
                        return (
                          <Button
                            key={doc.id}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() =>
                              isCSV
                                ? handleOpenCSVModal(doc.id)
                                : navigate(`/documents/${doc.id}`)
                            }
                            aria-label={
                              isCSV
                                ? `Open CSV ${doc.title}`
                                : `Open document ${doc.title}`
                            }>
                            <FileText className="h-4 w-4 mr-2" />
                            <div className="flex-1 text-left truncate">
                              <div className="font-medium truncate">
                                {doc.title}
                                {isCSV && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (CSV)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Extract text from PDF & DOCX</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>AI-powered summaries & key points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Identify key terms automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">✓</span>
                      <span>Create flashcards for study</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Modal */}
      {csvModal.isOpen && csvModal.document && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseCSVModal}
          onKeyDown={(e) => e.key === "Escape" && handleCloseCSVModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="csv-modal-title">
          <div
            className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 id="csv-modal-title" className="text-xl font-bold">
                Flashcards CSV — {csvModal.document.title}
              </h2>
              <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                <span>{csvModal.document.cardCount} cards</span>
                <span>{(csvModal.document.size / 1024).toFixed(2)} KB</span>
                <span>
                  {new Date(csvModal.document.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-semibold border-b">
                          Front
                        </th>
                        <th className="text-left p-3 font-semibold border-b">
                          Back
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvModal.document.content
                        .split("\n")
                        .slice(1)
                        .filter((line) => line.trim())
                        .map((line, index) => {
                          const [front, back] = line.split(",");
                          return (
                            <tr
                              key={index}
                              className="border-b last:border-b-0 hover:bg-muted/50">
                              <td className="p-3 align-top max-w-xs">
                                <div className="line-clamp-3">
                                  {front?.trim()}
                                </div>
                              </td>
                              <td className="p-3 align-top max-w-md">
                                <div className="line-clamp-3 text-muted-foreground">
                                  {back?.trim()}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCloseCSVModal}>
                Close
              </Button>
              <Button onClick={handleProceedToCreateFlashcards}>
                Proceed to Create Flashcards
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
