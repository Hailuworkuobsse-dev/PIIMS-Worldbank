import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  KeyRound,
  Mail,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { normalizeApiError } from "@/lib/api/errors";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import { cn } from "@/components/ui/utils/cn";

type Stage = "credentials" | "mfa" | "reset";

interface LocationState {
  from?: string;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const completeMFA = useAuthStore((s) => s.completeMFA);
  const user = useAuthStore((s) => s.user);
  const homeRoute = useAuthStore((s) => s.homeRoute);
  const { locale, setLocale } = useUIStore();

  const [stage, setStage] = useState<Stage>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const mfaRef = useRef<HTMLInputElement>(null);

  /* Redirect if already signed in */
  useEffect(() => {
    if (user) {
      const dest =
        (location.state as LocationState | null)?.from ?? homeRoute();
      navigate(dest, { replace: true });
    }
  }, [user, location.state, navigate, homeRoute]);

  /* Autofocus the active stage input */
  useEffect(() => {
    if (stage === "credentials") firstFieldRef.current?.focus();
    if (stage === "mfa") mfaRef.current?.focus();
  }, [stage]);

  const onSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await login({ username, password, rememberDevice: remember });
      if (res.mfaRequired && res.mfaToken) {
        setMfaToken(res.mfaToken);
        setStage("mfa");
      } else {
        navigate(
          (location.state as LocationState | null)?.from ?? homeRoute(),
          { replace: true },
        );
      }
    } catch (err) {
      const problem = normalizeApiError(err);
      setError(problem.detail ?? problem.title ?? t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;
    setError(null);
    setSubmitting(true);
    try {
      await completeMFA(mfaToken, mfaCode, remember);
      navigate((location.state as LocationState | null)?.from ?? homeRoute(), {
        replace: true,
      });
    } catch (err) {
      const problem = normalizeApiError(err);
      setError(problem.detail ?? problem.title ?? t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-neutral-50">
      {/* Branding panel */}
      <aside
        aria-hidden
        className="hidden lg:flex flex-col justify-between p-12 text-white"
        style={{
          background:
            "linear-gradient(160deg,#0B1E3D 0%,#14315E 55%,#1E4976 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-xl"
            style={{
              background:
                "conic-gradient(from 210deg,#38bdf8,#818cf8,#f472b6,#38bdf8)",
            }}
          />
          <div>
            <div className="text-lg font-extrabold tracking-wide">PIIMS</div>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-75">
              Impact-Enabled
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight">
            Project Inception Information Management System
          </h2>
          <p className="mt-4 opacity-85 leading-relaxed">
            Ministry of Water and Energy · Federal Democratic Republic of
            Ethiopia · Financed by the World Bank.
          </p>
          <div className="mt-8 space-y-2 text-sm opacity-75">
            <div>• 23 modules · 43 roles · 14 stakeholder groups</div>
            <div>• Bilingual · Offline-capable · Auditable</div>
            <div>• Impact measurement by design</div>
          </div>
        </div>

        <div className="text-xs opacity-60">
          © 2026 MoWE · Classification: Restricted
        </div>
      </aside>

      {/* Form panel */}
      <main id="main" className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary-700" />
            <div>
              <div className="text-base font-extrabold text-primary-900">
                PIIMS
              </div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-600">
                {t("app.tagline")}
              </div>
            </div>
          </div>

          {/* Language toggle */}
          <div className="flex justify-end mb-3">
            <div className="inline-flex overflow-hidden rounded-md border border-neutral-300 text-caption">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 font-semibold",
                  locale === "en"
                    ? "bg-primary-700 text-white"
                    : "bg-white text-neutral-600",
                )}
                onClick={() => setLocale("en")}
              >
                English
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 font-semibold",
                  locale === "am"
                    ? "bg-primary-700 text-white"
                    : "bg-white text-neutral-600",
                )}
                onClick={() => setLocale("am")}
              >
                አማርኛ
              </button>
            </div>
          </div>

          <header className="mb-6">
            <h1 className="text-h1 text-primary-900">
              {stage === "credentials" && t("actions.signIn")}
              {stage === "mfa" && "Two-factor verification"}
              {stage === "reset" && "Reset password"}
            </h1>
            <p className="text-body-sm text-neutral-600 mt-1">
              {stage === "credentials" &&
                "Sign in with your government credentials."}
              {stage === "mfa" &&
                "Enter the 6-digit code from your authenticator app."}
              {stage === "reset" && "Enter your email to receive a reset link."}
            </p>
          </header>

          {error && (
            <Banner
              tone="error"
              className="mb-4"
              onDismiss={() => setError(null)}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <span>{error}</span>
              </div>
            </Banner>
          )}

          {stage === "credentials" && (
            <form
              onSubmit={onSubmitCredentials}
              className="space-y-4"
              noValidate
            >
              <Input
                ref={firstFieldRef}
                label="Username / የተጠቃሚ ስም"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="Password / የይለፍ ቃል"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Checkbox
                label="Remember this device / ይህን መሳሪያ አስታውስ"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={submitting}
                leftIcon={
                  !submitting ? <ShieldCheck className="h-4 w-4" /> : undefined
                }
              >
                {submitting ? "Signing in…" : t("actions.signIn")}
              </Button>
              <div className="flex items-center justify-between text-caption text-neutral-600 pt-1">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setStage("reset")}
                >
                  Forgot password?
                </button>
                <span>MFA required for privileged roles</span>
              </div>
            </form>
          )}

          {stage === "mfa" && (
            <form onSubmit={onSubmitMFA} className="space-y-4" noValidate>
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <KeyRound className="h-6 w-6 text-primary-700" aria-hidden />
                </div>
              </div>
              <Input
                ref={mfaRef}
                label="6-digit code / ባለ 6 አሃዝ ኮድ"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={mfaCode}
                onChange={(e) =>
                  setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-lg tracking-[0.4em]"
              />
              <Checkbox
                label="Trust this device for 30 days"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <Button type="submit" fullWidth size="lg" loading={submitting}>
                {submitting ? "Verifying…" : "Verify & continue"}
              </Button>
              <div className="text-center text-caption text-neutral-600">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setStage("credentials")}
                >
                  ← Back to sign in
                </button>
              </div>
            </form>
          )}

          {stage === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStage("credentials");
              }}
              className="space-y-4"
              noValidate
            >
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary-700" aria-hidden />
                </div>
              </div>
              <Input
                label="Email address / ኢሜይል አድራሻ"
                type="email"
                autoComplete="email"
                required
              />
              <Button type="submit" fullWidth size="lg">
                Send reset link
              </Button>
              <div className="text-center text-caption text-neutral-600">
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => setStage("credentials")}
                >
                  ← Back to sign in
                </button>
              </div>
            </form>
          )}

          <p className="text-caption text-neutral-600 mt-8 text-center">
            Need help? Contact{" "}
            <a
              href="mailto:support@piims.gov.et"
              className="text-primary-700 hover:underline"
            >
              support@piims.gov.et
            </a>
          </p>

          {/* Hidden loading indicator for slow networks */}
          {submitting && (
            <div role="status" aria-live="polite" className="sr-only">
              <Loader2 className="animate-spin" /> Signing in, please wait…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}