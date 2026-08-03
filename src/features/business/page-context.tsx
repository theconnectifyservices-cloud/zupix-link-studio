import { createContext, useContext, type ReactNode } from "react";

/**
 * Identity of the bio page currently being rendered publicly.
 *
 * Business blocks (Contact Form, Booking) post submissions to the public
 * ingest endpoints and need the page id + slug. Inside the builder this
 * context is absent, so those blocks render in "demo" mode and never write.
 */
export interface PublicPageIdentity {
  pageId: string;
  slug: string;
  workspaceId?: string;
}

const PublicPageContext = createContext<PublicPageIdentity | null>(null);

export function PublicPageProvider({
  value,
  children,
}: {
  value: PublicPageIdentity | null;
  children: ReactNode;
}) {
  return <PublicPageContext.Provider value={value}>{children}</PublicPageContext.Provider>;
}

export function usePublicPage(): PublicPageIdentity | null {
  return useContext(PublicPageContext);
}
