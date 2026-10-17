// TabComponents.tsx
import { useTranslation } from "react-i18next";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function TabComponents({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader
        title={t("projects.detail.tabs.components")}
        subtitle={`Project ${projectId}`}
      />
      <EmptyState
        title="Components arrive in Step 6"
        description="This tab is populated by the Results Framework module."
      />
    </Card>
  );
}