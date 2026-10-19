import { AppRouter } from "@/app/router";
import { AppBootstrap } from "@/app/AppBootstrap";
import { RoleSwitcher } from "@/features/auth/RoleSwitcher";

export default function App() {
  return (
    <AppBootstrap>
      <AppRouter />
      {import.meta.env.DEV && <RoleSwitcher />}
    </AppBootstrap>
  );
}
