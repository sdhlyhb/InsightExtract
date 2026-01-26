import { useState } from "react";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import type { Flashcard } from "@/types";
import { Card, CardContent, CardFooter } from "./ui/Card";
import { Button } from "./ui/Button";
import { CitationPopover } from "./CitationPopover";
import { cn } from "@/utils/cn";

interface FlashcardEditorProps {
  card: Flashcard;
  onSave: (updates: Partial<Flashcard>) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function FlashcardEditor({
  card,
  onSave,
  onDelete,
  onCancel,
  className,
}: FlashcardEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  const handleSave = () => {
    onSave({ front, back });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFront(card.front);
    setBack(card.back);
    setIsEditing(false);
    onCancel?.();
  };

  return (
    <Card className={cn("relative", className)}>
      <CardContent className="pt-6">
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                Question
              </label>
              <p className="text-base">{card.front}</p>
            </div>
            <div className="border-t pt-4">
              <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                Answer
              </label>
              <p className="text-base">{card.back}</p>
            </div>
            {card.citations.length > 0 && (
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                  Citations
                </label>
                <div className="flex flex-wrap gap-2">
                  {card.citations.map((citation) => (
                    <CitationPopover key={citation.id} citation={citation}>
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        Page {citation.page}
                      </span>
                    </CitationPopover>
                  ))}
                </div>
              </div>
            )}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="front"
                className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                Question
              </label>
              <textarea
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="back"
                className="text-xs font-medium text-muted-foreground uppercase mb-2 block">
                Answer
              </label>
              <textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
