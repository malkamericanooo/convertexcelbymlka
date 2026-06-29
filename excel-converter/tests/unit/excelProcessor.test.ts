import { describe, it, expect } from "vitest";
import { validatePatients } from "../../src/utils/excelProcessor";
import { PatientData } from "../../src/types";

const validPatient: PatientData = {
  NIK: "3201010101010001",
  Nama: "Budi Santoso",
  TanggalLahir: "01/01/1990",
  IMT: "22.5",
  Alamat: "Jl. Merdeka No. 1, Jakarta",
  Telepon: "08123456789",
  rawValues: [],
};

describe("validatePatients", () => {
  it("returns zero invalid/empty counts for all-valid patients", () => {
    const result = validatePatients([validPatient]);
    expect(result.totalRows).toBe(1);
    expect(result.validRows).toBe(1);
    expect(result.problematicRows).toBe(0);
    expect(result.totalEmpty).toBe(0);
    expect(result.totalInvalid).toBe(0);
  });

  it("detects invalid NIK (wrong length)", () => {
    const patient: PatientData = { ...validPatient, NIK: "12345" };
    const result = validatePatients([patient]);
    const nikCol = result.columnValidations.find((c) => c.column === "NIK");
    expect(nikCol?.invalidCount).toBe(1);
    expect(nikCol?.status).toBe("invalid");
  });

  it("detects invalid NIK (17 digits)", () => {
    const patient: PatientData = { ...validPatient, NIK: "12345678901234567" };
    const result = validatePatients([patient]);
    const nikCol = result.columnValidations.find((c) => c.column === "NIK");
    expect(nikCol?.invalidCount).toBe(1);
  });

  it("detects empty NIK", () => {
    const patient: PatientData = { ...validPatient, NIK: "" };
    const result = validatePatients([patient]);
    const nikCol = result.columnValidations.find((c) => c.column === "NIK");
    expect(nikCol?.emptyCount).toBe(1);
    expect(nikCol?.status).toBe("empty");
  });

  it("detects invalid tanggal lahir", () => {
    const patient: PatientData = { ...validPatient, TanggalLahir: "bukan-tanggal" };
    const result = validatePatients([patient]);
    const col = result.columnValidations.find((c) => c.column === "Tanggal Lahir");
    expect(col?.invalidCount).toBe(1);
    expect(col?.status).toBe("invalid");
  });

  it("detects invalid IMT (non-numeric)", () => {
    const patient: PatientData = { ...validPatient, IMT: "abc" };
    const result = validatePatients([patient]);
    const col = result.columnValidations.find((c) => c.column === "IMT");
    expect(col?.invalidCount).toBe(1);
    expect(col?.status).toBe("invalid");
  });

  it("detects empty Nama", () => {
    const patient: PatientData = { ...validPatient, Nama: "" };
    const result = validatePatients([patient]);
    const col = result.columnValidations.find((c) => c.column === "Nama Pasien");
    expect(col?.emptyCount).toBe(1);
    expect(col?.status).toBe("empty");
  });

  it("marks column status as invalid when there are format errors", () => {
    const patient: PatientData = { ...validPatient, NIK: "bad" };
    const result = validatePatients([patient]);
    const nikCol = result.columnValidations.find((c) => c.column === "NIK");
    expect(nikCol?.status).toBe("invalid");
  });

  it("marks column status as empty when only empty cells", () => {
    const patient: PatientData = { ...validPatient, Telepon: "" };
    const result = validatePatients([patient]);
    const col = result.columnValidations.find((c) => c.column === "No. Telepon");
    expect(col?.status).toBe("empty");
  });

  it("marks column status as valid when all data is correct", () => {
    const result = validatePatients([validPatient]);
    for (const col of result.columnValidations) {
      expect(col.status).toBe("valid");
    }
  });

  it("counts problematic rows correctly with multiple patients", () => {
    const badPatient: PatientData = { ...validPatient, NIK: "bad", Nama: "" };
    const result = validatePatients([validPatient, badPatient, validPatient]);
    expect(result.totalRows).toBe(3);
    expect(result.validRows).toBe(2);
    expect(result.problematicRows).toBe(1);
  });

  it("handles empty patients array", () => {
    const result = validatePatients([]);
    expect(result.totalRows).toBe(0);
    expect(result.validRows).toBe(0);
    expect(result.columnValidations.length).toBe(6);
  });

  it("returns row validations with correct row indexes", () => {
    const badPatient: PatientData = { ...validPatient, NIK: "bad" };
    const result = validatePatients([validPatient, badPatient]);
    expect(result.rowValidations).toHaveLength(1);
    expect(result.rowValidations[0].rowIndex).toBe(2);
  });
});
