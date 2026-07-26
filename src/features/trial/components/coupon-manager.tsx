/**
 * Admin CMS: Coupon Manager. Create, edit, archive, delete, duplicate
 * coupons and view live usage counts.
 */
import { useMemo, useState } from "react";
import { Archive, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCoupons, useCouponMutations } from "../hooks";
import type { CouponRow } from "../api";

interface Draft {
  code: string;
  name: string;
  kind: "percentage" | "flat";
  percent_off: number | null;
  amount_off_minor: number | null;
  applies_to_plans: string[];
  applies_to_cycles: string[];
  max_redemptions: number | null;
  minimum_purchase_minor: number | null;
  category: string;
  expires_at: string | null;
  is_active: boolean;
}

const EMPTY: Draft = {
  code: "",
  name: "",
  kind: "percentage",
  percent_off: 20,
  amount_off_minor: null,
  applies_to_plans: ["tejas"],
  applies_to_cycles: ["monthly", "yearly"],
  max_redemptions: 100,
  minimum_purchase_minor: null,
  category: "custom",
  expires_at: null,
  is_active: true,
};

export function CouponManager() {
  const { data: coupons, isLoading } = useCoupons();
  const { upsert, archive, remove } = useCouponMutations();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalRedemptions = useMemo(
    () => coupons?.reduce((sum, c) => sum + (c.redeemed_count ?? 0), 0) ?? 0,
    [coupons],
  );

  function openNew() {
    setEditingId(null);
    setEditing({ ...EMPTY });
  }

  function openEdit(c: CouponRow) {
    setEditingId(c.id);
    setEditing({
      code: c.code,
      name: c.name ?? "",
      kind: c.kind,
      percent_off: c.percent_off,
      amount_off_minor: c.amount_off_minor,
      applies_to_plans: c.applies_to_plans ?? [],
      applies_to_cycles: c.applies_to_cycles ?? [],
      max_redemptions: c.max_redemptions,
      minimum_purchase_minor: c.minimum_purchase_minor,
      category: c.category ?? "custom",
      expires_at: c.expires_at,
      is_active: c.is_active,
    });
  }

  function duplicate(c: CouponRow) {
    setEditingId(null);
    setEditing({
      code: `${c.code}_COPY`,
      name: c.name ?? "",
      kind: c.kind,
      percent_off: c.percent_off,
      amount_off_minor: c.amount_off_minor,
      applies_to_plans: c.applies_to_plans ?? [],
      applies_to_cycles: c.applies_to_cycles ?? [],
      max_redemptions: c.max_redemptions,
      minimum_purchase_minor: c.minimum_purchase_minor,
      category: c.category ?? "custom",
      expires_at: c.expires_at,
      is_active: true,
    });
  }

  async function save() {
    if (!editing) return;
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      code: editing.code.trim().toUpperCase(),
      name: editing.name || null,
      kind: editing.kind,
      percent_off: editing.kind === "percentage" ? editing.percent_off : null,
      amount_off_minor: editing.kind === "flat" ? editing.amount_off_minor : null,
      applies_to_plans: editing.applies_to_plans,
      applies_to_cycles: editing.applies_to_cycles,
      max_redemptions: editing.max_redemptions,
      minimum_purchase_minor: editing.minimum_purchase_minor,
      category: editing.category,
      expires_at: editing.expires_at,
      is_active: editing.is_active,
      duration: "one_time",
    } as never;
    await upsert.mutateAsync(payload);
    setEditing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupon Manager</h1>
          <p className="text-sm text-muted-foreground">
            {coupons?.length ?? 0} coupons · {totalRedemptions} total redemptions
          </p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Coupon
        </Button>
      </div>

      <div className="rounded-2xl border bg-card/60 backdrop-blur">
        {isLoading ? (
          <div className="flex items-center justify-center p-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : !coupons?.length ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No coupons yet.</div>
        ) : (
          <div className="divide-y">
            {coupons.map((c) => {
              const isArchived = !!c.archived_at;
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
              const value =
                c.kind === "percentage"
                  ? `${c.percent_off}% off`
                  : `₹${((c.amount_off_minor ?? 0) / 100).toFixed(0)} off`;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-[140px] font-mono text-sm font-bold uppercase tracking-wider">{c.code}</div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-sm font-medium">{c.name || value}</div>
                    <div className="text-xs text-muted-foreground">
                      {value} · {(c.applies_to_plans ?? []).join(", ") || "any plan"} ·{" "}
                      {(c.applies_to_cycles ?? []).join(", ") || "any cycle"}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.redeemed_count}/{c.max_redemptions ?? "∞"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isArchived && <Badge variant="outline">Archived</Badge>}
                    {isExpired && <Badge variant="outline">Expired</Badge>}
                    {!isArchived && !isExpired && c.is_active && (
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20">
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => duplicate(c)} title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => archive.mutate({ id: c.id, archived: !isArchived })}
                      title="Archive"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete ${c.code}? This cannot be undone.`)) remove.mutate(c.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit coupon" : "New coupon"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={editing.code}
                    onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME50"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Welcome offer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={editing.kind}
                    onValueChange={(v) => setEditing({ ...editing, kind: v as "percentage" | "flat" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="flat">Flat amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{editing.kind === "percentage" ? "Percent off" : "Amount off (₹)"}</Label>
                  <Input
                    type="number"
                    value={
                      editing.kind === "percentage"
                        ? editing.percent_off ?? ""
                        : editing.amount_off_minor != null
                          ? (editing.amount_off_minor / 100).toString()
                          : ""
                    }
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setEditing(
                        editing.kind === "percentage"
                          ? { ...editing, percent_off: n }
                          : { ...editing, amount_off_minor: Math.round(n * 100) },
                      );
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Usage limit</Label>
                  <Input
                    type="number"
                    value={editing.max_redemptions ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, max_redemptions: e.target.value ? Number(e.target.value) : null })
                    }
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <Label>Min purchase (₹)</Label>
                  <Input
                    type="number"
                    value={editing.minimum_purchase_minor != null ? editing.minimum_purchase_minor / 100 : ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        minimum_purchase_minor: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
                      })
                    }
                    placeholder="No minimum"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiry</Label>
                  <Input
                    type="date"
                    value={editing.expires_at ? editing.expires_at.slice(0, 10) : ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="festival">Festival</SelectItem>
                      <SelectItem value="launch">Launch</SelectItem>
                      <SelectItem value="earlybird">Early bird</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Save coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
