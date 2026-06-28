import { describe, it, expect } from "vitest";
import {
  validateNIK,
  validateTanggalLahir,
  validateIMT,
  isEmptyValue,
} from "../../src/utils/validators";

describe("validateNIK", () => {
  it("returns true for valid 16-digit NIK", () => {
    expect(validateNIK("1234567890123456")).toBe(true);
    expect(validateNIK("3201010101010001")).toBe(true);
  });

  it("returns false for NIK shorter than 16 digits", () => {
    expect(validateNIK("123456789012345")).toBe(false);
  });

  it("returns false for NIK longer than 16 digits", () => {
    expect(validateNIK("12345678901234567")).toBe(false);
  });

  it("returns false for NIK with letters", () => {
    expect(validateNIK("1234567890ABCDEF")).toBe(false);
    expect(validateNIK("123456789012345A")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateNIK("")).toBe(false);
  });

  it("returns false for NIK with spaces", () => {
    expect(validateNIK("1234 5678 9012 3456")).toBe(false);
  });

  it("trims whitespace before validating", () => {
    expect(validateNIK("  1234567890123456  ")).toBe(true);
  });

  it("returns false for special characters", () => {
    expect(validateNIK("1234567890123-56")).toBe(false);
  });
});

describe("validateTanggalLahir", () => {
  it("returns true for dd/MM/yyyy format", () => {
    expect(validateTanggalLahir("01/01/1990")).toBe(true);
    expect(validateTanggalLahir("31/12/2000")).toBe(true);
  });

  it("returns true for yyyy-MM-dd format", () => {
    expect(validateTanggalLahir("1990-01-15")).toBe(true);
    expect(validateTanggalLahir("2000-12-31")).toBe(true);
  });

  it("returns true for dd-MM-yyyy format", () => {
    expect(validateTanggalLahir("15-06-1985")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(validateTanggalLahir("")).toBe(false);
  });

  it("returns false for completely invalid date string", () => {
    expect(validateTanggalLahir("not-a-date")).toBe(false);
    expect(validateTanggalLahir("abc")).toBe(false);
  });

  it("returns false for null-like values", () => {
    expect(validateTanggalLahir("")).toBe(false);
  });
});

describe("validateIMT", () => {
  it("returns true for integer IMT values", () => {
    expect(validateIMT("25")).toBe(true);
    expect(validateIMT("18")).toBe(true);
  });

  it("returns true for decimal IMT values", () => {
    expect(validateIMT("22.5")).toBe(true);
    expect(validateIMT("18.7")).toBe(true);
    expect(validateIMT("30.00")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(validateIMT("")).toBe(false);
  });

  it("returns false for non-numeric strings", () => {
    expect(validateIMT("abc")).toBe(false);
    expect(validateIMT("NaN")).toBe(false);
  });

  it("returns false for infinity strings", () => {
    expect(validateIMT("Infinity")).toBe(false);
  });

  it("trims whitespace before validating", () => {
    expect(validateIMT("  22.5  ")).toBe(true);
  });
});

describe("isEmptyValue", () => {
  it("returns true for empty string", () => {
    expect(isEmptyValue("")).toBe(true);
  });

  it("returns true for whitespace-only string", () => {
    expect(isEmptyValue("   ")).toBe(true);
    expect(isEmptyValue("\t")).toBe(true);
  });

  it("returns false for non-empty string", () => {
    expect(isEmptyValue("hello")).toBe(false);
    expect(isEmptyValue("0")).toBe(false);
  });

  it("handles undefined-like values", () => {
    expect(isEmptyValue("")).toBe(true);
  });
});
