import { AppRouter } from "@/app/router";
import { AppBootstrap } from "@/app/AppBootstrap";
import { ToastProvider } from "@/components/ui/Toast";
import { RoleSwitcher } from "@/features/auth/RoleSwitcher";

export default function App() {
  return (
    <ToastProvider>
      <AppBootstrap>
        <AppRouter />
        {import.meta.env.DEV && <RoleSwitcher />}
      </AppBootstrap>
    </ToastProvider>
  );
}