import { useAuthStore } from "@/stores/auth.store";
import {
  ROLE_CODES,
  roleLabel,
  rolePermissions,
  roleHome,
  type RoleCode,
} from "./auth.types";
import { cn } from "@/components/ui/utils/cn";

export function RoleSwitcher() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const switchTo = (role: RoleCode) => {
    useAuthStore.setState({
      user: {
        ...user,
        role,
        roleName: roleLabel(role),
        permissions: rolePermissions(role),
        scope:
          role === "SP-AD" || role === "SP-OPS" || role === "SP-SVC"
            ? { ...user.scope, ownRecordsOnly: true }
            : user.scope,
      },
    });
    window.location.hash = roleHome(role);
  };

  return (
    <div
      role="region"
      aria-label="Developer role switcher"
      className="fixed bottom-0 left-0 right-0 z-[200] flex items-center gap-2 overflow-x-auto bg-primary-900 text-white px-3 py-2 text-caption shadow-lg"
    >
      <span className="font-extrabold tracking-widest text-[10px] opacity-60 uppercase shrink-0">
        Dev · Role
      </span>
      {ROLE_CODES.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => switchTo(role)}
          className={cn(
            "shrink-0 rounded-md px-2 py-1 font-semibold transition-colors border",
            user.role === role
              ? "bg-accent-500 border-accent-500 text-primary-900"
              : "bg-white/8 border-white/15 hover:bg-white/20",
          )}
        >
          {role}
        </button>
      ))}
    </div>
  );
}