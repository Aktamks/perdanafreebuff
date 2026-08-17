import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../components/icons";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@laporbrosur.test", password: "admin123" },
  { label: "Tim", email: "tim@laporbrosur.test", password: "tim123" },
  { label: "Klien", email: "klien@laporbrosur.test", password: "klien123" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = login(email, password, remember);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate("/dashboard");
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    setForgot(false);
  }

  return (
    <div className="login-page">
      <aside className="login-brand">
        <div className="login-brand-top">
          <span className="login-logo">L</span>
          <div>
            <strong>LaporBrosur</strong>
            <small>Manajemen Distribusi Brosur</small>
          </div>
        </div>

        <div className="login-brand-body">
          <h1>Pantau distribusi brosur dari satu tempat.</h1>
          <p>
            Sistem manajemen dan monitoring jasa distribusi brosur untuk admin,
            tim lapangan, dan klien.
          </p>
          <ul className="login-features">
            <li>
              <Icon name="check" size={16} />
              Kelola pekerjaan, tim lapangan, dan klien
            </li>
            <li>
              <Icon name="check" size={16} />
              Monitoring progres distribusi secara langsung
            </li>
            <li>
              <Icon name="check" size={16} />
              Laporan progres untuk klien
            </li>
          </ul>
        </div>

        <p className="login-brand-foot">
          LaporBrosur © 2026 — Tahap 1 (data mock)
        </p>
      </aside>

      <main className="login-form-wrap">
        <div className="login-form">
          <h2>Masuk ke LaporBrosur</h2>
          <p className="login-sub">Gunakan akun demo di bawah untuk mencoba aplikasi.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <Icon name="mail" size={16} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <Icon name="lock" size={16} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <div className="login-options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Ingat saya
              </label>
              <button
                type="button"
                className="link-btn"
                onClick={() => setForgot((v) => !v)}
              >
                Lupa password?
              </button>
            </div>

            {error && (
              <div className="alert alert-red">
                <Icon name="info" size={16} />
                <span>{error}</span>
              </div>
            )}
            {!error && forgot && (
              <div className="alert alert-info">
                <Icon name="info" size={16} />
                <span>Fitur reset password akan tersedia di tahap berikutnya.</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block">
              Masuk
            </button>
          </form>

          <div className="demo-box">
            <p className="demo-title">Akun demo</p>
            <div className="demo-buttons">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fillDemo(account)}
                >
                  Demo {account.label}
                </button>
              ))}
            </div>
            <p className="demo-hint">
              Klik tombol demo untuk mengisi form secara otomatis.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
