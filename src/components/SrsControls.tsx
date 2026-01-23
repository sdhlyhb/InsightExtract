import { Button } from "./ui/Button";
import { cn } from "@/utils/cn";

interface SrsControlsProps {
  onRate: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  isLoading?: boolean;
  className?: string;
}

const qualityLabels = [
  {
    value: 0,
    label: "Again",
    description: "Complete blackout",
    variant: "destructive" as const,
  },
  {
    value: 1,
    label: "Hard",
    description: "Incorrect, but remembered",
    variant: "outline" as const,
  },
  {
    value: 2,
    label: "Hard",
    description: "Correct with difficulty",
    variant: "outline" as const,
  },
  {
    value: 3,
    label: "Good",
    description: "Correct with hesitation",
    variant: "secondary" as const,
  },
  {
    value: 4,
    label: "Good",
    description: "Correct",
    variant: "secondary" as const,
  },
  {
    value: 5,
    label: "Easy",
    description: "Perfect recall",
    variant: "default" as const,
  },
];

export function SrsControls({
  onRate,
  isLoading = false,
  className,
}: SrsControlsProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    const key = parseInt(e.key);
    if (key >= 0 && key <= 5) {
      onRate(key as 0 | 1 | 2 | 3 | 4 | 5);
    }
  };

  return (
    <div
      className={cn("space-y-4", className)}
      onKeyDown={handleKeyPress}
      tabIndex={0}>
      <div className="text-xs text-muted-foreground text-center mb-2">
        Press 0-5 or click to rate your recall
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {qualityLabels.map((item) => (
          <Button
            key={item.value}
            variant={item.variant}
            onClick={() => onRate(item.value as 0 | 1 | 2 | 3 | 4 | 5)}
            disabled={isLoading}
            className="flex flex-col h-auto py-3 items-start">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs opacity-60">{item.value}</span>
              <span className="font-semibold">{item.label}</span>
            </div>
            <span className="text-xs opacity-75 font-normal">
              {item.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
