import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Eye } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { useAnonymize } from "./warehouse.mutations";
import { useWaveDatasets } from "./warehouse.queries";
import {
  DEFAULT_ANON_CONFIG,
  ANON_LEVELS,
  type AnonymizationConfig as AnonConfig,
} from "./warehouse.types";

interface PreviewRow {
  panelId: string;
  beneficiaryName?: string;
  ageBand?: string;
  income?: number;
  region?: string;
  zone?: string;
}

const MOCK_PREVIEW_RAW: PreviewRow[] = [
  {
    panelId: "P1",
    beneficiaryName: "Aster Bekele",
    ageBand: "40-44",
    income: 3500,
    region: "Oromia",
    zone: "East Shewa",
  },
  {
    panelId: "P2",
    beneficiaryName: "Tadesse Alemu",
    ageBand: "35-39",
    income: 4200,
    region: "Oromia",
    zone: "East Shewa",
  },
  {
    panelId: "P3",
    beneficiaryName: "Hanna Girma",
    ageBand: "25-29",
    income: 5000,
    region: "Amhara",
    zone: "North Shewa",
  },
];

const LEVEL_LABEL: Record<string, string> = {
  L0: "L0 · Internal (no change)",
  L1: "L1 · Pseudonymized",
  L2: "L2 · De-identified",
  L3: "L3 · Aggregated",
};

const LEVEL_TONE: Record<string, any> = {
  L0: "grey",
  L1: "purple",
  L2: "teal",
  L3: "green",
};

export function AnonymizationConfig() {
  const { t } = useTranslation();
  const { data: waves } = useWaveDatasets();
  const anonymize = useAnonymize();
  const [waveId, setWaveId] = useState("");
  const [config, setConfig] = useState<AnonConfig>(DEFAULT_ANON_CONFIG);
  const [previewOpen, setPreviewOpen] = useState(false);


  const onRun = async () => {
    if (!waveId) return;
    await anonymize.mutateAsync({ waveId, config });
    setWaveId("");
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4" aria-hidden />
              {t("warehouse.anonymize.title")}
            </span>
          }
          subtitle={t("warehouse.anonymize.subtitle")}
        />

        <div className="space-y-4">
          <Select
            label={t("warehouse.anonymize.wave")}
            required
            placeholder="Select wave"
            value={waveId}
            onChange={(e) => setWaveId(e.target.value)}
            options={(waves ?? []).map((w) => ({
              value: w.waveId,
              label: `${w.waveCode} · ${w.waveName} (${w.recordCount.toLocaleString()} records)`,
            }))}
          />

          <div>
            <div className="text-caption font-semibold text-primary-900 mb-2">
              {t("warehouse.anonymize.level")}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ANON_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={config.level === lvl}
                  onClick={() => setConfig({ ...config, level: lvl })}
                  className={`p-3 border rounded-md text-left transition ${
                    config.level === lvl
                      ? "border-primary-700 bg-primary-100"
                      : "border-neutral-300 hover:border-primary-300"
                  }`}
                >
                  <Chip tone={LEVEL_TONE[lvl]}>{lvl}</Chip>
                  <div className="text-caption text-neutral-600 mt-1">
                    {LEVEL_LABEL[lvl].split("· ")[1]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {config.level !== "L0" && (
            <div className="grid sm:grid-cols-2 gap-3 border border-neutral-200 rounded-md p-3 bg-neutral-50">
              <div>
                <label
                  htmlFor="ageBracket"
                  className="block text-caption font-semibold text-neutral-900 mb-1"
                >
                  {t("warehouse.anonymize.ageBracket")}
                </label>
                <input
                  id="ageBracket"
                  type="number"
                  min={0}
                  value={config.ageBracket}
                  onChange={(e) =>
                    setConfig({ ...config, ageBracket: Number(e.target.value) })
                  }
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 text-body-sm"
                />
                <p className="text-caption text-neutral-600 mt-1">
                  {t("warehouse.anonymize.ageBracketHint")}
                </p>
              </div>
              <div>
                <label
                  htmlFor="incomeTopCode"
                  className="block text-caption font-semibold text-neutral-900 mb-1"
                >
                  {t("warehouse.anonymize.incomeTopCode")}
                </label>
                <input
                  id="incomeTopCode"
                  type="number"
                  min={1}
                  max={100}
                  value={config.incomeTopCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      incomeTopCode: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 text-body-sm"
                />
                <p className="text-caption text-neutral-600 mt-1">
                  {t("warehouse.anonymize.incomeTopCodeHint")}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="locationGranularity"
                  className="block text-caption font-semibold text-neutral-900 mb-1"
                >
                  {t("warehouse.anonymize.location")}
                </label>
                <select
                  id="locationGranularity"
                  value={config.locationGranularity}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      locationGranularity: e.target.value as any,
                    })
                  }
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 text-body-sm"
                >
                  <option value="REGION">Region</option>
                  <option value="ZONE">Zone</option>
                  <option value="WOREDA">Woreda</option>
                  <option value="KEBELE">Kebele</option>
                  <option value="REMOVED">Removed entirely</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="suppressionThreshold"
                  className="block text-caption font-semibold text-neutral-900 mb-1"
                >
                  {t("warehouse.anonymize.suppression")}
                </label>
                <input
                  id="suppressionThreshold"
                  type="number"
                  min={1}
                  value={config.suppressionThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      suppressionThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full h-9 px-3 rounded-md border border-neutral-300 text-body-sm"
                />
                <p className="text-caption text-neutral-600 mt-1">
                  {t("warehouse.anonymize.suppressionHint")}
                </p>
              </div>
              <div className="flex items-end pb-2">
                <Checkbox
                  label={t("warehouse.anonymize.addNoise")}
                  checked={config.addNoise}
                  onChange={(e) =>
                    setConfig({ ...config, addNoise: e.target.checked })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="primary"
              leftIcon={<Shield className="h-4 w-4" />}
              loading={anonymize.isPending}
              disabled={!waveId}
              onClick={onRun}
            >
              {t("warehouse.anonymize.run")}
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Eye className="h-4 w-4" />}
              onClick={() => setPreviewOpen(true)}
            >
              {t("warehouse.anonymize.preview")}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t("warehouse.anonymize.previewTitle")}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setPreviewOpen(false)}>
            {t("actions.close")}
          </Button>
        }
      >
        <PreviewTable config={config} />
      </Modal>
    </>
  );
}

function PreviewTable({ config }: { config: AnonConfig }) {
  const { t } = useTranslation();

  // Simple client-side preview using the same logic as the engine
  const preview = MOCK_PREVIEW_RAW.map((r) => {
    const out: any = { panelId: r.panelId };
    if (config.level === "L0") {
      return { ...r };
    }
    if (config.level === "L1") {
      out.beneficiaryName = `P${(r.beneficiaryName ?? "").length}***`;
      out.income = r.income;
      out.region = r.region;
      out.zone = r.zone;
    } else if (config.level === "L2") {
      out.ageBand = r.ageBand;
      out.income = r.income;
      out.region = r.region;
      if (config.locationGranularity !== "REGION") out.zone = r.zone;
    } else {
      // L3 — aggregated
      return {
        panelId: `AGG-${r.region}`,
        region: r.region,
        count: 5,
        avgIncome: 4233,
      };
    }
    return out;
  });

  return (
    <div>
      <p className="text-body-sm text-neutral-600 mb-3">
        {t("warehouse.anonymize.previewHint")}
      </p>
      <div className="overflow-x-auto rounded-md border border-neutral-300">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="bg-primary-700 text-white text-left">
              {Object.keys(preview[0] ?? {}).map((k) => (
                <th
                  key={k}
                  className="px-3 py-2 text-caption font-bold uppercase"
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr
                key={i}
                className="border-t border-neutral-200 even:bg-neutral-50"
              >
                {Object.values(row).map((v, j) => (
                  <td key={j} className="px-3 py-2 font-mono text-caption">
                    {String(v ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}