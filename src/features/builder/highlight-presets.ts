import type { HighlightCard, HighlightCardsBlock } from "./types";
import { newId } from "./types";

export interface HighlightPreset {
  key: string;
  label: string;
  description: string;
  /** Partial block config applied on top of the current block. */
  apply: () => Partial<HighlightCardsBlock> & { cards: HighlightCard[] };
}

function cards(list: Array<[string, string, string?]>): HighlightCard[] {
  return list.map(([emoji, title, description]) => ({
    id: newId(),
    iconKind: "emoji" as const,
    emoji,
    title,
    description,
  }));
}

export const HIGHLIGHT_PRESETS: HighlightPreset[] = [
  {
    key: "payments",
    label: "Payment Methods",
    description: "UPI, cards, wallets",
    apply: () => ({
      title: "We accept",
      layout: "scroll",
      cardStyle: "glass",
      align: "center",
      cards: cards([
        ["🇮🇳", "UPI", "GPay, PhonePe, Paytm"],
        ["💳", "Cards", "Visa, Mastercard, RuPay"],
        ["🏦", "Net Banking", "All major banks"],
        ["👛", "Wallets", "Paytm, Amazon Pay"],
        ["📄", "EMI", "No-cost options"],
      ]),
    }),
  },
  {
    key: "trust",
    label: "Trust Badges",
    description: "Security and guarantees",
    apply: () => ({
      title: "Why you can trust us",
      layout: "grid",
      cardStyle: "solid",
      align: "center",
      cards: cards([
        ["🔒", "Secure Payments", "256-bit SSL encryption"],
        ["✅", "Verified Business", "GST registered"],
        ["↩️", "Easy Refunds", "7-day money back"],
        ["⭐", "4.9/5 Rating", "From 2,400+ customers"],
      ]),
    }),
  },
  {
    key: "features",
    label: "Key Features",
    description: "Product highlights",
    apply: () => ({
      title: "Key features",
      layout: "grid",
      cardStyle: "gradient",
      align: "left",
      cards: cards([
        ["⚡", "Lightning Fast", "Loads in under a second"],
        ["🎨", "Fully Customisable", "Every colour and font"],
        ["📱", "Mobile First", "Looks great everywhere"],
        ["🔗", "Unlimited Links", "Grow without limits"],
      ]),
    }),
  },
  {
    key: "benefits",
    label: "Benefits",
    description: "What customers gain",
    apply: () => ({
      title: "What you get",
      layout: "centered",
      cardStyle: "glass",
      align: "center",
      cards: cards([
        ["🚀", "More Conversions", "Turn visitors into buyers"],
        ["⏱️", "Save Time", "Set up in minutes"],
        ["📈", "Real Insights", "Know what works"],
      ]),
    }),
  },
  {
    key: "services",
    label: "Services",
    description: "What you offer",
    apply: () => ({
      title: "Our services",
      layout: "carousel",
      cardStyle: "solid",
      align: "left",
      cards: cards([
        ["💼", "Consulting", "Strategy and planning"],
        ["🛠️", "Implementation", "Done-for-you setup"],
        ["📣", "Marketing", "Campaigns that convert"],
        ["🤝", "Support", "Priority assistance"],
      ]),
    }),
  },
  {
    key: "tech",
    label: "Technologies",
    description: "Your stack",
    apply: () => ({
      title: "Built with",
      layout: "scroll",
      cardStyle: "outline",
      align: "center",
      cards: cards([
        ["⚛️", "React"],
        ["🟩", "Node.js"],
        ["🐘", "PostgreSQL"],
        ["☁️", "Cloud Hosting"],
        ["🎯", "TypeScript"],
      ]),
    }),
  },
  {
    key: "certifications",
    label: "Certifications",
    description: "Credentials and awards",
    apply: () => ({
      title: "Certified & recognised",
      layout: "masonry",
      cardStyle: "glass",
      align: "left",
      cards: cards([
        ["🏅", "ISO 9001:2015", "Quality management"],
        ["🎓", "Certified Partner", "Official programme"],
        ["🛡️", "GDPR Compliant", "Privacy by design"],
        ["🏆", "Award Winner", "Best of 2025"],
      ]),
    }),
  },
];
