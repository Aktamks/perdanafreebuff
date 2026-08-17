import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getNavItems } from "../navigation";
import { Icon } from "./icons";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const items = getNavItems(user?.role);

  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-logo">L</span>
          <span className="sidebar-brand-text">
            <strong>LaporBrosur</strong>
            <small>Distribusi Brosur</small>
          </span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              title={item.label}
              onClick={onClose}
            >
              <Icon name={item.icon} size={18} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="nav-label">LaporBrosur v0.1 — Tahap 1</span>
        </div>
      </aside>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
    </>
  );
}
