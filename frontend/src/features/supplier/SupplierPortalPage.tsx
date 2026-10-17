import { useTranslation } from "react-i18next";
import { Tabs } from "@/components/ui/Tabs";
import { SupplierDashboard } from "./SupplierDashboard";
import { SupplierContracts } from "./SupplierContracts";
import { DeliverySubmissionPage } from "./DeliverySubmissionPage";
import { InvoiceUploadModal } from "./InvoiceUploadModal";
import { WarrantyRegister } from "./WarrantyRegister";
import { PaymentStatusPanel } from "./PaymentStatusPanel";
import { SupplierProfileForm } from "./SupplierProfileForm";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { Plus } from "lucide-react";

export default function SupplierPortalPage() {
  const { t } = useTranslation();
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("supplier.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {t("supplier.subtitle")}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setInvoiceOpen(true)}
        >
          {t("supplier.actions.uploadInvoice")}
        </Button>
      </header>

      <SupplierDashboard />

      <Tabs
        tabs={[
          {
            id: "contracts",
            label: t("supplier.tabs.contracts"),
            content: <SupplierContracts />,
          },
          {
            id: "deliveries",
            label: t("supplier.tabs.deliveries"),
            content: <DeliverySubmissionPage />,
          },
          {
            id: "warranties",
            label: t("supplier.tabs.warranties"),
            content: <WarrantyRegister />,
          },
          {
            id: "payments",
            label: t("supplier.tabs.payments"),
            content: <PaymentStatusPanel />,
          },
          {
            id: "profile",
            label: t("supplier.tabs.profile"),
            content: (
              <Card>
                <CardHeader
                  title={t("supplier.profile.title")}
                  subtitle={t("supplier.profile.subtitle")}
                />
                <SupplierProfileForm />
              </Card>
            ),
          },
        ]}
      />

      <InvoiceUploadModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />
    </main>
  );
}