/**
 * LS-13A — Workspace Billing Dashboard.
 * Plan comparison, coupon-aware checkout via the abstract PaymentProvider
 * (mock when no gateway is configured), invoices, subscription lifecycle,
 * gateway connection status and quick tax settings.
 */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  CreditCard,
  Link2,
  Loader2,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLoader } from "@/shared/ui/page-loader";
import {
  cancelSubscription,
  getCouponByCode,
  getTaxSettings,
  getWorkspaceSubscription,
  listInvoices,
  listPayments,
  listPublicPlans,
  pauseSubscription,
  resumeSubscription,
  upsertTaxSettings,
} from "./api";
import { computeQuote, formatMoney, planPriceForCycle } from "./pricing";
import { openRazorpayCheckout } from "./razorpay";
import { createCheckoutOrder, getBillingProviderStatus } from "./checkout.functions";
import { verifyCheckoutPayment } from "./verify.functions";
import type { BillingCycle, BillingPlan, Coupon } from "./types";

const CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "lifetime", label: "Lifetime" },
];

interface Props {
  workspaceId: string;
  workspaceName: string;
}

export function BillingDashboard({ workspaceId, workspaceName }: Props) {
  const qc = useQueryClient();
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const providerStatusFn = useServerFn(getBillingProviderStatus);
  const statusQ = useQuery({
    queryKey: ["billing", "provider-status"],
    queryFn: () => providerStatusFn(),
    staleTime: 60_000,
  });

  const plansQ = useQuery({ queryKey: ["billing", "plans"], queryFn: listPublicPlans });
  const subQ = useQuery({
    queryKey: ["billing", "subscription", workspaceId],
    queryFn: () => getWorkspaceSubscription(workspaceId),
  });
  const invoicesQ = useQuery({
    queryKey: ["billing", "invoices", workspaceId],
    queryFn: () => listInvoices(workspaceId),
  });
  const paymentsQ = useQuery({
    queryKey: ["billing", "payments", workspaceId],
    queryFn: () => listPayments(workspaceId),
  });
  const taxQ = useQuery({
    queryKey: ["billing", "tax", workspaceId],
    queryFn: () => getTaxSettings(workspaceId),
  });

  const currentPlan = useMemo(
    () => plansQ.data?.find((p) => p.id === subQ.data?.plan_id) ?? null,
    [plansQ.data, subQ.data?.plan_id],
  );

  const createOrder = useServerFn(createCheckoutOrder);
  const verifyPayment = useServerFn(verifyCheckoutPayment);
  const isMock = !statusQ.data?.connected;

  const applyCouponMut = useMutation({
    mutationFn: async (code: string) => {
      const c = await getCouponByCode(code);
      if (!c) throw new Error("Coupon not found or inactive");
      return c;
    },
    onSuccess: (c) => {
      setAppliedCoupon(c);
      toast.success(`Coupon “${c.code}” applied`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleCheckout(plan: BillingPlan) {
    if (!planPriceForCycle(plan, cycle)) {
      toast.error("This plan does not support the selected billing cycle");
      return;
    }
    try {
      setPendingPlan(plan.id);
      const order = await createOrder({
        data: {
          workspace_id: workspaceId,
          plan_code: plan.code,
          cycle,
          coupon_code: appliedCoupon?.code ?? null,
        },
      });

      let paymentId: string;
      let signature: string | undefined;

      if (order.mock) {
        // Demo checkout — no gateway credentials configured.
        const confirmed = window.confirm(
          `Demo checkout — no real charge.\n\n${plan.name} · ${cycle}\n${formatMoney(order.amount_minor, order.currency)}\n\nSimulate a successful payment?`,
        );
        if (!confirmed) throw new Error("Checkout dismissed");
        paymentId = `mock_pay_${crypto.randomUUID()}`;
      } else {
        const resp = await openRazorpayCheckout(
          {
            order_id: order.order_id,
            key_id: order.key_id,
            amount_minor: order.amount_minor,
            currency: order.currency,
            invoice_id: order.invoice_id,
          },
          { workspaceName, description: `${plan.name} · ${cycle}` },
        );
        paymentId = resp.razorpay_payment_id;
        signature = resp.razorpay_signature;
      }

      await verifyPayment({
        data: {
          workspace_id: workspaceId,
          invoice_id: order.invoice_id,
          order_id: order.order_id,
          payment_id: paymentId,
          signature: signature ?? null,
          plan_code: plan.code,
          cycle,
        },
      });
      toast.success(order.mock ? "Demo subscription activated" : "Subscription activated");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] }),
        qc.invalidateQueries({ queryKey: ["billing", "invoices", workspaceId] }),
        qc.invalidateQueries({ queryKey: ["billing", "payments", workspaceId] }),
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      if (msg !== "Checkout dismissed") toast.error(msg);
    } finally {
      setPendingPlan(null);
    }
  }

  if (plansQ.isLoading || subQ.isLoading) return <PageLoader label="Loading billing" />;
  if (plansQ.error) return <div className="text-sm text-destructive">Failed to load plans</div>;

  const plans = plansQ.data ?? [];

  return (
    <div className="space-y-6">
      {isMock ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Payment gateway not connected</AlertTitle>
          <AlertDescription>
            Billing is running in demo mode. No real charges are made. Connect Razorpay from
            the “Gateway” tab before going to production.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Current subscription */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Current subscription
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentPlan
                ? `${currentPlan.name} · ${subQ.data?.cycle ?? "—"} · ${subQ.data?.status ?? "—"}`
                : "You are on the free tier."}
            </p>
          </div>
          {subQ.data && subQ.data.status !== "canceled" ? (
            <div className="flex gap-2">
              {subQ.data.status === "paused" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await resumeSubscription(subQ.data!.id);
                    qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] });
                  }}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await pauseSubscription(subQ.data!.id);
                    qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] });
                  }}
                >
                  Pause
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await cancelSubscription(subQ.data!.id, true);
                  toast.success("Subscription will cancel at period end");
                  qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] });
                }}
              >
                Cancel at period end
              </Button>
            </div>
          ) : null}
        </CardHeader>
        {subQ.data ? (
          <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <div className="text-muted-foreground">Renews</div>
              <div className="font-medium">
                {subQ.data.current_period_end
                  ? new Date(subQ.data.current_period_end).toLocaleDateString()
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Amount</div>
              <div className="font-medium">
                {formatMoney(subQ.data.unit_amount_minor, subQ.data.currency)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Gateway</div>
              <div className="font-medium capitalize">{subQ.data.gateway ?? "—"}</div>
            </div>
          </CardContent>
        ) : null}
      </Card>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tax">Tax & Address</TabsTrigger>
          <TabsTrigger value="gateway">Gateway</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Billing cycle</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CYCLES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs">Coupon code</Label>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH20"
                />
                <Button
                  variant="outline"
                  onClick={() => applyCouponMut.mutate(couponCode.trim())}
                  disabled={!couponCode.trim() || applyCouponMut.isPending}
                >
                  {applyCouponMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
                {appliedCoupon ? (
                  <Button variant="ghost" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                    Clear
                  </Button>
                ) : null}
              </div>
              {appliedCoupon ? (
                <div className="mt-1 text-xs text-emerald-600">
                  Applied: {appliedCoupon.code}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                coupon={appliedCoupon}
                taxRate={taxQ.data?.tax_rate ?? 0}
                pricesIncludeTax={taxQ.data?.prices_include_tax ?? false}
                isCurrent={currentPlan?.id === plan.id}
                busy={pendingPlan === plan.id}
                mock={isMock}
                onCheckout={() => handleCheckout(plan)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceTable rows={invoicesQ.data ?? []} loading={invoicesQ.isLoading} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentTable rows={paymentsQ.data ?? []} loading={paymentsQ.isLoading} />
        </TabsContent>

        <TabsContent value="tax">
          <TaxSettingsForm
            workspaceId={workspaceId}
            initial={taxQ.data ?? null}
            onSaved={() => qc.invalidateQueries({ queryKey: ["billing", "tax", workspaceId] })}
          />
        </TabsContent>

        <TabsContent value="gateway">
          <GatewayPanel status={statusQ.data} loading={statusQ.isLoading} onRefresh={() => statusQ.refetch()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PlanCard(props: {
  plan: BillingPlan;
  cycle: BillingCycle;
  coupon: Coupon | null;
  taxRate: number;
  pricesIncludeTax: boolean;
  isCurrent: boolean;
  busy: boolean;
  mock: boolean;
  onCheckout: () => void;
}) {
  const { plan, cycle, coupon, taxRate, pricesIncludeTax, isCurrent, busy, mock, onCheckout } = props;
  const price = planPriceForCycle(plan, cycle);
  const quote = price !== null
    ? computeQuote({ plan, cycle, coupon, tax: { tax_rate: taxRate, prices_include_tax: pricesIncludeTax } })
    : null;
  const disabled = price === null || price === 0 || isCurrent || busy;

  return (
    <Card className={isCurrent ? "border-primary shadow-sm" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{plan.name}</CardTitle>
          {isCurrent ? <Badge variant="default">Current</Badge> : null}
        </div>
        {plan.description ? (
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          {price === null ? (
            <div className="text-sm text-muted-foreground">Not available on {cycle}</div>
          ) : price === 0 ? (
            <div className="text-2xl font-semibold">Free</div>
          ) : (
            <>
              <div className="text-2xl font-semibold">
                {formatMoney(quote?.total_minor ?? price, plan.currency)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {cycle === "lifetime" ? "once" : cycle}
                </span>
              </div>
              {quote && (quote.discount_minor > 0 || quote.tax_minor > 0) ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  Subtotal {formatMoney(quote.subtotal_minor, plan.currency)}
                  {quote.discount_minor > 0
                    ? ` · − ${formatMoney(quote.discount_minor, plan.currency)}`
                    : ""}
                  {quote.tax_minor > 0
                    ? ` · + tax ${formatMoney(quote.tax_minor, plan.currency)}`
                    : ""}
                </div>
              ) : null}
            </>
          )}
        </div>
        <ul className="space-y-1.5 text-sm">
          {plan.features.slice(0, 6).map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full" onClick={onCheckout} disabled={disabled}>
          {busy ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</>
          ) : isCurrent ? (
            "Active plan"
          ) : price === 0 ? (
            "Included"
          ) : mock ? (
            <><CreditCard className="mr-2 h-4 w-4" /> Try demo checkout</>
          ) : (
            <><CreditCard className="mr-2 h-4 w-4" /> Subscribe</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function GatewayPanel({
  status,
  loading,
  onRefresh,
}: {
  status: Awaited<ReturnType<typeof getBillingProviderStatus>> | undefined;
  loading: boolean;
  onRefresh: () => void;
}) {
  const connected = !!status?.connected;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" /> Payment Gateway
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a payment provider to accept real payments. Until then, checkout runs
            in demo mode.
          </p>
        </div>
        <Badge variant={connected ? "default" : "secondary"}>
          {loading ? "Checking…" : connected ? "Connected" : "Not Connected"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusRow label="Provider" value={status?.gateway ?? "—"} />
          <StatusRow label="Mode" value={status?.mode ?? "—"} />
          <StatusRow label="Key ID" value={status?.key_id ?? "—"} mono />
          <StatusRow
            label="Webhook"
            value={status?.webhook_configured ? "Configured" : "Not configured"}
          />
        </div>
        {status?.message ? (
          <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            {status.message}
          </div>
        ) : null}
        <Separator />
        <div className="space-y-3">
          <div className="text-sm font-medium">Razorpay</div>
          <p className="text-xs text-muted-foreground">
            To connect Razorpay, add these secrets to the project. The billing engine will
            switch from demo mode to live processing automatically on the next request.
          </p>
          <ul className="rounded-md bg-muted/50 p-3 font-mono text-xs">
            <li>RAZORPAY_KEY_ID</li>
            <li>RAZORPAY_KEY_SECRET</li>
            <li>RAZORPAY_WEBHOOK_SECRET <span className="text-muted-foreground">(for lifecycle events)</span></li>
          </ul>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() =>
                toast.info(
                  "Ask an admin to run the “Connect Razorpay” secret flow, or paste the keys in project settings.",
                )
              }
            >
              Connect Razorpay
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh status
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-medium capitalize ${mono ? "font-mono text-xs" : ""}`}>{value}</div>
    </div>
  );
}

function InvoiceTable({ rows, loading }: { rows: Awaited<ReturnType<typeof listInvoices>>; loading: boolean }) {
  if (loading) return <PageLoader label="Loading invoices" />;
  if (!rows.length) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
        <ReceiptText className="mx-auto mb-2 h-6 w-6" />No invoices yet.
      </CardContent></Card>
    );
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.invoice_number ?? r.id.slice(0, 8)}</TableCell>
              <TableCell>{r.issued_at ? new Date(r.issued_at).toLocaleDateString() : "—"}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{r.status}</Badge></TableCell>
              <TableCell className="text-right">{formatMoney(r.total_minor, r.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function PaymentTable({ rows, loading }: { rows: Awaited<ReturnType<typeof listPayments>>; loading: boolean }) {
  if (loading) return <PageLoader label="Loading payments" />;
  if (!rows.length) {
    return (
      <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
        <RefreshCcw className="mx-auto mb-2 h-6 w-6" />No payments recorded.
      </CardContent></Card>
    );
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
              <TableCell className="capitalize">{p.gateway}</TableCell>
              <TableCell className="font-mono text-xs">{p.gateway_payment_id ?? p.gateway_order_id ?? "—"}</TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{p.status}</Badge></TableCell>
              <TableCell className="text-right">{formatMoney(p.amount_minor, p.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function TaxSettingsForm({
  workspaceId,
  initial,
  onSaved,
}: {
  workspaceId: string;
  initial: Awaited<ReturnType<typeof getTaxSettings>>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    tax_type: (initial?.tax_type ?? "GST") as "GST" | "VAT" | "NONE",
    gstin: initial?.gstin ?? "",
    legal_name: initial?.legal_name ?? "",
    country: initial?.country ?? "IN",
    state: initial?.state ?? "",
    tax_rate: initial?.tax_rate ?? 18,
    prices_include_tax: initial?.prices_include_tax ?? false,
  });
  useEffect(() => {
    if (initial) {
      setForm({
        tax_type: initial.tax_type,
        gstin: initial.gstin ?? "",
        legal_name: initial.legal_name ?? "",
        country: initial.country ?? "IN",
        state: initial.state ?? "",
        tax_rate: initial.tax_rate,
        prices_include_tax: initial.prices_include_tax,
      });
    }
  }, [initial]);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await upsertTaxSettings(workspaceId, form);
      toast.success("Tax settings saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tax & billing address</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Tax type</Label>
          <Select value={form.tax_type} onValueChange={(v) => setForm({ ...form, tax_type: v as typeof form.tax_type })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="GST">GST (India)</SelectItem>
              <SelectItem value="VAT">VAT</SelectItem>
              <SelectItem value="NONE">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tax rate (%)</Label>
          <Input
            type="number" min={0} max={100} step={0.01}
            value={form.tax_rate}
            onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Legal / business name</Label>
          <Input value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} />
        </div>
        <div>
          <Label>GSTIN / Tax ID</Label>
          <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>Country (ISO)</Label>
          <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} />
        </div>
        <div>
          <Label>State / region</Label>
          <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Separator className="my-2" />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.prices_include_tax}
              onChange={(e) => setForm({ ...form, prices_include_tax: e.target.checked })}
            />
            Displayed prices are inclusive of tax
          </label>
        </div>
        <div className="md:col-span-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save tax settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
