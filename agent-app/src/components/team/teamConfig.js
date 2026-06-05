/* ============ TEAM — shared constants & helpers ============ */

export const SENIOR = {
  ceo:      { label: 'CEO',       en: 'CEO',       stars: 5, col: '#ff5168', glow: 'rgba(255,81,104,.5)' },
  secretary:{ label: 'เลขา',     en: 'SECRETARY', stars: 5, col: '#ffce4a', glow: 'rgba(255,206,74,.45)' },
  senior:   { label: 'Senior',    en: 'SENIOR',    stars: 4, col: '#b06bff', glow: 'rgba(176,107,255,.45)' },
  mid:      { label: 'Mid-level', en: 'MID-LEVEL', stars: 3, col: '#4db4ff', glow: 'rgba(77,180,255,.40)' },
  junior:   { label: 'Junior',    en: 'JUNIOR',    stars: 2, col: '#3ce594', glow: 'rgba(60,229,148,.38)' },
  newgrad:  { label: 'New Grad',  en: 'NEW GRAD',  stars: 1, col: '#9aa6cf', glow: 'rgba(154,166,207,.30)' },
};

export const MODELS = {
  opus:   { label: 'Opus',   full: 'Claude Opus',   col: '#ffce4a' },
  sonnet: { label: 'Sonnet', full: 'Claude Sonnet', col: '#b06bff' },
  haiku:  { label: 'Haiku',  full: 'Claude Haiku',  col: '#4db4ff' },
};

export const MODEL_INFO = {
  opus:   { label: 'Claude Opus',   tier: 'FRONTIER', col: '#ffce4a', glow: 'rgba(255,206,74,.35)', desc: 'ฉลาดสูงสุด · เหมาะกับงานซับซ้อน' },
  sonnet: { label: 'Claude Sonnet', tier: 'BALANCED', col: '#b06bff', glow: 'rgba(176,107,255,.35)', desc: 'สมดุลความเร็ว-คุณภาพ · ใช้งานทั่วไป' },
  haiku:  { label: 'Claude Haiku',  tier: 'SWIFT',    col: '#4db4ff', glow: 'rgba(77,180,255,.35)', desc: 'เร็วที่สุด · งานเบา ตอบไว' },
};

export const ROLE_PRESETS = [
  { en: 'SECRETARY',  th: 'เลขา',        icon: '📋', desc: 'จัดตารางงาน ประสานทีม' },
  { en: 'ASSISTANT',  th: 'ผู้ช่วยทั่วไป', icon: '🤝', desc: 'ช่วยงานทุกด้าน ยืดหยุ่นสูง' },
  { en: 'DEVELOPER',  th: 'นักพัฒนา',    icon: '💻', desc: 'เขียนโค้ด ดูแลระบบ' },
  { en: 'DESIGNER',   th: 'ออกแบบ',      icon: '🎨', desc: 'UI/UX กราฟิก วิชวล' },
  { en: 'ANALYST',    th: 'นักวิเคราะห์', icon: '📊', desc: 'วิเคราะห์ข้อมูล รายงาน' },
  { en: 'WRITER',     th: 'นักเขียน',    icon: '✍️', desc: 'คอนเทนต์ คัดลอก SEO' },
  { en: 'MARKETER',   th: 'การตลาด',     icon: '📣', desc: 'โฆษณา แบรนด์ แคมเปญ' },
  { en: 'RESEARCHER', th: 'นักวิจัย',    icon: '🔬', desc: 'ค้นคว้า สรุป รายงาน' },
];

/** Get seniority meta for an agent */
export const mdl    = a => SENIOR[a.seniority] || SENIOR.mid;
/** Get model meta for an agent */
export const mdlMod = a => MODELS[a.model]     || MODELS.sonnet;

/** Pull a skill description from skill.md bullets */
export function abilityDesc(a, skill) {
  const md  = a.skillMd || '';
  const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m   = md.match(new RegExp('\\*\\*' + esc + '\\*\\*\\s*[—\\-:]+\\s*(.+)'));
  if (m) return m[1].trim();
  return 'ทักษะประจำตัวของ ' + a.name + ' ใช้ในงานสาย ' + a.roleTh + '.';
}

// Expose to window for legacy compatibility (OrgChart etc.)
if (typeof window !== 'undefined') {
  window.SENIOR = SENIOR;
  window.MODELS  = MODELS;
}
