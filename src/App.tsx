import { useState } from "react";

function CardIcon({ type }: { type: "repo" | "ai" | "preview" }) {
  const common = {
    className: "card-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  } as const;

  if (type === "repo") {
    return (
      <svg {...common}>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    );
  }
  if (type === "ai") {
    return (
      <svg {...common}>
        <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export default function App() {
  const [tested, setTested] = useState(false);

  const cards = [
    {
      icon: "repo" as const,
      title: "GitHub Repository",
      description:
        "Kode sumber aplikasi tersimpan di GitHub dan tersinkron otomatis ke workspace Freebuff.",
    },
    {
      icon: "ai" as const,
      title: "AI Coding Agent",
      description:
        "Perubahan kode dikerjakan langsung oleh AI Coding Agent di dalam workspace Freebuff.",
    },
    {
      icon: "preview" as const,
      title: "Live Preview",
      description:
        "Hasil perubahan langsung tampil di Live Preview dan siap untuk diuji di browser.",
    },
  ];

  const flow = ["GitHub", "Freebuff", "AI Coding", "Live Preview"];

  return (
    <div className="page">
      <header className="header">
        <div className="container header-inner">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              ◈
            </span>
            Freebuff Test V2
          </span>
          <span className="pill">
            <span className="pill-dot" aria-hidden="true" />
            Live Preview
          </span>
        </div>
      </header>

      <main className="container main">
        <section className="hero">
          <span className="status-pill">
            <span className="status-dot" aria-hidden="true" />
            Sistem siap
          </span>

          <h1 className="title">
            Freebuff Berhasil <span className="accent">Mengedit Aplikasi</span>
          </h1>

          <p className="subtitle">
            GitHub repository berhasil dijalankan melalui Freebuff.
          </p>

          <button
            type="button"
            className="test-btn"
            onClick={() => setTested(true)}
          >
            Test Berhasil
          </button>

          {tested && (
            <div className="success" role="status">
              <svg
                className="success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>Koneksi dan aplikasi berhasil berjalan!</span>
            </div>
          )}
        </section>

        <section className="workflow">
          <h2 className="workflow-title">
            Workflow <span className="accent">Berhasil</span>
          </h2>
          <p className="workflow-desc">
            Dari kode di GitHub sampai tampil di browser, semuanya berjalan
            otomatis melalui Freebuff:
          </p>

          <div className="flow" aria-label="Alur workflow Freebuff">
            {flow.map((step, i) => (
              <span className="flow-step" key={step}>
                {step}
                {i < flow.length - 1 && (
                  <span className="flow-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </span>
            ))}
          </div>

          <div className="cards">
            {cards.map((card) => (
              <article className="card" key={card.title}>
                <CardIcon type={card.icon} />
                <h3 className="card-title">{card.title}</h3>
                <p className="card-desc">{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Freebuff Test V2</span>
          <span className="footer-flow">GitHub → Freebuff → Live Preview</span>
        </div>
      </footer>
    </div>
  );
}
