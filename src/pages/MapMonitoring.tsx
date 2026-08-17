import { useJobs } from "../context/JobsContext";
import { useTeams } from "../context/TeamsContext";
import { getJobById } from "../data/helpers";
import { formatRelative, initialsOf } from "../utils/format";
import { Icon } from "../components/icons";
import { EntityStatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import type { JobStatus } from "../types";

const JOB_MARKER_CLASS: Record<JobStatus, string> = {
  draft: "marker-gray",
  scheduled: "marker-yellow",
  in_progress: "marker-green",
  paused: "marker-yellow",
  completed: "marker-red",
  cancelled: "marker-gray",
};

const JOB_POSITIONS: Record<string, { x: number; y: number }> = {
  "j-1": { x: 22, y: 30 },
  "j-2": { x: 40, y: 26 },
  "j-3": { x: 48, y: 62 },
  "j-4": { x: 30, y: 22 },
  "j-5": { x: 52, y: 72 },
  "j-6": { x: 30, y: 46 },
  "j-7": { x: 44, y: 40 },
  "j-8": { x: 20, y: 36 },
  "j-9": { x: 26, y: 26 },
  "j-10": { x: 50, y: 58 },
  "j-11": { x: 34, y: 50 },
  "j-12": { x: 32, y: 18 },
  "j-13": { x: 18, y: 32 },
};

const TEAM_POSITIONS: Record<string, { x: number; y: number }> = {
  "t-1": { x: 24, y: 34 },
  "t-2": { x: 42, y: 28 },
  "t-3": { x: 50, y: 60 },
  "t-4": { x: 44, y: 42 },
  "t-5": { x: 32, y: 24 },
  "t-6": { x: 34, y: 50 },
};

export function MapMonitoring() {
  const { jobs } = useJobs();
  const { teams } = useTeams();
  return (
    <>
      <div className="page-head">
        <h1>Peta Monitoring</h1>
        <p>Pantau posisi tim lapangan dan lokasi pekerjaan secara langsung.</p>
      </div>

      <div className="map-layout">
        <div className="panel">
          <div className="panel-head">
            <h2>Peta Lokasi</h2>
            <span className="badge badge-gray">Placeholder — Leaflet menyusul</span>
          </div>

          <div className="map-visual">
            <div className="map-road road-a" aria-hidden="true" />
            <div className="map-road road-b" aria-hidden="true" />
            <div className="map-road road-c" aria-hidden="true" />

            {jobs.map((job) => {
              const pos = JOB_POSITIONS[job.id];
              // Posisi placeholder hanya tersedia untuk job seed; job baru hasil
              // CRUD tidak memiliki posisi visual (peta interaktif menyusul).
              if (!pos) return null;
              return (
                <div
                  key={job.id}
                  className={`map-marker ${JOB_MARKER_CLASS[job.status]}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <span className="map-dot" />
                  <span className="map-label">{job.title}</span>
                </div>
              );
            })}

            {teams.map((team) => {
              const pos = TEAM_POSITIONS[team.id];
              if (!pos) return null;
              return (
                <div
                  key={team.id}
                  className="map-marker team-marker"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <span className="team-pin">{initialsOf(team.leaderName)}</span>
                  <span className="map-label">{team.name}</span>
                </div>
              );
            })}
          </div>

          <div className="map-legend">
            <span className="legend-item">
              <i className="dot dot-green" /> Aktif
            </span>
            <span className="legend-item">
              <i className="dot dot-red" /> Selesai
            </span>
            <span className="legend-item">
              <i className="dot dot-yellow" /> Menunggu
            </span>
            <span className="legend-item">
              <i className="dot dot-gray" /> Draft / Batal
            </span>
            <span className="legend-item">
              <i className="dot dot-navy" /> Tim Lapangan
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Tim Aktif</h2>
          </div>
          <ul className="team-active-list">
            {teams.map((team) => (
              <li key={team.id} className="team-active-item">
                <div className="team-active-head">
                  <UserAvatar
                    name={team.leaderName}
                    initials={initialsOf(team.leaderName)}
                    color="#244585"
                    size={38}
                  />
                  <div className="team-active-info">
                    <strong>{team.name}</strong>
                    <p>{getJobById(jobs, team.currentJobId)?.title ?? "Belum ada pekerjaan"}</p>
                  </div>
                  <EntityStatusBadge status={team.status} />
                </div>
                <div className="team-active-meta">
                  <Icon name="map" size={14} />
                  {team.city} <span>· {formatRelative(team.lastActiveAt)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="alert alert-info">
            <Icon name="info" size={16} />
            <span>
              Peta real (OpenStreetMap + Leaflet) akan diintegrasikan di tahap
              berikutnya.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
