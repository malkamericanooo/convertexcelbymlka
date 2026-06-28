import { AlertTriangle, UploadCloud, Download } from "lucide-react";

interface NotificationModalProps {
  visible: boolean;
  totalEmpty: number;
  totalInvalid: number;
  onReset: () => void;
  onContinue: () => void;
}

export function NotificationModal({
  visible,
  totalEmpty,
  totalInvalid,
  onReset,
  onContinue,
}: NotificationModalProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 id="modal-title" className="text-base font-bold text-gray-900">
              Terdapat Data Bermasalah
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ditemukan masalah pada data yang diupload
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-1.5">
          {totalEmpty > 0 && (
            <p className="text-sm text-yellow-800">
              • <span className="font-semibold">{totalEmpty}</span> sel dengan data kosong
            </p>
          )}
          {totalInvalid > 0 && (
            <p className="text-sm text-yellow-800">
              • <span className="font-semibold">{totalInvalid}</span> sel dengan format salah (NIK / Tanggal / IMT)
            </p>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Data bermasalah akan tetap dieksport:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Data kosong → sel kosong di template</li>
            <li>• Format salah → nilai asli (perbaiki manual)</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium px-4 py-2.5 rounded-lg transition-colors text-sm w-full sm:w-auto"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Ulang
          </button>
          <button
            onClick={onContinue}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm w-full sm:flex-1"
          >
            <Download className="w-4 h-4" />
            Lanjut Export
          </button>
        </div>
      </div>
    </div>
  );
}
