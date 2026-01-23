import { useEffect, useState } from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import type { Job } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { cn } from "@/utils/cn";

interface JobProgressProps {
  job: Job;
  onComplete?: () => void;
  className?: string;
}

const jobSteps = {
  extract: { label: "Extracting text", order: 1 },
  embed: { label: "Generating embeddings", order: 2 },
  summarize: { label: "Creating summary", order: 3 },
  cards: { label: "Generating flashcards", order: 4 },
};

export function JobProgress({ job, onComplete, className }: JobProgressProps) {
  const [progress, setProgress] = useState(job.progress);

  useEffect(() => {
    setProgress(job.progress);
    if (job.status === "completed" && onComplete) {
      onComplete();
    }
  }, [job.progress, job.status, onComplete]);

  const currentStep = jobSteps[job.type as keyof typeof jobSteps];
  const isRunning = job.status === "running";
  const isFailed = job.status === "failed";
  const isCompleted = job.status === "completed";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRunning && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
          {isFailed && <XCircle className="h-5 w-5 text-destructive" />}
          {job.status === "pending" && (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
          <span>
            {isCompleted
              ? "Processing Complete"
              : isFailed
                ? "Processing Failed"
                : "Processing Document"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentStep && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentStep.label}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <ProgressPrimitive.Root
              className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
              value={progress}>
              <ProgressPrimitive.Indicator
                className={cn(
                  "h-full w-full flex-1 transition-all",
                  isFailed ? "bg-destructive" : "bg-primary",
                )}
                style={{ transform: `translateX(-${100 - progress}%)` }}
              />
            </ProgressPrimitive.Root>
          </div>
        )}

        {job.message && (
          <p
            className={cn(
              "text-sm",
              isFailed ? "text-destructive" : "text-muted-foreground",
            )}>
            {job.message}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2 pt-2">
          {Object.entries(jobSteps).map(([key, step]) => {
            const stepJob = key as keyof typeof jobSteps;
            const isCurrentStep = stepJob === job.type;
            const isPastStep = step.order < currentStep.order;

            return (
              <div
                key={key}
                className={cn(
                  "text-xs text-center py-2 px-1 rounded border",
                  isCurrentStep && isRunning && "bg-primary/10 border-primary",
                  isPastStep && "bg-secondary border-secondary",
                  !isCurrentStep &&
                    !isPastStep &&
                    "border-border text-muted-foreground",
                )}>
                {step.label}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
