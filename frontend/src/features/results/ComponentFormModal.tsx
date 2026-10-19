import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { componentSchema, type ComponentInput } from "./results.schema";
import { useCreateComponent } from "./results.mutations";
import type { Component } from "./results.types";

export interface ComponentFormModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  initial?: Component | undefined;
  onSuccess?: () => void;
}

export function ComponentFormModal({
  open,
  onClose,
  projectId,
  initial,
  onSuccess,
}: ComponentFormModalProps) {
  const create = useCreateComponent(projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ComponentInput>({
    resolver: zodResolver(componentSchema),
    defaultValues: initial
      ? {
          code: initial.code,
          name: initial.name,
          nameAm: initial.nameAm ?? "",
          description: initial.description ?? "",
          budget: initial.budget ?? "",
          responsibleOrgId: initial.responsibleOrgId ?? "",
          orderNo: initial.orderNo,
        }
      : {
          code: "",
          name: "",
          nameAm: "",
          description: "",
          budget: "",
          responsibleOrgId: "",
          orderNo: 0,
        },
  });

  const onSubmit = async (v: ComponentInput) => {
    await create.mutateAsync(v);
    reset();
    onSuccess?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit component" : "Add component"}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={create.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {initial ? "Save changes" : "Add component"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          {...register("code")}
          label="Code"
          required
          error={errors.code?.message}
        />
        <Input
          {...register("name")}
          label="Name"
          required
          error={errors.name?.message}
        />
        <Input {...register("nameAm")} label="Name (Amharic)" />
        <Textarea {...register("description")} label="Description" rows={3} />
        <Input
          {...register("budget")}
          label="Budget"
          inputMode="decimal"
          error={errors.budget?.message}
        />
        <input
          type="hidden"
          {...register("orderNo", { valueAsNumber: true })}
        />
      </form>
    </Modal>
  );
}