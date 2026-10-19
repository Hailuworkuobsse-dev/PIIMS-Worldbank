import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "./admin.schema";
import { useCreateUser, useUpdateUser } from "./admin.mutations";
import { ROLE_CODES, roleLabel } from "@/features/auth/auth.types";
import type { AdminUser } from "./admin.types";

const ORGS = [
  {
    value: "11111111-1111-4111-8111-111111111111",
    label: "Ministry of Water and Energy",
  },
  {
    value: "22222222-2222-4222-8222-222222222222",
    label: "Ministry of Finance",
  },
  {
    value: "33333333-3333-4333-8333-333333333333",
    label: "Development Bank of Ethiopia",
  },
  { value: "44444444-4444-4444-8444-444444444444", label: "World Bank" },
];

export function UserFormModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user?: AdminUser | undefined;
}) {
  const { t } = useTranslation();
  const create = useCreateUser();
  const update = useUpdateUser();
  const isEdit = !!user;

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      fullNameAm: "",
      phone: "",
      orgId: ORGS[0]!.value,
      role: "MW-PIU",
      mfaEnabled: false,
      sendInvite: true,
    },
  });

  const editForm = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: user
      ? {
          fullName: user.fullName,
          fullNameAm: user.fullNameAm ?? "",
          email: user.email,
          phone: user.phone ?? "",
          orgId: user.orgId,
          role: user.role,
          status: user.status,
          mfaEnabled: user.mfaEnabled,
        }
      : {},
  });

  useEffect(() => {
    if (user) {
      editForm.reset({
        fullName: user.fullName,
        fullNameAm: user.fullNameAm ?? "",
        email: user.email,
        phone: user.phone ?? "",
        orgId: user.orgId,
        role: user.role,
        status: user.status,
        mfaEnabled: user.mfaEnabled,
      });
    } else {
      createForm.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  const onSubmitCreate = async (v: CreateUserFormData) => {
    await create.mutateAsync(v);
    createForm.reset();
    onClose();
  };

  const onSubmitUpdate = async (v: UpdateUserFormData) => {
    if (!user) return;
    await update.mutateAsync({ userId: user.userId, patch: v });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t("admin.users.edit") : t("admin.users.new")}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="primary"
            loading={create.isPending || update.isPending}
            onClick={
              isEdit
                ? editForm.handleSubmit(onSubmitUpdate)
                : createForm.handleSubmit(onSubmitCreate)
            }
          >
            {t("actions.save")}
          </Button>
        </>
      }
    >
      {isEdit ? (
        <form
          onSubmit={editForm.handleSubmit(onSubmitUpdate)}
          className="space-y-4"
          noValidate
        >
          <Input
            {...editForm.register("fullName")}
            label="Full name"
            required
            error={editForm.formState.errors.fullName?.message}
          />
          <Input
            {...editForm.register("fullNameAm")}
            label="Full name (Amharic)"
          />
          <Input
            {...editForm.register("email")}
            type="email"
            label="Email"
            required
            error={editForm.formState.errors.email?.message}
          />
          <Input
            {...editForm.register("phone")}
            label="Phone"
            placeholder="+251911234567"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              {...editForm.register("orgId")}
              label="Organization"
              required
              options={ORGS}
            />
            <Select
              {...editForm.register("role")}
              label="Role"
              required
              options={ROLE_CODES.map((r) => ({
                value: r,
                label: `${r} · ${roleLabel(r)}`,
              }))}
            />
          </div>
          <Select
            {...editForm.register("status")}
            label="Status"
            required
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
              { value: "LOCKED", label: "Locked" },
              { value: "SUSPENDED", label: "Suspended" },
            ]}
          />
          <Checkbox {...editForm.register("mfaEnabled")} label="Require MFA" />
        </form>
      ) : (
        <form
          onSubmit={createForm.handleSubmit(onSubmitCreate)}
          className="space-y-4"
          noValidate
        >
          <Input
            {...createForm.register("username")}
            label="Username"
            required
            error={createForm.formState.errors.username?.message}
          />
          <Input
            {...createForm.register("email")}
            type="email"
            label="Email"
            required
            error={createForm.formState.errors.email?.message}
          />
          <Input
            {...createForm.register("fullName")}
            label="Full name"
            required
            error={createForm.formState.errors.fullName?.message}
          />
          <Input
            {...createForm.register("fullNameAm")}
            label="Full name (Amharic)"
          />
          <Input
            {...createForm.register("phone")}
            label="Phone"
            placeholder="+251911234567"
            error={createForm.formState.errors.phone?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              {...createForm.register("orgId")}
              label="Organization"
              required
              options={ORGS}
            />
            <Select
              {...createForm.register("role")}
              label="Role"
              required
              options={ROLE_CODES.map((r) => ({
                value: r,
                label: `${r} · ${roleLabel(r)}`,
              }))}
            />
          </div>
          <Checkbox
            {...createForm.register("mfaEnabled")}
            label="Require MFA"
          />
          <Checkbox
            {...createForm.register("sendInvite")}
            label="Send invitation email with temporary password"
          />
        </form>
      )}
    </Modal>
  );
}