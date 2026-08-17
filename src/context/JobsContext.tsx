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
}

const JobsContext = createContext<JobsContextValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);

  const addJob = useCallback((input: JobInput) => {
    const now = new Date().toISOString();
    const job: Job = {
      ...input,
      id: `j-${Date.now()}`,
      // Status awal selalu terjadwal; progress operasional (distributedBrochures)
      // akan dikelola di tahap berikutnya, jadi 0 dan progress dihitung.
      distributedBrochures: 0,
      progress: getJobProgress(0, input.targetBrochures),
      // Koordinat placeholder — GPS/peta interaktif belum dipakai di tahap ini.
      latitude: 0,
      longitude: 0,
      endDate: input.startDate,
      status: "scheduled",
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

  const changeJobStatus = useCallback((id: string, status: JobStatus) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? { ...job, status, updatedAt: new Date().toISOString() }
          : job,
      ),
    );
  }, []);

  const getJob = useCallback(
    (id: string | undefined) => jobs.find((job) => job.id === id),
    [jobs],
  );

  const value = useMemo(
    () => ({ jobs, addJob, updateJob, changeJobStatus, getJob }),
    [jobs, addJob, updateJob, changeJobStatus, getJob],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs(): JobsContextValue {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs harus dipakai di dalam JobsProvider");
  return ctx;
}
