import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <main
      id="main"
      className="min-h-screen flex items-center justify-center p-6 bg-primary-900"
    >
      <div className="card p-8 max-w-md w-full">
        <h1 className="text-h1 mb-2">{t("actions.signIn")}</h1>
        <p className="text-neutral-600">{t("app.tagline")}</p>
        <p className="text-neutral-600 mt-4 text-body-sm">
          Authentication UI is delivered in Step 3.
        </p>
      </div>
    </main>
  );
}