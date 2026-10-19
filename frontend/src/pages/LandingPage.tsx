import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Layers,
  LineChart,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
  Users,
  WifiOff,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAuthStore } from "@/stores/auth.store";
import pkg from "../../package.json";

const FEATURES = [
  { icon: Layers, t: "landing.features.m1t", d: "landing.features.m1d" },
  { icon: LineChart, t: "landing.features.m2t", d: "landing.features.m2d" },
  { icon: ClipboardCheck, t: "landing.features.m3t", d: "landing.features.m3d" },
  { icon: Users, t: "landing.features.m4t", d: "landing.features.m4d" },
  { icon: WifiOff, t: "landing.features.m5t", d: "landing.features.m5d" },
  { icon: LockKeyhole, t: "landing.features.m6t", d: "landing.features.m6d" },
] as const;

const DELIVERY_STEPS = [
  {
    number: "01",
    icon: FileCheck2,
    title: "Plan with clarity",
    description:
      "Organize project concepts, appraisal, approvals, and implementation milestones in one workflow.",
  },
  {
    number: "02",
    icon: MapPinned,
    title: "Track delivery",
    description:
      "Connect field progress, implementation issues, documents, and stakeholder follow-up.",
  },
  {
    number: "03",
    icon: BarChart3,
    title: "Measure results",
    description:
      "Bring indicators, reporting, and oversight together to support timely, evidence-led decisions.",
  },
] as const;

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Accountable by design", detail: "Role-aware access and traceable work" },
  { icon: Activity, title: "Operational visibility", detail: "Progress, risks, and actions in one view" },
  { icon: Users, title: "Connected teams", detail: "A shared view across project stakeholders" },
  { icon: CheckCircle2, title: "Results focused", detail: "Keep delivery connected to intended outcomes" },
] as const;

/** Public entry point for PIIMS. Protected application workspaces begin after sign-in. */
export default function LandingPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const entryPath = user ? "/dashboard" : "/login";
  const entryLabel = user
    ? t("landing.hero.openDashboard")
    : t("landing.hero.signIn");

  return (
    <div className="min-h-screen overflow-hidden bg-white text-neutral-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.02] backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="PIIMS home" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info">
            <BrandMark className="h-11 w-11 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-lg font-extrabold tracking-[0.12em] text-primary-900">PIIMS</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:block">
                Project Implementation Information Management System
              </span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
            <a href="#capabilities" className="text-sm font-semibold text-slate-600 transition hover:text-primary-900">Capabilities</a>
            <a href="#delivery-cycle" className="text-sm font-semibold text-slate-600 transition hover:text-primary-900">How it works</a>
            <a href="#about" className="text-sm font-semibold text-slate-600 transition hover:text-primary-900">About PIIMS</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Link
              to={entryPath}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-700 px-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 sm:px-5"
            >
              {entryLabel}
              <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative isolate overflow-hidden bg-[#0b1e3d] text-white">
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-sky-400/10 blur-3xl" />
            <div className="absolute -bottom-56 left-1/4 h-[34rem] w-[34rem] rounded-full bg-amber-400/[0.08] blur-3xl" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-bold tracking-wide text-sky-100">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                PROJECT DELIVERY · OVERSIGHT · RESULTS
              </div>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.65rem]">
                Turn project plans into <span className="text-amber-300">measurable impact.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                PIIMS brings project planning, implementation tracking, financial oversight, field delivery, and results reporting into one coordinated workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={entryPath}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-extrabold text-[#102747] shadow-lg shadow-black/10 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1e3d]"
                >
                  {entryLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a
                  href="#capabilities"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/[0.04] px-6 py-3 font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Explore capabilities
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Lifecycle-oriented workflows</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Role-aware access</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-sky-300/15 via-transparent to-amber-300/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white p-4 text-slate-900 shadow-2xl shadow-black/30 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102747]">
                      <BrandMark className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">Project overview</p>
                      <p className="text-xs text-slate-500">Illustrative workspace preview</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Delivery view</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">Implementation</p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-xl font-extrabold text-[#102747]">Progress</span>
                      <Activity className="h-5 w-5 text-sky-700" />
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-3/5 rounded-full bg-sky-700" /></div>
                    <p className="mt-2 text-xs text-slate-500">Milestones and field updates</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500">Results framework</p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-xl font-extrabold text-[#102747]">Indicators</span>
                      <LineChart className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="mt-3 flex h-8 items-end gap-1.5">
                      <span className="h-3 w-1/5 rounded-t bg-amber-200" />
                      <span className="h-5 w-1/5 rounded-t bg-amber-300" />
                      <span className="h-4 w-1/5 rounded-t bg-amber-400" />
                      <span className="h-7 w-1/5 rounded-t bg-amber-500" />
                      <span className="h-6 w-1/5 rounded-t bg-amber-600" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Evidence linked to outcomes</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-800">Delivery workstreams</p>
                    <span className="text-xs font-semibold text-slate-500">One coordinated view</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Planning & approvals", width: "w-[88%]", color: "bg-sky-700" },
                      { label: "Field implementation", width: "w-[68%]", color: "bg-amber-500" },
                      { label: "Monitoring & reporting", width: "w-[78%]", color: "bg-emerald-600" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-600"><span>{item.label}</span><span>Workstream</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.width} ${item.color}`} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#102747] px-4 py-3 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-300" />
                  Clear ownership. Traceable actions. Better decisions.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="capabilities" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-800">One connected platform</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#102747] sm:text-4xl">
                {t("landing.features.title")}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {t("landing.features.subtitle")}
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, t: tk, d: dk }, index) => (
                <article key={tk} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-800 transition group-hover:bg-[#102747] group-hover:text-white">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="text-xs font-extrabold tracking-widest text-slate-300">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-base font-extrabold text-[#102747]">{t(tk)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(dk)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="delivery-cycle" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-800">From start to outcomes</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#102747] sm:text-4xl">Designed around the project delivery cycle</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">Keep the work connected from the first project concept through implementation, monitoring, and results reporting.</p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {DELIVERY_STEPS.map(({ number, icon: Icon, title, description }) => (
                <article key={number} className="relative rounded-2xl border border-slate-200 p-6 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#102747] text-white"><Icon className="h-6 w-6" aria-hidden /></span>
                    <span className="text-4xl font-black tracking-tight text-slate-100">{number}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-extrabold text-[#102747]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 border-y border-slate-200 bg-[#f5f8fc] py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-800">A shared operational picture</p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#102747]">{t("landing.about.title")}</h2>
                <p className="mt-4 text-base leading-7 text-slate-600">{t("landing.about.body")}</p>
                <div className="mt-5 inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">
                  {t("landing.about.classification")}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {PRINCIPLES.map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><Icon className="h-5 w-5" aria-hidden /></span>
                    <div><h3 className="font-extrabold text-[#102747]">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0b1e3d] py-12 text-white sm:py-14">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold sm:text-3xl">Bring project information together.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">Sign in to continue to your PIIMS workspace and role-specific tools.</p>
            </div>
            <Link to={entryPath} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400 px-6 py-3 font-extrabold text-[#102747] transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1e3d]">
              {entryLabel}<ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#07162d] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link to="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info">
            <BrandMark className="h-9 w-9 shrink-0" />
            <span><span className="block font-extrabold tracking-[0.12em]">PIIMS</span><span className="block text-xs text-slate-400">Project delivery and results</span></span>
          </Link>
          <div className="text-sm text-slate-300">
            {t("auth.login.needHelp")}{" "}
            <a href="mailto:support@piims.gov.et" className="font-semibold text-white underline-offset-4 hover:underline">support@piims.gov.et</a>
          </div>
          <div className="text-xs text-slate-400">{t("landing.footer.rights")} · {t("auth.login.version")} {pkg.version}</div>
        </div>
      </footer>
    </div>
  );
}
