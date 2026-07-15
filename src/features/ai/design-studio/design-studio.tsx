/**
 * LS-12C — AI Design Studio UI.
 *
 * Analyzes a selected bio page and presents scored recommendations
 * across Design, Brand, Colors, Typography, CTA, Layout, A11y, and
 * Conversion. Every suggestion supports Preview → Apply → Undo /
 * Reject, and all actions are logged to ai_activity for history.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Contrast,
  Gauge,
  History,
  Info,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  Type,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/shared/ui/empty-state";
import { useBioPages } from "@/features/bio-pages/hooks/use-bio-pages";
import type { BioContent } from "@/features/builder/types";
import type { PageTheme } from "@/features/builder/theme";
import { DEFAULT_THEME } from "@/features/builder/theme";
import {
  loadBrandContext,
  brandContextToPrompt,
} from "@/features/ai/content-studio/brand-context";
import {
  analyzePage,
  contrastRatio,
  type AnalysisReport,
  type Finding,
} from "./analyzer";
import { FONT_PAIRS, PALETTE_PRESETS, type FontPairPreset, type PalettePreset } from "./palettes";
import {
  generateRecommendations,
  type AiRecommendation,
  type DeepPartial,
  type DesignHistoryEntry,
} from "./api";
import {
  useApplyPatch,
  useDesignHistory,
  usePageContent,
  useRecordHistory,
  useRestore,
} from "./hooks";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Props {
  workspaceId: string;
  userId: string;
}

type DeepPartial<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends object ? DeepPartial<NonNullable<T[K]>> : T[K];
};

export function DesignStudio({ workspaceId, userId }: Props) {
  const { data: pages = [], isLoading: pagesLoading } = useBioPages(workspaceId);
  const eligible = pages.filter((p) => p.status !== "archived");
  const [pageId, setPageId] = useState<string | undefined>(() => eligible[0]?.id);
  const currentId = pageId ?? eligible[0]?.id;

  const { data: page, isLoading: pageLoading } = usePageContent(currentId);
  const applyPatch = useApplyPatch();
  const restore = useRestore();
  const recordHistory = useRecordHistory();

  // Snapshot the content taken before the last apply so we can undo.
  const [undoSnapshot, setUndoSnapshot] = useState<BioContent | null>(null);

  const { data: brandCtx } = useQuery({
    queryKey: ["design-studio", "brand", workspaceId],
    queryFn: () => loadBrandContext(workspaceId),
  });

  const report: AnalysisReport | null = useMemo(() => {
    if (!page?.content) return null;
    return analyzePage({
      content: page.content,
      brand: {
        primary: brandCtx?.primaryColor,
        secondary: brandCtx?.secondaryColor,
        accent: brandCtx?.accentColor,
      },
    });
  }, [page?.content, brandCtx]);

  if (pagesLoading) return <div className="text-sm text-muted-foreground">Loading pages…</div>;
  if (eligible.length === 0)
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No bio pages yet"
        description="Create a bio page first, then the Design Studio can analyze and improve it."
      />
    );

  async function applyAndLog(args: {
    patch: DeepPartial<PageTheme>;
    title: string;
    category: string;
  }) {
    if (!currentId || !page?.content) return;
    const before = page.content;
    setUndoSnapshot(before);
    try {
      await applyPatch.mutateAsync({
        pageId: currentId,
        content: before,
        patch: args.patch,
      });
      await recordHistory.mutateAsync({
        workspaceId,
        userId,
        pageId: currentId,
        category: args.category,
        suggestionTitle: args.title,
        status: "applied",
        score: report?.overall,
        patch: args.patch,
        snapshot: before,
      } satisfies DesignHistoryEntry);
      toast.success(`Applied: ${args.title}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function undoLast() {
    if (!currentId || !undoSnapshot) return;
    try {
      await restore.mutateAsync({ pageId: currentId, content: undoSnapshot });
      setUndoSnapshot(null);
      toast.success("Reverted to previous version");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function rejectSuggestion(title: string, category: string) {
    if (!currentId) return;
    await recordHistory.mutateAsync({
      workspaceId,
      userId,
      pageId: currentId,
      category,
      suggestionTitle: title,
      status: "rejected",
      score: report?.overall,
    });
    toast.message(`Dismissed: ${title}`);
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Bio page</label>
          <Select value={currentId} onValueChange={setPageId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eligible.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undoLast}
            disabled={!undoSnapshot || restore.isPending}
          >
            <Undo2 className="mr-1 h-4 w-4" /> Undo last apply
          </Button>
        </div>
      </div>

      {pageLoading || !report ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing page…
        </div>
      ) : (
        <>
          <ScoreBoard report={report} />

          <Tabs defaultValue="analysis">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="analysis">
                <Gauge className="mr-1 h-4 w-4" /> Analysis
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="mr-1 h-4 w-4" /> AI recommendations
              </TabsTrigger>
              <TabsTrigger value="colors">
                <Palette className="mr-1 h-4 w-4" /> Colors
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="mr-1 h-4 w-4" /> Typography
              </TabsTrigger>
              <TabsTrigger value="cta">
                <Wand2 className="mr-1 h-4 w-4" /> CTA
              </TabsTrigger>
              <TabsTrigger value="a11y">
                <Contrast className="mr-1 h-4 w-4" /> Accessibility
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-1 h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="mt-4 space-y-4">
              <FindingsPanel report={report} onReject={rejectSuggestion} />
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <AiRecommendationsPanel
                report={report}
                brandPrompt={brandCtx ? brandContextToPrompt(brandCtx) : ""}
                onReject={(title) => rejectSuggestion(title, "ai")}
              />
            </TabsContent>

            <TabsContent value="colors" className="mt-4">
              <ColorsPanel
                currentTheme={page?.content.theme ?? DEFAULT_THEME}
                onApply={(preset) =>
                  applyAndLog({
                    patch: { colors: preset.colors },
                    title: `Palette · ${preset.label}`,
                    category: "color",
                  })
                }
                brand={{
                  primary: brandCtx?.primaryColor,
                  secondary: brandCtx?.secondaryColor,
                  accent: brandCtx?.accentColor,
                }}
                onApplyBrand={() => {
                  const patch: DeepPartial<PageTheme> = { colors: {} };
                  if (brandCtx?.primaryColor) patch.colors!.primary = brandCtx.primaryColor;
                  if (brandCtx?.secondaryColor) patch.colors!.secondary = brandCtx.secondaryColor;
                  if (brandCtx?.accentColor) patch.colors!.accent = brandCtx.accentColor;
                  applyAndLog({ patch, title: "Sync brand kit colors", category: "brand" });
                }}
              />
            </TabsContent>

            <TabsContent value="typography" className="mt-4">
              <TypographyPanel
                onApplyPair={(pair) =>
                  applyAndLog({
                    patch: {
                      typography: {
                        fontFamily: pair.fontFamily,
                        headingFamily: pair.headingFamily,
                        buttonFamily: pair.buttonFamily ?? pair.fontFamily,
                      },
                    },
                    title: `Font pair · ${pair.label}`,
                    category: "typography",
                  })
                }
                onApplyReadability={() =>
                  applyAndLog({
                    patch: {
                      typography: { baseSize: 16, lineHeight: 1.55, letterSpacing: 0 },
                    },
                    title: "Boost body readability (16px / 1.55)",
                    category: "typography",
                  })
                }
              />
            </TabsContent>

            <TabsContent value="cta" className="mt-4">
              <CtaPanel
                onApplyLarger={() =>
                  applyAndLog({
                    patch: {
                      buttons: { ...DEFAULT_THEME.buttons, height: 52, paddingX: 24 },
                    },
                    title: "Increase button size to 52px",
                    category: "cta",
                  })
                }
                onApplyPrimaryAccent={() =>
                  applyAndLog({
                    patch: {
                      buttons: { ...DEFAULT_THEME.buttons, variant: "gradient" },
                    },
                    title: "Use gradient buttons for emphasis",
                    category: "cta",
                  })
                }
              />
            </TabsContent>

            <TabsContent value="a11y" className="mt-4">
              <A11yPanel
                theme={page?.content.theme ?? DEFAULT_THEME}
                onFix={(patch, title) => applyAndLog({ patch, title, category: "a11y" })}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <HistoryPanel workspaceId={workspaceId} pageId={currentId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────

function ScoreBoard({ report }: { report: AnalysisReport }) {
  const cards = [
    { label: "Overall", value: report.overall },
    { label: "Design", value: report.design.score },
    { label: "Brand", value: report.brand.score },
    { label: "Accessibility", value: report.accessibility.score },
    { label: "CTA", value: report.cta.score },
    { label: "Layout", value: report.layout.score },
    { label: "Conversion", value: report.conversion.score },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-card p-4">
          <p className="text-xs text-muted-foreground">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreColor(c.value)}`}>{c.value}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${scoreBg(c.value)}`}
              style={{ width: `${c.value}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function scoreColor(v: number) {
  if (v >= 80) return "text-emerald-600";
  if (v >= 60) return "text-amber-600";
  return "text-rose-600";
}
function scoreBg(v: number) {
  if (v >= 80) return "bg-emerald-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-rose-500";
}

function FindingsPanel({
  report,
  onReject,
}: {
  report: AnalysisReport;
  onReject: (title: string, category: string) => void;
}) {
  const all: Finding[] = [
    ...report.design.findings,
    ...report.brand.findings,
    ...report.accessibility.findings,
    ...report.cta.findings,
    ...report.layout.findings,
    ...report.conversion.findings,
  ].sort((a, b) => b.weight - a.weight);

  if (all.length === 0)
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-2 font-medium">No issues detected</p>
        <p className="text-sm text-muted-foreground">
          Your page passes every heuristic check. Consider AI recommendations for further polish.
        </p>
      </div>
    );

  return (
    <div className="space-y-2">
      {all.map((f) => (
        <div key={f.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
          <SeverityIcon severity={f.severity} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {f.category}
              </span>
              <span className="font-medium">{f.title}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{f.detail}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onReject(f.title, f.category)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: Finding["severity"] }) {
  if (severity === "critical")
    return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />;
  if (severity === "warn")
    return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />;
  return <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />;
}

function AiRecommendationsPanel({
  report,
  brandPrompt,
  onReject,
}: {
  report: AnalysisReport;
  brandPrompt: string;
  onReject: (title: string) => void;
}) {
  const [items, setItems] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const r = await generateRecommendations(report, brandPrompt);
      setItems(r);
      if (r.length === 0) toast.message("AI returned no additional recommendations.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <div>
          <p className="font-medium">AI narrative recommendations</p>
          <p className="text-xs text-muted-foreground">
            Uses your brand context + current findings to suggest higher-level improvements.
          </p>
        </div>
        <Button size="sm" onClick={run} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-4 w-4" />
          )}
          {items.length ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-sm text-muted-foreground">
          Click generate for AI-crafted design ideas tailored to your brand.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
              <PriorityChip priority={r.priority} />
              <div className="flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{r.reason}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {r.category}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onReject(r.title)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityChip({ priority }: { priority: AiRecommendation["priority"] }) {
  const styles =
    priority === "high"
      ? "bg-rose-500/10 text-rose-600"
      : priority === "medium"
        ? "bg-amber-500/10 text-amber-600"
        : "bg-sky-500/10 text-sky-600";
  return (
    <span
      className={`mt-0.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles}`}
    >
      {priority}
    </span>
  );
}

function ColorsPanel({
  currentTheme,
  onApply,
  brand,
  onApplyBrand,
}: {
  currentTheme: PageTheme;
  onApply: (preset: PalettePreset) => void;
  brand: { primary?: string; secondary?: string; accent?: string };
  onApplyBrand: () => void;
}) {
  const [preview, setPreview] = useState<PalettePreset | null>(null);
  const active = preview ?? {
    id: "current",
    label: "Current",
    tags: [],
    colors: currentTheme.colors,
  };
  const anyBrand = brand.primary || brand.secondary || brand.accent;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        {anyBrand ? (
          <div className="rounded-lg border bg-card p-3">
            <p className="text-sm font-medium">Sync brand kit colors</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Push your brand kit palette straight into the page theme.
            </p>
            <Button size="sm" className="mt-2 w-full" onClick={onApplyBrand}>
              <Check className="mr-1 h-4 w-4" /> Apply
            </Button>
          </div>
        ) : null}
        <div className="space-y-2">
          {PALETTE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreview(p)}
              className={`w-full rounded-lg border p-2 text-left transition ${
                preview?.id === p.id ? "border-primary" : "hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{p.label}</span>
                <span className="flex gap-1">
                  {[p.colors.primary, p.colors.accent, p.colors.background].map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-full border"
                      style={{ background: c }}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{p.tags.join(" · ")}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <PalettePreview colors={active.colors} label={active.label} />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset preview
          </Button>
          <Button size="sm" disabled={!preview} onClick={() => preview && onApply(preview)}>
            <Check className="mr-1 h-4 w-4" /> Apply palette
          </Button>
        </div>
      </div>
    </div>
  );
}

function PalettePreview({
  colors,
  label,
}: {
  colors: PalettePreset["colors"];
  label: string;
}) {
  return (
    <div
      className="rounded-md p-6"
      style={{ background: colors.background, color: colors.text }}
    >
      <p className="text-xs uppercase tracking-wide" style={{ color: colors.textMuted }}>
        Preview
      </p>
      <h4 className="mt-1 text-lg font-semibold">{label}</h4>
      <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
        Your brand story, told in this palette.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: colors.primary, color: colors.primaryText }}
        >
          Primary CTA
        </span>
        <span
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: colors.secondary, color: colors.secondaryText }}
        >
          Secondary
        </span>
        <span
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: colors.accent, color: colors.primaryText }}
        >
          Accent
        </span>
      </div>
    </div>
  );
}

function TypographyPanel({
  onApplyPair,
  onApplyReadability,
}: {
  onApplyPair: (pair: FontPairPreset) => void;
  onApplyReadability: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-3">
        <p className="font-medium">Readability boost</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Bump body to 16px with 1.55 line height for the most legible reading experience.
        </p>
        <Button size="sm" className="mt-2" onClick={onApplyReadability}>
          <Check className="mr-1 h-4 w-4" /> Apply
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FONT_PAIRS.map((pair) => (
          <div key={pair.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{pair.label}</p>
              <span className="text-[10px] uppercase text-muted-foreground">
                {pair.tags.join(" · ")}
              </span>
            </div>
            <p
              className="mt-2 text-2xl font-semibold"
              style={{ fontFamily: pair.headingFamily }}
            >
              A distinctive headline
            </p>
            <p className="mt-1 text-sm" style={{ fontFamily: pair.fontFamily }}>
              Supporting body copy carries the tone with clarity and calm.
            </p>
            <Button size="sm" className="mt-3" onClick={() => onApplyPair(pair)}>
              Apply pair
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaPanel({
  onApplyLarger,
  onApplyPrimaryAccent,
}: {
  onApplyLarger: () => void;
  onApplyPrimaryAccent: () => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border bg-card p-4">
        <p className="font-medium">Enlarge buttons</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Raises button height to 52px with generous horizontal padding — better tap targets and a
          more premium feel.
        </p>
        <Button size="sm" className="mt-3" onClick={onApplyLarger}>
          Apply
        </Button>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="font-medium">Gradient primary buttons</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Switch buttons to a gradient variant for visual emphasis on your top CTA.
        </p>
        <Button size="sm" className="mt-3" onClick={onApplyPrimaryAccent}>
          Apply
        </Button>
      </div>
    </div>
  );
}

function A11yPanel({
  theme,
  onFix,
}: {
  theme: PageTheme;
  onFix: (patch: DeepPartial<PageTheme>, title: string) => void;
}) {
  const bodyCr = contrastRatio(theme.colors.text, theme.colors.backgroundSolid || theme.colors.background);
  const btnCr = contrastRatio(theme.colors.primaryText, theme.colors.primary);
  const bodyOk = bodyCr >= 4.5;
  const btnOk = btnCr >= 4.5;
  const btnHeight = theme.buttons?.height ?? 48;

  return (
    <div className="space-y-3">
      <Row
        ok={bodyOk}
        title={`Body text contrast: ${bodyCr.toFixed(2)}:1`}
        detail="WCAG AA requires 4.5:1 for normal text."
        actionLabel="Force text to high-contrast"
        onFix={() =>
          onFix(
            { colors: { text: "#0b0b0f", textMuted: "#4b5563" } },
            "Force high-contrast body text",
          )
        }
      />
      <Row
        ok={btnOk}
        title={`Button label contrast: ${btnCr.toFixed(2)}:1`}
        detail="Primary buttons need 4.5:1 minimum."
        actionLabel="Use black-on-white primary"
        onFix={() =>
          onFix(
            { colors: { primary: "#0b0b0f", primaryText: "#ffffff" } },
            "Set high-contrast primary button",
          )
        }
      />
      <Row
        ok={btnHeight >= 44}
        title={`Tap targets: ${btnHeight}px`}
        detail="44px is the accessibility minimum for touch."
        actionLabel="Increase to 48px"
        onFix={() =>
          onFix(
            { buttons: { ...DEFAULT_THEME.buttons, height: 48 } },
            "Enlarge tap targets to 48px",
          )
        }
      />
      <Row
        ok={(theme.typography.baseSize ?? 14) >= 14}
        title={`Base font size: ${theme.typography.baseSize ?? 14}px`}
        detail="14px minimum for readable mobile body copy."
        actionLabel="Set to 16px"
        onFix={() =>
          onFix(
            { typography: { baseSize: 16 } },
            "Increase base font size to 16px",
          )
        }
      />
    </div>
  );
}

function Row({
  ok,
  title,
  detail,
  actionLabel,
  onFix,
}: {
  ok: boolean;
  title: string;
  detail: string;
  actionLabel: string;
  onFix: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      {ok ? (
        <Check className="mt-0.5 h-5 w-5 text-emerald-500" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
      )}
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      {!ok ? (
        <Button size="sm" variant="outline" onClick={onFix}>
          {actionLabel}
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Passing</span>
      )}
    </div>
  );
}

function HistoryPanel({
  workspaceId,
  pageId,
}: {
  workspaceId: string;
  pageId?: string;
}) {
  const { data = [], isLoading } = useDesignHistory(workspaceId, pageId);
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history…</p>;
  if (data.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Applied and dismissed suggestions will appear here.
      </p>
    );
  return (
    <div className="space-y-2">
      {data.map((row) => {
        const meta = (row.metadata as Record<string, unknown> | null) ?? {};
        const status = String(meta.status ?? "applied");
        const category = String(meta.category ?? "design");
        const score = meta.score as number | undefined;
        return (
          <div key={row.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
            <div>
              <div className="flex items-center gap-2">
                <StatusChip status={status} />
                <span className="text-xs uppercase text-muted-foreground">{category}</span>
                {typeof score === "number" ? (
                  <span className="text-xs text-muted-foreground">score {score}</span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm font-medium">{row.summary?.replace(/^\w+:\s*/, "")}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const s =
    status === "applied"
      ? "bg-emerald-500/10 text-emerald-600"
      : status === "rejected"
        ? "bg-rose-500/10 text-rose-600"
        : "bg-sky-500/10 text-sky-600";
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${s}`}>
      {status}
    </span>
  );
}
