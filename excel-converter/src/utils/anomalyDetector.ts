import { PatientData, PatientAnomaly, AnomalySeverity } from "../types";

/**
 * Standardize Indonesian phone number to international 62 format (without + or dashes)
 * e.g. 08112294396 -> 628112294396
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }
  return digits;
}

/**
 * Generate official, personalized Puskesmas Mabu'un reminder message (Revisi Kepala Puskesmas)
 */
export function buildWhatsAppMessage(
  nama: string,
  tensiStr: string,
  imtStr: string,
  reasons: string[]
): string {
  const reasonBulletPoints = reasons.map((r) => `•  ${r}`).join("\n");

  return `PEMBERITAHUAN HASIL SKRINING KESEHATAN
PUSKESMAS MABU'UN

Salam sehat Bapak/Ibu ${nama.toUpperCase()},

Berdasarkan hasil skrining PTM yang telah Anda lakukan di Puskesmas Mabu'un:
${tensiStr ? `📊 Tekanan Darah: ${tensiStr} mmHg\n` : ""}${imtStr ? `⚖️ Indeks Massa Tubuh (IMT): ${imtStr}\n` : ""}
📌 Catatan Petugas Kesehatan:
${reasonBulletPoints}

Demi menjaga kesehatan Anda tetap prima dan mencegah risiko komplikasi lebih lanjut, kami menyarankan Bapak/Ibu untuk melakukan pemeriksaan & konsultasi ulang ke Puskesmas Mabu'un.

🗓️ Jadwal Pendaftaran Puskesmas Mabu'un:
•  Senin – Kamis : 08.00 – 11.00 WITA
•  Jumat : 08.00 – 10.00WITA
•  Sabtu : 08.00 - 10.30 WITA

Pesan ini dikirim otomatis oleh Layanan Skrining Kesehatan Terpadu Puskesmas Mabu'un. Mohon jaga kesehatan dan pola makan Anda. 🙏`;
}

/**
 * Analyze all patients, detect clinical anomalies, and construct actionable WhatsApp reminders
 */
export function detectPatientAnomalies(patients: PatientData[]): PatientAnomaly[] {
  const anomalies: PatientAnomaly[] = [];

  patients.forEach((patient, idx) => {
    const sistol = parseFloat(patient.Sistol?.replace(",", ".") || "0");
    const diastol = parseFloat(patient.Diastol?.replace(",", ".") || "0");
    const imt = parseFloat(patient.IMT?.replace(",", ".") || "0");

    const reasons: string[] = [];
    let severity: AnomalySeverity = "normal";
    let category = "Normal";

    const hasTensi = sistol > 0 && diastol > 0;
    const tensiStr = hasTensi ? `${sistol}/${diastol}` : "";

    // 1. Cek Tekanan Darah (Tensi)
    if (sistol >= 160 || diastol >= 100) {
      severity = "high";
      category = "Hipertensi Derajat 2";
      reasons.push(
        `Tekanan darah Anda (${sistol}/${diastol} mmHg) tergolong Hipertensi Derajat 2. \nWajib kontrol rutin untuk pencegahan stroke dan penyakit jantung.`
      );
    } else if (sistol >= 140 || diastol >= 90) {
      severity = "high";
      category = "Hipertensi Derajat 1";
      reasons.push(
        `Tekanan darah Anda (${sistol}/${diastol} mmHg) tergolong Hipertensi Derajat 1. \nDisarankan evaluasi dan pemeriksaan ulang.`
      );
    } else if (sistol >= 130 || diastol >= 85) {
      severity = "medium";
      category = "Pre-Hipertensi";
      reasons.push(
        `Tekanan darah Anda (${sistol}/${diastol} mmHg) berada di batas tinggi (Pre-Hipertensi). \nDisarankan perbanyak aktivitas fisik dan kurangi konsumsi garam.`
      );
    }

    // 2. Cek IMT (Indeks Massa Tubuh)
    const validImt = !isNaN(imt) && imt > 0;
    if (validImt) {
      if (imt >= 27.0) {
        if (severity === "normal") severity = "medium";
        if (category === "Normal") category = "Obesitas Tk. 2";
        reasons.push(
          `Indeks Massa Tubuh (IMT ${imt}) tergolong Obesitas Tingkat 2. Disarankan konsultasi pola gizi seimbang.`
        );
      } else if (imt >= 25.0) {
        if (severity === "normal") severity = "medium";
        if (category === "Normal") category = "Overweight";
        reasons.push(
          `Indeks Massa Tubuh (IMT ${imt}) melebihi batas ideal (Kelebihan Berat Badan). Disarankan menjaga pola makan.`
        );
      }
    }

    // Hanya masukkan pasien jika terdeteksi Anomali (High atau Medium)
    if (severity !== "normal") {
      const formattedPhone = cleanPhoneNumber(patient.Telepon);
      const waMessage = buildWhatsAppMessage(
        patient.Nama || "Pasien",
        tensiStr,
        validImt ? String(imt) : "",
        reasons
      );

      const waUrl = formattedPhone
        ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`
        : "";

      anomalies.push({
        id: `anomali-${idx}-${patient.NIK || idx}`,
        patient,
        severity,
        category,
        tensiStr,
        imtVal: validImt ? imt : null,
        reasons,
        recommendedAction:
          severity === "high" ? "Kontrol Ulang Segera" : "Konsultasi Gaya Hidup",
        formattedPhone,
        waMessage,
        waUrl,
        isSent: false,
      });
    }
  });

  // Urutkan yang High Severity (Hipertensi Tensi Tinggi) di urutan teratas
  return anomalies.sort((a, b) => {
    if (a.severity === "high" && b.severity !== "high") return -1;
    if (a.severity !== "high" && b.severity === "high") return 1;
    return 0;
  });
}

/**
 * Data Pasien Mock untuk demonstrasi dan pengujian langsung
 * Menggunakan nomor HP tujuan: 08112294396
 */
export const DEMO_PATIENTS: PatientData[] = [
  {
    NIK: "6309011508800001",
    Nama: "Bpk. Malka (Uji Coba Tensi Tinggi)",
    TanggalLahir: "15-08-1980",
    IMT: "28.4",
    Alamat: "Kelurahan Mabuun RT 05",
    Telepon: "08112294396",
    Sistol: "165",
    Diastol: "100",
    rawValues: [],
  },
  {
    NIK: "6309015003750002",
    Nama: "Ibu Siti Rahma (Uji Coba Hipertensi)",
    TanggalLahir: "10-03-1975",
    IMT: "24.1",
    Alamat: "Kelurahan Mabuun RT 02",
    Telepon: "08112294396",
    Sistol: "148",
    Diastol: "92",
    rawValues: [],
  },
  {
    NIK: "6309012211900003",
    Nama: "Ahmad Fauzi (Uji Coba Obesitas)",
    TanggalLahir: "22-11-1990",
    IMT: "29.8",
    Alamat: "Kelurahan Mabuun RT 08",
    Telepon: "08112294396",
    Sistol: "125",
    Diastol: "82",
    rawValues: [],
  },
  {
    NIK: "6309014506950004",
    Nama: "Dewi Lestari (Hasil Sehat Normal)",
    TanggalLahir: "05-06-1995",
    IMT: "21.5",
    Alamat: "Kelurahan Mabuun RT 01",
    Telepon: "08112294396",
    Sistol: "118",
    Diastol: "78",
    rawValues: [],
  },
];
