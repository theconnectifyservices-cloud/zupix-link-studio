import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { useVitalsStore, type VitalName, type Rating } from "./vitals.store";

let started = false;

export function startWebVitals() {
  if (started || typeof window === "undefined") return;
  started = true;
  const handle = (m: Metric) => {
    useVitalsStore.getState().record({
      name: m.name as VitalName,
      value: m.value,
      rating: m.rating as Rating,
      ts: Date.now(),
    });
  };
  onLCP(handle);
  onINP(handle);
  onCLS(handle);
  onFCP(handle);
  onTTFB(handle);
}
