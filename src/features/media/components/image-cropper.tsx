/**
 * ImageCropper — the single, reusable crop experience for the whole builder
 * (logo, avatar, hero banner, gallery, products, cards, testimonials, …).
 *
 * Features: aspect-ratio presets with auto-suggestion, zoom + rotate sliders,
 * 90° rotate, flips, reset, and a live preview of the exact output. Cropping
 * is done at the source resolution and keeps PNG transparency.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import {
  FlipHorizontal,
  FlipVertical,
  Loader2,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  type CropShape,
  type CroppedResult,
  cropImageToBlob,
  detectImageMime,
  drawCroppedCanvas,
  loadImage,
} from "../crop";

export type AspectValue = number | "free" | "original";

interface Preset {
  id: string;
  label: string;
  value: AspectValue;
}

const PRESETS: Preset[] = [
  { id: "original", label: "Original", value: "original" },
  { id: "free", label: "Free", value: "free" },
  { id: "1:1", label: "1:1", value: 1 },
  { id: "4:3", label: "4:3", value: 4 / 3 },
  { id: "3:4", label: "3:4", value: 3 / 4 },
  { id: "16:9", label: "16:9", value: 16 / 9 },
  { id: "9:16", label: "9:16", value: 9 / 16 },
  { id: "21:9", label: "21:9", value: 21 / 9 },
];

export interface ImageCropperProps {
  src: string;
  /** Round mask for avatars. */
  shape?: CropShape;
  /** Initial ratio. When omitted, one is suggested from the image itself. */
  defaultAspect?: AspectValue;
  /** Hide the preset row and lock to `defaultAspect`. */
  lockAspect?: boolean;
  /** Extra disabled state while the parent uploads. */
  busy?: boolean;
  onCancel: () => void;
  /** Called with the cropped image at full resolution. */
  onApply: (result: CroppedResult) => void | Promise<void>;
  /** Optional "use original, skip cropping" escape hatch. */
  onSkip?: () => void;
}

export function ImageCropper({
  src,
  shape = "rect",
  defaultAspect,
  lockAspect = false,
  busy = false,
  onCancel,
  onApply,
  onSkip,
}: ImageCropperProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [mime, setMime] = useState<string | undefined>();
  const [aspectId, setAspectId] = useState<string>(
    () => PRESETS.find((p) => p.value === defaultAspect)?.id ?? "original",
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load once for natural size + preview rendering, and sniff the source type.
  useEffect(() => {
    let cancelled = false;
    setNatural(null);
    imgRef.current = null;
    loadImage(src)
      .then((img) => {
        if (cancelled) return;
        imgRef.current = img;
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
        // Auto-suggest a ratio from the image shape (user can still change it).
        if (!defaultAspect) {
          const r = img.naturalWidth / img.naturalHeight;
          setAspectId(r > 1.15 ? "16:9" : r < 0.87 ? "9:16" : "1:1");
        }
      })
      .catch(() => undefined);
    detectImageMime(src).then((m) => !cancelled && setMime(m));
    return () => {
      cancelled = true;
    };
  }, [src, defaultAspect]);

  const aspect = useMemo(() => {
    if (lockAspect && defaultAspect !== undefined) {
      return typeof defaultAspect === "number"
        ? defaultAspect
        : defaultAspect === "original" && natural
          ? natural.w / natural.h
          : undefined;
    }
    const preset = PRESETS.find((p) => p.id === aspectId);
    if (!preset || preset.value === "free") return undefined;
    if (preset.value === "original") return natural ? natural.w / natural.h : undefined;
    return preset.value;
  }, [aspectId, natural, lockAspect, defaultAspect]);

  // Live preview — redraw the exact crop (downscaled for the thumbnail only).
  useEffect(() => {
    if (!area || !imgRef.current) return;
    const id = window.setTimeout(() => {
      try {
        const canvas = drawCroppedCanvas(
          imgRef.current!,
          area,
          { rotation, flipH, flipV },
          320,
        );
        setPreviewUrl(canvas.toDataURL("image/png"));
      } catch {
        /* preview is best-effort */
      }
    }, 120);
    return () => window.clearTimeout(id);
  }, [area, rotation, flipH, flipV]);

  const reset = useCallback(() => {
    setPos({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  }, []);

  const apply = async () => {
    if (!area) return;
    try {
      setSaving(true);
      const result = await cropImageToBlob(src, area, { rotation, flipH, flipV }, mime);
      await onApply(result);
    } finally {
      setSaving(false);
    }
  };

  const disabled = saving || busy;

  return (
    <div className="space-y-3">
      {!lockAspect && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Aspect ratio</Label>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={aspectId === p.id ? "default" : "outline"}
                className="h-7 px-2.5 text-xs"
                onClick={() => setAspectId(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative h-[300px] w-full overflow-hidden rounded-md border bg-muted sm:h-[340px]">
          <Cropper
            image={src}
            crop={pos}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={shape}
            objectFit="contain"
            restrictPosition={false}
            transform={`translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${
              flipH ? -1 : 1
            }, ${flipV ? -1 : 1}) scale(${zoom})`}
            onCropChange={setPos}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, a) => setArea(a)}
            showGrid
          />
        </div>

        <div className="w-full shrink-0 space-y-2 sm:w-[168px]">
          <Label className="text-xs text-muted-foreground">Live preview</Label>
          <div
            className={cn(
              "flex items-center justify-center overflow-hidden border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]",
              shape === "round" ? "mx-auto aspect-square w-28 rounded-full" : "rounded-md",
            )}
            style={shape === "round" ? undefined : { aspectRatio: aspect ? String(aspect) : "1" }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Crop preview" className="h-full w-full object-cover" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {area && (
            <p className="text-center text-[11px] text-muted-foreground">
              {Math.round(area.width)} × {Math.round(area.height)} px
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs text-muted-foreground">Zoom</Label>
          <Slider min={1} max={4} step={0.01} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Rotate ({Math.round(rotation)}°)</Label>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[rotation]}
            onValueChange={(v) => setRotation(v[0])}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRotation((r) => (r + 270) % 360)}
          title="Rotate left"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Left
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          title="Rotate right"
        >
          <RotateCw className="mr-1 h-3.5 w-3.5" /> Right
        </Button>
        <Button
          size="sm"
          variant={flipH ? "default" : "outline"}
          onClick={() => setFlipH((v) => !v)}
        >
          <FlipHorizontal className="mr-1 h-3.5 w-3.5" /> Flip H
        </Button>
        <Button
          size="sm"
          variant={flipV ? "default" : "outline"}
          onClick={() => setFlipV((v) => !v)}
        >
          <FlipVertical className="mr-1 h-3.5 w-3.5" /> Flip V
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          <Undo2 className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onCancel} disabled={disabled}>
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
        {onSkip && (
          <Button variant="outline" onClick={onSkip} disabled={disabled}>
            Use original
          </Button>
        )}
        <Button onClick={apply} disabled={disabled || !area}>
          {disabled ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Apply
        </Button>
      </div>
    </div>
  );
}
