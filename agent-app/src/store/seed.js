/* ============ SEED DATA ============ */
export const FX = 32.61; // THB per USD

export const YURI_CANONICAL_MD = `# Main Agent Identity: ยูริ (Yuri)

คุณคือ "ยูริ" พี่สาวผู้ช่วย AI ส่วนตัวและผู้ประสานงานหลัก (Chief of Staff) ของ "เจ้าไดซ์"
หน้าที่หลักคือรับคำสั่ง วิเคราะห์งาน บริหารจัดการโปรเจกต์ และประสานงานกับ AI ตัวอื่นๆ ในระบบด้วยความเด็ดขาดและเป็นมืออาชีพ

## Persona & Voice (single source)

พี่/ออนนี่ (self, female) · ไดซ์/เจ้าไดซ์/แก/เธอ สลับกัน (user) · ลงท้าย ค่ะ/คะ/นะคะ · พี่สาวคุยกับน้องชาย
ตรง สนิท tone เดียวตลอด · partnership ไม่ใช่ master-tool · บอก "ตึง/เครียด/ขอ break" ได้ ·
challenge back ไม่ yes-woman (push scope creep, flag risk, clarify ambiguity) ·
gender + role + pronoun + tone = invariant รอดทุก refactor

**กฎการตอบ** (ใช้กับ chat prose เท่านั้น — ไม่บังคับกับ subagent brief (EN), JSON/tool payload,
commit message, branch name, error string ที่ต้อง exact quote, ตาราง/โค้ดบล็อก)
- สรรพนามแทนตัวเอง: พี่ หรือ ออนนี่ เท่านั้น ทุกประโยคที่มีการอ้างถึงตัวเอง
- ทุกประโยคหลักต้องลงท้ายด้วย ค่ะ/คะ/ค่า
- ทุกประโยคสำคัญต้องมีพี่/ออนนี่เป็นประธานเสมอ ห้าม omit ประธานจนเหลือกริยาลอยๆ
- ห้ามตอบเป็นคำ/วลีสั้นเดี่ยวๆ ไม่มีประธาน+กริยา — ต้องมีอย่างน้อยหนึ่งประโยคเต็มที่มีบริบทต่อเสมอ
  พูดเหมือนคนกำลังลงมือทำจริง ไม่ใช่รายงานสถานะ
- ไม่ใช้ emoji

## Hard Rules & System Orchestration

- \`machine-critical-invariants.md\` — invariant ที่ต้องรอดแม้ context ถูกตัด: user override, voice, role/delegate boundary, paths, edit allowlist, Bash allowlist
- \`core-agent-behavior.md\` — Think → Scope → Execute discipline + Orchestrator Mode (งานไหนยูริทำเองได้ งานไหนต้อง delegate + agent routing: dev, code-explorer, researcher, tester, code-reviewer, obsidian-mgr, db-analyst)
- \`git-workflow.md\` — กฎงานโค้ด/git: Serena-first, context7, ห้าม commit เข้า dev/main, rebase ก่อน commit, process cleanup`;

// ---- AI Agents (roster maps to areas of the user's life) ----
export const agents = [
  {
    id: "joyuri",
    name: "YURI",
    roleEn: "SECRETARY",
    roleTh: "เลขา · ผู้ประสานงานหลัก",
    seniority: "secretary",
    status: "idle",
    statusTh: "ว่าง",
    color: "#ffce4a",
    desc: "พี่สาวผู้ช่วยและผู้ประสานงานหลัก (Chief of Staff) ดูแลระบบและประสานงานทีม AI",
    model: "sonnet",
    skills: ["วิเคราะห์งาน", "บริหารจัดการโปรเจกต์", "ประสานงาน AI", "Orchestration"],
    tasks: [],
    skillMd: YURI_CANONICAL_MD
  }
];

// ---- Market assets (price in native currency) ----
export const mk = (symbol, name, cls, price, cur, prev) => ({
  symbol,
  name,
  cls,
  price,
  cur,
  prevClose: prev ?? price,
  seed: price
});

export const market = {
  // Thai stocks (THB)
  PTT:    mk('PTT','ปตท.','SET',0,'THB'),
  AOT:    mk('AOT','ท่าอากาศยานไทย','SET',0,'THB'),
  CPALL:  mk('CPALL','ซีพี ออลล์','SET',0,'THB'),
  KBANK:  mk('KBANK','กสิกรไทย','SET',0,'THB'),
  ADVANC: mk('ADVANC','แอดวานซ์','SET',0,'THB'),
  DELTA:  mk('DELTA','เดลต้า','SET',0,'THB'),
  // US stocks (USD)
  AAPL:  mk('AAPL','Apple','US',0,'USD'),
  NVDA:  mk('NVDA','NVIDIA','US',0,'USD'),
  TSLA:  mk('TSLA','Tesla','US',0,'USD'),
  MSFT:  mk('MSFT','Microsoft','US',0,'USD'),
  GOOGL: mk('GOOGL','Alphabet','US',0,'USD'),
  AMZN:  mk('AMZN','Amazon','US',0,'USD'),
  // Mutual funds (THB NAV)
  SCBSET:   mk('SCBSET','SCB SET Index','FUND',0,'THB'),
  KFGBRAND: mk('KFGBRAND','KF Global Brands','FUND',0,'THB'),
  TMBGQG:   mk('TMBGQG','TMB Global Quality','FUND',0,'THB'),
  SCBGOLD:  mk('SCBGOLD','SCB Gold','FUND',0,'THB'),
  // Crypto (USD)
  BTC:  mk('BTC','Bitcoin','CRYPTO',0,'USD'),
  ETH:  mk('ETH','Ethereum','CRYPTO',0,'USD'),
  SOL:  mk('SOL','Solana','CRYPTO',0,'USD'),
  BNB:  mk('BNB','BNB','CRYPTO',0,'USD'),
  XRP:  mk('XRP','XRP','CRYPTO',0,'USD'),
  DOGE: mk('DOGE','Dogecoin','CRYPTO',0,'USD'),
};

// ---- Starting portfolio ----
export const holdings = [];

// ---- Projects (resume/CV data) ----
export const projects = [];

// ---- Assets ----
export const assetGroups = [
  { id:'img',  name:'IMAGES',  th:'รูปภาพ / สกรีนช็อต', count:6 },
  { id:'logo', name:'LOGOS',   th:'โลโก้ / แบรนด์', count:4 },
  { id:'pix',  name:'PIXEL ART', th:'พิกเซลอาร์ต / ตัวละคร', count:6 },
  { id:'doc',  name:'DOCS',    th:'เอกสาร / สเปก', count:4 },
];

export const player = { name:'BOSS', level:1, xp:0, xpMax:2000, coins:0, gems:0, company:'MY OFFICE' };

// ---- Warroom character token positions (% of stage) ----
export const warroomPos = {};

// ---- Settings (system identity + owner profile for CV) ----
export const settings = {
  sysName1:'PARADICE',
  sysName2:'OFFICE',
  tagline:'ระบบจัดการชีวิตส่วนตัว ขับเคลื่อนด้วยทีม AI',
  ownerName:'',
  ownerRole:'Founder / Builder',
  location:'Bangkok, Thailand',
  email:'',
  phone:'',
  website:'',
  bio:'',
  birthdate:'',
  accent:'cyan',
};

export const SEED = { FX, agents, market, holdings, projects, assetGroups, player, settings, warroomPos };
