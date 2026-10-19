import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { authApi } from "@/features/auth/auth.api";
import { CURRENT_POLICY_VERSION } from "@/features/auth/auth.types";
import { normalizeApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/stores/auth.store";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

type Step = "password" | "mfa" | "consent";

export default function FirstLoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const homeRoute = useAuthStore((s) => s.homeRoute);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const initialStep: Step = user?.mustChangePassword
    ? "password"
    : user?.mfaSetupRequired
      ? "mfa"
      : "consent";
  const [step, setStep] = useState<Step>(initialStep);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; qrUri: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const showError = (err: unknown) => {
    const problem = normalizeApiError(err);
    setError(problem.detail ?? problem.title ?? "We could not complete this step. Please try again.");
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 12) {
      setError("Choose a password with at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      // Password changes revoke refresh sessions; sign in again before proceeding.
      logout({ silent: true });
      navigate("/login", { replace: true, state: { message: "Password updated. Sign in again to continue first-login setup." } });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const startMfaSetup = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await authApi.setupMfa();
      setMfaSetup(result);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const enableMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(mfaCode)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    try {
      await authApi.enableMfa(mfaCode);
      // MFA changes invalidate refresh sessions. Re-authentication must prove MFA.
      logout({ silent: true });
      navigate("/login", { replace: true, state: { message: "MFA is enabled. Sign in again and enter your authenticator code to continue." } });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const acceptPolicy = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!accepted) {
      setError("Please acknowledge the acceptable-use and data-protection notice to continue.");
      return;
    }
    setBusy(true);
    try {
      await authApi.acceptPolicy(CURRENT_POLICY_VERSION);
      updateUser({ acceptedPolicyVersion: CURRENT_POLICY_VERSION, mustChangePassword: false });
      navigate(homeRoute(), { replace: true });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const stepNumber = step === "password" ? 1 : step === "mfa" ? 2 : 3;
  const stepTitle = step === "password" ? "Change your temporary password" : step === "mfa" ? "Set up multi-factor authentication" : "Review and acknowledge responsible use";

  return (
    <main id="main" className="min-h-screen bg-[#f4f7fb] px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11 shrink-0" />
            <div>
              <p className="font-black tracking-[0.12em] text-[#102747]">PIIMS</p>
              <p className="text-xs text-slate-600">Secure first-login setup</p>
            </div>
          </div>
          <LanguageToggle />
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#102747] text-amber-300">
              {step === "password" ? <LockKeyhole className="h-6 w-6" /> : step === "mfa" ? <KeyRound className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-sky-800">Step {stepNumber} of 3</p>
              <h1 className="mt-1 text-xl font-extrabold text-[#102747] sm:text-2xl">{stepTitle}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Complete the required setup before opening your role-specific PIIMS workspace.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Setup progress">
            {(["password", "mfa", "consent"] as Step[]).map((item, index) => (
              <div key={item} className={`h-1.5 rounded-full ${index < stepNumber ? "bg-sky-700" : "bg-slate-200"}`} />
            ))}
          </div>

          {error && <div role="alert" className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
          {notice && <div role="status" className="mt-5 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />{notice}</div>}

          {step === "password" && (
            <form onSubmit={changePassword} className="mt-6 space-y-4">
              <p className="text-sm leading-6 text-slate-600">Your account requires a password change before continuing. Use a unique password that you do not use for another service.</p>
              <label className="block text-sm font-semibold text-slate-700">Current / temporary password
                <input type="password" autoComplete="current-password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">New password
                <input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Confirm new password
                <input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />
              </label>
              <button disabled={busy} className="min-h-12 w-full rounded-lg bg-[#1455a0] px-4 py-3 font-bold text-white hover:bg-[#102747] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Updating password…" : "Update password"}</button>
            </form>
          )}

          {step === "mfa" && (
            <div className="mt-6 space-y-4">
              <p className="text-sm leading-6 text-slate-600">Your role requires a second verification factor. Use an authenticator app approved by your organization. Do not share your setup secret or verification code.</p>
              {!mfaSetup ? (
                <button type="button" disabled={busy} onClick={startMfaSetup} className="min-h-12 w-full rounded-lg bg-[#1455a0] px-4 py-3 font-bold text-white hover:bg-[#102747] disabled:opacity-60">{busy ? "Preparing secure setup…" : "Start MFA setup"}</button>
              ) : (
                <form onSubmit={enableMfa} className="space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-bold text-amber-950">Authenticator setup secret</p>
                    <code className="mt-2 block break-all rounded bg-white p-3 text-sm text-slate-900">{mfaSetup.secret}</code>
                    <p className="mt-3 text-xs leading-5 text-amber-900">Add this secret to your authenticator app. Keep it private. The provisioning URI is shown for compatible authenticator tools.</p>
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer font-semibold">Show provisioning URI</summary>
                      <code className="mt-2 block break-all rounded bg-white p-3">{mfaSetup.qrUri}</code>
                    </details>
                  </div>
                  <label className="block text-sm font-semibold text-slate-700">Six-digit authenticator code
                    <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-xl tracking-[0.4em] focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />
                  </label>
                  <button disabled={busy} className="min-h-12 w-full rounded-lg bg-[#1455a0] px-4 py-3 font-bold text-white hover:bg-[#102747] disabled:opacity-60">{busy ? "Verifying…" : "Verify and enable MFA"}</button>
                </form>
              )}
            </div>
          )}

          {step === "consent" && (
            <form onSubmit={acceptPolicy} className="mt-6 space-y-5">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                <h2 className="font-bold text-[#102747]">Acceptable use and data protection</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  <li>Access only the records and functions required for your assigned responsibilities.</li>
                  <li>Beneficiary records may contain sensitive personal information. View, use, export, or share them only when authorized for a legitimate programme purpose.</li>
                  <li>Researchers must follow the applicable Data Use Agreement and use only approved datasets for the approved purpose.</li>
                  <li>Protect your password and MFA codes. Do not share accounts or leave an authenticated device unattended.</li>
                  <li>System activity may be logged and reviewed under applicable institutional policies and law.</li>
                  <li>Report suspected unauthorized access, accidental disclosure, or account compromise promptly through your institutional security channel.</li>
                </ul>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600" />
                <span>I have read and understand the acceptable-use and data-protection notice. I will use PIIMS only for authorized purposes.</span>
              </label>
              <button disabled={busy || !accepted} className="min-h-12 w-full rounded-lg bg-[#1455a0] px-4 py-3 font-bold text-white hover:bg-[#102747] disabled:cursor-not-allowed disabled:opacity-60">{busy ? "Saving acknowledgement…" : "Acknowledge and continue"}</button>
            </form>
          )}
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">Restricted system · Unauthorized access is prohibited · Need help? Contact your PIIMS administrator.</p>
      </div>
    </main>
  );
}
