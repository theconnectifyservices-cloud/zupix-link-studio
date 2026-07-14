import type { Block } from "./types";
import { cn } from "@/lib/utils";
import {
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  Globe,
  Music2,
  type LucideIcon,
} from "lucide-react";

const SOCIAL_ICON: Record<string, LucideIcon> = {
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: Music2,
  linkedin: Linkedin,
  github: Github,
  website: Globe,
};

/** Renders a block in the live preview. Read-only visual output. */
export function BlockRenderer({ block }: { block: Block }) {
  if (block.hidden) return null;

  switch (block.type) {
    case "profile":
      return (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
            {block.avatarUrl ? (
              <img src={block.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (block.displayName ?? "?").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="text-base font-semibold">{block.displayName}</div>
            {block.bio && (
              <div className="mt-1 text-xs text-muted-foreground">{block.bio}</div>
            )}
          </div>
        </div>
      );

    case "heading":
      return (
        <h2
          className={cn(
            "text-lg font-bold",
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
          className={cn(
            "text-sm text-foreground/80 whitespace-pre-wrap",
            block.align === "center" && "text-center",
            block.align === "right" && "text-right",
          )}
        >
          {block.text}
        </p>
      );

    case "button": {
      const base = "block w-full rounded-full py-3 text-center text-sm font-medium transition-transform hover:-translate-y-0.5";
      const variant =
        block.style === "outline"
          ? "border border-foreground/30 text-foreground"
          : block.style === "soft"
            ? "bg-muted text-foreground"
            : "bg-foreground text-background";
      return <div className={cn(base, variant)}>{block.label || "Button"}</div>;
    }

    case "image":
      if (!block.url) {
        return (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Add an image URL
          </div>
        );
      }
      return (
        <img
          src={block.url}
          alt={block.alt ?? ""}
          className={cn(
            "w-full object-cover",
            block.rounded === "full" && "rounded-full",
            block.rounded === "lg" && "rounded-2xl",
            block.rounded === "md" && "rounded-lg",
            block.rounded === "sm" && "rounded",
          )}
        />
      );

    case "divider":
      return (
        <hr
          className={cn(
            "border-foreground/10",
            block.thickness === "medium" && "border-t-2",
            block.thickness === "thick" && "border-t-4",
          )}
        />
      );

    case "social":
      if (block.links.length === 0) {
        return (
          <div className="text-center text-xs text-muted-foreground">
            No social links yet
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center gap-3">
          {block.links.map((l) => {
            const Icon = SOCIAL_ICON[l.platform] ?? Globe;
            return (
              <span
                key={l.id}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground"
                aria-label={l.platform}
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
