# LaporBrosur

Sistem manajemen dan monitoring jasa distribusi brosur — **Tahap 2F: Progress Operasional Pekerjaan** (mock data, tanpa backend).

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
│   │   └── helpers.ts        # getClientById/TeamById, getJobById, getJobsByClientId/TeamId, getTeamJobStats
│   ├── utils/labels.ts       # Label & warna status pekerjaan, metode distribusi, role
│   ├── components/           # Sidebar, Topbar, StatCard, StatusBadge, JobTable, Modal, dll
│   └── pages/                # Login, Dashboard (3 role), Jobs, Map, Teams, Clients, Reports, Settings
└── vite.config.ts
```

## Catatan tahap

- Semua data bersifat lokal/mock; belum ada database, autentikasi backend, GPS, atau API eksternal.
- Peta Monitoring masih placeholder CSS dan siap diganti dengan OpenStreetMap + Leaflet.
- Modul Klien (Tahap 2B): CRUD klien, search & filter, detail klien `/clients/:id`, dan perubahan status — semua memakai local state (`ClientsContext`) dan hilang setelah refresh browser.
- Modul Tim Lapangan (Tahap 2C): CRUD tim, search & filter, detail tim `/teams/:id`, dan perubahan status — memakai local state (`TeamsContext`). Statistik tim dihitung dari relasi `Job.teamId`, bukan angka hard-coded.
- Modul Pekerjaan (Tahap 2D): CRUD pekerjaan, search & filter (status/klien/tim/kota), detail `/jobs/:id`, dan transisi status via confirmation modal — memakai local state (`JobsContext`). Hanya Admin yang dapat mengakses `/jobs` dan `/jobs/:id` (role lain di-redirect ke `/dashboard`).
  - Progress dihitung dari data aktual `distributedBrochures / targetBrochures × 100` (0–100%), bukan hard-coded.
  - Hubungan pakai relasi `Job.clientId` / `Job.teamId`; klien & tim aktif tersedia di dropdown form, entity nonaktif tidak bisa dipilih untuk pekerjaan baru.
  - Dashboard Admin, Tim, Klien, detail klien/tim, dan statistik semua memakai koleksi pekerjaan aktif dari `JobsContext` (satu sumber kebenaran).
- Modul Pekerjaan Saya (Tahap 2E): route `/my-jobs` & `/my-jobs/:id` khusus Field Team dan Client.
  - Field Team melihat `jobs.filter(job => job.teamId === user.teamId)`; Client melihat `jobs.filter(job => job.clientId === user.clientId)` — derived data dari koleksi aktif (`JobsContext`), bukan state/collection duplikat.
  - Detail read-only dengan **authorization check di level page**: akses job milik entitas lain di-DENY (redirect `/my-jobs`). Tidak ada tombol Edit/Delete/Ubah Status.
  - Sidebar Tim & Klien kini mengarah ke `/my-jobs` (bukan `/jobs`); `/my-jobs` sebagai Admin diarahkan ke `/jobs`.
- Modul Progress Operasional (Tahap 2F): Field Team mengelola pekerjaan di `/my-jobs/:id` — Mulai (scheduled → in_progress, isi `startedAt`), Jeda/Lanjutkan (in_progress ↔ paused tanpa mengubah `startedAt`), Update Progress (`distributedBrochures` 0..target dengan validasi), Selesai (→ completed, isi `completedAt`), dan Catatan Operasional (`operationalNotes`).
  - **Satu source of truth**: semua mutasi memutasi koleksi `jobs` aktif di `JobsContext`; tidak ada state/collection operasional kedua. Progress selalu dihitung `distributed / target × 100` (clamp 0–100).
  - **Security**: setiap handler memeriksa role (`field_team`), ownership (`job.teamId === user.teamId`), status aktif, dan validitas input; detail job milik entitas lain di-DENY di level page (redirect `/my-jobs`). Klien read-only (tanpa tombol operasional).
  - Admin & Klien dapat melihat data operasional terbaru (status, distributedBrochures, progress, startedAt, completedAt, operationalNotes) di detail pekerjaan.
- Tidak ada dependency besar selain `react-router-dom` untuk routing.
