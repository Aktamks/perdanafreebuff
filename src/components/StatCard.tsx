import { Icon, type IconName } from "./icons";

export type StatColor = "navy" | "blue" | "green" | "red";

export function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: IconName;
  color: StatColor;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-${color}`}>
        <Icon name={icon} size={20} />
      </div>
      <div className="stat-body">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub ? <p className="stat-sub">{sub}</p> : null}
      </div>
    </div>
  );
}
