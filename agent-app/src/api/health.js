import { BASE_URL } from './config.js';

export async function checkApiHealth() {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error('API Offline');
  return { status: 'online', latency: Date.now() - start };
}
