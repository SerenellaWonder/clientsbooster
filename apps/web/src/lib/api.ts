import { getToken } from "@/lib/auth";

export const API_URL = "http://localhost:9000";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Risposta API non valida: ${text}`);
  }

  if (!response.ok) {
    throw new Error(data.error || "API error");
  }

  return data;
}