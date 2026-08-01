import { useMemo, useState } from "react";
import { Bug, Gauge, Pin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMyVersions, useUpdateStateMutation } from "../hooks";
import {
  RELEASE_TYPES,
  RELEASE_TYPE_LABEL,
  RELEASE_TYPE_STYLE,
  changeCount,
  type MyVersion,
  type ReleaseType,
} from "../types";

const SECTIONS = [
  { key: "whats_new", label: "What's New", icon: Sparkles, tone: "text-violet-500" },
  { key: "bug_fixes", label: "Bug Fixes", icon: Bug, tone: "text-emerald-500" },
  {
    key: "performance_improvements",
    label: "Performance",
    icon: Gauge,
    tone: "text-sky-500",
  },
  { key: "security_updates", label: "Security", icon: ShieldCheck, tone: "text-rose-500" },
] as const;

/** Full version history, searchable and filterable by release type. */
export function ChangelogTimeline() {
  const { data, isLoading } = useMyVersions();
  const markRead = useUpdateStateMutation();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ReleaseType | "all">("all");

  const versions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((v) => {
      if (type !== "all" && v.release_type !== type) return false;
      if (!q) return true;
      const haystack = [
        v.version,
        v.title,
        v.description,
        ...v.whats_new,
        ...v.bug_fixes,
        ...v.performance_improvements,
        ...v.security_updates,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, query, type]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search updates…"
            className="pl-9"
            aria-label="Search updates"
          />
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:mx-0 sm:px-0 sm:pb-0">
          <FilterChip active={type === "all"} onClick={() => setType("all")}>
            All
          </FilterChip>
          {RELEASE_TYPES.map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
              {RELEASE_TYPE_LABEL[t]}
            </FilterChip>
          ))}
        </div>
      </div>

      {versions.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No updates match your search yet.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l pl-6">
          {versions.map((v) => (
            <VersionCard
              key={v.id}
              version={v}
              onOpen={() => !v.read_at && markRead.mutate({ id: v.id, patch: { read: true } })}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="shrink-0 rounded-full text-xs"
    >
      {children}
    </Button>
  );
}

function VersionCard({ version: v, onOpen }: { version: MyVersion; onOpen: () => void }) {
  return (
    <li className="relative">
      <span
        className="absolute -left-[31px] top-5 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-background"
        aria-hidden
      />
      <article
        onMouseEnter={onOpen}
        className="rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <header className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            v{v.version}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1",
              RELEASE_TYPE_STYLE[v.release_type],
            )}
          >
            {RELEASE_TYPE_LABEL[v.release_type]}
          </span>
          {v.is_pinned && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Pin className="h-3 w-3" aria-hidden /> Pinned
            </span>
          )}
          <time
            className="ml-auto text-xs text-muted-foreground"
            dateTime={v.release_date}
          >
            {new Date(v.release_date).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </time>
        </header>

        <h2 className="mt-3 text-base font-semibold leading-snug">{v.title}</h2>
        {v.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
        )}

        {changeCount(v) > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {SECTIONS.map(({ key, label, icon: Icon, tone }) => {
              const items = v[key];
              if (!items?.length) return null;
              return (
                <section key={key} className="space-y-1.5">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className={cn("h-3.5 w-3.5", tone)} aria-hidden />
                    {label}
                  </h3>
                  <ul className="space-y-1">
                    {items.map((line, i) => (
                      <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                        • {line}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        {v.docs_url && (
          <a
            href={v.docs_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Read the documentation
          </a>
        )}
      </article>
    </li>
  );
}
