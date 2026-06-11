export type FormFieldType =
  | "text"
  | "email"
  | "number"
  | "phone"
  | "textarea"
  | "select"
  | "checkbox"
  | "url";

export interface FormFieldSchema {
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  helpText?: string;
}

export interface PublicFormSchema {
  id: number;
  title: string;
  description?: string;
  slug: string;
  requireAuth: boolean;
  schema: FormFieldSchema[];
  successMessage?: string | null;
  honeypotField?: string | null;
}

export interface SubmitResult {
  id: number;
  success: true;
  message?: string | null;
}

export interface RenderOptions {
  container: Element;
  slug: string;
  orgId: number | string;
  apiBase?: string;
  lang?: "fa" | "en";
  onSuccess?: (result: SubmitResult) => void;
  onError?: (error: Error) => void;
  submitLabel?: string;
}
