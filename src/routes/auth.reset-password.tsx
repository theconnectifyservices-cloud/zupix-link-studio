import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PasswordInput } from "@/features/auth/components/password-input";
import { resetPasswordSchema } from "@/features/auth/schemas";
import { updatePassword } from "@/features/auth/api";
import { consumeAuthLink } from "@/features/auth/recovery";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/shared/ui/spinner";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  component: ResetPassword,
});

type Values = z.infer<typeof resetPasswordSchema>;

function ResetPassword() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [linkError, setLinkError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    let alive = true;
    consumeAuthLink().then((result) => {
      if (!alive) return;
      if (result.status === "session") {
        setState("ready");
        return;
      }
      setLinkError(
        result.status === "error"
          ? result.message
          : "This password reset link is invalid or has expired. Request a new one below.",
      );
      setState("invalid");
    });
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(values: Values) {
    try {
      await updatePassword(values.password);
      toast.success("Password updated — you're signed in");
      navigate({ to: "/app" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      toast.error(message);
      if (message.toLowerCase().includes("session")) {
        setLinkError("Your reset link expired before the password was saved. Request a new one.");
        setState("invalid");
      }
    }
  }

  if (state === "checking") {
    return (
      <AuthShell title="Verifying your link" subtitle="One moment while we check your reset link.">
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      </AuthShell>
    );
  }

  if (state === "invalid") {
    return (
      <AuthShell
        title="Reset link problem"
        subtitle="We couldn't verify this password reset link."
        footer={
          <Link to="/auth" className="text-foreground hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">{linkError}</p>
        <Button asChild className="mt-4 w-full">
          <Link to="/auth/forgot-password">Request a new reset link</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you don't use elsewhere."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="rp-password">New password</Label>
          <PasswordInput id="rp-password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rp-confirm">Confirm password</Label>
          <PasswordInput id="rp-confirm" autoComplete="new-password" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
