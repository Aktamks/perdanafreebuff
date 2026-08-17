import { initialsOf } from "../../utils/format";
import { UserAvatar } from "../UserAvatar";
import { useJobs } from "../../context/JobsContext";
import { getJobsByTeamId } from "../../data/helpers";
import { TeamStatusBadge } from "./TeamStatusBadge";
import type { Team } from "../../types";

export function TeamTable({
  teams,
  onView,
  onEdit,
  onToggle,
}: {
  teams: Team[];
  onView: (id: string) => void;
  onEdit: (team: Team) => void;
  onToggle: (team: Team) => void;
}) {
  const { jobs } = useJobs();
  return (
    <div className="table-wrap">
      <table className="table table-teams">
        <thead>
          <tr>
            <th>Tim</th>
            <th>Ketua Tim</th>
            <th>Kontak</th>
            <th>Kota</th>
            <th>Pekerjaan</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td>
                <div className="cell-user">
                  <UserAvatar
                    name={team.leaderName}
                    initials={initialsOf(team.leaderName)}
                    color="#244585"
                    size={32}
                  />
                  <div>
                    <strong className="cell-main">{team.name}</strong>
                    <small className="cell-sub">{team.members} anggota</small>
                  </div>
                </div>
              </td>
              <td>{team.leaderName}</td>
              <td>
                <strong className="cell-main">{team.phone}</strong>
                <small className="cell-sub">{team.whatsapp || "-"}</small>
              </td>
              <td>{team.city}</td>
              <td>
                <span className="badge badge-navy">
                  {getJobsByTeamId(jobs, team.id).length} pekerjaan
                </span>
              </td>
              <td>
                <TeamStatusBadge status={team.status} />
              </td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onView(team.id)}
                  >
                    Lihat
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onEdit(team)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${team.status === "active" ? "text-danger" : ""}`}
                    onClick={() => onToggle(team)}
                  >
                    {team.status === "active" ? "Nonaktifkan" : "Aktifkan"}
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
