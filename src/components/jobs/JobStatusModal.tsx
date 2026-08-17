import { useState } from "react";
import { Modal } from "../Modal";
import { StatusBadge } from "../StatusBadge";
import { JOB_STATUS_LABELS } from "../../utils/labels";
import type { Job, JobStatus } from "../../types";

/** Transisi status yang masuk akal; completed/cancelled tidak bisa kembali aktif. */
export const JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["paused", "completed", "cancelled"],
  paused: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

const STATUS_ACTION: Record<JobStatus, { text: string; confirm: string }> = {
  draft: { text: "", confirm: "" },
  scheduled: {
    text: "Jadwalkan pekerjaan ini?",
    confirm: "Pekerjaan akan berstatus terjadwal.",
  },
  in_progress: {
    text: "Mulai pekerjaan ini?",
    confirm: "Tim lapangan akan mulai mengerjakan pekerjaan ini.",
  },
  paused: {
    text: "Jeda pekerjaan ini?",
    confirm: "Pekerjaan akan dijeda sementara.",
  },
  completed: {
    text: "Tandai pekerjaan sebagai selesai?",
    confirm:
      "Setelah selesai, pekerjaan tidak dapat dikembalikan ke status aktif.",
  },
  cancelled: {
    text: "Batalkan pekerjaan ini?",
    confirm:
      "Pekerjaan yang dibatalkan tidak dapat dikembalikan ke status aktif.",
  },
};

export function JobStatusModal({
  job,
  onClose,
  onConfirm,
}: {
  job: Job | null;
  onClose: () => void;
  onConfirm: (status: JobStatus) => void;
}) {
  const [nextStatus, setNextStatus] = useState<JobStatus | null>(null);

  if (!job) return null;

  const options = JOB_TRANSITIONS[job.status];
  const selected: JobStatus = nextStatus ?? options[0];
  const action = STATUS_ACTION[selected];

  return (
    <Modal open onClose={onClose} title="Ubah Status Pekerjaan">
      <div className="job-status-modal-job">
        <strong>{job.title}</strong>
        <StatusBadge status={job.status} />
      </div>

      {options.length === 0 ? (
        <p className="modal-text">
          Pekerjaan dengan status "{JOB_STATUS_LABELS[job.status]}" tidak dapat
          diubah lagi.
        </p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="job-next-status">Status Baru</label>
            <select
              id="job-next-status"
              className="select-field"
              value={selected}
              onChange={(e) => setNextStatus(e.target.value as JobStatus)}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {JOB_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <p className="modal-text">
            <strong>{action.text}</strong> {action.confirm}
          </p>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button
              type="button"
              className={selected === "cancelled" ? "btn btn-danger" : "btn btn-primary"}
              onClick={() => onConfirm(selected)}
            >
              {selected === "cancelled"
                ? "Batalkan"
                : selected === "completed"
                  ? "Tandai Selesai"
                  : selected === "paused"
                    ? "Jeda"
                    : selected === "in_progress"
                      ? "Mulai"
                      : "Jadwalkan"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
