export interface CustomCodePreset {
  key: string;
  label: string;
  category: string;
  html: string;
  css?: string;
}

export const CUSTOM_CODE_PRESETS: CustomCodePreset[] = [
  {
    key: "google-maps",
    label: "Google Maps",
    category: "Embed",
    html: `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.0!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1" width="100%" height="360" style="border:0;border-radius:12px" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
  },
  {
    key: "youtube",
    label: "YouTube",
    category: "Video",
    html: `<div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>`,
  },
  {
    key: "vimeo",
    label: "Vimeo",
    category: "Video",
    html: `<div style="position:relative;padding-top:56.25%"><iframe src="https://player.vimeo.com/video/76979871" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe></div>`,
  },
  {
    key: "google-forms",
    label: "Google Forms",
    category: "Form",
    html: `<iframe src="https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true" width="100%" height="640" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`,
  },
  {
    key: "calendly",
    label: "Calendly",
    category: "Booking",
    html: `<div class="calendly-inline-widget" data-url="https://calendly.com/YOUR_LINK" style="min-width:320px;height:700px;"></div>`,
  },
  {
    key: "typeform",
    label: "Typeform",
    category: "Form",
    html: `<div data-tf-live="FORM_ID" style="width:100%;height:520px"></div>`,
  },
  {
    key: "tawk",
    label: "Tawk.to chat",
    category: "Chat",
    html: `<!-- Tawk.to widget mounts globally; paste embed script inside your custom-code block if JS is enabled -->
<div style="padding:16px;border:1px dashed #ccc;border-radius:12px;text-align:center;font-family:system-ui">
  Tawk.to chat widget placeholder — enable JS to mount the live script.
</div>`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp button",
    category: "Widget",
    html: `<a href="https://wa.me/919999999999?text=Hi%20there" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none;font-family:system-ui;font-weight:600">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.9 11.9 0 0012 0C5.4 0 0 5.4 0 12c0 2.1.6 4.1 1.6 5.9L0 24l6.3-1.6A11.9 11.9 0 0012 24c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5zM12 21.8c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-3.7 1 1-3.6-.3-.4A9.7 9.7 0 012.2 12C2.2 6.6 6.6 2.2 12 2.2s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8z"/></svg>
  Chat on WhatsApp
</a>`,
  },
  {
    key: "instagram-post",
    label: "Instagram post",
    category: "Social",
    html: `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/POST_ID/" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:12px;max-width:540px;margin:0 auto;padding:0;width:100%"></blockquote>`,
  },
  {
    key: "facebook-page",
    label: "Facebook page",
    category: "Social",
    html: `<iframe src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffacebook&tabs=timeline&width=340&height=500" width="100%" height="500" style="border:none;overflow:hidden;border-radius:12px" scrolling="no" frameborder="0"></iframe>`,
  },
  {
    key: "twitter-timeline",
    label: "Twitter timeline",
    category: "Social",
    html: `<a class="twitter-timeline" href="https://twitter.com/HANDLE?ref_src=twsrc%5Etfw">Tweets by HANDLE</a>`,
  },
  {
    key: "spotify",
    label: "Spotify",
    category: "Music",
    html: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator" width="100%" height="352" frameborder="0" allowfullscreen allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture" loading="lazy"></iframe>`,
  },
  {
    key: "google-reviews",
    label: "Google reviews",
    category: "Reviews",
    html: `<div style="border:1px solid #eee;border-radius:12px;padding:16px;font-family:system-ui">
  <strong>★ 4.9</strong> · Google reviews
  <p style="margin:8px 0 0;color:#555">Paste your Google Reviews embed script or link here.</p>
</div>`,
  },
  {
    key: "trustpilot",
    label: "Trustpilot",
    category: "Reviews",
    html: `<div class="trustpilot-widget" data-locale="en-US" data-template-id="TEMPLATE_ID" data-businessunit-id="BU_ID" data-style-height="240px" data-style-width="100%"></div>`,
  },
  {
    key: "custom-button",
    label: "Custom button",
    category: "Widget",
    html: `<a href="https://zupix.in" target="_blank" rel="noopener" class="cc-btn">Learn more →</a>`,
    css: `.cc-btn{display:inline-block;padding:14px 28px;border-radius:9999px;background:linear-gradient(135deg,#6366f1,#ec4899);color:#fff;text-decoration:none;font-weight:600;font-family:system-ui;box-shadow:0 8px 24px rgba(99,102,241,.3);transition:transform .2s}
.cc-btn:hover{transform:translateY(-2px)}`,
  },
  {
    key: "lottiefiles",
    label: "LottieFiles",
    category: "Animation",
    html: `<dotlottie-player src="https://lottie.host/YOUR_LOTTIE.lottie" background="transparent" speed="1" style="width:100%;height:300px" loop autoplay></dotlottie-player>`,
  },
  {
    key: "countdown",
    label: "Countdown",
    category: "Library",
    html: `<div class="cd" data-target="2030-01-01T00:00:00Z">
  <div><b id="d">00</b><span>Days</span></div>
  <div><b id="h">00</b><span>Hrs</span></div>
  <div><b id="m">00</b><span>Min</span></div>
  <div><b id="s">00</b><span>Sec</span></div>
</div>`,
    css: `.cd{display:flex;gap:12px;justify-content:center;font-family:system-ui}
.cd>div{background:rgba(0,0,0,.05);border-radius:12px;padding:12px 16px;text-align:center;min-width:64px}
.cd b{display:block;font-size:24px}
.cd span{font-size:11px;color:#666;text-transform:uppercase}`,
  },
  {
    key: "pricing-table",
    label: "Pricing table",
    category: "Library",
    html: `<div class="pt">
  <div class="p"><h3>Starter</h3><b>$9</b><p>For hobbyists</p><a href="#">Choose</a></div>
  <div class="p featured"><h3>Pro</h3><b>$29</b><p>For teams</p><a href="#">Choose</a></div>
  <div class="p"><h3>Business</h3><b>$99</b><p>Custom limits</p><a href="#">Choose</a></div>
</div>`,
    css: `.pt{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;font-family:system-ui}
.p{border:1px solid #eee;border-radius:16px;padding:20px;text-align:center;background:#fff}
.p.featured{border-color:#6366f1;box-shadow:0 12px 32px rgba(99,102,241,.2)}
.p b{font-size:32px;display:block;margin:8px 0}
.p a{display:inline-block;margin-top:12px;padding:8px 18px;border-radius:9999px;background:#111;color:#fff;text-decoration:none}`,
  },
  {
    key: "faq-accordion",
    label: "FAQ accordion",
    category: "Library",
    html: `<details><summary>What is ZUPIX Link Studio?</summary><p>A premium bio-link builder.</p></details>
<details><summary>Can I use custom code?</summary><p>Yes — this block!</p></details>`,
    css: `details{border:1px solid #eee;border-radius:10px;padding:12px 16px;margin:8px 0;font-family:system-ui}
summary{cursor:pointer;font-weight:600}
details[open] summary{margin-bottom:8px}`,
  },
  {
    key: "offer-banner",
    label: "Offer banner",
    category: "Library",
    html: `<div class="banner">🎉 Limited offer — 30% off Pro. <a href="#">Grab it</a></div>`,
    css: `.banner{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:14px 20px;border-radius:12px;text-align:center;font-family:system-ui}
.banner a{color:#fff;text-decoration:underline;margin-left:6px}`,
  },
];
