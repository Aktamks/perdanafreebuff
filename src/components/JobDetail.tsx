import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import { getClientById, getTeamById } from "../data/helpers";
import { formatDateRange, formatNumber } from "../utils/format";
import { METHOD_LABELS } from "../utils/labels";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "../types";

export function JobDetail({ job }: { job: Job }) {
  const { clients } = useClients();
  const { teams } = useTeams();
  const client = getClientById(clients, job.clientId);
  const team = getTeamById(teams, job.teamId);
  const remaining = Math.max(job.targetBrochures - job.distributedBrochures, 0);

  return (
    <div className="job-detail">
      <div className="job-detail-head">
        <h4>{job.title}</h4>
        <StatusBadge status={job.status} />
      </div>

      <dl className="detail-list">
        <div>
          <dt>Klien</dt>
          <dd>{client?.company ?? "-"}</dd>
        </div>
        <div>
          <dt>Tim</dt>
          <dd>{team?.name ?? "-"}</dd>
        </div>
        <div>
          <dt>Kota</dt>
          <dd>{job.city}</dd>
        </div>
        <div>
          <dt>Alamat</dt>
          <dd>{job.address}</dd>
        </div>
        <div>
          <dt>Metode</dt>
          <dd>{METHOD_LABELS[job.distributionMethod]}</dd>
        </div>
        <div>
          <dt>Jadwal</dt>
          <dd>{formatDateRange(job.startDate, job.endDate)}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{formatNumber(job.targetBrochures)} brosur</dd>
        </div>
        <div>
          <dt>Tersalurkan</dt>
          <dd>{formatNumber(job.distributedBrochures)} brosur</dd>
        </div>
        <div>
          <dt>Sisa</dt>
          <dd>{formatNumber(remaining)} brosur</dd>
        </div>
      </dl>

      <div className="job-detail-progress">
        <div className="progress-label">
          <span>Progress</span>
          <strong>{job.progress}%</strong>
        </div>
        <ProgressBar value={job.progress} />
      </div>
    </div>
  );
}
