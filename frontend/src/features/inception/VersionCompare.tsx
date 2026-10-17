import { Download } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { reportStatusTone, reportStatusKey } from "./inception.utils";
import { formatDate } from "@/lib/utils/date";
import { useTranslation } from "react-i18next";
import type { ReportVersionSummary } from "./inception.types";

export function VersionCompare({
  versions,
}: {
  versions: ReportVersionSummary[];
}) {
  const { t } = useTranslation();

  if (versions.length < 2) {
    return (
      <div className="p-6 text-center text-body-sm text-neutral-600">
        At least two versions are needed to compare.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <p className="text-caption text-neutral-600">
        Select two versions to compare (side-by-side view).
      </p>
      <ul className="divide-y divide-neutral-200">
        {versions.map((v) => (
          <li key={v.reportId} className="py-3 flex items-center gap-3">
            <input type="checkbox" aria-label={`Select version ${v.version}`} />
            <div className="flex-1">
              <div className="text-body-sm font-semibold">
                Version {v.version}
              </div>
              <div className="text-caption text-neutral-600">
                Submitted {v.submittedAt ? formatDate(v.submittedAt) : "—"}
                {v.reviewedAt && ` · Reviewed ${formatDate(v.reviewedAt)}`}
              </div>
            </div>
            <Chip tone={reportStatusTone(v.status)}>
              {t(reportStatusKey(v.status))}
            </Chip>
            {v.filePath && (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Download className="h-3.5 w-3.5" />}
              >
                Download
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}