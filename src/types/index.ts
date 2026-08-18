export type UserRole = "admin" | "field_team" | "client";

export type EntityStatus = "active" | "inactive";

export type JobStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export type DistributionMethod =
  | "hand_to_hand"
  | "door_to_door"
  | "car_to_car"
  | "event"
  | "mall"
  | "office"
  | "school"
  | "other";

export type ActivityType = "status" | "progress" | "evidence" | "note" | "report";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Placeholder warna untuk avatar inisial (tahap mock, belum ada upload foto). */
  avatar: string;
  status: EntityStatus;
  createdAt: string;
  /** Relasi opsional: userId dari role field_team. */
  teamId?: string;
  /** Relasi opsional: userId dari role client. */
  clientId?: string;
}

export interface Client {
  id: string;
  /** Nama kontak / penanggung jawab. */
  name: string;
  /** Nama perusahaan / instansi. */
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  status: EntityStatus;
  /**
   * LEGACY/DERIVED — dipertahankan hanya untuk kompatibilitas data lama.
   * JANGAN dipakai sebagai sumber statistik; hitung dari relasi `Job.clientId`.
   */
  totalJobs: number;
  createdAt: string;
}

/** Input form klien (tanpa id, totalJobs, dan createdAt yang diatur sistem). */
export type ClientInput = Omit<Client, "id" | "totalJobs" | "createdAt">;

export interface Team {
  id: string;
  name: string;
  leaderName: string;
  phone: string;
  whatsapp: string;
  /** Jumlah anggota tim. */
  members: number;
  city: string;
  /** Koordinat statis/mock untuk Peta Monitoring (Tahap 3B) — belum ada GPS/live tracking. */
  latitude: number;
  longitude: number;
  status: EntityStatus;
  /** Pekerjaan aktif tim; dikelola modul Pekerjaan, tidak lewat form tim. */
  currentJobId: string | null;
  lastActiveAt: string;
  createdAt: string;
}

/**
 * Input form tim (tanpa id, latitude/longitude, currentJobId, lastActiveAt,
 * dan createdAt yang diatur sistem). Koordinat diturunkan dari kota terpilih.
 */
export type TeamInput = Omit<
  Team,
  "id" | "latitude" | "longitude" | "currentJobId" | "lastActiveAt" | "createdAt"
>;

export interface Job {
  id: string;
  title: string;
  clientId: string;
  teamId: string;
  description: string;
  distributionMethod: DistributionMethod;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  targetBrochures: number;
  distributedBrochures: number;
  progress: number;
  startDate: string;
  endDate: string;
  status: JobStatus;
  /** Waktu Field Team menekan "Mulai Pekerjaan" (scheduled → in_progress). Null jika belum pernah dimulai. */
  startedAt: string | null;
  /** Waktu pekerjaan diselesaikan (→ completed). Null jika belum selesai. */
  completedAt: string | null;
  /** Catatan operasional dari Field Team (Tahap 2F), terpisah dari description (catatan administrasi). */
  operationalNotes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input form pekerjaan. Field `location`/`scheduledDate`/`notes` dari spec
 * dipetakan ke field existing Job: `address`/`startDate`/`description`.
 * `status`, `distributedBrochures`, `progress`, `latitude`/`longitude`,
 * `endDate`, `id`, `createdAt`, `updatedAt` diatur sistem oleh JobsContext.
 */
export type JobInput = {
  title: string;
  clientId: string;
  teamId: string;
  address: string;
  city: string;
  startDate: string;
  distributionMethod: DistributionMethod;
  targetBrochures: number;
  description: string;
};

export interface Activity {
  id: string;
  jobId: string;
  userId: string;
  type: ActivityType;
  message: string;
  createdAt: string;
}
