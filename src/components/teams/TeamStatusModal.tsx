import { Modal } from "../Modal";
import type { Team } from "../../types";

export function TeamStatusModal({
  team,
  onClose,
  onConfirm,
}: {
  team: Team | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!team) return null;

  const activating = team.status === "inactive";

  return (
    <Modal
      open
      onClose={onClose}
      title={activating ? "Aktifkan tim ini?" : "Nonaktifkan tim ini?"}
    >
      <p className="modal-text">
        {activating
          ? "Tim ini akan kembali tersedia untuk penugasan pekerjaan baru."
          : "Tim yang dinonaktifkan tidak dapat ditugaskan untuk pekerjaan baru."}
      </p>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Batal
        </button>
        <button
          type="button"
          className={activating ? "btn btn-primary" : "btn btn-danger"}
          onClick={onConfirm}
        >
          {activating ? "Aktifkan" : "Nonaktifkan"}
        </button>
      </div>
    </Modal>
  );
}
