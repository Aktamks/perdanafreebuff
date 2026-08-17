import { jobs, teams } from "./mockData";
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

export function getTeamById(id: string | null | undefined): Team | undefined {
  return teams.find((team) => team.id === id);
}

export function getJobById(id: string | null | undefined): Job | undefined {
  return jobs.find((job) => job.id === id);
}

/** Pekerjaan milik seorang klien, dicari lewat relasi `Job.clientId`. */
export function getJobsByClientId(
  jobs: Job[],
  clientId: string | null | undefined,
): Job[] {
  if (!clientId) return [];
  return jobs.filter((job) => job.clientId === clientId);
}

export function getJobsByTeamId(teamId: string | null | undefined): Job[] {
  if (!teamId) return [];
  return jobs.filter((job) => job.teamId === teamId);
}

export interface ClientJobStats {
  /** Jumlah semua pekerjaan klien. */
  total: number;
  /** Pekerjaan berjalan: scheduled, in_progress, paused. */
  active: number;
  /** Pekerjaan selesai: completed. */
  completed: number;
  /** Total target brosur dari seluruh pekerjaan klien. */
  targetBrochures: number;
  /** Total brosur tersalurkan dari seluruh pekerjaan klien. */
  distributedBrochures: number;
  /** Progress keseluruhan (0-100) dihitung dari target vs tersalurkan. */
  progress: number;
}

/**
 * Statistik pekerjaan seorang klien, dihitung dari relasi `Job.clientId`.
 * Satu-satunya sumber kebenaran: collection jobs + clientId.
 */
export function getClientJobStats(
  jobs: Job[],
  clientId: string | null | undefined,
): ClientJobStats {
  const clientJobs = getJobsByClientId(jobs, clientId);
  const active = clientJobs.filter((job) =>
    ["scheduled", "in_progress", "paused"].includes(job.status),
  ).length;
  const completed = clientJobs.filter(
    (job) => job.status === "completed",
  ).length;
  const targetBrochures = clientJobs.reduce(
    (sum, job) => sum + job.targetBrochures,
    0,
  );
  const distributedBrochures = clientJobs.reduce(
    (sum, job) => sum + job.distributedBrochures,
    0,
  );
  const progress =
    targetBrochures > 0
      ? Math.min(100, Math.round((distributedBrochures / targetBrochures) * 100))
      : 0;

  return {
    total: clientJobs.length,
    active,
    completed,
    targetBrochures,
    distributedBrochures,
    progress,
  };
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
