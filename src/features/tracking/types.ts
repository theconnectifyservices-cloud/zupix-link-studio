export type LoadStrategy = "async" | "defer" | "blocking";
export type Placement = "head" | "body" | "footer";

export interface IntegrationBase {
  enabled: boolean;
  priority?: number; // lower runs first, default 100
  lastCheckedAt?: string | null;
  lastStatus?: "connected" | "invalid" | "warning" | "disconnected" | null;
  lastMessage?: string | null;
}

export interface GA4Settings extends IntegrationBase {
  measurementId: string; // G-XXXXXXXXXX
}
export interface GTMSettings extends IntegrationBase {
  containerId: string; // GTM-XXXXXX
}
export interface MetaPixelSettings extends IntegrationBase {
  pixelId: string; // 15-16 digits
}
export interface ClaritySettings extends IntegrationBase {
  projectId: string; // 10 chars alnum
}
export interface LinkedInSettings extends IntegrationBase {
  partnerId: string; // digits
}
export interface TikTokSettings extends IntegrationBase {
  pixelId: string; // 20-char alnum
}

export interface CustomScript {
  id: string;
  name: string;
  code: string;
  placement: Placement;
  strategy: LoadStrategy;
  enabled: boolean;
  priority?: number;
  page?: string | null; // future-ready per-page targeting
}

export interface EventMapping {
  pageView: boolean;
  buttonClick: boolean;
  conversion: boolean;
  qrScan: boolean;
  formSubmit: boolean;
}

export interface TrackingSettings {
  ga4?: GA4Settings;
  gtm?: GTMSettings;
  metaPixel?: MetaPixelSettings;
  clarity?: ClaritySettings;
  linkedIn?: LinkedInSettings;
  tiktok?: TikTokSettings;
  customScripts?: CustomScript[];
  events?: EventMapping;
}

export const DEFAULT_EVENTS: EventMapping = {
  pageView: true,
  buttonClick: true,
  conversion: true,
  qrScan: true,
  formSubmit: false,
};

export const DEFAULT_TRACKING: TrackingSettings = {
  events: DEFAULT_EVENTS,
  customScripts: [],
};
