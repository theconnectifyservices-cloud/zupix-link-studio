import { useEffect } from "react";
import { startWebVitals } from "./web-vitals";
import { installErrorListeners } from "./errors.store";
import { installFetchObserver } from "./observability.store";

/** Mount once in the app shell. Safe in SSR (no-ops server-side). */
export function PerformanceInstall() {
  useEffect(() => {
    startWebVitals();
    installErrorListeners();
    installFetchObserver();
  }, []);
  return null;
}
