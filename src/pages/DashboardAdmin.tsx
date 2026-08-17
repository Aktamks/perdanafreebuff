import { Link } from "react-router-dom";
import { useClients } from "../context/ClientsContext";
import { useTeams } from "../context/TeamsContext";
import { activities, jobs } from "../data/mockData";
import { formatNumber } from "../utils/format";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { Icon } from "../components/icons";
import { JobTable } from "../components/JobTable";
import { StatCard } from "../components/StatCard";

export function DashboardAdmin() {
  const { clients } = useClients();
  const { teams } = useTeams();
  const activeJobs = jobs.filter((job) => job.status === "in_progress");
  const activeTeams = teams.filter((team) => team.status === "active");
  const activeClients = clients.filter((client) => client.status === "active");
  const totalDistributed = jobs.reduce(
    (sum, job) => sum + job.distributedBrochures,
    0,
  );
  const totalTarget = jobs.reduce((sum, job) => sum + job.targetBrochures, 0);

  const recentJobs = [...jobs]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard Admin</h1>
        <p>Pantau seluruh aktivitas distribusi brosur dari satu tempat.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Pekerjaan Aktif"
          value={activeJobs.length}
          sub={`dari ${jobs.length} pekerjaan`}
          icon="jobs"
          color="navy"
        />
        <StatCard
          label="Tim Lapangan"
          value={activeTeams.length}
          sub={`dari ${teams.length} tim terdaftar`}
          icon="teams"
          color="blue"
        />
        <StatCard
          label="Klien Aktif"
          value={activeClients.length}
          sub={`dari ${clients.length} klien terdaftar`}
          icon="clients"
          color="green"
        />
        <StatCard
          label="Brosur Tersalurkan"
          value={formatNumber(totalDistributed)}
          sub={`dari target ${formatNumber(totalTarget)}`}
          icon="target"
          color="red"
        />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Pekerjaan Terbaru</h2>
          <Link to="/jobs" className="link-btn">
            Lihat Semua <Icon name="arrow-right" size={15} />
          </Link>
        </div>
        <JobTable jobs={recentJobs} />
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Aktivitas Terbaru</h2>
          </div>
          <ActivityTimeline activities={activities.slice(0, 5)} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <Link to="/jobs" className="qa-btn">
              <Icon name="jobs" size={18} />
              <span>
                <strong>+ Buat Pekerjaan</strong>
                <small>Kelola pekerjaan baru</small>
              </span>
            </Link>
            <Link to="/teams" className="qa-btn">
              <Icon name="teams" size={18} />
              <span>
                <strong>+ Tambah Tim</strong>
                <small>Kelola tim lapangan</small>
              </span>
            </Link>
            <Link to="/clients" className="qa-btn">
              <Icon name="clients" size={18} />
              <span>
                <strong>+ Tambah Klien</strong>
                <small>Kelola data klien</small>
              </span>
            </Link>
            <Link to="/map" className="qa-btn">
              <Icon name="map" size={18} />
              <span>
                <strong>Lihat Monitoring</strong>
                <small>Pantau tim di peta</small>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
