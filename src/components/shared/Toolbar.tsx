import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export const Toolbar = ({ left, right, className }: ToolbarProps) => {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 p-4 border-b bg-card",
      className
    )}>
      <div className="flex items-center gap-2">
        {left}
      </div>
      <div className="flex items-center gap-2">
        {right}
      </div>
    </div>
  );
};
