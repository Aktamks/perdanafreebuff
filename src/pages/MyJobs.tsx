import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import {
  getClientById,
  getJobBrochureSummary,
  getTeamById,
} from "../data/helpers";
import { JOB_STATUS_FILTERS, JOB_STATUS_LABELS } from "../utils/labels";
import { formatNumber } from "../utils/format";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { JobStats } from "../components/jobs/JobStats";
import { JobTable } from "../components/JobTable";
import { StatCard } from "../components/StatCard";
import type { JobStatus } from "../types";

type StatusFilter = "all" | JobStatus;

export function MyJobs() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { clients } = useClients();
  const { teams } = useTeams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const isTeam = user?.role === "field_team";
  // Relationship user → entitas (bukan hard-code): teamId untuk tim, clientId untuk klien.
  const entityId = isTeam ? user?.teamId : user?.clientId;

  // Tampilan khusus saat akun belum terhubung ke entitas — JANGAN fallback ke semua jobs.
  if (!entityId) {
    const unlinked = isTeam
      ? {
          icon: "teams" as const,
          title: "Tim belum terhubung",
          description:
            "Hubungi administrator untuk menghubungkan akun Anda dengan tim.",
        }
      : {
          icon: "clients" as const,
          title: "Profil klien belum terhubung",
          description:
            "Hubungi administrator untuk menghubungkan akun Anda dengan klien.",
        };
    return (
      <>
        <div className="page-head">
          <h1>Pekerjaan Saya</h1>
          <p>
            {isTeam
              ? "Daftar pekerjaan yang ditugaskan kepada tim Anda."
              : "Pantau pekerjaan promosi milik Anda."}
          </p>
        </div>
        <div className="panel">
          <EmptyState icon={unlinked.icon} title={unlinked.title} description={unlinked.description} />
        </div>
      </>
    );
  }

  // Derived data — bukan state terpisah. Satu koleksi jobs aktif untuk semua role.
  const myJobs = jobs.filter((job) =>
    isTeam ? job.teamId === entityId : job.clientId === entityId,
  );

  // Ringkasan brosur dari jobs terfilter (derived — bukan state terpisah).
  const brochure = getJobBrochureSummary(myJobs);

  const query = search.trim().toLowerCase();
  const filtered = myJobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (!query) return true;
    const client = getClientById(clients, job.clientId);
    const team = getTeamById(teams, job.teamId);
    return [
      job.title,
      job.address,
      job.city,
      client?.company ?? "",
      client?.name ?? "",
      team?.name ?? "",
    ].some((value) => value.toLowerCase().includes(query));
  });

  return (
    <>
      <div className="page-head">
        <h1>Pekerjaan Saya</h1>
        <p>
          {isTeam
            ? "Daftar pekerjaan yang ditugaskan kepada tim Anda."
            : "Pantau pekerjaan promosi milik Anda."}
        </p>
      </div>

      <JobStats jobs={myJobs} showCancelled={false} />

      <div className="stats-grid">
        <StatCard
          label="Total Target Brosur"
          value={formatNumber(brochure.targetBrochures)}
          sub="target keseluruhan"
          icon="target"
          color="red"
        />
        <StatCard
          label="Brosur Tersalurkan"
          value={formatNumber(brochure.distributedBrochures)}
          sub="sudah didistribusikan"
          icon="trending"
          color="green"
        />
        <StatCard
          label="Progress Rata-rata"
          value={`${brochure.progress}%`}
          sub="distribusi keseluruhan"
          icon="jobs"
          color="blue"
        />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Daftar Pekerjaan</h2>
          <span className="badge badge-gray">{myJobs.length} pekerjaan</span>
        </div>

        <div className="clients-toolbar jobs-toolbar">
          <div className="search-field">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Cari pekerjaan saya..."
              aria-label="Cari pekerjaan saya"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select-field"
            aria-label="Filter status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {JOB_STATUS_FILTERS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {myJobs.length === 0 ? (
          <EmptyState
            icon="jobs"
            title="Belum ada pekerjaan"
            description="Belum ada pekerjaan yang ditugaskan kepada Anda."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Tidak ada pekerjaan yang sesuai."
            description={`Tidak ada pekerjaan dengan status "${statusFilter === "all" ? "Semua" : JOB_STATUS_LABELS[statusFilter]}" yang cocok dengan pencarian Anda.`}
          />
        ) : (
          <>
            <div className="hide-mobile">
              <JobTable
                jobs={filtered}
                onView={(job) => navigate(`/my-jobs/${job.id}`)}
              />
            </div>
            <div className="cards-grid hide-desktop">
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={(selected) => navigate(`/my-jobs/${selected.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
