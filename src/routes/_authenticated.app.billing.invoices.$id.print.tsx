import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app/billing/invoices/$id/print")({
  component: InvoicePrint,
  head: () => ({ meta: [{ title: "Invoice · ZUPIX" }] }),
});

interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  amount_paid_minor: number;
  line_items: Array<{ description: string; quantity: number; unit_amount_minor: number; amount_minor: number }>;
  billing_address: Record<string, string> | null;
  customer_gstin: string | null;
  seller_gstin: string | null;
  place_of_supply: string | null;
  status: string;
  issued_at: string | null;
  paid_at: string | null;
  gateway: string | null;
  workspace_id: string;
}

function fmt(minor: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minor / 100);
}

function InvoicePrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["invoice-print", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("billing_invoices").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as InvoiceRow;
    },
  });

  useEffect(() => {
    if (q.data) setTimeout(() => window.print(), 400);
  }, [q.data]);

  if (q.isLoading) return <div className="p-8">Loading invoice…</div>;
  if (q.error || !q.data) return <div className="p-8 text-red-600">Invoice not found</div>;
  const inv = q.data;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-black print:p-6">
      <style>{`@media print{body{background:white!important}nav,aside,header,footer{display:none!important}}`}</style>
      <div className="flex items-start justify-between border-b pb-6">
        <div>
          <div className="text-3xl font-bold tracking-tight">ZUPIX</div>
          <div className="mt-1 text-sm text-gray-600">Tax Invoice</div>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">Invoice #{inv.invoice_number ?? inv.id.slice(0, 8)}</div>
          <div className="text-gray-600">Issued {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : "—"}</div>
          <div className="text-gray-600">Status: <span className="font-medium uppercase">{inv.status}</span></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <div className="text-xs uppercase text-gray-500">Billed to</div>
          <div className="mt-1 font-medium">{inv.billing_address?.name ?? "Customer"}</div>
          <div className="text-gray-600">{inv.billing_address?.line1 ?? ""}</div>
          <div className="text-gray-600">{inv.billing_address?.city ?? ""} {inv.billing_address?.state ?? ""}</div>
          {inv.customer_gstin ? <div className="mt-1 text-gray-600">GSTIN: {inv.customer_gstin}</div> : null}
        </div>
        <div className="text-right">
          <div className="text-xs uppercase text-gray-500">From</div>
          <div className="mt-1 font-medium">ZUPIX Link Studio</div>
          <div className="text-gray-600">India</div>
          {inv.seller_gstin ? <div className="mt-1 text-gray-600">GSTIN: {inv.seller_gstin}</div> : null}
          {inv.place_of_supply ? <div className="text-gray-600">Place of supply: {inv.place_of_supply}</div> : null}
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-gray-500">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Unit</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(inv.line_items ?? []).map((li, i) => (
            <tr key={i} className="border-b">
              <td className="py-3">{li.description}</td>
              <td className="py-3 text-right">{li.quantity}</td>
              <td className="py-3 text-right">{fmt(li.unit_amount_minor, inv.currency)}</td>
              <td className="py-3 text-right">{fmt(li.amount_minor, inv.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 ml-auto w-72 space-y-1 text-sm">
        <Row label="Subtotal" value={fmt(inv.subtotal_minor, inv.currency)} />
        {inv.discount_minor > 0 ? <Row label="Discount" value={`− ${fmt(inv.discount_minor, inv.currency)}`} /> : null}
        {inv.tax_minor > 0 ? <Row label="Tax" value={fmt(inv.tax_minor, inv.currency)} /> : null}
        <div className="mt-2 border-t pt-2">
          <Row label="Total" value={fmt(inv.total_minor, inv.currency)} bold />
        </div>
        <Row label="Paid" value={fmt(inv.amount_paid_minor, inv.currency)} />
      </div>

      <div className="mt-10 border-t pt-4 text-center text-xs text-gray-500">
        Paid via {inv.gateway ?? "—"} · {inv.paid_at ? new Date(inv.paid_at).toLocaleString() : ""} · Thank you for your business.
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}>
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
