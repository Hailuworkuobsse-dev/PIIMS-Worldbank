import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProjects } from "./project.queries";
import { usePipeline } from "./project.queries";
import { LoadingState } from "@/components/ui/LoadingState";
import { Chip } from "@/components/ui/Chip";
import { statusTone, statusLabelKey } from "./project.utils";
import { STAGE_ORDER } from "./project.types";
import { formatMoney } from "@/lib/utils/currency";

export default function PipelinePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useProjects({ limit: 200 });
  const { data: counts } = usePipeline();

  if (isLoading) return <LoadingState message="Loading pipeline…" />;

  const byStatus = STAGE_ORDER.reduce<
    Record<string, typeof data extends undefined ? never[] : any[]>
  >((acc, s) => {
    acc[s] = [];
    return acc;
  }, {});
  (data?.data ?? []).forEach((p) => {
    if (byStatus[p.status]) byStatus[p.status]!.push(p);
  });

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header>
        <h1 className="text-h1 text-primary-900">
          {t("projects.pipeline.title")}
        </h1>
        <p className="text-body-sm text-neutral-600 mt-1">
          {t("projects.pipeline.subtitle")}
        </p>
      </header>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGE_ORDER.filter((s) => s !== "CLOSED").map((stage) => (
            <section
              key={stage}
              aria-label={t(statusLabelKey(stage))}
              className="w-[280px] shrink-0 bg-neutral-100 rounded-md border border-neutral-300"
            >
              <header className="flex items-center justify-between px-3 py-2 border-b border-neutral-300">
                <Chip tone={statusTone(stage)}>{t(statusLabelKey(stage))}</Chip>
                <span className="text-caption font-bold text-neutral-600">
                  {counts?.[stage] ?? byStatus[stage]?.length ?? 0}
                </span>
              </header>
              <ul className="p-2 space-y-2 min-h-[200px]">
                {(byStatus[stage] ?? []).map((p) => (
                  <li key={p.projectId}>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${p.projectCode}`)}
                      className="w-full text-left bg-white border border-neutral-300 rounded-md p-3 hover:border-primary-300 hover:shadow-sm transition"
                    >
                      <div className="text-caption text-primary-700 font-bold">
                        {p.projectCode}
                      </div>
                      <div className="text-body-sm font-semibold text-neutral-900 mt-1 line-clamp-2">
                        {p.name}
                      </div>
                      <div className="text-caption text-neutral-600 mt-1.5">
                        {formatMoney(
                          p.totalBudget.amount,
                          p.totalBudget.currency,
                        )}
                      </div>
                    </button>
                  </li>
                ))}
                {(byStatus[stage] ?? []).length === 0 && (
                  <li className="text-center text-caption text-neutral-500 py-6">
                    {t("projects.pipeline.emptyColumn")}
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}