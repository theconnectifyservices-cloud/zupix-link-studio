import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Clock, Download, Mail, MapPin, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { toast } from "sonner";
import {
  downloadCsv,
  listBookings,
  updateBooking,
  type Booking,
  type BookingStatus,
} from "../api";

const TABS: (BookingStatus | "all")[] = [
  "all",
  "pending",
  "approved",
  "rescheduled",
  "completed",
  "rejected",
  "cancelled",
];

const STATUS_CLS: Record<BookingStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rescheduled: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  completed: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  rejected: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  cancelled: "bg-muted text-muted-foreground",
};

export function BookingsDashboard({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<BookingStatus | "all">("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["bio-bookings", workspaceId],
    queryFn: () => listBookings(workspaceId),
  });

  const mut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Booking> }) =>
      updateBooking(id, patch),
    onSuccess: () => {
      toast.success("Booking updated");
      void qc.invalidateQueries({ queryKey: ["bio-bookings", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(
    () => bookings.filter((b) => tab === "all" || b.status === tab),
    [bookings, tab],
  );

  if (isLoading) return <PageLoader label="Loading bookings" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={tab === s ? "default" : "outline"}
              onClick={() => setTab(s)}
              className="capitalize"
            >
              {s}
              {s !== "all" && (
                <span className="ml-1.5 opacity-70">
                  {bookings.filter((b) => b.status === s).length}
                </span>
              )}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          disabled={filtered.length === 0}
          onClick={() =>
            downloadCsv(
              `bookings-${new Date().toISOString().slice(0, 10)}.csv`,
              filtered.map((b) => ({
                requested_at: b.created_at,
                service: b.service_title,
                type: b.booking_kind,
                name: b.customer_name,
                email: b.email,
                phone: b.phone,
                date: b.booking_date,
                time: b.booking_time,
                duration_min: b.duration_min,
                timezone: b.timezone,
                location: b.location_type === "offline" ? b.location_address : b.meeting_link,
                status: b.status,
                notes: b.notes,
              })),
            )
          }
        >
          <Download className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-8 w-8" />}
          title="No booking requests"
          description="Add a Booking block to a bio page — requests land here for approval."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <BookingRow key={b.id} booking={b} onPatch={(patch) => mut.mutate({ id: b.id, patch })} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({
  booking: b,
  onPatch,
}: {
  booking: Booking;
  onPatch: (patch: Partial<Booking>) => void;
}) {
  const [reschedule, setReschedule] = useState(false);
  const [date, setDate] = useState(b.booking_date);
  const [time, setTime] = useState(b.booking_time);

  return (
    <Card className="space-y-3 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{b.customer_name}</span>
            <Badge variant="secondary" className={STATUS_CLS[b.status]}>
              {b.status}
            </Badge>
            {b.service_title && (
              <span className="text-[11px] text-muted-foreground">{b.service_title}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 shrink-0">
              <CalendarClock className="h-3 w-3" />
              {b.booking_date} · {b.booking_time}
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {b.duration_min ?? 30} min
            </span>
            {b.email && (
              <span className="inline-flex items-center gap-1 truncate max-w-[160px] sm:max-w-none">
                <Mail className="h-3 w-3 shrink-0" />
                {b.email}
              </span>
            )}
            {b.phone && (
              <span className="inline-flex items-center gap-1 shrink-0">
                <Phone className="h-3 w-3" />
                {b.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
              {b.location_type === "offline" ? (
                <MapPin className="h-3 w-3 shrink-0" />
              ) : (
                <Video className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{b.location_type === "offline" ? b.location_address || "In person" : "Online"}</span>
            </span>
          </div>
          {b.notes && <p className="mt-1 text-xs">{b.notes}</p>}
        </div>
      </div>

      {reschedule && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            className="h-9 w-auto"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            type="time"
            className="h-9 w-auto"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              onPatch({ booking_date: date, booking_time: time, status: "rescheduled" });
              setReschedule(false);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReschedule(false)}>
            Cancel
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" onClick={() => onPatch({ status: "approved" })}>
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPatch({ status: "rejected" })}>
          Reject
        </Button>
        <Button size="sm" variant="outline" onClick={() => setReschedule((v) => !v)}>
          Reschedule
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPatch({ status: "completed" })}>
          Completed
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onPatch({ status: "cancelled" })}>
          Cancelled
        </Button>
      </div>
    </Card>
  );
}
