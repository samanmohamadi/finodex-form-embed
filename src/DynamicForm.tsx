import { useEffect, useMemo, useState } from "preact/hooks";
import { fetchSchema, submitForm } from "./api";
import type {
  FormFieldSchema,
  PublicFormSchema,
  RenderOptions,
  SubmitResult,
} from "./types";

interface Props {
  slug: string;
  orgId: number | string;
  apiBase: string;
  onSuccess?: RenderOptions["onSuccess"];
  onError?: RenderOptions["onError"];
  submitLabel?: string;
}

interface FieldErrors {
  [name: string]: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(schema: FormFieldSchema[], values: Record<string, any>): FieldErrors {
  const errors: FieldErrors = {};
  for (const f of schema) {
    const raw = values[f.name];
    const present = raw !== undefined && raw !== null && raw !== "" && raw !== false;

    if (!present) {
      if (f.required && f.type !== "checkbox") errors[f.name] = `${f.label} is required`;
      if (f.required && f.type === "checkbox" && raw !== true) {
        errors[f.name] = `${f.label} is required`;
      }
      continue;
    }

    if (f.type === "email" && !EMAIL_RE.test(String(raw).trim())) {
      errors[f.name] = `${f.label} must be a valid email`;
      continue;
    }
    if (f.type === "url") {
      try {
        new URL(String(raw));
      } catch {
        errors[f.name] = `${f.label} must be a valid URL`;
        continue;
      }
    }
    if (typeof raw === "string") {
      if (f.maxLength != null && raw.length > f.maxLength) {
        errors[f.name] = `${f.label} is too long`;
        continue;
      }
      if (f.minLength != null && raw.length < f.minLength) {
        errors[f.name] = `${f.label} is too short`;
        continue;
      }
      if (f.pattern && !new RegExp(`^(?:${f.pattern})$`).test(raw)) {
        errors[f.name] = `${f.label} format is invalid`;
        continue;
      }
    }
    if (f.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) {
        errors[f.name] = `${f.label} must be a number`;
        continue;
      }
      if (f.min != null && n < f.min) errors[f.name] = `${f.label} is too small`;
      if (f.max != null && n > f.max) errors[f.name] = `${f.label} is too large`;
    }
  }
  return errors;
}

function coerceForSubmit(schema: FormFieldSchema[], values: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const f of schema) {
    const v = values[f.name];
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "number") out[f.name] = Number(v);
    else if (f.type === "checkbox") out[f.name] = !!v;
    else out[f.name] = v;
  }
  return out;
}

export function DynamicForm({ slug, orgId, apiBase, onSuccess, onError, submitLabel }: Props) {
  const [schema, setSchema] = useState<PublicFormSchema | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmitResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSchema(apiBase, orgId, slug)
      .then((s) => {
        if (cancelled) return;
        setSchema(s);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e?.message || "Failed to load form");
      });
    return () => {
      cancelled = true;
    };
  }, [apiBase, orgId, slug]);

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!schema) return;

    const errs = validate(schema.schema, values);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = coerceForSubmit(schema.schema, values);
      if (schema.honeypotField && honeypot) {
        payload[schema.honeypotField] = honeypot;
      }
      const result = await submitForm(apiBase, orgId, slug, payload);
      setSuccess(result);
      setValues({});
      onSuccess?.(result);
    } catch (e: any) {
      const msg = e?.message || "Submission failed";
      setSubmitError(msg);
      onError?.(e instanceof Error ? e : new Error(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return <div class="fdx-form-error">{loadError}</div>;
  }
  if (!schema) {
    return <div class="fdx-form-loading">Loading…</div>;
  }

  return (
    <form class="fdx-form" onSubmit={handleSubmit} noValidate>
      {schema.title && <h3 class="fdx-form-title">{schema.title}</h3>}
      {schema.description && <p class="fdx-form-description">{schema.description}</p>}

      {success && (
        <div class="fdx-form-success">{success.message || schema.successMessage || "Submitted"}</div>
      )}
      {submitError && <div class="fdx-form-submit-error">{submitError}</div>}

      {schema.schema.map((f) => (
        <Field
          key={f.name}
          field={f}
          value={values[f.name]}
          error={errors[f.name]}
          onChange={(v) => handleChange(f.name, v)}
        />
      ))}

      {schema.honeypotField && (
        <input
          class="fdx-form-honeypot"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          name={schema.honeypotField}
          value={honeypot}
          onInput={(e) => setHoneypot((e.target as HTMLInputElement).value)}
        />
      )}

      <button class="fdx-form-button" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : submitLabel || "Submit"}
      </button>
    </form>
  );
}

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldSchema;
  value: any;
  error?: string;
  onChange: (v: any) => void;
}) {
  const labelClass = useMemo(
    () => "fdx-form-label" + (field.required ? " fdx-form-label-required" : ""),
    [field.required]
  );

  if (field.type === "checkbox") {
    return (
      <label class="fdx-form-field">
        <span class="fdx-form-checkbox-row">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          />
          <span>{field.label}{field.required ? " *" : ""}</span>
        </span>
        {field.helpText && <span class="fdx-form-help">{field.helpText}</span>}
        {error && <span class="fdx-form-field-error">{error}</span>}
      </label>
    );
  }

  // Preact coerces `maxLength={undefined}` to the DOM property `''` → 0, which
  // would cap an unbounded field at zero characters. Omit the attr unless it's a
  // real number so "no maxLength" means unlimited.
  const lengthProps =
    field.maxLength != null ? { maxLength: field.maxLength } : {};
  const rangeProps: Record<string, number> = {};
  if (field.min != null) rangeProps.min = field.min;
  if (field.max != null) rangeProps.max = field.max;

  let control;
  if (field.type === "textarea") {
    control = (
      <textarea
        class="fdx-form-textarea"
        value={value ?? ""}
        placeholder={field.placeholder}
        {...lengthProps}
        onInput={(e) => onChange((e.target as HTMLTextAreaElement).value)}
      />
    );
  } else if (field.type === "select") {
    control = (
      <select
        class="fdx-form-select"
        value={value ?? ""}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      >
        <option value="">{field.placeholder || "— select —"}</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    const inputType =
      field.type === "email" ? "email" :
      field.type === "number" ? "number" :
      field.type === "url" ? "url" :
      field.type === "phone" ? "tel" : "text";
    control = (
      <input
        class="fdx-form-input"
        type={inputType}
        value={value ?? ""}
        placeholder={field.placeholder}
        {...lengthProps}
        {...rangeProps}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      />
    );
  }

  return (
    <label class="fdx-form-field">
      <span class={labelClass}>{field.label}</span>
      {control}
      {field.helpText && <span class="fdx-form-help">{field.helpText}</span>}
      {error && <span class="fdx-form-field-error">{error}</span>}
    </label>
  );
}
