export const BASE_URL = 'http://127.0.0.1:8000';

export async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const msg = `API ${res.status}: ${res.statusText}`;
      import('../components/Toast.jsx').then(m => m.toast(msg, 'error'));
      throw new Error(msg);
    }
    return await res.json();
  } catch (error) {
    if (error.name === 'TypeError') {
      // network/connection error
      import('../components/Toast.jsx').then(m => m.toast('Backend offline — ไม่สามารถเชื่อมต่อ API ได้', 'error'));
    }
    throw error;
  }
}
