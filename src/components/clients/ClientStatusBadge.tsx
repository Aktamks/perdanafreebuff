import { EntityStatusBadge } from "../StatusBadge";
import type { EntityStatus } from "../../types";

export function ClientStatusBadge({ status }: { status: EntityStatus }) {
  return <EntityStatusBadge status={status} />;
}
