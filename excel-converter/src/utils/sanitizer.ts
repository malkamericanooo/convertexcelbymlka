export function sanitizeForExcel(value: string): string {
  if (!value || typeof value !== "string") return value;

  // 1. Hapus SEMUA karakter yang tidak valid menurut spesifikasi XML 1.0
  // Karakter yang diizinkan XML 1.0: Tab (\x09), LF (\x0A), CR (\x0D), dan karakter ASCII/Unicode normal.
  let sanitized = value.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, "");

  // 2. Escape karakter XML 
  // (Jika tulisan malah jadi "&amp;" di Excel, hapus blok replace di bawah ini)
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  return sanitized;
}
