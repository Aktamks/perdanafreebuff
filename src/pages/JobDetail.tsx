import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useJobs } from "../context/JobsContext";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import { getClientById, getJobProgress, getTeamById } from "../data/helpers";
import { formatDate, formatNumber } from "../utils/format";
import { METHOD_LABELS } from "../utils/labels";
import { Icon } from "../components/icons";
import { JobModal } from "../components/jobs/JobModal";
import { JOB_TRANSITIONS, JobStatusModal } from "../components/jobs/JobStatusModal";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import type { Job, JobInput, JobStatus } from "../types";

export function JobDetail() {
  const { id } = useParams();
  const { getJob, updateJob, changeJobStatus } = useJobs();
  const { clients } = useClients();
  const { teams } = useTeams();
  const job = getJob(id);

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!job) return <Navigate to="/jobs" replace />;
  const currentJob: Job = job;

  const client = getClientById(clients, currentJob.clientId);
  const team = getTeamById(teams, currentJob.teamId);
  const progress = getJobProgress(
    currentJob.distributedBrochures,
    currentJob.targetBrochures,
  );
  const remaining = Math.max(
    currentJob.targetBrochures - currentJob.distributedBrochures,
    0,
  );
  const canChangeStatus = JOB_TRANSITIONS[currentJob.status].length > 0;

  function handleSave(values: JobInput) {
    updateJob(currentJob.id, values);
    setNotice("Perubahan pekerjaan berhasil disimpan.");
    setEditOpen(false);
  }

  function handleStatusConfirm(status: JobStatus) {
    changeJobStatus(currentJob.id, status);
    setNotice("Status pekerjaan berhasil diperbarui.");
    setStatusOpen(false);
  }

  return (
    <>
      <div className="page-head">
        <Link to="/jobs" className="back-link">
          <Icon name="arrow-right" size={15} />
          Kembali ke Pekerjaan
        </Link>
      </div>

      <div className="panel">
        <div className="client-detail-head job-detail-page-head">
          <div className="client-detail-title">
            <h1>{currentJob.title}</h1>
            <p>
              {currentJob.id} · {METHOD_LABELS[currentJob.distributionMethod]}
            </p>
          </div>
          <div className="client-detail-actions">
            <StatusBadge status={currentJob.status} />
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
              disabled={!canChangeStatus}
              onClick={() => setStatusOpen(true)}
            >
              Ubah Status
            </button>
          </div>
        </div>

        {notice && (
          <div className="alert alert-info notice" role="status">
            <Icon name="check" size={16} />
            <span>{notice}</span>
          </div>
        )}
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Informasi Pekerjaan</h2>
          </div>
          <dl className="detail-list job-info-list">
            <div>
              <dt>Lokasi</dt>
              <dd>{currentJob.address}</dd>
            </div>
            <div>
              <dt>Kota</dt>
              <dd>{currentJob.city}</dd>
            </div>
            <div>
              <dt>Tanggal Pekerjaan</dt>
              <dd>{formatDate(currentJob.startDate)}</dd>
            </div>
            <div>
              <dt>Metode Distribusi</dt>
              <dd>{METHOD_LABELS[currentJob.distributionMethod]}</dd>
            </div>
            <div>
              <dt>Target Brosur</dt>
              <dd>{formatNumber(currentJob.targetBrochures)} brosur</dd>
            </div>
            <div>
              <dt>Brosur Tersalurkan</dt>
              <dd>{formatNumber(currentJob.distributedBrochures)} brosur</dd>
            </div>
            <div>
              <dt>Sisa Target</dt>
              <dd>{formatNumber(remaining)} brosur</dd>
            </div>
            <div>
              <dt>Catatan</dt>
              <dd>{currentJob.description || "Tidak ada catatan."}</dd>
            </div>
          </dl>

          <div className="job-detail-progress">
            <div className="progress-label">
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>
            <ProgressBar value={progress} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Klien</h2>
          </div>
          <dl className="detail-list job-info-list">
            <div>
              <dt>Nama</dt>
              <dd>{client?.name ?? "-"}</dd>
            </div>
            <div>
              <dt>Perusahaan</dt>
              <dd>{client?.company ?? "-"}</dd>
            </div>
            <div>
              <dt>Kontak</dt>
              <dd>{client?.email ?? "-"}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{client?.whatsapp ?? "-"}</dd>
            </div>
          </dl>

          <div className="panel-head">
            <h2>Tim Lapangan</h2>
          </div>
          <dl className="detail-list job-info-list">
            <div>
              <dt>Tim</dt>
              <dd>{team?.name ?? "-"}</dd>
            </div>
            <div>
              <dt>Ketua Tim</dt>
              <dd>{team?.leaderName ?? "-"}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{team?.whatsapp ?? "-"}</dd>
            </div>
            <div>
              <dt>Kota</dt>
              <dd>{team?.city ?? "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <JobModal
        open={editOpen}
        job={currentJob}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      {statusOpen && (
        <JobStatusModal
          job={currentJob}
          onClose={() => setStatusOpen(false)}
          onConfirm={handleStatusConfirm}
        />
      )}
    </>
  );
}
