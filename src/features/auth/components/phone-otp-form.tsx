import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sendPhoneOtp, verifyPhoneOtp } from "../api";
import {
  COUNTRY_CODES,
  DEFAULT_COUNTRY,
  buildE164,
  isValidPhone,
  normalizeNationalNumber,
} from "../countries";

const RESEND_SECONDS = 45;

export function PhoneOtpForm({ onVerified }: { onVerified: () => void | Promise<void> }) {
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY.code);
  const [national, setNational] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoSubmitted = useRef(false);

  const country = useMemo(
    () => COUNTRY_CODES.find((c) => c.code === dialCode) ?? DEFAULT_COUNTRY,
    [dialCode],
  );
  const phoneE164 = buildE164(dialCode, national);
  const phoneValid = isValidPhone(country, national);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function requestOtp(resend = false) {
    if (!phoneValid || sending) return;
    setSending(true);
    try {
      await sendPhoneOtp(phoneE164);
      setStep("otp");
      setCode("");
      autoSubmitted.current = false;
      setCooldown(RESEND_SECONDS);
      toast.success(resend ? "New code sent" : `Code sent to ${phoneE164}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setSending(false);
    }
  }

  async function verify(value: string) {
    if (value.length !== 6 || verifying) return;
    setVerifying(true);
    try {
      await verifyPhoneOtp(phoneE164, value);
      toast.success("Signed in");
      await onVerified();
    } catch (err) {
      autoSubmitted.current = false;
      setCode("");
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  if (step === "phone") {
    return (
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void requestOtp();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="phone-number">Mobile number</Label>
          <div className="flex gap-2">
            <Select value={dialCode} onValueChange={setDialCode}>
              <SelectTrigger className="h-11 w-[7.5rem] shrink-0" aria-label="Country code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.iso} value={c.code}>
                    <span className="mr-1">{c.flag}</span>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone-number"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder={country.iso === "IN" ? "98765 43210" : "Phone number"}
              className="h-11 flex-1 text-base"
              value={national}
              onChange={(e) => setNational(normalizeNationalNumber(e.target.value).slice(0, 14))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We'll text you a 6-digit verification code. Standard SMS rates may apply.
          </p>
        </div>
        <Button type="submit" className="h-11 w-full" disabled={!phoneValid || sending}>
          {sending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Sending code...
            </>
          ) : (
            <>
              <Phone className="mr-2 size-4" /> Send OTP
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <ShieldCheck className="mx-auto size-6 text-primary" />
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{phoneE164}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          autoFocus
          disabled={verifying}
          onChange={(value) => {
            setCode(value);
            if (value.length === 6 && !autoSubmitted.current) {
              autoSubmitted.current = true;
              void verify(value);
            }
          }}
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="size-11 text-base sm:size-12" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        className="h-11 w-full"
        disabled={code.length !== 6 || verifying}
        onClick={() => void verify(code)}
      >
        {verifying ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" /> Verifying...
          </>
        ) : (
          "Verify & continue"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setStep("phone");
            setCode("");
          }}
        >
          <ArrowLeft className="size-4" /> Change number
        </button>
        <button
          type="button"
          className="text-primary disabled:text-muted-foreground"
          disabled={cooldown > 0 || sending}
          onClick={() => void requestOtp(true)}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
