import React, { useState, useEffect } from "react";
import { Facebook, Instagram, AlertCircle, CheckCircle2, Maximize2, Square, Type, AlignLeft, LayoutHorizontal } from "lucide-react";
import { SocialEmbedBlock } from "../../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const SocialEmbedEditor = ({
  block,
  update,
}: {
  block: SocialEmbedBlock;
  update: (id: string, patch: Partial<SocialEmbedBlock>) => void;
}) => {
  const [url, setUrl] = useState(block.originalUrl || "");
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message?: string }>({ type: 'idle' });

  const validateAndDetect = () => {
    if (!url) {
      setStatus({ type: 'error', message: 'Please enter a URL' });
      return;
    }

    const fbRegex = /(?:https?:\/\/)?(?:www\.)?(?:facebook\.com|fb\.watch)\/.+/i;
    const igRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/.+/i;

    let platform: "facebook" | "instagram" | null = null;
    let contentType: "post" | "video" | "reel" = "post";

    if (fbRegex.test(url)) {
      platform = "facebook";
      contentType = url.includes("video") || url.includes("watch") ? "video" : "post";
    } else if (igRegex.test(url)) {
      platform = "instagram";
      contentType = url.includes("/reel/") ? "reel" : (url.includes("/tv/") ? "video" : "post");
    }

    if (!platform) {
      setStatus({ type: 'error', message: 'Please enter a valid Facebook or Instagram URL.' });
      return;
    }

    // Basic normalization: strip query params
    const normalized = url.split('?')[0];

    update(block.id, {
      platform,
      originalUrl: url,
      normalizedUrl: normalized,
      contentType
    });

    setStatus({ 
      type: 'success', 
      message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${contentType} detected` 
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 p-3 bg-accent/30 rounded-lg border border-accent">
        <div className="flex items-center gap-2 mb-1">
          {block.platform === 'facebook' ? <Facebook className="w-4 h-4 text-[#1877F2]" /> : 
           block.platform === 'instagram' ? <Instagram className="w-4 h-4 text-[#E4405F]" /> : 
           <LayoutHorizontal className="w-4 h-4 text-muted-foreground" />}
          <span className="text-xs font-semibold uppercase tracking-wider">Social Media Embed</span>
        </div>
        
        <div className="space-y-2">
          <Label className="text-[11px] uppercase text-muted-foreground">Paste social media URL</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.instagram.com/reel/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-9 text-sm"
            />
            <Button size="sm" onClick={validateAndDetect} className="shrink-0">
              Preview
            </Button>
          </div>
        </div>

        {status.type !== 'idle' && (
          <div className={cn(
            "flex items-center gap-2 text-xs py-1 px-2 rounded",
            status.type === 'success' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"
          )}>
            {status.type === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {status.message}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-[11px] uppercase text-muted-foreground tracking-wider">Display Settings</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Full width</Label>
              <p className="text-[11px] text-muted-foreground">Expand to edge of container</p>
            </div>
            <Switch
              checked={block.fullWidth ?? true}
              onCheckedChange={(val) => update(block.id, { fullWidth: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Rounded corners</Label>
              <p className="text-[11px] text-muted-foreground">Apply smooth radius</p>
            </div>
            <Switch
              checked={block.rounded ?? true}
              onCheckedChange={(val) => update(block.id, { rounded: val })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Platform label</Label>
              <p className="text-[11px] text-muted-foreground">Show "View on Instagram"</p>
            </div>
            <Switch
              checked={block.showPlatformLabel ?? false}
              onCheckedChange={(val) => update(block.id, { showPlatformLabel: val })}
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <Label className="text-[11px] uppercase text-muted-foreground tracking-wider">Alignment</Label>
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-md">
            {[
              { id: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
              { id: 'center', icon: <LayoutHorizontal className="w-3.5 h-3.5 rotate-90" /> },
              { id: 'right', icon: <AlignLeft className="w-3.5 h-3.5 rotate-180" /> },
            ].map((align) => (
              <Button
                key={align.id}
                variant={block.align === align.id ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 h-8"
                onClick={() => update(block.id, { align: align.id as any })}
              >
                {align.icon}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Caption (Optional)</Label>
          <Input
            placeholder="Add a caption below the embed..."
            value={block.caption || ""}
            onChange={(e) => update(block.id, { caption: e.target.value })}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
};
