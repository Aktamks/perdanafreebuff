import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { JobDetail as JobDetailPanel } from "../components/JobDetail";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { JobProgressModal } from "../components/jobs/JobProgressModal";
import { Icon } from "../components/icons";
import { ProgressBar } from "../components/ProgressBar";
import { StatusBadge } from "../components/StatusBadge";
import { getJobProgress } from "../data/helpers";
import { formatDateTime, formatNumber } from "../utils/format";
import { JOB_STATUS_LABELS } from "../utils/labels";
import type { Job, JobStatus } from "../types";

type ConfirmAction = "start" | "pause" | "resume" | "complete";

const STATUS_HINTS: Record<JobStatus, string> = {
  draft: "Pekerjaan masih draft.",
  scheduled: "Menunggu dimulai oleh tim lapangan.",
  in_progress: "Pekerjaan sedang berjalan.",
  paused: "Pekerjaan dijeda sementara.",
  completed: "Pekerjaan telah selesai.",
  cancelled: "Pekerjaan dibatalkan.",
};

export function MyJobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    getJob,
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    updateJobProgress,
    updateOperationalNotes,
  } = useJobs();
  const job = getJob(id);

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sinkronkan draft catatan setiap kali job berubah (mis. setelah simpan).
  useEffect(() => {
    setNotesDraft(job?.operationalNotes ?? "");
  }, [job?.operationalNotes]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const isTeam = user?.role === "field_team";
  const entityId = isTeam ? user?.teamId : user?.clientId;

  if (!job || !entityId) return <Navigate to="/my-jobs" replace />;

  // AUTHORIZATION — cek kepemilikan di level page, bukan hanya UI:
  // tim hanya boleh membuka job dengan teamId miliknya; klien hanya clientId miliknya.
  const owned = isTeam ? job.teamId === entityId : job.clientId === entityId;
  if (!owned) return <Navigate to="/my-jobs" replace />;
  const currentJob: Job = job;

  const progress = getJobProgress(
    currentJob.distributedBrochures,
    currentJob.targetBrochures,
  );
  const teamCanOperate = isTeam && currentJob.teamId === user?.teamId;
  const isOperationalStatus = ["in_progress", "paused"].includes(currentJob.status);
  const isTerminal =
    currentJob.status === "completed" || currentJob.status === "cancelled";

  /** Guard mutasi: role + ownership wajib lulus. */
  function ensureOperationalAccess(): boolean {
    if (user?.role !== "field_team" || currentJob.teamId !== user.teamId) {
      setError("Akses tidak diizinkan.");
      return false;
    }
    return true;
  }

  function requireStatus(allowed: JobStatus[]): boolean {
    if (!allowed.includes(currentJob.status)) {
      setError("Status pekerjaan tidak memungkinkan tindakan ini.");
      return false;
    }
    return true;
  }

  function handleStart() {
    if (!ensureOperationalAccess()) return;
    if (!requireStatus(["scheduled"])) return;
    setConfirm("start");
  }

  function handlePause() {
    if (!ensureOperationalAccess()) return;
    if (!requireStatus(["in_progress"])) return;
    setConfirm("pause");
  }

  function handleResume() {
    if (!ensureOperationalAccess()) return;
    if (!requireStatus(["paused"])) return;
    setConfirm("resume");
  }

  function handleComplete() {
    if (!ensureOperationalAccess()) return;
    if (!requireStatus(["in_progress", "paused"])) return;
    setConfirm("complete");
  }

  function handleProgressSave(value: number) {
    if (!ensureOperationalAccess()) return;
    const ok = updateJobProgress(currentJob.id, value);
    if (!ok) {
      setError("Gagal memperbarui progress.");
      return;
    }
    setProgressOpen(false);
    setNotice("Progress berhasil diperbarui.");
  }

  function handleNotesSave() {
    if (!ensureOperationalAccess()) return;
    if (!requireStatus(["in_progress", "paused"])) return;
    updateOperationalNotes(currentJob.id, notesDraft.trim());
    setNotice("Catatan operasional disimpan.");
  }

  function confirmAction() {
    if (!confirm) return;
    if (confirm === "start") {
      startJob(currentJob.id);
      setNotice("Pekerjaan dimulai. Status menjadi Sedang Berjalan.");
    } else if (confirm === "pause") {
      pauseJob(currentJob.id);
      setNotice("Pekerjaan dijeda.");
    } else if (confirm === "resume") {
      resumeJob(currentJob.id);
      setNotice("Pekerjaan dilanjutkan kembali.");
    } else {
      completeJob(currentJob.id);
      setNotice("Pekerjaan diselesaikan.");
    }
    setConfirm(null);
  }

  const confirmContent: Record<
    ConfirmAction,
    { title: string; description: string; confirmLabel: string }
  > = {
    start: {
      title: "Mulai Pekerjaan",
      description:
        "Mulai pekerjaan ini? Setelah dimulai, status pekerjaan akan berubah menjadi Sedang Berjalan.",
      confirmLabel: "Mulai Pekerjaan",
    },
    pause: {
      title: "Jeda Pekerjaan",
      description: "Jeda pekerjaan ini?",
      confirmLabel: "Jeda",
    },
    resume: {
      title: "Lanjutkan Pekerjaan",
      description: "Lanjutkan pekerjaan ini?",
      confirmLabel: "Lanjutkan",
    },
    complete: {
      title: "Selesaikan Pekerjaan",
      description: "Selesaikan pekerjaan ini?",
      confirmLabel: "Selesaikan",
    },
  };

  return (
    <>
      <div className="page-head">
        <Link to="/my-jobs" className="back-link">
          <Icon name="arrow-right" size={15} />
          Kembali ke Pekerjaan Saya
        </Link>
      </div>

      <div className="panel">
        <div className="client-detail-head job-detail-page-head">
          <div className="client-detail-title">
            <h1>{job.title}</h1>
            <p>
              {job.id} · {job.city}
            </p>
          </div>
          <div className="client-detail-actions">
            <StatusBadge status={job.status} />
          </div>
        </div>

        {notice && (
          <div className="alert alert-info notice" role="status">
            <Icon name="check" size={16} />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-red notice" role="alert">
            <Icon name="info" size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ===== STATUS PEKERJAAN ===== */}
      <div className="panel">
        <div className="panel-head">
          <h2>Status Pekerjaan</h2>
          <StatusBadge status={job.status} />
        </div>
        <div className="panel-body">
          <p className="op-status-hint">
            {STATUS_HINTS[job.status]} ({JOB_STATUS_LABELS[job.status]})
          </p>

          <div className="job-detail-progress">
            <div className="progress-label">
              <span>Progress</span>
              <strong>{progress}%</strong>
            </div>
            <ProgressBar value={progress} />
            <p className="progress-line">
              {formatNumber(job.distributedBrochures)} /{" "}
              {formatNumber(job.targetBrochures)} brosur tersalurkan
            </p>
          </div>

          <dl className="detail-list op-times">
            <div>
              <dt>Mulai</dt>
              <dd>{job.startedAt ? formatDateTime(job.startedAt) : "-"}</dd>
            </div>
            <div>
              <dt>Selesai</dt>
              <dd>{job.completedAt ? formatDateTime(job.completedAt) : "-"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ===== OPERASIONAL (Field Team) ===== */}
      {teamCanOperate && !isTerminal && (
        <div className="panel">
          <div className="panel-head">
            <h2>Operasional</h2>
          </div>
          <div className="panel-body">
            <div className="op-actions">
              {job.status === "scheduled" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStart}
                >
                  <Icon name="play" size={16} />
                  Mulai Pekerjaan
                </button>
              )}

              {job.status === "in_progress" && (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handlePause}
                  >
                    <Icon name="pause" size={16} />
                    Jeda Pekerjaan
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setProgressOpen(true)}
                  >
                    <Icon name="target" size={16} />
                    Update Progress
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleComplete}
                  >
                    <Icon name="check" size={16} />
                    Selesai Pekerjaan
                  </button>
                </>
              )}

              {job.status === "paused" && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleResume}
                  >
                    <Icon name="play" size={16} />
                    Lanjutkan Pekerjaan
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setProgressOpen(true)}
                  >
                    <Icon name="target" size={16} />
                    Update Progress
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleComplete}
                  >
                    <Icon name="check" size={16} />
                    Selesai Pekerjaan
                  </button>
                </>
              )}
            </div>

            <div className="field op-notes">
              <label htmlFor="job-op-notes">Catatan Operasional</label>
              <textarea
                id="job-op-notes"
                className="input textarea"
                rows={3}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Contoh: Distribusi berjalan lancar di area perumahan."
                disabled={!isOperationalStatus}
              />
              {isOperationalStatus ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleNotesSave}
                >
                  Simpan Catatan
                </button>
              ) : (
                <p className="op-note-hint">
                  Catatan dapat diedit setelah pekerjaan dimulai.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status terminal — tidak ada aksi operasional */}
      {teamCanOperate && isTerminal && (
        <div className="panel">
          <div className="panel-head">
            <h2>Operasional</h2>
          </div>
          <div className="panel-body">
            <p className="modal-text">
              {job.status === "completed"
                ? "Pekerjaan telah selesai. Detail bersifat read-only."
                : "Pekerjaan dibatalkan. Tidak ada tindakan operasional yang diizinkan."}
            </p>
            {job.operationalNotes && (
              <p className="op-note-readonly">
                <strong>Catatan Operasional:</strong> {job.operationalNotes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===== INFORMASI PEKERJAAN ===== */}
      <div className="panel">
        <div className="panel-head">
          <h2>Informasi Pekerjaan</h2>
        </div>
        <div className="panel-body">
          <JobDetailPanel job={job} />
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {confirm && (
        <ConfirmDialog
          open
          title={confirmContent[confirm].title}
          description={confirmContent[confirm].description}
          confirmLabel={confirmContent[confirm].confirmLabel}
          onConfirm={confirmAction}
          onClose={() => setConfirm(null)}
          danger={confirm === "complete"}
        >
          {confirm === "complete" && (
            <>
              <dl className="detail-list op-summary">
                <div>
                  <dt>Target Brosur</dt>
                  <dd>{formatNumber(job.targetBrochures)}</dd>
                </div>
                <div>
                  <dt>Tersalurkan</dt>
                  <dd>{formatNumber(job.distributedBrochures)}</dd>
                </div>
                <div>
                  <dt>Progress</dt>
                  <dd>{progress}%</dd>
                </div>
              </dl>
              {progress < 100 && (
                <div className="alert alert-warning" role="alert">
                  <Icon name="info" size={16} />
                  <span>
                    Pekerjaan belum mencapai 100% target. Apakah Anda yakin ingin
                    menyelesaikannya?
                  </span>
                </div>
              )}
            </>
          )}
        </ConfirmDialog>
      )}

      {progressOpen && (
        <JobProgressModal
          job={job}
          onClose={() => setProgressOpen(false)}
          onSave={handleProgressSave}
        />
      )}
    </>
  );
}
