import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useResearchDatasets } from "./warehouse.queries";
import { useRequestAccess } from "./warehouse.mutations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils/date";
import type { ResearchDataset } from "./warehouse.types";

export default function ResearchCataloguePage() {
  const { t } = useTranslation();
  const { data: datasets, isLoading } = useResearchDatasets();
  const request = useRequestAccess();
  const { push } = useToast();
  const [selected, setSelected] = useState<ResearchDataset | null>(null);
  const [form, setForm] = useState({
    researcherName: "",
    researcherEmail: "",
    institution: "",
    purpose: "",
  });

  const submit = async () => {
    if (!selected) return;
    if (
      !form.researcherName ||
      !form.researcherEmail ||
      !form.institution ||
      !form.purpose
    ) {
      push("warning", "All fields are required");
      return;
    }
    await request.mutateAsync({ datasetId: selected.datasetId, payload: form });
    setSelected(null);
    setForm({
      researcherName: "",
      researcherEmail: "",
      institution: "",
      purpose: "",
    });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header>
        <h1 className="text-h1 text-primary-900">{t("research.title")}</h1>
        <p className="text-body-sm text-neutral-600 mt-1">
          {t("research.subtitle")}
        </p>
      </header>

      {isLoading && <EmptyState title="Loading…" />}
      {!isLoading && !datasets?.length && (
        <EmptyState
          title="No datasets yet"
          description="Ask a Data Manager to publish a research dataset."
        />
      )}

      {!isLoading && datasets?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {datasets.map((d) => (
            <Card key={d.datasetId}>
              <div className="flex items-center justify-between mb-2">
                <Chip
                  tone={
                    d.anonymizationLevel === "L2"
                      ? "teal"
                      : d.anonymizationLevel === "L3"
                        ? "green"
                        : "purple"
                  }
                >
                  {d.anonymizationLevel}
                </Chip>
                <span className="text-caption text-neutral-600">
                  {d.waveCode}
                </span>
              </div>
              <div className="font-mono text-caption text-primary-700 font-bold mb-1">
                {d.datasetId.slice(0, 20)}…
              </div>
              <div className="text-caption text-neutral-600 mb-3">
                {d.recordCount.toLocaleString()} records · v{d.version}
                {d.releasedAt && ` · ${formatDate(d.releasedAt)}`}
              </div>
              <div className="text-caption mb-3">
                Formats: {d.formats.join(", ")}
              </div>
              <Button
                size="sm"
                variant="primary"
                fullWidth
                onClick={() => setSelected(d)}
              >
                Request access
              </Button>
            </Card>
          ))}
        </div>
      ) : null}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Request data access"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={request.isPending}
              onClick={submit}
            >
              Submit request
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Your name"
            required
            value={form.researcherName}
            onChange={(e) =>
              setForm({ ...form, researcherName: e.target.value })
            }
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.researcherEmail}
            onChange={(e) =>
              setForm({ ...form, researcherEmail: e.target.value })
            }
          />
          <Input
            label="Institution"
            required
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
          />
          <Textarea
            label="Research purpose"
            required
            rows={3}
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />
          <p className="text-caption text-neutral-600">
            By submitting, you agree to sign a Data Use Agreement (DUA) before
            downloading. You must not attempt re-identification, and you must
            acknowledge PIIMS as the data source in publications.
          </p>
        </div>
      </Modal>
    </main>
  );
}