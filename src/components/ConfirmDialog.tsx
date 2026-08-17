import type { ReactNode } from "react";
import { Modal } from "./Modal";

/**
 * Dialog konfirmasi generik (Mulai/Jeda/Lanjutkan/Selesaikan Pekerjaan).
 * Dapat menampung konten tambahan (misal ringkasan target saat menyelesaikan).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  danger = false,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /** Gaya tombol konfirmasi; dipakai untuk aksi yang bersifat final/destruktif. */
  danger?: boolean;
  children?: ReactNode;
}) {
  if (!open) return null;

  return (
    <Modal open onClose={onClose} title={title}>
      <p className="modal-text">{description}</p>
      {children}
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Batal
        </button>
        <button
          type="button"
          className={danger ? "btn btn-danger" : "btn btn-primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
