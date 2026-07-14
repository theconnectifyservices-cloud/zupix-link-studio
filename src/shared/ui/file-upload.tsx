import { UploadCloud } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  onFiles?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function FileUpload({
  accept,
  multiple,
  maxSizeMb = 10,
  onFiles,
  disabled,
  className,
  label = "Drop files or click to upload",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = (list: FileList | null) => {
    if (!list) return;
    const files = Array.from(list);
    const tooBig = files.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds ${maxSizeMb}MB`);
      return;
    }
    setError(null);
    onFiles?.(files);
  };

  return (
    <div className={cn("w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files);
        }}
        aria-label={label}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-accent" : "border-input",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
        <span className="text-sm text-foreground">{label}</span>
        <span className="mt-1 text-xs text-muted-foreground">Max {maxSizeMb}MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handle(e.target.files)}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
