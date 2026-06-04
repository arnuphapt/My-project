import { apiFetch } from './config.js';

export async function getAgents() {
  return await apiFetch('/agents/');
}

export async function createAgent(agentData) {
  return await apiFetch('/agents/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agentData)
  });
}
