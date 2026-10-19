import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, User } from "lucide-react";
import { useBeneficiary } from "./beneficiary.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Tabs";
import { VerificationPanel } from "./VerificationPanel";
import {
  beneficiaryStatusTone,
  beneficiaryStatusKey,
  maskPhone,
} from "./beneficiary.utils";
import { formatDate } from "@/lib/utils/date";

export default function BeneficiaryDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { beneficiaryId } = useParams<{ beneficiaryId: string }>();
  const { data: b, isLoading, isError } = useBeneficiary(beneficiaryId);
  const { can } = usePermissions();

  if (isLoading) return <LoadingState message="Loading beneficiary…" />;
  if (isError || !b) {
    return <EmptyState title={t("beneficiaries.detail.notFound")} />;
  }

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate("/beneficiaries")}
        >
          {t("beneficiaries.detail.back")}
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-caption text-neutral-600">
            <code className="font-bold text-primary-700">{b.uniqueId}</code>
          </div>
          <h1 className="text-h1 text-primary-900 mt-1">{b.fullName}</h1>
          {b.fullNameAm && (
            <p lang="am" className="text-body-sm text-neutral-600 mt-0.5">
              {b.fullNameAm}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Chip tone={beneficiaryStatusTone(b.status)}>
              {t(beneficiaryStatusKey(b.status))}
            </Chip>
            <Chip tone="grey">{b.gender.toLowerCase()}</Chip>
            {b.ageYears && <Chip tone="grey">{b.ageYears} y</Chip>}
            <Chip tone="grey">{b.registrationChannel}</Chip>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        <div className="min-w-0">
          <Tabs
            tabs={[
              {
                id: "profile",
                label: t("beneficiaries.detail.tabs.profile"),
                content: (
                  <Card>
                    <CardHeader title={t("beneficiaries.detail.profile")} />
                    <dl className="text-body-sm grid sm:grid-cols-2 gap-3">
                      <Row
                        icon={<User className="h-3.5 w-3.5" />}
                        label="Phone"
                        value={maskPhone(b.phone)}
                      />
                      <Row
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        label="Region"
                        value={b.location.region}
                      />
                      <Row label="Zone" value={b.location.zone ?? "—"} />
                      <Row label="Woreda" value={b.location.woreda ?? "—"} />
                      <Row label="Kebele" value={b.location.kebele ?? "—"} />
                      <Row
                        label="Household size"
                        value={String(b.householdSize ?? "—")}
                      />
                      <Row
                        label="Registered"
                        value={formatDate(b.registrationDate)}
                      />
                      <Row
                        label="Verified"
                        value={b.verifiedAt ? formatDate(b.verifiedAt) : "—"}
                      />
                    </dl>
                  </Card>
                ),
              },
              {
                id: "deliveries",
                label: t("beneficiaries.detail.tabs.deliveries"),
                content: (
                  <Card>
                    <CardHeader
                      title={t("beneficiaries.detail.deliveries")}
                      subtitle={t("beneficiaries.detail.deliveriesHint")}
                    />
                    <p className="text-body-sm text-neutral-600">
                      {t("beneficiaries.detail.deliveriesEmpty")}
                    </p>
                  </Card>
                ),
              },
              {
                id: "grievances",
                label: t("beneficiaries.detail.tabs.grievances"),
                content: (
                  <Card>
                    <CardHeader title={t("beneficiaries.detail.grievances")} />
                    <p className="text-body-sm text-neutral-600">
                      {t("beneficiaries.detail.grievancesEmpty")}
                    </p>
                  </Card>
                ),
              },
            ]}
          />
        </div>

        <aside>
          {can(PERMISSIONS.beneficiaryVerify) && (
            <VerificationPanel beneficiary={b} />
          )}
        </aside>
      </div>
    </main>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-caption text-neutral-600 inline-flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd className="font-semibold text-neutral-900 mt-0.5">{value}</dd>
    </div>
  );
}