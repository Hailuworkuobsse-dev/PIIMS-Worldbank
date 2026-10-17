import { useState } from "react";
import { MapPin, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { geoApi } from "./geo.api";
import { useToast } from "@/components/ui/Toast";

export function GeoVerifyPanel({
  entityType,
  entityId,
  claimed,
}: {
  entityType: "BENEFICIARY" | "SERVICE_DELIVERY";
  entityId: string;
  claimed: { lat: number; lon: number };
}) {
  const { t } = useTranslation();
  const { push } = useToast();
  const [tolerance, setTolerance] = useState(500);
  const [result, setResult] = useState<{
    match: boolean;
    distanceMeters: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    setLoading(true);
    try {
      const r = await geoApi.verify({
        entityType,
        entityId,
        claimedLocation: claimed,
        toleranceMeters: tolerance,
      });
      setResult(r);
      push(
        r.match ? "success" : "warning",
        r.match ? "Location verified" : "Location outside tolerance",
      );
    } catch {
      push("error", "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t("geo.verify.title")}
        subtitle={t("geo.verify.subtitle")}
      />
      <div className="space-y-3">
        <Input
          label={t("geo.verify.tolerance")}
          type="number"
          value={tolerance}
          onChange={(e) => setTolerance(Number(e.target.value))}
          hint="Meters"
        />
        <Button
          variant="primary"
          leftIcon={<MapPin className="h-4 w-4" />}
          loading={loading}
          onClick={verify}
        >
          {t("geo.verify.run")}
        </Button>

        {result && (
          <div
            role="status"
            className={`flex items-center gap-2 text-body-sm font-semibold ${result.match ? "text-green-700" : "text-red-700"}`}
          >
            {result.match ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden />
            )}
            {result.match
              ? t("geo.verify.match", {
                  distance: result.distanceMeters.toFixed(0),
                })
              : t("geo.verify.mismatch", {
                  distance: result.distanceMeters.toFixed(0),
                })}
          </div>
        )}
      </div>
    </Card>
  );
}