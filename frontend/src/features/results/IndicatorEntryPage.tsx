import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useIndicator, useIndicatorValues } from "./results.queries";
import { useRecordIndicatorValue } from "./results.mutations";
import {
  indicatorValueSchema,
  type IndicatorValueInput,
} from "./results.schema";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TrafficLight } from "@/components/ui/TrafficLight";
import { Progress } from "@/components/ui/Progress";
import { computeAchievement, computeTrafficLight } from "./results.utils";

const DISAGG_OPTIONS = ["Male", "Female", "Urban", "Rural"];

export default function IndicatorEntryPage() {
  const navigate = useNavigate();
  const { indicatorId } = useParams<{ indicatorId: string }>();
  const { data: indicator, isLoading } = useIndicator(indicatorId);
  const { data: values } = useIndicatorValues(indicatorId);
  const recordMutation = useRecordIndicatorValue(indicatorId ?? "");

  const [disagg, setDisagg] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<IndicatorValueInput>({
    resolver: zodResolver(indicatorValueSchema),
    defaultValues: {
      period: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`,
      fiscalYear: new Date().getFullYear(),
      value: 0,
      target: indicator?.target ?? 0,
      dataSource: "",
      notes: "",
    },
  });

  const value = Number(watch("value") || 0);
  const target = Number(watch("target") || indicator?.target || 0);
  const achievement = computeAchievement(
    indicator?.baseline ?? 0,
    target,
    value,
    indicator?.direction ?? "INCREASE",
  );
  const status = computeTrafficLight(achievement);

  if (isLoading) return <LoadingState message="Loading indicator…" />;
  if (!indicator) return <EmptyState title="Indicator not found" />;

  const onSubmit = async (v: IndicatorValueInput) => {
    const disaggregation = Object.keys(disagg).length
      ? Object.fromEntries(
          Object.entries(disagg).map(([k, val]) => [k, { value: Number(val) }]),
        )
      : undefined;
    await recordMutation.mutateAsync({ ...v, disaggregation });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate("/results")}
        >
          Back
        </Button>
      </div>

      <header>
        <code className="text-caption font-bold text-primary-700">
          {indicator.code}
        </code>
        <h1 className="text-h1 text-primary-900 mt-1">{indicator.name}</h1>
        {indicator.nameAm && (
          <p lang="am" className="text-body-sm text-neutral-600 mt-0.5">
            {indicator.nameAm}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <TrafficLight
            status={status}
            percent={achievement ? Math.round(achievement) : undefined}
          />
          <span className="text-caption text-neutral-600">
            Unit: <strong>{indicator.unit}</strong> · Frequency:{" "}
            {indicator.frequency}
          </span>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader title="Record value" />
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                {...register("period")}
                label="Reporting period"
                required
                error={errors.period?.message}
                placeholder="e.g. Q3-2026"
              />
              <Input
                {...register("fiscalYear", { valueAsNumber: true })}
                type="number"
                label="Fiscal year (EFY)"
                required
                error={errors.fiscalYear?.message}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                {...register("value", { valueAsNumber: true })}
                type="number"
                step="any"
                label="Actual value"
                required
                error={errors.value?.message}
              />
              <Input
                {...register("target", { valueAsNumber: true })}
                type="number"
                step="any"
                label="Target for period"
                error={errors.target?.message}
              />
            </div>

            <fieldset className="border border-neutral-300 rounded-md p-3">
              <legend className="text-caption font-semibold text-neutral-600 px-1">
                Disaggregation (optional)
              </legend>
              <div className="grid sm:grid-cols-2 gap-3">
                {DISAGG_OPTIONS.map((d) => (
                  <Input
                    key={d}
                    type="number"
                    label={d}
                    value={disagg[d] ?? ""}
                    onChange={(e) =>
                      setDisagg((s) => ({ ...s, [d]: e.target.value }))
                    }
                    inputMode="numeric"
                  />
                ))}
              </div>
            </fieldset>

            <Input
              {...register("dataSource")}
              label="Data source"
              placeholder="e.g. Field verification + supplier records"
            />

            <Textarea {...register("notes")} label="Notes" rows={2} />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/results")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={recordMutation.isPending}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save value
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Achievement" />
            <div className="space-y-3">
              <Progress
                value={achievement ?? 0}
                tone={
                  status === "ON_TRACK"
                    ? "success"
                    : status === "AT_RISK"
                      ? "warning"
                      : "danger"
                }
              />
              <div className="text-body-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Baseline</span>
                  <span className="font-semibold">
                    {indicator.baseline ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Target</span>
                  <span className="font-semibold">{target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Actual</span>
                  <span className="font-semibold">{value}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 mt-2">
                  <span className="text-neutral-600">Achievement</span>
                  <span className="font-bold">
                    {achievement != null ? `${achievement.toFixed(1)}%` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="History" />
            {!values || values.length === 0 ? (
              <p className="text-caption text-neutral-600">
                No values recorded yet.
              </p>
            ) : (
              <ul className="text-caption space-y-2 max-h-64 overflow-y-auto">
                {values.map((v) => (
                  <li
                    key={v.valueId}
                    className="flex justify-between border-b border-neutral-200 pb-1.5 last:border-0"
                  >
                    <span className="text-neutral-600">{v.period}</span>
                    <span className="font-semibold">
                      {v.value} {indicator.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Definition" />
            <dl className="text-caption space-y-1.5">
              <Row label="Type" value={indicator.indicatorType} />
              <Row label="Direction" value={indicator.direction} />
              <Row
                label="Baseline date"
                value={indicator.baselineDate ?? "—"}
              />
              <Row label="Target date" value={indicator.targetDate ?? "—"} />
              {indicator.method && (
                <Row label="Method" value={indicator.method} />
              )}
            </dl>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-semibold text-neutral-900 text-right truncate">
        {value ?? "—"}
      </dd>
    </div>
  );
}