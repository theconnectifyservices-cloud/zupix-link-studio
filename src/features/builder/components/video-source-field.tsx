/**
 * VideoSourceField — hero-background / block-level video picker.
 *
 * Replaces direct file inputs with the universal FilePicker for a
 * professional Library + Upload + URL experience.
 */
import { useCallback, useState } from "react";
import {
  Film,
  Link2,
  Trash2,
  Video as VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePicker } from "@/features/media/components/file-picker";
import {
  buildEmbed,
  detectVideoProvider,
  providerLabel,
} from "../video-source";

interface Props {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Enable background-optimized embed defaults (autoplay/muted/loop). */
  background?: boolean;
}

export function VideoSourceField({ label, value, onChange, background = true }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const provider = detectVideoProvider(value ?? "");
  const embed = value ? buildEmbed(value, { background }) : null;
  const invalid = !!value && !embed;

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>

      {/* Preview */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border bg-muted">
        {value && embed?.kind === "video" && (
          <video
            src={embed.src}
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        )}
        {value && embed?.kind === "iframe" && (
          <iframe
            src={embed.src}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        )}
        {!value && <VideoIcon className="h-6 w-6 text-muted-foreground" />}
        {value && (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {providerLabel(provider)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
          <Film className="mr-1 h-3.5 w-3.5" />
          Choose from Library
        </Button>
        {value && (
          <Button size="sm" variant="ghost" onClick={() => onChange(undefined)} className="text-destructive">
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>

      {/* URL input */}
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Paste MP4, YouTube, Vimeo or Loom URL…"
          className="pl-7 text-xs"
        />
      </div>

      {invalid ? (
        <p className="text-[11px] text-destructive">
          Couldn't recognise that link. Use a direct MP4/WebM URL or a YouTube, Vimeo, or Loom link.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Supports MP4, WebM, Media Library, YouTube, Vimeo, Loom.
        </p>
      )}

      <FilePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        kind="video"
        title="Select Video"
        onSelect={(url) => {
          onChange(url);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
