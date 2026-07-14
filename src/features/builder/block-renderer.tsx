import type { Block, FontSize, FontWeight, SocialPlatform } from "./types";
import { cn } from "@/lib/utils";
import {
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  Globe,
  Music2,
  Facebook,
  MessageCircle,
  Send,
  AtSign,
  Image as ImageIcon,
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react";

const SOCIAL_ICON: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  threads: AtSign,
  linkedin: Linkedin,
  pinterest: ImageIcon,
  telegram: Send,
  whatsapp: MessageCircle,
  github: Github,
  twitter: Twitter,
  website: Globe,
  custom: LinkIcon,
};

const FONT_SIZE: Record<FontSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

const FONT_WEIGHT: Record<FontWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const WIDTH_CLASS = {
  full: "w-full",
  auto: "w-auto px-6",
  half: "w-1/2",
} as const;

const ALIGN_WRAP = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

/** Renders a block in the live preview. Read-only visual output. */
export function BlockRenderer({ block }: { block: Block }) {
  if (block.hidden) return null;

  switch (block.type) {
    case "profile":
      return (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          {block.coverUrl && (
            <div className="-mx-5 -mt-10 mb-2 h-24 w-[calc(100%+2.5rem)] overflow-hidden bg-muted">
              <img src={block.coverUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-muted text-2xl font-semibold text-muted-foreground ring-4 ring-background">
            {block.avatarUrl ? (
              <img src={block.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (block.displayName ?? "?").charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-1 text-base font-semibold">
              <span>{block.displayName}</span>
              {block.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
            {block.username && (
              <div className="text-xs text-muted-foreground">@{block.username}</div>
            )}
            {block.location && (
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {block.location}
              </div>
            )}
            {block.bio && <div className="mt-1 text-xs text-muted-foreground">{block.bio}</div>}
            {block.shortDescription && (
              <div className="mt-1 text-[11px] text-muted-foreground/80">
                {block.shortDescription}
              </div>
            )}
          </div>
        </div>
      );

    case "heading":
      return (
        <h2
          style={block.color ? { color: block.color } : undefined}
          className={cn(
            FONT_SIZE[block.fontSize ?? "xl"],
            FONT_WEIGHT[block.fontWeight ?? "bold"],
            block.align === "center" && "text-center",
            block.align === "right" && "text-right",
          )}
        >
          {block.text || "Heading"}
        </h2>
      );

    case "text":
      return (
        <p
          style={block.color ? { color: block.color } : undefined}
          className={cn(
            "whitespace-pre-wrap text-foreground/80",
            FONT_SIZE[block.fontSize ?? "sm"],
            FONT_WEIGHT[block.fontWeight ?? "normal"],
            block.align === "center" && "text-center",
            block.align === "right" && "text-right",
          )}
        >
          {block.text}
        </p>
      );

    case "button": {
      const base =
        "inline-block rounded-full py-3 text-center text-sm font-medium transition-transform hover:-translate-y-0.5";
      const variant =
        block.style === "outline"
          ? "border border-foreground/30 text-foreground"
          : block.style === "soft"
            ? "bg-muted text-foreground"
            : "bg-foreground text-background";
      const width = WIDTH_CLASS[block.width ?? "full"];
      const align = ALIGN_WRAP[block.align ?? "center"];
      return (
        <div className={cn("flex", align)}>
          <div
            className={cn(
              base,
              variant,
              width,
              block.disabled && "cursor-not-allowed opacity-50 hover:translate-y-0",
            )}
          >
            {block.label || "Button"}
          </div>
        </div>
      );
    }

    case "image": {
      if (!block.url) {
        return (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Add an image URL
          </div>
        );
      }
      const img = (
        <img
          src={block.url}
          alt={block.alt ?? ""}
          className={cn(
            "w-full",
            block.fit === "contain" ? "object-contain" : "object-cover",
            block.rounded === "full" && "rounded-full",
            block.rounded === "lg" && "rounded-2xl",
            block.rounded === "md" && "rounded-lg",
            block.rounded === "sm" && "rounded",
          )}
        />
      );
      return block.link ? <div className="block">{img}</div> : img;
    }

    case "divider": {
      const spacing =
        block.spacing === "lg" ? "my-6" : block.spacing === "sm" ? "my-1" : "my-3";
      const style =
        block.style === "dashed"
          ? "border-dashed"
          : block.style === "dotted"
            ? "border-dotted"
            : "border-solid";
      return (
        <hr
          className={cn(
            "border-foreground/20",
            style,
            spacing,
            block.thickness === "medium" && "border-t-2",
            block.thickness === "thick" && "border-t-4",
          )}
        />
      );
    }

    case "spacer":
      return <div style={{ height: `${block.height ?? 24}px` }} aria-hidden />;

    case "social":
      if (block.links.length === 0) {
        return (
          <div className="text-center text-xs text-muted-foreground">
            No social links yet
          </div>
        );
      }
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {block.links.map((l) => {
            const Icon = SOCIAL_ICON[l.platform] ?? Globe;
            return (
              <span
                key={l.id}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground"
                aria-label={l.label || l.platform}
              >
                <Icon className="h-4 w-4" />
              </span>
            );
          })}
        </div>
      );

    default:
      return (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          {block.type} · coming soon
        </div>
      );
  }
}
