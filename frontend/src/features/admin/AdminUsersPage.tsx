import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, KeyRound, Power, UserCheck } from "lucide-react";
import { useAdminUsers } from "./admin.queries";
import { usePermissions } from "@/features/auth/usePermissions";
import { PERMISSIONS } from "@/features/auth/auth.types";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Drawer } from "@/components/ui/Drawer";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { UserFormModal } from "./UserFormModal";
import {
  useResetPassword,
  useDeactivateUser,
  useReactivateUser,
} from "./admin.mutations";
import { formatDate } from "@/lib/utils/date";
import type { AdminUser, UserStatus } from "./admin.types";

const STATUS_TONE: Record<UserStatus, any> = {
  ACTIVE: "green",
  INACTIVE: "grey",
  LOCKED: "amber",
  SUSPENDED: "red",
};

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [detail, setDetail] = useState<AdminUser | null>(null);

  const q = params.get("q") ?? "";
  const status = (params.get("status")?.split(",").filter(Boolean) ??
    []) as UserStatus[];
  const pageSize = Math.min(200, Math.max(1, Number(params.get("size") ?? 25)));
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const { data, isLoading, isError, refetch } = useAdminUsers({
    q: q || undefined,
    status: status.length ? status : undefined,
    limit: pageSize,
  });

  const resetPw = useResetPassword();
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const columns: Column<AdminUser & { id: string }>[] = useMemo(
    () => [
      {
        id: "username",
        header: "Username",
        render: (r) => (
          <code className="text-caption font-bold text-primary-700">
            {r.username}
          </code>
        ),
      },
      {
        id: "fullName",
        header: "Name",
        render: (r) => (
          <div className="min-w-0">
            <div className="text-body-sm font-semibold truncate">
              {r.fullName}
            </div>
            <div className="text-caption text-neutral-600 truncate">
              {r.email}
            </div>
          </div>
        ),
      },
      {
        id: "orgName",
        header: "Organization",
        render: (r) => <span className="text-caption">{r.orgName}</span>,
      },
      {
        id: "roleName",
        header: "Role",
        render: (r) => <Chip tone="blue">{r.role}</Chip>,
      },
      {
        id: "mfaEnabled",
        header: "MFA",
        align: "center",
        render: (r) =>
          r.mfaEnabled ? (
            <Chip tone="green">On</Chip>
          ) : (
            <Chip tone="grey">Off</Chip>
          ),
      },
      {
        id: "status",
        header: "Status",
        render: (r) => <Chip tone={STATUS_TONE[r.status]}>{r.status}</Chip>,
      },
      {
        id: "lastLoginAt",
        header: "Last login",
        render: (r) => (
          <span className="text-caption">
            {r.lastLoginAt ? formatDate(r.lastLoginAt) : "—"}
          </span>
        ),
      },
    ],
    [],
  );

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in patch)) next.set("page", "1");
    setParams(next, { replace: true });
  };

  const onResetPassword = async (userId: string) => {
    if (
      !confirm(
        "Reset this user's password? They will receive a temporary password.",
      )
    )
      return;
    await resetPw.mutateAsync(userId);
  };

  const onDeactivate = async (userId: string) => {
    const reason = prompt("Reason for deactivation?");
    if (!reason) return;
    await deactivate.mutateAsync({ userId, reason });
    setDetail(null);
  };

  const onReactivate = async (userId: string) => {
    await reactivate.mutateAsync(userId);
    push("success", "User reactivated");
    setDetail(null);
  };

  return (
    <main id="main" tabIndex={-1} className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h1 text-primary-900">{t("admin.users.title")}</h1>
          <p className="text-body-sm text-neutral-600 mt-1">
            {data?.pagination?.totalCount ?? 0} {t("admin.users.total")}
          </p>
        </div>
        {can(PERMISSIONS.adminUsers) && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {t("admin.users.new")}
          </Button>
        )}
      </header>

      <section className="bg-white border border-neutral-300 rounded-md p-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[240px]">
            <Input
              label="Search"
              placeholder="Search by name, username, or email"
              value={q}
              onChange={(e) => updateParams({ q: e.target.value || undefined })}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(
              ["ACTIVE", "INACTIVE", "LOCKED", "SUSPENDED"] as UserStatus[]
            ).map((s) => {
              const active = status.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const next = status.includes(s)
                      ? status.filter((x) => x !== s)
                      : [...status, s];
                    updateParams({
                      status: next.length ? next.join(",") : undefined,
                    });
                  }}
                  aria-pressed={active}
                >
                  <Chip tone={active ? STATUS_TONE[s] : "grey"}>{s}</Chip>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {isLoading && <SkeletonTable rows={8} cols={columns.length} />}
      {isError && !isLoading && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && !data?.data.length && (
        <EmptyState
          title={t("admin.users.empty")}
          description="Create the first user to begin."
        />
      )}
      {!isLoading && !isError && !!data?.data.length && (
        <>
          <DataGrid
            columns={columns}
            rows={data.data.map((u) => ({ ...u, id: u.userId }))}
            onRowClick={setDetail}
            ariaLabel={t("admin.users.title")}
          />
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.pagination?.totalCount ?? 0}
            onPageChange={(p) => updateParams({ page: String(p) })}
            onPageSizeChange={(s) =>
              updateParams({ size: String(s), page: "1" })
            }
          />
        </>
      )}

      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        user={editing ?? undefined}
      />

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.fullName ?? ""}
        width="max-w-md"
      >
        {detail && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Details" />
              <dl className="text-body-sm space-y-2">
                <Row label="Username" value={detail.username} />
                <Row label="Email" value={detail.email} />
                <Row label="Organization" value={detail.orgName} />
                <Row label="Role" value={detail.roleName} />
                <Row label="Status" value={detail.status} />
                <Row
                  label="MFA"
                  value={detail.mfaEnabled ? "Enabled" : "Disabled"}
                />
                <Row
                  label="Last login"
                  value={
                    detail.lastLoginAt ? formatDate(detail.lastLoginAt) : "—"
                  }
                />
                <Row label="Created" value={formatDate(detail.createdAt)} />
              </dl>
            </Card>

            {can(PERMISSIONS.adminUsers) && (
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  fullWidth
                  leftIcon={<KeyRound className="h-4 w-4" />}
                  loading={resetPw.isPending}
                  onClick={() => onResetPassword(detail.userId)}
                >
                  Reset password
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setEditing(detail);
                    setFormOpen(true);
                    setDetail(null);
                  }}
                >
                  Edit user
                </Button>
                {detail.status === "ACTIVE" ? (
                  <Button
                    variant="danger"
                    fullWidth
                    leftIcon={<Power className="h-4 w-4" />}
                    loading={deactivate.isPending}
                    onClick={() => onDeactivate(detail.userId)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={<UserCheck className="h-4 w-4" />}
                    loading={reactivate.isPending}
                    onClick={() => onReactivate(detail.userId)}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
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
        {value || "—"}
      </dd>
    </div>
  );
}