import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

/**
 * Research access requests — queue of pending data-access requests
 * submitted from the Research Catalogue.
 */
export default function ResearchRequestsPage() {
  const { t } = useTranslation();
  return (
    <main id="main" className="p-6 space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 text-primary-900">
            {t("research.requests.title")}
          </h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("research.requests.subtitle")}
          </p>
        </div>
        <Link to="/research">
          <Button variant="secondary">{t("research.title")}</Button>
        </Link>
      </header>
      <EmptyState
        title={t("research.requests.empty.title")}
        description={t("research.requests.empty.description")}
      />
    </main>
  );
}
