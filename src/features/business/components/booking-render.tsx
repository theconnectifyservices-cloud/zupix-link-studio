import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, CalendarClock, Clock, MapPin, Video, Trash2, Plus } from "lucide-react";
import type { BookingBlock } from "@/features/builder/types";
import { useRendererMode } from "@/features/builder/renderer-mode";
import { usePublicPage } from "../page-context";
import { submitBooking, trackBusiness } from "../submit";
import { BusinessCard, BusinessHeader } from "./business-surface";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INPUT_CLS =
  "w-full rounded-lg border bg-background/70 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function BookingRender({ block }: { block: BookingBlock }) {
  const mode = useRendererMode();
  const page = usePublicPage();
  const isLive = mode === "public" && !!page;

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => block.services.find((s) => s.id === selectedServiceId),
    [block.services, selectedServiceId]
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!service || busy || done) return;
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!date || !time) return setError("Please pick a date and time.");

    if (!isLive || !page) {
      setDone(true);
      return;
    }

    setBusy(true);
    const res = await submitBooking({
      pageId: page.pageId,
      slug: page.slug,
      blockId: block.id,
      serviceTitle: service.title,
      bookingKind: service.kind,
      customerName: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      date,
      time,
      durationMin: service.durationMin,
      locationType: service.locationType,
      meetingLink: service.meetingLink,
      address: service.address,
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't send your request. Please try again.");
      return;
    }
    trackBusiness("booking_request", {
      blockId: block.id,
      blockType: "booking",
      label: service.title,
    });
    setDone(true);
  }

  if (done) {
    return (
      <BusinessCard style={block.cardStyle} radius={block.radius}>
        <div className="flex flex-col items-center gap-2 p-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium">
            Thanks! Your booking request has been received.
          </p>
        </div>
      </BusinessCard>
    );
  }

  if (!service) {
    return (
      <BusinessCard style={block.cardStyle} radius={block.radius}>
        <div className="p-4 sm:p-5">
          <BusinessHeader title={block.title} description={block.description} />
          <div className={cn("grid gap-3", block.layout === "grid" && "sm:grid-cols-2")}>
            {block.services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className="flex flex-col gap-2 rounded-xl border p-4 text-left transition-hover hover:border-primary"
              >
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.durationMin} min</div>
              </button>
            ))}
          </div>
        </div>
      </BusinessCard>
    );
  }

  return (
    <BusinessCard style={block.cardStyle} radius={block.radius}>
      <form className="p-4 sm:p-5" onSubmit={onSubmit} noValidate>
        <button
          type="button"
          onClick={() => setSelectedServiceId(null)}
          className="mb-2 text-xs text-primary hover:underline"
        >
          ← Back to services
        </button>
        <BusinessHeader title={service.title} description={service.description} />

        <div className="grid gap-3 sm:grid-cols-2">
           <div>
            <label className="mb-1 block text-xs font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
           </div>
           <div>
            <label className="mb-1 block text-xs font-medium">Time</label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
           </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Name<span className="text-destructive">*</span></label>
            <Input className={INPUT_CLS} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Email</label>
            <Input type="email" className={INPUT_CLS} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">Phone</label>
            <Input type="tel" className={INPUT_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">Notes</label>
            <Textarea className={INPUT_CLS} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}

        <Button type="submit" disabled={busy} className="mt-4 w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4 mr-2" />}
          Request booking
        </Button>
      </form>
    </BusinessCard>
  );
}
