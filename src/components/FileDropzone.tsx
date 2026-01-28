import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { cn } from "@/utils/cn";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onTextSubmit?: (text: string) => void;
  onUrlSubmit?: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function FileDropzone({
  onFileSelect,
  isLoading = false,
  className,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed transition-colors hover:border-primary",
        !isLoading && "cursor-pointer",
        isDragActive && "border-primary bg-primary/5",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}>
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isDragActive ? "Drop your PDF here" : "Upload a PDF"}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop a PDF file here, or click to browse
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            Choose File
          </Button>
        </div>
      </div>
    </Card>
  );
}
