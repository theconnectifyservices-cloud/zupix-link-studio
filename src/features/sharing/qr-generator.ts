import QRCodeStyling, { type Options as QrOptions } from "qr-code-styling";
import type { QrSettings } from "./types";

/**
 * Build qr-code-styling options from our normalized QrSettings.
 * `size` controls the raster resolution used for PNG exports; SVG scales freely.
 */
export function buildQrOptions(url: string, s: QrSettings, size = 512): QrOptions {
  return {
    width: size,
    height: size,
    type: "svg",
    data: url,
    margin: 8,
    qrOptions: { errorCorrectionLevel: s.errorLevel },
    backgroundOptions: {
      color: s.transparent ? "rgba(0,0,0,0)" : s.background,
    },
    dotsOptions: {
      type: s.dotStyle,
      color: s.color,
    },
    cornersSquareOptions: {
      type: s.cornerStyle,
      color: s.color,
    },
    cornersDotOptions: {
      type: s.cornerStyle === "extra-rounded" ? "dot" : "square",
      color: s.color,
    },
    image: s.logoUrl ?? undefined,
    imageOptions: s.logoUrl
      ? {
          hideBackgroundDots: s.logoMargin,
          imageSize: s.logoSize,
          margin: 6,
          crossOrigin: "anonymous",
        }
      : undefined,
  };
}

/** Instantiate a QRCodeStyling object safely (browser only). */
export function createQr(url: string, s: QrSettings, size = 512): QRCodeStyling {
  return new QRCodeStyling(buildQrOptions(url, s, size));
}

/** Render a QR into an existing container (used for live preview). */
export function renderQrInto(el: HTMLElement, url: string, s: QrSettings, size = 320) {
  el.innerHTML = "";
  const qr = createQr(url, s, size);
  qr.append(el);
  return qr;
}
