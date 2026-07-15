/** Embed snippet generators — architecture-ready for LS-09+. */
export interface EmbedInput {
  url: string;
  title: string;
}

export function iframeEmbed({ url, title }: EmbedInput) {
  return `<iframe src="${url}" title="${title.replace(/"/g, "&quot;")}" style="width:100%;max-width:420px;height:640px;border:0;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,.08);" loading="lazy"></iframe>`;
}

export function buttonEmbed({ url, title }: EmbedInput) {
  return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:.5rem;padding:.75rem 1.25rem;background:#0F172A;color:#fff;border-radius:9999px;font-family:system-ui,sans-serif;font-weight:600;text-decoration:none;">Visit ${title}</a>`;
}

export function qrWidgetEmbed({ url }: EmbedInput) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
  return `<a href="${url}" target="_blank" rel="noopener" style="display:inline-block;padding:12px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;"><img src="${src}" alt="QR code" width="180" height="180"/></a>`;
}
