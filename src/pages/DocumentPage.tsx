import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { OutlineTree } from "@/components/OutlineTree";
import { JobProgress } from "@/components/JobProgress";
import { PdfPreview } from "@/components/PdfPreview";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as Tabs from "@radix-ui/react-tabs";
import type { Document, Outline, Job } from "@/types";

// Mock data - replace with actual API calls
const mockDocument: Document = {
  id: "doc-123",
  title: "Sample Research Paper.pdf",
  sourceType: "pdf",
  status: "processing",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pageCount: 15,
  fileSize: 2048000,
};

const mockJob: Job = {
  id: "job-456",
  documentId: "doc-123",
  type: "extract",
  status: "running",
  progress: 45,
  message: "Extracting text from pages...",
  createdAt: new Date().toISOString(),
};

const mockOutline: Outline = {
  documentId: "doc-123",
  mainPoints: [
    "Introduction to neural networks",
    "Backpropagation algorithm",
    "Training optimization techniques",
  ],
  outline: [
    {
      title: "1. Introduction",
      page: 1,
      children: [
        { title: "1.1 Background", page: 2 },
        { title: "1.2 Motivation", page: 3 },
      ],
    },
    {
      title: "2. Methods",
      page: 5,
      children: [
        { title: "2.1 Data Collection", page: 6 },
        { title: "2.2 Model Architecture", page: 8 },
      ],
    },
    {
      title: "3. Results",
      page: 10,
    },
    {
      title: "4. Conclusion",
      page: 13,
    },
  ],
  citations: [],
};

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document] = useState<Document>(mockDocument);
  const [outline] = useState<Outline | null>(null);
  const [job] = useState<Job>(mockJob);

  const isProcessing = document.status === "processing";
  const hasOutline = outline !== null;

  const handleGenerateFlashcards = () => {
    // TODO: Trigger flashcard generation
    navigate(`/documents/${id}/decks`);
  };

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
            <Button onClick={handleGenerateFlashcards}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Flashcards
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="mb-6">
          <JobProgress job={job} />
        </div>
      )}

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
