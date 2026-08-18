// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";

/**
 * The web app manifest lives at public/manifest.webmanifest so the dev server
 * serves it verbatim; the PWA plugin reuses the same document for the build.
 */
const pwaManifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("./public/manifest.webmanifest", import.meta.url)), "utf-8"),
) as Partial<ManifestOptions>;


export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        // TanStack Start emits browser assets into dist/client; without this the
        // generated service worker lands in dist/ and precaches "client/*" URLs
        // that 404 at runtime.
        outDir: "dist/client",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
          "pwa-maskable-192x192.png",
          "pwa-maskable-512x512.png",
          "splash/*.png",
          "screenshots/*.png",
        ],

        // Single source of truth: public/manifest.webmanifest. The dev server
        // serves that file directly (so /manifest.webmanifest never 404s in
        // dev/preview), and the plugin re-emits the identical document into
        // dist/client at build time.
        manifest: pwaManifest,

        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
          // LS-PWA-FIX: explicitly exclude index.html from precaching to avoid "non-precached-url" errors
          // in server-rendered environments where index.html is generated at runtime.
          globIgnores: ["index.html", "200.html", "404.html"],
          
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,

          runtimeCaching: [
            {
              // HTML navigations — always NetworkFirst. OAuth callbacks, API
              // routes and auth pages are never cached.
              urlPattern: ({ request, url, sameOrigin }) =>
                request.mode === "navigate" &&
                sameOrigin &&
                !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/api/") &&
                !url.pathname.startsWith("/auth/"),
              handler: "NetworkFirst",
              options: {
                // Renamed from "zupix-pages" to evict poisoned entries that
                // could serve a pre-publish 404 shell to installed PWAs.
                cacheName: "zupix-pages-v2",
                // 3s was too aggressive on mobile radios: a slow-but-working
                // network fell through to a stale/absent cache entry.
                networkTimeoutSeconds: 12,
                // Only ever store real successes — never a 404/5xx shell.
                cacheableResponse: { statuses: [200] },
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              },
            },


            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin && /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "zupix-images",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "zupix-fonts" },
            },
          ],
        },
      }),
    ],
  },
});
