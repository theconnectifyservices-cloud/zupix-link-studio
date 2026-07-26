/**
 * LS-17 — Enterprise Checkout Experience.
 *
 * Premium multi-step wizard (Summary → Gateway → Pay → Verify → Success/Fail).
 * Glass UI, framer-motion transitions, animated progress. Provider-agnostic:
 * launches Razorpay / Cashfree / PayU / Manual-UPI via the multi-gateway
 * adapter registry. Polls `payment_orders.status` for real-time verification.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, CreditCard, Loader2, Lock, QrCode, RefreshCcw,
  ShieldCheck, Sparkles, XCircle, Zap, ArrowRight, ArrowLeft, Tag,
  ReceiptText, Wallet, ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { listAvailableGateways, createCheckoutOrder } from "../checkout.functions";
import { submitUpiProof } from "../upi.functions";
import { REGISTRY_META } from "../gateways/registry";
import type { LaunchPayload, PaymentGatewayPublic, PaymentProvider } from "../types";
import { CouponInput } from "@/features/trial/components/coupon-input";
import { useTrialCountdown } from "@/features/trial/hooks";

type Step = "summary" | "gateway" | "paying" | "verifying" | "success" | "failed";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  planId: string;
  planLabel: string;
  cycle: "monthly" | "quarterly" | "yearly" | "lifetime";
  amountPaise: number;
  currency?: string;
  customer: { name: string; email: string; phone?: string };
  planCode?: string;
  onPending?: (orderId: string) => void;
}

const GST_RATE = 0.18;
const PROVIDER_META: Record<PaymentProvider, { hint: string; badges: string[] }> = {
  razorpay:   { hint: "Cards · UPI · Netbanking · Wallets", badges: ["Instant", "Recommended"] },
  cashfree:   { hint: "UPI · Cards · EMI · Pay Later", badges: ["Instant"] },
  payu:       { hint: "Cards · UPI · Netbanking", badges: ["Instant"] },
  manual_upi: { hint: "Scan QR & submit UTR — verified by admin", badges: ["Manual"] },
};

export function CheckoutModal(props: Props) {
  const {
    open, onOpenChange, workspaceId, planId, planLabel, cycle,
    amountPaise, currency = "INR", customer, planCode, onPending,
  } = props;

  const qc = useQueryClient();
  const listFn = useServerFn(listAvailableGateways);
  const createFn = useServerFn(createCheckoutOrder);
  const submitUpi = useServerFn(submitUpiProof);
  const trial = useTrialCountdown();

  const gatewaysQ = useQuery({
    queryKey: ["payment-gateways", workspaceId],
    queryFn: () => listFn({ data: { workspaceId } }),
    enabled: open,
  });

  const [step, setStep] = useState<Step>("summary");
  const [selected, setSelected] = useState<string | null>(null);
  const [launch, setLaunch] = useState<LaunchPayload | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountMinor: number } | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null);

  useEffect(() => {
    if (gatewaysQ.data && gatewaysQ.data.length > 0 && !selected) {
      setSelected(gatewaysQ.data[0].id);
    }
  }, [gatewaysQ.data, selected]);

  useEffect(() => {
    if (!open) {
      // reset after close
      const t = setTimeout(() => {
        setStep("summary");
        setLaunch(null);
        setOrderId(null);
        setTxnRef("");
        setCoupon(null);
        setFailReason(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const subtotal = amountPaise;
  const discount = coupon?.discountMinor ?? 0;
  const taxable = Math.max(0, subtotal - discount);
  const gst = Math.round(taxable * GST_RATE);
  const total = taxable + gst;
  const amountLabel = fmt(total, currency);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a payment method");
      return createFn({
        data: {
          workspaceId, planId, gatewayId: selected, cycle,
          amountPaise: total, currency, customer,
          returnUrl: `${window.location.origin}/app/billing?checkout=complete`,
        },
      });
    },
    onSuccess: async (r) => {
      setOrderId(r.orderId);
      setLaunch(r.launch);
      onPending?.(r.orderId);
      setStep("paying");
      try {
        await launchGateway(r.launch);
        if (r.launch.kind !== "manual_upi") setStep("verifying");
      } catch (e) {
        setFailReason((e as Error).message);
        setStep("failed");
      }
    },
    onError: (e: Error) => {
      setFailReason(e.message);
      setStep("failed");
    },
  });

  async function launchGateway(l: LaunchPayload) {
    if (l.kind === "razorpay") {
      const w = window as unknown as { Razorpay?: new (o: unknown) => { open: () => void } };
      if (!w.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Razorpay SDK failed to load"));
          document.body.appendChild(s);
        });
      }
      const rz = new (window as unknown as { Razorpay: new (o: unknown) => { open: () => void } }).Razorpay({
        key: l.keyId,
        order_id: l.orderId,
        amount: l.amount,
        currency: l.currency,
        name: planLabel,
        prefill: { name: customer.name, email: customer.email, contact: customer.phone },
        theme: { color: "#7c3aed" },
        handler: () => toast.success("Payment submitted — verifying…"),
        modal: { ondismiss: () => setStep("gateway") },
      });
      rz.open();
    } else if (l.kind === "payu") {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = l.endpoint;
      for (const [k, v] of Object.entries(l.fields)) {
        const i = document.createElement("input");
        i.type = "hidden"; i.name = k; i.value = v;
        form.appendChild(i);
      }
      document.body.appendChild(form);
      form.submit();
    } else if (l.kind === "cashfree") {
      const cfUrl = l.mode === "live"
        ? "https://sdk.cashfree.com/js/v3/cashfree.js"
        : "https://sdk.cashfree.com/js/v3/cashfree.sandbox.js";
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = cfUrl; s.onload = () => resolve(); s.onerror = () => reject(new Error("Cashfree SDK failed"));
        document.body.appendChild(s);
      });
      const cf = (window as unknown as { Cashfree: (o: unknown) => { checkout: (o: unknown) => Promise<unknown> } })
        .Cashfree({ mode: l.mode });
      await cf.checkout({ paymentSessionId: l.sessionId, redirectTarget: "_self" });
    }
    // manual_upi: stays on "paying" step with QR UI
  }

  // Verification poller
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (step !== "verifying" || !orderId) return;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      const { data } = await supabase
        .from("payment_orders")
        .select("status")
        .eq("id", orderId)
        .maybeSingle();
      const s = data?.status as string | undefined;
      if (s === "paid") {
        setStep("success");
        qc.invalidateQueries({ queryKey: ["billing"] });
        qc.invalidateQueries({ queryKey: ["subscription"] });
        qc.invalidateQueries({ queryKey: ["trial"] });
        return;
      }
      if (s === "failed") {
        setFailReason("Payment could not be verified");
        setStep("failed");
        return;
      }
      if (attempts > 60) {
        setFailReason("Verification is taking longer than expected. Check billing history.");
        setStep("failed");
        return;
      }
      pollRef.current = window.setTimeout(tick, 2500);
    };
    pollRef.current = window.setTimeout(tick, 2000);
    return () => { if (pollRef.current) window.clearTimeout(pollRef.current); };
  }, [step, orderId, qc]);

  const upiMut = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error("No order");
      return submitUpi({ data: { orderId, txnRef: txnRef.trim() } });
    },
    onSuccess: () => {
      toast.success("Proof submitted — awaiting admin verification");
      setStep("verifying");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const progressPct = STEP_PROGRESS[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl overflow-hidden border-none bg-transparent p-0 shadow-2xl"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-background/85 backdrop-blur-2xl">
          {/* Ambient glow */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-purple-500/25 blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative border-b border-border/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Secure Checkout
                <Badge variant="outline" className="ml-1 border-emerald-500/40 text-[10px] text-emerald-600">
                  <Lock className="mr-1 h-2.5 w-2.5" /> 256-bit
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{planLabel}</div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <StepRail step={step} />
          </div>

          {/* Body */}
          <div className="relative min-h-[380px] px-6 py-6">
            <AnimatePresence mode="wait">
              {step === "summary" && (
                <StepMotion key="summary">
                  <SummaryStep
                    planLabel={planLabel}
                    cycle={cycle}
                    currency={currency}
                    subtotal={subtotal}
                    discount={discount}
                    gst={gst}
                    total={total}
                    coupon={coupon}
                    planCode={planCode}
                    onCoupon={setCoupon}
                    trialDays={trial?.days ?? null}
                  />
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => setStep("gateway")}
                      className="gap-1.5 bg-gradient-to-r from-primary to-purple-600"
                    >
                      Continue <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </StepMotion>
              )}

              {step === "gateway" && (
                <StepMotion key="gateway">
                  <GatewayStep
                    gateways={gatewaysQ.data ?? []}
                    loading={gatewaysQ.isLoading}
                    selected={selected}
                    onSelect={setSelected}
                  />
                  <div className="mt-6 flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setStep("summary")} className="gap-1.5">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => createMut.mutate()}
                      disabled={!selected || createMut.isPending}
                      className="gap-2 bg-gradient-to-r from-primary to-purple-600"
                    >
                      {createMut.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Preparing…</>
                      ) : (
                        <><CreditCard className="h-4 w-4" /> Pay {amountLabel}</>
                      )}
                    </Button>
                  </div>
                  <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" /> Auto-failover · PCI-secured · Powered by Razorpay, PayU, Cashfree
                  </p>
                </StepMotion>
              )}

              {step === "paying" && (
                <StepMotion key="paying">
                  {launch?.kind === "manual_upi" ? (
                    <ManualUpiStep
                      launch={launch}
                      amountLabel={amountLabel}
                      txnRef={txnRef}
                      setTxnRef={setTxnRef}
                      pending={upiMut.isPending}
                      onSubmit={() => upiMut.mutate()}
                    />
                  ) : (
                    <PayingSpinner label="Opening secure payment window…" />
                  )}
                </StepMotion>
              )}

              {step === "verifying" && (
                <StepMotion key="verifying">
                  <PayingSpinner
                    label="Verifying your payment…"
                    hint="This usually takes a few seconds. Do not close this window."
                  />
                </StepMotion>
              )}

              {step === "success" && (
                <StepMotion key="success">
                  <SuccessStep
                    planLabel={planLabel}
                    amountLabel={amountLabel}
                    onDone={() => {
                      onOpenChange(false);
                      window.location.href = "/app";
                    }}
                    onBilling={() => {
                      onOpenChange(false);
                      window.location.href = "/app/billing";
                    }}
                  />
                </StepMotion>
              )}

              {step === "failed" && (
                <StepMotion key="failed">
                  <FailureStep
                    reason={failReason}
                    onRetry={() => { setFailReason(null); createMut.mutate(); }}
                    onChangeGateway={() => { setFailReason(null); setStep("gateway"); }}
                    onClose={() => onOpenChange(false)}
                  />
                </StepMotion>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Sub-components -------- */

const STEP_PROGRESS: Record<Step, number> = {
  summary: 20, gateway: 40, paying: 60, verifying: 80, success: 100, failed: 100,
};

const RAIL_STEPS: { key: Step | "pay"; label: string }[] = [
  { key: "summary", label: "Review" },
  { key: "gateway", label: "Method" },
  { key: "pay", label: "Pay" },
  { key: "success", label: "Done" },
];

function StepRail({ step }: { step: Step }) {
  const activeIdx =
    step === "summary" ? 0 :
    step === "gateway" ? 1 :
    step === "paying" || step === "verifying" ? 2 :
    3;
  return (
    <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
      {RAIL_STEPS.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border transition",
            i < activeIdx && "border-emerald-500/50 bg-emerald-500/15 text-emerald-600",
            i === activeIdx && "border-primary bg-primary text-primary-foreground",
            i > activeIdx && "border-border bg-muted text-muted-foreground",
          )}>
            {i < activeIdx ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
          </span>
          <span className={cn(
            i === activeIdx ? "text-foreground" : "text-muted-foreground",
          )}>{s.label}</span>
          {i < RAIL_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
        </div>
      ))}
    </div>
  );
}

function StepMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function SummaryStep({
  planLabel, cycle, currency, subtotal, discount, gst, total,
  coupon, planCode, onCoupon, trialDays,
}: {
  planLabel: string; cycle: string; currency: string;
  subtotal: number; discount: number; gst: number; total: number;
  coupon: { code: string; discountMinor: number } | null;
  planCode?: string;
  onCoupon: (v: { code: string; discountMinor: number } | null) => void;
  trialDays: number | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Order summary</div>
        <h3 className="mt-1 text-xl font-semibold">{planLabel}</h3>
      </div>

      {trialDays !== null && trialDays > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <span className="font-medium">Trial active</span>
            <span className="text-muted-foreground"> — {trialDays} day{trialDays === 1 ? "" : "s"} remaining. Upgrade now to keep every feature.</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card/60 p-4 backdrop-blur">
        <Row label={<span className="capitalize">{cycle} plan</span>} value={fmt(subtotal, currency)} />
        {discount > 0 && (
          <Row
            label={<span className="text-emerald-600">Coupon · {coupon?.code}</span>}
            value={<span className="text-emerald-600">− {fmt(discount, currency)}</span>}
          />
        )}
        <Row
          label={<span className="text-muted-foreground">GST (18%)</span>}
          value={<span className="text-muted-foreground">{fmt(gst, currency)}</span>}
        />
        <Separator className="my-3" />
        <Row
          label={<span className="font-semibold">Total due today</span>}
          value={<span className="text-lg font-bold">{fmt(total, currency)}</span>}
        />
      </div>

      <CouponInput
        planCode={planCode ?? ""}
        cycle={cycle}
        amountMinor={subtotal}
        onApplied={(r) => {
          if (!r.couponId) onCoupon(null);
          else onCoupon({ code: r.code, discountMinor: r.discountMinor });
        }}
      />

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ReceiptText className="h-3 w-3" />
        GST invoice generated automatically after successful payment.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div>{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}

function GatewayStep({
  gateways, loading, selected, onSelect,
}: {
  gateways: PaymentGatewayPublic[]; loading: boolean;
  selected: string | null; onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (gateways.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        <Wallet className="mx-auto mb-2 h-6 w-6 opacity-50" />
        No payment methods are enabled yet.<br />
        Ask an administrator to activate a gateway from the admin console.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Payment method</div>
        <h3 className="mt-1 text-lg font-semibold">How would you like to pay?</h3>
      </div>
      <div className="grid gap-2">
        {gateways.map((g) => {
          const meta = REGISTRY_META[g.provider];
          const pm = PROVIDER_META[g.provider];
          const isSel = selected === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl border p-4 text-left transition",
                "hover:bg-muted/40",
                isSel && "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-sm",
              )}
            >
              <div className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-lg border bg-gradient-to-br",
                isSel ? "from-primary/20 to-purple-500/20" : "from-muted to-muted/60",
              )}>
                {g.provider === "manual_upi"
                  ? <QrCode className="h-5 w-5" />
                  : <CreditCard className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium truncate">
                    {g.display_name || meta?.label || g.provider}
                  </div>
                  {g.mode === "sandbox" && (
                    <Badge variant="secondary" className="text-[10px]">Test</Badge>
                  )}
                  {pm.badges.map((b) => (
                    <Badge key={b} variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {b}
                    </Badge>
                  ))}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{pm.hint}</p>
              </div>
              <div className={cn(
                "grid h-5 w-5 place-items-center rounded-full border transition",
                isSel ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}>
                {isSel && <CheckCircle2 className="h-3 w-3" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ManualUpiStep({
  launch, amountLabel, txnRef, setTxnRef, pending, onSubmit,
}: {
  launch: Extract<LaunchPayload, { kind: "manual_upi" }>;
  amountLabel: string; txnRef: string;
  setTxnRef: (v: string) => void;
  pending: boolean; onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <QrCode className="h-4 w-4" /> Pay {amountLabel} via UPI
        </div>
        {launch.qrImageUrl && (
          <img
            src={launch.qrImageUrl}
            alt="UPI QR code"
            className="mx-auto mt-3 h-52 w-52 rounded-lg border bg-white object-contain p-2"
          />
        )}
        <div className="mt-3 text-center">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">UPI ID</div>
          <div className="font-mono text-base font-semibold">{launch.upiId}</div>
          <div className="text-xs text-muted-foreground">{launch.accountName}</div>
        </div>
        <p className="mt-3 whitespace-pre-line text-center text-xs text-muted-foreground">
          {launch.instructions}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="txnRef">UPI Transaction Reference (UTR)</Label>
        <Input
          id="txnRef" value={txnRef}
          onChange={(e) => setTxnRef(e.target.value)}
          placeholder="e.g. 234512348765"
        />
        <p className="text-xs text-muted-foreground">
          Enter the 12-digit UTR from your UPI app after paying.
        </p>
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={!txnRef.trim() || pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Submit Payment Proof
      </Button>
    </div>
  );
}

function PayingSpinner({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      </div>
      <div>
        <div className="font-medium">{label}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function SuccessStep({
  planLabel, amountLabel, onDone, onBilling,
}: { planLabel: string; amountLabel: string; onDone: () => void; onBilling: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="relative"
      >
        <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-xl">
          <CheckCircle2 className="h-10 w-10" />
        </div>
      </motion.div>
      <div>
        <h3 className="text-2xl font-bold">Subscription Activated</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome aboard — <span className="font-medium text-foreground">{planLabel}</span> is now active.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {amountLabel} charged · GST invoice ready in Billing
        </p>
      </div>
      <div className="mt-2 flex w-full max-w-sm gap-2">
        <Button variant="outline" className="flex-1" onClick={onBilling}>
          <ReceiptText className="mr-2 h-4 w-4" /> View Invoice
        </Button>
        <Button className="flex-1 bg-gradient-to-r from-primary to-purple-600" onClick={onDone}>
          Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FailureStep({
  reason, onRetry, onChangeGateway, onClose,
}: { reason: string | null; onRetry: () => void; onChangeGateway: () => void; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-xl font-semibold">Payment Failed</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {reason ?? "We couldn't process your payment. No charges have been made."}
        </p>
      </div>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1" onClick={onChangeGateway}>
          <Tag className="mr-2 h-4 w-4" /> Change Method
        </Button>
        <Button className="flex-1" onClick={onRetry}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Retry Payment
        </Button>
      </div>
      <button onClick={onClose} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
        Contact support
      </button>
    </div>
  );
}

function fmt(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}
