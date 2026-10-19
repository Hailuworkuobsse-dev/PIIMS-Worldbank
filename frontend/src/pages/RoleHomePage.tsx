import { Navigate, Link } from "react-router-dom";
import { ArrowUpRight, Bell, BriefcaseBusiness, ClipboardCheck, Database, FileText, HandCoins, MapPinned, ShieldCheck, Users, Wrench, BarChart3, FolderKanban, Truck, Search, Activity } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { roleLabel, type RoleCode } from "@/features/auth/auth.types";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { BrandMark } from "@/components/brand/BrandMark";

type HomeCard = { title: string; detail: string; href: string; icon: typeof BriefcaseBusiness };
type HomeProfile = { title: string; description: string; cards: HomeCard[] };

const card = (title: string, detail: string, href: string, icon: typeof BriefcaseBusiness): HomeCard => ({ title, detail, href, icon });
const project = card("Projects and portfolio", "Review projects and your authorized portfolio records.", "/projects", FolderKanban);
const inception = card("Inception and approvals", "Review inception submissions and stage-gate work available to your role.", "/inception", ClipboardCheck);
const results = card("Results and indicators", "Review indicators, results reporting, and evidence.", "/results", BarChart3);
const finance = card("Financial management", "Open permitted budget, expenditure, and disbursement functions.", "/financial", HandCoins);
const procurement = card("Procurement and contracts", "Review procurement activity and contract information within your permissions.", "/procurement", FileText);
const supplier = card("Supplier workspace", "Manage your assigned supplier contracts and delivery tasks.", "/supplier", Truck);
const beneficiaries = card("Beneficiary records", "Review registrations and verifications permitted for your scope.", "/beneficiaries", Users);
const field = card("Field operations", "Open assignments, collection, and field progress tools.", "/impact/field", MapPinned);
const impact = card("Impact and evaluation", "Review impact indicators, survey progress, and evaluation work.", "/impact", BarChart3);
const warehouse = card("Data warehouse", "Review dataset preparation and authorized data requests.", "/impact/warehouse", Database);
const research = card("Research catalogue", "Browse available research datasets and manage your access requests.", "/research", Search);
const audit = card("Audit and assurance", "Review authorized audit records, activity, and reports.", "/audit", ShieldCheck);
const admin = card("System administration", "Open user administration, integrations, and system configuration.", "/admin", Wrench);
const reports = card("Reports and documents", "Access reports and supporting documents available to your role.", "/reports", FileText);
const grievances = card("Grievances and follow-up", "Review issues and follow-up actions within your authorization.", "/grievances", ClipboardCheck);
const services = card("Service delivery", "Review assigned service-delivery confirmations.", "/services", Activity);

function profileFor(role: RoleCode): HomeProfile {
  if (role.startsWith("WB-")) {
    if (role === "WB-IE") return { title: "Impact supervision", description: "Your workspace prioritizes evaluation design, indicator evidence, survey progress, and approved datasets.", cards: [impact, results, warehouse, reports] };
    if (role === "WB-FM") return { title: "Financial supervision", description: "Review authorized financial and disbursement evidence, project status, and reporting.", cards: [finance, project, reports, audit] };
    if (role === "WB-PROC") return { title: "Procurement supervision", description: "Review procurement plans, contract information, implementation issues, and evidence.", cards: [procurement, project, reports, audit] };
    if (role === "WB-ES") return { title: "Environmental and social supervision", description: "Follow authorized safeguards-related records, grievances, project evidence, and reports.", cards: [grievances, project, reports, beneficiaries] };
    if (role === "WB-M&E") return { title: "Monitoring and evaluation", description: "Focus on indicators, results evidence, reporting schedules, and portfolio progress.", cards: [results, impact, project, reports] };
    return { title: "Portfolio supervision", description: "Review project implementation, inception submissions, results, and authorized financial and procurement evidence.", cards: [project, inception, results, finance, procurement, reports] };
  }
  if (role.startsWith("MW-")) {
    if (role === "MW-SA") return { title: "Institutional administration", description: "Manage access and system configuration using your assigned administrative permissions.", cards: [admin, audit, project, reports] };
    if (role === "MW-ME") return { title: "Results management", description: "Prioritize indicator quality, reporting deadlines, and implementation results.", cards: [results, impact, reports, project] };
    if (role === "MW-PM") return { title: "Project approvals", description: "Review submissions, project decisions, deadlines, and actions awaiting your attention.", cards: [inception, project, results, reports] };
    if (role === "MW-IE") return { title: "Impact evaluation", description: "Coordinate evaluation indicators, survey progress, quality checks, and datasets.", cards: [impact, field, warehouse, research] };
    if (role === "MW-DM") return { title: "Data management", description: "Oversee approved datasets, anonymization, quality, and data-access requests.", cards: [warehouse, research, impact, reports] };
    if (role === "MW-QA") return { title: "Data quality assurance", description: "Review data-quality flags, field quality signals, and indicator evidence.", cards: [card("Quality assurance", "Review flags and quality checks.", "/impact/qa", ClipboardCheck), field, results, warehouse] };
    if (role === "MW-FO") return { title: "Field operations", description: "Coordinate field assignments, synchronization, and implementation follow-up.", cards: [field, card("Map and geography", "Review geographic information available to your role.", "/map", MapPinned), beneficiaries, results] };
    if (role === "MW-TL") return { title: "Technical coordination", description: "Coordinate project records, pipeline activities, inception documentation, and reporting.", cards: [project, card("Project pipeline", "Review the project pipeline.", "/pipeline", FolderKanban), inception, reports] };
    return { title: "My work", description: "Start with your projects, due work, submissions, and assigned implementation actions.", cards: [project, inception, results, reports, finance] };
  }
  if (role.startsWith("MF-")) return { title: role === "MF-AUD" ? "Financial audit" : "Financial oversight", description: "Work with authorized appropriation, release, expenditure, exceptions, and audit information.", cards: role === "MF-AUD" ? [audit, finance, reports, project] : [finance, reports, project, audit] };
  if (role.startsWith("DB-")) return { title: role === "DB-AUD" ? "Audit home" : "Loan and disbursement portfolio", description: "Review only the financial, loan, disbursement, and assurance information assigned to your role.", cards: role === "DB-AUD" ? [audit, reports, finance] : [finance, project, reports, audit] };
  if (role.startsWith("SP-")) return { title: "Supplier home", description: "Focus on your assigned contracts, delivery requirements, documents, and follow-up actions.", cards: [supplier, procurement, reports, grievances] };
  if (role.startsWith("BN-")) return { title: "Beneficiary services", description: "Use the authorized beneficiary and service-delivery functions available to your account. Public registration and grievances may also use officially announced programme channels.", cards: [beneficiaries, services, grievances] };
  if (role.startsWith("LG-")) return { title: "Local service delivery", description: "Review verifications, registrations, and delivery confirmations within your assigned geographic jurisdiction.", cards: [beneficiaries, services, grievances, card("Geographic view", "Open maps available to your role.", "/map", MapPinned)] };
  if (role === "DC-EN") return { title: "My field assignments", description: "Start with assigned collection work and synchronization tools. Follow your approved field procedures.", cards: [field, card("Survey assignments", "Open survey tools permitted to your account.", "/impact/surveys", ClipboardCheck)] };
  if (role === "DC-SV") return { title: "Field team supervision", description: "Review team progress, quality follow-up, and collection activity.", cards: [field, card("Quality assurance", "Review quality checks available to supervisors.", "/impact/qa", ClipboardCheck), impact] };
  if (role === "RS-EX") return { title: "Research dataset catalogue", description: "Browse published datasets, review request status, and follow applicable data-use agreements.", cards: [research, card("My data requests", "Review your dataset access requests.", "/research/requests", Database), warehouse] };
  if (role === "SC-MB") return { title: "Executive oversight", description: "Read the authorized portfolio summary and approved reporting available to the Steering Committee.", cards: [card("Portfolio reporting", "Review approved portfolio reports.", "/reports", BarChart3), reports, project] };
  if (role.startsWith("AU-")) return { title: "Audit and independent evaluation", description: "Review traceable activity, authorized evidence, and approved reports.", cards: [audit, reports, project, results] };
  if (role.startsWith("SYS-")) return { title: "System operations", description: "Use administrative and assurance tools according to your operational responsibilities.", cards: [admin, audit, card("Integration management", "Review configured integrations.", "/admin/integrations", Activity)] };
  return { title: "My work", description: "Open the modules available to your assigned role.", cards: [project, results, reports] };
}

const PATH_PERMISSIONS: Record<string, string[]> = {
  "/projects": ["project:read"],
  "/pipeline": ["project:read"],
  "/inception": ["inception:read"],
  "/results": ["result:read"],
  "/financial": ["budget:read", "disbursement:read"],
  "/procurement": ["procurement:read"],
  "/supplier": ["supplier:self:read"],
  "/beneficiaries": ["beneficiary:read"],
  "/services": ["service:read"],
  "/impact": ["impact:analytics:read", "impact:indicator:read"],
  "/impact/field": ["field:capture", "field:supervise", "collect:execute", "collect:supervise"],
  "/impact/warehouse": ["warehouse:read"],
  "/research": ["research:request"],
  "/research/requests": ["research:request"],
  "/audit": ["audit:read"],
  "/admin": ["admin:users", "admin:settings"],
  "/admin/integrations": ["integration:read", "integration:manage"],
  "/reports": ["report:read"],
  "/grievances": ["grievance:read"],
  "/map": ["geo:read"],
  "/impact/qa": ["qa:read"],
  "/impact/surveys": ["survey:write"],
};

function canOpenPath(userPermissions: string[], href: string): boolean {
  if (userPermissions.includes("*")) return true;
  const required = PATH_PERMISSIONS[href];
  return !required || required.some((permission) => userPermissions.includes(permission));
}

export default function RoleHomePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  const profile = profileFor(user.role);
  const visibleCards = profile.cards.filter(({ href }) => canOpenPath(user.permissions, href));
  const displayName = user.fullName || user.username;

  return (
    <main id="main" className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/home" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
            <BrandMark className="h-10 w-10" />
            <span><span className="block font-black tracking-[0.12em] text-[#102747]">PIIMS</span><span className="block text-xs text-slate-500">Project workspace</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-bold text-[#102747]">{displayName}</p><p className="text-xs text-slate-500">{user.orgName}</p></div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-[#0b1e3d] p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-sky-100"><ShieldCheck className="h-4 w-4 text-amber-300" /> Secure session</div>
            <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">{profile.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">{profile.description}</p>
            <div className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100">{roleLabel(user.role)}</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/[0.06] p-4 sm:max-w-xs">
            <p className="text-sm font-bold">Your next action</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Open the relevant workspace below to review assigned records and actions. PIIMS does not expose portfolio totals on this home screen without an authorized data response.</p>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-3">
          <div><h2 className="text-xl font-extrabold text-[#102747]">Your workspace</h2><p className="mt-1 text-sm text-slate-600">Modules and actions selected for your role</p></div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 md:flex"><Bell className="h-4 w-4" /> Notifications appear in authorized modules</div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map(({ title, detail, href, icon: Icon }) => (
            <Link key={title} to={href} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 sm:p-6">
              <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-800"><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-5 w-5 text-slate-400 transition group-hover:text-sky-800" /></div>
              <h3 className="mt-4 font-extrabold text-[#102747]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-800">Open workspace <ArrowUpRight className="h-4 w-4" /></span>
            </Link>
          ))}
          {visibleCards.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600 sm:col-span-2 xl:col-span-3">
              No workspace shortcuts are available for the permissions currently assigned to your account. Contact your PIIMS administrator if you believe this is incorrect.
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Signed in as <strong className="text-slate-700">{displayName}</strong> · {user.roleName}</p>
          <p>Restricted · Use only the records and functions authorized for your role.</p>
        </div>
      </div>
    </main>
  );
}
