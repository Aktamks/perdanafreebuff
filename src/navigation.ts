import type { IconName } from "./components/icons";
import type { UserRole } from "./types";

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

const ADMIN_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/jobs", label: "Pekerjaan", icon: "jobs" },
  { to: "/map", label: "Peta Monitoring", icon: "map" },
  { to: "/teams", label: "Tim Lapangan", icon: "teams" },
  { to: "/clients", label: "Klien", icon: "clients" },
  { to: "/reports", label: "Laporan", icon: "reports" },
  { to: "/settings", label: "Pengaturan", icon: "settings" },
];

const TEAM_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/jobs", label: "Pekerjaan Saya", icon: "jobs" },
  { to: "/map", label: "Peta Monitoring", icon: "map" },
  { to: "/reports", label: "Laporan", icon: "reports" },
  { to: "/settings", label: "Pengaturan", icon: "settings" },
];

const CLIENT_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/jobs", label: "Pekerjaan", icon: "jobs" },
  { to: "/map", label: "Peta Monitoring", icon: "map" },
  { to: "/reports", label: "Laporan", icon: "reports" },
  { to: "/settings", label: "Pengaturan", icon: "settings" },
];

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  admin: ADMIN_ITEMS,
  field_team: TEAM_ITEMS,
  client: CLIENT_ITEMS,
};

export function getNavItems(role?: UserRole): NavItem[] {
  return role ? ROLE_NAV[role] : ROLE_NAV.admin;
}
