import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileCheck, X } from "lucide-react";

interface FileUploadProps {
  onFileAccepted: (file: File) => void;
  currentFile: File | null;
  disabled?: boolean;
}

export function FileUpload({ onFileAccepted, currentFile, disabled = false }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0]);
      }
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    disabled,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (currentFile) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <FileCheck className="text-green-600 w-6 h-6 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{currentFile.name}</p>
            <p className="text-xs text-green-600">{formatFileSize(currentFile.size)}</p>
          </div>
        </div>
        {!disabled && (
          <button
            onClick={() => onFileAccepted(currentFile)}
            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            title="Ganti file"
            aria-label="Ganti file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} data-testid="file-input" />
        <UploadCloud className="mx-auto w-10 h-10 text-gray-400 mb-3" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium text-sm">Lepas file di sini...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium text-sm">
              Drag & drop file Excel, atau{" "}
              <span className="text-blue-600 underline">klik untuk memilih</span>
            </p>
            <p className="text-gray-400 text-xs mt-1">Hanya file .xlsx yang didukung</p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <p className="text-red-500 text-xs mt-2">
          File tidak valid. Hanya file .xlsx yang diterima.
        </p>
      )}
    </div>
  );
}
