import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { injectExtLst } from "../../src/utils/excelProcessor";

const FAKE_EXT_LST =
  '<extLst><ext uri="{CCE6A557}"><x14:dataValidations count="1">' +
  '<x14:dataValidation type="list"><xm:sqref>G6:G428</xm:sqref>' +
  "</x14:dataValidation></x14:dataValidations></ext></extLst>";

async function makeZipWithSheet(sheetXml: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("xl/worksheets/sheet1.xml", sheetXml);
  return zip.generateAsync({ type: "arraybuffer" });
}

const SHEET_WITHOUT_EXTLST = `<?xml version="1.0"?><worksheet><sheetData/></worksheet>`;
const SHEET_WITH_OLD_EXTLST = `<?xml version="1.0"?><worksheet><sheetData/><extLst><ext>old</ext></extLst></worksheet>`;

describe("injectExtLst", () => {
  it("injects extLst from template into output that has none", async () => {
    const templateXml = `<?xml version="1.0"?><worksheet><sheetData/>${FAKE_EXT_LST}</worksheet>`;
    const templateBuf = await makeZipWithSheet(templateXml);
    const outputBuf = await makeZipWithSheet(SHEET_WITHOUT_EXTLST);

    const result = await injectExtLst(templateBuf, outputBuf);

    const zip = await JSZip.loadAsync(result);
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).toContain("<extLst>");
    expect(xml).toContain("x14:dataValidations");
    expect(xml).toContain("G6:G428");
  });

  it("replaces existing extLst in output with template extLst", async () => {
    const templateXml = `<?xml version="1.0"?><worksheet><sheetData/>${FAKE_EXT_LST}</worksheet>`;
    const templateBuf = await makeZipWithSheet(templateXml);
    const outputBuf = await makeZipWithSheet(SHEET_WITH_OLD_EXTLST);

    const result = await injectExtLst(templateBuf, outputBuf);

    const zip = await JSZip.loadAsync(result);
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).not.toContain("<ext>old</ext>");
    expect(xml).toContain("x14:dataValidations");
  });

  it("returns output buffer unchanged when template has no extLst", async () => {
    const templateBuf = await makeZipWithSheet(SHEET_WITHOUT_EXTLST);
    const outputBuf = await makeZipWithSheet(SHEET_WITHOUT_EXTLST);

    const result = await injectExtLst(templateBuf, outputBuf);

    const zip = await JSZip.loadAsync(result);
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).not.toContain("<extLst>");
  });

  it("preserves all other worksheet content outside extLst", async () => {
    const templateXml = `<?xml version="1.0"?><worksheet><sheetData/>${FAKE_EXT_LST}</worksheet>`;
    const templateBuf = await makeZipWithSheet(templateXml);
    const outputXml = `<?xml version="1.0"?><worksheet><sheetData><row r="6"><c r="C6"><v>data</v></c></row></sheetData></worksheet>`;
    const outputBuf = await makeZipWithSheet(outputXml);

    const result = await injectExtLst(templateBuf, outputBuf);

    const zip = await JSZip.loadAsync(result);
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).toContain("<v>data</v>");
    expect(xml).toContain("<extLst>");
  });

  it("returns output buffer as fallback on malformed input", async () => {
    const badBuf = new ArrayBuffer(8);
    const outputBuf = await makeZipWithSheet(SHEET_WITHOUT_EXTLST);

    const result = await injectExtLst(badBuf, outputBuf);

    expect(result).toBe(outputBuf);
  });

  it("x14 DV sqref is preserved verbatim from template", async () => {
    const templateXml = `<?xml version="1.0"?><worksheet><sheetData/>${FAKE_EXT_LST}</worksheet>`;
    const templateBuf = await makeZipWithSheet(templateXml);
    const outputBuf = await makeZipWithSheet(SHEET_WITHOUT_EXTLST);

    const result = await injectExtLst(templateBuf, outputBuf);

    const zip = await JSZip.loadAsync(result);
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).toContain("<xm:sqref>G6:G428</xm:sqref>");
  });
});
