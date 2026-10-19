import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Layers } from "lucide-react";
import { useImpactIndicators } from "./impactIndicator.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ImpactIndicatorForm } from "./ImpactIndicatorForm";
import { CompositeIndexBuilder } from "./CompositeIndexBuilder";
import { WaveAssignmentModal } from "./WaveAssignmentModal";
import {
  IMPACT_DOMAINS,
  type ImpactIndicator,
  type ImpactDomain,
} from "./impactIndicator.types";
import { useUIStore } from "@/stores/ui.store";

const DOMAIN_TONE: Record<ImpactDomain, any> = {
  INCOME: "green",
  ENERGY: "gold",
  WATER: "blue",
  HEALTH: "red",
  EDUCATION: "purple",
  GENDER: "teal",
  ENVIRONMENT: "green",
  RESILIENCE: "amber",
  SATISFACTION: "grey",
};

export default function ImpactIndicatorsPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { locale } = useUIStore();
  const [domainFilter, setDomainFilter] = useState<ImpactDomain | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [compositeOpen, setCompositeOpen] = useState(false);
  const [assigning, setAssigning] = useState<ImpactIndicator | null>(null);

  const { data, isLoading } = useImpactIndicators({
    domain: domainFilter === "ALL" ? undefined : [domainFilter],
  });

  const columns: Column<ImpactIndicator & { id: string }>[] = [
    {
      id: "code",
      header: "Code",
      render: (r) => (
        <code className="text-caption font-bold text-primary-700">
          {r.code}
        </code>
      ),
    },
    {
      id: "name",
      header: "Indicator",
      render: (r) => (
        <div className="min-w-0">
          <div className="font-semibold truncate">
            {locale === "am" && r.nameAm ? r.nameAm : r.name}
          </div>
          <div className="text-caption text-neutral-600">
            {r.unit} · {r.direction.toLowerCase()}
          </div>
        </div>
      ),
    },
    {
      id: "domain",
      header: "Domain",
      render: (r) => <Chip tone={DOMAIN_TONE[r.domain]}>{r.domain}</Chip>,
    },
    {
      id: "isComposite",
      header: "Type",
      render: (r) =>
        r.isComposite ? (
          <Chip tone="teal">
            <Layers className="h-3 w-3" aria-hidden /> Composite
          </Chip>
        ) : (
          <span className="text-caption text-neutral-600">Base</span>
        ),
    },
    {
      id: "disaggregation",
      header: "Disagg.",
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.disaggregation.length === 0 ? (
            <span className="text-caption text-neutral-500">—</span>
          ) : (
            r.disaggregation.slice(0, 3).map((d) => (
              <span
                key={d}
                className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded font-mono"
              >
                {d}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      render: (r) => (
        <Chip tone={r.status === "ACTIVE" ? "green" : "grey"}>{r.status}</Chip>
      ),
    },
    {
      id: "actions" as keyof ImpactIndicator,
      header: "",
      render: (r) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setAssigning(r);
          }}
        >
          Assign to wave
        </Button>
      ),
    },
  ];

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">
            {t("impactIndicators.title")}
          </h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.length ?? 0} {t("impactIndicators.indicators")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(PERMISSIONS.impactDesign) && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Layers className="h-4 w-4" />}
                onClick={() => setCompositeOpen(true)}
              >
                {t("impactIndicators.composite")}
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateOpen(true)}
              >
                {t("impactIndicators.new")}
              </Button>
            </>
          )}
        </div>
      </header>

      <Card>
        <CardHeader title={t("impactIndicators.filterByDomain")} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDomainFilter("ALL")}
            aria-pressed={domainFilter === "ALL"}
          >
            <Chip tone={domainFilter === "ALL" ? "blue" : "grey"}>
              All domains
            </Chip>
          </button>
          {IMPACT_DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomainFilter(d)}
              aria-pressed={domainFilter === d}
            >
              <Chip tone={domainFilter === d ? DOMAIN_TONE[d] : "grey"}>
                {d}
              </Chip>
            </button>
          ))}
        </div>
      </Card>

      {isLoading && <SkeletonTable rows={6} cols={columns.length} />}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <EmptyState
          title={t("impactIndicators.empty")}
          description={t("impactIndicators.emptyHint")}
        />
      )}
      {!isLoading && (data?.length ?? 0) > 0 && (
        <DataGrid
          columns={columns}
          rows={data!.map((i) => ({ ...i, id: i.indicatorId }))}
          ariaLabel={t("impactIndicators.title")}
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("impactIndicators.new")}
        size="md"
      >
        <ImpactIndicatorForm onSuccess={() => setCreateOpen(false)} />
      </Modal>

      <Modal
        open={compositeOpen}
        onClose={() => setCompositeOpen(false)}
        title={t("impactIndicators.composite")}
        size="md"
      >
        <CompositeIndexBuilder
          indicators={data ?? []}
          onSuccess={() => setCompositeOpen(false)}
        />
      </Modal>

      {assigning && (
        <WaveAssignmentModal
          open
          indicator={assigning}
          onClose={() => setAssigning(null)}
        />
      )}
    </main>
  );
}