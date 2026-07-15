import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  buildTrackingUrl,
  generateShortCode,
  UTM_MEDIUM_PRESETS,
  UTM_SOURCE_PRESETS,
  validateUtm,
  type UtmParams,
} from "../utm";

interface Props {
  defaultTargetUrl?: string;
  onUse?: (payload: { targetUrl: string; utm: UtmParams; shortCode: string; url: string }) => void;
}

export function UtmBuilder({ defaultTargetUrl = "", onUse }: Props) {
  const [targetUrl, setTargetUrl] = useState(defaultTargetUrl);
  const [utm, setUtm] = useState<UtmParams>({
    source: "",
    medium: "",
    campaign: "",
    term: "",
    content: "",
  });
  const [shortCode, setShortCode] = useState<string>(generateShortCode());
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => validateUtm(targetUrl, utm), [targetUrl, utm]);
  const generatedUrl = useMemo(() => {
    if (!validation.ok) return "";
    try {
      return buildTrackingUrl(targetUrl, utm);
    } catch {
      return "";
    }
  }, [targetUrl, utm, validation.ok]);

  const copy = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Tracking link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const set = <K extends keyof UtmParams>(k: K, v: string) =>
    setUtm((p) => ({ ...p, [k]: v }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">UTM Builder</CardTitle>
        <CardDescription>
          Create trackable campaign URLs. Values are normalized (lowercase, underscored) automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field
          label="Target URL"
          required
          error={validation.errors.targetUrl}
          input={
            <Input
              placeholder="https://your.bio/link"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
            />
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="utm_source"
            required
            error={validation.errors.source}
            hint="Where the traffic comes from (e.g. instagram)"
            input={
              <DatalistInput
                list="utm-source-presets"
                presets={UTM_SOURCE_PRESETS as unknown as string[]}
                value={utm.source}
                onChange={(v) => set("source", v)}
                placeholder="instagram"
              />
            }
          />
          <Field
            label="utm_medium"
            required
            error={validation.errors.medium}
            hint="Marketing channel (e.g. social, cpc, email)"
            input={
              <DatalistInput
                list="utm-medium-presets"
                presets={UTM_MEDIUM_PRESETS as unknown as string[]}
                value={utm.medium}
                onChange={(v) => set("medium", v)}
                placeholder="social"
              />
            }
          />
          <Field
            label="utm_campaign"
            required
            error={validation.errors.campaign}
            hint="Campaign name — matches saved campaigns for attribution"
            input={
              <Input
                placeholder="spring_launch"
                value={utm.campaign}
                onChange={(e) => set("campaign", e.target.value)}
              />
            }
          />
          <Field
            label="utm_term"
            error={validation.errors.term}
            hint="Paid search keyword (optional)"
            input={
              <Input
                placeholder="running_shoes"
                value={utm.term ?? ""}
                onChange={(e) => set("term", e.target.value)}
              />
            }
          />
          <Field
            label="utm_content"
            error={validation.errors.content}
            hint="Ad variant or placement (optional)"
            input={
              <Input
                placeholder="hero_button"
                value={utm.content ?? ""}
                onChange={(e) => set("content", e.target.value)}
              />
            }
          />
          <Field
            label="Short code"
            hint="Reserved for branded/short links"
            input={
              <div className="flex gap-2">
                <Input value={shortCode} onChange={(e) => setShortCode(e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShortCode(generateShortCode())}
                  aria-label="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            }
          />
        </div>

        <div className="rounded-md border bg-muted/40 p-3">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Tracking URL
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-2 text-xs">
              {generatedUrl || "Fill in the fields to generate a tracking URL"}
            </code>
            <Button
              size="sm"
              variant="outline"
              disabled={!generatedUrl}
              onClick={copy}
              aria-label="Copy tracking URL"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            {generatedUrl && (
              <Button asChild size="sm" variant="ghost" aria-label="Open in new tab">
                <a href={generatedUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
          {onUse && (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                disabled={!generatedUrl}
                onClick={() =>
                  onUse({ targetUrl, utm, shortCode, url: generatedUrl })
                }
              >
                Use in new campaign
              </Button>
            </div>
          )}
        </div>

        <datalist id="utm-source-presets">
          {UTM_SOURCE_PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <datalist id="utm-medium-presets">
          {UTM_MEDIUM_PRESETS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  input,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  input: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {input}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function DatalistInput({
  list,
  value,
  onChange,
  placeholder,
}: {
  list: string;
  presets: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      list={list}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
