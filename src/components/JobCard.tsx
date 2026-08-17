import { useClients } from "../context/ClientsContext";
import { getClientById } from "../data/helpers";
import { formatDate, formatNumber } from "../utils/format";
import { Icon } from "./icons";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import type { Job } from "../types";

export function JobCard({
  job,
  onView,
}: {
  job: Job;
  onView: (job: Job) => void;
}) {
  const { clients } = useClients();
  const client = getClientById(clients, job.clientId);

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

      <button type="button" className="btn btn-outline btn-block" onClick={() => onView(job)}>
        Lihat Detail
      </button>
    </article>
  );
}
