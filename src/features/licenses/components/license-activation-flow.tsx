import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { KeyRound, ShieldCheck, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/features/auth/components/password-input";
import { passwordSchema, phoneSchema, emailSchema } from "@/features/auth/schemas";
import { signInWithPassword } from "@/features/auth/api";
import { getDeviceId, getDeviceLabel } from "../device";
import { licenseErrorMessage } from "../types";
import { inspectLicenseKey, signUpWithLicense } from "../signup.functions";

const passwordOnlySchema = z
  .object({ password: passwordSchema, confirm: z.string().min(1, "Confirm your password") })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

const detailsSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type PasswordOnlyInput = z.infer<typeof passwordOnlySchema>;
type DetailsInput = z.infer<typeof detailsSchema>;

interface Customer {
  fullName: string;
  email: string;
  phone: string;
}

export function LicenseActivationFlow({
  onBack,
  onActivated,
}: {
  onBack: () => void;
  onActivated: () => void;
}) {
  const inspect = useServerFn(inspectLicenseKey);
  const [licenseKey, setLicenseKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"key" | "password" | "details">("key");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [plan, setPlan] = useState<string | null>(null);

  async function verify() {
    const key = licenseKey.trim();
    if (key.length < 4) {
      setError("Invalid or Expired License Key");
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const res = (await inspect({ data: { licenseKey: key } })) as {
        valid: boolean;
        reason?: string;
        plan?: string;
        maxDevices?: number | null;
        hasCustomer: boolean;
        customer?: Customer;
      };
      if (!res.valid) {
        setError(
          res.reason && res.reason !== "invalid"
            ? licenseErrorMessage(res.reason, res.maxDevices ?? null)
            : "Invalid or Expired License Key",
        );
        return;
      }
      setPlan(res.plan ?? null);
      if (res.hasCustomer && res.customer) {
        setCustomer(res.customer);
        setStage("password");
      } else {
        setCustomer(null);
        setStage("details");
      }
    } catch {
      setError("Invalid or Expired License Key");
    } finally {
      setVerifying(false);
    }
  }

  function resetToKey() {
    setStage("key");
    setCustomer(null);
    setPlan(null);
    setError(null);
  }

  if (stage === "key") {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-4 w-4 text-primary" /> Activate your License
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your License Key to continue. We&apos;ll verify it before creating your account.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="activate-license">License Key</Label>
          <Input
            id="activate-license"
            autoFocus
            placeholder="ZLS-TEJAS-XXXX-XXXX"
            className="font-mono uppercase tracking-wider"
            value={licenseKey}
            onChange={(e) => {
              setLicenseKey(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void verify();
              }
            }}
          />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button className="w-full" onClick={() => void verify()} disabled={verifying}>
          {verifying ? "Verifying License…" : "Verify License"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to free 3-day trial signup
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <AlertDescription className="text-xs">
          License verified{plan ? ` — ${plan.toUpperCase()} plan` : ""}.
          {customer ? " Your details are already on file." : " Please complete your details."}
        </AlertDescription>
      </Alert>

      {customer ? (
        <CustomerSummary customer={customer} />
      ) : null}

      {stage === "password" && customer ? (
        <PasswordOnlyForm
          licenseKey={licenseKey}
          customer={customer}
          onActivated={onActivated}
        />
      ) : (
        <DetailsForm licenseKey={licenseKey} onActivated={onActivated} />
      )}

      <button
        type="button"
        onClick={resetToKey}
        className="flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Use a different License Key
      </button>
    </div>
  );
}

function CustomerSummary({ customer }: { customer: Customer }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-xs">
      <p className="mb-2 font-medium text-foreground">Account details from your license</p>
      <dl className="space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-3">
          <dt>Name</dt>
          <dd className="truncate font-medium text-foreground">{customer.fullName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Email</dt>
          <dd className="truncate font-medium text-foreground">{customer.email}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Phone</dt>
          <dd className="truncate font-medium text-foreground">{customer.phone}</dd>
        </div>
      </dl>
    </div>
  );
}

function PasswordOnlyForm({
  licenseKey,
  customer,
  onActivated,
}: {
  licenseKey: string;
  customer: Customer;
  onActivated: () => void;
}) {
  const signUp = useServerFn(signUpWithLicense);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordOnlyInput>({ resolver: zodResolver(passwordOnlySchema) });

  async function onSubmit(values: PasswordOnlyInput) {
    try {
      const res = (await signUp({
        data: {
          licenseKey,
          password: values.password,
          deviceId: getDeviceId(),
          deviceLabel: getDeviceLabel(),
        },
      })) as { ok: boolean; reason?: string; maxDevices?: number | null; email?: string };
      if (!res.ok) {
        toast.error(licenseErrorMessage(res.reason, res.maxDevices));
        return;
      }
      await signInWithPassword(res.email ?? customer.email, values.password);
      toast.success("License activated — welcome to ZUPIX Link Studio 🎉");
      onActivated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activation failed");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activate-password">Create password</Label>
          <PasswordInput
            id="activate-password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="activate-confirm">Confirm password</Label>
          <PasswordInput
            id="activate-confirm"
            autoComplete="new-password"
            {...register("confirm")}
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Activating…" : "Activate & enter dashboard"}
      </Button>
    </form>
  );
}

function DetailsForm({
  licenseKey,
  onActivated,
}: {
  licenseKey: string;
  onActivated: () => void;
}) {
  const signUp = useServerFn(signUpWithLicense);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DetailsInput>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { phone: "+91" },
  });

  async function onSubmit(values: DetailsInput) {
    try {
      const res = (await signUp({
        data: {
          licenseKey,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone.replace(/[^\d+]/g, ""),
          password: values.password,
          deviceId: getDeviceId(),
          deviceLabel: getDeviceLabel(),
        },
      })) as { ok: boolean; reason?: string; maxDevices?: number | null; email?: string };
      if (!res.ok) {
        toast.error(licenseErrorMessage(res.reason, res.maxDevices));
        return;
      }
      await signInWithPassword(values.email, values.password);
      toast.success("License activated — welcome to ZUPIX Link Studio 🎉");
      onActivated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Activation failed");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="activate-name">Full name</Label>
        <Input id="activate-name" autoComplete="name" {...register("fullName")} />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="activate-email">Email address</Label>
        <Input id="activate-email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="activate-phone">Phone number</Label>
        <Input
          id="activate-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          {...register("phone")}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activate-password2">Create password</Label>
          <PasswordInput
            id="activate-password2"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="activate-confirm2">Confirm password</Label>
          <PasswordInput
            id="activate-confirm2"
            autoComplete="new-password"
            {...register("confirm")}
          />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Activating…" : "Activate license & create account"}
      </Button>
    </form>
  );
}
