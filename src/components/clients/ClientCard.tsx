import { initialsOf } from "../../utils/format";
import { Icon } from "../icons";
import { UserAvatar } from "../UserAvatar";
import { useJobs } from "../../context/JobsContext";
import { getJobsByClientId } from "../../data/helpers";
import { ClientStatusBadge } from "./ClientStatusBadge";
import type { Client } from "../../types";

export function ClientCard({
  client,
  onView,
  onEdit,
  onToggle,
}: {
  client: Client;
  onView: (id: string) => void;
  onEdit: (client: Client) => void;
  onToggle: (client: Client) => void;
}) {
  const { jobs } = useJobs();
  return (
    <article className="client-card">
      <div className="client-card-head">
        <UserAvatar
          name={client.name}
          initials={initialsOf(client.name)}
          color="#16325c"
          size={42}
        />
        <div className="client-card-title">
          <h3>{client.name}</h3>
          <p>{client.company}</p>
        </div>
        <ClientStatusBadge status={client.status} />
      </div>

      <div className="client-card-meta">
        <span>
          <Icon name="mail" size={14} />
          {client.email}
        </span>
        <span>
          <Icon name="phone" size={14} />
          {client.whatsapp || client.phone}
        </span>
        <span>
          <Icon name="map" size={14} />
          {client.city}
        </span>
        <span>
          <Icon name="jobs" size={14} />
          {getJobsByClientId(jobs, client.id).length} pekerjaan
        </span>
      </div>

      <div className="client-card-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onView(client.id)}
        >
          Lihat
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onEdit(client)}
        >
          Edit
        </button>
        <button
          type="button"
          className={`btn btn-outline btn-sm ${client.status === "active" ? "btn-danger-outline" : ""}`}
          onClick={() => onToggle(client)}
        >
          {client.status === "active" ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </div>
    </article>
  );
}
