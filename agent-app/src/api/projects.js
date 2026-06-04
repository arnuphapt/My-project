import { apiFetch } from './config.js';

export async function getProjects() {
  const data = await apiFetch('/projects/');
  // Convert tags string back to array, highlights back to array
  return data.map(p => ({
    ...p,
    tags: p.tags ? p.tags.split(',') : [],
    highlights: p.highlights ? JSON.parse(p.highlights) : []
  }));
}

export async function createProject(projectData) {
  // Convert tags array to string, highlights array to JSON string
  const payload = {
    ...projectData,
    tags: (projectData.tags || []).join(','),
    highlights: JSON.stringify(projectData.highlights || [])
  };
  return await apiFetch('/projects/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
