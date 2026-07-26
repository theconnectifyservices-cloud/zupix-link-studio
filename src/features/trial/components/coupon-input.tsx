/**
 * Inline coupon-code input used in the upgrade modal / checkout.
 * Server-validated via public.validate_coupon.
 */
import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useValidateCoupon } from "../hooks";

interface Props {
  planCode: string;
  cycle: string;
  amountMinor: number;
  onApplied?: (r: { code: string; discountMinor: number; couponId: string }) => void;
  className?: string;
}

export function CouponInput({ planCode, cycle, amountMinor, onApplied, className }: Props) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discountMinor: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const validate = useValidateCoupon();

  async function apply() {
    setError(null);
    if (!code.trim()) return;
    const res = await validate.mutateAsync({ code: code.trim(), planCode, cycle, amountMinor });
    if (!res.valid) {
      setError(res.reason || "Invalid coupon");
      return;
    }
    setApplied({ code: code.trim().toUpperCase(), discountMinor: res.discountMinor });
    onApplied?.({ code: code.trim().toUpperCase(), discountMinor: res.discountMinor, couponId: res.couponId! });
  }

  return (
    <div className={cn("rounded-xl border bg-card/60 p-3 backdrop-blur", className)}>
      <div className="flex items-center gap-2">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">Have a coupon?</span>
      </div>
      {applied ? (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
            <Check className="h-3.5 w-3.5" />
            {applied.code} · ₹{(applied.discountMinor / 100).toFixed(0)} off
          </span>
          <button
            onClick={() => { setApplied(null); setCode(""); onApplied?.({ code: "", discountMinor: 0, couponId: "" }); }}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-500/20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="WELCOME50"
            className="h-9 uppercase tracking-wide"
          />
          <Button size="sm" onClick={apply} disabled={validate.isPending || !code.trim()}>
            {validate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
          </Button>
        </div>
      )}
      {error && <div className="mt-1.5 text-xs text-destructive">{error}</div>}
    </div>
  );
}
