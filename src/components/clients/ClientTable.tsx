import { initialsOf } from "../../utils/format";
import { UserAvatar } from "../UserAvatar";
import { getJobsByClientId } from "../../data/helpers";
import { jobs } from "../../data/mockData";
import { ClientStatusBadge } from "./ClientStatusBadge";
import type { Client } from "../../types";

export function ClientTable({
  clients,
  onView,
  onEdit,
  onToggle,
}: {
  clients: Client[];
  onView: (id: string) => void;
  onEdit: (client: Client) => void;
  onToggle: (client: Client) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="table table-clients">
        <thead>
          <tr>
            <th>Klien</th>
            <th>Perusahaan</th>
            <th>Kontak</th>
            <th>Kota</th>
            <th>Pekerjaan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>
                <div className="cell-user">
                  <UserAvatar
                    name={client.name}
                    initials={initialsOf(client.name)}
                    color="#16325c"
                    size={32}
                  />
                  <strong className="cell-main">{client.name}</strong>
                </div>
              </td>
              <td>{client.company}</td>
              <td>
                <strong className="cell-main">{client.email}</strong>
                <small className="cell-sub">
                  {client.whatsapp || client.phone}
                </small>
              </td>
              <td>{client.city}</td>
              <td>
                <span className="badge badge-navy">
                  {getJobsByClientId(jobs, client.id).length} pekerjaan
                </span>
              </td>
              <td>
                <ClientStatusBadge status={client.status} />
              </td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onView(client.id)}
                  >
                    Lihat
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onEdit(client)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${client.status === "active" ? "text-danger" : ""}`}
                    onClick={() => onToggle(client)}
                  >
                    {client.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
