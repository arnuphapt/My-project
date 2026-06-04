import { apiFetch } from './config.js';

export async function getSettings() {
  const data = await apiFetch('/settings/');
  const settingsObj = {};
  data.forEach(s => {
    try {
      settingsObj[s.key] = JSON.parse(s.value);
    } catch {
      settingsObj[s.key] = s.value;
    }
  });
  return settingsObj;
}

export async function saveSetting(key, value) {
  const strValue = typeof value === 'string' ? value : JSON.stringify(value);
  return await apiFetch('/settings/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value: strValue })
  });
}

export async function deleteSetting(key) {
  return await apiFetch(`/settings/${key}`, {
    method: 'DELETE'
  });
}
