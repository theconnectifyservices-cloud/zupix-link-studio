import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { PhoneOtpForm } from "@/features/auth/components/phone-otp-form";
import { PasswordInput } from "@/features/auth/components/password-input";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/features/auth/schemas";
import { signInWithPassword, signUpWithPassword } from "@/features/auth/api";
import { startTejasTrial } from "@/features/trial/activation.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  mode: z.enum(["login", "signup"]).optional().catch(undefined),
  plan: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/auth/")({
  ssr: false,
  validateSearch: searchSchema,
  component: AuthPage,
});


function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth/" });
  const [tab, setTab] = useState<"login" | "signup">(search.mode ?? "login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: (search.redirect as "/app" | undefined) ?? "/app" });
      }
    });
  }, [navigate, search.redirect]);

  return (
    <AuthShell
      title="Welcome to ZUPIX Link Studio"
      subtitle="Sign in with your mobile number — we'll text you a 6-digit code"
    >
      <PhoneOtpForm onVerified={() => handleAuthed(navigate, search.redirect)} />
      <OrDivider />
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Email sign in</TabsTrigger>
          <TabsTrigger value="signup">Email sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-6">
          <LoginForm redirectTo={search.redirect} />
        </TabsContent>
        <TabsContent value="signup" className="mt-6">
          <SignupForm onDone={() => setTab("login")} />
        </TabsContent>
      </Tabs>
    </AuthShell>
  );
}

async function handleAuthed(
  navigate: ReturnType<typeof useNavigate>,
  redirectTo?: string,
) {
  try {
    await startTejasTrial({ data: {} });
  } catch {
    /* non-fatal */
  }
  const intent =
    typeof window !== "undefined" ? window.sessionStorage.getItem("zupix:auth_intent") : null;
  if (intent && typeof window !== "undefined")
    window.sessionStorage.removeItem("zupix:auth_intent");
  const target = intent === "trial" ? "/app/my-subscription" : ((redirectTo as "/app") ?? "/app");
  navigate({ to: target });
}

function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
      <Separator className="flex-1" />
    </div>
  );
}

function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  async function onSubmit(values: LoginInput) {
    try {
      await signInWithPassword(values.email, values.password);
      toast.success("Signed in");
      try { await startTejasTrial({ data: {} }); } catch { /* non-fatal */ }
      const intent =
        typeof window !== "undefined" ? window.sessionStorage.getItem("zupix:auth_intent") : null;
      if (intent && typeof window !== "undefined") window.sessionStorage.removeItem("zupix:auth_intent");
      const target = intent === "trial" ? "/app/my-subscription" : (redirectTo as "/app") ?? "/app";
      navigate({ to: target });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="remember" {...register("remember")} />
          <Label htmlFor="remember" className="text-sm font-normal">
            Remember me
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Previously used Google sign-in? Use{" "}
          <Link to="/auth/forgot-password" className="underline">
            Forgot password
          </Link>{" "}
          to set a password — your account and data stay the same.
        </p>
      </form>

    </div>
  );
}

function SignupForm({ onDone }: { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupInput) {
    try {
      const { data } = await signUpWithPassword(values.email, values.password);
      // If email auto-confirm is on and a session exists, activate the trial now.
      if (data?.session) {
        try { await startTejasTrial({ data: {} }); } catch { /* non-fatal */ }
        toast.success("Welcome! Your 3-day Tejas trial is active 🚀");
      } else {
        toast.success("Account created. Check your email to verify.");
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 8 characters, mix of upper, lower, and numbers.
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </form>
    </div>
  );
}
