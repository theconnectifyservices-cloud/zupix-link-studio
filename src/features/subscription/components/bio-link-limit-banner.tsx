/**
 * Bio Link limit banner — shown on the dashboard when the workspace has
 * used its full effective Bio Link allowance.
 */
import { useState } from "react";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBioLinkAllowance } from "../use-bio-link-allowance";
import { BuyBioLinksDialog } from "./buy-bio-links-dialog";
import { BIO_LINK_ADDON_PRICE_MINOR, formatPlanPrice } from "../plans";

export function BioLinkLimitBanner() {
  const { allowance, workspaceId } = useBioLinkAllowance();
  const [open, setOpen] = useState(false);

  if (!allowance || !allowance.exceeded || !workspaceId) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold">You have reached your Bio Link limit.</p>
            <p className="text-xs text-muted-foreground">
              {allowance.used} of {allowance.effectiveLimit} Bio Links used
              {allowance.addonQuantity > 0 ? ` (includes ${allowance.addonQuantity} purchased)` : ""} ·
              {" "}Extra Bio Links cost {formatPlanPrice(BIO_LINK_ADDON_PRICE_MINOR)} each.
            </p>
          </div>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setOpen(true)}>
          <ShoppingCart className="h-4 w-4" /> Buy Additional Bio Links
        </Button>
      </div>
      <BuyBioLinksDialog open={open} onOpenChange={setOpen} workspaceId={workspaceId} />
    </div>
  );
}
