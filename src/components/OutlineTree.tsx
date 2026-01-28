import { ChevronRight } from "lucide-react";
import type { OutlineNode } from "@/types";
import { cn } from "@/utils/cn";

interface OutlineTreeProps {
  outline: OutlineNode[];
  onNodeClick?: (node: OutlineNode) => void;
  className?: string;
}

interface OutlineNodeItemProps {
  node: OutlineNode;
  level: number;
  onNodeClick?: (node: OutlineNode) => void;
}

function OutlineNodeItem({ node, level, onNodeClick }: OutlineNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => onNodeClick?.(node)}
        className={cn(
          "w-full text-left py-2 px-3 rounded-md hover:bg-accent transition-colors flex items-center gap-2",
          level > 0 && "text-sm",
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}>
        {hasChildren && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1">{node.title}</span>
        {node.page !== undefined && (
          <span className="text-xs text-muted-foreground">p. {node.page}</span>
        )}
      </button>
      {hasChildren && (
        <div>
          {node.children?.map((child, idx) => (
            <OutlineNodeItem
              key={idx}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OutlineTree({
  outline,
  onNodeClick,
  className,
}: OutlineTreeProps) {
  if (outline.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        No outline available yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {outline.map((node, idx) => (
        <OutlineNodeItem
          key={idx}
          node={node}
          level={0}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}
