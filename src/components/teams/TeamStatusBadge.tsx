import { EntityStatusBadge } from "../StatusBadge";
import type { EntityStatus } from "../../types";

export function TeamStatusBadge({ status }: { status: EntityStatus }) {
  return <EntityStatusBadge status={status} />;
}
