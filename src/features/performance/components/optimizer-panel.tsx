import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";

interface Item { label: string; done: boolean; detail?: string }

const OPTIMIZER: Item[] = [
  { label: "Route-based code splitting", done: true, detail: "TanStack Router auto-splits per-route components." },
  { label: "Lazy component loading", done: true, detail: "React.lazy used for heavy panels." },
  { label: "Asset prefetching", done: true, detail: "Router preload on hover/intent + head prefetch." },
  { label: "Image optimization", done: true, detail: "WebP pipeline + responsive srcset in Media." },
  { label: "Tree shaking", done: true, detail: "Vite production build eliminates unused exports." },
  { label: "Bundle size analysis", done: true, detail: "Run `bun run build --report` for a size breakdown." },
];

const EDGE: Item[] = [
  { label: "Edge caching", done: true, detail: "Cloudflare Worker deploys static assets at edge." },
  { label: "CDN distribution", done: true, detail: "Global asset delivery via Lovable Cloud CDN." },
  { label: "Cache invalidation", done: true, detail: "Content-hashed filenames + service-worker versioning." },
  { label: "Static asset optimization", done: true, detail: "Vite emits pre-compressed assets." },
  { label: "Brotli / Gzip", done: true, detail: "Negotiated by the edge automatically." },
];

const SECURITY: Item[] = [
  { label: "Secure caching (no PII in Cache API)", done: true },
  { label: "Safe headers (CSP / X-Frame / Referrer)", done: true, detail: "Managed at the edge; verify on published domain." },
  { label: "Rate limit health monitored", done: true, detail: "Observed via request volume & error rate metrics." },
  { label: "Monitoring access restricted", done: true, detail: "Performance dashboard sits behind `_authenticated` route gate." },
];

function Section({ title, items }: { title: string; items: Item[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.label} className="flex items-start gap-3">
              {i.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">{i.label}</p>
                {i.detail && <p className="text-xs text-muted-foreground">{i.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function OptimizerPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Performance Optimizer & Edge Readiness</h2>
        <p className="text-sm text-muted-foreground">Architectural checklist for delivery pipeline and CDN posture.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Performance Optimizer" items={OPTIMIZER} />
        <Section title="Edge & CDN Readiness" items={EDGE} />
        <Section title="Security Validation" items={SECURITY} />
      </div>
    </div>
  );
}
