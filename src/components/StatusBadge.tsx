import { JOB_STATUS_CLASSES, JOB_STATUS_LABELS } from "../utils/labels";
import type { EntityStatus, JobStatus } from "../types";

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`badge ${JOB_STATUS_CLASSES[status]}`}>
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

export function EntityStatusBadge({ status }: { status: EntityStatus }) {
  return (
    <span className={`badge ${status === "active" ? "badge-green" : "badge-gray"}`}>
      {status === "active" ? "Aktif" : "Nonaktif"}
    </span>
  );
}
