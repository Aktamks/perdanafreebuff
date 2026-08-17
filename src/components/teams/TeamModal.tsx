import { Modal } from "../Modal";
import { TeamForm } from "./TeamForm";
import type { Team, TeamInput } from "../../types";

export function TeamModal({
  open,
  team,
  onClose,
  onSave,
}: {
  open: boolean;
  team: Team | null;
  onClose: () => void;
  onSave: (values: TeamInput) => void;
}) {
  const isEdit = team !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Tim" : "Tambah Tim"}
    >
      <TeamForm
        initial={team}
        submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Tim"}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </Modal>
  );
}
