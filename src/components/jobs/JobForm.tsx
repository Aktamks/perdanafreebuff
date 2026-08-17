import { useState, type FormEvent } from "react";
import { useClients } from "../../context/ClientsContext";
import { useTeams } from "../../context/TeamsContext";
import { METHOD_LABELS, JOB_CITIES } from "../../utils/labels";
import type { DistributionMethod, JobInput } from "../../types";

type FieldErrors = Partial<
  Record<
    | "title"
    | "clientId"
    | "teamId"
    | "address"
    | "city"
    | "startDate"
    | "distributionMethod"
    | "targetBrochures",
    string
  >
>;

function initialValues(initial?: JobInput | null): JobInput {
  return {
    title: initial?.title ?? "",
    clientId: initial?.clientId ?? "",
    teamId: initial?.teamId ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    startDate: initial?.startDate ?? "",
    distributionMethod: initial?.distributionMethod ?? "hand_to_hand",
    targetBrochures: initial?.targetBrochures ?? 0,
    description: initial?.description ?? "",
  };
}

function validate(values: JobInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.title.trim()) errors.title = "Nama pekerjaan wajib diisi.";
  if (!values.clientId) errors.clientId = "Klien wajib dipilih.";
  if (!values.teamId) errors.teamId = "Tim lapangan wajib dipilih.";
  if (!values.address.trim()) errors.address = "Lokasi wajib diisi.";
  if (!values.city) errors.city = "Kota wajib dipilih.";
  if (!values.startDate) errors.startDate = "Tanggal pekerjaan wajib diisi.";
  if (!values.distributionMethod) {
    errors.distributionMethod = "Metode distribusi wajib dipilih.";
  }
  if (!values.targetBrochures || values.targetBrochures <= 0) {
    errors.targetBrochures = "Target brosur wajib diisi dan lebih dari 0.";
  }
  return errors;
}

export function JobForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: JobInput | null;
  submitLabel: string;
  onSubmit: (values: JobInput) => void;
  onCancel: () => void;
}) {
  const { clients } = useClients();
  const { teams } = useTeams();
  const [values, setValues] = useState<JobInput>(() => initialValues(initial));
  const [errors, setErrors] = useState<FieldErrors>({});

  // Hanya entity active yang bisa dipilih untuk pekerjaan baru; entity yang
  // sudah terhubung ke pekerjaan ini tetap muncul (status lama tidak dihapus).
  const clientOptions = clients.filter(
    (client) => client.status === "active" || client.id === initial?.clientId,
  );
  const teamOptions = teams.filter(
    (team) => team.status === "active" || team.id === initial?.teamId,
  );

  function setField<K extends keyof JobInput>(key: K, value: JobInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onSubmit({
      ...values,
      title: values.title.trim(),
      address: values.address.trim(),
      description: values.description.trim(),
      targetBrochures: Math.floor(values.targetBrochures),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="job-title">Nama Pekerjaan</label>
        <input
          id="job-title"
          className="input"
          type="text"
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Contoh: Distribusi Brosur Jakarta Pusat"
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="job-client">Klien</label>
          <select
            id="job-client"
            className="select-field"
            value={values.clientId}
            onChange={(e) => setField("clientId", e.target.value)}
          >
            <option value="">Pilih klien...</option>
            {clientOptions.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company}
                {client.status === "inactive" ? " (Tidak Aktif)" : ""}
              </option>
            ))}
          </select>
          {errors.clientId && <p className="field-error">{errors.clientId}</p>}
        </div>

        <div className="field">
          <label htmlFor="job-team">Tim Lapangan</label>
          <select
            id="job-team"
            className="select-field"
            value={values.teamId}
            onChange={(e) => setField("teamId", e.target.value)}
          >
            <option value="">Pilih tim...</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
                {team.status === "inactive" ? " (Tidak Aktif)" : ""}
              </option>
            ))}
          </select>
          {errors.teamId && <p className="field-error">{errors.teamId}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="job-address">Lokasi</label>
          <input
            id="job-address"
            className="input"
            type="text"
            value={values.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Alamat / area distribusi"
          />
          {errors.address && <p className="field-error">{errors.address}</p>}
        </div>

        <div className="field">
          <label htmlFor="job-city">Kota</label>
          <select
            id="job-city"
            className="select-field"
            value={values.city}
            onChange={(e) => setField("city", e.target.value)}
          >
            <option value="">Pilih kota...</option>
            {JOB_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city && <p className="field-error">{errors.city}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="job-date">Tanggal Pekerjaan</label>
          <input
            id="job-date"
            className="input"
            type="date"
            value={values.startDate ? values.startDate.slice(0, 10) : ""}
            onChange={(e) =>
              setField(
                "startDate",
                e.target.value ? `${e.target.value}T08:00:00` : "",
              )
            }
          />
          {errors.startDate && (
            <p className="field-error">{errors.startDate}</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="job-method">Metode Distribusi</label>
          <select
            id="job-method"
            className="select-field"
            value={values.distributionMethod}
            onChange={(e) =>
              setField(
                "distributionMethod",
                e.target.value as DistributionMethod,
              )
            }
          >
            {(Object.keys(METHOD_LABELS) as DistributionMethod[]).map(
              (method) => (
                <option key={method} value={method}>
                  {METHOD_LABELS[method]}
                </option>
              ),
            )}
          </select>
          {errors.distributionMethod && (
            <p className="field-error">{errors.distributionMethod}</p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="job-target">Target Brosur</label>
        <input
          id="job-target"
          className="input"
          type="number"
          min={1}
          step={1}
          value={values.targetBrochures || ""}
          onChange={(e) => setField("targetBrochures", Number(e.target.value))}
          placeholder="Contoh: 5000"
        />
        {errors.targetBrochures && (
          <p className="field-error">{errors.targetBrochures}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="job-notes">Catatan</label>
        <textarea
          id="job-notes"
          className="input textarea"
          rows={3}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Catatan tambahan untuk tim lapangan (opsional)"
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
