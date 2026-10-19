import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DateInput } from "@/components/ui/DateInput";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  noObjectionSchema,
  type NoObjectionFormData,
} from "./inception.schema";
import { useNoObjection } from "./inception.mutations";

export function NoObjectionModal({
  open,
  onClose,
  reportId,
}: {
  open: boolean;
  onClose: () => void;
  reportId: string;
}) {
  const noObj = useNoObjection(reportId);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NoObjectionFormData>({
    resolver: zodResolver(noObjectionSchema),
    defaultValues: {
      effectiveDate: new Date().toISOString().slice(0, 10),
      comments: "",
    },
  });

  const onSubmit = async (v: NoObjectionFormData) => {
    await noObj.mutateAsync({
      noObjection: true,
      effectiveDate: v.effectiveDate,
      comments: v.comments,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record no-objection"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={noObj.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            Record no-objection
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DateInput
          {...register("effectiveDate")}
          label="Effective date"
          required
          error={errors.effectiveDate?.message}
        />
        <Textarea
          {...register("comments")}
          label="Comments (optional)"
          rows={3}
        />
        <Checkbox
          {...register("noObjection")}
          label="I confirm the World Bank grants no-objection to this inception report."
          error={errors.noObjection?.message}
        />
      </form>
    </Modal>
  );
}