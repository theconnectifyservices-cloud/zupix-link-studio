import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "sonner";
import { shareOrCopy, type SharePayload } from "../share";

interface Props extends Omit<ButtonProps, "onClick"> {
  payload: SharePayload;
  label?: string;
}

export function ShareButton({ payload, label = "Share", ...btn }: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const res = await shareOrCopy(payload);
    if (res.method === "clipboard" && res.ok) {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } else if (res.method === "unsupported") {
      toast.error("Sharing is not supported on this device");
    } else if (!res.ok && res.error && res.error !== "cancelled") {
      toast.error(res.error);
    }
  };

  return (
    <Button onClick={onClick} className="min-h-11" {...btn}>
      {copied ? (
        <Check className="mr-2 h-4 w-4" />
      ) : "share" in navigator ? (
        <Share2 className="mr-2 h-4 w-4" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
