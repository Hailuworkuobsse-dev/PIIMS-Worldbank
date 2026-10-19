import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { CURRENT_POLICY_VERSION, type AuthUser } from "@/features/auth/auth.types";

export default function SsoCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const expiresIn = Number(fragment.get("expires_in"));
    const refreshExpiresIn = Number(fragment.get("refresh_expires_in"));
    let user: AuthUser | null = null;
    try {
      const rawUser = fragment.get("user");
      if (rawUser) user = JSON.parse(rawUser) as AuthUser;
    } catch {
      user = null;
    }

    // Remove bearer tokens from browser history immediately after reading the fragment.
    window.history.replaceState(null, "", window.location.pathname);
    if (!accessToken || !refreshToken || !user || !Number.isFinite(expiresIn) || !Number.isFinite(refreshExpiresIn)) {
      setError("Government sign-in could not be completed. Return to the PIIMS sign-in page and try again.");
      return;
    }

    setSession(user, accessToken, refreshToken, expiresIn, refreshExpiresIn);
    navigate(user.acceptedPolicyVersion === CURRENT_POLICY_VERSION ? "/home" : "/first-login", { replace: true });
  }, [navigate, setSession]);

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-6"><div role="alert" className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-sm leading-6 text-red-800 shadow-sm">{error}<a href="/login" className="mt-4 block font-bold text-[#1455a0] underline">Return to sign in</a></div></main>;
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-6"><div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-sm font-semibold text-[#102747] shadow-sm"><Loader2 className="h-5 w-5 animate-spin" /><ShieldCheck className="h-5 w-5" />Completing secure government sign-in…</div></main>;
}
