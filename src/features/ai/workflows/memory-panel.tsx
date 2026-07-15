/**
 * LS-12E — Workspace AI Memory Editor.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { loadWorkspaceMemory, saveWorkspaceMemory, type WorkspaceMemory } from "./memory";

export function MemoryPanel({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const [memory, setMemory] = useState<WorkspaceMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWorkspaceMemory(workspaceId)
      .then(setMemory)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load memory"))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const patch = (key: keyof WorkspaceMemory, value: unknown) =>
    setMemory((m) => ({ ...(m ?? { workspace_id: workspaceId } as WorkspaceMemory), [key]: value }));

  const handleSave = async () => {
    if (!memory) return;
    setSaving(true);
    try {
      const saved = await saveWorkspaceMemory(workspaceId, userId, {
        brand_voice: memory.brand_voice ?? null,
        preferred_tone: memory.preferred_tone ?? null,
        target_audience: memory.target_audience ?? null,
        notes: memory.notes ?? null,
        content_preferences: memory.content_preferences ?? {},
        design_preferences: memory.design_preferences ?? {},
      });
      setMemory(saved);
      toast.success("Memory saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading memory…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Workspace AI Memory</CardTitle>
        <p className="text-xs text-muted-foreground">
          Guides every AI workflow in this workspace. Isolated from other workspaces.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Brand voice</Label>
          <Input
            placeholder="e.g. Confident, warm, playful"
            value={memory?.brand_voice ?? ""}
            onChange={(e) => patch("brand_voice", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Preferred tone</Label>
          <Input
            placeholder="e.g. Professional, conversational"
            value={memory?.preferred_tone ?? ""}
            onChange={(e) => patch("preferred_tone", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Target audience</Label>
          <Input
            placeholder="e.g. Small business owners in North America"
            value={memory?.target_audience ?? ""}
            onChange={(e) => patch("target_audience", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Notes</Label>
          <Textarea
            rows={4}
            placeholder="Anything else the AI should remember about this workspace."
            value={memory?.notes ?? ""}
            onChange={(e) => patch("notes", e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save memory"}
        </Button>
      </CardContent>
    </Card>
  );
}
