import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Layers,
  Users,
  WifiOff,
  LineChart,
  Lock,
  ArrowRight,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAuthStore } from "@/stores/auth.store";
import pkg from "../../package.json";

const FEATURES = [
  { icon: Layers, t: "landing.features.m1t", d: "landing.features.m1d" },
  { icon: LineChart, t: "landing.features.m2t", d: "landing.features.m2d" },
  { icon: Layers, t: "landing.features.m3t", d: "landing.features.m3d" },
  { icon: Users, t: "landing.features.m4t", d: "landing.features.m4d" },
  { icon: WifiOff, t: "landing.features.m5t", d: "landing.features.m5d" },
  { icon: Lock, t: "landing.features.m6t", d: "landing.features.m6d" },
] as const;

const STATS = [
  { value: "23", key: "landing.stats.modules" },
  { value: "43", key: "landing.stats.roles" },
  { value: "14", key: "landing.stats.stakeholders" },
  { value: "2", key: "landing.stats.languages" },
] as const;

/**
 * Public entry point of the application — marketing/overview page.
 * Authentication lives at /login; everything else is behind RequireAuth.
 */
export default function LandingPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" />
            <div className="leading-tight">
              <div className="text-body-sm font-extrabold tracking-wide text-primary-900">
                PIIMS
              </div>
              <div className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Impact-Enabled
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle className="hidden sm:inline-flex" />
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2"
            >
              {user
                ? t("landing.hero.openDashboard")
                : t("landing.hero.signIn")}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden text-white"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 28px)," +
              "radial-gradient(1100px 500px at 85% -10%, rgba(56,189,248,0.16), transparent 60%)," +
              "linear-gradient(160deg,#0B1E3D 0%,#14315E 55%,#1E4976 100%)",
          }}
        >
          <div className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
            <div className="flex items-center gap-4">
              <BrandMark className="h-16 w-16 drop-shadow-xl" />
              <div>
                <div className="text-2xl font-extrabold tracking-wide">
                  PIIMS
                </div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                  Project Inception Information Management System
                </div>
              </div>
            </div>

            <h1 className="mt-10 max-w-3xl text-4xl font-extrabold leading-tight lg:text-5xl">
              {t("landing.hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              {t("landing.hero.subtitle")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-md bg-accent-500 px-6 py-3 font-semibold text-primary-900 transition-colors hover:bg-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
              >
                {user
                  ? t("landing.hero.openDashboard")
                  : t("landing.hero.signIn")}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {t("landing.hero.explore")}
              </a>
            </div>

            {/* Stats */}
            <dl className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {STATS.map((s) => (
                <div
                  key={s.key}
                  className="flex flex-col rounded-lg border border-white/15 bg-white/5 px-4 py-3"
                >
                  <dt className="order-2 mt-1 text-caption uppercase tracking-wider text-white/60">
                    {t(s.key)}
                  </dt>
                  <dd className="order-1 text-3xl font-extrabold text-accent-500">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-h1 text-primary-900">
            {t("landing.features.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-body-sm text-neutral-600">
            {t("landing.features.subtitle")}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, t: tk, d: dk }) => (
              <div
                key={tk}
                className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
                  <Icon className="h-5 w-5 text-primary-900" aria-hidden />
                </span>
                <h3 className="mt-4 text-body font-bold text-primary-900">
                  {t(tk)}
                </h3>
                <p className="mt-1.5 text-body-sm leading-relaxed text-neutral-600">
                  {t(dk)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Ownership & financing ── */}
        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-h2 text-primary-900">
                  {t("landing.about.title")}
                </h2>
                <p className="mt-3 text-body-sm leading-relaxed text-neutral-600">
                  {t("landing.about.body")}
                </p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-caption font-semibold text-neutral-600">
                {t("landing.about.classification")}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-primary-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-8 w-8" />
            <div className="text-caption text-white/70">
              {t("auth.login.needHelp")}{" "}
              <a
                href="mailto:support@piims.gov.et"
                className="font-medium text-white hover:underline"
              >
                support@piims.gov.et
              </a>
            </div>
          </div>
          <div className="text-caption text-white/60">
            {t("landing.footer.rights")} · {t("auth.login.version")}{" "}
            {pkg.version}
          </div>
        </div>
      </footer>
    </div>
  );
}
