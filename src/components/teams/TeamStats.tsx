import { StatCard } from "../StatCard";
import { getJobsByTeamId } from "../../data/helpers";
import { jobs } from "../../data/mockData";
import type { Team } from "../../types";

export function TeamStats({ teams }: { teams: Team[] }) {
  const active = teams.filter((team) => team.status === "active").length;
  const inactive = teams.length - active;
  // Total Pekerjaan dihitung dari relasi Job.teamId terhadap daftar tim aktif,
  // bukan dari angka hard-coded.
  const totalJobs = teams.reduce(
    (sum, team) => sum + getJobsByTeamId(jobs, team.id).length,
    0,
  );

  return (
    <div className="stats-grid">
      <StatCard
        label="Total Tim"
        value={teams.length}
        sub="terdaftar di sistem"
        icon="teams"
        color="navy"
      />
      <StatCard
        label="Tim Aktif"
        value={active}
        sub="status aktif"
        icon="check"
        color="green"
      />
      <StatCard
        label="Tim Tidak Aktif"
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
