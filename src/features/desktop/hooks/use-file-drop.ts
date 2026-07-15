import { useEffect, useRef, useState } from "react";

interface DroppedFile {
  file: File;
  path: string; // webkitRelativePath or name
}

interface Options {
  onFiles: (files: DroppedFile[]) => void;
  accept?: (file: File) => boolean;
  disabled?: boolean;
}

/**
 * Attach desktop file drop (with folder support via DataTransferItem)
 * to an element. Returns { isOver, ref } for the drop container.
 */
export function useFileDrop<T extends HTMLElement>({ onFiles, accept, disabled }: Options) {
  const ref = useRef<T | null>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    let depth = 0;
    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      depth++;
      setIsOver(true);
    };
    const onOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (e: DragEvent) => {
      e.preventDefault();
      depth = Math.max(0, depth - 1);
      if (depth === 0) setIsOver(false);
    };
    const onDrop = async (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      depth = 0;
      setIsOver(false);
      const collected: DroppedFile[] = [];
      const items = Array.from(e.dataTransfer.items ?? []);
      const entries = items
        .map((it) => (typeof it.webkitGetAsEntry === "function" ? it.webkitGetAsEntry() : null))
        .filter(Boolean) as FileSystemEntry[];
      if (entries.length) {
        await Promise.all(entries.map((ent) => walk(ent, "", collected)));
      } else {
        for (const f of Array.from(e.dataTransfer.files)) collected.push({ file: f, path: f.name });
      }
      const filtered = accept ? collected.filter((c) => accept(c.file)) : collected;
      if (filtered.length) onFiles(filtered);
    };

    el.addEventListener("dragenter", onEnter);
    el.addEventListener("dragover", onOver);
    el.addEventListener("dragleave", onLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragenter", onEnter);
      el.removeEventListener("dragover", onOver);
      el.removeEventListener("dragleave", onLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [onFiles, accept, disabled]);

  return { ref, isOver };
}

async function walk(entry: FileSystemEntry, prefix: string, out: DroppedFile[]) {
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) =>
      (entry as FileSystemFileEntry).file(res, rej),
    );
    out.push({ file, path: `${prefix}${entry.name}` });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await new Promise<FileSystemEntry[]>((res, rej) =>
      reader.readEntries(res, rej),
    );
    for (const child of children) await walk(child, `${prefix}${entry.name}/`, out);
  }
}
