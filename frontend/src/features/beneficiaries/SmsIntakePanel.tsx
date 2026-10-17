import { Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSmsIntake } from "./beneficiary.queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  beneficiaryStatusTone,
  beneficiaryStatusKey,
} from "./beneficiary.utils";
import { formatDate } from "@/lib/utils/date";

export function SmsIntakePanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useSmsIntake();

  if (isLoading) return <LoadingState />;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Smartphone className="h-4 w-4" aria-hidden />
            {t("beneficiaries.sms.title")}
          </span>
        }
        subtitle={t("beneficiaries.sms.subtitle")}
      />
      {!data?.length ? (
        <EmptyState title={t("beneficiaries.sms.empty")} />
      ) : (
        <ul className="divide-y divide-neutral-200">
          {data.map((b) => (
            <li
              key={b.beneficiaryId}
              className="py-2.5 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold truncate">
                  {b.fullName}
                </div>
                <div className="text-caption text-neutral-600">
                  <code>{b.uniqueId}</code> · {b.location.woreda ?? "—"} ·{" "}
                  {formatDate(b.registrationDate)}
                </div>
              </div>
              <Chip tone={beneficiaryStatusTone(b.status)}>
                {t(beneficiaryStatusKey(b.status))}
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}