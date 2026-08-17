import { useState } from "react";
import { useClients } from "../context/ClientsContext";
import { getClientById } from "../data/helpers";
import { formatNumber } from "../utils/format";
import { JobDetail } from "./JobDetail";
import { Modal } from "./Modal";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "../types";

export function JobTable({ jobs }: { jobs: Job[] }) {
  const { clients } = useClients();
  const [selected, setSelected] = useState<Job | null>(null);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Nama Pekerjaan</th>
            <th>Klien</th>
            <th>Lokasi</th>
            <th>Target Brosur</th>
            <th>Progress</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const client = getClientById(clients, job.clientId);
            return (
            <tr key={job.id}>
              <td>
                <strong className="cell-main">{job.title}</strong>
                <small className="cell-sub">{client?.company}</small>
              </td>
              <td>{client?.company ?? "-"}</td>
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
                  onClick={() => setSelected(job)}
                >
                  Detail
                </button>
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
