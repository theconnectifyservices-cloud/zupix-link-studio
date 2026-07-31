import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { PasswordInput } from "@/features/auth/components/password-input";
import { resetPasswordSchema } from "@/features/auth/schemas";
import { updatePassword } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/app/settings/password")({
  component: PasswordSettings,
});

type Values = z.infer<typeof resetPasswordSchema>;

function PasswordSettings() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: Values) {
    try {
      await updatePassword(values.password);
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase
          .from("profiles" as never)
          .update({ force_password_change: false, temp_password_expires_at: null } as never)
          .eq("id", data.user.id);
      }
      toast.success("Password updated");
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new">New password</Label>
        <PasswordInput id="new" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm</Label>
        <PasswordInput id="confirm" autoComplete="new-password" {...register("confirm")} />
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
