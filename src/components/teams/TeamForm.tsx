import { useState, type FormEvent } from "react";
import type { EntityStatus, TeamInput } from "../../types";

type FieldErrors = Partial<
  Record<"name" | "leaderName" | "phone" | "members" | "city", string>
>;

function initialValues(initial?: TeamInput | null): TeamInput {
  return {
    name: initial?.name ?? "",
    leaderName: initial?.leaderName ?? "",
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    members: initial?.members ?? 1,
    city: initial?.city ?? "",
    status: initial?.status ?? "active",
  };
}

function validate(values: TeamInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Nama tim wajib diisi.";
  if (!values.leaderName.trim()) errors.leaderName = "Ketua tim wajib diisi.";
  if (!values.phone.trim()) errors.phone = "Nomor telepon wajib diisi.";
  if (!values.members || values.members < 1 || !Number.isInteger(values.members)) {
    errors.members = "Jumlah anggota minimal 1.";
  }
  if (!values.city.trim()) errors.city = "Kota wajib diisi.";
  return errors;
}

export function TeamForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: TeamInput | null;
  submitLabel: string;
  onSubmit: (values: TeamInput) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<TeamInput>(() => initialValues(initial));
  const [errors, setErrors] = useState<FieldErrors>({});

  function setField<K extends keyof TeamInput>(key: K, value: TeamInput[K]) {
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
      name: values.name.trim(),
      leaderName: values.leaderName.trim(),
      phone: values.phone.trim(),
      whatsapp: values.whatsapp.trim(),
      members: Math.floor(values.members),
      city: values.city.trim(),
      status: values.status as EntityStatus,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="team-name">Nama Tim</label>
        <input
          id="team-name"
          className="input"
          type="text"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Contoh: Tim Jakarta 03"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor="team-leader">Ketua Tim</label>
        <input
          id="team-leader"
          className="input"
          type="text"
          value={values.leaderName}
          onChange={(e) => setField("leaderName", e.target.value)}
          placeholder="Nama ketua tim"
        />
        {errors.leaderName && <p className="field-error">{errors.leaderName}</p>}
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="team-phone">Nomor Telepon</label>
          <input
            id="team-phone"
            className="input"
            type="tel"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="08xx-xxxx-xxxx"
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>

        <div className="field">
          <label htmlFor="team-whatsapp">WhatsApp</label>
          <input
            id="team-whatsapp"
            className="input"
            type="tel"
            value={values.whatsapp}
            onChange={(e) => setField("whatsapp", e.target.value)}
            placeholder="08xx-xxxx-xxxx (opsional)"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="team-city">Kota</label>
          <input
            id="team-city"
            className="input"
            type="text"
            value={values.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Contoh: Jakarta"
          />
          {errors.city && <p className="field-error">{errors.city}</p>}
        </div>

        <div className="field">
          <label htmlFor="team-members">Jumlah Anggota</label>
          <input
            id="team-members"
            className="input"
            type="number"
            min={1}
            step={1}
            value={values.members}
            onChange={(e) => setField("members", Number(e.target.value))}
            placeholder="1"
          />
          {errors.members && <p className="field-error">{errors.members}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="team-status">Status</label>
        <select
          id="team-status"
          className="select-field"
          value={values.status}
          onChange={(e) => setField("status", e.target.value as EntityStatus)}
        >
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
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
