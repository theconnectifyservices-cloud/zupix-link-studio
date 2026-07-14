import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { checkHostAvailable, createDomain } from "../api";
import { validateHost } from "../validation";

export function ConnectDomainDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const v = validateHost(value);
      if (!v.ok) throw new Error(v.error);
      const free = await checkHostAvailable(v.host);
      if (!free) throw new Error("This domain is already connected to another workspace");
      return createDomain({ workspaceId, host: v.host });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domains", workspaceId] });
      toast.success("Domain added — follow the DNS wizard to verify");
      setOpen(false);
      setValue("");
      setError(null);
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setValue("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Connect domain
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a custom domain</DialogTitle>
          <DialogDescription>
            Add a domain you own. We'll walk you through the DNS setup next.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Domain</Label>
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="example.com or www.example.com"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-[11px] text-muted-foreground">
            Root domains, www, and any subdomain are supported.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending || !value}>
            {create.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Add domain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
