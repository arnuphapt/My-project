import { useState, useEffect } from 'react';
import { SEED } from './seed.js';
import { SYNC_PATHS } from './catalog.js';
import { getAgents, createAgent } from '../api/agents.js';
import { getProjects } from '../api/projects.js';
import { getSettings } from '../api/settings.js';

/* ============ GLOBAL STORE ENGINE ============ */
const LS = 'ai-office-v3';
const S = SEED;

export function freshState() {
  return {
    fx: S.FX,
    route: 'dashboard',
    player: { name: 'BOSS', level: 1, xp: 0, xpMax: 2000, coins: 0, gems: 0, company: 'MY OFFICE', ...(S.player || {}) },
    settings: { ...(S.settings || {}) },
    live: {
      connected: false,
      exchange: 'Binance',
      apiKey: '',
      apiSecret: '',
      botOn: false,
      riskPct: 2,
      maxCapital: 10000,
      tp: 5,
      sl: 3,
      mode: 'paper',
    },
    warroomPos: JSON.parse(JSON.stringify(S.warroomPos || {})),
    cash: { thb: 500000, usd: 5000 },
    holdings: (S.holdings || []).map(h => ({ ...h })),
    realized: { thb: 0, usd: 0 },
    txns: [],
    market: JSON.parse(JSON.stringify(S.market || {})),
    agents: (S.agents || []).map(a => ({ ...a, tasks: [] })),
    projects: (S.projects || []).map(p => ({ ...p })),
    secChat: [],
    syncedSkills: [],
    syncedAgents: [],
    syncMeta: { skills: null, team: null },
    skillAnno: {},
    teamChat: [],
    log: [],
  };
}

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS));
    if (!raw) return freshState();
    const base = freshState();
    // shallow-merge persisted onto fresh (so new fields appear)
    const merged = { ...base, ...raw };
    merged.settings = { ...base.settings, ...(raw.settings || {}) };
    merged.player = { ...base.player, ...(raw.player || {}) };
    merged.live = { ...base.live, ...(raw.live || {}) };
    merged.warroomPos = { ...base.warroomPos, ...(raw.warroomPos || {}) };
    // If the user has a saved market list, use it as the definitive list (so deleted defaults stay deleted)
    // but still merge metadata from base.market if it exists.
    if (raw.market) {
      merged.market = {};
      Object.keys(raw.market).forEach(k => {
        merged.market[k] = { ...(base.market[k] || {}), ...raw.market[k] };
      });
    } else {
      merged.market = {};
      Object.keys(base.market).forEach(k => {
        merged.market[k] = { ...base.market[k] };
      });
    }
    merged.route = 'dashboard';
    return merged;
  } catch (e) {
    return freshState();
  }
}

let state = load();
const subs = new Set();
let writeTimer = null;

export function persist(now) {
  if (now) {
    try {
      localStorage.setItem(LS, JSON.stringify(state));
    } catch (e) {}
    return;
  }
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try {
      localStorage.setItem(LS, JSON.stringify(state));
    } catch (e) {}
  }, 1500);
}

export function setState(patch, opts = {}) {
  state = (typeof patch === 'function') ? patch(state) : { ...state, ...patch };
  persist(opts.now);
  subs.forEach(f => f(state));
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function useOffice() {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force(n => n + 1)), []);
  return [state, setState];
}

// ── API Integration ───────────────────────────────────────────
export async function syncBackendData() {
  try {
    const [agentsData, projectsData, settingsData] = await Promise.all([
      getAgents().catch(() => []),
      getProjects().catch(() => []),
      getSettings().catch(() => ({}))
    ]);
    
    if (agentsData && agentsData.length > 0) {
      setState(st => {
        const curAgents = st.agents || [];
        const backendMap = new Map();
        agentsData.forEach(a => backendMap.set(a.id, a));

        const mergedAgents = curAgents.map(ca => {
          if (backendMap.has(ca.id)) {
            const b = backendMap.get(ca.id);
            return {
              ...ca,
              ...b,
              skills: b.skills && b.skills.length ? b.skills : ca.skills,
              skillMd: ca.skillMd || b.skillMd
            };
          }
          return ca;
        });

        agentsData.forEach(b => {
          if (!curAgents.some(ca => ca.id === b.id)) {
            mergedAgents.push({
              ...b,
              color: b.color || '#4db4ff',
              statusTh: b.status === 'idle' ? 'ว่าง' : 'กำลังทำงาน',
              skills: b.skills || [],
              tasks: []
            });
          }
        });

        return { ...st, agents: mergedAgents };
      }, { now: true });
    }

    if (projectsData && projectsData.length > 0) {
      setState({ projects: projectsData }, { now: true });
    }
    if (settingsData && Object.keys(settingsData).length > 0) {
      setState(st => ({ settings: { ...st.settings, ...settingsData } }), { now: true });
    }
  } catch (err) {
    console.error('Failed to sync data from Backend API', err);
  }
}

// ── Real Agents Auto-Loader ───────────────────────────────────────
export async function loadRealAgentsOnStartup() {
  if (typeof window === 'undefined' || !window.electronAPI?.scanSyncFolder) return;
  try {
    const files = await window.electronAPI.scanSyncFolder(SYNC_PATHS.agents);
    if (!files || files.length === 0) return;

    const AGENT_PALETTE = ['#4db4ff', '#b06bff', '#3ce594', '#ff5cc8', '#3ad0ff', '#ff8a5c', '#7c9cff', '#2fe0c2'];
    const parsedAgents = [];

    files.forEach((f, idx) => {
      if (!f.name.toLowerCase().endsWith('.md')) return;
      const text = f.text;
      let name = '';
      let desc = '';
      let model = 'sonnet';
      let tools = [];

      if (text.startsWith('---')) {
        const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (fmMatch) {
          const fm = fmMatch[1];
          const nameMatch = fm.match(/^name:\s*(.+)$/m);
          const modelMatch = fm.match(/^model:\s*(.+)$/m);
          const descMatch = fm.match(/^description:\s*(.+)$/m);
          const toolsMatch = fm.match(/^tools:\s*(.+)$/m);
          if (nameMatch) name = nameMatch[1].trim();
          if (modelMatch) model = modelMatch[1].trim();
          if (descMatch) desc = descMatch[1].trim();
          if (toolsMatch) tools = toolsMatch[1].split(',').map(t => t.trim()).filter(Boolean);
        }
      }

      const heading = (text.match(/^#\s+(.+)$/m) || [])[1];
      if (!name) {
        const rawName = (heading || f.name.replace(/\.md$/i, '')).trim().split('·')[0].trim();
        name = rawName.split(/\s+/).slice(0, 2).join(' ');
      }
      if (!name) return;
      if (!desc) {
        desc = (text.match(/^>\s+(.+)$/m) || [])[1] || `ผู้เชี่ยวชาญ ${name}`;
      }
      const roleTh = desc.split('—')[0].trim().slice(0, 40);
      const sk = [...text.matchAll(/^[-*]\s+\*\*(.+?)\*\*/gm)].map(m => m[1].trim()).slice(0, 5);
      const finalSkills = sk.length > 0 ? sk : (tools.length > 0 ? tools : ['งานทั่วไป']);
      const agentId = f.name.replace(/\.md$/i, '').toLowerCase().replace(/\s+/g, '-');

      parsedAgents.push({
        id: agentId,
        name: name,
        roleEn: f.name.replace(/\.md$/i, '').toUpperCase(),
        roleTh: roleTh || name,
        color: AGENT_PALETTE[idx % AGENT_PALETTE.length],
        status: 'idle',
        statusTh: 'ว่าง',
        desc: desc,
        model: model || 'sonnet',
        skills: finalSkills,
        tasks: [],
        skillMd: text,
      });
    });

    // Load Yuri's canonical definition & settings from E:\WorkSpace\Joryui-agent
    let yuriCanonicalText = null;
    let yuriModel = null;
    let yuriEffort = null;

    try {
      if (SYNC_PATHS.canonicalYuri) {
        const rootFiles = await window.electronAPI.scanSyncFolder(SYNC_PATHS.canonicalYuri);
        const claudeMd = rootFiles.find(f => f.name.toUpperCase() === 'CLAUDE.MD' && (!f.path.includes('/') || f.path === 'CLAUDE.md'));
        if (claudeMd && claudeMd.text) {
          yuriCanonicalText = claudeMd.text;
        }

        // Look for .claude/settings.json or .claude/settings.local.json
        const settingsFile = rootFiles.find(f => 
          f.name.toLowerCase() === 'settings.json' || 
          f.name.toLowerCase() === 'settings.local.json' ||
          f.path.toLowerCase().includes('.claude/settings')
        );

        if (settingsFile && settingsFile.text) {
          try {
            const parsed = JSON.parse(settingsFile.text);
            // Model parsing
            const rawModel = parsed.model || parsed.defaultModel || parsed.preferredModel || parsed.agentModel;
            if (rawModel) {
              const low = rawModel.toLowerCase();
              if (low.includes('opus')) yuriModel = 'opus';
              else if (low.includes('haiku')) yuriModel = 'haiku';
              else if (low.includes('sonnet') || low.includes('claude')) yuriModel = 'sonnet';
              else yuriModel = low;
            }
            // Effort parsing (number 1-5 or high/medium/low string)
            const rawEffort = parsed.effort ?? parsed.thinkingEffort ?? parsed.effortLevel ?? parsed.thinking?.effort;
            if (typeof rawEffort === 'number') {
              yuriEffort = rawEffort;
            } else if (typeof rawEffort === 'string') {
              const low = rawEffort.toLowerCase();
              if (low === 'high' || low === 'max') yuriEffort = 4;
              else if (low === 'medium' || low === 'med') yuriEffort = 3;
              else if (low === 'low') yuriEffort = 2;
              else if (low === 'min') yuriEffort = 1;
            }
          } catch (_) {}
        }
      }
    } catch (_) {}

    if (parsedAgents.length > 0 || yuriCanonicalText || yuriModel || yuriEffort != null) {
      setState(st => {
        const curAgents = st.agents || [];
        let secAgent = curAgents.find(a => a.seniority === 'secretary' || a.id === 'joyuri' || (a.roleTh && a.roleTh.includes('เลขา')));
        
        if (!secAgent) {
          secAgent = {
            id: 'joyuri',
            name: 'YURI',
            roleEn: 'SECRETARY',
            roleTh: 'เลขา · ผู้ประสานงานหลัก',
            seniority: 'secretary',
            status: 'idle',
            statusTh: 'ว่าง',
            color: '#ffce4a',
            desc: 'พี่สาวผู้ช่วยและผู้ประสานงานหลัก (Chief of Staff) ดูแลระบบและประสานงานทีม AI',
            model: yuriModel || 'sonnet',
            effort: yuriEffort != null ? yuriEffort : 4,
            skills: ['วิเคราะห์งาน', 'บริหารจัดการโปรเจกต์', 'ประสานงาน AI', 'Orchestration'],
            tasks: [],
            skillMd: yuriCanonicalText || '# YURI — เลขาและผู้ประสานงานหลัก\n\n> ผู้ช่วยส่วนตัวและ Chief of Staff ของระบบ JOYURI'
          };
        } else {
          secAgent = {
            ...secAgent,
            ...(yuriCanonicalText ? { skillMd: yuriCanonicalText } : {}),
            ...(yuriModel ? { model: yuriModel } : {}),
            ...(yuriEffort != null ? { effort: yuriEffort } : {})
          };
        }

        const otherAgents = [];
        const existingIds = new Set([secAgent.id]);
        
        parsedAgents.forEach(pa => {
          if (!existingIds.has(pa.id)) {
            existingIds.add(pa.id);
            const existing = curAgents.find(a => a.id === pa.id);
            otherAgents.push(existing ? { ...pa, ...existing, skillMd: pa.skillMd, skills: pa.skills, desc: pa.desc } : pa);
          }
        });

        // Ensure specialist subagents (Codex & AGY) are always present in the team
        const SPECIALISTS = [
          {
            id: 'codex',
            name: 'CODEX',
            roleEn: 'CODE SPECIALIST',
            roleTh: 'ผู้เชี่ยวชาญโค้ดและคำสั่ง (Codex)',
            seniority: 'senior',
            status: 'idle',
            statusTh: 'ว่าง',
            color: '#46b6ff',
            desc: 'ผู้เชี่ยวชาญรันคำสั่ง terminal, สร้างโค้ด และประมวลผลงานโครงสร้างผ่าน OpenAI Codex CLI',
            model: 'codex',
            worker: 'codex',
            skills: ['Terminal Execution', 'Code Generation', 'Autonomous Workflow'],
            tasks: [],
            skillMd: '# OPENAI CODEX — ผู้เชี่ยวชาญงานโค้ด\n\n> Specialist AI Subagent ขับเคลื่อนด้วย Codex Engine\n\n## หน้าที่\n- ประมวลผลและรันคำสั่ง command execution อัตโนมัติ\n- เขียนและแก้ไขโค้ดที่ต้องการความแม่นยำสูง'
          },
          {
            id: 'agy',
            name: 'AGY',
            roleEn: 'RESEARCH SPECIALIST',
            roleTh: 'ผู้เชี่ยวชาญค้นคว้า (Antigravity)',
            seniority: 'senior',
            status: 'idle',
            statusTh: 'ว่าง',
            color: '#b06bff',
            desc: 'ผู้เชี่ยวชาญค้นหาข้อมูลเชิงลึก Web-Grounded Search และ Cross-Model Verification ผ่าน Antigravity CLI',
            model: 'agy',
            worker: 'agy',
            skills: ['Web Search', 'Research Sweep', 'Cross-Model Verification'],
            tasks: [],
            skillMd: '# GOOGLE ANTIGRAVITY (AGY) — ผู้เชี่ยวชาญงานวิจัย\n\n> Specialist AI Subagent ขับเคลื่อนด้วย Google Antigravity CLI\n\n## หน้าที่\n- ค้นคว้าข้อมูลสดจากเว็บ (Web-Grounded Search)\n- รีวิวและตรวจสอบข้อเท็จจริงแบบ Cross-Model Check'
          }
        ];

        SPECIALISTS.forEach(sp => {
          if (!existingIds.has(sp.id)) {
            existingIds.add(sp.id);
            const existing = curAgents.find(a => a.id === sp.id);
            otherAgents.push(existing ? { ...sp, ...existing } : sp);
          }
        });

        return { ...st, agents: [secAgent, ...otherAgents] };
      }, { now: true });
    }
  } catch (err) {
    console.error('Failed to load real agents on startup', err);
  }
}

// Auto-sync on load: run agent loading first and ensure it persists after backend sync
loadRealAgentsOnStartup();
setTimeout(loadRealAgentsOnStartup, 100);
setTimeout(syncBackendData, 500);
setTimeout(loadRealAgentsOnStartup, 1200);

