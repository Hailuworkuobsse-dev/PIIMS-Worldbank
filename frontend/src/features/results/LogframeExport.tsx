import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { resultsApi } from "./results.api";
import { useToast } from "@/components/ui/Toast";

export function LogframeExport({ projectId }: { projectId: string }) {
  const { push } = useToast();

  const download = async () => {
    try {
      const blob = await resultsApi.exportLogframe(projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logframe-${projectId}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      push("success", "Logframe exported");
    } catch {
      push("error", "Export failed");
    }
  };

  return (
    <Card>
      <CardHeader
        title="Logframe export"
        subtitle="Excel file with components, subcomponents, indicators, values"
      />
      <div className="flex items-start gap-4">
        <FileSpreadsheet
          className="h-12 w-12 text-green-600 shrink-0"
          aria-hidden
        />
        <div className="flex-1">
          <p className="text-body-sm text-neutral-600">
            The logframe export contains the full results framework in a format
            compatible with World Bank reporting and audit requirements. It
            includes baseline, target, latest actual value, and disaggregation
            for each indicator.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={download}
          >
            Download Excel logframe
          </Button>
        </div>
      </div>
    </Card>
  );
}