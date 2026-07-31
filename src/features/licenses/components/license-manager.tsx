import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Ban,
  Copy,
  Download,
  KeyRound,
  Layers,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  createLicense,
  createLicensesBulk,
  deleteLicense,
  generateKey,
  licensesToCsv,
  listLicenses,
  regenerateLicenseKey,
  updateLicense,
} from "../api";
import {
  DEVICE_OPTIONS,
  PLAN_DURATION_DAYS,
  PLAN_LABELS,
  PLAN_OPTIONS,
  STATUS_LABELS,
  type LicensePlan,
  type LicenseStatusValue,
  type ProductLicense,
} from "../types";

function expiryFor(plan: LicensePlan): string | null {
  const days = PLAN_DURATION_DAYS[plan];
  if (days == null) return null;
  return new Date(Date.now() + days * 86400000).toISOString();
}

const statusTone: Record<LicenseStatusValue, string> = {
  active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  unused: "bg-muted text-muted-foreground",
  suspended: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  revoked: "bg-destructive/15 text-destructive",
  expired: "bg-destructive/10 text-destructive",
};

export function LicenseManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ProductLicense | null>(null);
  const [creating, setCreating] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: licenses = [], isLoading } = useQuery({
    queryKey: ["product-licenses"],
    queryFn: () => listLicenses(),
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return licenses;
    return licenses.filter((l) =>
      [l.license_key, l.customer_name, l.email, l.phone, PLAN_LABELS[l.plan]]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [licenses, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["product-licenses"] });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LicenseStatusValue }) =>
      updateLicense(id, { status }),
    onSuccess: () => {
      invalidate();
      toast.success("Licence updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLicense(id),
    onSuccess: () => {
      invalidate();
      toast.success("Licence deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenerate = useMutation({
    mutationFn: (id: string) => regenerateLicenseKey(id),
    onSuccess: (key) => {
      invalidate();
      toast.success(`New key: ${key}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copy(key: string) {
    navigator.clipboard?.writeText(key);
    toast.success("Licence key copied");
  }

  function exportCsv() {
    const blob = new Blob([licensesToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zupix-licenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">License Manager</h1>
          <p className="text-sm text-muted-foreground">
            Create, activate and control every ZUPIX licence key.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Bulk export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
            <Layers className="mr-2 h-4 w-4" /> Bulk create
          </Button>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create license
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search key, name, email, phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Licenses <span className="text-muted-foreground">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      Loading licences…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No licences yet. Create your first key.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs">{l.license_key}</TableCell>
                    <TableCell>
                      <div className="text-sm">{l.customer_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{l.email ?? l.phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{PLAN_LABELS[l.plan]}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusTone[l.status]}>
                        {STATUS_LABELS[l.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.max_devices < 0 ? "Unlimited" : l.max_devices}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.last_login_at ? new Date(l.last_login_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" title="Copy" onClick={() => copy(l.license_key)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(l)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Regenerate key"
                          onClick={() => regenerate.mutate(l.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {l.status === "suspended" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Resume"
                            onClick={() => setStatus.mutate({ id: l.id, status: "active" })}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Suspend"
                            onClick={() => setStatus.mutate({ id: l.id, status: "suspended" })}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Revoke"
                          onClick={() => setStatus.mutate({ id: l.id, status: "revoked" })}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete licence ${l.license_key}?`)) remove.mutate(l.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <LicenseDialog
        open={creating || !!editing}
        license={editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSaved={invalidate}
      />

      <BulkCreateDialog open={bulkOpen} onOpenChange={setBulkOpen} onSaved={invalidate} />
    </div>
  );
}

function LicenseDialog({
  open,
  license,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  license: ProductLicense | null;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<ProductLicense>>({});
  const [busy, setBusy] = useState(false);
  const value = { plan: "monthly" as LicensePlan, max_devices: 1, ...(license ?? {}), ...form };

  async function save() {
    setBusy(true);
    try {
      const payload: Partial<ProductLicense> = {
        customer_name: value.customer_name ?? null,
        email: value.email ? String(value.email).toLowerCase() : null,
        phone: value.phone ?? null,
        plan: value.plan as LicensePlan,
        max_devices: Number(value.max_devices ?? 1),
        notes: value.notes ?? null,
        expires_at: value.expires_at ?? null,
      };
      if (license) {
        await updateLicense(license.id, { ...payload, status: value.status as LicenseStatusValue });
        toast.success("Licence updated");
      } else {
        const key = await generateKey(String(value.plan));
        await createLicense({
          ...payload,
          license_key: key,
          status: "unused",
          expires_at: payload.expires_at ?? expiryFor(value.plan as LicensePlan),
        });
        toast.success(`Licence created: ${key}`);
      }
      onSaved();
      setForm({});
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save licence");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setForm({});
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{license ? "Edit license" : "Create license"}</DialogTitle>
          <DialogDescription>
            {license ? license.license_key : "A unique key is generated automatically."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name">
            <Input
              value={value.customer_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={value.email ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={value.phone ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="Plan">
            <Select
              value={value.plan as string}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  plan: v as LicensePlan,
                  expires_at: expiryFor(v as LicensePlan),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Device limit">
            <Select
              value={String(value.max_devices ?? 1)}
              onValueChange={(v) => setForm((f) => ({ ...f, max_devices: Number(v) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Expiry date">
            <Input
              type="date"
              value={value.expires_at ? String(value.expires_at).slice(0, 10) : ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </Field>
          {license && (
            <Field label="Status">
              <Select
                value={value.status as string}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as LicenseStatusValue }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={3}
                value={value.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving…" : license ? "Save changes" : "Create license"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkCreateDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [count, setCount] = useState(10);
  const [plan, setPlan] = useState<LicensePlan>("monthly");
  const [devices, setDevices] = useState(1);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const rows: Partial<ProductLicense>[] = [];
      for (let i = 0; i < Math.min(Math.max(count, 1), 200); i++) {
        rows.push({
          license_key: await generateKey(plan),
          plan,
          max_devices: devices,
          status: "unused",
          expires_at: expiryFor(plan),
        });
      }
      const n = await createLicensesBulk(rows);
      toast.success(`${n} licences created`);
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk create licenses</DialogTitle>
          <DialogDescription>Generate up to 200 keys at once.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="How many">
            <Input
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </Field>
          <Field label="Plan">
            <Select value={plan} onValueChange={(v) => setPlan(v as LicensePlan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map(([v, label]) => (
                  <SelectItem key={v} value={v}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Device limit">
            <Select value={String(devices)} onValueChange={(v) => setDevices(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEVICE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={run} disabled={busy}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
