import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { onboardingSchema, type OnboardingInput } from "@/features/auth/schemas";
import { checkUsernameAvailable, updateProfile } from "@/features/auth/api";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_CONFIG } from "@/config/app.config";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: profile?.display_name ?? "",
      username: "",
      accountType: "creator",
      avatarUrl: profile?.avatar_url ?? "",
    },
  });

  useEffect(() => {
    if (profile?.display_name) setValue("displayName", profile.display_name);
    if (profile?.avatar_url) setValue("avatarUrl", profile.avatar_url);
  }, [profile, setValue]);

  const usernameValue = watch("username");
  const debouncedUsername = useDebounce(usernameValue, 350);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">(
    "idle",
  );

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    checkUsernameAvailable(debouncedUsername).then((ok) => {
      setUsernameStatus(ok ? "available" : "taken");
    });
  }, [debouncedUsername]);

  async function onSubmit(values: OnboardingInput) {
    if (!userId) return;
    if (usernameStatus === "taken") {
      toast.error("That username is taken");
      return;
    }
    try {
      await updateProfile(userId, {
        display_name: values.displayName,
        username: values.username.toLowerCase(),
        account_type: values.accountType,
        avatar_url: values.avatarUrl || null,
        onboarding_completed: true,
      });
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Welcome to ZUPIX!");
      navigate({ to: "/app" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <AuthShell
      title="Set up your account"
      subtitle="A few quick details and you're ready to build."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Full name</Label>
          <Input id="displayName" placeholder="Jane Doe" {...register("displayName")} />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-3 text-sm text-muted-foreground">zupix.link/</span>
              <input
                id="username"
                className="flex-1 bg-transparent px-1 py-2 text-sm outline-none"
                placeholder="yourname"
                autoComplete="off"
                {...register("username")}
              />
              <span className="pr-3">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && <Check className="h-4 w-4 text-green-600" />}
                {usernameStatus === "taken" && <X className="h-4 w-4 text-destructive" />}
              </span>
            </div>
          </div>
          {errors.username ? (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>You are a…</Label>
          <Select
            defaultValue="creator"
            onValueChange={(v) => setValue("accountType", v as OnboardingInput["accountType"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creator">Creator</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || usernameStatus === "taken"}
        >
          {isSubmitting ? "Setting up..." : `Continue to ${APP_CONFIG.shortName}`}
        </Button>
      </form>
    </AuthShell>
  );
}
