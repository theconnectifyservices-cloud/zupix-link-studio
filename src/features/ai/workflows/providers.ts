/**
 * LS-12E — AI Provider Abstraction.
 *
 * Runtime calls go through the existing Lovable AI Gateway
 * (/api/ai/generate). This module documents the provider registry, the
 * failover order and normalises call/response shape so we can later swap in
 * OpenAI, Anthropic, Google or Azure without changing workflow code.
 */

export type ProviderId = "lovable" | "openai" | "anthropic" | "google" | "azure" | "local";

export interface ProviderDescriptor {
  id: ProviderId;
  label: string;
  /** Whether the provider is available today. */
  enabled: boolean;
  /** Default model id used when the caller does not override. */
  defaultModel: string;
  /** Human-readable capability tags for the UI. */
  capabilities: string[];
  /** Environment variable that must exist to enable this provider. */
  requiredSecret?: string;
}

/** Ordered registry — first enabled wins; others are used for failover. */
export const PROVIDER_REGISTRY: ProviderDescriptor[] = [
  {
    id: "lovable",
    label: "Lovable AI Gateway",
    enabled: true,
    defaultModel: "google/gemini-3-flash-preview",
    capabilities: ["chat", "generate", "reasoning"],
  },
  {
    id: "openai",
    label: "OpenAI",
    enabled: false,
    defaultModel: "openai/gpt-5.4-nano",
    capabilities: ["chat", "generate", "structured"],
    requiredSecret: "OPENAI_API_KEY",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    enabled: false,
    defaultModel: "anthropic/claude-sonnet-4",
    capabilities: ["chat", "generate"],
    requiredSecret: "ANTHROPIC_API_KEY",
  },
  {
    id: "google",
    label: "Google Gemini (direct)",
    enabled: false,
    defaultModel: "google/gemini-3-pro",
    capabilities: ["chat", "generate", "vision"],
    requiredSecret: "GOOGLE_API_KEY",
  },
  {
    id: "azure",
    label: "Azure OpenAI",
    enabled: false,
    defaultModel: "azure/gpt-5.4-mini",
    capabilities: ["chat", "generate"],
    requiredSecret: "AZURE_OPENAI_API_KEY",
  },
  {
    id: "local",
    label: "Local Model",
    enabled: false,
    defaultModel: "local/llama",
    capabilities: ["chat"],
  },
];

export function activeProviders(): ProviderDescriptor[] {
  return PROVIDER_REGISTRY.filter((p) => p.enabled);
}

export function primaryProvider(): ProviderDescriptor {
  return activeProviders()[0] ?? PROVIDER_REGISTRY[0];
}

export interface ProviderCallResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

/**
 * Invoke the best available provider. Today this proxies to
 * `/api/ai/generate` (Lovable Gateway). Failover loops the list in
 * registry order; any thrown error bubbles as `{ ok:false, error }`.
 */
export async function callProvider<T = unknown>(params: {
  system: string;
  prompt: string;
  json?: boolean;
  signal?: AbortSignal;
}): Promise<ProviderCallResult<T>> {
  const start = performance.now();
  const providers = activeProviders();
  let lastError = "no provider available";

  for (const provider of providers) {
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: params.system,
          prompt: params.prompt,
          json: params.json ?? false,
        }),
        signal: params.signal,
      });
      const latency = Math.round(performance.now() - start);
      if (!res.ok) {
        lastError = `provider ${provider.id} responded ${res.status}`;
        continue;
      }
      const payload = (await res.json()) as {
        text?: string;
        data?: T;
        tokens_in?: number;
        tokens_out?: number;
      };
      const data = (payload.data ?? (payload.text as unknown)) as T;
      return {
        ok: true,
        data,
        provider: provider.id,
        model: provider.defaultModel,
        latencyMs: latency,
        tokensIn: payload.tokens_in,
        tokensOut: payload.tokens_out,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
  }

  return {
    ok: false,
    error: lastError,
    provider: primaryProvider().id,
    model: primaryProvider().defaultModel,
    latencyMs: Math.round(performance.now() - start),
  };
}
