import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useVerifyBeneficiary } from "./beneficiary.mutations";
import type { Beneficiary } from "./beneficiary.types";

export function VerificationPanel({
  beneficiary,
}: {
  beneficiary: Beneficiary;
}) {
  const { t } = useTranslation();
  const verify = useVerifyBeneficiary();
  const [notes, setNotes] = useState("");

  const isVerified = beneficiary.status === "VERIFIED";

  return (
    <Card>
      <CardHeader
        title={t("beneficiaries.verify.title")}
        subtitle={t("beneficiaries.verify.subtitle")}
      />
      <div className="space-y-3">
        <Textarea
          label={t("beneficiaries.verify.notes")}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("beneficiaries.verify.notesPlaceholder")}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            leftIcon={<CheckCircle2 className="h-4 w-4" />}
            disabled={isVerified}
            loading={verify.isPending}
            onClick={() =>
              verify.mutate({
                id: beneficiary.beneficiaryId,
                verified: true,
                notes,
              })
            }
          >
            {isVerified
              ? t("beneficiaries.verify.verified")
              : t("beneficiaries.verify.verify")}
          </Button>
          <Button
            variant="danger"
            leftIcon={<XCircle className="h-4 w-4" />}
            disabled={beneficiary.status === "INACTIVE"}
            loading={verify.isPending}
            onClick={() =>
              verify.mutate({
                id: beneficiary.beneficiaryId,
                verified: false,
                notes,
              })
            }
          >
            {t("beneficiaries.verify.reject")}
          </Button>
        </div>
        {isVerified && beneficiary.verifiedByName && (
          <p className="text-caption text-green-700 font-semibold">
            ✓{" "}
            {t("beneficiaries.verify.verifiedBy", {
              name: beneficiary.verifiedByName,
              date: beneficiary.verifiedAt
                ? beneficiary.verifiedAt.slice(0, 10)
                : "",
            })}
          </p>
        )}
      </div>
    </Card>
  );
}