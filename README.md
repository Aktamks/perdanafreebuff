# Freebuff Test

Aplikasi uji coba workflow Freebuff — dari GitHub repository sampai live preview.

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
├── index.html          # Entry HTML
├── src/
│   ├── main.tsx        # Entry React
│   ├── App.tsx         # Halaman utama (header, hero, tombol test)
│   └── index.css       # Styling global
└── vite.config.ts      # Konfigurasi Vite
```

Proyek ini sengaja dibuat minimal (Vite + React + TypeScript) agar mudah dikembangkan.
