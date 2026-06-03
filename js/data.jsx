/* ============ SEED DATA ============ */
(function(){
  const FX = 32.61; // THB per USD

  // ---- AI Agents (roster maps to areas of the user's life) ----
  const agents = [
    { id:'mira',   name:'Mira',   roleEn:'CHIEF OF STAFF', roleTh:'เลขาส่วนตัว · คุมทั้งระบบ', rarity:'legend', color:'#ffce4a',
      status:'working', statusTh:'ทำงานอยู่', last:'2 นาทีที่แล้ว', lv:30, salary:1.9,
      desc:'หัวหน้าเลขา ดูแลทุกอย่างในออฟฟิศ รับคำสั่งจากคุณแล้วกระจายงานให้ทีม AI คนอื่น ขี้เล่นนิดๆ แต่งานเป๊ะ',
      skills:['วางแผนงาน','สรุปสถานะ','มอบหมายงาน','เตือนความจำ'] },
    { id:'quant',  name:'Quant',  roleEn:'INVEST ANALYST', roleTh:'นักวิเคราะห์การลงทุน', rarity:'epic', color:'#b06bff',
      status:'working', statusTh:'เฝ้าพอร์ตอยู่', last:'เมื่อสักครู่', lv:24, salary:1.5,
      desc:'เฝ้าดูพอร์ตจำลอง วิเคราะห์หุ้น/กองทุน/คริปโต รายงานกำไร-ขาดทุน และเตือนเมื่อราคาขยับแรง',
      skills:['วิเคราะห์พอร์ต','คัดหุ้น','เฝ้าราคา','รายงาน PnL'] },
    { id:'devin',  name:'Devin',  roleEn:'DEVELOPER', roleTh:'นักพัฒนา · เขียนโค้ด', rarity:'epic', color:'#4db4ff',
      status:'thinking', statusTh:'กำลังคิด', last:'4 นาทีที่แล้ว', lv:22, salary:1.4,
      desc:'สร้างเครื่องมือ ออโตเมชัน และต้นแบบต่างๆ แปลงไอเดียเป็นของใช้งานได้',
      skills:['เขียนโค้ด','ออโตเมชัน','ทำ prototype','แก้บั๊ก'] },
    { id:'pixel',  name:'Pixel',  roleEn:'DESIGNER', roleTh:'กราฟิก · ออกแบบ', rarity:'epic', color:'#ff5cc8',
      status:'idle', statusTh:'ว่าง', last:'12 นาทีที่แล้ว', lv:20, salary:1.2,
      desc:'งานออกแบบทั้งหมด โลโก้ แบนเนอร์ UI งานพิกเซลอาร์ต',
      skills:['ออกแบบ UI','พิกเซลอาร์ต','โลโก้','แบนเนอร์'] },
    { id:'echo',   name:'Echo',   roleEn:'CONTENT', roleTh:'คอนเทนต์ · โซเชียล', rarity:'rare', color:'#3ad0ff',
      status:'idle', statusTh:'ว่าง', last:'20 นาทีที่แล้ว', lv:15, salary:0.9,
      desc:'เขียนคอนเทนต์ คิดแคปชั่น วางแผนโพสต์ ตอบคอมเมนต์',
      skills:['เขียนคอนเทนต์','วางแผนโพสต์','คิดแคปชั่น'] },
    { id:'ledger', name:'Ledger', roleEn:'FINANCE', roleTh:'การเงิน · บัญชี', rarity:'rare', color:'#3ce594',
      status:'working', statusTh:'ปิดงบอยู่', last:'8 นาทีที่แล้ว', lv:14, salary:0.9,
      desc:'จดบันทึกรายรับรายจ่าย สรุปกระแสเงินสด และเตือนบิลที่ต้องจ่าย',
      skills:['ทำบัญชี','สรุปงบ','เตือนบิล'] },
    { id:'scout',  name:'Scout',  roleEn:'RESEARCH', roleTh:'ค้นคว้า · หาข้อมูล', rarity:'rare', color:'#9aa6cf',
      status:'idle', statusTh:'ว่าง', last:'35 นาทีที่แล้ว', lv:12, salary:0.7,
      desc:'หาข้อมูล สรุปบทความ เทียบตัวเลือก ก่อนตัดสินใจ',
      skills:['หาข้อมูล','สรุปบทความ','เปรียบเทียบ'] },
    { id:'tidy',   name:'Tidy',   roleEn:'OPERATIONS', roleTh:'จัดระบบ · งานออฟฟิศ', rarity:'common', color:'#9aa6cf',
      status:'working', statusTh:'จัดไฟล์อยู่', last:'เมื่อสักครู่', lv:9, salary:0.5,
      desc:'จัดระเบียบไฟล์ ตั้งเวลานัด ดูแลความเรียบร้อยของระบบ',
      skills:['จัดไฟล์','ตั้งนัด','เก็บกวาด'] },
  ];

  // ---- Market assets (price in native currency) ----
  const mk = (symbol,name,cls,price,cur,prev)=>({symbol,name,cls,price,cur,prevClose:prev??price,seed:price});
  const market = {
    // Thai stocks (THB)
    PTT:    mk('PTT','ปตท.','SET',35.25,'THB',35.75),
    AOT:    mk('AOT','ท่าอากาศยานไทย','SET',58.50,'THB',57.25),
    CPALL:  mk('CPALL','ซีพี ออลล์','SET',61.00,'THB',60.25),
    KBANK:  mk('KBANK','กสิกรไทย','SET',158.50,'THB',160.00),
    ADVANC: mk('ADVANC','แอดวานซ์','SET',281.00,'THB',278.00),
    DELTA:  mk('DELTA','เดลต้า','SET',122.50,'THB',125.00),
    // US stocks (USD)
    AAPL:  mk('AAPL','Apple','US',212.40,'USD',214.10),
    NVDA:  mk('NVDA','NVIDIA','US',131.80,'USD',128.50),
    TSLA:  mk('TSLA','Tesla','US',242.10,'USD',248.30),
    MSFT:  mk('MSFT','Microsoft','US',451.20,'USD',449.00),
    GOOGL: mk('GOOGL','Alphabet','US',178.60,'USD',177.20),
    AMZN:  mk('AMZN','Amazon','US',201.30,'USD',203.50),
    // Mutual funds (THB NAV)
    SCBSET:   mk('SCBSET','SCB SET Index','FUND',18.42,'THB',18.30),
    KFGBRAND: mk('KFGBRAND','KF Global Brands','FUND',24.85,'THB',24.60),
    TMBGQG:   mk('TMBGQG','TMB Global Quality','FUND',16.10,'THB',16.22),
    SCBGOLD:  mk('SCBGOLD','SCB Gold','FUND',12.74,'THB',12.55),
    // Crypto (USD)
    BTC:  mk('BTC','Bitcoin','CRYPTO',73042,'USD',75600),
    ETH:  mk('ETH','Ethereum','CRYPTO',1977,'USD',2068),
    SOL:  mk('SOL','Solana','CRYPTO',80.53,'USD',83.10),
    BNB:  mk('BNB','BNB','CRYPTO',635.59,'USD',652.40),
    XRP:  mk('XRP','XRP','CRYPTO',1.28,'USD',1.33),
    DOGE: mk('DOGE','Dogecoin','CRYPTO',0.0979,'USD',0.1012),
  };

  // ---- Starting portfolio ----
  const holdings = [
    { symbol:'NVDA', qty:8,    avgCost:120.50 },
    { symbol:'AOT',  qty:500,  avgCost:55.00 },
    { symbol:'BTC',  qty:0.05, avgCost:68000 },
    { symbol:'SCBSET', qty:1200, avgCost:17.80 },
  ];

  // ---- Projects (resume/CV data) ----
  const projects = [
    { id:'p1', title:'AI Agent Office', role:'Founder / Builder', status:'กำลังทำ', progress:72,
      period:'2026 – ปัจจุบัน', tags:['React','UX','Automation','Product'], cover:'proj-1',
      summary:'ระบบจัดการชีวิตส่วนตัวรูปแบบออฟฟิศจำลอง มีพนักงาน AI ช่วยงานแต่ละด้าน',
      highlights:['ออกแบบ flow ทั้งระบบ 6 หน้า','พอร์ตลงทุนจำลองเรียลไทม์','เลขา AI สั่งงานทีมได้'] },
    { id:'p2', title:'Crypto Grid Bot', role:'Developer', status:'เสร็จแล้ว', progress:100,
      period:'2025', tags:['Python','Trading','API'], cover:'proj-2',
      summary:'บอทเทรดแบบ grid เชื่อม API ตลาด คอยจับช่วงราคาอัตโนมัติ',
      highlights:['ทำกำไรเฉลี่ย 4% ต่อเดือน','ระบบแจ้งเตือนผ่านไลน์','backtest 2 ปี'] },
    { id:'p3', title:'Pixel Portfolio Site', role:'Designer / Dev', status:'เสร็จแล้ว', progress:100,
      period:'2024', tags:['HTML','Pixel Art','Web'], cover:'proj-3',
      summary:'เว็บพอร์ตโฟลิโอสไตล์พิกเซลอาร์ต โชว์ผลงานและทักษะ',
      highlights:['ยอดเข้าชม 12k+','โหลดไว < 1s','responsive ครบ'] },
  ];

  // ---- Assets ----
  const assetGroups = [
    { id:'img',  name:'IMAGES',  th:'รูปภาพ / สกรีนช็อต', count:6 },
    { id:'logo', name:'LOGOS',   th:'โลโก้ / แบรนด์', count:4 },
    { id:'pix',  name:'PIXEL ART', th:'พิกเซลอาร์ต / ตัวละคร', count:6 },
    { id:'doc',  name:'DOCS',    th:'เอกสาร / สเปก', count:4 },
  ];

  const player = { name:'BOSS', level:24, xp:1200, xpMax:2000, coins:12450, gems:320, company:'MY OFFICE' };

  // ---- Warroom character token positions (% of stage) ----
  const warroomPos = {
    mira:   {x:50, y:34},
    quant:  {x:34, y:44},
    devin:  {x:62, y:42},
    pixel:  {x:26, y:60},
    echo:   {x:72, y:56},
    ledger: {x:44, y:62},
    scout:  {x:64, y:70},
    tidy:   {x:38, y:74},
  };

  // ---- Settings (system identity + owner profile for CV) ----
  const settings = {
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
    accent:'cyan',
  };

  window.SEED = { FX, agents, market, holdings, projects, assetGroups, player, settings, warroomPos };
})();
