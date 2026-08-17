/**
 * Koordinat untuk Peta Monitoring (Tahap 3A).
 * Semua koordinat bersifat statis/mock — belum ada GPS atau live tracking.
 */

/** Pusat Indonesia sebagai fallback saat tidak ada marker. */
export const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];
export const INDONESIA_ZOOM = 5;

/**
 * Koordinat kota distribusi. Dipakai untuk memberi koordinat realistis pada
 * Job baru yang dibuat lewat CRUD (form belum punya input koordinat, jadi
 * koordinat diturunkan dari kota terpilih — bukan source of truth baru).
 */
export const JOB_CITY_COORDS: Record<
  string,
  { lat: number; lng: number }
> = {
  Jakarta: { lat: -6.2088, lng: 106.8456 },
  Bandung: { lat: -6.9175, lng: 107.6191 },
  Bekasi: { lat: -6.2383, lng: 106.9756 },
  Tangerang: { lat: -6.1702, lng: 106.6403 },
  Bogor: { lat: -6.5971, lng: 106.806 },
  Garut: { lat: -7.2104, lng: 107.9091 },
};

/** Ambil koordinat kota; fallback (0,0) dipakai jika kota tidak dikenal. */
export function getCityCoords(city: string): { lat: number; lng: number } {
  return (
    JOB_CITY_COORDS[city] ?? { lat: 0, lng: 0 }
  );
}
