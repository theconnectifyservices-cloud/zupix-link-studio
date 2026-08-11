import React, { useState, useEffect, useRef } from "react";
import { Facebook, Instagram, ExternalLink } from "lucide-react";
import { SocialEmbedBlock } from "../types";
import { cn } from "@/lib/utils";

export const SocialEmbedRender = ({ block }: { block: SocialEmbedBlock }) => {
  const [height, setHeight] = useState<number | string>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isFB = block.platform === "facebook";
  const isIG = block.platform === "instagram";
  
  useEffect(() => {
    // Height observer for Instagram iframes which often postMessage their size
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === "https://www.instagram.com" || event.origin === "https://www.facebook.com") {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'MEASURE' || data.type === 'resize') {
            if (data.details?.height) {
              setHeight(data.details.height);
            }
          }
        } catch (e) {
          // Silent catch for non-JSON messages
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!block.normalizedUrl) {
    return (
      <div className={cn(
        "p-12 border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center text-center",
        "bg-accent/5 transition-colors hover:bg-accent/10"
      )}>
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Maximize2 className="w-6 h-6 text-muted-foreground" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">Social Media Embed</h4>
        <p className="text-xs text-muted-foreground max-w-[200px]">
          Paste a Facebook or Instagram URL in the settings to display content here.
        </p>
      </div>
    );
  }

  const embedUrl = isFB 
    ? `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(block.normalizedUrl)}&show_text=true&width=500`
    : `${block.normalizedUrl.endsWith('/') ? block.normalizedUrl : block.normalizedUrl + '/'}embed`;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "w-full flex flex-col items-center group",
        block.fullWidth ? "max-w-none" : "max-w-2xl mx-auto"
      )}
      style={{
        alignItems: block.align === 'left' ? 'flex-start' : block.align === 'right' ? 'flex-end' : 'center'
      }}
    >
      <div className={cn(
        "w-full bg-card border shadow-sm relative overflow-hidden transition-all duration-300",
        block.rounded ? "rounded-xl" : "rounded-none",
        "min-h-[150px]"
      )}>
        <iframe
          src={embedUrl}
          width="100%"
          height={height || (isFB ? 500 : 600)}
          style={{ border: "none", overflow: "hidden", display: 'block' }}
          scrolling="no"
          frameBorder="0"
          allow="encrypted-media"
          title={`${block.platform} content`}
          className="w-full transition-opacity duration-500"
          onLoad={() => {
            // Facebook XFBML parse if available in window (for published profile)
            if (window.FB && isFB) {
              window.FB.XFBML.parse(containerRef.current);
            }
          }}
        />
        
        {block.showPlatformLabel && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <a 
              href={block.originalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm text-[10px] font-medium hover:bg-background"
            >
              {isFB ? <Facebook className="w-3 h-3 text-[#1877F2]" /> : <Instagram className="w-3 h-3 text-[#E4405F]" />}
              <span>View on {isFB ? 'Facebook' : 'Instagram'}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
            </a>
          </div>
        )}
      </div>

      {block.caption && (
        <p className="mt-3 text-xs text-muted-foreground italic px-2 text-center">
          {block.caption}
        </p>
      )}
    </div>
  );
};

// Helper icon for empty state
function Maximize2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
