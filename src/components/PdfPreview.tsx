import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfPreviewProps {
  url: string;
  initialPage?: number;
  className?: string;
}

export function PdfPreview({
  url,
  initialPage = 1,
  className,
}: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loadingTask = pdfjsLib.getDocument(url);
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
      } catch (err) {
        setError("Failed to load PDF");
        console.error("Error loading PDF:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPdf();
  }, [url]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;

      try {
        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };

    void renderPage();
  }, [pdf, currentPage, scale]);

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  if (error) {
    return (
      <Card className={className}>
        <div className="p-6 text-center text-destructive">{error}</div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage === 1 || isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === numPages || isLoading}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {numPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={isLoading}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={isLoading}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="overflow-auto p-4 bg-muted/30">
          <div className="flex justify-center">
            {isLoading ? (
              <div className="py-12 text-muted-foreground">Loading PDF...</div>
            ) : (
              <canvas ref={canvasRef} className="shadow-lg" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
