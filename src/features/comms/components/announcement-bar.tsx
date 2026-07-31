import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useActiveAnnouncement } from "../hooks";

const STORAGE_PREFIX = "zupix:announcement-dismissed:";

/** Site-wide announcement strip. Renders nothing when no announcement is live. */
export function AnnouncementBar() {
  const { data } = useActiveAnnouncement();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!data) return;
    setDismissed(window.localStorage.getItem(STORAGE_PREFIX + data.id) === "1");
  }, [data]);

  if (!data || dismissed) return null;

  function close() {
    if (data) window.localStorage.setItem(STORAGE_PREFIX + data.id, "1");
    setDismissed(true);
  }

  const content = (
    <span className="text-sm font-medium">
      {data.message}
      {data.button_text && data.button_url && (
        <a
          href={data.button_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-3 inline-flex items-center rounded-full border border-current/40 px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80"
        >
          {data.button_text}
        </a>
      )}
    </span>
  );

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="relative z-40 w-full animate-fade-in overflow-hidden"
      style={{ backgroundColor: data.background_color, color: data.text_color }}
    >
      <div className="flex items-center gap-3 px-4 py-2 pr-10 sm:px-6">
        {data.mode === "marquee" ? (
          <div className="marquee-track flex-1 overflow-hidden">
            <div className="marquee-content whitespace-nowrap">
              {content}
              <span aria-hidden className="ml-16">
                {content}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center">{content}</div>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={close}
        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md opacity-70 transition-opacity hover:opacity-100"
        style={{ color: data.text_color }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
