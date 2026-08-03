import { useMemo, useState, type FormEvent } from "react";
import { CalendarClock, CheckCircle2, Clock, Loader2, MapPin, Video } from "lucide-react";
import type { BookingBlock } from "@/features/builder/types";
import { useRendererMode } from "@/features/builder/renderer-mode";
import { usePublicPage } from "../page-context";
import { submitBooking, trackBusiness } from "../submit";
import { BusinessCard, BusinessHeader } from "./business-surface";
import { cn } from "@/lib/utils";

const INPUT_CLS =
  "w-full rounded-lg border bg-background/70 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

const DAY_LABEL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Next 14 calendar days filtered to the configured available weekdays. */
function upcomingDates(days: number[]): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21 && out.length < 10; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (days.length === 0 || days.includes(d.getDay())) out.push(d);
  }
  return out;
}

/**
 * Lightweight 1:1 booking block. Requests post to `/api/public/bookings`
 * and land in Dashboard → Bookings for approval.
 */
export function BookingRender({ block }: { block: BookingBlock }) {
  const mode = useRendererMode();
  const page = usePublicPage();
  const isLive = mode === "public" && !!page;

  const dates = useMemo(() => upcomingDates(block.days ?? []), [block.days]);
  const slots = block.slots ?? [];

  const [date, setDate] = useState<string>(dates[0] ? iso(dates[0]) : "");
  const [time, setTime] = useState<string>(slots[0] ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || done) return;
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!date || !time) return setError("Please pick a date and time.");
    if (block.requirePhone && !phone.trim()) return setError("Please enter your phone number.");

    if (!isLive || !page) {
      setDone(true);
      return;
    }

    setBusy(true);
    const res = await submitBooking({
      pageId: page.pageId,
      slug: page.slug,
      blockId: block.id,
      serviceTitle: block.title || "Appointment",
      bookingKind: block.kind ?? "appointment",
      customerName: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      date,
      time,
      durationMin: block.durationMin ?? 30,
      timezone: block.timezone,
      locationType: block.locationType ?? "online",
      meetingLink: block.meetingLink,
      address: block.address,
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't send your request. Please try again.");
      return;
    }
    trackBusiness("booking_request", {
      blockId: block.id,
      blockType: "booking",
      label: block.title,
    });
    setDone(true);
  }

  if (done) {
    return (
      <BusinessCard style={block.cardStyle} radius={block.radius}>
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium">
            {block.confirmationMessage || "Thanks! Your booking request has been received."}
          </p>
        </div>
      </BusinessCard>
    );
  }

  return (
    <BusinessCard style={block.cardStyle} radius={block.radius}>
      <form className="p-4 sm:p-5" onSubmit={onSubmit} noValidate>
        <BusinessHeader title={block.title} description={block.description} />

        <div className="mb-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
            <Clock className="h-3 w-3" />
            {block.durationMin ?? 30} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
            {block.locationType === "offline" ? (
              <MapPin className="h-3 w-3" />
            ) : (
              <Video className="h-3 w-3" />
            )}
            {block.locationType === "offline"
              ? block.address || "In person"
              : block.meetingProvider === "zoom"
                ? "Zoom"
                : block.meetingProvider === "whatsapp"
                  ? "WhatsApp"
                  : block.meetingProvider === "custom"
                    ? "Online"
                    : "Google Meet"}
          </span>
          {block.timezone && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
              <CalendarClock className="h-3 w-3" />
              {block.timezone}
            </span>
          )}
        </div>

        <div className="mb-1 text-xs font-medium">Pick a date</div>
        <div className="-mx-1 mb-3 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
          {dates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No available days configured.</p>
          ) : (
            dates.map((d) => {
              const key = iso(d);
              const active = key === date;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDate(key)}
                  className={cn(
                    "min-h-[44px] shrink-0 snap-start rounded-xl border px-3 py-1.5 text-center transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted/60",
                  )}
                >
                  <span className="block text-[10px] uppercase opacity-80">
                    {DAY_LABEL[d.getDay()]}
                  </span>
                  <span className="block text-sm font-semibold">{d.getDate()}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="mb-1 text-xs font-medium">Pick a time</div>
        <div className="mb-4 flex flex-wrap gap-2">
          {slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">No time slots configured.</p>
          ) : (
            slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTime(s)}
                className={cn(
                  "min-h-[44px] rounded-lg border px-3 text-xs font-medium transition-colors",
                  s === time ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted/60",
                )}
              >
                {s}
              </button>
            ))
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">
              Name<span className="ml-0.5 text-destructive">*</span>
            </label>
            <input className={INPUT_CLS} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Email</label>
            <input type="email" className={INPUT_CLS} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className={cn(!block.requirePhone && "sm:col-span-2")}>
            <label className="mb-1 block text-xs font-medium">
              Phone{block.requirePhone && <span className="ml-0.5 text-destructive">*</span>}
            </label>
            <input type="tel" className={INPUT_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">Notes</label>
            <textarea rows={3} className={INPUT_CLS} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know?" />
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
          {block.submitLabel || "Request booking"}
        </button>
      </form>
    </BusinessCard>
  );
}
