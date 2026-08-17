import { StatCard } from "../StatCard";
import type { Job } from "../../types";

export function JobStats({
  jobs,
  showCancelled = true,
}: {
  jobs: Job[];
  /** Sembunyikan kartu "Dibatalkan" (dipakai tampilan My Jobs yang minta 4 kartu). */
  showCancelled?: boolean;
}) {
  const scheduled = jobs.filter((job) => job.status === "scheduled").length;
  const running = jobs.filter(
    (job) => job.status === "in_progress" || job.status === "paused",
  ).length;
  const completed = jobs.filter((job) => job.status === "completed").length;
  const cancelled = jobs.filter((job) => job.status === "cancelled").length;

  return (
    <div className="stats-grid">
      <StatCard
        label="Total Pekerjaan"
        value={jobs.length}
        sub="semua pekerjaan"
        icon="jobs"
        color="navy"
      />
      <StatCard
        label="Terjadwal"
        value={scheduled}
        sub="status terjadwal"
        icon="calendar"
        color="blue"
      />
      <StatCard
        label="Sedang Berjalan"
        value={running}
        sub="berjalan & dijeda"
        icon="trending"
        color="green"
      />
      <StatCard
        label="Selesai"
        value={completed}
        sub="telah selesai"
        icon="check"
        color="red"
      />
      {showCancelled && (
        <StatCard
          label="Dibatalkan"
          value={cancelled}
          sub="status dibatalkan"
          icon="info"
          color="navy"
        />
      )}
    </div>
  );
}
