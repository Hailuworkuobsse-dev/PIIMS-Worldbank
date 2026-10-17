import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, History, RotateCcw } from "lucide-react";
import { useDocumentVersions } from "./document.queries";
import { useRestoreVersion } from "./document.mutations";
import { documentApi } from "./document.api";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils/date";
import { useToast } from "@/components/ui/Toast";
import type { DocumentMeta } from "./document.types";

export function DocumentPreviewPanel({ document }: { document: DocumentMeta }) {
  const { t } = useTranslation();
  const { push } = useToast();
  const { data: versions } = useDocumentVersions(document.docId);
  const restore = useRestoreVersion(document.docId);

  const download = async () => {
    try {
      const { url } = await documentApi.signedUrl(document.docId);
      window.open(url, "_blank", "noopener");
    } catch {
      push("error", "Download link failed");
    }
  };

  const isImage = document.mimeType.startsWith("image/");
  const isPdf = document.mimeType === "application/pdf";

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Chip tone="blue">{document.docType}</Chip>
          <Chip tone="grey">v{document.version}</Chip>
          <Chip
            tone={
              document.accessLevel === "RESTRICTED"
                ? "red"
                : document.accessLevel === "PUBLIC"
                  ? "green"
                  : "grey"
            }
          >
            {document.accessLevel}
          </Chip>
        </div>
        {document.description && (
          <p className="text-body-sm text-neutral-600">
            {document.description}
          </p>
        )}
      </div>

      <div className="rounded-md border border-neutral-300 bg-neutral-50 p-4">
        {isPdf ? (
          <iframe
            title={document.title}
            src={document.filePath}
            className="w-full h-[420px] rounded-md border border-neutral-200 bg-white"
          />
        ) : isImage ? (
          <img
            src={document.filePath}
            alt={document.title}
            className="max-h-[420px] mx-auto rounded-md"
          />
        ) : (
          <p className="text-center text-body-sm text-neutral-600 py-12">
            {t("documents.preview.unsupported")}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={download}
        >
          {t("documents.preview.download")}
        </Button>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <History className="h-4 w-4" aria-hidden />
              {t("documents.versions.title")}
            </span>
          }
        />
        <ul className="divide-y divide-neutral-200">
          {(versions ?? []).map((v) => (
            <li
              key={v.versionId}
              className="py-2 flex items-center justify-between gap-3"
            >
              <div className="text-body-sm">
                <div className="font-semibold">v{v.version}</div>
                <div className="text-caption text-neutral-600">
                  {v.uploadedByName} · {formatDate(v.uploadedAt)}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                loading={restore.isPending}
                onClick={() => restore.mutate(v.versionId)}
                disabled={v.version === document.version}
              >
                {t("documents.versions.restore")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}