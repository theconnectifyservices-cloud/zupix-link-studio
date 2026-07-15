import { Upload } from "lucide-react";
import { useFileDrop } from "../hooks/use-file-drop";
import { cn } from "@/lib/utils";

interface Props {
  onFiles: (files: { file: File; path: string }[]) => void;
  accept?: (file: File) => boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  hint?: string;
}

/** Desktop drop zone with folder support and multi-select. */
export function DesktopDropZone({
  onFiles,
  accept,
  disabled,
  className,
  children,
  hint = "Drop files or folders to upload",
}: Props) {
  const { ref, isOver } = useFileDrop<HTMLDivElement>({ onFiles, accept, disabled });
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-lg border-2 border-dashed transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
        className,
      )}
    >
      {children ?? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Upload className="h-6 w-6" />
          <span>{hint}</span>
        </div>
      )}
      {isOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 text-sm font-medium text-primary">
          Drop to upload
        </div>
      )}
    </div>
  );
}
