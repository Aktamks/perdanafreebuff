import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getNavItems } from "../navigation";
import { initialsOf } from "../utils/format";
import { RoleBadge } from "./RoleBadge";
import { UserAvatar } from "./UserAvatar";
import { Icon } from "./icons";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = getNavItems(user?.role);
  const current = items.find(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`),
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn menu-btn"
          onClick={onMenu}
          aria-label="Buka menu"
        >
          <Icon name="menu" size={20} />
        </button>
        <h1 className="topbar-title">{current ? current.label : "LaporBrosur"}</h1>
      </div>

      <div className="topbar-right">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Cari pekerjaan, tim, klien..."
            aria-label="Pencarian"
          />
        </div>

        <button type="button" className="icon-btn notif-btn" aria-label="Notifikasi">
          <Icon name="bell" size={19} />
          <span className="notif-dot" />
        </button>

        {user && (
          <div className="topbar-user">
            <UserAvatar
              name={user.name}
              initials={initialsOf(user.name)}
              color={user.avatar}
            />
            <div className="topbar-user-info">
              <strong>{user.name}</strong>
              <RoleBadge role={user.role} />
            </div>
          </div>
        )}

        <button
          type="button"
          className="icon-btn logout-btn"
          onClick={handleLogout}
          aria-label="Keluar"
          title="Keluar"
        >
          <Icon name="logout" size={19} />
        </button>
      </div>
    </header>
  );
}
