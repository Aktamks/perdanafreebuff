import { initialsOf } from "../../utils/format";
import { Icon } from "../icons";
import { UserAvatar } from "../UserAvatar";
import { useJobs } from "../../context/JobsContext";
import { getJobsByTeamId } from "../../data/helpers";
import { TeamStatusBadge } from "./TeamStatusBadge";
import type { Team } from "../../types";

export function TeamCard({
  team,
  onView,
  onEdit,
  onToggle,
}: {
  team: Team;
  onView: (id: string) => void;
  onEdit: (team: Team) => void;
  onToggle: (team: Team) => void;
}) {
  const { jobs } = useJobs();
  return (
    <article className="team-card">
      <div className="team-card-head">
        <UserAvatar
          name={team.leaderName}
          initials={initialsOf(team.leaderName)}
          color="#244585"
          size={42}
        />
        <div className="team-card-title">
          <h3>{team.name}</h3>
          <p>{team.leaderName} — Ketua Tim</p>
        </div>
        <TeamStatusBadge status={team.status} />
      </div>

      <div className="team-card-meta">
        <span>
          <Icon name="phone" size={14} />
          {team.whatsapp || team.phone}
        </span>
        <span>
          <Icon name="map" size={14} />
          {team.city}
        </span>
        <span>
          <Icon name="teams" size={14} />
          {team.members} anggota
        </span>
        <span>
          <Icon name="jobs" size={14} />
          {getJobsByTeamId(jobs, team.id).length} pekerjaan
        </span>
      </div>

      <div className="team-card-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onView(team.id)}
        >
          Lihat
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => onEdit(team)}
        >
          Edit
        </button>
        <button
          type="button"
          className={`btn btn-outline btn-sm ${team.status === "active" ? "btn-danger-outline" : ""}`}
          onClick={() => onToggle(team)}
        >
          {team.status === "active" ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </div>
    </article>
  );
}
