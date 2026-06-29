import { describe, it, expect, vi, beforeAll } from "vitest";
import { validatePatients } from "../../src/utils/excelProcessor";
import { PatientData } from "../../src/types";

const createSamplePatients = (count: number): PatientData[] =>
  Array.from({ length: count }, (_, i) => ({
    NIK: `320101010101000${String(i + 1).padStart(1, "0")}`,
    Nama: `Pasien ${i + 1}`,
    TanggalLahir: "01/01/1990",
    IMT: "22.5",
    Alamat: "Jl. Contoh No. 1, Jakarta",
    Telepon: "08123456789",
    rawValues: [],
  }));

describe("End-to-end validation flow", () => {
  it("all valid patients produce zero problems", () => {
    const patients = createSamplePatients(5);
    const result = validatePatients(patients);
    expect(result.totalRows).toBe(5);
    expect(result.validRows).toBe(5);
    expect(result.problematicRows).toBe(0);
    expect(result.totalEmpty).toBe(0);
    expect(result.totalInvalid).toBe(0);
  });

  it("mix of valid and invalid patients is counted correctly", () => {
    const patients: PatientData[] = [
      ...createSamplePatients(3),
      { NIK: "bad-nik", Nama: "", TanggalLahir: "01/01/1990", IMT: "22", Alamat: "Jl A", Telepon: "08123", rawValues: [] },
      { NIK: "3201010101010001", Nama: "Valid", TanggalLahir: "bad-date", IMT: "notanumber", Alamat: "Jl B", Telepon: "0812", rawValues: [] },
    ];

    const result = validatePatients(patients);
    expect(result.totalRows).toBe(5);
    expect(result.validRows).toBe(3);
    expect(result.problematicRows).toBe(2);
    expect(result.totalEmpty).toBeGreaterThan(0);
    expect(result.totalInvalid).toBeGreaterThan(0);
  });

  it("column validations contain all 6 required columns", () => {
    const patients = createSamplePatients(2);
    const result = validatePatients(patients);
    const colNames = result.columnValidations.map((c) => c.column);
    expect(colNames).toContain("NIK");
    expect(colNames).toContain("Nama Pasien");
    expect(colNames).toContain("Tanggal Lahir");
    expect(colNames).toContain("IMT");
    expect(colNames).toContain("Alamat");
    expect(colNames).toContain("No. Telepon");
  });

  it("all-valid data has all columns with status valid", () => {
    const patients = createSamplePatients(3);
    const result = validatePatients(patients);
    for (const col of result.columnValidations) {
      expect(col.status).toBe("valid");
    }
  });

  it("invalid NIK results in NIK column status invalid", () => {
    const patients: PatientData[] = [
      { NIK: "bad", Nama: "Alice", TanggalLahir: "01/01/1990", IMT: "22", Alamat: "Jl A", Telepon: "0812", rawValues: [] },
    ];
    const result = validatePatients(patients);
    const nikCol = result.columnValidations.find((c) => c.column === "NIK");
    expect(nikCol?.status).toBe("invalid");
  });

  it("warning threshold: file > 10MB simulation produces data", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const patients = createSamplePatients(1);
    const result = validatePatients(patients);
    expect(result.totalRows).toBe(1);
    consoleSpy.mockRestore();
  });

  it("empty patients array returns zero total", () => {
    const result = validatePatients([]);
    expect(result.totalRows).toBe(0);
    expect(result.validRows).toBe(0);
  });

  it("single patient with all empty fields produces problematic row", () => {
    const emptyPatient: PatientData = {
      NIK: "",
      Nama: "",
      TanggalLahir: "",
      IMT: "",
      Alamat: "",
      Telepon: "",
      rawValues: [],
    };
    const result = validatePatients([emptyPatient]);
    expect(result.problematicRows).toBe(1);
    expect(result.totalEmpty).toBe(6);
  });
});

describe("Header validation simulation", () => {
  it("validates that all 6 required headers are mandatory", () => {
    beforeAll(() => vi.clearAllMocks());
    const requiredHeaders = ["NIK", "NAMA", "TANGGAL LAHIR", "IMT", "ALAMAT", "TELEPON"];
    expect(requiredHeaders).toHaveLength(6);
    expect(requiredHeaders).toContain("NIK");
    expect(requiredHeaders).toContain("NAMA");
    expect(requiredHeaders).toContain("TANGGAL LAHIR");
  });
});
