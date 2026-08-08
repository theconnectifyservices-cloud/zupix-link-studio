import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  IndianRupee,
  MessageCircle,
  QrCode,
  ShoppingBag,
  X,
} from "lucide-react";
import type {
  MiniStoreBlock,
  StoreBadge,
  StoreItem,
  StoreItemAction,
} from "@/features/builder/types";
import { useRendererMode } from "@/features/builder/renderer-mode";
import { trackBusiness } from "../submit";
import { BusinessCard, BusinessHeader, businessSurface } from "./business-surface";
import { cn } from "@/lib/utils";

const BADGE_STYLE: Record<Exclude<StoreBadge, "none">, string> = {
  new: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  hot: "bg-orange-500/15 text-orange-500 ring-orange-500/30",
  best_seller: "bg-violet-500/15 text-violet-500 ring-violet-500/30",
  limited: "bg-rose-500/15 text-rose-500 ring-rose-500/30",
  sale: "bg-sky-500/15 text-sky-500 ring-sky-500/30",
  popular: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
};

const BADGE_LABEL: Record<Exclude<StoreBadge, "none">, string> = {
  new: "NEW",
  hot: "HOT",
  best_seller: "BEST SELLER",
  limited: "LIMITED",
  sale: "SALE",
  popular: "POPULAR",
};

/** Resolves the effective action of an item (explicit, else derived from kind). */
function itemAction(item: StoreItem): StoreItemAction {
  if (item.action) return item.action;
  switch (item.kind) {
    case "digital":
      return "download";
    case "whatsapp":
      return "whatsapp";
    case "payment_link":
    case "razorpay":
      return "payment_link";
    case "buy_now":
    case "upi_qr":
      return "buy_now";
    default:
      return "external";
  }
}

function defaultLabel(item: StoreItem): string {
  switch (itemAction(item)) {
    case "download":
      return "Download";
    case "payment_link":
      return "Pay now";
    case "buy_now":
      return "Buy now";
    case "whatsapp":
      return "Order on WhatsApp";
    default:
      return item.kind === "service" ? "Enquire" : "Open";
  }
}

function actionIcon(item: StoreItem) {
  switch (itemAction(item)) {
    case "download":
      return Download;
    case "whatsapp":
      return MessageCircle;
    case "payment_link":
    case "buy_now":
      return item.kind === "upi_qr" ? QrCode : IndianRupee;
    default:
      return ExternalLink;
  }
}

function trackKind(item: StoreItem) {
  switch (itemAction(item)) {
    case "whatsapp":
      return "whatsapp_order" as const;
    case "payment_link":
      return "payment_link_click" as const;
    case "buy_now":
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

function itemHref(item: StoreItem): string {
  switch (itemAction(item)) {
    case "download":
      return item.downloadUrl || item.url || "";
    case "whatsapp": {
      const num = (item.whatsappNumber ?? "").replace(/\D/g, "");
      if (!num) return "";
      const msg = item.whatsappMessage || `Hi! I'd like to order: ${item.title}`;
      return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
    }
    default:
      if (item.kind === "upi_qr") return "";
      return item.url || "";
  }
}

function shadowClass(shadow: MiniStoreBlock["shadow"]): string {
  switch (shadow) {
    case "none":
      return "shadow-none";
    case "sm":
      return "shadow-sm";
    case "lg":
      return "shadow-xl";
    case "md":
    default:
      return "shadow-md";
  }
}

function hoverClass(anim: MiniStoreBlock["hoverAnimation"]): string {
  switch (anim) {
    case "none":
      return "";
    case "zoom":
      return "hover:scale-[1.02]";
    case "glow":
      return "hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.4),0_18px_40px_-18px_hsl(var(--primary)/0.55)]";
    case "lift":
    default:
      return "hover:-translate-y-1";
  }
}

/** Layout presets that also imply a card surface. */
function layoutCardStyle(block: MiniStoreBlock) {
  if (block.layout === "glass") return "glass" as const;
  if (block.layout === "modern") return "solid" as const;
  return block.cardStyle;
}

/**
 * Mini Store — a handful of digital products, services and payment actions.
 * Deliberately no cart, checkout, inventory, variants or shipping: full
 * commerce lives in CartBridge, not here.
 */
export function MiniStoreRender({ block }: { block: MiniStoreBlock }) {
  const items = useMemo(() => (block.items ?? []).filter((i) => !i.hidden), [block.items]);
  const currency = block.currency ?? "₹";
  const cols =
    block.layout === "list" || block.layout === "featured" ? 1 : (block.columns ?? 2);
  const gap = block.gap ?? 12;
  const [detail, setDetail] = useState<StoreItem | null>(null);

  const openDetail = useCallback(
    (item: StoreItem) => {
      if (block.detailPopup === false) return;
      trackBusiness("product_view", {
        blockId: block.id,
        blockType: "store",
        label: item.title,
      });
      setDetail(item);
    },
    [block.detailPopup, block.id],
  );

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

  const cards = items.map((item, index) => (
    <StoreItemCard
      key={item.id}
      item={item}
      index={index}
      block={block}
      currency={currency}
      onOpen={openDetail}
    />
  ));

  return (
    <section
      style={{
        background: block.background || undefined,
        padding: block.spacing ? `${block.spacing}px` : undefined,
        borderRadius: block.background && block.radius ? block.radius : undefined,
      }}
    >
      <BusinessHeader title={block.title} description={block.subtitle ?? block.description} />
      {block.divider && <div className="mb-4 h-px w-full bg-border" />}

      {block.layout === "carousel" ? (
        <StoreCarousel gap={gap}>{cards}</StoreCarousel>
      ) : (
        <div
          className={cn(
            "grid",
            cols === 1 && "grid-cols-1",
            cols === 2 && "grid-cols-1 sm:grid-cols-2",
            cols === 3 && "grid-cols-2 sm:grid-cols-3",
          )}
          style={{ gap }}
        >
          {cards}
        </div>
      )}

      {detail && (
        <StoreDetailDialog
          item={detail}
          block={block}
          currency={currency}
          items={items}
          onSelect={(next) => setDetail(next)}
          onClose={() => setDetail(null)}
        />
      )}
    </section>
  );
}

/** Horizontal snap rail — lightweight, no carousel dependency. */
function StoreCarousel({ gap, children }: { gap: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className="relative">
      <div
        ref={ref}
        className="hide-scrollbar -mx-1 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-1 pb-1"
        style={{ gap }}
      >
        {Array.isArray(children)
          ? children.map((c, i) => (
              <div key={i} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[32%]">
                {c}
              </div>
            ))
          : children}
      </div>
      {false && (
        <div className="mt-2 flex justify-end gap-1.5">
          <button
            type="button"
            aria-label="Previous items"
            onClick={() => scrollBy(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card/70 backdrop-blur transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next items"
            onClick={() => scrollBy(1)}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card/70 backdrop-blur transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function StoreItemCard({
  item,
  index,
  block,
  currency,
  onOpen,
}: {
  item: StoreItem;
  index: number;
  block: MiniStoreBlock;
  currency: string;
  onOpen: (item: StoreItem) => void;
}) {
  const mode = useRendererMode();
  const [qrOpen, setQrOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(
    () => !block.entranceAnimation || block.entranceAnimation === "none",
  );

  // Entrance animation is client-only so SSR and hydration render the same DOM.
  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  const Icon = actionIcon(item);
  const image = item.coverImage || item.image;
  const badge = block.showBadge !== false && item.badge && item.badge !== "none" ? item.badge : null;
  const list = block.layout === "list" || block.layout === "compact";
  const featured = block.layout === "featured";
  const compact = block.layout === "compact";
  const href = itemHref(item);
  const itemCurrency = item.currency || currency;

  const onAct = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackBusiness(trackKind(item), {
      blockId: block.id,
      blockType: "store",
      label: item.title,
    });
    if (item.kind === "upi_qr" && !href) setQrOpen((v) => !v);
  };

  return (
    <div
      ref={ref}
      role={block.detailPopup === false ? undefined : "button"}
      tabIndex={block.detailPopup === false ? undefined : 0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className={cn(
        "group flex h-full overflow-hidden transition-all duration-300 will-change-transform",
        businessSurface(layoutCardStyle(block)),
        shadowClass(block.shadow),
        hoverClass(block.hoverAnimation),
        block.detailPopup === false ? "" : "cursor-pointer",
        list ? "flex-row items-stretch" : "flex-col",
        block.entranceAnimation && block.entranceAnimation !== "none"
          ? shown
            ? "translate-y-0 opacity-100"
            : cn("opacity-0", block.entranceAnimation === "rise" && "translate-y-3")
          : "",
      )}
      style={{
        borderRadius: block.radius ?? 18,
        transitionDelay: shown ? `${Math.min(index, 6) * 60}ms` : undefined,
      }}
    >
      {block.showImage !== false && image && (
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            list ? (compact ? "w-20 shrink-0" : "w-28 shrink-0") : "w-full",
          )}
          style={list ? undefined : { aspectRatio: featured ? "16 / 9" : "4 / 3" }}
        >
          <img
            src={image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            width={featured ? 1280 : 640}
            height={featured ? 720 : 480}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {badge && (
            <span
              className={cn(
                "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ring-1 backdrop-blur",
                BADGE_STYLE[badge],
              )}
            >
              {BADGE_LABEL[badge]}
            </span>
          )}
        </div>
      )}
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2", compact ? "p-2.5" : "p-3")}>
        <div className="flex items-start gap-2">
          <h4
            className={cn(
              "min-w-0 flex-1 font-semibold leading-snug",
              featured ? "text-base" : "text-sm",
            )}
          >
            {item.title}
          </h4>
          {badge && (!image || block.showImage === false) && (
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
        {block.showDescription !== false && item.description && (
          <p className={cn("text-xs text-muted-foreground", compact ? "line-clamp-1" : "line-clamp-2")}>
            {item.description}
          </p>
        )}
        {block.showPrice !== false && item.price != null && (
          <div className="flex items-baseline gap-2">
            <span className={cn("font-bold", featured ? "text-lg" : "text-base")}>
              {itemCurrency}
              {item.price}
            </span>
            {block.showOldPrice !== false && item.oldPrice != null && item.oldPrice > item.price && (
              <span className="text-xs text-muted-foreground line-through">
                {itemCurrency}
                {item.oldPrice}
              </span>
            )}
          </div>
        )}

        {block.showButton !== false && (
          <div className="mt-auto pt-1">
            {!href ? (
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
        )}

        {item.kind === "upi_qr" && qrOpen && <UpiQr item={item} />}
      </div>
    </div>
  );
}

/** Product detail popup with gallery, full description and related items. */
function StoreDetailDialog({
  item,
  block,
  currency,
  items,
  onSelect,
  onClose,
}: {
  item: StoreItem;
  block: MiniStoreBlock;
  currency: string;
  items: StoreItem[];
  onSelect: (item: StoreItem) => void;
  onClose: () => void;
}) {
  const images = [item.coverImage || item.image, ...(item.gallery ?? [])].filter(
    Boolean,
  ) as string[];
  const [active, setActive] = useState(0);
  const href = itemHref(item);
  const Icon = actionIcon(item);
  const itemCurrency = item.currency || currency;
  const related = items.filter((i) => i.id !== item.id).slice(0, 4);

  useEffect(() => {
    setActive(0);
  }, [item.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border bg-card p-4 shadow-2xl sm:rounded-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border bg-card/80 backdrop-blur transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>

        {images.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "4 / 3" }}>
            <img
              src={images[active]}
              alt={item.title}
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {images.length > 1 && (
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "h-14 w-14 shrink-0 overflow-hidden rounded-lg border",
                  i === active && "ring-2 ring-primary",
                )}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <h3 className="pr-10 text-lg font-semibold leading-snug">{item.title}</h3>
        {item.price != null && (
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold">
              {itemCurrency}
              {item.price}
            </span>
            {item.oldPrice != null && item.oldPrice > item.price && (
              <span className="text-sm text-muted-foreground line-through">
                {itemCurrency}
                {item.oldPrice}
              </span>
            )}
          </div>
        )}
        {(item.longDescription || item.description) && (
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {item.longDescription || item.description}
          </p>
        )}

        <div className="mt-4">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackBusiness(trackKind(item), {
                  blockId: block.id,
                  blockType: "store",
                  label: item.title,
                })
              }
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Icon className="h-4 w-4" />
              {item.buttonLabel || defaultLabel(item)}
            </a>
          ) : item.kind === "upi_qr" ? (
            <UpiQr item={item} />
          ) : null}
        </div>

        {block.showRelated !== false && related.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              You may also like
            </div>
            <div className="grid grid-cols-2 gap-2">
              {related.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    trackBusiness("product_view", {
                      blockId: block.id,
                      blockType: "store",
                      label: r.title,
                    });
                    onSelect(r);
                  }}
                  className="flex items-center gap-2 rounded-lg border p-2 text-left transition-colors hover:bg-muted"
                >
                  {(r.coverImage || r.image) && (
                    <img
                      src={r.coverImage || r.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={80}
                      height={80}
                      className="h-10 w-10 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">{r.title}</span>
                    {r.price != null && (
                      <span className="block text-[11px] text-muted-foreground">
                        {r.currency || currency}
                        {r.price}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UpiQr({ item }: { item: StoreItem }) {
  const uri = upiUri(item);
  const qr =
    item.upiQrImage ||
    `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(uri)}`;
  return (
    <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border bg-background/60 p-3">
      <img
        src={qr}
        alt={`UPI QR for ${item.title}`}
        loading="lazy"
        decoding="async"
        width={160}
        height={160}
        className="h-40 w-40 rounded-md bg-white p-1"
      />
      {item.upiId && <p className="text-[11px] text-muted-foreground">{item.upiId}</p>}
      <a
        href={uri}
        className="text-[11px] font-semibold text-primary underline-offset-2 hover:underline"
      >
        Open UPI app
      </a>
    </div>
  );
}
