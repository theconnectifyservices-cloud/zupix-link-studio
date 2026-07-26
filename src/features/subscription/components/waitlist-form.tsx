import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "../waitlist.functions";
import { useSession } from "@/features/auth/hooks/use-session";
import { toast } from "sonner";
import type { PlanCode } from "../plans";

export function WaitlistForm({ planCode }: { planCode: PlanCode }) {
  const session = useSession();
  const defaultEmail = session.status === "authenticated" ? session.session.user.email ?? "" : "";
  const [email, setEmail] = useState(defaultEmail);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const join = useServerFn(joinWaitlist);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      await join({ data: { planCode, email } });
      setSubmitted(true);
      toast.success("You're on the waitlist! We'll email you when Shikhar launches.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to join waitlist";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        You're on the list. We'll notify {email} at launch.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Input
        type="email"
        required
        placeholder="you@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        Notify me
      </Button>
    </form>
  );
}
