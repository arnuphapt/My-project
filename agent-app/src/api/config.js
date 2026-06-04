export const BASE_URL = 'http://127.0.0.1:8000';

export async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}
