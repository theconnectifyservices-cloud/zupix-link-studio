import { Facebook, Instagram } from "lucide-react";
import { SocialEmbedBlock } from "../types";

export const SocialEmbedRender = ({ block }: { block: SocialEmbedBlock }) => {
  const isFB = block.platform === "facebook";
  
  return (
    <div className={`w-full overflow-hidden ${block.rounded ? "rounded-lg" : ""}`}>
      {block.normalizedUrl ? (
        <div className="w-full relative min-h-[400px]">
          <iframe
            src={block.platform === "facebook" 
              ? `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(block.normalizedUrl)}&show_text=true&width=500`
              : `https://www.instagram.com/p/${block.normalizedUrl.split('/').filter(Boolean).pop()}/embed`}
            width="100%"
            height="100%"
            style={{ border: "none", overflow: "hidden", position: "absolute", top: 0, left: 0 }}
            scrolling="no"
            frameBorder="0"
            allow="encrypted-media"
          />
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-muted flex flex-col items-center justify-center text-muted-foreground">
          {isFB ? <Facebook className="w-8 h-8 mb-2" /> : <Instagram className="w-8 h-8 mb-2" />}
          <p className="text-sm text-center">Enter a valid {isFB ? 'Facebook' : 'Instagram'} URL to preview embed</p>
        </div>
      )}
    </div>
  );
};
