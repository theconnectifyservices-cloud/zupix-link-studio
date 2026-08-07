import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { APP_CONFIG } from "@/config/app.config";
import { useThemeStore } from "@/stores/theme.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette, ShortcutsDialog, ProductivityModeEffect } from "@/features/desktop";
import { UpgradeModal } from "@/features/subscription/components/upgrade-modal";
import { FeatureUpgradeDialog } from "@/features/subscription/components/feature-upgrade-dialog";
import { ErrorBoundary } from "@/shared/error/error-boundary";
import { InstallBanner, UpdateBanner, OfflineIndicator } from "@/features/pwa";
import { RecoveryLinkRedirect } from "@/features/auth/recovery-redirect";
import { GlobalBackToTop } from "@/components/global-back-to-top";

/** iOS launch-image variants: [device px width, device px height, DPR]. */
const APPLE_SPLASH: { w: number; h: number; r: number }[] = [
  { w: 1290, h: 2796, r: 3 },
  { w: 1179, h: 2556, r: 3 },
  { w: 1284, h: 2778, r: 3 },
  { w: 1170, h: 2532, r: 3 },
  { w: 1125, h: 2436, r: 3 },
  { w: 828, h: 1792, r: 2 },
  { w: 750, h: 1334, r: 2 },
  { w: 1536, h: 2048, r: 2 },
];

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: `${APP_CONFIG.name} — Premium Bio Link Builder` },
      { name: "description", content: APP_CONFIG.description },
      { name: "author", content: APP_CONFIG.shortName },
      { property: "og:title", content: `${APP_CONFIG.name} — Premium Bio Link Builder` },
      { property: "og:description", content: APP_CONFIG.description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0a0a14" },
      // Chrome deprecated apple-mobile-web-app-capable and logs a console warning
      // unless the standard name is present alongside it.
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: APP_CONFIG.shortName },

      // Security hardening meta (LS-16A) — response headers are the source of truth,
      // these are defense-in-depth for browsers that honour them.
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      {
        httpEquiv: "Permissions-Policy",
        content: "camera=(), microphone=(), geolocation=(), payment=(self)",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/pwa-192x192.png", type: "image/png", sizes: "192x192" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      // iOS launch images — without these the installed app shows a blank flash.
      ...APPLE_SPLASH.map(({ w, h, r }) => ({
        rel: "apple-touch-startup-image",
        href: `/splash/apple-splash-${w}-${h}.png`,
        media: `(device-width: ${w / r}px) and (device-height: ${h / r}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
      })),

      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    root.classList.toggle("dark", resolved === "dark");
  }, [theme, hydrated]);

  return null;
}

function AuthSubscriber() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    let ignore = true;
    // Dynamic import so SSR bundle doesn't load supabase client eagerly here
    import("@/integrations/supabase/client").then(({ supabase }) => {
      if (!ignore) return;
      const { data } = supabase.auth.onAuthStateChange((event) => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        if (event === "SIGNED_OUT") queryClient.clear();
      });
      // store cleanup on window to unsub on unmount
      (window as unknown as { __authSub?: () => void }).__authSub = () =>
        data.subscription.unsubscribe();
    });
    ignore = true;
    return () => {
      (window as unknown as { __authSub?: () => void }).__authSub?.();
    };
  }, [queryClient]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RecoveryLinkRedirect />
      <ThemeApplier />
      <ProductivityModeEffect />
      <AuthSubscriber />
      <ErrorBoundary>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </ErrorBoundary>
      <CommandPalette />
      <ShortcutsDialog />
      <OfflineIndicator />
      <UpdateBanner />
      <InstallBanner />
      <GlobalBackToTop />
      <UpgradeModal />
      <FeatureUpgradeDialog />
      <Toaster />
    </QueryClientProvider>
  );
}
