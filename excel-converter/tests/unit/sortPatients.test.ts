import { describe, it, expect } from "vitest";
import { sortPatientsByBirthDate, parseBirthDate } from "../../src/utils/sortPatients";
import type { PatientData } from "../../src/types";

function p(Nama: string, TanggalLahir: string): PatientData {
  return { NIK: "", Nama, TanggalLahir, IMT: "", Alamat: "", Telepon: "", rawValues: [] };
}
const names = (rows: PatientData[]) => rows.map((r) => r.Nama);

describe("parseBirthDate", () => {
  it("membaca format Indonesia dd-MM-yyyy", () => {
    expect(parseBirthDate("28-10-1961")).toBe(new Date(1961, 9, 28).getTime());
  });

  it("mendahulukan hari, bukan bulan, untuk tanggal ambigu", () => {
    // 03-02-1980 harus dibaca 3 Februari, bukan 2 Maret
    expect(parseBirthDate("03-02-1980")).toBe(new Date(1980, 1, 3).getTime());
  });

  it("membaca dd/MM/yyyy dan yyyy-MM-dd", () => {
    expect(parseBirthDate("28/10/1961")).toBe(new Date(1961, 9, 28).getTime());
    expect(parseBirthDate("1961-10-28")).toBe(new Date(1961, 9, 28).getTime());
  });

  it("mengembalikan null untuk kosong atau tidak terbaca", () => {
    expect(parseBirthDate("")).toBeNull();
    expect(parseBirthDate("   ")).toBeNull();
    expect(parseBirthDate("bukan tanggal")).toBeNull();
  });
});

describe("sortPatientsByBirthDate", () => {
  it("mengurutkan tua → muda", () => {
    const rows = [p("Muda", "20-05-2001"), p("Tua", "28-10-1961"), p("Tengah", "18-08-1980")];
    expect(names(sortPatientsByBirthDate(rows))).toEqual(["Tua", "Tengah", "Muda"]);
  });

  it("TIDAK ikut urutan teks yang bikin salah di Excel", () => {
    // Sebagai teks, "01-01-2005" < "28-10-1961" — Excel akan menaruh yang
    // muda di atas. Setelah diurai jadi tanggal, yang tua harus di atas.
    const rows = [p("Muda 2005", "01-01-2005"), p("Tua 1961", "28-10-1961")];
    expect(names(sortPatientsByBirthDate(rows))).toEqual(["Tua 1961", "Muda 2005"]);
  });

  it("tanggal sama diurut nama A→Z", () => {
    const rows = [p("Zulkifli", "28-10-1961"), p("Ahmad", "28-10-1961")];
    expect(names(sortPatientsByBirthDate(rows))).toEqual(["Ahmad", "Zulkifli"]);
  });

  it("tanggal kosong / tidak terbaca ditaruh paling atas", () => {
    const rows = [p("Punya", "28-10-1961"), p("Kosong", ""), p("Ngawur", "xx-yy-zzzz")];
    const sorted = names(sortPatientsByBirthDate(rows));
    expect(sorted.slice(0, 2).sort()).toEqual(["Kosong", "Ngawur"]);
    expect(sorted[2]).toBe("Punya");
  });

  it("tidak memutasi array asli", () => {
    const rows = [p("Muda", "20-05-2001"), p("Tua", "28-10-1961")];
    const before = names(rows);
    sortPatientsByBirthDate(rows);
    expect(names(rows)).toEqual(before);
  });

  it("daftar kosong tidak error", () => {
    expect(sortPatientsByBirthDate([])).toEqual([]);
  });
});
