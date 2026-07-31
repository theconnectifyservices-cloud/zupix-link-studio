import { Sparkles } from "lucide-react";
import { useReleaseNotes } from "../hooks";

/** Public-facing "What's New" timeline for signed-in users. */
export function ReleaseNotesTimeline() {
  const { data, isLoading } = useReleaseNotes(true);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No release notes published yet</p>
        <p className="text-xs text-muted-foreground">Check back soon for product updates.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l pl-6">
      {data.map((note) => (
        <li key={note.id} className="animate-fade-in">
          <span className="absolute -left-[7px] mt-2 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
          <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                v{note.version}
              </span>
              <time className="text-xs text-muted-foreground" dateTime={note.release_date}>
                {new Date(note.release_date).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </div>
            <h3 className="mt-2 text-base font-semibold">{note.title}</h3>
            {note.description && (
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {note.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
