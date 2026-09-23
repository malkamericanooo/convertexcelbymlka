import { useState, useCallback, useMemo } from "react";
import { saveAs } from "file-saver";
import { FileUpload } from "./components/FileUpload";
import { PreviewTable } from "./components/PreviewTable";
import { ValidationTable } from "./components/ValidationTable";
import { NotificationModal } from "./components/NotificationModal";
import { AnomalyNotificationTab } from "./components/AnomalyNotificationTab";
import { readExcelFile, validatePatients, exportToTemplate } from "./utils/excelProcessor";
import { DEMO_PATIENTS, detectPatientAnomalies } from "./utils/anomalyDetector";
import { PatientData, ProcessResult, AppStep, NotificationState } from "./types";
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  MessageCircle,
  Sparkles,
  FileCheck2,
} from "lucide-react";

interface ProgressState {
  pct: number;
  label: string;
}

function ProgressBar({ pct, label }: ProgressState) {
  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="font-medium text-blue-700">{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"convert" | "whatsapp">("convert");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<AppStep>("upload");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressState>({ pct: 0, label: "" });
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    totalEmpty: 0,
    totalInvalid: 0,
  });
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

  // Count detected anomalies
  const anomalyCount = useMemo(() => {
    if (!result?.patients) return 0;
    return detectPatientAnomalies(result.patients).length;
  }, [result?.patients]);

  const handleFileAccepted = useCallback((file: File) => {
    setUploadedFile(file);
    setError(null);
    setResult(null);
    setDownloadBlob(null);
    setProgress({ pct: 0, label: "" });
  }, []);

  const handleProcess = async () => {
    if (!uploadedFile) return;
    setStep("processing");
    setError(null);

    try {
      setProgress({ pct: 10, label: "Membaca file Excel..." });
      const patients = await readExcelFile(uploadedFile);

      setProgress({ pct: 55, label: "Memvalidasi data..." });
      await new Promise((r) => setTimeout(r, 80));
      const validation = validatePatients(patients);

      setProgress({ pct: 80, label: "Selesai membaca & validasi" });
      await new Promise((r) => setTimeout(r, 80));

      const processResult: ProcessResult = { patients, validation };
      setResult(processResult);

      const { totalEmpty, totalInvalid } = validation;
      if (totalEmpty > 0 || totalInvalid > 0) {
        setStep("validated");
        setNotification({ visible: true, totalEmpty, totalInvalid });
        setProgress({ pct: 80, label: "" });
      } else {
        await runExport(patients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses file.");
      setStep("upload");
      setProgress({ pct: 0, label: "" });
    }
  };

  const runExport = async (patients: PatientData[]) => {
    setStep("exporting");
    setNotification((prev) => ({ ...prev, visible: false }));
    setProgress({ pct: 85, label: "Memuat template warna..." });

    try {
      await new Promise((r) => setTimeout(r, 100));
      setProgress({ pct: 92, label: "Menulis data ke template..." });
      const blob = await exportToTemplate(patients);
      setProgress({ pct: 100, label: "File siap didownload!" });
      setDownloadBlob(blob);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat file export.");
      setStep("validated");
      setProgress({ pct: 80, label: "" });
    }
  };

  const handleLoadDemo = () => {
    const validation = validatePatients(DEMO_PATIENTS);
    setResult({
      patients: DEMO_PATIENTS,
      validation,
    });
    setActiveTab("whatsapp");
    setError(null);
  };

  const handleModalReset = () => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setDownloadBlob(null);
    setNotification({ visible: false, totalEmpty: 0, totalInvalid: 0 });
    setProgress({ pct: 0, label: "" });
    setStep("upload");
  };

  const handleModalContinue = () => {
    if (result) void runExport(result.patients);
  };

  const handleDownload = () => {
    if (!downloadBlob) return;
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    const filename = `REKAP_PASIEN_PUSKESMAS_${dd}${mm}${yyyy}.xlsx`;
    saveAs(downloadBlob, filename);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setDownloadBlob(null);
    setNotification({ visible: false, totalEmpty: 0, totalInvalid: 0 });
    setProgress({ pct: 0, label: "" });
    setStep("upload");
  };

  const isProcessing = step === "processing" || step === "exporting";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-blue-600 w-7 h-7 shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                Excel Converter PKM Mabu'un
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Konversi Template Berwarna & Skrining WhatsApp Pasien
              </p>
            </div>
          </div>

          {/* Quick Demo Button */}
          <button
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo Data (08112294396)</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-8 border-t border-gray-100">
          <button
            onClick={() => setActiveTab("convert")}
            className={`flex items-center gap-2 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors ${
              activeTab === "convert"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>1. Konversi Template Excel</span>
          </button>

          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-2 py-3 border-b-2 font-semibold text-xs sm:text-sm transition-colors relative ${
              activeTab === "whatsapp"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>2. Skrining & WhatsApp Pasien</span>
            {anomalyCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                {anomalyCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* TAB 1: CONVERT EXCEL */}
        {activeTab === "convert" && (
          <div className="space-y-6">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-800">
                  1. Upload File Data Pasien Bulanan
                </h2>
                <a
                  href="/SAMPLE_TEST_PASIEN_ANOMALI.xlsx"
                  download
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File Contoh Uji Coba (.xlsx)
                </a>
              </div>

              <FileUpload
                onFileAccepted={handleFileAccepted}
                currentFile={uploadedFile}
                disabled={isProcessing}
              />

              {uploadedFile && step === "upload" && (
                <div className="mt-4">
                  <button
                    onClick={() => void handleProcess()}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    ⚙️ Proses & Skrining File
                  </button>
                </div>
              )}

              {isProcessing && progress.pct > 0 && (
                <ProgressBar pct={progress.pct} label={progress.label} />
              )}
            </section>

            {/* Notification if anomalies detected */}
            {result && anomalyCount > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Terdeteksi {anomalyCount} Pasien Anomali (Tensi Tinggi / Obesitas)!
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Anda dapat meninjau dan mengirim pengingat WhatsApp resmi ke pasien terkait.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("whatsapp")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap"
                >
                  Buka Tab WhatsApp Pasien →
                </button>
              </div>
            )}

            {result && (
              <>
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-4">
                    2. Preview Data Pasien (5 Baris Pertama)
                  </h2>
                  <PreviewTable patients={result.patients.slice(0, 5)} />
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h2 className="text-base font-semibold text-gray-800 mb-1">
                    3. Hasil Validasi Kolom
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Data valid:{" "}
                    <span className="font-semibold text-green-600">
                      {result.validation.validRows} baris
                    </span>{" "}
                    | Data bermasalah:{" "}
                    <span className="font-semibold text-red-600">
                      {result.validation.problematicRows} baris
                    </span>
                  </p>
                  <ValidationTable validations={result.validation.columnValidations} />
                </section>
              </>
            )}

            {step === "done" && downloadBlob && (
              <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  4. Download Hasil Template Berwarna
                </h2>
                {progress.pct === 100 && (
                  <ProgressBar pct={100} label={progress.label} />
                )}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Rekap Pasien (.xlsx)
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Proses File Baru
                  </button>
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: WHATSAPP NOTIFICATION TAB */}
        {activeTab === "whatsapp" && (
          <AnomalyNotificationTab
            patients={result?.patients || []}
            onLoadDemo={handleLoadDemo}
          />
        )}
      </main>

      <NotificationModal
        visible={notification.visible}
        totalEmpty={notification.totalEmpty}
        totalInvalid={notification.totalInvalid}
        onReset={handleModalReset}
        onContinue={handleModalContinue}
      />
    </div>
  );
}
