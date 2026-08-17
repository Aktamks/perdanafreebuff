import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTeams } from "../context/TeamsContext";
import { getJobsByTeamId, getTeamJobStats } from "../data/helpers";
import { jobs } from "../data/mockData";
import { formatDate, formatNumber, formatRelative, initialsOf } from "../utils/format";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { TeamModal } from "../components/teams/TeamModal";
import { TeamStatusBadge } from "../components/teams/TeamStatusBadge";
import { TeamStatusModal } from "../components/teams/TeamStatusModal";
import { ProgressBar } from "../components/ProgressBar";
import { StatCard, type StatColor } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import type { IconName } from "../components/icons";
import type { Team, TeamInput } from "../types";

export function TeamDetail() {
  const { id } = useParams();
  const { getTeam, updateTeam, toggleTeamStatus } = useTeams();
  const team = getTeam(id);

  const [editOpen, setEditOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Team | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!team) return <Navigate to="/teams" replace />;
  const currentTeam: Team = team;

  function handleSave(values: TeamInput) {
    updateTeam(currentTeam.id, values);
    setNotice("Perubahan tim berhasil disimpan.");
    setEditOpen(false);
  }

  function handleStatusConfirm() {
    toggleTeamStatus(currentTeam.id);
    setNotice("Status tim berhasil diperbarui.");
    setStatusTarget(null);
  }

  const teamJobs = getJobsByTeamId(jobs, team.id);
  const jobStats = getTeamJobStats(jobs, team.id);

  const stats: {
    label: string;
    value: string | number;
    sub?: string;
    icon: IconName;
    color: StatColor;
  }[] = [
    {
      label: "Total Pekerjaan",
      value: jobStats.total,
      sub: "semua penugasan",
      icon: "jobs",
      color: "navy",
    },
    {
      label: "Pekerjaan Aktif",
      value: jobStats.active,
      sub: "scheduled, berjalan, ditunda",
      icon: "map",
      color: "blue",
    },
    {
      label: "Pekerjaan Selesai",
      value: jobStats.completed,
      sub: "telah selesai",
      icon: "check",
      color: "green",
    },
    {
      label: "Total Brosur",
      value: formatNumber(jobStats.targetBrochures),
      sub: `${formatNumber(jobStats.distributedBrochures)} tersalurkan · ${jobStats.progress}%`,
      icon: "trending",
      color: "red",
    },
  ];

  return (
    <>
      <div className="page-head">
        <Link to="/teams" className="back-link">
          <Icon name="arrow-right" size={15} />
          Kembali ke Tim Lapangan
        </Link>
      </div>

      <div className="panel">
        <div className="team-detail-head">
          <UserAvatar
            name={team.leaderName}
            initials={initialsOf(team.leaderName)}
            color="#244585"
            size={56}
          />
          <div className="team-detail-title">
            <h1>{team.name}</h1>
            <p>{team.leaderName} — Ketua Tim</p>
          </div>
          <div className="team-detail-actions">
            <TeamStatusBadge status={team.status} />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setStatusTarget(team)}
            >
              {team.status === "active" ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </div>

        {notice && (
          <div className="alert alert-info notice" role="status">
            <Icon name="check" size={16} />
            <span>{notice}</span>
          </div>
        )}

        <div className="detail-list team-contact">
          <div>
            <dt>Ketua Tim</dt>
            <dd>{team.leaderName}</dd>
          </div>
          <div>
            <dt>Telepon</dt>
            <dd>{team.phone}</dd>
          </div>
          <div>
            <dt>WhatsApp</dt>
            <dd>{team.whatsapp || "-"}</dd>
          </div>
          <div>
            <dt>Kota</dt>
            <dd>{team.city}</dd>
          </div>
          <div>
            <dt>Anggota</dt>
            <dd>{team.members} orang</dd>
          </div>
          <div>
            <dt>Update Terakhir</dt>
            <dd>{formatRelative(team.lastActiveAt)}</dd>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Riwayat Pekerjaan</h2>
          <span className="badge badge-gray">{teamJobs.length} pekerjaan</span>
        </div>
        {teamJobs.length === 0 ? (
          <EmptyState
            icon="jobs"
            title="Belum ada pekerjaan"
            description="Pekerjaan yang menggunakan teamId tim ini akan tampil di sini."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pekerjaan</th>
                  <th>Lokasi</th>
                  <th>Target Brosur</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {teamJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <strong className="cell-main">{job.title}</strong>
                      <small className="cell-sub">{job.distributionMethod}</small>
                    </td>
                    <td>{job.city}</td>
                    <td>{formatNumber(job.targetBrochures)}</td>
                    <td className="progress-cell">
                      <ProgressBar value={job.progress} />
                      <span className="progress-num">{job.progress}%</span>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td>{formatDate(job.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TeamModal
        open={editOpen}
        team={team}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <TeamStatusModal
        team={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
