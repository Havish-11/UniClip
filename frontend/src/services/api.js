export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL ?? API_URL.replace(/^http/, 'ws');

async function request(path, opts) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, opts);
  } catch {
    throw new Error('Cannot reach the server');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message ?? 'Request failed');
  return body;
}

export const createSession = () => request('/api/sessions', { method: 'POST' });
export const checkSession = (code) => request(`/api/sessions/${encodeURIComponent(code)}`);