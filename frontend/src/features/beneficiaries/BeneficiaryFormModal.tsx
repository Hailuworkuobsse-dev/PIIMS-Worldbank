import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { Banner } from "@/components/ui/Banner";
import {
  beneficiaryWithConsentSchema,
  type BeneficiaryWithConsentFormData,
} from "./beneficiary.schema";
import { useCreateBeneficiary } from "./beneficiary.mutations";
import { beneficiaryApi } from "./beneficiary.api";
import { DuplicateWarningModal } from "./DuplicateWarningModal";
import { ETHIOPIAN_REGIONS } from "./beneficiary.utils";
import type { DuplicateCandidate } from "./beneficiary.types";

const CONSENT_VERSION = "v1.2";

export function BeneficiaryFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const create = useCreateBeneficiary();
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[] | null>(
    null,
  );
  const [pendingSubmit, setPendingSubmit] =
    useState<BeneficiaryWithConsentFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BeneficiaryWithConsentFormData>({
    resolver: zodResolver(beneficiaryWithConsentSchema),
    defaultValues: {
      fullName: "",
      fullNameAm: "",
      gender: "FEMALE",
      phone: "",
      nationalId: "",
      householdSize: undefined,
      dateOfBirth: "",
      location: { region: "", zone: "", woreda: "", kebele: "" },
      registrationChannel: "WEB",
      consent: {
        participation: true as any,
        data_use: true as any,
        future_research: false,
        media: false,
        contact: false,
        consent_version: CONSENT_VERSION,
        language: "en",
      },
    },
  });

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = { lat: p.coords.latitude, lon: p.coords.longitude };
        setGps(coords);
        setValue("location.latitude", coords.lat);
        setValue("location.longitude", coords.lon);
        setGpsError(null);
      },
      (e) => setGpsError(e.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const onSubmit = async (v: BeneficiaryWithConsentFormData) => {
    // Pre-check duplicates
    const candidates = await beneficiaryApi.findDuplicates(v);
    const strong = candidates.filter((c) => c.dedupScore >= 0.7);
    if (strong.length > 0) {
      setDuplicates(strong);
      setPendingSubmit(v);
      return;
    }
    await create.mutateAsync(v);
    reset();
    setGps(null);
    onClose();
  };

  const confirmAnyway = async () => {
    if (!pendingSubmit) return;
    await create.mutateAsync(pendingSubmit);
    setDuplicates(null);
    setPendingSubmit(null);
    reset();
    setGps(null);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t("beneficiaries.form.title")}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="primary"
              loading={create.isPending}
              onClick={handleSubmit(onSubmit)}
            >
              {t("beneficiaries.form.register")}
            </Button>
          </>
        }
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Identity */}
          <fieldset className="space-y-4">
            <legend className="text-h3 text-primary-900">
              {t("beneficiaries.form.section.identity")}
            </legend>
            <Input
              {...register("fullName")}
              label={t("beneficiaries.form.fullName")}
              required
              error={errors.fullName?.message}
              autoFocus
            />
            <Input
              {...register("fullNameAm")}
              label={t("beneficiaries.form.fullNameAm")}
            />
            <div className="grid grid-cols-3 gap-4">
              <Select
                {...register("gender")}
                label={t("beneficiaries.form.gender")}
                required
                error={errors.gender?.message}
                options={[
                  { value: "FEMALE", label: t("beneficiaries.gender.female") },
                  { value: "MALE", label: t("beneficiaries.gender.male") },
                  { value: "OTHER", label: t("beneficiaries.gender.other") },
                ]}
              />
              <DateInput
                {...register("dateOfBirth")}
                label={t("beneficiaries.form.dob")}
              />
              <Input
                {...register("householdSize", { valueAsNumber: true })}
                type="number"
                label={t("beneficiaries.form.householdSize")}
                error={errors.householdSize?.message}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                {...register("phone")}
                label={t("beneficiaries.form.phone")}
                placeholder="+251911234567"
                error={errors.phone?.message}
              />
              <Input
                {...register("nationalId")}
                label={t("beneficiaries.form.nationalId")}
              />
            </div>
          </fieldset>

          {/* Location */}
          <fieldset className="space-y-4">
            <legend className="text-h3 text-primary-900">
              {t("beneficiaries.form.section.location")}
            </legend>
            <Select
              {...register("location.region")}
              label={t("beneficiaries.form.region")}
              required
              placeholder="—"
              error={errors.location?.region?.message}
              options={ETHIOPIAN_REGIONS.map((r) => ({ value: r, label: r }))}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                {...register("location.zone")}
                label={t("beneficiaries.form.zone")}
              />
              <Input
                {...register("location.woreda")}
                label={t("beneficiaries.form.woreda")}
              />
              <Input
                {...register("location.kebele")}
                label={t("beneficiaries.form.kebele")}
              />
            </div>
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<MapPin className="h-4 w-4" />}
                onClick={captureGps}
              >
                {gps
                  ? t("beneficiaries.form.recapture")
                  : t("beneficiaries.form.captureGps")}
              </Button>
              {gps && (
                <span className="ml-3 text-caption text-green-700 font-semibold">
                  ✓ {gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}
                </span>
              )}
              {gpsError && (
                <p role="alert" className="text-caption text-danger mt-1">
                  {gpsError}
                </p>
              )}
            </div>
          </fieldset>

          {/* Consent */}
          <fieldset className="space-y-3 border border-neutral-300 rounded-md p-4 bg-neutral-50">
            <legend className="text-h3 text-primary-900 px-2">
              {t("beneficiaries.form.section.consent")}
            </legend>
            <Banner tone="info">{t("beneficiaries.form.consentInfo")}</Banner>
            <Checkbox
              {...register("consent.participation")}
              label={t("beneficiaries.form.consent.participation")}
              error={errors.consent?.participation?.message}
            />
            <Checkbox
              {...register("consent.data_use")}
              label={t("beneficiaries.form.consent.dataUse")}
              error={errors.consent?.data_use?.message}
            />
            <Checkbox
              {...register("consent.future_research")}
              label={t("beneficiaries.form.consent.futureResearch")}
            />
            <Checkbox
              {...register("consent.media")}
              label={t("beneficiaries.form.consent.media")}
            />
            <Checkbox
              {...register("consent.contact")}
              label={t("beneficiaries.form.consent.contact")}
            />
          </fieldset>
        </form>
      </Modal>

      <DuplicateWarningModal
        open={!!duplicates}
        candidates={duplicates ?? []}
        onCancel={() => {
          setDuplicates(null);
          setPendingSubmit(null);
        }}
        onMerge={() => alert("Merge flow — coming in a follow-up")}
        onProceed={confirmAnyway}
        loading={create.isPending}
      />
    </>
  );
}