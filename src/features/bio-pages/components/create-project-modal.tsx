import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { createProjectSchema, type CreateProjectInput, PROJECT_CATEGORIES } from "../schemas";
import { checkSlugAvailable, createBioPage } from "../api";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  workspaceId: string;
  ownerId: string;
}

export function CreateProjectModal({ open, onOpenChange, workspaceId, ownerId }: Props) {
  const qc = useQueryClient();
  const [slugState, setSlugState] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", slug: "", category: "creator", description: "" },
  });

  const slug = form.watch("slug");
  const debouncedSlug = useDebounce(slug, 350);

  useEffect(() => {
    if (!debouncedSlug) return setSlugState("idle");
    const parsed = createProjectSchema.shape.slug.safeParse(debouncedSlug);
    if (!parsed.success) return setSlugState("invalid");
    setSlugState("checking");
    let cancelled = false;
    checkSlugAvailable(debouncedSlug).then((ok) => {
      if (!cancelled) setSlugState(ok ? "available" : "taken");
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedSlug]);

  async function onSubmit(values: CreateProjectInput) {
    if (slugState === "taken") {
      form.setError("slug", { message: "This slug is taken" });
      return;
    }
    try {
      await createBioPage({
        workspaceId,
        ownerId,
        name: values.name,
        slug: values.slug,
        category: values.category,
        description: values.description || null,
      });
      await qc.invalidateQueries({ queryKey: ["bio-pages"] });
      toast.success("Project created");
      form.reset();
      setSlugState("idle");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create new bio page</DialogTitle>
          <DialogDescription>
            Reserve a link and set the basics. You can edit everything later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="My Bio Page" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">zupix.link/</span>
              <div className="relative flex-1">
                <Input
                  id="slug"
                  placeholder="yourname"
                  {...form.register("slug")}
                  onChange={(e) => {
                    const v = e.target.value.toLowerCase().replace(/\s+/g, "-");
                    form.setValue("slug", v, { shouldValidate: true });
                  }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {slugState === "checking" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {slugState === "available" && <Check className="h-4 w-4 text-emerald-600" />}
                  {(slugState === "taken" || slugState === "invalid") && (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </span>
              </div>
            </div>
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
            {slugState === "taken" && !form.formState.errors.slug && (
              <p className="text-xs text-destructive">This slug is already taken</p>
            )}
            {slugState === "available" && (
              <p className="text-xs text-emerald-600">Slug is available</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              defaultValue="creator"
              onValueChange={(v) => form.setValue("category", v as CreateProjectInput["category"])}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="What is this page about?"
              {...form.register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting || slugState === "checking" || slugState === "taken"
              }
            >
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
