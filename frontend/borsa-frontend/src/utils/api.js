export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export function apiHeaders(token, includeJson = false) {
  return {
    Accept: 'application/json',
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function readJsonResponse(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
