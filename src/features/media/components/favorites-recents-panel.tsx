import { Clock, Upload, Pencil, Star } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import {
  useFavoriteAssets,
  useRecentlyUploaded,
  useRecentlyUsed,
  useRecentlyEdited,
} from "../organization-hooks";
import { humanSize, type MediaAsset } from "../types";
import { MediaThumbnail } from "./media-thumbnail";

interface Props {
  workspaceId: string;
  onOpen: (asset: MediaAsset) => void;
}

export function FavoritesRecentsPanel({ workspaceId, onOpen }: Props) {
  const { data: favs = [], isLoading: l1 } = useFavoriteAssets(workspaceId);
  const { data: uploaded = [], isLoading: l2 } = useRecentlyUploaded(workspaceId);
  const { data: used = [], isLoading: l3 } = useRecentlyUsed(workspaceId);
  const { data: edited = [], isLoading: l4 } = useRecentlyEdited(workspaceId);

  const loading = l1 || l2 || l3 || l4;
  if (loading) return <PageLoader label="Loading" />;

  return (
    <div className="space-y-6">
      <Section
        title="Favorites"
        icon={<Star className="h-4 w-4 text-amber-500" />}
        assets={favs}
        empty="Star an asset to see it here."
        onOpen={onOpen}
      />
      <Section
        title="Recently uploaded"
        icon={<Upload className="h-4 w-4" />}
        assets={uploaded}
        empty="Upload files to see them here."
        onOpen={onOpen}
      />
      <Section
        title="Recently used"
        icon={<Clock className="h-4 w-4" />}
        assets={used}
        empty="Assets used on bio pages will appear here."
        onOpen={onOpen}
      />
      <Section
        title="Recently edited"
        icon={<Pencil className="h-4 w-4" />}
        assets={edited}
        empty="Rename or edit an asset to see it here."
        onOpen={onOpen}
      />
    </div>
  );
}

function Section({
  title,
  icon,
  assets,
  empty,
  onOpen,
}: {
  title: string;
  icon: React.ReactNode;
  assets: MediaAsset[];
  empty: string;
  onOpen: (a: MediaAsset) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {icon}
        <h4 className="font-semibold">{title}</h4>
        <span className="text-xs text-muted-foreground">({assets.length})</span>
      </div>
      {assets.length === 0 ? (
        <EmptyState title={empty} className="py-6" />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {assets.slice(0, 16).map((a) => (
            <button
              key={a.id}
              onClick={() => onOpen(a)}
              className="group text-left"
            >
              <div className="aspect-square overflow-hidden rounded border bg-muted transition group-hover:border-primary/50">
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
  );
}
