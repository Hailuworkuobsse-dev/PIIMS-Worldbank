import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Home } from "lucide-react";
import { BREADCRUMBS } from "./menu.config";

export function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();

  const segments = location.pathname.split("/").filter(Boolean);

  // Build cumulative paths
  const crumbs: { label: string; to?: string }[] = [
    { label: t("nav.dashboard"), to: "/dashboard" },
  ];

  // If we're already on /dashboard, don't duplicate
  if (segments[0] === "dashboard" || segments.length === 0) {
    return (
      <nav aria-label="Breadcrumb" className="text-caption text-neutral-600">
        <ol className="flex items-center gap-1">
          <li>
            <Home className="h-3.5 w-3.5" aria-hidden />
          </li>
          <li className="font-semibold text-neutral-900 ml-1">
            {t("nav.dashboard")}
          </li>
        </ol>
      </nav>
    );
  }

  let acc = "";
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLast = i === segments.length - 1;

    // Prefer route-param smart labels for known detail routes
    let label: string | undefined;
    const prev = segments[i - 1];
    if (prev === "projects" && !BREADCRUMBS[seg]) {
      label = params.projectId ?? seg;
    } else if (prev === "inception" && seg !== "inception") {
      label = params.reportId ?? seg;
    } else {
      label = BREADCRUMBS[seg] ? t(BREADCRUMBS[seg]) : seg;
    }

    crumbs.push({ label, to: isLast ? undefined : acc });
  });

  return (
    <nav aria-label="Breadcrumb" className="text-caption text-neutral-600">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} className="inline-flex items-center gap-1">
              {!last && c.to ? (
                <Link
                  to={c.to}
                  className="hover:text-primary-700 hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={last ? "font-semibold text-neutral-900" : ""}
                >
                  {c.label}
                </span>
              )}
              {!last && (
                <ChevronRight className="h-3 w-3 opacity-60" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}