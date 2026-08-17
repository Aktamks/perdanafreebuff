import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useJobs } from "../context/JobsContext";
import { JobDetail as JobDetailPanel } from "../components/JobDetail";
import { Icon } from "../components/icons";
import { StatusBadge } from "../components/StatusBadge";

export function MyJobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { getJob } = useJobs();
  const job = getJob(id);

  const isTeam = user?.role === "field_team";
  const entityId = isTeam ? user?.teamId : user?.clientId;

  if (!job || !entityId) return <Navigate to="/my-jobs" replace />;

  // AUTHORIZATION — cek kepemilikan di level page, bukan hanya UI:
  // tim hanya boleh membuka job dengan teamId miliknya; klien hanya clientId miliknya.
  const owned = isTeam
    ? job.teamId === entityId
    : job.clientId === entityId;
  if (!owned) return <Navigate to="/my-jobs" replace />;

  return (
    <>
      <div className="page-head">
        <Link to="/my-jobs" className="back-link">
          <Icon name="arrow-right" size={15} />
          Kembali ke Pekerjaan Saya
        </Link>
      </div>

      <div className="panel">
        <div className="client-detail-head job-detail-page-head">
          <div className="client-detail-title">
            <h1>{job.title}</h1>
            <p>
              {job.id} · {job.city}
            </p>
          </div>
          <div className="client-detail-actions">
            <StatusBadge status={job.status} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Informasi Pekerjaan</h2>
        </div>
        <div className="panel-body">
          <JobDetailPanel job={job} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Catatan</h2>
        </div>
        <p className="panel-note">
          {job.description || "Tidak ada catatan untuk pekerjaan ini."}
        </p>
      </div>
    </>
  );
}
