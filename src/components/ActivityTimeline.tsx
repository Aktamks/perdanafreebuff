import { useJobs } from "../context/JobsContext";
import { getJobById } from "../data/helpers";
import { formatRelative } from "../utils/format";
import type { Activity } from "../types";

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const { jobs } = useJobs();
  return (
    <ol className="timeline">
      {activities.map((activity) => (
        <li key={activity.id} className="timeline-item">
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-content">
            <p className="timeline-text">{activity.message}</p>
            <p className="timeline-detail">
              {getJobById(jobs, activity.jobId)?.title ?? "-"}
            </p>
            <span className="timeline-time">
              {formatRelative(activity.createdAt)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
