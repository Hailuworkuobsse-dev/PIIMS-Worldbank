import { useTranslation } from "react-i18next";

export function makeStub(title: string) {
  return function Stub() {
    const { t } = useTranslation();
    return (
      <main id="main" className="p-6">
        <h1 className="text-h1 text-primary-900">{title}</h1>
        <p className="text-body-sm text-neutral-600 mt-1">{t("app.tagline")}</p>
        <p className="text-caption text-neutral-600 mt-6">
          This module is delivered in Steps 5–9.
        </p>
      </main>
    );
  };
}