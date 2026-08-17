# LaporBrosur

Sistem manajemen dan monitoring jasa distribusi brosur — **Tahap 2B: Manajemen Klien** (mock data, tanpa backend).

## Akun demo

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@laporbrosur.test` | `admin123` |
| Tim Lapangan | `tim@laporbrosur.test` | `tim123` |
| Klien | `klien@laporbrosur.test` | `klien123` |

## Menjalankan secara lokal

```bash
bun install
bun run dev
```

## Build produksi

```bash
bun run build
```

## Struktur

```
├── src/
│   ├── main.tsx              # Entry (HashRouter + AuthProvider)
│   ├── App.tsx               # Routing + proteksi halaman
│   ├── index.css             # Design system (navy/merah, responsive)
│   ├── types/index.ts        # Type system (User, Team, Client, Job, Activity, dll)
│   ├── auth/AuthContext.tsx  # Mock authentication + session
│   ├── data/
│   │   ├── mockData.ts       # Data mock Indonesia (users, clients, teams, jobs, activities)
│   │   └── helpers.ts        # getClientById, getTeamById, getJobById, getJobsByClientId/TeamId
│   ├── utils/labels.ts       # Label & warna status pekerjaan, metode distribusi, role
│   ├── components/           # Sidebar, Topbar, StatCard, StatusBadge, JobTable, Modal, dll
│   └── pages/                # Login, Dashboard (3 role), Jobs, Map, Teams, Clients, Reports, Settings
└── vite.config.ts
```

## Catatan tahap

- Semua data bersifat lokal/mock; belum ada database, autentikasi backend, GPS, atau API eksternal.
- Peta Monitoring masih placeholder CSS dan siap diganti dengan OpenStreetMap + Leaflet.
- Modul Klien (Tahap 2B): CRUD klien, search & filter, detail klien `/clients/:id`, dan perubahan status — semua memakai local state (`ClientsContext`) dan hilang setelah refresh browser.
- Tidak ada dependency besar selain `react-router-dom` untuk routing.
