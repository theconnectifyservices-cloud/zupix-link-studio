/** Deep-links / share intents for each supported channel. */
export interface ShareInput {
  url: string;
  title: string;
  message: string;
}

const enc = encodeURIComponent;

export const shareLinks = {
  whatsapp: ({ url, message }: ShareInput) =>
    `https://wa.me/?text=${enc(`${message ? message + " " : ""}${url}`)}`,
  facebook: ({ url }: ShareInput) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  twitter: ({ url, message }: ShareInput) =>
    `https://twitter.com/intent/tweet?text=${enc(message)}&url=${enc(url)}`,
  linkedin: ({ url }: ShareInput) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  telegram: ({ url, message }: ShareInput) =>
    `https://t.me/share/url?url=${enc(url)}&text=${enc(message)}`,
  reddit: ({ url, title }: ShareInput) =>
    `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
  email: ({ url, title, message }: ShareInput) =>
    `mailto:?subject=${enc(title)}&body=${enc(`${message}\n\n${url}`)}`,
} as const;

export type ShareChannel = keyof typeof shareLinks;

/** Attempt the native Web Share API; returns true if it fired. */
export async function tryNativeShare(input: ShareInput): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share({ title: input.title, text: input.message, url: input.url });
    return true;
  } catch {
    // user cancelled or share failed — treat as no-op
    return false;
  }
}
