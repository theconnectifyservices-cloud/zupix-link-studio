export type OAuthProviderId =
  | "google"
  | "github"
  | "linkedin_oidc"
  | "facebook"
  | "azure"
  | "apple";

export interface OAuthProviderMeta {
  id: OAuthProviderId;
  name: string;
  brandColor: string;
  scopes?: string;
  description: string;
}

export const OAUTH_PROVIDERS: OAuthProviderMeta[] = [
  {
    id: "google",
    name: "Google",
    brandColor: "#EA4335",
    description: "Sign in with your Google account",
  },
  {
    id: "github",
    name: "GitHub",
    brandColor: "#181717",
    scopes: "read:user user:email",
    description: "Connect your GitHub identity",
  },
  {
    id: "linkedin_oidc",
    name: "LinkedIn",
    brandColor: "#0A66C2",
    description: "Connect your LinkedIn account",
  },
  {
    id: "facebook",
    name: "Facebook",
    brandColor: "#1877F2",
    description: "Sign in with Facebook / Meta",
  },
  {
    id: "azure",
    name: "Microsoft",
    brandColor: "#0078D4",
    description: "Sign in with Microsoft (Azure AD)",
  },
  {
    id: "apple",
    name: "Apple",
    brandColor: "#000000",
    description: "Sign in with Apple",
  },
];

export function providerLabel(id: string): string {
  return OAUTH_PROVIDERS.find((p) => p.id === id)?.name ?? id;
}
