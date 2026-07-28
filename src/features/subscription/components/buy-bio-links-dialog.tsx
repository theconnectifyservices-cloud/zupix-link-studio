/**
 * Bio Link add-on purchase dialog.
 * Lets a customer buy extra Bio Links (₹79 each) through the payments hub.
 */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { CheckoutModal } from "@/features/payments/components/checkout-modal";
import { prepareBioLinkAddonCheckout } from "../addons.functions";
import { BIO_LINK_ADDON_PRICE_MINOR, formatPlanPrice } from "../plans";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
}

export function BuyBioLinksDialog({ open, onOpenChange, workspaceId }: Props) {
  const qc = useQueryClient();
  const prepare = useServerFn(prepareBioLinkAddonCheckout);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [checkout, setCheckout] = useState<{
    planId: string; amountPaise: number; label: string; quantity: number;
  } | null>(null);
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setCheckout(null);
      setBusy(false);
    }
  }, [open]);

  async function startCheckout() {
    setBusy(true);
    try {
      const [{ data: userRes }, r] = await Promise.all([
        supabase.auth.getUser(),
        prepare({ data: { workspaceId, quantity } }),
      ]);
      const email = userRes.user?.email ?? "";
      const meta = (userRes.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
      setCustomer({ name: meta.full_name ?? meta.name ?? email.split("@")[0] ?? "Customer", email });
      setCheckout({ planId: r.planId, amountPaise: r.amountPaise, label: r.label, quantity: r.quantity });
    } finally {
      setBusy(false);
    }
  }

  if (checkout && customer) {
    return (
      <CheckoutModal
        open={open}
        onOpenChange={(v) => {
          onOpenChange(v);
          if (!v) {
            qc.invalidateQueries({ queryKey: ["bio-link-allowance"] });
            qc.invalidateQueries({ queryKey: ["subscription"] });
            qc.invalidateQueries({ queryKey: ["bio-pages"] });
          }
        }}
        workspaceId={workspaceId}
        planId={checkout.planId}
        planLabel={checkout.label}
        cycle="lifetime"
        amountPaise={checkout.amountPaise}
        currency="INR"
        customer={customer}
        extraMeta={{ kind: "bio_link_addon", addon_quantity: checkout.quantity }}
      />
    );
  }

  const total = BIO_LINK_ADDON_PRICE_MINOR * quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" /> Buy Additional Bio Links
          </DialogTitle>
          <DialogDescription>
            Add extra Bio Links to your workspace for just {formatPlanPrice(BIO_LINK_ADDON_PRICE_MINOR)} per Bio Link.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Extra Bio Links</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-lg font-semibold tabular-nums">{quantity}</span>
              <Button
                variant="outline" size="icon" className="h-8 w-8"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total (excl. GST)</span>
            <span className="text-xl font-bold">{formatPlanPrice(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={startCheckout} disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue to payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
