import { Button } from "@/components/ui/Button";

interface SrsControlsProps {
  onRate: (quality: 0 | 1 | 2 | 3 | 4 | 5) => void;
  isLoading?: boolean;
}

export function SrsControls({ onRate, isLoading = false }: SrsControlsProps) {
  const ratings = [
    { quality: 0, label: "Again", color: "bg-red-500 hover:bg-red-600" },
    { quality: 1, label: "Hard", color: "bg-orange-500 hover:bg-orange-600" },
    { quality: 2, label: "Good", color: "bg-yellow-500 hover:bg-yellow-600" },
    { quality: 3, label: "Easy", color: "bg-green-500 hover:bg-green-600" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-center text-muted-foreground mb-4">
        Rate how well you knew this card:
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ratings.map(({ quality, label, color }) => (
          <Button
            key={quality}
            onClick={() => onRate(quality as 0 | 1 | 2 | 3)}
            disabled={isLoading}
            className={`${color} text-white border-0`}
            size="lg">
            {label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        Again: &lt;1m • Hard: &lt;6m • Good: ~1d • Easy: ~4d
      </p>
    </div>
  );
}
