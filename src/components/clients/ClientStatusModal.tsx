import { Modal } from "../Modal";
import type { Client } from "../../types";

export function ClientStatusModal({
  client,
  onClose,
  onConfirm,
}: {
  client: Client | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!client) return null;

  const activating = client.status === "inactive";

  return (
    <Modal
      open
      onClose={onClose}
      title={activating ? "Aktifkan klien ini?" : "Nonaktifkan klien ini?"}
    >
      <p className="modal-text">
        {activating
          ? "Klien ini akan kembali tersedia untuk pekerjaan baru."
          : "Klien yang dinonaktifkan tidak dapat digunakan untuk pekerjaan baru."}
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
