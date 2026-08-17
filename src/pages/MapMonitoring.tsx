import { useEffect, useMemo, useRef, useState } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import {
  getClientById,
  getJobById,
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
import { UserAvatar } from "../components/UserAvatar";
import { EntityStatusBadge } from "../components/StatusBadge";
import type { Job, JobStatus } from "../types";

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

/** Warna marker per status (indikasi visual; status juga selalu ada di popup). */
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

type StatusFilter = "all" | JobStatus;

export function MapMonitoring() {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { clients } = useClients();
  const { teams } = useTeams();

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mapError, setMapError] = useState(false);

  /**
   * Filter kepemilikan (WAJIB sebelum filter lain):
   * admin → semua job; field_team → job.teamId === user.teamId;
   * client → job.clientId === user.clientId. Marker HANYA dibuat dari visibleJobs.
   */
  const visibleJobs = useMemo(() => {
    if (user?.role === "admin") return jobs;
    if (user?.role === "field_team") {
      return jobs.filter((job) => job.teamId === user.teamId);
    }
    if (user?.role === "client") {
      return jobs.filter((job) => job.clientId === user.clientId);
    }
    return [];
  }, [jobs, user?.role, user?.teamId, user?.clientId]);

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

  const markerJobs = useMemo(
    () =>
      filteredJobs.filter((job) =>
        isValidCoordinate(job.latitude, job.longitude),
      ),
    [filteredJobs],
  );

  const isAdmin = user?.role === "admin";
  /** Route detail: admin → /jobs/:id (CRUD), team/client → /my-jobs/:id. */
  const detailHref = (job: Job) =>
    `#/${isAdmin ? "jobs" : "my-jobs"}/${job.id}`;

  /** Konten popup: nama job, client, tim, lokasi, status, progress, tombol detail. */
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

  // ===== Lifecycle map: init sekali, cleanup saat unmount =====
  useEffect(() => {
    const el = mapElRef.current;
    if (!el) return;

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
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      // Pastikan ukuran peta benar setelah layout siap (hindari peta abu-abu).
      const timer = window.setTimeout(() => map?.invalidateSize(), 200);

      return () => {
        window.clearTimeout(timer);
        map?.remove();
        mapRef.current = null;
        layerRef.current = null;
      };
    } catch {
      setMapError(true);
      return () => {
        map?.remove();
        mapRef.current = null;
        layerRef.current = null;
      };
    }
  }, []);

  // ===== Lifecycle marker: bersihkan layer lalu buat ulang dari filteredJobs =====
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    // Marker lama dibersihkan dulu — jangan menumpuk saat filter/search berubah.
    layer.clearLayers();

    markerJobs.forEach((job) => {
      const icon = L.divIcon({
        className: "job-marker-wrap",
        html: `<span class="job-marker ${MARKER_CLASS[job.status]}" title="${escapeHtml(job.title)}"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([job.latitude, job.longitude], { icon })
        .bindPopup(popupHtml(job), { minWidth: 240, maxWidth: 280 })
        .addTo(layer);
    });

    if (markerJobs.length === 1) {
      map.setView([markerJobs[0].latitude, markerJobs[0].longitude], 13);
    } else if (markerJobs.length > 1) {
      map.fitBounds(
        L.latLngBounds(
          markerJobs.map((job) => [job.latitude, job.longitude] as [number, number]),
        ),
        { padding: [30, 30], maxZoom: 14 },
      );
    } else {
      map.setView(INDONESIA_CENTER, INDONESIA_ZOOM);
    }
  }, [markerJobs, clients, teams]);

  // Tim aktif: hanya role yang berhak — admin semua tim, tim hanya tim sendiri,
  // client tidak melihat daftar tim (hindari kebocoran data via panel samping).
  const visibleTeams = useMemo(() => {
    if (user?.role === "admin") return teams;
    if (user?.role === "field_team") {
      return teams.filter((team) => team.id === user.teamId);
    }
    return [];
  }, [teams, user?.role, user?.teamId]);

  return (
    <>
      <div className="page-head">
        <h1>Peta Monitoring</h1>
        <p>Pantau lokasi pekerjaan distribusi pada peta interaktif.</p>
      </div>

      <JobStats jobs={filteredJobs} showCancelled={false} />

      <div className="panel">
        <div className="panel-head">
          <h2>Peta Lokasi Pekerjaan</h2>
          <span className="badge badge-gray">
            {markerJobs.length} marker · {filteredJobs.length} pekerjaan
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

        {mapError ? (
          <div className="map-error">
            <div className="alert alert-red">
              <Icon name="info" size={16} />
              <span>Peta tidak dapat dimuat.</span>
            </div>
          </div>
        ) : (
          <div className="map-container" ref={mapElRef} aria-label="Peta lokasi pekerjaan" />
        )}

        {!mapError && markerJobs.length === 0 && (
          <div className="map-empty">
            <EmptyState
              icon="search"
              title="Tidak ada pekerjaan pada filter ini."
              description="Ubah filter status atau pencarian untuk melihat pekerjaan lain di peta."
            />
          </div>
        )}

        {!mapError && (
          <div className="map-legend">
            {STATUS_LEGEND.map((item) => (
              <span key={item.status} className="legend-item">
                <i className={`dot ${MARKER_CLASS[item.status]}`} />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {visibleTeams.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <h2>Tim Aktif</h2>
            <span className="badge badge-gray">{visibleTeams.length} tim</span>
          </div>
          <ul className="team-active-list">
            {visibleTeams.map((team) => (
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
                      {getJobById(jobs, team.currentJobId)?.title ??
                        "Belum ada pekerjaan"}
                    </p>
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
        </div>
      )}
    </>
  );
}
