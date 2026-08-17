import { ROLE_CLASSES, ROLE_LABELS } from "../utils/labels";
import type { UserRole } from "../types";

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`badge ${ROLE_CLASSES[role]}`}>{ROLE_LABELS[role]}</span>
  );
}
