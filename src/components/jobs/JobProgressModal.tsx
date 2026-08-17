import { useState, type FormEvent } from "react";
import { Modal } from "../Modal";
import { ProgressBar } from "../ProgressBar";
import { getJobProgress } from "../../data/helpers";
import { formatNumber } from "../../utils/format";
import type { Job } from "../../types";

/**
 * Modal "Update Progress" untuk Field Team.
 * Validasi: nilai wajib angka valid, >= 0, dan <= targetBrochures.
 */
export function JobProgressModal({
  job,
  onClose,
  onSave,
}: {
  job: Job;
  onClose: () => void;
  onSave: (distributed: number) => void;
}) {
  const [raw, setRaw] = useState<string>(String(job.distributedBrochures));
  const [error, setError] = useState<string | null>(null);

  const parsed = Number(raw);
  const isFinite = raw.trim() !== "" && Number.isFinite(parsed);
  const isInRange = isFinite && parsed >= 0 && parsed <= job.targetBrochures;
  const previewProgress = isInRange
    ? getJobProgress(parsed, job.targetBrochures)
    : 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFinite) {
      setError("Masukkan jumlah brosur yang valid.");
      return;
    }
    if (parsed < 0) {
      setError("Jumlah brosur tersalurkan tidak boleh negatif.");
      return;
    }
    if (parsed > job.targetBrochures) {
      setError("Jumlah brosur tersalurkan tidak boleh melebihi target.");
      return;
    }
    setError(null);
    onSave(parsed);
  }

  return (
    <Modal open onClose={onClose} title="Update Progress">
      <form onSubmit={handleSubmit} noValidate>
        <dl className="detail-list op-summary">
          <div>
            <dt>Target</dt>
            <dd>{formatNumber(job.targetBrochures)} brosur</dd>
          </div>
          <div>
            <dt>Saat ini</dt>
            <dd>{formatNumber(job.distributedBrochures)} brosur</dd>
          </div>
        </dl>

        <div className="field">
          <label htmlFor="job-progress-value">Brosur Tersalurkan</label>
          <input
            id="job-progress-value"
            className="input"
            type="number"
            min={0}
            max={job.targetBrochures}
            step={1}
            inputMode="numeric"
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setError(null);
            }}
            placeholder="0"
            aria-invalid={error ? true : undefined}
          />
          {error && <p className="field-error">{error}</p>}
        </div>

        <div className="job-detail-progress">
          <div className="progress-label">
            <span>Progress</span>
            <strong>{previewProgress}%</strong>
          </div>
          <ProgressBar value={previewProgress} />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary">
            Simpan Progress
          </button>
        </div>
      </form>
    </Modal>
  );
}
