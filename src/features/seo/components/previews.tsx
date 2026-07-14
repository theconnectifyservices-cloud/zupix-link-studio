import { Globe, Facebook, MessageCircle, Linkedin } from "lucide-react";

interface Ctx {
  title: string;
  description: string;
  url: string;
  image?: string;
  siteName?: string;
}

/** Google desktop search result preview. */
export function SearchPreview({ title, description, url }: Ctx) {
  const clean = safeUrl(url);
  return (
    <div className="rounded-md border bg-background p-3 font-sans">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe className="h-3 w-3" />
        <span className="truncate">{clean}</span>
      </div>
      <div className="mt-1 truncate text-[18px] leading-tight text-[#1a0dab] dark:text-blue-400">
        {truncate(title, 60)}
      </div>
      <div className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">
        {truncate(description, 160)}
      </div>
    </div>
  );
}

/** Facebook / LinkedIn / WhatsApp share card previews. */
export function FacebookPreview({ title, description, url, image, siteName }: Ctx) {
  return (
    <div className="overflow-hidden rounded-md border bg-background font-sans">
      {image ? (
        <img src={image} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          <Facebook className="mr-1.5 h-4 w-4" /> No image
        </div>
      )}
      <div className="border-t p-3">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {hostOf(url)}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[15px] font-semibold">{truncate(title, 88)}</div>
        <div className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">
          {truncate(description, 200)}
        </div>
        {siteName && (
          <div className="mt-1 text-[11px] text-muted-foreground">{siteName}</div>
        )}
      </div>
    </div>
  );
}

export function LinkedInPreview({ title, description, url, image }: Ctx) {
  return (
    <div className="overflow-hidden rounded-md border bg-background font-sans">
      {image ? (
        <img src={image} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          <Linkedin className="mr-1.5 h-4 w-4" /> No image
        </div>
      )}
      <div className="border-t p-3">
        <div className="line-clamp-2 text-[15px] font-semibold">{truncate(title, 120)}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {hostOf(url)} • {truncate(description, 80)}
        </div>
      </div>
    </div>
  );
}

export function WhatsAppPreview({ title, description, url, image }: Ctx) {
  return (
    <div className="max-w-sm overflow-hidden rounded-lg border bg-[#dcf8c6] p-1.5 font-sans dark:bg-emerald-950">
      <div className="overflow-hidden rounded-md bg-background">
        {image ? (
          <img src={image} alt="" className="h-28 w-full object-cover" />
        ) : (
          <div className="flex h-28 w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            <MessageCircle className="mr-1.5 h-4 w-4" /> No image
          </div>
        )}
        <div className="p-2">
          <div className="line-clamp-1 text-[13px] font-semibold">{truncate(title, 60)}</div>
          <div className="line-clamp-2 text-[12px] text-muted-foreground">
            {truncate(description, 120)}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{hostOf(url)}</div>
        </div>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}
function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
function safeUrl(url: string) {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === "/" ? "" : u.pathname}`;
  } catch {
    return url;
  }
}
