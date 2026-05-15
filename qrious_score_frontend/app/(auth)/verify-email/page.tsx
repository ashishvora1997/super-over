"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail, resendOTP } from "@/app/services/auth.service";
import { getErrorMessage } from "@/app/utils/error-handler";
import { Mail, Clock, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/app/store/auth.store";

function OTPCell({
  value,
  onChange,
  onKeyDown,
  onPaste,
  inputRef,
  disabled,
  shake,
}: {
  value: string;
  onChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefCallback<HTMLInputElement>;
  disabled?: boolean;
  shake?: boolean;
}) {
  const filled = value !== "";
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onPaste={onPaste}
      disabled={disabled}
      className={`w-[52px] h-[56px] text-center text-2xl font-bold rounded-xl
                 border-2 outline-none transition-all duration-200
                 ${filled ? "bg-primary/5 border-primary/40" : "bg-white border-border"}
                 focus:border-primary focus:ring-2 focus:ring-primary/20
                 disabled:opacity-50 disabled:cursor-not-allowed
                 ${shake ? "animate-shake" : ""}`}
    />
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(600);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [success, setSuccess] = useState(false);
  const [shakeBoxes, setShakeBoxes] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) {
      setShakeBoxes(true);
      const t = setTimeout(() => setShakeBoxes(false), 600);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleChange = useCallback((i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    setOtp((prev) => {
      const next = [...prev];
      next[i] = val.slice(-1);
      return next;
    });
    setError("");
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[i] && i > 0) {
        inputRefs.current[i - 1]?.focus();
      }
      if (e.key === "Enter" && otp.every((d) => d)) handleVerify();
    },
    [otp],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const digits = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      if (!digits) return;
      const arr = digits.split("");
      while (arr.length < 6) arr.push("");
      setOtp(arr);
      setError("");
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    },
    [],
  );

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6 || !userId) return;
    setLoading(true);
    setError("");

    try {
      const res = await verifyEmail({ userId: Number(userId), otp: code });
      setSuccess(true);
      if (res.data?.token && res.data?.user) {
        setAuth({ token: res.data.token, user: res.data.user });
      }
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setOtp(["", "", "", "", "", ""]);
      setShakeBoxes(true);
      setTimeout(() => setShakeBoxes(false), 600);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId || countdown > 0 || resendLoading) return;
    setResendLoading(true);
    setError("");
    try {
      const res = await resendOTP({ userId: Number(userId) });
      setCountdown(res.data?.expiresIn || 600);
      setRemainingAttempts(res.data?.remainingAttempts ?? 3);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  if (!userId || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.06)] p-8 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-lg font-bold text-foreground mb-1">
            Invalid Session
          </h1>
          <p className="text-sm text-muted mb-5">
            Please register again to verify your email.
          </p>
          <Link
            href="/register"
            className="inline-block w-full py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors text-center"
          >
            Go to Register
          </Link>
        </div>
      </div>
    );
  }

  const masked = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
  const allFilled = otp.every((d) => d);
  const timerExpired = countdown <= 0;

  return (
    <div>
      <Link
        href="/register"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-3"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Register
        </Link>

        <div className="bg-white rounded-2xl shadow-[0_2px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-8 pt-8 pb-0 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>

            <h1 className="text-xl font-bold text-foreground mb-1">
              Check your email
            </h1>

            <p className="text-sm text-muted">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{masked}</span>
            </p>
          </div>

          <div className="px-8 pt-6 pb-8">
            {error && (
              <div className="mb-4 p-3 bg-destructive/5 border border-destructive/15 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive leading-snug">{error}</p>
              </div>
            )}

            <p className="text-[10px] font-semibold text-muted uppercase tracking-[0.1em] mb-3">
              Verification Code
            </p>

            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, i) => (
                <OTPCell
                  key={i}
                  value={digit}
                  onChange={(v) => handleChange(i, v)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  inputRef={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  disabled={loading || success}
                  shake={shakeBoxes}
                />
              ))}
            </div>

            <p
              className={`flex items-center justify-center gap-1.5 text-xs mb-6 transition-colors ${
                timerExpired ? "text-destructive" : "text-muted"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {timerExpired ? (
                "Code expired — request a new one"
              ) : (
                <>
                  Code expires in{" "}
                  <span className="font-semibold text-foreground">
                    {fmt(countdown)}
                  </span>
                </>
              )}
            </p>

            <button
              onClick={handleVerify}
              disabled={loading || !allFilled || success}
              className={`w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200
              flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                success
                  ? "bg-accent hover:bg-accent"
                  : "bg-primary hover:bg-primary-dark active:scale-[0.98]"
              }`}
            >
              {success ? (
                <>
                  <Check className="w-5 h-5 animate-bounce-in" />
                  Verified!
                </>
              ) : loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>

          <div className="px-8 py-4 border-t border-border bg-background/50 text-center">
            <p className="text-xs text-muted flex items-center justify-center gap-1.5 flex-wrap">
              Didn&apos;t receive it?
              <button
                onClick={handleResend}
                disabled={
                  !timerExpired || resendLoading || remainingAttempts <= 0
                }
                className="text-primary font-medium hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendLoading ? "Sending…" : "Resend"}
              </button>
              <span className="text-border">·</span>
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center animate-pulse">
            <Mail className="w-6 h-6 text-primary" />
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
