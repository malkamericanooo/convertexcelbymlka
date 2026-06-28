import { PatientData } from "../types";

interface PreviewTableProps {
  patients: PatientData[];
}

const COLUMNS: { key: keyof PatientData; label: string }[] = [
  { key: "NIK", label: "NIK" },
  { key: "Nama", label: "Nama Pasien" },
  { key: "TanggalLahir", label: "Tanggal Lahir" },
  { key: "IMT", label: "IMT" },
  { key: "Alamat", label: "Alamat" },
  { key: "Telepon", label: "Telepon" },
];

export function PreviewTable({ patients }: PreviewTableProps) {
  if (patients.length === 0) {
    return <p className="text-gray-500 text-sm">Tidak ada data untuk ditampilkan.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 text-xs whitespace-nowrap">
              No.
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-600 text-xs whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {patients.map((patient, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-3 py-2 text-gray-500 text-xs">
                {idx + 1}
              </td>
              {COLUMNS.map((col) => {
                const val = patient[col.key];
                const display = typeof val === "string" ? val : "";
                return (
                  <td
                    key={col.key}
                    className="border border-gray-200 px-3 py-2 text-gray-700 text-xs max-w-[180px] truncate"
                    title={display}
                  >
                    {display || <span className="text-gray-400 italic">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
