import { useState } from "react";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import { getClientById, getTeamById } from "../data/helpers";
import { formatDate, formatNumber } from "../utils/format";
import { JobDetail } from "./JobDetail";
import { Modal } from "./Modal";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "../types";

export function JobTable({
  jobs,
  onView,
  onEdit,
  onStatus,
}: {
  jobs: Job[];
  onView?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onStatus?: (job: Job) => void;
}) {
  const { clients } = useClients();
  const { teams } = useTeams();
  const [selected, setSelected] = useState<Job | null>(null);

  return (
    <div className="table-wrap">
      <table className="table table-jobs">
        <thead>
          <tr>
            <th>Pekerjaan</th>
            <th>Klien</th>
            <th>Tim</th>
            <th>Lokasi</th>
            <th>Jadwal</th>
            <th>Target Brosur</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const client = getClientById(clients, job.clientId);
            const team = getTeamById(teams, job.teamId);
            return (
              <tr key={job.id}>
                <td>
                  <strong className="cell-main">{job.title}</strong>
                  <small className="cell-sub">{job.id}</small>
                </td>
                <td>{client?.company ?? "-"}</td>
                <td>{team?.name ?? "-"}</td>
                <td>{job.address}</td>
                <td>{formatDate(job.startDate)}</td>
                <td>{formatNumber(job.targetBrochures)}</td>
                <td className="progress-cell">
                  <ProgressBar value={job.progress} />
                  <span className="progress-num">{job.progress}%</span>
                </td>
                <td>
                  <StatusBadge status={job.status} />
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => {
                        if (onView) onView(job);
                        else setSelected(job);
                      }}
                    >
                      Lihat
                    </button>
                    {onEdit && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onEdit(job)}
                      >
                        Edit
                      </button>
                    )}
                    {onStatus && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => onStatus(job)}
                      >
                        Ubah Status
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Detail Pekerjaan"
      >
        {selected && <JobDetail job={selected} />}
      </Modal>
    </div>
  );
}
