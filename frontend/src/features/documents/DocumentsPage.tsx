import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
} from "lucide-react";
import { useDocuments } from "./document.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Drawer } from "@/components/ui/Drawer";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { DocumentPreviewPanel } from "./DocumentPreviewPanel";
import { DOC_TYPES, type DocumentMeta, type DocType } from "./document.types";
import { formatDate } from "@/lib/utils/date";

function fileIcon(mime: string) {
  if (mime.includes("pdf")) return FileText;
  if (mime.includes("sheet") || mime.includes("excel")) return FileSpreadsheet;
  if (mime.includes("image")) return FileImage;
  if (mime.includes("zip")) return FileArchive;
  return FileText;
}

function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { can } = usePermissions();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<DocumentMeta | null>(null);

  const q = params.get("q") ?? "";
  const docType = (params.get("docType")?.split(",").filter(Boolean) ??
    []) as DocType[];
  const projectId = params.get("projectId") ?? undefined;
  const pageSize = Math.min(200, Math.max(1, Number(params.get("size") ?? 25)));

  const { data, isLoading } = useDocuments({
    q: q || undefined,
    docType: docType.length ? docType : undefined,
    projectId,
    limit: pageSize,
  });

  const columns: Column<DocumentMeta & { id: string }>[] = useMemo(
    () => [
      {
        id: "title",
        header: t("documents.columns.title"),
        render: (r) => {
          const Icon = fileIcon(r.mimeType);
          return (
            <div className="flex items-start gap-2 min-w-0">
              <Icon
                className="h-4 w-4 text-primary-700 mt-0.5 shrink-0"
                aria-hidden
              />
              <div className="min-w-0">
                <div className="font-semibold truncate">{r.title}</div>
                {r.projectCode && (
                  <div className="text-caption text-neutral-600">
                    <code>{r.projectCode}</code>
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "docType",
        header: t("documents.columns.type"),
        render: (r) => <Chip tone="blue">{r.docType}</Chip>,
      },
      {
        id: "version",
        header: t("documents.columns.version"),
        align: "center",
        render: (r) => (
          <code className="text-caption font-bold">v{r.version}</code>
        ),
      },
      {
        id: "fileSize",
        header: t("documents.columns.size"),
        align: "right",
        render: (r) => (
          <span className="text-caption">{fileSize(r.fileSize)}</span>
        ),
      },
      {
        id: "uploadedAt",
        header: t("documents.columns.uploaded"),
        render: (r) => (
          <span className="text-caption">{formatDate(r.uploadedAt)}</span>
        ),
      },
      {
        id: "uploadedByName",
        header: t("documents.columns.uploader"),
        render: (r) => <span className="text-caption">{r.uploadedByName}</span>,
      },
      {
        id: "accessLevel",
        header: t("documents.columns.access"),
        render: (r) => (
          <Chip
            tone={
              r.accessLevel === "PUBLIC"
                ? "green"
                : r.accessLevel === "RESTRICTED"
                  ? "red"
                  : "grey"
            }
          >
            {r.accessLevel}
          </Chip>
        ),
      },
    ],
    [t],
  );

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  };

  const toggleType = (dt: DocType) => {
    const next = docType.includes(dt)
      ? docType.filter((x) => x !== dt)
      : [...docType, dt];
    updateParams({ docType: next.length ? next.join(",") : undefined });
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("documents.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0} {t("documents.files")}
          </p>
        </div>
        {can(PERMISSIONS.docWrite) && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setUploadOpen(true)}
          >
            {t("documents.upload")}
          </Button>
        )}
      </header>

      <section className="bg-white border border-neutral-300 rounded-md p-3 flex flex-wrap gap-2 items-center">
        {DOC_TYPES.map((dt) => {
          const active = docType.includes(dt);
          return (
            <button
              key={dt}
              type="button"
              aria-pressed={active}
              onClick={() => toggleType(dt)}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2 rounded-full"
            >
              <Chip tone={active ? "blue" : "grey"}>{dt}</Chip>
            </button>
          );
        })}
        {docType.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateParams({ docType: undefined })}
          >
            {t("documents.clear")}
          </Button>
        )}
      </section>

      {isLoading && <SkeletonTable rows={6} cols={columns.length} />}
      {!isLoading && (data?.data.length ?? 0) === 0 && (
        <EmptyState
          title={t("documents.empty")}
          description={t("documents.emptyHint")}
        />
      )}
      {!isLoading && (data?.data.length ?? 0) > 0 && (
        <>
          <DataGrid
            columns={columns}
            rows={data!.data.map((d) => ({ ...d, id: d.docId }))}
            onRowClick={setSelected}
            ariaLabel={t("documents.title")}
          />
          <Pagination
            page={1}
            pageSize={pageSize}
            total={data!.pagination?.totalCount ?? 0}
            onPageChange={() => {
              /* cursor-based */
            }}
            onPageSizeChange={(s) => updateParams({ size: String(s) })}
          />
        </>
      )}

      <DocumentUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultProjectId={projectId}
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        width="max-w-xl"
      >
        {selected && <DocumentPreviewPanel document={selected} />}
      </Drawer>
    </main>
  );
}