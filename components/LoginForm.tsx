"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_TIMEOUT_MINUTES = 30;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [passwordExpiresInDays, setPasswordExpiresInDays] = useState<number | null>(null);

  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  // Auto-focus identifier on load, pre-fill + restore Remember Me
  useEffect(() => {
    const savedIdentifier = localStorage.getItem("login_identifier");
    const savedRememberMe = localStorage.getItem("remember_me") === "true";

    if (savedRememberMe && savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
      passwordRef.current?.focus();
    } else {
      identifierRef.current?.focus();
    }
  }, []);

  // Automatic login check using Supabase session state
  useEffect(() => {
    const autoLogin = localStorage.getItem("auto_login") === "true";
    if (autoLogin) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.push("/dashboard");
        } else {
          localStorage.removeItem("auto_login");
        }
      });
    }
  }, [router]);

  // Session timeout: log out after inactivity
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        localStorage.removeItem("auto_login");
        await supabase.auth.signOut();
        window.location.href = "/login?timeout=1";
      }, SESSION_TIMEOUT_MINUTES * 60 * 1000);
    };
    ["mousemove", "keydown", "click"].forEach((evt) =>
      window.addEventListener(evt, resetTimer)
    );
    resetTimer();
    return () => {
      clearTimeout(timer);
      ["mousemove", "keydown", "click"].forEach((evt) =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, []);

  const handleCapsLock = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState("CapsLock"));
  };

  const handleRememberMe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem("login_identifier");
      localStorage.removeItem("remember_me");
      localStorage.removeItem("auto_login");
    }
  };

  // Real-time validation
  const validateIdentifier = (value: string) => {
    setIdentifierError(value.trim() ? "" : "This field is required");
  };
  const validatePassword = (value: string) => {
    setPasswordError(value ? "" : "Password is required");
  };

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    validateIdentifier(identifier);
    validatePassword(password);
    if (!identifier.trim()) return identifierRef.current?.focus();
    if (!password) return passwordRef.current?.focus();

    if (isLocked) {
      const minsLeft = Math.ceil((lockedUntil! - Date.now()) / 60000);
      setError(`Too many attempts. Try again in ${minsLeft} minute(s).`);
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (authError) {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        if (attempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        }
        setError("Invalid email or password.");
        return;
      }

      setFailedAttempts(0);

      // Check if user has MFA / Two-Factor enabled via Supabase factors
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors();
      const hasVerifiedMfa = mfaData?.totp?.some((factor) => factor.status === 'verified');

      if (hasVerifiedMfa && !mfaError) {
        // If Supabase MFA challenge is needed, trigger challenge setup here
        setStep("twoFactor");
      } else {
        finishLogin();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.find((factor) => factor.status === 'verified');

      if (!totpFactor) {
        setError("No verification factor found.");
        return;
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) {
        setError("Failed to initialize verification challenge.");
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: otp,
      });

      if (verifyError) {
        setError("Incorrect code. Please try again.");
        return;
      }

      finishLogin();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const finishLogin = () => {
    if (rememberMe) {
      localStorage.setItem("login_identifier", identifier);
      localStorage.setItem("remember_me", "true");
      localStorage.setItem("auto_login", "true");
    }
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            {step === "credentials" ? "Welcome back" : "Verify it's you"}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === "credentials"
              ? "Sign in to continue to the IMS Platform."
              : `Enter the code we sent to verify your identity.`}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {passwordExpiresInDays !== null && passwordExpiresInDays <= 14 && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Your password expires in {passwordExpiresInDays} day(s). Consider updating it.
          </div>
        )}

        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Email or username
              </label>
              <input
                ref={identifierRef}
                id="identifier"
                name="identifier"
                type="text"
                inputMode="email"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  validateIdentifier(e.target.value);
                }}
                onBlur={(e) => validateIdentifier(e.target.value)}
                placeholder="Enter your email or username"
                disabled={loading || isLocked}
                aria-invalid={!!identifierError}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50"
              />
              {identifierError && <p className="mt-1 text-xs text-red-600">{identifierError}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                  onBlur={(e) => validatePassword(e.target.value)}
                  onKeyDown={handleCapsLock}
                  onKeyUp={handleCapsLock}
                  placeholder="Enter your password"
                  disabled={loading || isLocked}
                  aria-invalid={!!passwordError}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {capsLockOn && (
                <p className="mt-2 text-xs text-amber-600" role="status" aria-live="polite">
                  Caps Lock is on
                </p>
              )}
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMe}
                  disabled={loading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Need access?{" "}
              <a href="/contact-ims-manager" className="underline underline-offset-2 hover:text-gray-600">
                Contact your IMS Manager
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Verification code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                disabled={loading}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm tracking-widest outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="w-full text-center text-sm text-gray-500 underline underline-offset-2 hover:text-gray-700"
            >
              Back to sign in
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          IMS Platform v1.0 · Need help signing in?{" "}
          <a href="/support" className="underline underline-offset-2 hover:text-gray-600">
            Contact IT Support
          </a>
        </p>
      </div>
    </main>
  );
}