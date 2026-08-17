import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { jobs as initialJobs } from "../data/mockData";
import { getJobProgress } from "../data/helpers";
import type { Job, JobInput, JobStatus } from "../types";

interface JobsContextValue {
  jobs: Job[];
  addJob: (input: JobInput) => void;
  updateJob: (id: string, input: Partial<JobInput>) => void;
  changeJobStatus: (id: string, status: JobStatus) => void;
  getJob: (id: string | undefined) => Job | undefined;
  /**
   * Operasional Field Team (Tahap 2F) — semua mutation memvalidasi status
   * aktif di koleksi jobs (satu source of truth), jadi panggilan dengan
   * status yang tidak valid tidak akan mengubah apa pun.
   */
  startJob: (id: string) => void;
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  completeJob: (id: string) => void;
  /** Update distributedBrochures. Mengembalikan false jika status/input tidak valid. */
  updateJobProgress: (id: string, distributed: number) => boolean;
  updateOperationalNotes: (id: string, notes: string) => void;
}

const JobsContext = createContext<JobsContextValue | null>(null);

/** Status tempat Field Team boleh memperbarui progress. */
const PROGRESS_STATUSES: JobStatus[] = ["in_progress", "paused"];

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  const addJob = useCallback((input: JobInput) => {
    const now = new Date().toISOString();
    const job: Job = {
      ...input,
      id: `j-${Date.now()}`,
      // Status awal selalu terjadwal; progress operasional (distributedBrochures)
      // akan dikelola Field Team, jadi 0 dan progress dihitung.
      distributedBrochures: 0,
      progress: getJobProgress(0, input.targetBrochures),
      // Koordinat placeholder — GPS/peta interaktif belum dipakai di tahap ini.
      latitude: 0,
      longitude: 0,
      endDate: input.startDate,
      status: "scheduled",
      startedAt: null,
      completedAt: null,
      operationalNotes: "",
      createdAt: now,
      updatedAt: now,
    };
    setJobs((prev) => [job, ...prev]);
  }, []);

  const updateJob = useCallback((id: string, input: Partial<JobInput>) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== id) return job;
        const next = { ...job, ...input };
        // distributedBrochures TIDAK diubah lewat form edit; progress dihitung
        // ulang dari data aktual jika target berubah.
        next.progress = getJobProgress(
          job.distributedBrochures,
          next.targetBrochures,
        );
        next.updatedAt = new Date().toISOString();
        return next;
      }),
    );
  }, []);

  /**
   * Transisi status via Admin (modal Ubah Status). Tetap mempertahankan
   * perilaku Tahap 2D, tetapi menyelaraskan timestamp operasional agar data
   * konsisten: masuk in_progress mengisi startedAt (jika kosong), menuju
   * completed mengisi completedAt.
   */
  const changeJobStatus = useCallback((id: string, status: JobStatus) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== id) return job;
        const next: Job = { ...job, status, updatedAt: now };
        if (status === "in_progress" && !next.startedAt) {
          next.startedAt = now;
        }
        if (status === "completed" && job.status !== "completed") {
          next.completedAt = now;
        }
        if (status === "completed") {
          next.startedAt = next.startedAt ?? now;
        }
        return next;
      }),
    );
  }, []);

  const getJob = useCallback(
    (id: string | undefined) => jobs.find((job) => job.id === id),
    [jobs],
  );

  /** scheduled → in_progress; isi startedAt hanya saat start pertama. */
  const startJob = useCallback((id: string) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id && job.status === "scheduled"
          ? {
              ...job,
              status: "in_progress",
              startedAt: job.startedAt ?? now,
              updatedAt: now,
            }
          : job,
      ),
    );
  }, []);

  /** in_progress → paused; startedAt & distributedBrochures tidak berubah. */
  const pauseJob = useCallback((id: string) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id && job.status === "in_progress"
          ? { ...job, status: "paused", updatedAt: now }
          : job,
      ),
    );
  }, []);

  /** paused → in_progress; startedAt tetap waktu pertama kali dimulai. */
  const resumeJob = useCallback((id: string) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id && job.status === "paused"
          ? { ...job, status: "in_progress", updatedAt: now }
          : job,
      ),
    );
  }, []);

  /** in_progress/paused → completed; isi completedAt dengan timestamp aktual. */
  const completeJob = useCallback((id: string) => {
    const now = new Date().toISOString();
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id && PROGRESS_STATUSES.includes(job.status)
          ? {
              ...job,
              status: "completed",
              completedAt: now,
              updatedAt: now,
            }
          : job,
      ),
    );
  }, []);

  /**
   * Update jumlah brosur tersalurkan. Guard: status harus in_progress/paused
   * dan nilai harus angka valid 0..target. Mengembalikan false jika ditolak.
   */
  const updateJobProgress = useCallback((id: string, distributed: number) => {
    if (!Number.isFinite(distributed) || distributed < 0) return false;
    let accepted = false;
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== id || !PROGRESS_STATUSES.includes(job.status)) {
          return job;
        }
        if (distributed > job.targetBrochures) return job;
        accepted = true;
        return {
          ...job,
          distributedBrochures: distributed,
          progress: getJobProgress(distributed, job.targetBrochures),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    return accepted;
  }, []);

  const updateOperationalNotes = useCallback((id: string, notes: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? { ...job, operationalNotes: notes, updatedAt: new Date().toISOString() }
          : job,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      jobs,
      addJob,
      updateJob,
      changeJobStatus,
      getJob,
      startJob,
      pauseJob,
      resumeJob,
      completeJob,
      updateJobProgress,
      updateOperationalNotes,
    }),
    [
      jobs,
      addJob,
      updateJob,
      changeJobStatus,
      getJob,
      startJob,
      pauseJob,
      resumeJob,
      completeJob,
      updateJobProgress,
      updateOperationalNotes,
    ],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsContextValue {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs harus dipakai di dalam JobsProvider");
  return ctx;
}
