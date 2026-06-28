import { useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { FileUpload } from "./components/FileUpload";
import { PreviewTable } from "./components/PreviewTable";
import { ValidationTable } from "./components/ValidationTable";
import { NotificationModal } from "./components/NotificationModal";
import { processFile, exportToTemplate } from "./utils/excelProcessor";
import { PatientData, ProcessResult, AppStep, NotificationState } from "./types";
import { FileSpreadsheet, Download, RefreshCw } from "lucide-react";

export default function App() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [step, setStep] = useState<AppStep>("upload");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    totalEmpty: 0,
    totalInvalid: 0,
  });
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);

  const handleFileAccepted = useCallback((file: File) => {
    setUploadedFile(file);
    setError(null);
    setResult(null);
    setDownloadBlob(null);
  }, []);

  const handleProcess = async () => {
    if (!uploadedFile) return;
    setStep("processing");
    setError(null);

    try {
      const processResult = await processFile(uploadedFile);
      setResult(processResult);

      const { totalEmpty, totalInvalid } = processResult.validation;
      if (totalEmpty > 0 || totalInvalid > 0) {
        setStep("validated");
        setNotification({ visible: true, totalEmpty, totalInvalid });
      } else {
        await runExport(processResult.patients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses file.");
      setStep("upload");
    }
  };

  const runExport = async (patients: PatientData[]) => {
    setStep("exporting");
    setNotification((prev) => ({ ...prev, visible: false }));
    try {
      const blob = await exportToTemplate(patients);
      setDownloadBlob(blob);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat file export.");
      setStep("validated");
    }
  };

  const handleModalReset = () => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setDownloadBlob(null);
    setNotification({ visible: false, totalEmpty: 0, totalInvalid: 0 });
    setStep("upload");
  };

  const handleModalContinue = () => {
    if (result) {
      void runExport(result.patients);
    }
  };

  const handleDownload = () => {
    if (!downloadBlob) return;
    saveAs(downloadBlob, "HASIL_REKAP_WARNA.xlsx");
  };

  const handleReset = () => {
    setUploadedFile(null);
    setResult(null);
    setError(null);
    setDownloadBlob(null);
    setNotification({ visible: false, totalEmpty: 0, totalInvalid: 0 });
    setStep("upload");
  };

  const isProcessing = step === "processing" || step === "exporting";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <FileSpreadsheet className="text-blue-600 w-7 h-7 shrink-0" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              Konversi Data Pasien
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Upload Excel → Validasi → Download Template Berwarna
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            1. Upload File Data Pasien
          </h2>
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
                ⚙️ Proses File
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
              {step === "processing" ? "Membaca dan memvalidasi data..." : "Membuat file export..."}
            </div>
          )}
        </section>

        {result && (
          <>
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                2. Preview Data (5 Baris Pertama)
              </h2>
              <PreviewTable patients={result.patients.slice(0, 5)} />
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">
                3. Hasil Skrining & Validasi
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
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              4. Download Hasil
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download HASIL_REKAP_WARNA.xlsx
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
