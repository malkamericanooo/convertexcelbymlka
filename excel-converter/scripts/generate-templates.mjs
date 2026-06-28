import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function createTemplate(filename, includeExampleData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Excel Converter App";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Data Pasien");

  const blueHeader = { argb: "FF1D4ED8" };
  const lightBlueHeader = { argb: "FF2563EB" };
  const white = { argb: "FFFFFFFF" };
  const altRow = { argb: "FFEFF6FF" };

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFBFDBFE" } },
    left: { style: "thin", color: { argb: "FFBFDBFE" } },
    bottom: { style: "thin", color: { argb: "FFBFDBFE" } },
    right: { style: "thin", color: { argb: "FFBFDBFE" } },
  };

  ws.mergeCells("A1:G1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "REKAP DATA PASIEN";
  titleCell.font = { bold: true, color: white, size: 14, name: "Calibri" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: blueHeader };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.border = {
    top: { style: "medium", color: { argb: "FF1E40AF" } },
    left: { style: "medium", color: { argb: "FF1E40AF" } },
    bottom: { style: "medium", color: { argb: "FF1E40AF" } },
    right: { style: "medium", color: { argb: "FF1E40AF" } },
  };
  ws.getRow(1).height = 32;

  const headers = [
    { col: "A", label: "No.", width: 8 },
    { col: "B", label: "NIK", width: 22 },
    { col: "C", label: "Nama Pasien", width: 28 },
    { col: "D", label: "Tanggal Lahir", width: 18 },
    { col: "E", label: "IMT", width: 10 },
    { col: "F", label: "Alamat Lengkap", width: 38 },
    { col: "G", label: "Telepon", width: 18 },
  ];

  for (const h of headers) {
    const cell = ws.getCell(`${h.col}2`);
    cell.value = h.label;
    cell.font = { bold: true, color: white, size: 11, name: "Calibri" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: lightBlueHeader };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "medium", color: { argb: "FF1E40AF" } },
      left: { style: "thin", color: { argb: "FF1E40AF" } },
      bottom: { style: "medium", color: { argb: "FF1E40AF" } },
      right: { style: "thin", color: { argb: "FF1E40AF" } },
    };
    ws.getColumn(h.col).width = h.width;
  }
  ws.getRow(2).height = 22;

  if (includeExampleData) {
    const sampleData = [
      ["3201010101010001", "Budi Santoso", "01/01/1990", "22.5", "Jl. Merdeka No. 1, Jakarta Pusat", "08123456789"],
      ["3201010101010002", "Siti Rahayu", "15/06/1985", "24.1", "Jl. Sudirman Kav. 5, Jakarta Selatan", "08987654321"],
      ["3201010101010003", "Ahmad Fauzi", "22/03/1995", "19.8", "Jl. Thamrin No. 3, Jakarta Pusat", "08111222333"],
    ];

    for (let i = 0; i < sampleData.length; i++) {
      const rowNum = i + 3;
      const rowData = sampleData[i];
      const isAlt = i % 2 === 1;

      const noCell = ws.getCell(`A${rowNum}`);
      noCell.value = i + 1;
      noCell.alignment = { horizontal: "center", vertical: "middle" };
      if (isAlt) noCell.fill = { type: "pattern", pattern: "solid", fgColor: altRow };
      noCell.border = thinBorder;

      const cols = ["B", "C", "D", "E", "F", "G"];
      for (let j = 0; j < cols.length; j++) {
        const cell = ws.getCell(`${cols[j]}${rowNum}`);
        cell.value = rowData[j];
        cell.alignment = { horizontal: j === 4 ? "center" : "left", vertical: "middle" };
        if (isAlt) cell.fill = { type: "pattern", pattern: "solid", fgColor: altRow };
        cell.border = thinBorder;
      }
      ws.getRow(rowNum).height = 18;
    }
  } else {
    for (let i = 0; i < 20; i++) {
      const rowNum = i + 3;
      const isAlt = i % 2 === 1;

      const cols = ["A", "B", "C", "D", "E", "F", "G"];
      for (let j = 0; j < cols.length; j++) {
        const cell = ws.getCell(`${cols[j]}${rowNum}`);
        cell.value = null;
        cell.alignment = { horizontal: j === 0 || j === 4 ? "center" : "left", vertical: "middle" };
        if (isAlt) cell.fill = { type: "pattern", pattern: "solid", fgColor: altRow };
        cell.border = thinBorder;
      }
      ws.getRow(rowNum).height = 18;
    }
  }

  const outputPath = path.join(publicDir, filename);
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Created: ${outputPath}`);
}

(async () => {
  await createTemplate("template_kosong.xlsx", false);
  await createTemplate("template_contoh.xlsx", true);
  console.log("Done!");
})();
