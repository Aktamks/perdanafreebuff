import { useState, type FormEvent } from "react";
import type { ClientInput, EntityStatus } from "../../types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<"name" | "company" | "email" | "phone" | "city", string>>;

function initialValues(client?: ClientInput | null): ClientInput {
  return {
    name: client?.name ?? "",
    company: client?.company ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    whatsapp: client?.whatsapp ?? "",
    address: client?.address ?? "",
    city: client?.city ?? "",
    status: client?.status ?? "active",
  };
}

function validate(values: ClientInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Nama wajib diisi.";
  if (!values.company.trim()) errors.company = "Perusahaan wajib diisi.";
  if (!values.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Format email tidak valid.";
  }
  if (!values.phone.trim()) errors.phone = "Nomor telepon wajib diisi.";
  if (!values.city.trim()) errors.city = "Kota wajib diisi.";
  return errors;
}

export function ClientForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: ClientInput | null;
  submitLabel: string;
  onSubmit: (values: ClientInput) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<ClientInput>(() => initialValues(initial));
  const [errors, setErrors] = useState<FieldErrors>({});

  function setField<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
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
      company: values.company.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      whatsapp: values.whatsapp.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      status: values.status as EntityStatus,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="client-name">Nama</label>
        <input
          id="client-name"
          className="input"
          type="text"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="Nama kontak / penanggung jawab"
        />
        {errors.name && <p className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor="client-company">Perusahaan</label>
        <input
          id="client-company"
          className="input"
          type="text"
          value={values.company}
          onChange={(e) => setField("company", e.target.value)}
          placeholder="Nama perusahaan / instansi"
        />
        {errors.company && <p className="field-error">{errors.company}</p>}
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="client-email">Email</label>
          <input
            id="client-email"
            className="input"
            type="email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="nama@perusahaan.com"
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div className="field">
          <label htmlFor="client-phone">Nomor Telepon</label>
          <input
            id="client-phone"
            className="input"
            type="tel"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="08xx-xxxx-xxxx"
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label htmlFor="client-whatsapp">WhatsApp</label>
          <input
            id="client-whatsapp"
            className="input"
            type="tel"
            value={values.whatsapp}
            onChange={(e) => setField("whatsapp", e.target.value)}
            placeholder="08xx-xxxx-xxxx (opsional)"
          />
        </div>

        <div className="field">
          <label htmlFor="client-city">Kota</label>
          <input
            id="client-city"
            className="input"
            type="text"
            value={values.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Contoh: Jakarta"
          />
          {errors.city && <p className="field-error">{errors.city}</p>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="client-address">Alamat</label>
        <input
          id="client-address"
          className="input"
          type="text"
          value={values.address}
          onChange={(e) => setField("address", e.target.value)}
          placeholder="Alamat lengkap (opsional)"
        />
      </div>

      <div className="field">
        <label htmlFor="client-status">Status</label>
        <select
          id="client-status"
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
