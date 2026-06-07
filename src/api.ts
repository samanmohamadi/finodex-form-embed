import type { PublicFormSchema, SubmitResult } from "./types";

interface ApiResponse<T> {
  status: number;
  data: T | null;
  error: string | null;
}

function unwrap<T>(raw: any): T {
  const body = raw as ApiResponse<T>;
  if (body?.error || body?.data == null) {
    throw new Error(body?.error || "Unknown error");
  }
  return body.data as T;
}

export async function fetchSchema(
  apiBase: string,
  orgId: number | string,
  slug: string
): Promise<PublicFormSchema> {
  const url = `${apiBase.replace(/\/$/, "")}/c/org/${orgId}/forms/${encodeURIComponent(slug)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "omit",
  });
  if (!resp.ok && resp.status !== 200) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${resp.status}`);
  }
  return unwrap<PublicFormSchema>(await resp.json());
}

export async function submitForm(
  apiBase: string,
  orgId: number | string,
  slug: string,
  data: Record<string, any>
): Promise<SubmitResult> {
  const url = `${apiBase.replace(/\/$/, "")}/c/org/${orgId}/forms/${encodeURIComponent(slug)}/submit`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
    credentials: "omit",
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(json?.error || `HTTP ${resp.status}`);
  }
  return unwrap<SubmitResult>(json);
}
