import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { getJobsByTeamId, isMockToday } from "../data/helpers";
import { Icon } from "../components/icons";
import { formatNumber } from "../utils/format";
import { JobCard } from "../components/JobCard";
import { JobDetail } from "../components/JobDetail";
import { Modal } from "../components/Modal";
import { StatCard, type StatColor } from "../components/StatCard";
import type { IconName } from "../components/icons";
import type { Job } from "../types";

export function DashboardTim() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const [selected, setSelected] = useState<Job | null>(null);

  const teamJobs = getJobsByTeamId(jobs, user?.teamId);
  const todayJobs = teamJobs.filter((job) => isMockToday(job.startDate));
  const activeJobs = teamJobs.filter((job) => job.status === "in_progress");
  const doneJobs = teamJobs.filter((job) => job.status === "completed");
  const targetJobs = teamJobs.filter(
    (job) => job.status === "in_progress" || job.status === "scheduled",
  );
  const totalTarget = targetJobs.reduce(
    (sum, job) => sum + job.targetBrochures,
    0,
  );
  const totalDistributed = teamJobs.reduce(
    (sum, job) => sum + job.distributedBrochures,
    0,
  );

  const stats: {
    label: string;
    value: string | number;
    sub?: string;
    icon: IconName;
    color: StatColor;
  }[] = [
    {
      label: "Tugas Hari Ini",
      value: todayJobs.length,
      sub: "mulai hari ini",
      icon: "calendar",
      color: "navy",
    },
    {
      label: "Tugas Aktif",
      value: activeJobs.length,
      icon: "jobs",
      color: "blue",
    },
    {
      label: "Tugas Selesai",
      value: doneJobs.length,
      icon: "check",
      color: "green",
    },
    {
      label: "Target Brosur",
      value: formatNumber(totalTarget),
      sub: "tugas aktif & terjadwal",
      icon: "target",
      color: "red",
    },
    {
      label: "Brosur Tersalurkan",
      value: formatNumber(totalDistributed),
      sub: "seluruh tugas tim",
      icon: "trending",
      color: "navy",
    },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Dashboard Tim Lapangan</h1>
        <p>Pantau tugas harian, target distribusi, dan progres pekerjaan tim.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="section-head">
        <h2 className="section-title">Tugas Saya</h2>
        <Link to="/my-jobs" className="link-btn">
          Lihat Semua <Icon name="arrow-right" size={15} />
        </Link>
      </div>
      <div className="cards-grid">
        {teamJobs.map((job) => (
          <JobCard key={job.id} job={job} onView={setSelected} />
        ))}
      </div>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Detail Tugas"
      >
        {selected && <JobDetail job={selected} />}
      </Modal>
    </>
  );
}
