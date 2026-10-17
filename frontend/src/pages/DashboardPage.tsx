import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();
  return (
    <main id="main" className="p-6">
      <h1 className="text-h1">{t("nav.dashboard")}</h1>
      <p className="text-neutral-600 mt-2">App shell arrives in Step 4.</p>
    </main>
  );
}