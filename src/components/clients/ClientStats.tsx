import { StatCard } from "../StatCard";
import { getJobsByClientId } from "../../data/helpers";
import { jobs } from "../../data/mockData";
import type { Client } from "../../types";

export function ClientStats({ clients }: { clients: Client[] }) {
  const active = clients.filter((client) => client.status === "active").length;
  const inactive = clients.length - active;
  // Total Pekerjaan dihitung dari relasi Job.clientId terhadap daftar klien aktif,
  // bukan dari field legacy Client.totalJobs.
  const totalJobs = clients.reduce(
    (sum, client) => sum + getJobsByClientId(jobs, client.id).length,
    0,
  );

  return (
    <div className="stats-grid">
      <StatCard
        label="Total Klien"
        value={clients.length}
        sub="terdaftar di sistem"
        icon="clients"
        color="navy"
      />
      <StatCard
        label="Klien Aktif"
        value={active}
        sub="status aktif"
        icon="check"
        color="green"
      />
      <StatCard
        label="Klien Tidak Aktif"
        value={inactive}
        sub="status nonaktif"
        icon="info"
        color="red"
      />
      <StatCard
        label="Total Pekerjaan"
        value={totalJobs}
        sub="berdasarkan data pekerjaan"
        icon="jobs"
        color="blue"
      />
    </div>
  );
}
