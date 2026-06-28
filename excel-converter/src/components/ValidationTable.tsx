import { ColumnValidation, ValidationStatus } from "../types";

interface ValidationTableProps {
  validations: ColumnValidation[];
}

function StatusBadge({ status }: { status: ValidationStatus }) {
  if (status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
        ✅ Lengkap & Valid
      </span>
    );
  }
  if (status === "empty") {
    return (
      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
        ⚠️ Ada Data Kosong
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
      ❌ Format Salah
    </span>
  );
}

export function ValidationTable({ validations }: ValidationTableProps) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
              Kolom
            </th>
            <th className="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">
              Data Kosong
            </th>
            <th className="border border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">
              Format Salah
            </th>
            <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {validations.map((v, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border border-gray-200 px-3 py-2 text-gray-800 text-xs font-medium whitespace-nowrap">
                {v.column}
              </td>
              <td className="border border-gray-200 px-3 py-2 text-center text-xs">
                {v.emptyCount > 0 ? (
                  <span className="text-yellow-600 font-semibold">{v.emptyCount}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="border border-gray-200 px-3 py-2 text-center text-xs">
                {v.invalidCount > 0 ? (
                  <span className="text-red-600 font-semibold">{v.invalidCount}</span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="border border-gray-200 px-3 py-2">
                <StatusBadge status={v.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
