/**
 * Runtime script injector for published bio pages.
 * Runs client-side inside PublicBioRenderer once tracking settings are loaded.
 * De-duplicates by a data attribute so re-mounts don't stack tags.
 */
import type { CustomScript, TrackingSettings } from "./types";

const TAG = "data-zx-tracking";

function tag(id: string, node: HTMLElement | HTMLScriptElement): void {
  node.setAttribute(TAG, id);
}
function alreadyMounted(id: string): boolean {
  return !!document.querySelector(`[${TAG}="${CSS.escape(id)}"]`);
}

function addScript(opts: {
  id: string;
  src?: string;
  inline?: string;
  strategy?: "async" | "defer" | "blocking";
  parent?: HTMLElement;
}): void {
  if (alreadyMounted(opts.id)) return;
  const s = document.createElement("script");
  tag(opts.id, s);
  if (opts.src) s.src = opts.src;
  if (opts.inline) s.text = opts.inline;
  if (opts.strategy === "async") s.async = true;
  else if (opts.strategy === "defer") s.defer = true;
  (opts.parent ?? document.head).appendChild(s);
}
function addNoscript(id: string, html: string, parent: HTMLElement = document.body): void {
  if (alreadyMounted(id)) return;
  const n = document.createElement("noscript");
  tag(id, n);
  n.innerHTML = html;
  parent.appendChild(n);
}
function addRawHtml(id: string, html: string, parent: HTMLElement): void {
  if (alreadyMounted(id)) return;
  const wrap = document.createElement("div");
  tag(id, wrap);
  wrap.style.display = "contents";
  wrap.innerHTML = html;
  parent.appendChild(wrap);
  // Move <script> tags out and re-create them so the browser executes them.
  wrap.querySelectorAll("script").forEach((oldScript, i) => {
    const s = document.createElement("script");
    for (const { name, value } of Array.from(oldScript.attributes)) {
      s.setAttribute(name, value);
    }
    if (oldScript.textContent) s.text = oldScript.textContent;
    tag(`${id}-s${i}`, s);
    oldScript.replaceWith(s);
  });
}

function injectGA4(id: string): void {
  addScript({
    id: `ga4-src-${id}`,
    src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
    strategy: "async",
  });
  addScript({
    id: `ga4-init-${id}`,
    inline: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
  });
}

function injectGTM(id: string): void {
  addScript({
    id: `gtm-init-${id}`,
    inline: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`,
  });
  addNoscript(
    `gtm-ns-${id}`,
    `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
  );
}

function injectMetaPixel(id: string): void {
  addScript({
    id: `fbq-${id}`,
    inline: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`,
  });
}

function injectClarity(id: string): void {
  addScript({
    id: `clarity-${id}`,
    inline: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script','${id}');`,
  });
}

function injectLinkedIn(id: string): void {
  addScript({
    id: `li-init-${id}`,
    inline: `_linkedin_partner_id="${id}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);`,
  });
}

function injectTikTok(id: string): void {
  addScript({
    id: `ttq-${id}`,
    inline: `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${id}');ttq.page();}(window,document,'ttq');`,
  });
}

function injectCustomScripts(scripts: CustomScript[]): void {
  const enabled = scripts.filter((s) => s.enabled && s.code.trim());
  enabled.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  for (const s of enabled) {
    const parent =
      s.placement === "head"
        ? document.head
        : s.placement === "footer"
          ? document.body
          : document.body;
    addRawHtml(`custom-${s.id}`, s.code, parent);
  }
}

/** Inject every enabled integration + custom script for a workspace. */
export function injectTracking(settings: TrackingSettings): void {
  if (typeof document === "undefined") return;
  if (settings.ga4?.enabled && settings.ga4.measurementId) injectGA4(settings.ga4.measurementId);
  if (settings.gtm?.enabled && settings.gtm.containerId) injectGTM(settings.gtm.containerId);
  if (settings.metaPixel?.enabled && settings.metaPixel.pixelId)
    injectMetaPixel(settings.metaPixel.pixelId);
  if (settings.clarity?.enabled && settings.clarity.projectId)
    injectClarity(settings.clarity.projectId);
  if (settings.linkedIn?.enabled && settings.linkedIn.partnerId)
    injectLinkedIn(settings.linkedIn.partnerId);
  if (settings.tiktok?.enabled && settings.tiktok.pixelId)
    injectTikTok(settings.tiktok.pixelId);
  if (settings.customScripts?.length) injectCustomScripts(settings.customScripts);
}

/** Remove every tracking tag mounted by injectTracking. Useful on unmount. */
export function removeTracking(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll(`[${TAG}]`).forEach((n) => n.remove());
}
