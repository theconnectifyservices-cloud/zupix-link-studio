/**
 * Enterprise Checkout Modal — provider-agnostic launcher.
 * Uses the multi-gateway registry and auto-failover selector.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreditCard, Loader2, QrCode, ShieldCheck, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { listAvailableGateways, createCheckoutOrder } from "../checkout.functions";
import { submitUpiProof } from "../upi.functions";
import { REGISTRY_META } from "../gateways/registry";
import type { LaunchPayload, PaymentGatewayPublic } from "../types";

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
  onPending?: (orderId: string) => void;
}

export function CheckoutModal(props: Props) {
  const {
    open, onOpenChange, workspaceId, planId, planLabel, cycle,
    amountPaise, currency = "INR", customer, onPending,
  } = props;

  const listFn = useServerFn(listAvailableGateways);
  const createFn = useServerFn(createCheckoutOrder);
  const submitUpi = useServerFn(submitUpiProof);

  const gatewaysQ = useQuery({
    queryKey: ["payment-gateways", workspaceId],
    queryFn: () => listFn({ data: { workspaceId } }),
    enabled: open,
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [launch, setLaunch] = useState<LaunchPayload | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [txnRef, setTxnRef] = useState("");

  useEffect(() => {
    if (gatewaysQ.data && gatewaysQ.data.length > 0 && !selected) {
      setSelected(gatewaysQ.data[0].id);
    }
  }, [gatewaysQ.data, selected]);

  useEffect(() => {
    if (!open) {
      setLaunch(null);
      setOrderId(null);
      setTxnRef("");
    }
  }, [open]);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select a payment method");
      return createFn({
        data: {
          workspaceId, planId, gatewayId: selected, cycle,
          amountPaise, currency, customer,
          returnUrl: `${window.location.origin}/billing?checkout=complete`,
        },
      });
    },
    onSuccess: async (r) => {
      setOrderId(r.orderId);
      setLaunch(r.launch);
      onPending?.(r.orderId);
      await launchGateway(r.launch);
    },
    onError: (e: Error) => toast.error(e.message),
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
        handler: () => toast.success("Payment submitted — awaiting confirmation"),
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
    // manual_upi: render inline UI (below)
  }

  const upiMut = useMutation({
    mutationFn: async () => {
      if (!orderId) throw new Error("No order");
      return submitUpi({ data: { orderId, txnRef: txnRef.trim() } });
    },
    onSuccess: () => {
      toast.success("Proof submitted — awaiting admin verification");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const amountLabel = useMemo(
    () => new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amountPaise / 100),
    [amountPaise, currency],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Secure Checkout
          </DialogTitle>
          <DialogDescription>
            {planLabel} · {cycle} · <span className="font-semibold text-foreground">{amountLabel}</span>
          </DialogDescription>
        </DialogHeader>

        {launch?.kind === "manual_upi" ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="h-4 w-4" /> Pay {amountLabel} to
              </div>
              {launch.qrImageUrl ? (
                <img
                  src={launch.qrImageUrl}
                  alt="UPI QR code"
                  className="mx-auto h-56 w-56 rounded-lg border object-contain bg-white p-2"
                />
              ) : null}
              <div className="text-center">
                <div className="text-xs text-muted-foreground">UPI ID</div>
                <div className="font-mono text-base font-semibold">{launch.upiId}</div>
                <div className="text-xs text-muted-foreground mt-1">{launch.accountName}</div>
              </div>
              <p className="text-xs text-muted-foreground text-center whitespace-pre-line">
                {launch.instructions}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="txnRef">UPI Transaction Reference</Label>
              <Input
                id="txnRef"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. 234512348765"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 12-digit UTR from your UPI app after paying.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => upiMut.mutate()}
              disabled={!txnRef.trim() || upiMut.isPending}
            >
              {upiMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Payment Proof
            </Button>
          </div>
        ) : gatewaysQ.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (gatewaysQ.data ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No payment methods are configured yet. Ask an administrator to enable a gateway.
          </div>
        ) : (
          <>
            <RadioGroup value={selected ?? ""} onValueChange={setSelected} className="space-y-2">
              {(gatewaysQ.data ?? []).map((g) => (
                <GatewayOption key={g.id} gateway={g} selected={selected === g.id} />
              ))}
            </RadioGroup>
            <Button
              className="w-full"
              onClick={() => createMut.mutate()}
              disabled={!selected || createMut.isPending}
            >
              {createMut.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
              ) : (
                <><CreditCard className="mr-2 h-4 w-4" /> Pay {amountLabel}</>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Zap className="h-3 w-3" /> Auto-failover enabled · PCI-secured
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GatewayOption({ gateway, selected }: { gateway: PaymentGatewayPublic; selected: boolean }) {
  const meta = REGISTRY_META[gateway.provider];
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
      }`}
    >
      <RadioGroupItem value={gateway.id} id={gateway.id} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{gateway.display_name || meta?.label || gateway.provider}</span>
          {gateway.mode === "sandbox" ? <Badge variant="secondary" className="text-[10px]">Test</Badge> : null}
          {gateway.health_status === "healthy" ? (
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">Live</Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{meta?.description}</p>
      </div>
    </label>
  );
}
