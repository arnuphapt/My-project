/* ============ SEED DATA ============ */
export const FX = 32.61; // THB per USD

// ---- AI Agents (roster maps to areas of the user's life) ----
export const agents = [
  {
    id: "joyuri_mock",
    name: "JOYURI",
    roleEn: "SECRETARY",
    roleTh: "เลขา",
    rarity: "legend",
    seniority: "secretary",
    status: "idle",
    lv: 1,
    salary: 1.0,
    desc: "เลขาประจำตัวสุดเก่ง พร้อมรับคำสั่งและจัดการงานทุกอย่าง",
    model: "opus",
    skillMd: "# JOYURI's Skills\n\n- **จัดการตารางงาน**\n- **สรุปเอกสาร**\n- **ค้นหาข้อมูลทั่วไป**"
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
  sysName1:'MY',
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
