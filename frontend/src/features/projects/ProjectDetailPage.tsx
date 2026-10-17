import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProject } from "./project.queries";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import { TabOverview } from "./tabs/TabOverview";
import { TabComponents } from "./tabs/TabComponents";
import { TabFinancial } from "./tabs/TabFinancial";
import { TabProcurement } from "./tabs/TabProcurement";
import { TabBeneficiaries } from "./tabs/TabBeneficiaries";
import { TabDocuments } from "./tabs/TabDocuments";
import { TabHistory } from "./tabs/TabHistory";

export default function ProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, isError, refetch } = useProject(projectId);

  if (isLoading) return <LoadingState message="Loading project…" />;

  if (isError || !data) {
    return (
      <EmptyState
        title={t("projects.detail.notFound")}
        description={t("projects.detail.notFoundDescription")}
        action={<ErrorState onRetry={() => refetch()} message="" />}
      />
    );
  }

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <ProjectDetailHeader project={data} />

      <Tabs
        tabs={[
          {
            id: "overview",
            label: t("projects.detail.tabs.overview"),
            content: <TabOverview project={data} />,
          },
          {
            id: "components",
            label: t("projects.detail.tabs.components"),
            content: <TabComponents projectId={data.projectId} />,
          },
          {
            id: "financial",
            label: t("projects.detail.tabs.financial"),
            content: <TabFinancial projectId={data.projectId} />,
          },
          {
            id: "procurement",
            label: t("projects.detail.tabs.procurement"),
            content: <TabProcurement projectId={data.projectId} />,
          },
          {
            id: "beneficiaries",
            label: t("projects.detail.tabs.beneficiaries"),
            content: <TabBeneficiaries projectId={data.projectId} />,
          },
          {
            id: "documents",
            label: t("projects.detail.tabs.documents"),
            content: <TabDocuments projectId={data.projectId} />,
          },
          {
            id: "history",
            label: t("projects.detail.tabs.history"),
            content: <TabHistory projectId={data.projectId} />,
          },
        ]}
      />
    </main>
  );
}