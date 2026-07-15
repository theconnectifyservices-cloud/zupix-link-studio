import { Camera, Image as ImageIcon, FileText } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

/**
 * Mobile file capture — camera / gallery / document picker.
 * Uses `capture` attribute for camera; graceful fallback on desktop browsers.
 */
export function CameraUpload({
  onFiles,
  accept = "image/*",
  multiple = false,
}: Props) {
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const doc = useRef<HTMLInputElement>(null);

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => cam.current?.click()}
      >
        <Camera className="mr-2 h-4 w-4" /> Camera
      </Button>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => gal.current?.click()}
      >
        <ImageIcon className="mr-2 h-4 w-4" /> Gallery
      </Button>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => doc.current?.click()}
      >
        <FileText className="mr-2 h-4 w-4" /> Document
      </Button>
      <input
        ref={cam}
        type="file"
        className="sr-only"
        accept={accept}
        capture="environment"
        onChange={handle}
      />
      <input
        ref={gal}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        onChange={handle}
      />
      <input
        ref={doc}
        type="file"
        className="sr-only"
        accept="*/*"
        multiple={multiple}
        onChange={handle}
      />
    </div>
  );
}
