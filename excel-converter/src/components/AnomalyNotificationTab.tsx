import { useState, useMemo } from "react";
import { PatientData, PatientAnomaly } from "../types";
import { detectPatientAnomalies } from "../utils/anomalyDetector";
import {
  MessageCircle,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  Search,
  Sparkles,
  PhoneCall,
  Activity,
  ArrowRight,
} from "lucide-react";

interface AnomalyNotificationTabProps {
  patients: PatientData[];
  onLoadDemo: () => void;
}

export function AnomalyNotificationTab({
  patients,
  onLoadDemo,
}: AnomalyNotificationTabProps) {
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [selectedPreview, setSelectedPreview] = useState<PatientAnomaly | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium">("all");

  // Detect anomalies from patient list
  const anomalies = useMemo(() => {
    return detectPatientAnomalies(patients);
  }, [patients]);

  // Filter based on search query and severity
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((item) => {
      const matchSearch =
        item.patient.Nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.patient.NIK.includes(searchQuery) ||
        item.patient.Telepon.includes(searchQuery);

      const matchSeverity =
        filterSeverity === "all" ? true : item.severity === filterSeverity;

      return matchSearch && matchSeverity;
    });
  }, [anomalies, searchQuery, filterSeverity]);

  const totalHigh = anomalies.filter((a) => a.severity === "high").length;
  const totalMedium = anomalies.filter((a) => a.severity === "medium").length;
  const totalSent = Object.values(sentMap).filter(Boolean).length;

  const handleSendWhatsApp = (item: PatientAnomaly) => {
    if (!item.waUrl) {
      alert("Nomor telepon pasien tidak valid atau kosong.");
      return;
    }
    // Mark as sent
    setSentMap((prev) => ({ ...prev, [item.id]: true }));
    // Open WhatsApp Web in new tab
    window.open(item.waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Header & Demo Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Clinical Tele-Monitoring
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full">
              Skenario A (100% Free wa.me)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">
            Skrining Pasien Anomali & Kirim WhatsApp
          </h2>
          <p className="text-blue-200 text-xs sm:text-sm mt-1 max-w-xl">
            Sistem otomatis mendeteksi pasien dengan tensi tinggi (Hipertensi) atau IMT berlebih dari file bulanan, serta menyusun pesan resmi Puskesmas Mabu'un siap kirim.
          </p>
        </div>

        <button
          onClick={onLoadDemo}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          ✨ Muat Data Demo (Target: 08112294396)
        </button>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{patients.length}</div>
            <div className="text-xs text-gray-500">Total Pasien</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/20 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-rose-600">{totalHigh}</div>
            <div className="text-xs text-gray-500">Hipertensi (Urgent)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 bg-amber-50/20 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600">{totalMedium}</div>
            <div className="text-xs text-gray-500">Pre-Hipertensi / Obesitas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600">{totalSent}</div>
            <div className="text-xs text-gray-500">Pesan WA Dibuka</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, NIK, atau no HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-gray-500 font-medium shrink-0">Filter:</span>
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Semua Anomali ({anomalies.length})
          </button>
          <button
            onClick={() => setFilterSeverity("high")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === "high"
                ? "bg-rose-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🔴 Hipertensi ({totalHigh})
          </button>
          <button
            onClick={() => setFilterSeverity("medium")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterSeverity === "medium"
                ? "bg-amber-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🟡 Obesitas ({totalMedium})
          </button>
        </div>
      </div>

      {/* Anomaly Table */}
      {filteredAnomalies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            Tidak Ditemukan Pasien Anomali
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Semua pasien pada kriteria ini dalam batas normal, atau data belum dimuat. Klik tombol "✨ Muat Data Demo" di atas untuk mencoba alur WhatsApp!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Nama Pasien & NIK</th>
                  <th className="py-3.5 px-4">No. WhatsApp</th>
                  <th className="py-3.5 px-4">Pengukuran Klinis</th>
                  <th className="py-3.5 px-4">Reason Why (Alasan Klinis)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Aksi Pengingat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAnomalies.map((item) => {
                  const isSent = !!sentMap[item.id];
                  const isHigh = item.severity === "high";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isSent ? "bg-emerald-50/30" : ""
                      }`}
                    >
                      {/* Nama & NIK */}
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <div className="font-semibold text-gray-900 text-sm">
                          {item.patient.Nama || "(Tanpa Nama)"}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          NIK: {item.patient.NIK || "-"} | {item.patient.Alamat || "-"}
                        </div>
                      </td>

                      {/* No. WhatsApp */}
                      <td className="py-3.5 px-4">
                        {item.patient.Telepon ? (
                          <div className="flex items-center gap-1.5 font-mono text-gray-700">
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{item.patient.Telepon}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Tidak ada no HP</span>
                        )}
                      </td>

                      {/* Parameter */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {item.tensiStr && (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                isHigh
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              Tensi: {item.tensiStr} mmHg
                            </span>
                          )}
                          {item.imtVal && (
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                                IMT: {item.imtVal}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Reason Why */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              isHigh
                                ? "bg-rose-600 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {item.category}
                          </span>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            {item.reasons[0]}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sudah Dibuka
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                            Belum Dikirim
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedPreview(item)}
                            title="Pratinjau Pesan"
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleSendWhatsApp(item)}
                            disabled={!item.formattedPhone}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-sm transition-all ${
                              !item.formattedPhone
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isSent
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{isSent ? "Kirim Ulang" : "Kirim WA"}</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedPreview(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <MessageCircle className="w-5 h-5" />
              <span>Pratinjau Pesan WhatsApp Resmi Puskesmas Mabu'un</span>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Penerima: <strong className="text-gray-800">{selectedPreview.patient.Nama}</strong> ({selectedPreview.patient.Telepon || "Tanpa Nomor"})
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="mt-4 bg-[#EFEAE2] p-4 rounded-xl border border-gray-200 text-gray-900 text-xs font-sans leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto shadow-inner">
              <div className="bg-white p-3 rounded-lg shadow-sm max-w-md">
                {selectedPreview.waMessage}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setSelectedPreview(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>

              <button
                onClick={() => {
                  handleSendWhatsApp(selectedPreview);
                  setSelectedPreview(null);
                }}
                disabled={!selectedPreview.formattedPhone}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Buka di WhatsApp Web</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
