import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import { getClientById, getTeamById } from "../data/helpers";
import { formatDate, formatNumber } from "../utils/format";
import { Icon } from "./icons";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "../types";

export function JobCard({
  job,
  onView,
  onEdit,
  onStatus,
}: {
  job: Job;
  onView: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onStatus?: (job: Job) => void;
}) {
  const { clients } = useClients();
  const { teams } = useTeams();
  const client = getClientById(clients, job.clientId);
  const team = getTeamById(teams, job.teamId);

  return (
    <article className="job-card">
      <div className="job-card-head">
        <h3>{job.title}</h3>
        <StatusBadge status={job.status} />
      </div>

      <div className="job-card-meta">
        <span>
          <Icon name="clients" size={15} />
          {client?.company ?? "-"}
        </span>
        <span>
          <Icon name="teams" size={15} />
          {team?.name ?? "-"}
        </span>
        <span>
          <Icon name="map" size={15} />
          {job.city}
        </span>
        <span>
          <Icon name="calendar" size={15} />
          {formatDate(job.startDate)}
        </span>
        <span>
          <Icon name="target" size={15} />
          Target {formatNumber(job.targetBrochures)}
        </span>
      </div>

      <div className="job-card-progress">
        <div className="progress-label">
          <span>Progress</span>
          <strong>{job.progress}%</strong>
        </div>
        <ProgressBar value={job.progress} />
      </div>

      <div className="job-card-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onView(job)}
        >
          Lihat Detail
        </button>
        {onEdit && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onEdit(job)}
          >
            Edit
          </button>
        )}
        {onStatus && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onStatus(job)}
          >
            Ubah Status
          </button>
        )}
      </div>
    </article>
  );
}
