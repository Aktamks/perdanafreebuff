import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import {
  getClientById,
  getJobProgress,
  getTeamById,
  isValidCoordinate,
} from "../data/helpers";
import { INDONESIA_CENTER, INDONESIA_ZOOM } from "../data/coordinates";
import {
  formatDateTime,
  formatNumber,
  formatRelative,
  initialsOf,
} from "../utils/format";
import { JOB_STATUS_FILTERS, JOB_STATUS_LABELS } from "../utils/labels";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { JobStats } from "../components/jobs/JobStats";
import { StatCard } from "../components/StatCard";
import { UserAvatar } from "../components/UserAvatar";
import type { Job, JobStatus, Team } from "../types";

/** Escape HTML agar nama klien/tim aman dirender di dalam popup. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] as string,
  );
}

/** Warna marker Job per status (indikasi visual; status juga selalu ada di popup). */
const MARKER_CLASS: Record<JobStatus, string> = {
  draft: "marker-draft",
  scheduled: "marker-scheduled",
  in_progress: "marker-in-progress",
  paused: "marker-paused",
  completed: "marker-completed",
  cancelled: "marker-cancelled",
};

const STATUS_LEGEND: { status: JobStatus; label: string }[] = [
  { status: "scheduled", label: "Terjadwal" },
  { status: "in_progress", label: "Sedang Berjalan" },
  { status: "paused", label: "Dijeda" },
  { status: "completed", label: "Selesai" },
  { status: "cancelled", label: "Dibatalkan" },
];

/**
 * Status operasional tim (Tahap 3B) — DITURUNKAN dari koleksi jobs aktif,
 * bukan dari `Team.currentJobId`. Prioritas: in_progress → paused → scheduled → idle.
 */
type TeamOperationalStatus = "on_duty" | "paused" | "scheduled" | "idle";

const TEAM_STATUS_LABELS: Record<TeamOperationalStatus, string> = {
  on_duty: "Sedang Bertugas",
  paused: "Dijeda",
  scheduled: "Terjadwal",
  idle: "Tidak Ada Pekerjaan Aktif",
};

const TEAM_STATUS_FILTERS: {
  key: TeamOperationalStatus | "all";
  label: string;
}[] = [
  { key: "all", label: "Semua" },
  { key: "on_duty", label: "Sedang Bertugas" },
  { key: "paused", label: "Dijeda" },
  { key: "scheduled", label: "Terjadwal" },
  { key: "idle", label: "Tidak Ada Pekerjaan Aktif" },
];

const TEAM_MARKER_CLASS: Record<TeamOperationalStatus, string> = {
  on_duty: "team-marker-on-duty",
  paused: "team-marker-paused",
  scheduled: "team-marker-scheduled",
  idle: "team-marker-idle",
};

const TEAM_STATUS_BADGE: Record<TeamOperationalStatus, string> = {
  on_duty: "badge-blue",
  paused: "badge-yellow",
  scheduled: "badge-navy",
  idle: "badge-gray",
};

const TEAM_LEGEND: { status: TeamOperationalStatus; label: string }[] = [
  { status: "on_duty", label: "Sedang Bertugas" },
  { status: "paused", label: "Dijeda" },
  { status: "scheduled", label: "Terjadwal" },
  { status: "idle", label: "Tidak Ada Pekerjaan Aktif" },
];

/** Status operasional tim dari jobs tim tersebut (jobs = source of truth). */
function getTeamOperationalStatus(teamJobs: Job[]): TeamOperationalStatus {
  if (teamJobs.some((job) => job.status === "in_progress")) return "on_duty";
  if (teamJobs.some((job) => job.status === "paused")) return "paused";
  if (teamJobs.some((job) => job.status === "scheduled")) return "scheduled";
  return "idle";
}

/**
 * Pekerjaan berjalan tim: job `in_progress` dengan startedAt (fallback startDate)
 * terbaru — aturan deterministik bila ada lebih dari satu job berjalan.
 */
function getActiveJobForTeam(teamJobs: Job[]): Job | undefined {
  const running = teamJobs.filter((job) => job.status === "in_progress");
  if (running.length === 0) return undefined;
  return [...running].sort((a, b) =>
    (b.startedAt ?? b.startDate).localeCompare(a.startedAt ?? a.startDate),
  )[0];
}

type StatusFilter = "all" | JobStatus;

/** Ringkasan tim dari data aktual (derived — bukan angka hard-coded). */
function TeamMonitoringStats({ teams }: { teams: Team[] }) {
  const { jobs } = useJobs();
  const onDuty = teams.filter(
    (team) =>
      getTeamOperationalStatus(jobs.filter((job) => job.teamId === team.id)) ===
      "on_duty",
  ).length;
  const paused = teams.filter(
    (team) =>
      getTeamOperationalStatus(jobs.filter((job) => job.teamId === team.id)) ===
      "paused",
  ).length;
  const scheduled = teams.filter(
    (team) =>
      getTeamOperationalStatus(jobs.filter((job) => job.teamId === team.id)) ===
      "scheduled",
  ).length;
  const idle = teams.length - onDuty - paused - scheduled;

  return (
    <div className="stats-grid">
      <StatCard
        label="Total Tim"
        value={teams.length}
        sub="terlihat di peta"
        icon="teams"
        color="navy"
      />
      <StatCard
        label="Sedang Bertugas"
        value={onDuty}
        sub="pekerjaan berjalan"
        icon="play"
        color="blue"
      />
      <StatCard
        label="Dijeda"
        value={paused}
        sub="pekerjaan dijeda"
        icon="pause"
        color="red"
      />
      <StatCard
        label="Terjadwal"
        value={scheduled}
        sub="pekerjaan terjadwal"
        icon="calendar"
        color="green"
      />
      <StatCard
        label="Tidak Ada Pekerjaan"
        value={idle}
        sub="tanpa pekerjaan aktif"
        icon="info"
        color="navy"
      />
    </div>
  );
}

/* ======================================================================
 * Job Detail Panel — panel samping yang menampilkan detail job yang
 * dipilih dari marker di peta. Hanya bisa dibuka untuk job yang masuk
 * visibleJobs (dilindungi ownership).
 * ====================================================================== */
function JobDetailPanel({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const { clients } = useClients();
  const { teams } = useTeams();
  const client = getClientById(clients, job.clientId);
  const team = getTeamById(teams, job.teamId);
  const progress = getJobProgress(job.distributedBrochures, job.targetBrochures);
  const detailHref = `/#/jobs/${job.id}`;

  /** Timeline hanya menggunakan timestamp yang benar-benar tersedia. */
  const timelineEvents: { date: string; label: string }[] = [];
  if (job.createdAt) {
    timelineEvents.push({ date: job.createdAt, label: "Dibuat" });
  }
  if (job.startedAt) {
    timelineEvents.push({ date: job.startedAt, label: "Mulai Pekerjaan" });
  }
  if (job.status === "in_progress" || job.status === "paused") {
    if (job.updatedAt) {
      timelineEvents.push({ date: job.updatedAt, label: "Update Terakhir" });
    }
  }
  if (job.completedAt) {
    timelineEvents.push({ date: job.completedAt, label: "Selesai" });
  }
  timelineEvents.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="job-detail-panel">
      <div className="job-detail-panel-head">
        <div>
          <h3>{job.title}</h3>
          <p className="job-detail-panel-id">{job.id}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onClose}
          aria-label="Tutup detail pekerjaan"
        >
          <Icon name="info" size={18} />
        </button>
      </div>

      <div className="job-detail-panel-body">
        {/* Status */}
        <div className="detail-section">
          <div className="detail-row-head">
            <span className="detail-row-label">Status</span>
            <StatusBadge status={job.status} />
          </div>
        </div>

        {/* Progress */}
        <div className="detail-section">
          <span className="detail-row-label">Progress</span>
          <div className="detail-progress-bar">
            <div className="detail-progress-track">
              <div
                className="detail-progress-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="detail-progress-text">
              <span>{progress}%</span>
              <span>
                {formatNumber(job.distributedBrochures)} /{" "}
                {formatNumber(job.targetBrochures)} brosur
              </span>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className="detail-section detail-section-compact">
          <div className="detail-row">
            <span className="detail-row-label">Client</span>
            <span>{client?.company ?? "Client tidak ditemukan"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">Tim</span>
            <span>{team?.name ?? "Team tidak ditemukan"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">Lokasi</span>
            <span>{job.city}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">Target</span>
            <span>{formatNumber(job.targetBrochures)} brosur</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">Tersalurkan</span>
            <span>{formatNumber(job.distributedBrochures)} brosur</span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="detail-section detail-section-compact">
          <div className="detail-row">
            <span className="detail-row-label">Mulai</span>
            <span>{job.startedAt ? formatDateTime(job.startedAt) : "Belum tersedia"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-row-label">Selesai</span>
            <span>{job.completedAt ? formatDateTime(job.completedAt) : "Belum tersedia"}</span>
          </div>
        </div>

        {/* Operational notes */}
        {job.operationalNotes && (
          <div className="detail-section">
            <span className="detail-row-label">Catatan Operasional</span>
            <p className="detail-notes">{job.operationalNotes}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="detail-section">
          <span className="detail-row-label">Aktivitas</span>
          {timelineEvents.length === 0 ? (
            <p className="detail-notes">Belum ada aktivitas pekerjaan.</p>
          ) : (
            <ul className="detail-timeline">
              {timelineEvents.map((event, idx) => (
                <li key={idx} className="detail-timeline-item">
                  <span className="detail-timeline-dot" />
                  <div className="detail-timeline-body">
                    <span className="detail-timeline-label">{event.label}</span>
                    <span className="detail-timeline-date">
                      {formatDateTime(event.date)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="detail-section">
          <a href={detailHref} className="btn btn-primary btn-sm detail-panel-cta">
            Buka Halaman Pekerjaan
          </a>
        </div>
      </div>
    </div>
  );
}

/* ======================================================================
 * MapMonitoring — halaman utama peta monitoring.
 * ====================================================================== */
export function MapMonitoring() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { clients } = useClients();
  const { teams } = useTeams();

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const jobLayerRef = useRef<L.LayerGroup | null>(null);
  const teamLayerRef = useRef<L.LayerGroup | null>(null);
  const lastFitKeyRef = useRef<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [teamStatusFilter, setTeamStatusFilter] = useState<
    TeamOperationalStatus | "all"
  >("all");
  const [mapError, setMapError] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const hasActiveFilter = useMemo(
    () =>
      search.trim() !== "" ||
      statusFilter !== "all" ||
      teamFilter !== "all" ||
      teamStatusFilter !== "all",
    [search, statusFilter, teamFilter, teamStatusFilter],
  );

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setTeamFilter("all");
    setTeamStatusFilter("all");
  }

  /* ---- Ownership filter (WAJIB sebelum filter lain) ---- */
  const visibleJobs = useMemo(() => {
    if (isAdmin) return jobs;
    if (user?.role === "field_team") {
      return jobs.filter((job) => job.teamId === user.teamId);
    }
    if (user?.role === "client") {
      return jobs.filter((job) => job.clientId === user.clientId);
    }
    return [];
  }, [jobs, isAdmin, user?.role, user?.teamId, user?.clientId]);

  /* ---- Search + status filter ---- */
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleJobs.filter((job) => {
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
  }, [visibleJobs, search, statusFilter, clients, teams]);

  const markerJobs = useMemo(
    () =>
      filteredJobs.filter(
        (job): job is Job & { latitude: number; longitude: number } =>
          isValidCoordinate(job.latitude, job.longitude),
      ),
    [filteredJobs],
  );

  /* ---- Auto-clear selectedJobId bila tidak lagi masuk filteredJobs ---- */
  useEffect(() => {
    if (selectedJobId && !filteredJobs.some((j) => j.id === selectedJobId)) {
      setSelectedJobId(null);
    }
  }, [selectedJobId, filteredJobs]);

  /* ---- Selected Job data (hanya dari jobs = single source of truth) ---- */
  const selectedJob = useMemo(
    () => (selectedJobId ? jobs.find((j) => j.id === selectedJobId) ?? null : null),
    [selectedJobId, jobs],
  );

  const detailHref = (job: Job) =>
    `#/${isAdmin ? "jobs" : "my-jobs"}/${job.id}`;

  /* ---- Popup HTML ---- */
  function popupHtml(job: Job): string {
    const client = getClientById(clients, job.clientId);
    const team = getTeamById(teams, job.teamId);
    const progress = getJobProgress(
      job.distributedBrochures,
      job.targetBrochures,
    );
    return `
      <div class="job-popup">
        <strong class="job-popup-title">${escapeHtml(job.title)}</strong>
        <dl class="job-popup-rows">
          <div><dt>Client</dt><dd>${escapeHtml(client?.company ?? "-")}</dd></div>
          <div><dt>Tim</dt><dd>${escapeHtml(team?.name ?? "-")}</dd></div>
          <div><dt>Lokasi</dt><dd>${escapeHtml(job.city)}</dd></div>
          <div><dt>Status</dt><dd>${JOB_STATUS_LABELS[job.status]}</dd></div>
          <div><dt>Progress</dt><dd>${formatNumber(job.distributedBrochures)} / ${formatNumber(job.targetBrochures)} brosur · ${progress}%</dd></div>
        </dl>
        <a href="${detailHref(job)}" class="btn btn-outline btn-sm">Lihat Detail</a>
      </div>`;
  }

  /* ---- Team filters ---- */
  const visibleTeams = useMemo(() => {
    if (isAdmin) return teams;
    if (user?.role === "field_team") {
      return teams.filter((team) => team.id === user.teamId);
    }
    if (user?.role === "client") {
      const relatedTeamIds = new Set(visibleJobs.map((job) => job.teamId));
      return teams.filter((team) => relatedTeamIds.has(team.id));
    }
    return [];
  }, [teams, isAdmin, user?.role, user?.teamId, visibleJobs]);

  const filteredTeams = useMemo(
    () =>
      visibleTeams.filter((team) => {
        if (teamFilter !== "all" && team.id !== teamFilter) return false;
        if (teamStatusFilter === "all") return true;
        const teamJobs = jobs.filter((job) => job.teamId === team.id);
        return getTeamOperationalStatus(teamJobs) === teamStatusFilter;
      }),
    [visibleTeams, teamFilter, teamStatusFilter, jobs],
  );

  const markerTeams = useMemo(
    () =>
      filteredTeams.filter(
        (team): team is Team & { latitude: number; longitude: number } =>
          isValidCoordinate(team.latitude, team.longitude),
      ),
    [filteredTeams],
  );

  function teamPopupHtml(team: Team): string {
    const teamJobs = jobs.filter((job) => job.teamId === team.id);
    const status = getTeamOperationalStatus(teamJobs);
    const activeJob = getActiveJobForTeam(teamJobs);
    const client = activeJob
      ? getClientById(clients, activeJob.clientId)
      : undefined;
    const progress = activeJob
      ? getJobProgress(activeJob.distributedBrochures, activeJob.targetBrochures)
      : 0;
    const detailLink = isAdmin
      ? `<a href="#/teams/${team.id}" class="btn btn-outline btn-sm">Lihat Tim</a>`
      : "";
    return `
      <div class="job-popup team-popup">
        <strong class="job-popup-title">${escapeHtml(team.name)}</strong>
        <dl class="job-popup-rows">
          <div><dt>Status</dt><dd>${TEAM_STATUS_LABELS[status]}</dd></div>
          <div><dt>Pekerjaan Aktif</dt><dd>${activeJob ? escapeHtml(activeJob.title) : "Tidak ada"}</dd></div>
          <div><dt>Client</dt><dd>${activeJob && client ? escapeHtml(client.company) : "—"}</dd></div>
          ${activeJob ? `<div><dt>Progress</dt><dd>${formatNumber(activeJob.distributedBrochures)} / ${formatNumber(activeJob.targetBrochures)} · ${progress}%</dd></div>` : ""}
          <div><dt>Lokasi</dt><dd>${escapeHtml(team.city)}</dd></div>
        </dl>
        ${detailLink}
      </div>`;
  }

  /* ===== Map lifecycle: init sekali ===== */
  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;
    lastFitKeyRef.current = null;

    let map: L.Map | null = null;
    try {
      map = L.map(el, {
        center: INDONESIA_CENTER,
        zoom: INDONESIA_ZOOM,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      jobLayerRef.current = L.layerGroup().addTo(map);
      teamLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      const timer = window.setTimeout(() => map?.invalidateSize(), 200);

      return () => {
        window.clearTimeout(timer);
        map?.remove();
        mapRef.current = null;
        jobLayerRef.current = null;
        teamLayerRef.current = null;
      };
    } catch {
      setMapError(true);
      return () => {
        map?.remove();
        mapRef.current = null;
        jobLayerRef.current = null;
        teamLayerRef.current = null;
      };
    }
  }, []);

  /* ===== Marker lifecycle: rebuild dari filtered data ===== */
  useEffect(() => {
    const map = mapRef.current;
    const jobLayer = jobLayerRef.current;
    const teamLayer = teamLayerRef.current;
    if (!map || !jobLayer || !teamLayer) return;

    jobLayer.clearLayers();
    teamLayer.clearLayers();

    markerJobs.forEach((job) => {
      const isSelected = job.id === selectedJobId;
      const icon = L.divIcon({
        className: `job-marker-wrap${isSelected ? " job-marker-selected" : ""}`,
        html: `<span class="job-marker ${MARKER_CLASS[job.status]}${isSelected ? " job-marker-active" : ""}" title="${escapeHtml(job.title)}"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([job.latitude, job.longitude], { icon })
        .bindPopup(popupHtml(job), { minWidth: 240, maxWidth: 280 })
        .addTo(jobLayer)
        .on("click", () => setSelectedJobId(job.id));
    });

    markerTeams.forEach((team) => {
      const status = getTeamOperationalStatus(
        jobs.filter((job) => job.teamId === team.id),
      );
      const icon = L.divIcon({
        className: "team-marker-wrap",
        html: `<span class="team-marker ${TEAM_MARKER_CLASS[status]}" title="${escapeHtml(team.name)}">${escapeHtml(initialsOf(team.name))}</span>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([team.latitude, team.longitude], { icon })
        .bindPopup(teamPopupHtml(team), { minWidth: 240, maxWidth: 280 })
        .addTo(teamLayer);
    });

    /* Fit bounds */
    const positions: [number, number][] = [
      ...markerJobs.map((job) => [job.latitude, job.longitude] as [number, number]),
      ...markerTeams.map((team) => [team.latitude, team.longitude] as [number, number]),
    ];
    const fitKey = positions
      .map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
      .join("|");
    if (fitKey !== lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
      if (positions.length === 1) {
        map.setView(positions[0], 13);
      } else if (positions.length > 1) {
        map.fitBounds(L.latLngBounds(positions), {
          padding: [30, 30],
          maxZoom: 14,
        });
      } else {
        map.setView(INDONESIA_CENTER, INDONESIA_ZOOM);
      }
    }
  }, [markerJobs, markerTeams, clients, teams, jobs, selectedJobId]);

  const totalMarkers = markerJobs.length + markerTeams.length;

  return (
    <>
      <div className="page-head">
        <h1>Peta Monitoring</h1>
        <p>Pantau lokasi pekerjaan dan tim lapangan pada peta interaktif.</p>
      </div>

      <JobStats jobs={filteredJobs} showCancelled={false} />

      {visibleTeams.length > 0 && <TeamMonitoringStats teams={filteredTeams} />}

      <div className="panel">
        <div className="panel-head">
          <h2>Peta Lokasi Pekerjaan &amp; Tim</h2>
          <span className="badge badge-gray">
            {totalMarkers} marker · {filteredJobs.length} pekerjaan ·{" "}
            {filteredTeams.length} tim
          </span>
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
            aria-label="Filter status pekerjaan"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            {JOB_STATUS_FILTERS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
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
            {visibleTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          {isAdmin && (
            <select
              className="select-field"
              aria-label="Filter status tim"
              value={teamStatusFilter}
              onChange={(e) =>
                setTeamStatusFilter(
                  e.target.value as TeamOperationalStatus | "all",
                )
              }
            >
              {TEAM_STATUS_FILTERS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {hasActiveFilter && (
            <button
              type="button"
              className="btn btn-outline btn-sm reset-filter-btn"
              onClick={resetFilters}
              aria-label="Reset semua filter"
            >
              <Icon name="info" size={14} />
              Reset Filter
            </button>
          )}
        </div>

        <div className="map-with-detail">
          <div className="map-body-col">
            {mapError ? (
              <div className="map-error">
                <div className="alert alert-red">
                  <Icon name="info" size={16} />
                  <span>Peta tidak dapat dimuat.</span>
                </div>
              </div>
            ) : (
              <div className="map-container" ref={mapElRef} aria-label="Peta lokasi pekerjaan dan tim" />
            )}

            {!mapError && totalMarkers === 0 && (
              <div className="map-empty">
                <EmptyState
                  icon="search"
                  title="Tidak ada pekerjaan pada filter ini."
                  description="Ubah filter status, tim, atau pencarian untuk melihat pekerjaan lain di peta."
                />
              </div>
            )}

            {!mapError && (
              <div className="map-legend">
                <span className="legend-group">
                  <strong>Pekerjaan</strong>
                </span>
                {STATUS_LEGEND.map((item) => (
                  <span key={item.status} className="legend-item">
                    <i className={`dot ${MARKER_CLASS[item.status]}`} />
                    {item.label}
                  </span>
                ))}
                <span className="legend-group">
                  <strong>Tim Lapangan</strong>
                </span>
                {TEAM_LEGEND.map((item) => (
                  <span key={item.status} className="legend-item">
                    <i className={`dot ${TEAM_MARKER_CLASS[item.status]}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {selectedJob && (
            <JobDetailPanel
              job={selectedJob}
              onClose={() => setSelectedJobId(null)}
            />
          )}
        </div>
      </div>

      {visibleTeams.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <h2>Tim Lapangan</h2>
            <span className="badge badge-gray">{visibleTeams.length} tim</span>
          </div>
          <ul className="team-active-list">
            {visibleTeams.map((team) => {
              const teamJobs = jobs.filter((job) => job.teamId === team.id);
              const status = getTeamOperationalStatus(teamJobs);
              const activeJob = getActiveJobForTeam(teamJobs);
              return (
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
                      <p>
                        {activeJob ? activeJob.title : "Tidak ada pekerjaan aktif"}
                      </p>
                    </div>
                    <span className={`badge ${TEAM_STATUS_BADGE[status]}`}>
                      {TEAM_STATUS_LABELS[status]}
                    </span>
                  </div>
                  <div className="team-active-meta">
                    <Icon name="map" size={14} />
                    {team.city} <span>· {formatRelative(team.lastActiveAt)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
