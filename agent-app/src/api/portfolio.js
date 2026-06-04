import { apiFetch } from './config.js';

export async function getHoldings() {
  return await apiFetch('/holdings/');
}

export async function createHolding(holdingData) {
  return await apiFetch('/holdings/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holdingData)
  });
}
