import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCollections, useBrandKits, useTags, useAdvancedSearch } from "../organization-hooks";
import { humanSize, type MediaAsset } from "../types";
import { MediaThumbnail } from "./media-thumbnail";

interface Props {
  workspaceId: string;
  onOpen: (a: MediaAsset) => void;
}

export function AdvancedSearch({ workspaceId, onOpen }: Props) {
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string>("");
  const [brandKitId, setBrandKitId] = useState<string>("");
  const [usageStatus, setUsageStatus] = useState<"any" | "used" | "unused">("any");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [ran, setRan] = useState(false);

  const { data: tags = [] } = useTags(workspaceId);
  const { data: collections = [] } = useCollections(workspaceId);
  const { data: kits = [] } = useBrandKits(workspaceId);

  const { data: results = [], isFetching } = useAdvancedSearch(
    {
      workspaceId,
      text: text || undefined,
      tags: selectedTags.length ? selectedTags : undefined,
      kinds: kinds.length ? kinds : undefined,
      collectionId: collectionId || undefined,
      brandKitId: brandKitId || undefined,
      usageStatus,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      favoritesOnly,
      limit: 120,
    },
    ran,
  );

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleKind = (k: string) =>
    setKinds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));

  const reset = () => {
    setText("");
    setSelectedTags([]);
    setKinds([]);
    setCollectionId("");
    setBrandKitId("");
    setUsageStatus("any");
    setDateFrom("");
    setDateTo("");
    setFavoritesOnly(false);
    setRan(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Advanced search</h3>
        <p className="text-sm text-muted-foreground">
          Combine any signals — name, tags, dates, usage, brand kit, collection
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Name or alt text</Label>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={text} onChange={(e) => setText(e.target.value)} className="pl-8" placeholder="e.g. hero, banner" />
          </div>
        </div>

        <div>
          <Label>File type</Label>
          <div className="flex flex-wrap gap-1.5">
            {["image", "video", "audio", "document"].map((k) => (
              <Badge
                key={k}
                variant={kinds.includes(k) ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => toggleKind(k)}
              >
                {k}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Usage</Label>
          <Select value={usageStatus} onValueChange={(v) => setUsageStatus(v as typeof usageStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="used">Used somewhere</SelectItem>
              <SelectItem value="unused">Unused</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Collection</Label>
          <Select value={collectionId || "any"} onValueChange={(v) => setCollectionId(v === "any" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Brand kit</Label>
          <Select value={brandKitId || "any"} onValueChange={(v) => setBrandKitId(v === "any" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {kits.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>From date</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <Label>To date</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <Label>Tags</Label>
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-auto">
            {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
            {tags.map((t) => (
              <Badge
                key={t.id}
                variant={selectedTags.includes(t.name) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleTag(t.name)}
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 md:col-span-2">
          <Checkbox
            id="favs-only"
            checked={favoritesOnly}
            onCheckedChange={(v) => setFavoritesOnly(!!v)}
          />
          <Label htmlFor="favs-only" className="cursor-pointer">
            Favorites only
          </Label>
        </div>

        <div className="flex gap-2 md:col-span-2">
          <Button onClick={() => setRan(true)}>
            <Search className="mr-1.5 h-4 w-4" /> Search
          </Button>
          <Button variant="ghost" onClick={reset}>
            <X className="mr-1.5 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      {ran && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {isFetching ? "Searching…" : `${results.length} matches`}
          </p>
          {isFetching ? (
            <PageLoader label="Searching" />
          ) : results.length === 0 ? (
            <EmptyState title="No matches" description="Try relaxing a filter." />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {results.map((a) => (
                <button key={a.id} onClick={() => onOpen(a)} className="text-left">
                  <div className="aspect-square overflow-hidden rounded border bg-muted transition hover:border-primary/50">
                    <MediaThumbnail asset={a} />
                  </div>
                  <p className="mt-1 truncate text-xs" title={a.file_name ?? ""}>
                    {a.file_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{humanSize(a.size_bytes)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
