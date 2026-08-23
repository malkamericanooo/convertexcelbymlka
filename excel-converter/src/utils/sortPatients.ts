import { isValid, parse } from "date-fns";
import type { PatientData } from "../types";

/**
 * Urutan baris hasil convert: tua → muda berdasarkan tanggal lahir.
 *
 * Kenapa tidak cukup di-sort di Excel: kolom TANGGAL LAHIR di file PTM
 * berisi TEKS seperti "28-10-1961", bukan tanggal Excel. Kalau kolom itu
 * di-sort di Excel, yang dibandingkan adalah teksnya — jadi urutannya
 * mengikuti dua digit pertama (tanggal harinya), bukan umur. Makanya
 * teksnya harus diurai dulu jadi tanggal betulan seperti di sini.
 */

/**
 * Format tanggal yang dicoba, berurutan. Format Indonesia (hari dulu)
 * diprioritaskan — sama seperti validateTanggalLahir — supaya "03-02-1980"
 * dibaca 3 Februari, bukan 2 Maret.
 */
const DATE_FORMATS = [
  "dd/MM/yyyy",
  "dd-MM-yyyy",
  "yyyy-MM-dd",
  "d-M-yyyy",
  "d/M/yyyy",
  "dd-MM-yy",
  "MM/dd/yyyy",
  "MM-dd-yyyy",
];

/**
 * Ubah teks tanggal lahir jadi angka yang bisa dibandingkan (epoch ms).
 * Mengembalikan null kalau kosong atau tidak bisa dibaca.
 */
export function parseBirthDate(value: string): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  for (const fmt of DATE_FORMATS) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) return parsed.getTime();
  }

  const native = new Date(trimmed);
  if (isValid(native) && !isNaN(native.getTime())) return native.getTime();

  return null;
}

/**
 * Urutkan pasien tua → muda.
 *
 * Aturan (sama dengan master imunisasi di aplikasi ASIK):
 *   1. Tanggal lahir paling awal di atas (paling tua).
 *   2. Tanggal lahir kosong / tidak terbaca ditaruh paling atas supaya
 *      langsung kelihatan dan bisa diperbaiki.
 *   3. Tanggal lahir sama → nama A→Z.
 *
 * Tidak memutasi array input.
 */
export function sortPatientsByBirthDate(patients: PatientData[]): PatientData[] {
  return [...patients].sort((a, b) => {
    const ta = parseBirthDate(a.TanggalLahir);
    const tb = parseBirthDate(b.TanggalLahir);

    if (ta === null && tb !== null) return -1;
    if (tb === null && ta !== null) return 1;
    if (ta !== null && tb !== null && ta !== tb) return ta - tb;

    return (a.Nama || "").localeCompare(b.Nama || "", "id", { sensitivity: "base" });
  });
}
