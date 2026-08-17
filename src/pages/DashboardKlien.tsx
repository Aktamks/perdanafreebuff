import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { getJobsByClientId } from "../data/helpers";
import { formatNumber } from "../utils/format";
import { Icon } from "../components/icons";
import { JobDetail } from "../components/JobDetail";
import { Modal } from "../components/Modal";
import { ProgressBar } from "../components/ProgressBar";
import { StatCard, type StatColor } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import type { IconName } from "../components/icons";
import type { Job } from "../types";

function JobReport({ job }: { job: Job }) {
  return (
    <div>
      <JobDetail job={job} />
      <div className="alert alert-info">
        <Icon name="info" size={16} />
        <span>
          Laporan lengkap per wilayah distribusi akan tersedia di tahap
          berikutnya.
        </span>
      </div>
    </div>
  );
}

export function DashboardKlien() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const [report, setReport] = useState<Job | null>(null);

  const myJobs = getJobsByClientId(jobs, user?.clientId);
  const active = myJobs.filter((job) => job.status === "in_progress");
  const totalTarget = myJobs.reduce(
    (sum, job) => sum + job.targetBrochures,
    0,
  );
  const totalDistributed = myJobs.reduce(
    (sum, job) => sum + job.distributedBrochures,
    0,
  );
  const avgProgress = myJobs.length
    ? Math.round(
        myJobs.reduce((sum, job) => sum + job.progress, 0) / myJobs.length,
      )
    : 0;

  const stats: {
    label: string;
    value: string | number;
    sub?: string;
    icon: IconName;
    color: StatColor;
  }[] = [
    {
      label: "Jumlah Pekerjaan",
      value: myJobs.length,
      sub: "total kampanye",
      icon: "reports",
      color: "navy",
    },
    {
      label: "Pekerjaan Aktif",
      value: active.length,
      sub: "sedang berjalan",
      icon: "jobs",
      color: "blue",
    },
    {
      label: "Total Target Brosur",
      value: formatNumber(totalTarget),
      sub: "target keseluruhan",
      icon: "target",
      color: "red",
    },
    {
      label: "Brosur Tersalurkan",
      value: formatNumber(totalDistributed),
      sub: "sudah didistribusikan",
      icon: "trending",
      color: "green",
    },
    {
      label: "Progress Keseluruhan",
      value: `${avgProgress}%`,
      sub: "rata-rata kampanye",
      icon: "calendar",
      color: "navy",
    },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Dashboard Klien</h1>
        <p>Pantau kampanye distribusi brosur Anda secara langsung.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Pekerjaan Saya</h2>
          <span className="badge badge-gray">{myJobs.length} kampanye</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nama Kampanye</th>
                <th>Lokasi</th>
                <th>Target</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {myJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong className="cell-main">{job.title}</strong>
                    <small className="cell-sub">{job.city}</small>
                  </td>
                  <td>{job.city}</td>
                  <td>{formatNumber(job.targetBrochures)}</td>
                  <td className="progress-cell">
                    <ProgressBar value={job.progress} />
                    <span className="progress-num">{job.progress}%</span>
                  </td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setReport(job)}
                    >
                      Lihat Laporan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={report !== null}
        onClose={() => setReport(null)}
        title="Laporan Pekerjaan"
      >
        {report && <JobReport job={report} />}
      </Modal>
    </>
  );
}
