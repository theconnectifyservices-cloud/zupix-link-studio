import { createContext, useContext, type ReactNode } from "react";

export type RendererMode = "builder" | "public";

const RendererModeContext = createContext<RendererMode>("builder");

export function RendererModeProvider({
  mode,
  children,
}: {
  mode: RendererMode;
  children: ReactNode;
}) {
  return (
    <RendererModeContext.Provider value={mode}>{children}</RendererModeContext.Provider>
  );
}

export function useRendererMode(): RendererMode {
  return useContext(RendererModeContext);
}
