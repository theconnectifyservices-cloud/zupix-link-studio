import { LucideIcon, Instagram, Facebook } from "lucide-react";
import { newId } from "../../types";
import { BlockDef } from "../../block-registry";
import { SocialEmbedBlock } from "../../types";


export const SocialEmbedEditor = ({
  block,
  update,
}: {
  block: SocialEmbedBlock;
  update: (id: string, patch: Partial<SocialEmbedBlock>) => void;
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wide">Social Media URL</label>
        <input
          className="w-full mt-1 p-2 rounded-md border bg-background"
          placeholder="Paste Facebook or Instagram URL..."
          value={block.originalUrl}
          onChange={(e) => update(block.id, { originalUrl: e.target.value })}
        />
      </div>
      
      <div className="flex gap-2">
        <button
          className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium"
          onClick={() => {
            // Logic to detect platform and update normalizedUrl/contentType
            const url = block.originalUrl;
            let platform: "facebook" | "instagram" = "instagram";
            if (url.includes("facebook.com") || url.includes("fb.watch")) {
              platform = "facebook";
            }
            update(block.id, { platform, normalizedUrl: url });
          }}
        >
          Preview
        </button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={block.fullWidth}
            onChange={(e) => update(block.id, { fullWidth: e.target.checked })}
          />
          <span className="text-sm">Full width</span>
        </label>
      </div>
    </div>
  );
};
