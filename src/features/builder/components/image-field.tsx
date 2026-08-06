/**
 * ImageField — property-panel control that replaces the raw URL input for
 * profile/hero images. Shows a live preview thumbnail and opens the
 * FilePicker for upload / library / URL selection with optional crop.
 */
import { useState } from "react";
import { ImageIcon, Trash2, Pencil, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePicker as MediaPicker } from "@/features/media/components/file-picker";
import type { CropShape } from "@/features/media/components/file-picker";
import type { AspectValue } from "@/features/media/components/image-cropper";

interface Props {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Optional crop config. Omit to skip cropping entirely. */
  crop?: { shape: CropShape; aspect: AspectValue; lockAspect?: boolean };
  /** Preview aspect ratio (CSS). */
  previewAspect?: string;
  /** Show as circular preview (for avatars). */
  circle?: boolean;
  pickerTitle?: string;
}

export function ImageField({
  label,
  value,
  onChange,
  crop,
  previewAspect,
  circle,
  pickerTitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-muted`}
          style={{
            width: circle ? 64 : 96,
            height: circle ? 64 : previewAspect ? undefined : 64,
            aspectRatio: circle ? "1 / 1" : previewAspect ?? "1 / 1",
            borderRadius: circle ? "var(--zx-avatar-radius, 9999px)" : "6px",
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            {value ? "Replace" : "Choose"}
          </Button>
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(undefined)}
              className="text-destructive"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remove
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdvanced((v) => !v)}
            title="Use a direct URL"
          >
            <Link2 className="mr-1 h-3.5 w-3.5" />
            URL
          </Button>
        </div>
      </div>
      {showAdvanced && (
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="https://…"
          className="text-xs"
        />
      )}
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        title={pickerTitle ?? label}
        kind="image"
        crop={crop}
        onSelect={(url) => onChange(url)}
      />
    </div>
  );
}
