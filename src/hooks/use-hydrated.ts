import { useEffect, useState } from "react";

/** Returns true after the first client render — safe for hydration-sensitive reads. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
