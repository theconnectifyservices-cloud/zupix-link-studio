/**
 * Shared image-crop utilities.
 *
 * Cropping happens at the image's ORIGINAL resolution: react-easy-crop
 * reports the crop area in natural pixels, so the exported canvas is never
 * downscaled. Encoding preserves the source format (PNG keeps its alpha,
 * JPEG stays JPEG, everything else exports lossless WebP).
 */
import type { Area } from "react-easy-crop";

export type CropShape = "round" | "rect";

export interface CropTransform {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
}

export interface CroppedResult {
  blob: Blob;
  mime: string;
  ext: string;
  width: number;
  height: number;
}

/** Vector images must never be rasterized — they stay pixel-perfect as-is. */
export function isVectorImage(src: string, mime?: string): boolean {
  if (mime?.includes("svg")) return true;
  const path = src.split("?")[0].split("#")[0].toLowerCase();
  return path.endsWith(".svg");
}

/** Best-effort source MIME sniffing (extension first, then a HEAD-ish fetch). */
export async function detectImageMime(src: string): Promise<string | undefined> {
  const path = src.split("?")[0].split("#")[0].toLowerCase();
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".svg")) return "image/svg+xml";
  try {
    const res = await fetch(src, { method: "HEAD" });
    const t = res.headers.get("content-type");
    return t ? t.split(";")[0].trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Chooses a lossless-friendly output encoding for the given source type. */
export function outputFormat(sourceMime?: string): { mime: string; ext: string; quality: number } {
  if (sourceMime === "image/png") return { mime: "image/png", ext: "png", quality: 1 };
  if (sourceMime === "image/jpeg") return { mime: "image/jpeg", ext: "jpg", quality: 0.98 };
  // WebP lossless (quality 1) keeps transparency and avoids visible artifacts.
  return { mime: "image/webp", ext: "webp", quality: 1 };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

/**
 * Draws the source image with rotation + flips applied, then returns a canvas
 * containing only the crop area — at full source resolution.
 */
export function drawCroppedCanvas(
  image: HTMLImageElement,
  area: Area,
  { rotation, flipH, flipV }: CropTransform,
  /** Optional cap on the longest side — used for the live preview only. */
  maxSide?: number,
): HTMLCanvasElement {
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bw = Math.round(image.naturalWidth * cos + image.naturalHeight * sin);
  const bh = Math.round(image.naturalWidth * sin + image.naturalHeight * cos);

  const stage = document.createElement("canvas");
  stage.width = bw;
  stage.height = bh;
  const sCtx = stage.getContext("2d")!;
  sCtx.imageSmoothingEnabled = true;
  sCtx.imageSmoothingQuality = "high";
  sCtx.translate(bw / 2, bh / 2);
  sCtx.rotate(rad);
  sCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  sCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const cw = Math.max(1, Math.round(area.width));
  const ch = Math.max(1, Math.round(area.height));
  const scale = maxSide ? Math.min(1, maxSide / Math.max(cw, ch)) : 1;

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(cw * scale));
  out.height = Math.max(1, Math.round(ch * scale));
  const oCtx = out.getContext("2d")!;
  oCtx.imageSmoothingEnabled = true;
  oCtx.imageSmoothingQuality = "high";
  oCtx.drawImage(
    stage,
    Math.round(area.x),
    Math.round(area.y),
    cw,
    ch,
    0,
    0,
    out.width,
    out.height,
  );
  return out;
}

/** Crops `src` to `area` and encodes it without downscaling. */
export async function cropImageToBlob(
  src: string,
  area: Area,
  transform: CropTransform,
  sourceMime?: string,
): Promise<CroppedResult> {
  const image = await loadImage(src);
  const canvas = drawCroppedCanvas(image, area, transform);
  const fmt = outputFormat(sourceMime ?? (await detectImageMime(src)));
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not export image"))),
      fmt.mime,
      fmt.quality,
    ),
  );
  return { blob, mime: fmt.mime, ext: fmt.ext, width: canvas.width, height: canvas.height };
}
