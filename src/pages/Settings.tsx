import { useAuth } from "../auth/AuthContext";
import { initialsOf } from "../utils/format";
import { EmptyState } from "../components/EmptyState";
import { RoleBadge } from "../components/RoleBadge";
import { UserAvatar } from "../components/UserAvatar";

export function Settings() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <div className="page-head">
        <h1>Pengaturan</h1>
        <p>Kelola profil dan preferensi akun Anda.</p>
      </div>

      <div className="split">
        <div className="panel">
          <div className="panel-head">
            <h2>Profil</h2>
          </div>
          <div className="profile-row">
            <UserAvatar
              name={user.name}
              initials={initialsOf(user.name)}
              color={user.avatar}
              size={52}
            />
            <div className="profile-info">
              <strong>{user.name}</strong>
              <p>{user.email}</p>
              <p className="cell-sub">Bergabung {new Date(user.createdAt).getFullYear()}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Preferensi</h2>
          </div>
          <EmptyState
            icon="settings"
            title="Pengaturan Lanjutan"
            description="Notifikasi, keamanan, dan preferensi akun akan tersedia di tahap berikutnya."
          />
        </div>
      </div>
    </>
  );
}
