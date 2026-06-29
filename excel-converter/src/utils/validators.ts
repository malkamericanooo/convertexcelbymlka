import { isValid, parse } from "date-fns";

export function validateNIK(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const clean = value.trim();
  return /^\d{16}$/.test(clean);
}

export function validateTanggalLahir(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  const formats = [
    "dd/MM/yyyy",
    "MM/dd/yyyy",
    "yyyy-MM-dd",
    "dd-MM-yyyy",
    "MM-dd-yyyy",
    "dd-MM-yy",
    "d-M-yyyy",
  ];

  for (const fmt of formats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) return true;
  }

  const nativeDate = new Date(trimmed);
  if (isValid(nativeDate) && !isNaN(nativeDate.getTime())) return true;

  return false;
}

export function validateIMT(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const num = parseFloat(trimmed.replace(",", "."));
  return !isNaN(num) && isFinite(num) && num > 0 && num < 100;
}

export function calculateIMT(tinggiBadan: number | null, beratBadan: number | null): string {
  if (!tinggiBadan || !beratBadan || tinggiBadan <= 0 || beratBadan <= 0) return "";
  const tinggiM = tinggiBadan / 100;
  const imt = beratBadan / (tinggiM * tinggiM);
  return imt.toFixed(1);
}

export function isEmptyValue(value: string): boolean {
  return !value || value.trim() === "";
}
