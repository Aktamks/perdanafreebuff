import { Modal } from "../Modal";
import { ClientForm } from "./ClientForm";
import type { Client, ClientInput } from "../../types";

export function ClientModal({
  open,
  client,
  onClose,
  onSave,
}: {
  open: boolean;
  client: Client | null;
  onClose: () => void;
  onSave: (values: ClientInput) => void;
}) {
  const isEdit = client !== null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Klien" : "Tambah Klien"}
    >
      <ClientForm
        initial={client}
        submitLabel={isEdit ? "Simpan Perubahan" : "Simpan Klien"}
        onSubmit={onSave}
        onCancel={onClose}
      />
    </Modal>
  );
}
