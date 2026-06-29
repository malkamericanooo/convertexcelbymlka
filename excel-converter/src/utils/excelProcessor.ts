import ExcelJS from "exceljs";
import JSZip from "jszip";
import { PatientData, ValidationResult, ColumnValidation, RowValidation, ProcessResult } from "../types";
import { validateNIK, validateTanggalLahir, validateIMT, calculateIMT, isEmptyValue } from "./validators";
import { sanitizeForExcel } from "./sanitizer";

type RawValue = string | number | boolean | null;

function cellToString(val: ExcelJS.CellValue): string {
  if (val == null) return "";
  if (val instanceof Date) {
    const d = val as Date;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  if (typeof val === "object" && "text" in (val as object)) {
    return String((val as { text: string }).text);
  }
  return String(val);
}

function cellToRaw(val: ExcelJS.CellValue): RawValue {
  if (val == null) return null;
  if (val instanceof Date) return cellToString(val);
  if (typeof val === "object" && "text" in (val as object)) {
    return String((val as { text: string }).text);
  }
  return val as RawValue;
}

function normalizeHeader(val: ExcelJS.CellValue): string {
  return cellToString(val).trim().toUpperCase();
}

function findColByKeyword(headers: string[], ...keywords: string[]): number {
  for (const kw of keywords) {
    const idx = headers.findIndex((h) => h === kw);
    if (idx >= 0) return idx;
  }
  for (const kw of keywords) {
    const idx = headers.findIndex((h) => h.includes(kw));
    if (idx >= 0) return idx;
  }
  return -1;
}

interface ColMap {
  nik: number;
  nama: number;
  tanggalLahir: number;
  alamat: number;
  telepon: number;
  tinggiBadan: number;
  beratBadan: number;
  imtDirect: number;
  totalCols: number;
}

function buildColMap(headerRow: string[]): ColMap {
  return {
    nik: findColByKeyword(headerRow, "NIK"),
    nama: findColByKeyword(headerRow, "NAMA PASIEN*", "NAMA PASIEN", "NAMA"),
    tanggalLahir: findColByKeyword(headerRow, "TANGGAL LAHIR *", "TANGGAL LAHIR*", "TANGGAL LAHIR", "TGL LAHIR"),
    alamat: findColByKeyword(headerRow, "ALAMAT*", "ALAMAT LENGKAP", "ALAMAT"),
    telepon: findColByKeyword(headerRow, "NO.TELP/HP", "TELEPON", "NO TELEPON", "TELP", "HP"),
    tinggiBadan: findColByKeyword(headerRow, "TINGGI BADAN(CM)", "TINGGI BADAN", "TINGGI"),
    beratBadan: findColByKeyword(headerRow, "BERAT BADAN (KG)", "BERAT BADAN", "BERAT"),
    imtDirect: findColByKeyword(headerRow, "IMT"),
    totalCols: headerRow.length,
  };
}

function isHeaderText(val: ExcelJS.CellValue): boolean {
  if (val == null) return false;
  const s = cellToString(val).trim().toUpperCase();
  return s === "NIK" || s === "NAMA PASIEN*" || s === "NAMA" || s === "TANGGAL PEMERIKSAAN*";
}

export async function readExcelFile(file: File): Promise<PatientData[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("File Excel tidak memiliki worksheet.");

  let headerRowNum = -1;
  let nikColIdx = -1;
  const maxScan = Math.min(worksheet.rowCount, 15);

  for (let r = 1; r <= maxScan; r++) {
    const row = worksheet.getRow(r);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (found) return;
      const val = normalizeHeader(cell.value);
      if (val === "NIK") {
        headerRowNum = r;
        nikColIdx = colNum;
        found = true;
      }
    });
    if (found) break;
  }

  if (headerRowNum < 0 || nikColIdx < 0) {
    throw new Error('Kolom "NIK" tidak ditemukan. Pastikan file sudah benar.');
  }

  const headerRow = worksheet.getRow(headerRowNum);
  const headers: string[] = [];
  // Scan only actual used columns — avoid iterating up to Excel's max (16384)
  let lastHeaderCol = 0;
  headerRow.eachCell({ includeEmpty: false }, (_, colNum) => {
    if (colNum > lastHeaderCol) lastHeaderCol = colNum;
  });
  const maxCols = Math.max(lastHeaderCol, 120);
  for (let c = 1; c <= maxCols; c++) {
    headers.push(normalizeHeader(headerRow.getCell(c).value));
  }

  const cols = buildColMap(headers);

  let firstDataRow = -1;
  for (let r = headerRowNum + 1; r <= Math.min(worksheet.rowCount, headerRowNum + 10); r++) {
    const nikCell = worksheet.getRow(r).getCell(nikColIdx).value;
    if (nikCell != null && !isHeaderText(nikCell)) {
      firstDataRow = r;
      break;
    }
  }

  if (firstDataRow < 0) {
    throw new Error("Tidak ada data pasien ditemukan (file hanya memiliki header).");
  }

  const patients: PatientData[] = [];

  for (let r = firstDataRow; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);

    const nikVal = row.getCell(nikColIdx).value;
    if (nikVal == null || isHeaderText(nikVal)) continue;

    const rawValues: RawValue[] = [];
    for (let c = 1; c <= maxCols; c++) {
      rawValues.push(cellToRaw(row.getCell(c).value));
    }

    const getStr = (idx: number): string => {
      if (idx < 0 || idx >= rawValues.length) return "";
      const v = rawValues[idx];
      if (v == null) return "";
      return String(v).trim();
    };

    const nikRaw = getStr(nikColIdx - 1);
    const nik = nikRaw.replace(/\.0$/, "");

    let imtStr = "";
    if (cols.imtDirect >= 0) {
      imtStr = getStr(cols.imtDirect);
    }
    if (!imtStr && cols.tinggiBadan >= 0 && cols.beratBadan >= 0) {
      const tinggi = parseFloat(getStr(cols.tinggiBadan).replace(",", "."));
      const berat = parseFloat(getStr(cols.beratBadan).replace(",", "."));
      imtStr = calculateIMT(isNaN(tinggi) ? null : tinggi, isNaN(berat) ? null : berat);
    }

    patients.push({
      NIK: nik,
      Nama: cols.nama >= 0 ? getStr(cols.nama) : "",
      TanggalLahir: cols.tanggalLahir >= 0 ? getStr(cols.tanggalLahir) : "",
      IMT: imtStr,
      Alamat: cols.alamat >= 0 ? getStr(cols.alamat) : "",
      Telepon: cols.telepon >= 0 ? getStr(cols.telepon) : "",
      rawValues,
    });
  }

  if (patients.length === 0) {
    throw new Error("Tidak ada data pasien ditemukan (file hanya memiliki header).");
  }

  return patients;
}

export function validatePatients(patients: PatientData[]): ValidationResult {
  const columnDefs: Array<{
    key: keyof PatientData;
    label: string;
    validate?: (v: string) => boolean;
    errorMessage?: string;
  }> = [
    { key: "NIK", label: "NIK", validate: validateNIK, errorMessage: "Format NIK salah (harus 16 digit angka)" },
    { key: "Nama", label: "Nama Pasien" },
    { key: "TanggalLahir", label: "Tanggal Lahir", validate: validateTanggalLahir, errorMessage: "Format tanggal salah" },
    { key: "IMT", label: "IMT", validate: validateIMT, errorMessage: "IMT tidak valid (harus angka > 0)" },
    { key: "Alamat", label: "Alamat" },
    { key: "Telepon", label: "No. Telepon" },
  ];

  const columnMap: Record<string, ColumnValidation> = {};
  for (const col of columnDefs) {
    columnMap[col.key] = { column: col.label, emptyCount: 0, invalidCount: 0, status: "valid" };
  }

  const rowValidations: RowValidation[] = [];
  let validRows = 0;

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const errors: Record<string, string> = {};

    for (const col of columnDefs) {
      const value = patient[col.key] as string;
      if (isEmptyValue(value)) {
        columnMap[col.key].emptyCount++;
        errors[col.key] = "Data kosong";
      } else if (col.validate && !col.validate(value)) {
        columnMap[col.key].invalidCount++;
        errors[col.key] = col.errorMessage ?? "Format salah";
      }
    }

    if (Object.keys(errors).length > 0) {
      rowValidations.push({ rowIndex: i + 1, data: patient, errors });
    } else {
      validRows++;
    }
  }

  for (const col of columnDefs) {
    const cv = columnMap[col.key];
    if (cv.invalidCount > 0) cv.status = "invalid";
    else if (cv.emptyCount > 0) cv.status = "empty";
    else cv.status = "valid";
  }

  const totalEmpty = Object.values(columnMap).reduce((s, c) => s + c.emptyCount, 0);
  const totalInvalid = Object.values(columnMap).reduce((s, c) => s + c.invalidCount, 0);

  return {
    columnValidations: columnDefs.map((c) => columnMap[c.key]),
    rowValidations,
    totalRows: patients.length,
    validRows,
    problematicRows: patients.length - validRows,
    totalEmpty,
    totalInvalid,
  };
}

export async function processFile(file: File): Promise<ProcessResult> {
  const patients = await readExcelFile(file);
  const validation = validatePatients(patients);
  return { patients, validation };
}

export async function injectExtLst(templateBuffer: ArrayBuffer, outputBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    const templateZip = await JSZip.loadAsync(templateBuffer);
    const outputZip = await JSZip.loadAsync(outputBuffer);

    const sheetFiles = ["xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"];
    for (const sheetFile of sheetFiles) {
      const templateEntry = templateZip.file(sheetFile);
      const outputEntry = outputZip.file(sheetFile);
      if (!templateEntry || !outputEntry) continue;

      const templateXml = await templateEntry.async("string");
      let outputXml = await outputEntry.async("string");

      // 1. Copy worksheet tag untuk mengimpor semua XML namespaces (seperti xmlns:x14)
      // Ini WAJIB dilakukan agar tidak terjadi "XML parsing error" karena namespace x14 tidak dikenali.
      const worksheetTagMatch = templateXml.match(/<worksheet[^>]*>/);
      if (worksheetTagMatch) {
        outputXml = outputXml.replace(/<worksheet[^>]*>/, worksheetTagMatch[0]);
      }

      // 2. Ambil dan inject extLst (yang berisi data validation / dropdown modern)
      const extLstMatch = templateXml.match(/<extLst>[\s\S]*<\/extLst>/);
      if (extLstMatch) {
        // Perpanjang range sqref (contoh A2:A10 menjadi A2:A10000) agar dropdown turun ke bawah
        let extLst = extLstMatch[0].replace(/:([A-Z]+)\d+/g, ':$110000');

        if (outputXml.includes("<extLst>")) {
          outputXml = outputXml.replace(/<extLst>[\s\S]*<\/extLst>/, extLst);
        } else {
          outputXml = outputXml.replace("</worksheet>", extLst + "</worksheet>");
        }
      }

      outputZip.file(sheetFile, outputXml);
    }

    return outputZip.generateAsync({ type: "arraybuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
  } catch {
    return outputBuffer;
  }
}

export async function exportToTemplate(patients: PatientData[]): Promise<Blob> {
  let workbook: ExcelJS.Workbook;
  let templateBuffer: ArrayBuffer | null = null;

  try {
    const response = await fetch("/template_kosong.xlsx");
    if (!response.ok) throw new Error("Template tidak ditemukan");
    templateBuffer = await response.arrayBuffer();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer);
  } catch {
    workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Data Pasien");
    ws.getRow(1).getCell(1).value = "Template gagal dimuat";
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Template tidak memiliki worksheet.");

  let templateHeaderRow = -1;
  let templateNikCol = -1;
  const maxScan = Math.min(worksheet.rowCount, 15);
  for (let r = 1; r <= maxScan; r++) {
    const row = worksheet.getRow(r);
    let found = false;
    row.eachCell({ includeEmpty: false }, (cell, colNum) => {
      if (found) return;
      if (normalizeHeader(cell.value) === "NIK") {
        templateHeaderRow = r;
        templateNikCol = colNum;
        found = true;
      }
    });
    if (found) break;
  }

  let startRow = templateHeaderRow >= 0 ? templateHeaderRow + 1 : 6;
  const nikCol = templateNikCol > 0 ? templateNikCol : 3;
  const scanEnd = startRow + 20;
  for (let r = startRow; r <= scanEnd; r++) {
    const nikCell = worksheet.getRow(r).getCell(nikCol).value;
    if (nikCell != null && isHeaderText(nikCell)) {
      startRow = r + 1;
    } else {
      startRow = r;
      break;
    }
  }

  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    const rowNum = startRow + i;
    const row = worksheet.getRow(rowNum);

    const rawLen = patient.rawValues.length;
    for (let c = 1; c <= rawLen; c++) {
      const raw = patient.rawValues[c - 1];
      const cell = row.getCell(c);
      
      if (raw != null) {
        // Terapkan fungsi sanitasi jika nilai adalah string
        if (typeof raw === "string") {
          cell.value = sanitizeForExcel(raw);
        } else {
          cell.value = raw as ExcelJS.CellValue;
        }
      }
    }

    row.commit();
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();

  let finalBuffer: ArrayBuffer;
  if (templateBuffer) {
    finalBuffer = await injectExtLst(templateBuffer, excelBuffer as ArrayBuffer);
  } else {
    finalBuffer = excelBuffer as ArrayBuffer;
  }

  return new Blob([finalBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
