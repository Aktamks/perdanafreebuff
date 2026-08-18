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
import { formatNumber, formatRelative, initialsOf } from "../utils/format";
import { JOB_STATUS_FILTERS, JOB_STATUS_LABELS } from "../utils/labels";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
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

export function MapMonitoring() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { clients } = useClients();
  const { teams } = useTeams();

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const jobLayerRef = useRef<L.LayerGroup | null>(null);
  const teamLayerRef = useRef<L.LayerGroup | null>(null);
  /**
   * Signature koordinat marker terakhir yang sudah di-fit. Fit bounds hanya
   * dijalankan saat SET POSISI marker berubah — bukan saat data konten berubah
   * (progress, catatan, nama) agar peta tidak zoom ulang pada perubahan kecil
   * yang tidak relevan (spec 3C).
   */
  const lastFitKeyRef = useRef<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [teamStatusFilter, setTeamStatusFilter] = useState<
    TeamOperationalStatus | "all"
  >("all");
  const [mapError, setMapError] = useState(false);

  const isAdmin = user?.role === "admin";

  /** Apakah ada filter/search yang aktif (untuk tombol Reset Filter). */
  const hasActiveFilter = useMemo(
    () =>
      search.trim() !== "" ||
      statusFilter !== "all" ||
      teamFilter !== "all" ||
      teamStatusFilter !== "all",
    [search, statusFilter, teamFilter, teamStatusFilter],
  );

  /** Reset semua filter/search ke default. */
  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setTeamFilter("all");
    setTeamStatusFilter("all");
  }

  /**
   * Filter kepemilikan (WAJIB sebelum filter lain):
   * admin → semua job; field_team → job.teamId === user.teamId;
   * client → job.clientId === user.clientId. Marker HANYA dibuat dari visibleJobs.
   */
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

  // urutan: jobs → ownership → search → status → markers
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

  // Type predicate: setelah lolos isValidCoordinate, koordinat dijamin number
  // (null/NaN/out-of-range ditolak) sehingga pemakaian di marker aman tanpa `any`.
  const markerJobs = useMemo(
    () =>
      filteredJobs.filter(
        (job): job is Job & { latitude: number; longitude: number } =>
          isValidCoordinate(job.latitude, job.longitude),
      ),
    [filteredJobs],
  );

  /** Route detail: admin → /jobs/:id (CRUD), team/client → /my-jobs/:id. */
  const detailHref = (job: Job) =>
    `#/${isAdmin ? "jobs" : "my-jobs"}/${job.id}`;

  /** Konten popup Job: nama job, client, tim, lokasi, status, progress, tombol detail. */
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

  /**
   * Tim yang boleh dilihat role: admin semua tim; field_team hanya tim sendiri;
   * client hanya tim yang mengerjakan job miliknya (via relasi Job.clientId).
   */
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

  // urutan: teams → ownership → filter tim → filter status tim → markers
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

  /** Konten popup Team: nama, status, pekerjaan aktif, client, progress, lokasi. */
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

  // ===== Lifecycle map: init sekali, cleanup saat unmount =====
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
      // Dua layer terpisah (Job & Team) agar lifecycle marker bersih per jenis.
      jobLayerRef.current = L.layerGroup().addTo(map);
      teamLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Pastikan ukuran peta benar setelah layout siap (hindari peta abu-abu).
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

  // ===== Lifecycle marker: bersihkan layer lalu buat ulang dari data terfilter =====
  useEffect(() => {
    const map = mapRef.current;
    const jobLayer = jobLayerRef.current;
    const teamLayer = teamLayerRef.current;
    if (!map || !jobLayer || !teamLayer) return;

    // Marker lama dibersihkan dulu — jangan menumpuk saat filter/search berubah.
    jobLayer.clearLayers();
    teamLayer.clearLayers();

    markerJobs.forEach((job) => {
      const icon = L.divIcon({
        className: "job-marker-wrap",
        html: `<span class="job-marker ${MARKER_CLASS[job.status]}" title="${escapeHtml(job.title)}"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([job.latitude, job.longitude], { icon })
        .bindPopup(popupHtml(job), { minWidth: 240, maxWidth: 280 })
        .addTo(jobLayer);
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

    // Fit bounds mencakup SEMUA marker terlihat (Job + Team); fallback Indonesia.
    // Hanya dijalankan saat set posisi berubah (lihat lastFitKeyRef) — perubahan
    // konten saja (status/progress/catatan/nama) tetap memperbarui marker & popup,
    // tetapi tidak me-zoom ulang peta yang sedang dilihat user.
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
  }, [markerJobs, markerTeams, clients, teams, jobs]);

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
