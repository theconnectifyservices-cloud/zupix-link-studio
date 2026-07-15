import { jsPDF } from "jspdf";
import { createQr } from "./qr-generator";
import type { PrintPreset, QrSettings } from "./types";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function baseName(slug: string) {
  return `zupix-${slug || "bio"}-qr`;
}

/** Download the current QR as a high-resolution PNG. */
export async function downloadQrPng(url: string, s: QrSettings, slug: string, size = 1024) {
  const qr = createQr(url, s, size);
  const blob = (await qr.getRawData("png")) as Blob | null;
  if (!blob) throw new Error("QR PNG generation failed");
  triggerDownload(blob, `${baseName(slug)}.png`);
}

/** Download the current QR as a scalable SVG. */
export async function downloadQrSvg(url: string, s: QrSettings, slug: string) {
  const qr = createQr(url, s, 1024);
  const blob = (await qr.getRawData("svg")) as Blob | null;
  if (!blob) throw new Error("QR SVG generation failed");
  triggerDownload(blob, `${baseName(slug)}.svg`);
}

/** Render a QR to a raster PNG data URL (used inside PDF renderers). */
async function qrToPngDataUrl(url: string, s: QrSettings, size = 1024): Promise<string> {
  const qr = createQr(url, s, size);
  const blob = (await qr.getRawData("png")) as Blob | null;
  if (!blob) throw new Error("QR raster failed");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Simple standalone QR PDF (one page, centered). */
export async function downloadQrPdf(url: string, s: QrSettings, slug: string) {
  const dataUrl = await qrToPngDataUrl(url, s, 1200);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const size = 140;
  doc.addImage(dataUrl, "PNG", (pageW - size) / 2, (pageH - size) / 2, size, size, undefined, "FAST");
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(url, pageW / 2, pageH / 2 + size / 2 + 12, { align: "center" });
  doc.save(`${baseName(slug)}.pdf`);
}

interface PrintInput {
  url: string;
  title: string;
  tagline: string;
  qr: QrSettings;
  slug: string;
  preset: PrintPreset;
}

/**
 * Generate a print-ready PDF using one of the branded presets
 * (Poster, Business Card, Flyer, Social Post).
 */
export async function downloadPrintPdf(input: PrintInput) {
  const { preset, url, qr, slug, title, tagline } = input;
  const orientation = preset.widthMm >= preset.heightMm ? "landscape" : "portrait";
  const format: [number, number] = [preset.widthMm, preset.heightMm];
  const doc = new jsPDF({ unit: "mm", format, orientation });

  // Card / poster background band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, preset.widthMm, preset.heightMm * 0.18, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(preset.id === "business-card" ? 10 : 18);
  doc.text(title || "Scan to connect", preset.widthMm / 2, preset.heightMm * 0.11, {
    align: "center",
  });

  // QR
  const dataUrl = await qrToPngDataUrl(url, qr, 1200);
  const qrSize = preset.qrSizeMm;
  const qrX = (preset.widthMm - qrSize) / 2;
  const qrY = preset.heightMm * 0.24;
  doc.addImage(dataUrl, "PNG", qrX, qrY, qrSize, qrSize, undefined, "FAST");

  // URL + tagline
  doc.setTextColor(30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(preset.id === "business-card" ? 7 : 11);
  doc.text(url, preset.widthMm / 2, qrY + qrSize + 8, { align: "center" });

  if (tagline) {
    doc.setFontSize(preset.id === "business-card" ? 6 : 10);
    doc.setTextColor(100);
    const split = doc.splitTextToSize(tagline, preset.widthMm - 20);
    doc.text(split, preset.widthMm / 2, qrY + qrSize + 15, { align: "center" });
  }

  // Footer brand mark
  doc.setFontSize(preset.id === "business-card" ? 5 : 8);
  doc.setTextColor(160);
  doc.text("Made with ZUPIX", preset.widthMm / 2, preset.heightMm - 5, { align: "center" });

  doc.save(`${baseName(slug)}-${preset.id}.pdf`);
}
