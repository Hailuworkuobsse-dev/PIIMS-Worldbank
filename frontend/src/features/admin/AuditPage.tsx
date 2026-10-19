import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Download } from "lucide-react";
import { useAuditLog } from "./admin.queries";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DateInput } from "@/components/ui/DateInput";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Pagination } from "@/components/ui/Pagination";
import { Drawer } from "@/components/ui/Drawer";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import type { AuditLogEntry } from "./admin.types";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "EXPORT",
  "DOWNLOAD",
];

const ACTION_TONE: Record<string, any> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN: "grey",
  LOGOUT: "grey",
  APPROVE: "teal",
  REJECT: "red",
  EXPORT: "amber",
  DOWNLOAD: "amber",
};

export default function AuditPage() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [filters, setFilters] = useState({
    q: "",
    entity: "",
    action: "",
    from: "",
    to: "",
  });

  const { data, isLoading } = useAuditLog({
    q: filters.q || undefined,
    entity: filters.entity || undefined,
    action: filters.action || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    limit: 50,
  });

  const columns: Column<AuditLogEntry & { id: string }>[] = [
    {
      id: "createdAt",
      header: "Timestamp",
      render: (r) => (
        <span className="text-caption whitespace-nowrap">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      id: "userName",
      header: "User",
      render: (r) => (
        <span className="text-body-sm font-semibold">{r.userName ?? "—"}</span>
      ),
    },
    {
      id: "action",
      header: "Action",
      render: (r) => (
        <Chip tone={ACTION_TONE[r.action] ?? "grey"}>{r.action}</Chip>
      ),
    },
    {
      id: "entity",
      header: "Entity",
      render: (r) => <code className="text-caption">{r.entity}</code>,
    },
    {
      id: "entityId",
      header: "Record",
      render: (r) => (
        <code className="text-caption">{r.entityId?.slice(0, 8) ?? "—"}</code>
      ),
    },
    {
      id: "ipAddress",
      header: "IP",
      render: (r) => (
        <span className="text-caption font-mono">{r.ipAddress ?? "—"}</span>
      ),
    },
  ];

  const exportCsv = () => {
    const rows = data?.data ?? [];
    const csv = ["Timestamp,User,Action,Entity,Record,IP"]
      .concat(
        rows.map(
          (r) =>
            `${r.createdAt},${r.userName ?? ""},${r.action},${r.entity},${r.entityId ?? ""},${r.ipAddress ?? ""}`,
        ),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("admin.audit.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0} {t("admin.audit.entries")}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={exportCsv}
        >
          {t("admin.audit.export")}
        </Button>
      </header>

      <section className="bg-white border border-neutral-300 rounded-md p-4">
        <div className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Input
              label="Search"
              placeholder="Search by user, entity, record ID…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Input
            label="Entity"
            value={filters.entity}
            onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
            placeholder="PROJECT, BUDGET, USER…"
          />
          <Select
            label="Action"
            placeholder="All actions"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            options={ACTIONS.map((a) => ({ value: a, label: a }))}
          />
          <div className="flex gap-2">
            <DateInput
              label="From"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
            <DateInput
              label="To"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
        </div>
      </section>

      {isLoading && <SkeletonTable rows={10} cols={columns.length} />}
      {!isLoading && !data?.data.length && (
        <EmptyState
          title="No audit entries"
          description="Adjust filters to see other entries."
        />
      )}
      {!isLoading && !!data?.data.length && (
        <>
          <DataGrid
            columns={columns}
            rows={data.data.map((r) => ({ ...r, id: String(r.logId) }))}
            onRowClick={setSelected}
            ariaLabel={t("admin.audit.title")}
          />
          <Pagination
            page={1}
            pageSize={50}
            total={data.pagination?.totalCount ?? 0}
            onPageChange={() => {}}
          />
        </>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Audit detail"
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Summary" />
              <dl className="text-body-sm space-y-2">
                <Row
                  label="Timestamp"
                  value={new Date(selected.createdAt).toLocaleString()}
                />
                <Row label="User" value={selected.userName ?? "—"} />
                <Row label="Action" value={selected.action} />
                <Row label="Entity" value={selected.entity} />
                <Row label="Entity ID" value={selected.entityId ?? "—"} />
                <Row label="IP address" value={selected.ipAddress ?? "—"} />
                <Row label="User agent" value={selected.userAgent ?? "—"} />
                <Row
                  label="Record hash"
                  value={selected.recordHash.slice(0, 16) + "…"}
                />
              </dl>
            </Card>

            {selected.oldValue && (
              <Card>
                <CardHeader title="Before" />
                <pre className="text-caption bg-neutral-100 rounded p-3 overflow-x-auto">
                  {JSON.stringify(selected.oldValue, null, 2)}
                </pre>
              </Card>
            )}

            {selected.newValue && (
              <Card>
                <CardHeader title="After" />
                <pre className="text-caption bg-neutral-100 rounded p-3 overflow-x-auto">
                  {JSON.stringify(selected.newValue, null, 2)}
                </pre>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="font-semibold text-neutral-900 text-right truncate">
        {value}
      </dd>
    </div>
  );
}