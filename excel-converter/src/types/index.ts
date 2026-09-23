export interface PatientData {
  NIK: string;
  Nama: string;
  TanggalLahir: string;
  IMT: string;
  Alamat: string;
  Telepon: string;
  Sistol?: string;
  Diastol?: string;
  rawValues: (string | number | boolean | null)[];
}

export type ValidationStatus = "valid" | "empty" | "invalid";

export interface ColumnValidation {
  column: string;
  emptyCount: number;
  invalidCount: number;
  status: ValidationStatus;
}

export interface RowValidation {
  rowIndex: number;
  data: PatientData;
  errors: Record<string, string>;
}

export interface ValidationResult {
  columnValidations: ColumnValidation[];
  rowValidations: RowValidation[];
  totalRows: number;
  validRows: number;
  problematicRows: number;
  totalEmpty: number;
  totalInvalid: number;
}

export interface ProcessResult {
  patients: PatientData[];
  validation: ValidationResult;
}

export type AppStep = "upload" | "processing" | "validated" | "exporting" | "done";

export interface NotificationState {
  visible: boolean;
  totalEmpty: number;
  totalInvalid: number;
}

export type AnomalySeverity = "high" | "medium" | "normal";

export interface PatientAnomaly {
  id: string;
  patient: PatientData;
  severity: AnomalySeverity;
  category: string;
  tensiStr: string;
  imtVal: number | null;
  reasons: string[];
  recommendedAction: string;
  formattedPhone: string;
  waMessage: string;
  waUrl: string;
  isSent?: boolean;
}
