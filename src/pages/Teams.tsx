import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../context/TeamsContext";
import { Icon } from "../components/icons";
import { EmptyState } from "../components/EmptyState";
import { TeamCard } from "../components/teams/TeamCard";
import { TeamModal } from "../components/teams/TeamModal";
import { TeamStats } from "../components/teams/TeamStats";
import { TeamStatusModal } from "../components/teams/TeamStatusModal";
import { TeamTable } from "../components/teams/TeamTable";
import type { EntityStatus, Team, TeamInput } from "../types";

type StatusFilter = "all" | EntityStatus;

export function Teams() {
  const { teams, addTeam, updateTeam, toggleTeamStatus } = useTeams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [statusTarget, setStatusTarget] = useState<Team | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const query = search.trim().toLowerCase();
  const filtered = teams.filter((team) => {
    if (statusFilter !== "all" && team.status !== statusFilter) return false;
    if (!query) return true;
    return [team.name, team.leaderName, team.phone, team.whatsapp, team.city]
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

  function openEdit(team: Team) {
    setEditing(team);
    setModalOpen(true);
  }

  function handleSave(values: TeamInput) {
    if (editing) {
      updateTeam(editing.id, values);
      setNotice("Perubahan tim berhasil disimpan.");
    } else {
      addTeam(values);
      setNotice("Tim baru berhasil ditambahkan.");
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleStatusConfirm() {
    if (!statusTarget) return;
    toggleTeamStatus(statusTarget.id);
    setNotice("Status tim berhasil diperbarui.");
    setStatusTarget(null);
  }

  return (
    <>
      <div className="page-head">
        <h1>Tim Lapangan</h1>
        <p>Kelola tim yang bertugas melakukan distribusi di lapangan.</p>
      </div>

      <TeamStats teams={teams} />

      <div className="panel">
        <div className="panel-head">
          <h2>Daftar Tim</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
            <Icon name="plus" size={16} />
            Tambah Tim
          </button>
        </div>

        <div className="clients-toolbar">
          <div className="search-field">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Cari tim..."
              aria-label="Cari tim"
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

        {teams.length === 0 ? (
          <EmptyState
            icon="teams"
            title="Tidak ada data tim"
            description="Mulai dengan menambahkan tim lapangan pertama Anda."
            action={{ label: "+ Tambah Tim", onClick: openAdd }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Tidak ada tim ditemukan"
            description="Coba ubah kata pencarian atau filter Anda."
          />
        ) : (
          <>
            <div className="hide-mobile">
              <TeamTable
                teams={filtered}
                onView={(id) => navigate(`/teams/${id}`)}
                onEdit={openEdit}
                onToggle={setStatusTarget}
              />
            </div>
            <div className="team-cards hide-desktop">
              {filtered.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onView={(id) => navigate(`/teams/${id}`)}
                  onEdit={openEdit}
                  onToggle={setStatusTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <TeamModal
        open={modalOpen}
        team={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <TeamStatusModal
        team={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
