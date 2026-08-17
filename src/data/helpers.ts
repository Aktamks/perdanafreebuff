import type { Client, Job, Team } from "../types";

/**
 * Cari klien di dalam collection klien AKTIF (state CRUD), bukan seed.
 * Pass collection dari ClientsContext agar klien baru hasil CRUD ikut terbaca.
 */
export function getClientById(
  clients: Client[],
  id: string | null | undefined,
): Client | undefined {
  return clients.find((client) => client.id === id);
}

/**
 * Cari tim di dalam collection tim AKTIF (state CRUD), bukan seed.
 * Pass collection dari TeamsContext agar tim baru hasil CRUD ikut terbaca.
 */
export function getTeamById(
  teams: Team[],
  id: string | null | undefined,
): Team | undefined {
  return teams.find((team) => team.id === id);
}

/**
 * Cari pekerjaan di dalam collection jobs AKTIF (state CRUD), bukan seed.
 * Pass collection dari JobsContext agar pekerjaan baru hasil CRUD ikut terbaca.
 */
export function getJobById(
  jobs: Job[],
  id: string | null | undefined,
): Job | undefined {
  return jobs.find((job) => job.id === id);
}

/**
 * Progress pekerjaan dihitung dari data aktual: distributed / target * 100,
 * dibatasi minimum 0% dan maksimum 100%. Tidak pernah hard-coded.
 */
export function getJobProgress(
  distributedBrochures: number,
  targetBrochures: number,
): number {
  if (targetBrochures <= 0) return 0;
  const progress = Math.round(
    (distributedBrochures / targetBrochures) * 100,
  );
  return Math.min(100, Math.max(0, progress));
}

/** Pekerjaan milik seorang klien, dicari lewat relasi `Job.clientId`. */
export function getJobsByClientId(
  jobs: Job[],
  clientId: string | null | undefined,
): Job[] {
  if (!clientId) return [];
  return jobs.filter((job) => job.clientId === clientId);
}

/** Pekerjaan milik sebuah tim, dicari lewat relasi `Job.teamId`. */
export function getJobsByTeamId(
  jobs: Job[],
  teamId: string | null | undefined,
): Job[] {
  if (!teamId) return [];
  return jobs.filter((job) => job.teamId === teamId);
}

export interface JobStats {
  /** Jumlah semua pekerjaan. */
  total: number;
  /** Pekerjaan berjalan: scheduled, in_progress, paused. */
  active: number;
  /** Pekerjaan selesai: completed. */
  completed: number;
  /** Total target brosur dari seluruh pekerjaan. */
  targetBrochures: number;
  /** Total brosur tersalurkan dari seluruh pekerjaan. */
  distributedBrochures: number;
  /** Progress keseluruhan (0-100) dihitung dari target vs tersalurkan. */
  progress: number;
}

function buildJobStats(jobs: Job[]): JobStats {
  const active = jobs.filter((job) =>
    ["scheduled", "in_progress", "paused"].includes(job.status),
  ).length;
  const completed = jobs.filter((job) => job.status === "completed").length;
  const targetBrochures = jobs.reduce(
    (sum, job) => sum + job.targetBrochures,
    0,
  );
  const distributedBrochures = jobs.reduce(
    (sum, job) => sum + job.distributedBrochures,
    0,
  );
  const progress =
    targetBrochures > 0
      ? Math.min(100, Math.round((distributedBrochures / targetBrochures) * 100))
      : 0;

  return {
    total: jobs.length,
    active,
    completed,
    targetBrochures,
    distributedBrochures,
    progress,
  };
}

/**
 * Statistik pekerjaan seorang klien, dihitung dari relasi `Job.clientId`.
 * Satu-satunya sumber kebenaran: collection jobs + clientId.
 */
export function getClientJobStats(
  jobs: Job[],
  clientId: string | null | undefined,
): JobStats {
  return buildJobStats(getJobsByClientId(jobs, clientId));
}

/**
 * Statistik pekerjaan sebuah tim, dihitung dari relasi `Job.teamId`.
 * Satu-satunya sumber kebenaran: collection jobs + teamId.
 */
export function getTeamJobStats(
  jobs: Job[],
  teamId: string | null | undefined,
): JobStats {
  return buildJobStats(getJobsByTeamId(jobs, teamId));
}

/**
 * Validasi koordinat untuk marker peta. Tolak null/undefined/NaN dan nilai
 * di luar rentang (lat -90..90, lng -180..180).
 */
export function isValidCoordinate(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean {
  if (latitude == null || longitude == null) return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

/** Ringkasan brosur dari koleksi jobs aktif: total target, total tersalurkan, progress rata-rata. */
export function getJobBrochureSummary(jobs: Job[]): {
  targetBrochures: number;
  distributedBrochures: number;
  progress: number;
} {
  const targetBrochures = jobs.reduce(
    (sum, job) => sum + job.targetBrochures,
    0,
  );
  const distributedBrochures = jobs.reduce(
    (sum, job) => sum + job.distributedBrochures,
    0,
  );
  const progress =
    targetBrochures > 0
      ? Math.min(100, Math.round((distributedBrochures / targetBrochures) * 100))
      : 0;
  return { targetBrochures, distributedBrochures, progress };
}

/**
 * Tanggal referensi mock agar dashboard tidak bergantung pada tanggal perangkat.
 * Selalu gunakan konstanta ini untuk menentukan "hari ini" di environment mock.
 */
export const MOCK_TODAY = "2026-08-18";

/** Cek apakah tanggal ISO jatuh pada MOCK_TODAY (untuk statistik "Tugas Hari Ini"). */
export function isMockToday(iso: string): boolean {
  return iso.slice(0, 10) === MOCK_TODAY;
}
