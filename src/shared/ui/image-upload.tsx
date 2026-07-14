import { useState } from "react";
import { FileUpload } from "./file-upload";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange?: (dataUrl: string | null) => void;
  maxSizeMb?: number;
  className?: string;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxSizeMb = 5,
  className,
  label = "Upload image",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      onChange?.(url);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {preview && (
        <div className="overflow-hidden rounded-lg border">
          <img src={preview} alt="Preview" className="h-40 w-full object-cover" />
        </div>
      )}
      <FileUpload
        accept="image/*"
        maxSizeMb={maxSizeMb}
        onFiles={handleFiles}
        label={label}
      />
    </div>
  );
}
