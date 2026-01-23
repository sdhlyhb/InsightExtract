import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Quote } from "lucide-react";
import type { Citation } from "@/types";
import { cn } from "@/utils/cn";

interface CitationPopoverProps {
  citation: Citation;
  children: React.ReactNode;
  className?: string;
}

export function CitationPopover({
  citation,
  children,
  className,
}: CitationPopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <span
          className={cn(
            "cursor-pointer text-primary underline decoration-dotted hover:decoration-solid",
            className,
          )}>
          {children}
        </span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none"
          sideOffset={5}>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Quote className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
              <blockquote className="text-sm italic border-l-2 pl-3">
                {citation.quote}
              </blockquote>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
              <span>Page {citation.page}</span>
              {citation.context && (
                <span className="text-right truncate max-w-[200px]">
                  {citation.context}
                </span>
              )}
            </div>
          </div>
          <PopoverPrimitive.Arrow className="fill-popover" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
