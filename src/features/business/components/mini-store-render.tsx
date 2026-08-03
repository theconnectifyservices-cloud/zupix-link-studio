import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Download,
  ExternalLink,
  IndianRupee,
  MessageCircle,
  QrCode,
  ShoppingBag,
} from "lucide-react";
import type { MiniStoreBlock, StoreBadge, StoreItem } from "@/features/builder/types";
import { useRendererMode } from "@/features/builder/renderer-mode";
import { trackBusiness } from "../submit";
import { BusinessCard, BusinessHeader, businessSurface } from "./business-surface";
import { cn } from "@/lib/utils";

const BADGE_STYLE: Record<Exclude<StoreBadge, "none">, string> = {
  new: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  popular: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
  limited: "bg-rose-500/15 text-rose-500 ring-rose-500/30",
};

const BADGE_LABEL: Record<Exclude<StoreBadge, "none">, string> = {
  new: "NEW",
  popular: "POPULAR",
  limited: "LIMITED",
};

function defaultLabel(item: StoreItem): string {
  switch (item.kind) {
    case "digital":
      return "Download";
    case "service":
      return "Enquire";
    case "payment_link":
      return "Pay now";
    case "buy_now":
      return "Buy now";
    case "whatsapp":
      return "Order on WhatsApp";
    case "upi_qr":
      return "Pay via UPI";
    case "razorpay":
      return "Pay with Razorpay";
    default:
      return "Open";
  }
}

function actionIcon(kind: StoreItem["kind"]) {
  switch (kind) {
    case "digital":
      return Download;
    case "whatsapp":
      return MessageCircle;
    case "upi_qr":
      return QrCode;
    case "payment_link":
    case "razorpay":
    case "buy_now":
      return IndianRupee;
    default:
      return ExternalLink;
  }
}

function trackKind(kind: StoreItem["kind"]) {
  switch (kind) {
    case "whatsapp":
      return "whatsapp_order" as const;
    case "payment_link":
      return "payment_link_click" as const;
    case "buy_now":
    case "razorpay":
    case "upi_qr":
      return "buy_now_click" as const;
    default:
      return "product_click" as const;
  }
}

function upiUri(item: StoreItem): string {
  const params = new URLSearchParams();
  params.set("pa", item.upiId ?? "");
  if (item.payeeName) params.set("pn", item.payeeName);
  if (item.price) params.set("am", String(item.price));
  params.set("cu", "INR");
  params.set("tn", item.title.slice(0, 40));
  return `upi://pay?${params.toString()}`;
}

/**
 * Mini Store — a handful of digital products, services and payment actions.
 * Deliberately no cart, checkout, inventory, variants or shipping: full
 * commerce lives in CartBridge, not here.
 */
export function MiniStoreRender({ block }: { block: MiniStoreBlock }) {
  const items = block.items ?? [];
  const currency = block.currency ?? "₹";
  const cols = block.layout === "list" ? 1 : (block.columns ?? 2);

  if (items.length === 0) {
    return (
      <BusinessCard style={block.cardStyle} radius={block.radius}>
        <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
          <ShoppingBag className="h-6 w-6" />
          <p className="text-xs">Add items in the settings panel</p>
        </div>
      </BusinessCard>
    );
  }

  return (
    <section>
      <BusinessHeader title={block.title} description={block.description} />
      <div
        className={cn(
          "grid gap-3",
          cols === 1 && "grid-cols-1",
          cols === 2 && "grid-cols-1 sm:grid-cols-2",
          cols === 3 && "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <StoreItemCard
            key={item.id}
            item={item}
            block={block}
            currency={currency}
            list={block.layout === "list"}
          />
        ))}
      </div>
    </section>
  );
}

function StoreItemCard({
  item,
  block,
  currency,
  list,
}: {
  item: StoreItem;
  block: MiniStoreBlock;
  currency: string;
  list: boolean;
}) {
  const mode = useRendererMode();
  const [qrOpen, setQrOpen] = useState(false);
  const Icon = actionIcon(item.kind);
  const image = item.image || item.coverImage;
  const badge = item.badge && item.badge !== "none" ? item.badge : null;

  const href = (() => {
    switch (item.kind) {
      case "digital":
        return item.downloadUrl || item.url || "";
      case "whatsapp": {
        const num = (item.whatsappNumber ?? "").replace(/\D/g, "");
        if (!num) return "";
        const msg = item.whatsappMessage || `Hi! I'd like to order: ${item.title}`;
        return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
      }
      case "upi_qr":
        return "";
      default:
        return item.url || "";
    }
  })();

  const onAct = () => {
    trackBusiness(trackKind(item.kind), {
      blockId: block.id,
      blockType: "store",
      label: item.title,
    });
    if (item.kind === "upi_qr") setQrOpen((v) => !v);
  };

  return (
    <div
      className={cn(
        "group flex overflow-hidden transition-transform duration-300 will-change-transform hover:-translate-y-1",
        businessSurface(block.cardStyle),
        list ? "flex-row items-stretch" : "flex-col",
      )}
      style={{ borderRadius: block.radius ?? 18 }}
    >
      {image && (
        <div className={cn("relative overflow-hidden bg-muted", list ? "w-28 shrink-0" : "aspect-[4/3] w-full")}>
          <img
            src={image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            width={640}
            height={480}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start gap-2">
          <h4 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{item.title}</h4>
          {badge && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1",
                BADGE_STYLE[badge],
              )}
            >
              {BADGE_LABEL[badge]}
            </span>
          )}
        </div>
        {item.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
        )}
        {block.showPrice !== false && item.price != null && (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold">
              {currency}
              {item.price}
            </span>
            {item.oldPrice != null && item.oldPrice > item.price && (
              <span className="text-xs text-muted-foreground line-through">
                {currency}
                {item.oldPrice}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-1">
          {item.kind === "upi_qr" || !href ? (
            <button
              type="button"
              onClick={onAct}
              disabled={mode === "builder" && item.kind !== "upi_qr"}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <Icon className="h-4 w-4" />
              {item.buttonLabel || defaultLabel(item)}
            </button>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onAct}
              data-block-id={block.id}
              data-block-type="store"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Icon className="h-4 w-4" />
              {item.buttonLabel || defaultLabel(item)}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
            </a>
          )}
        </div>

        {item.kind === "upi_qr" && qrOpen && <UpiQr item={item} />}
      </div>
    </div>
  );
}

function UpiQr({ item }: { item: StoreItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const uri = item.upiId ? upiUri(item) : "";

  useEffect(() => {
    if (item.upiQrImage || !uri || !ref.current) return;
    let cancelled = false;
    const host = ref.current;
    void (async () => {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled) return;
      host.innerHTML = "";
      const qr = new QRCodeStyling({
        width: 180,
        height: 180,
        data: uri,
        dotsOptions: { color: "#111827", type: "rounded" },
        backgroundOptions: { color: "#ffffff" },
      });
      qr.append(host);
    })();
    return () => {
      cancelled = true;
    };
  }, [uri, item.upiQrImage]);

  if (!item.upiQrImage && !uri) {
    return <p className="pt-2 text-[11px] text-muted-foreground">Add a UPI ID or QR image.</p>;
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-1.5 rounded-lg bg-white p-3">
      {item.upiQrImage ? (
        <img
          src={item.upiQrImage}
          alt={`UPI QR for ${item.title}`}
          loading="lazy"
          width={180}
          height={180}
          className="h-[180px] w-[180px] object-contain"
        />
      ) : (
        <div ref={ref} className="h-[180px] w-[180px]" />
      )}
      {item.upiId && <span className="text-[11px] font-medium text-gray-700">{item.upiId}</span>}
    </div>
  );
}
