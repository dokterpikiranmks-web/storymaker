"use client";

export class ApiClientError extends Error {
  readonly status: number;
  readonly data: Record<string, unknown>;
  constructor(message: string, status: number, data: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

type ApiInit = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit | null };

export async function apiFetch<T>(url: string, init: ApiInit = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    cache: "no-store",
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...(headers ?? {}) },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) {
    const errText = typeof data.error === "string" ? data.error : "";
    let message = errText;
    if (!message) {
      if (res.status === 504) {
        message = "Vercel Serverless Timeout (504): Eksekusi melebihi batas waktu Vercel. Gunakan skrip CLI 'npm run generate:today' sebagai fallback.";
      } else if (res.status === 503) {
        message = "Service Unavailable (503): Layanan Gemini atau Database sedang sibuk. Coba beberapa saat lagi atau gunakan skrip CLI.";
      } else if (res.status === 409) {
        message = "Konflik data (409): Campaign untuk tanggal ini sudah ada.";
      } else {
        message = `HTTP ${res.status}: ${res.statusText || "Permintaan gagal"}`;
      }
    }
    throw new ApiClientError(message, res.status, data);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Terjadi kesalahan";
}
