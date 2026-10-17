import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSupplierPayments } from "./supplier.queries";
import { formatMoney } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

export function PaymentStatusPanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierPayments();

  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState title={t("supplier.payments.empty")} />;

  return (
    <Card>
      <CardHeader
        title={t("supplier.payments.title")}
        subtitle={t("supplier.payments.subtitle")}
      />
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-neutral-300 text-left">
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Contract
            </th>
            <th className="py-2 text-right text-caption font-bold uppercase text-neutral-600">
              Amount
            </th>
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Requested
            </th>
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Paid
            </th>
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Reference
            </th>
            <th className="py-2 text-caption font-bold uppercase text-neutral-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.paymentId} className="border-b border-neutral-100">
              <td className="py-2">
                <code className="text-caption">{p.contractNo}</code>
              </td>
              <td className="py-2 text-right font-semibold">
                {formatMoney(p.amount, p.currency)}
              </td>
              <td className="py-2 text-caption">{formatDate(p.requestedAt)}</td>
              <td className="py-2 text-caption">
                {p.paidAt ? formatDate(p.paidAt) : "—"}
              </td>
              <td className="py-2">
                <code className="text-caption">{p.referenceNo ?? "—"}</code>
              </td>
              <td className="py-2">
                <Chip
                  tone={
                    p.status === "PAID"
                      ? "green"
                      : p.status === "APPROVED"
                        ? "blue"
                        : p.status === "REJECTED"
                          ? "red"
                          : "amber"
                  }
                >
                  {p.status}
                </Chip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}