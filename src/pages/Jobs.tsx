import { useState } from "react";
import { jobs } from "../data/mockData";
import { JOB_STATUS_LABELS } from "../utils/labels";
import { EmptyState } from "../components/EmptyState";
import { JobTable } from "../components/JobTable";
import type { JobStatus } from "../types";

type Filter = JobStatus | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Terjadwal" },
  { key: "in_progress", label: "Berjalan" },
  { key: "paused", label: "Ditunda" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

export function Jobs() {
  const [filter, setFilter] = useState<Filter>("all");
  const filtered =
    filter === "all" ? jobs : jobs.filter((job) => job.status === filter);

  return (
    <>
      <div className="page-head">
        <h1>Pekerjaan</h1>
        <p>Kelola seluruh pekerjaan distribusi brosur.</p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Daftar Pekerjaan</h2>
          <div className="filter-chips">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`chip ${filter === f.key ? "active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {filtered.length > 0 ? (
          <JobTable jobs={filtered} />
        ) : (
          <EmptyState
            icon="jobs"
            title="Tidak ada pekerjaan"
            description={`Tidak ada pekerjaan dengan status "${JOB_STATUS_LABELS[filter as JobStatus] ?? "Semua"}".`}
          />
        )}
      </div>
    </>
  );
}
