import type { DistributionMethod, JobStatus, UserRole } from "../types";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
  in_progress: "Berjalan",
  paused: "Ditunda",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const JOB_STATUS_CLASSES: Record<JobStatus, string> = {
  draft: "badge-gray",
  scheduled: "badge-navy",
  in_progress: "badge-blue",
  paused: "badge-yellow",
  completed: "badge-green",
  cancelled: "badge-red",
};

export const METHOD_LABELS: Record<DistributionMethod, string> = {
  hand_to_hand: "Hand to Hand",
  door_to_door: "Door to Door",
  car_to_car: "Car to Car",
  event: "Event",
  mall: "Mal",
  office: "Kantor",
  school: "Sekolah",
  other: "Lainnya",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  field_team: "Tim Lapangan",
  client: "Klien",
};

export const ROLE_CLASSES: Record<UserRole, string> = {
  admin: "badge-red",
  field_team: "badge-blue",
  client: "badge-green",
};
