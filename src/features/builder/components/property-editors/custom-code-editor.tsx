import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html as htmlLang } from "@codemirror/lang-html";
import { css as cssLang } from "@codemirror/lang-css";
import { javascript as jsLang } from "@codemirror/lang-javascript";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Copy,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Save,
  Library,
  RefreshCw,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CustomCodeVisualControls } from "./custom-code-visual-controls";
import type { Block, CustomCodeBlock } from "../../types";
import {
  CUSTOM_CODE_PRESETS,
  buildSrcDoc,
  saveHtmlLibraryEntry,
  HtmlLibraryDialog,
} from "@/features/custom-code";
import { useWorkspaceStore } from "@/stores/workspace.store";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  block: CustomCodeBlock;
  update: (id: string, patch: Partial<Block>) => void;
}

export function CustomCodeEditor({ block, update }: Props) {
  const [tab, setTab] = useState<"design" | "html" | "css" | "js" | "settings">("html");
  const [split, setSplit] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [allowJsWorkspace, setAllowJsWorkspace] = useState(false);
  const workspaceId = useWorkspaceStore((s) => s.current?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveFn = useServerFn(saveHtmlLibraryEntry);

  // Fetch workspace-level JS toggle (super-admin controlled).
  useEffect(() => {
    if (!workspaceId) return;
    let live = true;
    supabase
      .from("workspaces")
      .select("allow_custom_js")
      .eq("id", workspaceId)
      .single()
      .then(({ data }) => {
        if (live && data) setAllowJsWorkspace(!!data.allow_custom_js);
      });
    return () => {
      live = false;
    };
  }, [workspaceId]);

  const set = (k: string, v: unknown) =>
    update(block.id, { [k]: v } as unknown as Partial<Block>);

  const srcDoc = useMemo(
    () =>
      buildSrcDoc({
        html: block.html ?? "",
        css: block.css ?? "",
        js: block.js ?? "",
        allowJs: allowJsWorkspace && !!block.jsEnabled,
        design: block.design,
      }),
    [block.html, block.css, block.js, block.jsEnabled, block.design, allowJsWorkspace],
  );

  const insertPreset = (key: string) => {
    const p = CUSTOM_CODE_PRESETS.find((x) => x.key === key);
    if (!p) return;
    update(block.id, {
      html: p.html,
      css: p.css ?? block.css ?? "",
      presetKey: p.key,
    } as Partial<Block>);
    toast.success(`Inserted "${p.label}"`);
  };

  const copy = async () => {
    const src = block[tab === "settings" || tab === "design" ? "html" : tab] ?? "";
    await navigator.clipboard.writeText(String(src));
    toast.success("Copied");
  };
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (tab === "html") set("html", text);
      else if (tab === "css") set("css", text);
      else if (tab === "js") set("js", text);
    } catch {
      toast.error("Clipboard denied");
    }
  };

  const exportHtml = () => {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${
      block.title || "Custom Code"
    }</title>${block.css ? `<style>${block.css}</style>` : ""}</head><body>${block.html ?? ""}${
      block.js && allowJsWorkspace && block.jsEnabled ? `<script>${block.js}</script>` : ""
    }</body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(block.title || "custom-code").replace(/\s+/g, "-").toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const importHtml = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      // extract <style> and <script>
      const cssMatch = text.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const jsMatch = text.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const body = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const html = body
        ? body[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")
        : text;
      update(block.id, {
        html: html.trim(),
        css: cssMatch ? cssMatch[1].trim() : block.css,
        js: jsMatch ? jsMatch[1].trim() : block.js,
      } as Partial<Block>);
      toast.success("Imported");
    };
    reader.readAsText(file);
  };

  const saveToLibrary = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          workspaceId: workspaceId!,
          name: block.title || "Untitled snippet",
          description: block.description,
          category: "Custom",
          scope: "workspace",
          html: block.html ?? "",
          css: block.css ?? "",
          js: block.js ?? "",
          presetKey: block.presetKey,
        },
      }),
    onSuccess: () => toast.success("Saved to library"),
    onError: (e: Error) => toast.error(e.message),
  });

  const charCount =
    (tab === "html" ? block.html : tab === "css" ? block.css : tab === "js" ? block.js : "")
      ?.length ?? 0;

  const editorHeight = fullscreen ? "calc(100dvh - 220px)" : "320px";

  const editorPane = (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1">
          <TabsList className="h-8">
            <TabsTrigger value="design" className="h-7 px-2 text-xs">
              Design
            </TabsTrigger>
            <TabsTrigger value="html" className="h-7 px-2 text-xs">
              HTML
            </TabsTrigger>
            <TabsTrigger value="css" className="h-7 px-2 text-xs">
              CSS
            </TabsTrigger>
            <TabsTrigger value="js" className="h-7 px-2 text-xs">
              JS
            </TabsTrigger>
            <TabsTrigger value="settings" className="h-7 px-2 text-xs">
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copy} title="Copy">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={paste} title="Paste">
            <ClipboardPaste className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setFullscreen((v) => !v)}
            title="Fullscreen"
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
      <div className="min-w-0">
        {tab === "design" && (
          <div className="max-h-[70vh] overflow-y-auto p-3" style={{ maxHeight: editorHeight }}>
            <CustomCodeVisualControls
              design={block.design}
              onChange={(design) => set("design", design)}
            />
          </div>
        )}
        {tab === "html" && (
          <CodeMirror
            value={block.html ?? ""}
            height={editorHeight}
            extensions={[htmlLang()]}
            onChange={(v) => set("html", v)}
            basicSetup={{ lineNumbers: true, foldGutter: true, searchKeymap: true }}
          />
        )}
        {tab === "css" && (
          <CodeMirror
            value={block.css ?? ""}
            height={editorHeight}
            extensions={[cssLang()]}
            onChange={(v) => set("css", v)}
            basicSetup={{ lineNumbers: true, foldGutter: true, searchKeymap: true }}
          />
        )}
        {tab === "js" && (
          <>
            {!allowJsWorkspace ? (
              <div className="p-6">
                <Alert>
                  <AlertTitle>Custom JavaScript is disabled</AlertTitle>
                  <AlertDescription>
                    A workspace owner can enable it in Settings → Security. Until then this code is
                    stored but never executed.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b p-2">
                  <Label className="text-xs">Execute JS in sandbox</Label>
                  <Switch
                    checked={!!block.jsEnabled}
                    onCheckedChange={(v) => set("jsEnabled", v)}
                  />
                </div>
                <CodeMirror
                  value={block.js ?? ""}
                  height={editorHeight}
                  extensions={[jsLang()]}
                  onChange={(v) => set("js", v)}
                  basicSetup={{ lineNumbers: true, foldGutter: true, searchKeymap: true }}
                />
              </>
            )}
          </>
        )}
        {tab === "settings" && (
          <div className="space-y-3 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={block.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Custom Code Block"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={block.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Container width</Label>
              <Select
                value={block.containerWidth ?? "full"}
                onValueChange={(v) => set("containerWidth", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrow">Narrow (480 px)</SelectItem>
                  <SelectItem value="full">Full width</SelectItem>
                  <SelectItem value="wide">Wide (960 px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Min height (px)</Label>
                <Input
                  type="number"
                  value={block.minHeight ?? 0}
                  onChange={(e) => set("minHeight", Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Border radius (px)</Label>
                <Input
                  type="number"
                  value={block.borderRadius ?? 0}
                  onChange={(e) => set("borderRadius", Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-2">
              <div>
                <div className="text-xs font-medium">Lazy render</div>
                <div className="text-[11px] text-muted-foreground">
                  Load the widget only when scrolled into view.
                </div>
              </div>
              <Switch checked={block.lazy ?? true} onCheckedChange={(v) => set("lazy", v)} />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
        <span>{charCount.toLocaleString()} chars</span>
        <span>Sandboxed · JS {allowJsWorkspace && block.jsEnabled ? "enabled" : "off"}</span>
      </div>
    </div>
  );

  const previewPane = (
    <div className="flex flex-col overflow-hidden rounded-md border">
      <div className="flex items-center justify-between border-b bg-muted/40 p-1.5">
        <span className="pl-2 text-xs font-medium">Live preview</span>
        <div className="flex items-center gap-1">
          <Label className="text-[11px] text-muted-foreground">Split</Label>
          <Switch checked={split} onCheckedChange={setSplit} />
        </div>
      </div>
      <iframe
        title="Custom Code preview"
        sandbox="allow-scripts allow-popups allow-forms"
        srcDoc={srcDoc}
        style={{
          width: "100%",
          height: fullscreen ? "calc(100dvh - 220px)" : "320px",
          border: 0,
          background: "transparent",
        }}
      />
    </div>
  );

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[80] flex flex-col gap-2 overflow-auto bg-background p-4"
          : "space-y-3"
      }
    >
      {fullscreen && (
        <div className="flex items-center justify-between border-b pb-2">
          <div className="text-sm font-semibold">Custom Code Studio · Fullscreen</div>
          <Button size="sm" variant="outline" onClick={() => setFullscreen(false)}>
            <Minimize2 className="mr-1 h-3.5 w-3.5" /> Exit
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Select value={block.presetKey ?? ""} onValueChange={insertPreset}>
          <SelectTrigger className="h-8 w-[190px] text-xs">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            <SelectValue placeholder="Insert embed…" />
          </SelectTrigger>
          <SelectContent>
            {CUSTOM_CODE_PRESETS.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label} · {p.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setLibraryOpen(true)}>
          <Library className="mr-1 h-3.5 w-3.5" /> Library
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!workspaceId || saveToLibrary.isPending}
          onClick={() => saveToLibrary.mutate()}
        >
          <Save className="mr-1 h-3.5 w-3.5" /> Save
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" /> Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,text/html"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importHtml(f);
            e.target.value = "";
          }}
        />
        <Button size="sm" variant="outline" onClick={exportHtml}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            update(block.id, { html: block.html ?? "" } as Partial<Block>)
          }
          title="Refresh preview"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className={split ? "grid gap-2 lg:grid-cols-2" : "space-y-2"}>
        {editorPane}
        {previewPane}
      </div>

      <HtmlLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onInsert={(entry) => {
          update(block.id, {
            html: entry.html,
            css: entry.css,
            js: entry.js,
            title: entry.name,
            description: entry.description ?? undefined,
            sourceLibraryId: entry.id,
            presetKey: entry.preset_key ?? undefined,
          } as Partial<Block>);
          setLibraryOpen(false);
          toast.success(`Inserted "${entry.name}"`);
        }}
      />
    </div>
  );
}
