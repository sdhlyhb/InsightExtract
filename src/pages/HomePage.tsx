import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock } from "lucide-react";
import { FileDropzone } from "@/components/FileDropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Document } from "@/types";

// Mock data - replace with actual API calls
const recentDocuments: Document[] = [];

export function HomePage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      // TODO: Upload file to API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source_type", "pdf");

      // Mock response
      const mockDocId = "doc-123";

      // Navigate to document page
      navigate(`/documents/${mockDocId}`);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">InsightExtract</h1>
        <p className="text-muted-foreground text-lg">
          Transform PDFs and documents into structured knowledge and flashcards
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FileDropzone
            onFileSelect={handleFileSelect}
            isLoading={isUploading}
          />
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
              {recentDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No documents yet</p>
                  <p className="text-xs mt-1">
                    Upload your first PDF to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <Button
                      key={doc.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate(`/documents/${doc.id}`)}>
                      <FileText className="h-4 w-4 mr-2" />
                      <div className="flex-1 text-left truncate">
                        <div className="font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Button>
                  ))}
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
                  <span>Extract and structure PDF content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Generate summaries with citations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Create flashcards automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Spaced repetition learning</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
