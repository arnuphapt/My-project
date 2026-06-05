/* ============ TEAM — shared constants & helpers ============ */
import { OfficeStore } from '../../store';

export const DEFAULT_SENIOR = {
  ceo:      { label: 'CEO',       en: 'CEO',       stars: 5, col: '#ff5168', glow: 'rgba(255,81,104,.5)' },
  secretary:{ label: 'เลขา',     en: 'SECRETARY', stars: 5, col: '#ffce4a', glow: 'rgba(255,206,74,.45)' },
  senior:   { label: 'Senior',    en: 'SENIOR',    stars: 4, col: '#b06bff', glow: 'rgba(176,107,255,.45)' },
  mid:      { label: 'Mid-level', en: 'MID-LEVEL', stars: 3, col: '#4db4ff', glow: 'rgba(77,180,255,.40)' },
  junior:   { label: 'Junior',    en: 'JUNIOR',    stars: 2, col: '#3ce594', glow: 'rgba(60,229,148,.38)' },
  newgrad:  { label: 'New Grad',  en: 'NEW GRAD',  stars: 1, col: '#9aa6cf', glow: 'rgba(154,166,207,.30)' },
};

export const DEFAULT_MODELS = {
  opus:   { label: 'Opus',   full: 'Claude Opus',   col: '#ffce4a' },
  sonnet: { label: 'Sonnet', full: 'Claude Sonnet', col: '#b06bff' },
  haiku:  { label: 'Haiku',  full: 'Claude Haiku',  col: '#4db4ff' },
};

export const DEFAULT_MODEL_INFO = {
  opus:   { label: 'Claude Opus',   tier: 'FRONTIER', col: '#ffce4a', glow: 'rgba(255,206,74,.35)', desc: 'ฉลาดสูงสุด · เหมาะกับงานซับซ้อน', max: 5 },
  sonnet: { label: 'Claude Sonnet', tier: 'BALANCED', col: '#b06bff', glow: 'rgba(176,107,255,.35)', desc: 'สมดุลความเร็ว-คุณภาพ · ใช้งานทั่วไป', max: 4 },
  haiku:  { label: 'Claude Haiku',  tier: 'SWIFT',    col: '#4db4ff', glow: 'rgba(77,180,255,.35)', desc: 'เร็วที่สุด · งานเบา ตอบไว', max: 0 },
};

export const DEFAULT_ROLE_PRESETS = [
  { en: 'SECRETARY',  th: 'เลขา',        icon: '📋', desc: 'จัดตารางงาน ประสานทีม' },
  { en: 'ASSISTANT',  th: 'ผู้ช่วยทั่วไป', icon: '🤝', desc: 'ช่วยงานทุกด้าน ยืดหยุ่นสูง' },
  { en: 'DEVELOPER',  th: 'นักพัฒนา',    icon: '💻', desc: 'เขียนโค้ด ดูแลระบบ' },
  { en: 'DESIGNER',   th: 'ออกแบบ',      icon: '🎨', desc: 'UI/UX กราฟิก วิชวล' },
  { en: 'ANALYST',    th: 'นักวิเคราะห์', icon: '📊', desc: 'วิเคราะห์ข้อมูล รายงาน' },
  { en: 'WRITER',     th: 'นักเขียน',    icon: '✍️', desc: 'คอนเทนต์ คัดลอก SEO' },
  { en: 'MARKETER',   th: 'การตลาด',     icon: '📣', desc: 'โฆษณา แบรนด์ แคมเปญ' },
  { en: 'RESEARCHER', th: 'นักวิจัย',    icon: '🔬', desc: 'ค้นคว้า สรุป รายงาน' },
];

export const DEFAULT_PSTATUS = {
  'กำลังทำ': ['#ffce4a', 'r-legend'],
  'เสร็จแล้ว': ['#3ce594', 'r-rare'],
  'พัก': ['#9aa6cf', 'r-common'],
};

/** Get current team config from store (or defaults) */
export function getTeamCfg() {
  const custom = OfficeStore.getState().settings?.teamConfig || {};
  return {
    SENIOR: custom.SENIOR || DEFAULT_SENIOR,
    MODELS: custom.MODELS || DEFAULT_MODELS,
    MODEL_INFO: custom.MODEL_INFO || DEFAULT_MODEL_INFO,
    ROLE_PRESETS: custom.ROLE_PRESETS || DEFAULT_ROLE_PRESETS,
    PSTATUS: custom.PSTATUS || DEFAULT_PSTATUS,
  };
}

/** Backwards compatibility constants (used if explicit reference is needed) */
export const SENIOR       = DEFAULT_SENIOR;
export const MODELS       = DEFAULT_MODELS;
export const MODEL_INFO   = DEFAULT_MODEL_INFO;
export const ROLE_PRESETS = DEFAULT_ROLE_PRESETS;

/** Get seniority meta for an agent */
export const mdl = a => getTeamCfg().SENIOR[a.seniority] || getTeamCfg().SENIOR.mid;
/** Get model meta for an agent */
export const mdlMod = a => getTeamCfg().MODEL_INFO[a.model]  || getTeamCfg().MODEL_INFO.sonnet;

/** Pull a skill description from skill.md bullets */
export function abilityDesc(a, skill) {
  const md  = a.skillMd || '';
  const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m   = md.match(new RegExp('\\*\\*' + esc + '\\*\\*\\s*[—\\-:]+\\s*(.+)'));
  if (m) return m[1].trim();
  return 'ทักษะประจำตัวของ ' + a.name + ' ใช้ในงานสาย ' + a.roleTh + '.';
}

// Expose to window for legacy compatibility
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'SENIOR', { get: () => getTeamCfg().SENIOR });
  Object.defineProperty(window, 'MODELS', { get: () => getTeamCfg().MODELS });
  Object.defineProperty(window, 'MODEL_INFO', { get: () => getTeamCfg().MODEL_INFO });
  Object.defineProperty(window, 'ROLE_PRESETS', { get: () => getTeamCfg().ROLE_PRESETS });
  Object.defineProperty(window, 'PSTATUS', { get: () => getTeamCfg().PSTATUS });
}
