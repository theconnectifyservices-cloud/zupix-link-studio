import type { LucideIcon } from "lucide-react";
import {
  User,
  Type,
  AlignLeft,
  MousePointerClick,
  Image as ImageIcon,
  Minus,
  Share2,
  Video,
  Images,
  Code,
  FileCode,
  ClipboardList,
  ShoppingBag,
  CalendarClock,
  Timer,
  Map as MapIcon,
  HelpCircle,
  MessageSquareQuote,
} from "lucide-react";
import type { Block, BlockType } from "./types";
import { newId } from "./types";

export interface BlockDef {
  type: BlockType;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "essentials" | "media" | "advanced" | "commerce";
  available: boolean; // false = disabled tile, foundation-only
  create: () => Block;
}

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: "profile",
    label: "Profile",
    description: "Avatar, name and bio",
    icon: User,
    group: "essentials",
    available: true,
    create: () => ({
      id: newId(),
      type: "profile",
      displayName: "Your name",
      bio: "A short line about you.",
    }),
  },
  {
    type: "heading",
    label: "Heading",
    description: "Section title",
    icon: Type,
    group: "essentials",
    available: true,
    create: () => ({ id: newId(), type: "heading", text: "New heading", align: "center" }),
  },
  {
    type: "text",
    label: "Text",
    description: "Paragraph text",
    icon: AlignLeft,
    group: "essentials",
    available: true,
    create: () => ({
      id: newId(),
      type: "text",
      text: "Write something…",
      align: "left",
    }),
  },
  {
    type: "button",
    label: "Button",
    description: "Link to anywhere",
    icon: MousePointerClick,
    group: "essentials",
    available: true,
    create: () => ({
      id: newId(),
      type: "button",
      label: "Visit link",
      url: "https://",
      style: "filled",
    }),
  },
  {
    type: "image",
    label: "Image",
    description: "Single image",
    icon: ImageIcon,
    group: "media",
    available: true,
    create: () => ({ id: newId(), type: "image", url: "", alt: "", rounded: "md" }),
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator",
    icon: Minus,
    group: "essentials",
    available: true,
    create: () => ({ id: newId(), type: "divider", thickness: "thin" }),
  },
  {
    type: "social",
    label: "Social icons",
    description: "Row of social links",
    icon: Share2,
    group: "essentials",
    available: true,
    create: () => ({ id: newId(), type: "social", links: [] }),
  },
  // Foundation-only (future phases)
  { type: "video", label: "Video", description: "Coming soon", icon: Video, group: "media", available: false, create: () => ({ id: newId(), type: "video" }) },
  { type: "gallery", label: "Gallery", description: "Coming soon", icon: Images, group: "media", available: false, create: () => ({ id: newId(), type: "gallery" }) },
  { type: "embed", label: "Embed", description: "Coming soon", icon: Code, group: "advanced", available: false, create: () => ({ id: newId(), type: "embed" }) },
  { type: "html", label: "HTML", description: "Coming soon", icon: FileCode, group: "advanced", available: false, create: () => ({ id: newId(), type: "html" }) },
  { type: "form", label: "Form", description: "Coming soon", icon: ClipboardList, group: "advanced", available: false, create: () => ({ id: newId(), type: "form" }) },
  { type: "store", label: "Store", description: "Coming soon", icon: ShoppingBag, group: "commerce", available: false, create: () => ({ id: newId(), type: "store" }) },
  { type: "booking", label: "Booking", description: "Coming soon", icon: CalendarClock, group: "commerce", available: false, create: () => ({ id: newId(), type: "booking" }) },
  { type: "countdown", label: "Countdown", description: "Coming soon", icon: Timer, group: "advanced", available: false, create: () => ({ id: newId(), type: "countdown" }) },
  { type: "map", label: "Map", description: "Coming soon", icon: MapIcon, group: "advanced", available: false, create: () => ({ id: newId(), type: "map" }) },
  { type: "faq", label: "FAQ", description: "Coming soon", icon: HelpCircle, group: "advanced", available: false, create: () => ({ id: newId(), type: "faq" }) },
  { type: "testimonials", label: "Testimonials", description: "Coming soon", icon: MessageSquareQuote, group: "advanced", available: false, create: () => ({ id: newId(), type: "testimonials" }) },
];

export function getBlockDef(type: BlockType): BlockDef | undefined {
  return BLOCK_DEFS.find((d) => d.type === type);
}

export function blockLabel(block: Block): string {
  if (block.name) return block.name;
  const def = getBlockDef(block.type);
  return def?.label ?? block.type;
}
