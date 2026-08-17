import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobs } from "../context/JobsContext";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import { getClientById, getTeamById } from "../data/helpers";
import { JOB_CITIES, JOB_STATUS_LABELS } from "../utils/labels";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { JobCard } from "../components/JobCard";
import { JobModal } from "../components/jobs/JobModal";
import { JobStats } from "../components/jobs/JobStats";
import { JobStatusModal } from "../components/jobs/JobStatusModal";
import { JobTable } from "../components/JobTable";
import type { Job, JobInput, JobStatus } from "../types";

type StatusFilter = "all" | JobStatus;

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "scheduled", label: "Terjadwal" },
  { key: "in_progress", label: "Sedang Berjalan" },
  { key: "paused", label: "Dijeda" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

export function Jobs() {
  const { jobs, addJob, updateJob, changeJobStatus } = useJobs();
  const { clients } = useClients();
  const { teams } = useTeams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [statusTarget, setStatusTarget] = useState<Job | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const query = search.trim().toLowerCase();
  const activeClients = clients.filter((client) => client.status === "active");
  const activeTeams = teams.filter((team) => team.status === "active");

  const filtered = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (clientFilter !== "all" && job.clientId !== clientFilter) return false;
    if (teamFilter !== "all" && job.teamId !== teamFilter) return false;
    if (cityFilter !== "all" && job.city !== cityFilter) return false;
    if (!query) return true;
    const client = getClientById(clients, job.clientId);
    const team = getTeamById(teams, job.teamId);
    return [
      job.title,
      job.city,
      job.address,
      client?.company ?? "",
      client?.name ?? "",
      team?.name ?? "",
    ].some((value) => value.toLowerCase().includes(query));
  });

  function resetFilter() {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setTeamFilter("all");
    setCityFilter("all");
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(job: Job) {
    setEditing(job);
    setModalOpen(true);
  }

  function handleSave(values: JobInput) {
    if (editing) {
      updateJob(editing.id, values);
      setNotice("Perubahan pekerjaan berhasil disimpan.");
    } else {
      addJob(values);
      setNotice("Pekerjaan baru berhasil dibuat.");
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleStatusConfirm(status: JobStatus) {
    if (!statusTarget) return;
    changeJobStatus(statusTarget.id, status);
    setNotice("Status pekerjaan berhasil diperbarui.");
    setStatusTarget(null);
  }

  return (
    <>
      <div className="page-head">
        <h1>Manajemen Pekerjaan</h1>
        <p>
          Kelola pekerjaan distribusi, tim lapangan, klien, lokasi, jadwal, dan
          target brosur.
        </p>
      </div>

      <JobStats jobs={jobs} />

      <div className="panel">
        <div className="panel-head">
          <h2>Daftar Pekerjaan</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
            <Icon name="plus" size={16} />
            Buat Pekerjaan
          </button>
        </div>

        <div className="clients-toolbar jobs-toolbar">
          <div className="search-field">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Cari pekerjaan..."
              aria-label="Cari pekerjaan"
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
            {STATUS_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="select-field"
            aria-label="Filter klien"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all">Semua Klien</option>
            {activeClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company}
              </option>
            ))}
          </select>
          <select
            className="select-field"
            aria-label="Filter tim"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">Semua Tim</option>
            {activeTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <select
            className="select-field"
            aria-label="Filter kota"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">Semua Kota</option>
            {JOB_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetFilter}>
            Reset Filter
          </button>
        </div>

        {notice && (
          <div className="alert alert-info notice" role="status">
            <Icon name="check" size={16} />
            <span>{notice}</span>
          </div>
        )}

        {jobs.length === 0 ? (
          <EmptyState
            icon="jobs"
            title="Tidak ada pekerjaan"
            description="Coba buat pekerjaan baru untuk memulai."
            action={{ label: "+ Buat Pekerjaan", onClick: openAdd }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Tidak ada pekerjaan yang sesuai filter."
            description={`Tidak ada pekerjaan dengan status "${statusFilter === "all" ? "Semua" : JOB_STATUS_LABELS[statusFilter]}" yang cocok dengan pencarian Anda.`}
          />
        ) : (
          <>
            <div className="hide-mobile">
              <JobTable
                jobs={filtered}
                onView={(job) => navigate(`/jobs/${job.id}`)}
                onEdit={openEdit}
                onStatus={setStatusTarget}
              />
            </div>
            <div className="cards-grid hide-desktop">
              {filtered.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={(selected) => navigate(`/jobs/${selected.id}`)}
                  onEdit={openEdit}
                  onStatus={setStatusTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <JobModal
        open={modalOpen}
        job={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      {statusTarget && (
        <JobStatusModal
          job={statusTarget}
          onClose={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
        />
      )}
    </>
  );
}
