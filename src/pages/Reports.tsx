import { EmptyState } from "../components/EmptyState";

export function Reports() {
  return (
    <>
      <div className="page-head">
        <h1>Laporan</h1>
        <p>Rekap dan analisis distribusi brosur untuk setiap pekerjaan.</p>
      </div>

      <div className="panel">
        <EmptyState
          icon="reports"
          title="Laporan Belum Tersedia"
          description="Modul laporan akan tersedia di tahap berikutnya. Data pekerjaan dan aktivitas sudah siap digunakan."
        />
      </div>
    </>
  );
}
