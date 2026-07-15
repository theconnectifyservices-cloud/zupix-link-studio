import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Loader2,
  Sparkles,
  Star,
  StarOff,
  Trash2,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import {
  GENERATORS,
  getGenerator,
  type GeneratorCategory,
  type GeneratorDef,
} from "./generators";
import { INDUSTRY_TEMPLATES, templatesByIndustry } from "./templates";
import { brandContextToPrompt } from "./brand-context";
import {
  useBrandContext,
  useContentHistory,
  useDeleteHistory,
  useGenerateContent,
  useSaveHistory,
  useToggleFavoriteHistory,
} from "./hooks";

const CATEGORY_LABEL: Record<GeneratorCategory, string> = {
  bio: "Bio Writer",
  cta: "CTA Generator",
  social: "Social Content",
  seo: "SEO Content",
  button: "Button Text",
  rewrite: "Rewrite Tools",
};

interface Props {
  workspaceId: string;
  userId: string;
}

export function ContentStudio({ workspaceId, userId }: Props) {
  const [activeId, setActiveId] = useState<string>(GENERATORS[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");

  const brand = useBrandContext(workspaceId);
  const history = useContentHistory(workspaceId);
  const generate = useGenerateContent();
  const save = useSaveHistory();
  const toggleFav = useToggleFavoriteHistory(workspaceId);
  const del = useDeleteHistory(workspaceId);

  const active = useMemo(() => getGenerator(activeId)!, [activeId]);

  function switchGenerator(g: GeneratorDef, seed: Record<string, string> = {}) {
    setActiveId(g.id);
    const initial: Record<string, string> = {};
    for (const f of g.fields) {
      if (seed[f.id]) initial[f.id] = seed[f.id];
      else if (f.kind === "select") initial[f.id] = f.options?.[0]?.value ?? "";
      else initial[f.id] = "";
    }
    setValues(initial);
    setOutput("");
  }

  // Initialize values on first render
  if (Object.keys(values).length === 0) {
    const initial: Record<string, string> = {};
    for (const f of active.fields) {
      if (f.kind === "select") initial[f.id] = f.options?.[0]?.value ?? "";
      else initial[f.id] = "";
    }
    if (Object.keys(initial).length > 0) setValues(initial);
  }

  async function handleGenerate() {
    if (!brand.data) {
      toast.error("Brand context still loading");
      return;
    }
    const required = active.fields.filter((f) => !f.optional);
    for (const f of required) {
      if (!values[f.id]?.trim()) {
        toast.error(`Please fill ${f.label}`);
        return;
      }
    }
    const brandBlock = brandContextToPrompt(brand.data);
    const system = active.buildSystem(brandBlock);
    const prompt = active.buildPrompt(values);
    try {
      const content = await generate.mutateAsync({ system, prompt });
      setOutput(content);
      await save
        .mutateAsync({
          workspaceId,
          userId,
          generatorId: active.id,
          category: active.category,
          inputs: values,
          output: content,
        })
        .catch(() => {});
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function copyOutput(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const templates = templatesByIndustry();

  return (
    <div className="space-y-6">
      <BrandBadge brand={brand.data} loading={brand.isLoading} />

      <Tabs defaultValue="generators">
        <TabsList>
          <TabsTrigger value="generators">Generators</TabsTrigger>
          <TabsTrigger value="templates">Prompt Templates</TabsTrigger>
          <TabsTrigger value="history">
            History{history.data?.length ? ` (${history.data.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generators" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
            <nav className="space-y-1">
              {GENERATORS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => switchGenerator(g)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    activeId === g.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs opacity-70">{CATEGORY_LABEL[g.category]}</div>
                </button>
              ))}
            </nav>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" /> {active.name}
                </CardTitle>
                <CardDescription>{active.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {active.fields.map((f) => (
                  <div key={f.id} className="space-y-1.5">
                    <Label htmlFor={f.id}>
                      {f.label}
                      {f.optional && (
                        <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                      )}
                    </Label>
                    {f.kind === "text" && (
                      <Input
                        id={f.id}
                        value={values[f.id] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                        placeholder={f.placeholder}
                      />
                    )}
                    {f.kind === "textarea" && (
                      <Textarea
                        id={f.id}
                        value={values[f.id] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                        placeholder={f.placeholder}
                        rows={4}
                      />
                    )}
                    {f.kind === "select" && (
                      <Select
                        value={values[f.id] ?? f.options?.[0]?.value}
                        onValueChange={(val) => setValues((v) => ({ ...v, [f.id]: val }))}
                      >
                        <SelectTrigger id={f.id}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {f.options?.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleGenerate} disabled={generate.isPending}>
                    {generate.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-4 w-4" />
                    )}
                    Generate
                  </Button>
                  {output && (
                    <Button variant="outline" onClick={handleGenerate} disabled={generate.isPending}>
                      <RefreshCw className="mr-1 h-4 w-4" /> Regenerate
                    </Button>
                  )}
                </div>

                {output && (
                  <div className="mt-4 rounded-md border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Output</span>
                      <Button size="sm" variant="ghost" onClick={() => copyOutput(output)}>
                        <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">{output}</pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-6">
          {Object.entries(templates).map(([industry, items]) => (
            <div key={industry}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {industry}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      const g = getGenerator(t.generatorId);
                      if (!g) return;
                      switchGenerator(g, t.values);
                      toast.success(`Loaded template: ${t.label}`);
                    }}
                    className="rounded-lg border bg-card p-4 text-left transition hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{CATEGORY_LABEL[t.category]}</Badge>
                    </div>
                    <div className="mt-2 font-medium">{t.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            {INDUSTRY_TEMPLATES.length} templates available.
          </p>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {(history.data ?? []).length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No generations yet. Try one of the tools above.
            </div>
          ) : (
            <div className="space-y-3">
              {history.data!.map((h) => {
                const meta = (h.metadata ?? {}) as {
                  generator?: string;
                  output?: string;
                  favorite?: boolean;
                  inputs?: Record<string, string>;
                };
                const g = meta.generator ? getGenerator(meta.generator) : null;
                return (
                  <Card key={h.id}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base">{g?.name ?? meta.generator}</CardTitle>
                        <CardDescription>
                          {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleFav.mutate({
                              id: h.id,
                              favorite: !meta.favorite,
                              current: h.metadata,
                            })
                          }
                        >
                          {meta.favorite ? (
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyOutput(meta.output ?? "")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {g && meta.inputs && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              switchGenerator(g, meta.inputs!);
                              setOutput(meta.output ?? "");
                              toast.success("Loaded into generator");
                            }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => del.mutate(h.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
                        {meta.output}
                      </pre>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BrandBadge({
  brand,
  loading,
}: {
  brand: ReturnType<typeof useBrandContext>["data"];
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 py-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Brand context:</span>
        {loading ? (
          <span className="text-sm text-muted-foreground">Loading…</span>
        ) : brand ? (
          <>
            <Badge variant="secondary">{brand.brandName || brand.workspaceName || "Unnamed"}</Badge>
            {brand.industry && <Badge variant="outline">{brand.industry}</Badge>}
            {brand.targetAudience && <Badge variant="outline">👥 {brand.targetAudience}</Badge>}
            {brand.brandVoice && <Badge variant="outline">🎙 {brand.brandVoice}</Badge>}
            {brand.primaryColor && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ background: brand.primaryColor }}
                />
                {brand.primaryColor}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No brand kit configured</span>
        )}
      </CardContent>
    </Card>
  );
}
