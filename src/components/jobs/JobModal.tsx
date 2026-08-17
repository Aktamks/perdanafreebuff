import { Modal } from "../Modal";
import { JobForm } from "./JobForm";
import type { Job, JobInput } from "../../types";

export function JobModal({
  open,
  job,
  onClose,
  onSave,
}: {
  open: boolean;
  job: Job | null;
  onClose: () => void;
  onSave: (values: JobInput) => void;
}) {
  const isEdit = job !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Pekerjaan" : "Buat Pekerjaan"}
    >
      <JobForm
        initial={job}
        submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Pekerjaan"}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </Modal>
  );
}
