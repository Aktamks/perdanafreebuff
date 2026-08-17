import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useClients } from "../context/ClientsContext";
import { getClientJobStats, getJobsByClientId } from "../data/helpers";
import { jobs } from "../data/mockData";
import { formatDate, formatNumber, initialsOf } from "../utils/format";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { ClientModal } from "../components/clients/ClientModal";
import { ClientStatusBadge } from "../components/clients/ClientStatusBadge";
import { ClientStatusModal } from "../components/clients/ClientStatusModal";
import { ProgressBar } from "../components/ProgressBar";
import { StatCard, type StatColor } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { UserAvatar } from "../components/UserAvatar";
import type { IconName } from "../components/icons";
import type { Client, ClientInput } from "../types";

export function ClientDetail() {
  const { id } = useParams();
  const { getClient, updateClient, toggleClientStatus } = useClients();
  const client = getClient(id);

  const [editOpen, setEditOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Client | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!client) return <Navigate to="/clients" replace />;
  const currentClient: Client = client;

  function handleSave(values: ClientInput) {
    updateClient(currentClient.id, values);
    setNotice("Perubahan klien berhasil disimpan.");
    setEditOpen(false);
  }

  function handleStatusConfirm() {
    toggleClientStatus(currentClient.id);
    setNotice("Status klien berhasil diperbarui.");
    setStatusTarget(null);
  }

  const clientJobs = getJobsByClientId(jobs, client.id);
  const jobStats = getClientJobStats(jobs, client.id);

  const stats: {
    label: string;
    value: string | number;
    sub?: string;
    icon: IconName;
    color: StatColor;
  }[] = [
    {
      label: "Total Pekerjaan",
      value: jobStats.total,
      sub: "semua kampanye",
      icon: "jobs",
      color: "navy",
    },
    {
      label: "Pekerjaan Aktif",
      value: jobStats.active,
      sub: "scheduled, berjalan, ditunda",
      icon: "map",
      color: "blue",
    },
    {
      label: "Pekerjaan Selesai",
      value: jobStats.completed,
      sub: "telah selesai",
      icon: "check",
      color: "green",
    },
    {
      label: "Total Brosur",
      value: formatNumber(jobStats.targetBrochures),
      sub: `${formatNumber(jobStats.distributedBrochures)} tersalurkan · ${jobStats.progress}%`,
      icon: "trending",
      color: "red",
    },
  ];

  return (
    <>
      <div className="page-head">
        <Link to="/clients" className="back-link">
          <Icon name="arrow-right" size={15} />
          Kembali ke Klien
        </Link>
      </div>

      <div className="panel">
        <div className="client-detail-head">
          <UserAvatar
            name={client.name}
            initials={initialsOf(client.name)}
            color="#16325c"
            size={56}
          />
          <div className="client-detail-title">
            <h1>{client.name}</h1>
            <p>{client.company}</p>
          </div>
          <div className="client-detail-actions">
            <ClientStatusBadge status={client.status} />
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
              onClick={() => setStatusTarget(client)}
            >
              {client.status === "active" ? "Nonaktifkan" : "Aktifkan"}
            </button>
          </div>
        </div>

        {notice && (
          <div className="alert alert-info notice" role="status">
            <Icon name="check" size={16} />
            <span>{notice}</span>
          </div>
        )}

        <div className="detail-list client-contact">
          <div>
            <dt>Email</dt>
            <dd>{client.email}</dd>
          </div>
          <div>
            <dt>Telepon</dt>
            <dd>{client.phone}</dd>
          </div>
          <div>
            <dt>WhatsApp</dt>
            <dd>{client.whatsapp || "-"}</dd>
          </div>
          <div>
            <dt>Alamat</dt>
            <dd>{client.address || "-"}</dd>
          </div>
          <div>
            <dt>Kota</dt>
            <dd>{client.city}</dd>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Riwayat Pekerjaan</h2>
          <span className="badge badge-gray">{clientJobs.length} pekerjaan</span>
        </div>
        {clientJobs.length === 0 ? (
          <EmptyState
            icon="jobs"
            title="Belum ada pekerjaan"
            description="Pekerjaan yang menggunakan clientId klien ini akan tampil di sini."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Pekerjaan</th>
                  <th>Lokasi</th>
                  <th>Target Brosur</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {clientJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <strong className="cell-main">{job.title}</strong>
                      <small className="cell-sub">{job.distributionMethod}</small>
                    </td>
                    <td>{job.city}</td>
                    <td>{formatNumber(job.targetBrochures)}</td>
                    <td className="progress-cell">
                      <ProgressBar value={job.progress} />
                      <span className="progress-num">{job.progress}%</span>
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td>{formatDate(job.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ClientModal
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />

      <ClientStatusModal
        client={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
