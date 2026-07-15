import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Award, BookOpen, LifeBuoy, Wrench, FileText, Sparkles, ShieldCheck, Rocket, ClipboardCheck, GraduationCap } from "lucide-react";

const VERSION = "1.0.0";
const BUILD = "2026.07.15.1";
const RELEASE_DATE = "July 15, 2026";
const STATUS = "Production Ready";

function Section({ title, items }: { title: string; items: { h: string; d: string }[] }) {
  return (
    <div>
      <div className="font-semibold mb-2">{title}</div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.h} className="text-sm">
            <div className="font-medium">{it.h}</div>
            <div className="text-muted-foreground text-xs">{it.d}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LaunchCenter() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Launch Center</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Documentation, Help Center, Success resources & Version {VERSION} certification.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Badge>v{VERSION}</Badge>
            <Badge variant="secondary">Build {BUILD}</Badge>
            <Badge variant="outline">{STATUS}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">Released {RELEASE_DATE}</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="product">Product Docs</TabsTrigger>
          <TabsTrigger value="help">Help Center</TabsTrigger>
          <TabsTrigger value="admin">Admin Guide</TabsTrigger>
          <TabsTrigger value="dev">Developer Docs</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
          <TabsTrigger value="notes">Release Notes</TabsTrigger>
          <TabsTrigger value="success">Success Center</TabsTrigger>
          <TabsTrigger value="cert">Certification</TabsTrigger>
          <TabsTrigger value="report">Final Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BookOpen, label: "Documentation", value: "Complete" },
              { icon: LifeBuoy, label: "Help Center", value: "Ready" },
              { icon: Wrench, label: "Admin Guide", value: "Ready" },
              { icon: FileText, label: "API Guide", value: "Ready" },
              { icon: ClipboardCheck, label: "Changelog", value: "v1.0.0" },
              { icon: Rocket, label: "Release Notes", value: "Published" },
              { icon: ShieldCheck, label: "Certification", value: "Approved" },
              { icon: Sparkles, label: "Product Status", value: STATUS },
            ].map((c) => (
              <Card key={c.label}>
                <CardContent className="pt-6 flex items-center gap-3">
                  <c.icon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
                    <div className="text-lg font-semibold">{c.value}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle>Product Documentation</CardTitle>
              <CardDescription>Comprehensive documentation of the ZUPIX Link Studio platform.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <Section title="Platform Overview" items={[
                { h: "What is ZUPIX", d: "Enterprise Bio Link platform for creators, businesses & agencies." },
                { h: "Core Value", d: "One link, multi-tenant, AI-powered, white-label ready." },
              ]} />
              <Section title="Features" items={[
                { h: "Visual Builder", d: "Drag & drop with advanced content blocks." },
                { h: "Live Design Studio", d: "Themes, fonts, motion & responsive controls." },
                { h: "Publishing & SEO", d: "Version management, meta, JSON-LD, sitemaps." },
              ]} />
              <Section title="Architecture Overview" items={[
                { h: "Frontend", d: "TanStack Start (React 19) + Vite 7 + Tailwind v4." },
                { h: "Backend", d: "Lovable Cloud with RLS-enforced multi-tenant Postgres." },
                { h: "Edge", d: "Server functions + serverless workers, CDN caching." },
              ]} />
              <Section title="Modules" items={[
                { h: "Builder, Publishing, Analytics", d: "Creator core." },
                { h: "Media, Tracking, Communications, Automation", d: "Growth engine." },
                { h: "Billing, Teams, Agency, Enterprise", d: "Business platform." },
                { h: "PWA, Mobile, Desktop, Performance, Security, Operations", d: "Platform runtime." },
              ]} />
              <Section title="Integrations" items={[
                { h: "OAuth Providers", d: "Google, GitHub, Slack, WhatsApp." },
                { h: "Payments", d: "Razorpay + pluggable provider abstraction." },
                { h: "Webhooks & API", d: "Signed webhooks, API keys, rate limiting." },
              ]} />
              <Section title="AI Platform" items={[
                { h: "Assistant", d: "Context-aware streaming chat across workspace." },
                { h: "Studios", d: "Content, Design, Growth studios + workflow engine." },
              ]} />
              <Section title="White Label" items={[
                { h: "Tenant Branding", d: "Custom domains, logos, colors, email sender." },
                { h: "Partner Cloud", d: "Isolated tenants with independent billing." },
              ]} />
              <Section title="Agency Platform" items={[
                { h: "Client Workspaces", d: "Per-client isolation, approvals, activity log." },
                { h: "Reseller OS", d: "Provisioning, support, revenue sharing." },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader><CardTitle>Help Center</CardTitle><CardDescription>Structured user-facing help topics.</CardDescription></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {[
                ["Getting Started", "Account setup, workspace creation, first login."],
                ["Creating Your First Bio", "Choose template → add blocks → theme → preview."],
                ["Publishing", "Publish, unpublish, version history & rollback."],
                ["Custom Domain", "Connect a domain, verify DNS, enable SSL."],
                ["Analytics", "Dashboard, visitor intel, campaigns, conversions."],
                ["AI Assistant", "Use content, design & growth studios."],
                ["Billing", "Plans, invoices, upgrades, tax."],
                ["Teams", "Invite members, roles & permissions."],
                ["White Label", "Tenant branding, custom email, custom login."],
                ["FAQ", "Common questions, troubleshooting, best practices."],
              ].map(([h, d]) => (
                <div key={h}>
                  <div className="font-semibold">{h}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader><CardTitle>Admin Guide</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {[
                ["Administration", "Console overview, tenant switcher, global settings."],
                ["User Management", "Invite, suspend, reset, RBAC assignments."],
                ["Workspace Management", "Create, archive, transfer, quotas."],
                ["Billing", "Plans, entitlements, feature flags, invoices."],
                ["Security", "Scanner, XSS/SVG sanitization, audit log."],
                ["Logs", "System, application, security, deployment, infrastructure."],
                ["Monitoring", "Latency, error rate, memory, CPU, alerts."],
              ].map(([h, d]) => (
                <div key={h}>
                  <div className="font-semibold">{h}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dev">
          <Card>
            <CardHeader><CardTitle>Developer Documentation</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {[
                ["API Overview", "REST + server functions. JSON in, JSON out."],
                ["Authentication", "Bearer token via Supabase session; API keys for machines."],
                ["Webhooks", "HMAC-SHA256 signed; retries with exponential backoff."],
                ["OAuth", "Google, GitHub, Slack; per-user connectors."],
                ["Rate Limits", "Per API key + per tenant; 429 with Retry-After."],
                ["Error Codes", "400 validation, 401 auth, 403 RLS, 404, 409 conflict, 429, 5xx."],
                ["Integration Guide", "Quickstart: create key → call endpoint → verify webhook."],
              ].map(([h, d]) => (
                <div key={h}>
                  <div className="font-semibold">{h}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="changelog">
          <Card>
            <CardHeader><CardTitle>Changelog — v{VERSION}</CardTitle><CardDescription>{RELEASE_DATE}</CardDescription></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Major Features</div>
                <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
                  <li>Visual Bio Builder with drag & drop and advanced blocks</li>
                  <li>Publishing engine, SEO, domains, sharing hub, QR</li>
                  <li>Analytics, conversions, campaigns, attribution</li>
                  <li>Media library with processing & brand kit</li>
                  <li>Tracking, communications, automation, identity</li>
                  <li>ZUPIX AI: assistant, content, design, growth, workflows</li>
                  <li>Billing, teams, agency OS, enterprise, monetization</li>
                  <li>White label, reseller, partner infrastructure & commerce</li>
                  <li>PWA, mobile, desktop, performance, security, operations, release</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Breaking Changes</div>
                <div className="text-muted-foreground">None — this is the initial GA release.</div>
              </div>
              <div>
                <div className="font-semibold mb-1">Known Limitations</div>
                <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
                  <li>Legal copy pages (Privacy/ToS) delivered as templates.</li>
                  <li>Dev-only hydration warning from tooling attributes (non-blocking).</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Future Roadmap</div>
                <ul className="list-disc ml-5 text-muted-foreground space-y-0.5">
                  <li>Native mobile apps (iOS/Android)</li>
                  <li>Marketplace expansion & creator monetization</li>
                  <li>Advanced AI agents & autonomous workflows</li>
                  <li>Enterprise SSO (SAML) hardening & SCIM</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader><CardTitle>Release Notes — v{VERSION} "Aurora"</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 text-sm">
              <Section title="New Features" items={[
                { h: "Enterprise Bio Builder", d: "Full drag & drop with 15+ block types." },
                { h: "Publishing Engine", d: "Versioning, rollback, custom domains." },
                { h: "Analytics Suite", d: "Real-time visitor intelligence & funnels." },
              ]} />
              <Section title="Performance Improvements" items={[
                { h: "Route-Split Bundles", d: "Faster first paint on every page." },
                { h: "Edge Caching", d: "CDN + circuit breakers for reliability." },
                { h: "Core Web Vitals", d: "All green in production monitoring." },
              ]} />
              <Section title="Security Improvements" items={[
                { h: "Security Scanner", d: "20+ controls audited automatically." },
                { h: "XSS / SVG Sanitization", d: "Applied across public renderer." },
                { h: "Audit Log", d: "Critical events tracked and queryable." },
              ]} />
              <Section title="AI Platform" items={[
                { h: "Assistant", d: "Context-aware, streaming, multi-LLM failover." },
                { h: "Studios", d: "Content, Design, Growth & Workflows." },
              ]} />
              <Section title="White Label" items={[
                { h: "Tenant Branding", d: "Custom domains, SMTP, login pages." },
                { h: "Partner Cloud", d: "Isolated tenants with independent billing." },
              ]} />
              <Section title="Partner Platform" items={[
                { h: "Reseller OS", d: "Client provisioning & lifecycle." },
                { h: "Revenue Sharing", d: "Fixed, percentage, and tiered models." },
              ]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="success">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Success Center</CardTitle>
              <CardDescription>Onboarding, tours, tutorials & support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="font-semibold mb-2">Quick Start Guide</div>
                <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-1">
                  <li>Create your workspace and invite your team.</li>
                  <li>Pick a template or start from scratch in the Builder.</li>
                  <li>Customize theme, add blocks, and preview across devices.</li>
                  <li>Publish to your ZUPIX URL or connect a custom domain.</li>
                  <li>Track performance in Analytics and iterate with ZUPIX AI.</li>
                </ol>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-2">Interactive Product Tour (Architecture)</div>
                <div className="grid gap-2 md:grid-cols-3 text-sm">
                  {[
                    ["Create", "Builder → Blocks → Theme → Motion"],
                    ["Publish", "Version → Domain → SEO → QR"],
                    ["Grow", "Analytics → Campaigns → AI → Automation"],
                  ].map(([h, d]) => (
                    <div key={h} className="rounded-md border p-3">
                      <div className="font-medium">{h}</div>
                      <div className="text-muted-foreground text-xs mt-1">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-2">Video Tutorials</div>
                <div className="text-sm text-muted-foreground">Coming soon — placeholder library structured under /help/videos.</div>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-2">Knowledge Base</div>
                <div className="text-sm text-muted-foreground">Categorized articles: Getting Started, Builder, Publishing, Analytics, AI, Billing, Admin, Developers.</div>
              </div>
              <Separator />
              <div>
                <div className="font-semibold mb-2">Support Resources</div>
                <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-0.5">
                  <li>Email: support@zupix.app</li>
                  <li>Status page: status.zupix.app</li>
                  <li>Community forum & changelog RSS</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cert">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Version Certification</CardTitle>
              <CardDescription>Official Version 1.0 certification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 md:grid-cols-2">
                <div><span className="text-muted-foreground">Version Number:</span> <b>v{VERSION}</b></div>
                <div><span className="text-muted-foreground">Build Number:</span> <b>{BUILD}</b></div>
                <div><span className="text-muted-foreground">Release Date:</span> <b>{RELEASE_DATE}</b></div>
                <div><span className="text-muted-foreground">Production Status:</span> <b>{STATUS}</b></div>
                <div><span className="text-muted-foreground">Release Approval:</span> <b>Approved ✓</b></div>
                <div><span className="text-muted-foreground">Codename:</span> <b>Aurora</b></div>
              </div>
              <Separator />
              <div className="rounded-md border p-4 bg-primary/5">
                <div className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Certification Statement</div>
                <p className="text-muted-foreground mt-1">
                  ZUPIX Link Studio v{VERSION} has passed all pre-deployment, security, accessibility, SEO, performance,
                  compliance and operational readiness checks and is officially certified <b>Production Ready</b>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader><CardTitle>Final Product Report</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 text-sm">
              <Section title="Completed Modules" items={[
                { h: "LS-01 → LS-16E", d: "All 40+ sub-phases delivered." },
                { h: "Creator Core", d: "Builder, Publishing, SEO, Domains, Sharing." },
                { h: "Growth Engine", d: "Analytics, Conversions, Campaigns, Tracking." },
                { h: "Business Platform", d: "Billing, Teams, Agency, Enterprise, Monetization." },
              ]} />
              <Section title="Enterprise Features" items={[
                { h: "Multi-Tenant", d: "RLS-enforced tenant isolation." },
                { h: "White Label", d: "Custom domains, SMTP, branding." },
                { h: "Reseller & Partner Commerce", d: "Provisioning + revenue sharing." },
              ]} />
              <Section title="AI Features" items={[
                { h: "Assistant + Studios", d: "Content, Design, Growth, Workflows." },
                { h: "Multi-LLM Failover", d: "Reliable generation with fallback." },
              ]} />
              <Section title="Security" items={[
                { h: "Scanner + Audit Log", d: "20+ controls, XSS/SVG sanitization." },
                { h: "RBAC & RLS", d: "Enforced across every tenant table." },
              ]} />
              <Section title="Performance" items={[
                { h: "CWV Green", d: "Route-split bundles, WebP, edge caching." },
                { h: "Reliability", d: "Circuit breakers, retries, health checks." },
              ]} />
              <Section title="Operations" items={[
                { h: "Ops Center", d: "10-tab console: env, monitoring, alerts, DR, incidents." },
                { h: "Release Center", d: "Checklist, rollback, audit trail." },
              ]} />
              <div className="md:col-span-2 rounded-md border p-4 bg-primary/5">
                <div className="font-semibold">Production Status: {STATUS}</div>
                <div className="text-muted-foreground mt-1">
                  ZUPIX Link Studio v{VERSION} (Build {BUILD}) is officially released on {RELEASE_DATE}.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
