import { teams } from "../data/mockData";
import { getJobById } from "../data/helpers";
import { formatRelative, initialsOf } from "../utils/format";
import { EntityStatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";

export function Teams() {
  return (
    <>
      <div className="page-head">
        <h1>Tim Lapangan</h1>
        <p>Kelola tim yang bertugas melakukan distribusi di lapangan.</p>
      </div>

      <div className="cards-grid">
        {teams.map((team) => (
          <article key={team.id} className="team-card">
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
              <EntityStatusBadge status={team.status} />
            </div>

            <dl className="detail-list">
              <div>
                <dt>Anggota</dt>
                <dd>{team.members} orang</dd>
              </div>
              <div>
                <dt>Pekerjaan</dt>
                <dd>{getJobById(team.currentJobId)?.title ?? "Belum ada"}</dd>
              </div>
              <div>
                <dt>Kota</dt>
                <dd>{team.city}</dd>
              </div>
              <div>
                <dt>Update Terakhir</dt>
                <dd>{formatRelative(team.lastActiveAt)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </>
  );
}
