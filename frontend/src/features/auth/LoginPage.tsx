import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  KeyRound,
  Mail,
  AlertCircle,
  Layers,
  Users,
  WifiOff,
  Languages,
  LineChart,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { CURRENT_POLICY_VERSION } from "@/features/auth/auth.types";
import { normalizeApiError } from "@/lib/api/errors";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Banner } from "@/components/ui/Banner";
import pkg from "../../../package.json";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

type Stage = "credentials" | "mfa" | "reset";

interface LocationState {
  from?: string;
}

const FEATURES = [
  { icon: Layers, key: "auth.login.featureModules" },
  { icon: Users, key: "auth.login.featureRoles" },
  { icon: WifiOff, key: "auth.login.featureOffline" },
  { icon: Languages, key: "auth.login.featureLanguages" },
  { icon: LineChart, key: "auth.login.featureImpact" },
  { icon: Lock, key: "auth.login.featureSecure" },
] as const;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const completeMFA = useAuthStore((s) => s.completeMFA);
  const user = useAuthStore((s) => s.user);
  const homeRoute = useAuthStore((s) => s.homeRoute);
  const locationMessage = (location.state as LocationState & { message?: string } | null)?.message;

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
        const signedIn = useAuthStore.getState().user;
        const onboardingRequired = Boolean(
          res.mfaSetupRequired ||
          signedIn?.mustChangePassword ||
          signedIn?.mfaSetupRequired ||
          signedIn?.acceptedPolicyVersion !== CURRENT_POLICY_VERSION
        );
        navigate(
          onboardingRequired
            ? "/first-login"
            : (location.state as LocationState | null)?.from ?? homeRoute(),
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
      const signedIn = useAuthStore.getState().user;
      const onboardingRequired = Boolean(
        signedIn?.mustChangePassword ||
        signedIn?.mfaSetupRequired ||
        signedIn?.acceptedPolicyVersion !== CURRENT_POLICY_VERSION
      );
      navigate(
        onboardingRequired
          ? "/first-login"
          : (location.state as LocationState | null)?.from ?? homeRoute(),
        { replace: true },
      );
    } catch (err) {
      const problem = normalizeApiError(err);
      setError(problem.detail ?? problem.title ?? t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const headings: Record<Stage, { title: string; subtitle: string }> = {
    credentials: {
      title: t("auth.login.title"),
      subtitle: t("auth.login.subtitle"),
    },
    mfa: {
      title: t("auth.login.mfaTitle"),
      subtitle: t("auth.login.mfaSubtitle"),
    },
    reset: {
      title: t("auth.login.resetTitle"),
      subtitle: t("auth.login.resetSubtitle"),
    },
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-neutral-50">
      {/* ───────────────── Brand panel ───────────────── */}
      <aside
        aria-hidden
        className="hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white relative overflow-hidden"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 28px)," +
            "radial-gradient(1100px 500px at 85% -10%, rgba(56,189,248,0.16), transparent 60%)," +
            "linear-gradient(160deg,#0B1E3D 0%,#14315E 55%,#1E4976 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-14 w-14 drop-shadow-lg" />
            <div>
              <div className="text-lg font-extrabold tracking-wide">PIIMS</div>
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-75">
                Impact-Enabled
              </div>
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border border-white/25 bg-white/10">
            {t("auth.login.classification")}
          </span>
        </div>

        <div className="max-w-xl">
          <h2 className="text-4xl xl:text-[2.75rem] font-extrabold leading-tight">
            {t("auth.login.panelTitle")}
          </h2>
          <p className="mt-4 text-white/80 leading-relaxed">
            {t("auth.login.panelSubtitle")}
          </p>

          <ul className="mt-10 grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-3">
                <span className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-accent-500" />
                </span>
                <span className="text-white/85 leading-snug pt-1.5">
                  {t(key)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1 text-xs text-white/60">
          <div>
            {t("auth.login.ministry")} · {t("auth.login.country")}
          </div>
          <div>{t("auth.login.financed")}</div>
        </div>
      </aside>

      {/* ───────────────── Form panel ───────────────── */}
      <main
        id="main"
        className="flex items-center justify-center p-6 sm:p-10"
      >
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BrandMark className="h-11 w-11" />
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
          <div className="flex justify-end mb-4">
            <LanguageToggle />
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 shadow-lg shadow-neutral-900/5 p-6 sm:p-8">
            <header className="mb-6">
              <h1 className="text-h1 text-primary-900">
                {headings[stage].title}
              </h1>
              <p className="text-body-sm text-neutral-600 mt-1">
                {headings[stage].subtitle}
              </p>
            </header>

            {locationMessage && !error && (
              <Banner tone="success" className="mb-4">
                <span>{locationMessage}</span>
              </Banner>
            )}

            {error && (
              <Banner
                tone="error"
                className="mb-4"
                onDismiss={() => setError(null)}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
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
                  label={t("auth.login.username")}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                  label={t("auth.login.password")}
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Checkbox
                  label={t("auth.login.rememberDevice")}
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={submitting}
                  leftIcon={
                    !submitting ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : undefined
                  }
                >
                  {submitting
                    ? t("auth.login.signingIn")
                    : t("auth.login.signIn")}
                </Button>
                <div className="flex items-center justify-between text-caption text-neutral-600 pt-1">
                  <button
                    type="button"
                    className="hover:underline focus-visible:underline"
                    onClick={() => setStage("reset")}
                  >
                    {t("auth.login.forgotPassword")}
                  </button>
                  <span>{t("auth.login.mfaNote")}</span>
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
                  label={t("auth.login.mfaCode")}
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
                  label={t("auth.login.trustDevice")}
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <Button type="submit" fullWidth size="lg" loading={submitting}>
                  {submitting
                    ? t("auth.login.verifying")
                    : t("auth.login.verify")}
                </Button>
                <div className="text-center text-caption text-neutral-600">
                  <button
                    type="button"
                    className="hover:underline focus-visible:underline"
                    onClick={() => setStage("credentials")}
                  >
                    {t("auth.login.backToSignIn")}
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
                  label={t("auth.login.email")}
                  type="email"
                  autoComplete="email"
                  required
                />
                <Button type="submit" fullWidth size="lg">
                  {t("auth.login.sendResetLink")}
                </Button>
                <div className="text-center text-caption text-neutral-600">
                  <button
                    type="button"
                    className="hover:underline focus-visible:underline"
                    onClick={() => setStage("credentials")}
                  >
                    {t("auth.login.backToSignIn")}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="text-caption text-neutral-600 mt-6 text-center">
            {t("auth.login.needHelp")}{" "}
            <a
              href="mailto:support@piims.gov.et"
              className="text-primary-700 hover:underline font-medium"
            >
              support@piims.gov.et
            </a>
            <span className="mx-2 text-neutral-400" aria-hidden>
              ·
            </span>
            {t("auth.login.version")} {pkg.version}
          </p>

          {/* Screen-reader status while submitting */}
          {submitting && (
            <div role="status" aria-live="polite" className="sr-only">
              <Loader2 className="animate-spin" /> {t("auth.login.signingInSr")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
