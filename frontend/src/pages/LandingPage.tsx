import { Navigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Database,
  FileText,
  Handshake,
  HelpCircle,
  LockKeyhole,
  Mail,
  MapPinned,
  ShieldCheck,
  Users,
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useAuthStore } from "@/stores/auth.store";
import pkg from "../../package.json";

const AUDIENCES = [
  {
    icon: Building2,
    title: "Government institutions",
    audience: "MoWE, MoF and implementing agencies",
    detail:
      "Coordinate project planning, approvals, implementation responsibilities, monitoring, and formal reporting through controlled workspaces.",
  },
  {
    icon: BadgeCheck,
    title: "World Bank teams",
    audience: "Task teams and fiduciary / safeguards specialists",
    detail:
      "Review authorized project evidence, implementation progress, results indicators, issues, and submissions relevant to your assigned responsibilities.",
  },
  {
    icon: ClipboardCheck,
    title: "Bank and finance officials",
    audience: "DBE, financial management and audit teams",
    detail:
      "Work with permitted financial, disbursement, loan, compliance, and audit information. Access is limited by role and authorization.",
  },
  {
    icon: Handshake,
    title: "Suppliers and contractors",
    audience: "Registered vendors and delivery partners",
    detail:
      "Use the approved supplier access process to follow contract requirements, submit delivery information, and track assigned actions.",
  },
  {
    icon: MapPinned,
    title: "Local and field teams",
    audience: "Regional, zonal, woreda, kebele and field users",
    detail:
      "Support assigned verifications, field updates, service-delivery confirmation, and data-quality follow-up within your jurisdiction.",
  },
  {
    icon: Database,
    title: "Researchers and evaluators",
    audience: "Authorized research and evaluation users",
    detail:
      "Request access to approved datasets through the designated review process and comply with applicable data-use conditions.",
  },
] as const;

const ACCESS_LINKS = [
  {
    title: "Supplier access",
    detail: "Request vendor portal access",
    href: "mailto:support@piims.gov.et?subject=PIIMS%20Supplier%20Access%20Request",
    icon: Handshake,
  },
  {
    title: "Research access",
    detail: "Request anonymized dataset access",
    href: "mailto:support@piims.gov.et?subject=PIIMS%20Research%20Dataset%20Access",
    icon: Database,
  },
] as const;

/** Public institutional entry point. Protected workspaces remain behind authentication. */
export default function LandingPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const homeRoute = useAuthStore((s) => s.homeRoute);

  // Returning users should not have to pass through the public entry page.
  if (user) return <Navigate to={homeRoute()} replace />;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-white p-3 text-[#102747] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-sky-600"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="PIIMS entry page" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            <BrandMark className="h-12 w-12 shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-lg font-black tracking-[0.12em] text-[#102747]">PIIMS</span>
              <span className="mt-1 block max-w-[35rem] text-xs font-semibold leading-4 text-slate-600 sm:text-sm">
                Project Inception Information Management System
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Federal Democratic Republic of Ethiopia</p>
              <p className="text-sm font-semibold text-[#102747]">Ministry of Water and Energy</p>
            </div>
            <div className="hidden h-10 w-px bg-slate-200 md:block" aria-hidden="true" />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main id="main">
        <section className="relative isolate overflow-hidden bg-[#0b1e3d] text-white">
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
            <div className="absolute -bottom-48 left-1/4 h-96 w-96 rounded-full bg-amber-400/[0.08] blur-3xl" />
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.45) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-16 lg:px-8 lg:py-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-bold text-sky-100">
                <ShieldCheck className="h-4 w-4 text-amber-300" aria-hidden="true" />
                Official project information workspace
              </div>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Project Inception Information Management System
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
                Ministry of Water and Energy, Federal Democratic Republic of Ethiopia.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                A controlled workspace for authorized project stakeholders to coordinate implementation, review evidence, follow delivery and results, and carry out their assigned responsibilities.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-bold">Controlled access</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-300">Use only an account provisioned for your role.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.06] p-4">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-bold">Traceable work</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-300">Use assigned workflows and approved records.</p>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-xs leading-5 text-slate-400">
                Developed by HWO Software Development &amp; ICT Consultancy.
              </p>
            </div>

            <div className="mx-auto w-full max-w-lg">
              <div className="rounded-2xl border border-white/15 bg-white p-5 text-slate-900 shadow-2xl shadow-black/30 sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#102747]">
                    <LockKeyhole className="h-6 w-6 text-amber-300" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-[#102747] sm:text-2xl">Secure sign-in</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-600">For authorized PIIMS users</p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm font-bold text-[#102747]">Use your assigned account</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Sign-in credentials are issued by your organization or PIIMS administrator. Government, finance, oversight, and field users must not create their own accounts here.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#1455a0] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#102747] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
                >
                  Continue to secure sign-in
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>

                <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                  If your organization uses single sign-on, follow the approved sign-in instructions supplied by your administrator.
                </p>
                <div className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  Never share your password or one-time verification code. PIIMS support will not ask you to disclose them.
                </div>
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-slate-400">
                Access is subject to your assigned role, authorization, and applicable data-protection requirements.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="access-lanes-heading" className="border-b border-slate-200 bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-800">Need a different type of access?</p>
                <h2 id="access-lanes-heading" className="mt-2 text-xl font-extrabold text-[#102747]">Choose the appropriate access route</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">These routes do not grant immediate access. Requests are reviewed through the responsible team.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ACCESS_LINKS.map(({ title, detail, href, icon: Icon }) => (
                  <a key={title} href={href} className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-sky-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-800 group-hover:bg-[#102747] group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-[#102747]">{title}</span>
                      <span className="mt-1 block text-sm leading-5 text-slate-600">{detail}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-sky-800">Contact support <ArrowRight className="h-3 w-3" aria-hidden="true" /></span>
                    </span>
                  </a>
                ))}
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <Users className="mt-1 h-5 w-5 shrink-0 text-[#1455a0]" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-extrabold text-[#102747]">Beneficiaries and members of the public</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Beneficiary registration, verification, service-delivery questions, and grievances should use the officially announced public channels for the relevant programme. If your programme has published a USSD or SMS code, use that verified code; do not send personal information to unverified numbers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="stakeholders-heading" className="bg-[#f4f7fb] py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-800">One platform · role-based workspaces</p>
              <h2 id="stakeholders-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-[#102747] sm:text-3xl">Designed for the people responsible for delivery and oversight</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                PIIMS supports different responsibilities without presenting every user with the same information. Your workspace and available actions should be determined by your assigned role and permissions.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {AUDIENCES.map(({ icon: Icon, title, audience, detail }) => (
                <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md sm:p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-[#102747]">{title}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wide text-sky-800">{audience}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="principles-heading" className="border-y border-slate-200 bg-white py-10 sm:py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:items-center lg:px-8">
            <div>
              <h2 id="principles-heading" className="text-xl font-extrabold text-[#102747]">Access with accountability</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Project and personal information must be handled carefully, with access limited to legitimate responsibilities.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <h3 className="mt-2 text-sm font-extrabold text-[#102747]">Least privilege</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">Only access records required for your work.</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <LockKeyhole className="h-5 w-5 text-sky-800" aria-hidden="true" />
                <h3 className="mt-2 text-sm font-extrabold text-[#102747]">Protect information</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">Do not share credentials or export data without authorization.</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <HelpCircle className="h-5 w-5 text-amber-700" aria-hidden="true" />
                <h3 className="mt-2 text-sm font-extrabold text-[#102747]">Need assistance?</h3>
                <p className="mt-1 text-xs leading-5 text-slate-600">Contact support through your approved organizational channel.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#07162d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <BrandMark className="h-10 w-10 shrink-0" />
                <div>
                  <p className="font-extrabold tracking-[0.12em]">PIIMS</p>
                  <p className="mt-1 text-xs text-slate-400">Project Inception Information Management System</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                An institutional workspace for project coordination, implementation monitoring, financial oversight, evaluation, and results reporting.
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-400">Developed by HWO Software Development &amp; ICT Consultancy.</p>
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-white">Institutional context</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Ministry of Water and Energy</p>
              <p className="text-sm leading-6 text-slate-300">Federal Democratic Republic of Ethiopia</p>
              <p className="mt-3 text-xs leading-5 text-slate-400">World Bank, government, finance, implementing-partner, and oversight users should access only the functions assigned to them.</p>
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-white">Access and support</h2>
              <a href="mailto:support@piims.gov.et" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-200 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <Mail className="h-4 w-4" aria-hidden="true" /> support@piims.gov.et
              </a>
              <p className="mt-3 text-sm leading-6 text-slate-300">For account provisioning, locked accounts, supplier access, or dataset requests, contact your authorized institutional focal person or PIIMS support.</p>
              <Link to="/login" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                Secure sign-in <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-white">Security and responsible use</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Restricted system. Access is for authorized users only. Activity may be logged and reviewed in accordance with applicable policies.</p>
              <p className="mt-3 text-sm font-extrabold text-amber-300">Unauthorized access is prohibited.</p>
              <p className="mt-3 text-xs leading-5 text-slate-400">Do not submit passwords, beneficiary details, financial records, or other sensitive information through general support email.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} PIIMS · {t("landing.footer.rights")}</p>
            <p>Version {pkg.version} · English / Amharic interface</p>
            <p>Accessible navigation · Role-based access · Restricted information</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
