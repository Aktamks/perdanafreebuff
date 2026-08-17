import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClients } from "../context/ClientsContext";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { ClientCard } from "../components/clients/ClientCard";
import { ClientModal } from "../components/clients/ClientModal";
import { ClientStats } from "../components/clients/ClientStats";
import { ClientStatusModal } from "../components/clients/ClientStatusModal";
import { ClientTable } from "../components/clients/ClientTable";
import type { Client, ClientInput, EntityStatus } from "../types";

type StatusFilter = "all" | EntityStatus;

export function Clients() {
  const { clients, addClient, updateClient, toggleClientStatus } = useClients();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [statusTarget, setStatusTarget] = useState<Client | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const query = search.trim().toLowerCase();
  const filtered = clients.filter((client) => {
    if (statusFilter !== "all" && client.status !== statusFilter) return false;
    if (!query) return true;
    return [client.name, client.company, client.email, client.whatsapp, client.city]
      .some((value) => value.toLowerCase().includes(query));
  });

  function resetFilter() {
    setSearch("");
    setStatusFilter("all");
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setModalOpen(true);
  }

  function handleSave(values: ClientInput) {
    if (editing) {
      updateClient(editing.id, values);
      setNotice("Perubahan klien berhasil disimpan.");
    } else {
      addClient(values);
      setNotice("Klien baru berhasil ditambahkan.");
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleStatusConfirm() {
    if (!statusTarget) return;
    toggleClientStatus(statusTarget.id);
    setNotice("Status klien berhasil diperbarui.");
    setStatusTarget(null);
  }

  return (
    <>
      <div className="page-head">
        <h1>Klien</h1>
        <p>Kelola data klien dan pantau aktivitas pekerjaan mereka.</p>
      </div>

      <ClientStats clients={clients} />

      <div className="panel">
        <div className="panel-head">
          <h2>Daftar Klien</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
            <Icon name="plus" size={16} />
            Tambah Klien
          </button>
        </div>

        <div className="clients-toolbar">
          <div className="search-field">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Cari klien..."
              aria-label="Cari klien"
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
            <option value="all">Semua</option>
            <option value="active">Aktif</option>
            <option value="inactive">Tidak Aktif</option>
          </select>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetFilter}>
            Reset Filter
          </button>
        </div>

        {notice && (
          <div className="alert alert-info notice" role="status">
            <Icon name="check" size={16} />
            <span>{notice}</span>
          </div>
        )}

        {clients.length === 0 ? (
          <EmptyState
            icon="clients"
            title="Tidak ada data klien"
            description="Mulai dengan menambahkan klien pertama Anda."
            action={{ label: "+ Tambah Klien", onClick: openAdd }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Tidak ada klien ditemukan"
            description="Coba ubah kata pencarian atau filter Anda."
          />
        ) : (
          <>
            <div className="hide-mobile">
              <ClientTable
                clients={filtered}
                onView={(id) => navigate(`/clients/${id}`)}
                onEdit={openEdit}
                onToggle={setStatusTarget}
              />
            </div>
            <div className="client-cards hide-desktop">
              {filtered.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onView={(id) => navigate(`/clients/${id}`)}
                  onEdit={openEdit}
                  onToggle={setStatusTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ClientModal
        open={modalOpen}
        client={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
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
