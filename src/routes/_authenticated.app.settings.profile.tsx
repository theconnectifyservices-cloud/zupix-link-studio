import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { profileSchema, type ProfileInput } from "@/features/auth/schemas";
import { updateProfile } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/app/settings/profile")({
  component: ProfileSettings,
});

function ProfileSettings() {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.display_name ?? "",
        phone: profile.phone ?? "",
        country: profile.country ?? "",
        timezone: profile.timezone ?? "",
        language: profile.language ?? "",
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileInput) {
    if (!userId) return;
    try {
      await updateProfile(userId, {
        display_name: values.displayName,
        phone: values.phone || null,
        country: values.country || null,
        timezone: values.timezone || null,
        language: values.language || null,
      });
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  const initials = (profile?.display_name ?? profile?.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <Avatar className="h-16 w-16">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{profile?.display_name ?? "—"}</p>
          <p className="truncate text-sm text-muted-foreground">
            zupix.link/{profile?.username ?? "—"}
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-xs text-destructive">{errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" placeholder="US" {...register("country")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Time zone</Label>
            <Input id="timezone" placeholder="UTC" {...register("timezone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input id="language" placeholder="en" {...register("language")} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">
            Email: <span className="font-medium text-foreground">{profile?.email}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
