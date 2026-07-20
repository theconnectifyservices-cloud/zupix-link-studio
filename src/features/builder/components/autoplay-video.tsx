/**
 * AutoplayVideo — cross-device muted-autoplay <video> with a graceful
 * mobile fallback. If the browser blocks autoplay (Low Power Mode iOS,
 * Data Saver Chrome, etc.), the poster stays visible with a premium
 * Play button overlay that starts playback on the first tap.
 *
 * Always applies the mobile-autoplay contract:
 *   autoPlay, muted, playsInline, loop, preload="auto"
 * You can opt-out of loop by passing loop={false}.
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  poster?: string;
  className?: string;
  style?: CSSProperties;
  loop?: boolean;
  controls?: boolean;
  objectFit?: "cover" | "contain";
  /** Rendered behind other content (hero background). Disables tap-to-play UI pointer events. */
  background?: boolean;
  ariaLabel?: string;
}

export function AutoplayVideo({
  src,
  poster,
  className,
  style,
  loop = true,
  controls = false,
  objectFit = "cover",
  background = false,
  ariaLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Ensure muted before play() — required for autoplay on iOS/Android.
    v.muted = true;
    v.defaultMuted = true;
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => setBlocked(false)).catch(() => setBlocked(true));
      }
    };
    // Kick off after mount; some browsers need a tick after metadata.
    tryPlay();
    const onLoaded = () => tryPlay();
    v.addEventListener("loadeddata", onLoaded);
    return () => v.removeEventListener("loadeddata", onLoaded);
  }, [src]);

  const handleManualPlay = () => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.play().then(() => setBlocked(false)).catch(() => {
      /* leave overlay visible */
    });
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)} style={style}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop={loop}
        playsInline
        // iOS-specific hints (harmless elsewhere)
        {...({ "webkit-playsinline": "true", "x5-playsinline": "true" } as Record<string, string>)}
        preload="auto"
        controls={controls}
        aria-label={ariaLabel}
        className={cn(
          "h-full w-full",
          objectFit === "cover" ? "object-cover" : "object-contain",
          background && "pointer-events-none",
        )}
      />
      {blocked && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/30",
            background ? "pointer-events-auto" : "",
          )}
          style={
            poster
              ? {
                  backgroundImage: `url("${poster}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <button
            type="button"
            onClick={handleManualPlay}
            aria-label="Play video"
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-2xl ring-1 ring-black/10 backdrop-blur transition hover:scale-105 hover:bg-white active:scale-95"
          >
            <Play className="h-7 w-7 translate-x-0.5 fill-black" />
          </button>
        </div>
      )}
    </div>
  );
}
