/**
 * MediaFileField — universal upload + library + URL picker for
 * non-image, non-video assets (PDF, DOC, XLS, PPT, ZIP, TXT, audio…).
 * 
 * Replaces the local MediaFilePickerDialog with the centralized FilePicker.
 */
import { useState } from "react";
import {
  File as FileIcon,
  FileText,
  FileArchive,
  FileSpreadsheet,
  Link2,
  Music,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePicker } from "@/features/media/components/file-picker";
import type { MediaKind } from "@/features/media/types";

export interface MediaFileFieldValue {
  url: string;
  name?: string;
  size?: number;
  mime?: string;
  assetId?: string;
}

interface Props {
  label: string;
  value?: string;
  fileName?: string;
  onChange: (val: MediaFileFieldValue | undefined) => void;
  /** Restrict library + accept attribute. Defaults to 'document' | 'audio' | 'other'. */
  kind?: "document" | "audio" | "other" | "all";
  /** Text shown under the empty preview. */
  hint?: string;
  pickerTitle?: string;
}

export function MediaFileField({
  label,
  value,
  fileName,
  onChange,
  kind = "document",
  hint,
  pickerTitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const displayName = fileName || value?.split("/").pop()?.split("?")[0] || "";

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-2">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-background text-primary">
          <FileGlyph name={displayName} />
        </div>
        <div className="min-w-0 flex-1">
          {value ? (
            <>
              <div className="truncate text-sm font-medium">{displayName || "Selected file"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{value}</div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              {hint ?? "No file selected. Upload one, or choose from your Media Library."}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            {value ? "Replace" : "Choose"}
          </Button>
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(undefined)}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowUrl((v) => !v)}
            title="Use a direct URL"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showUrl && (
        <Input
          value={value ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value ? { url: e.target.value, name: displayName || undefined } : undefined,
            )
          }
          placeholder="https://…"
          className="text-xs"
        />
      )}

      <FilePicker
        open={open}
        onOpenChange={setOpen}
        title={pickerTitle ?? label}
        kind={kind}
        onSelect={(url) => {
          onChange({ url });
          setOpen(false);
        }}
      />
    </div>
  );
}

function FileGlyph({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext))
    return <Music className="h-5 w-5" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return <FileArchive className="h-5 w-5" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-5 w-5" />;
  if (["pdf", "doc", "docx", "txt", "rtf", "ppt", "pptx"].includes(ext))
    return <FileText className="h-5 w-5" />;
  return <FileIcon className="h-5 w-5" />;
}
