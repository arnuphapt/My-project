export const SYNC_PATHS = {
  skills: 'E:\\WorkSpace\\claude-master\\skills',
  agents: 'E:\\WorkSpace\\claude-master\\agents',
};

/* ---- helpers to fabricate bundle file contents ---- */
function mkRef(title, body){ return '# '+title+'\n\n'+body; }
function skillBundle(id, name, cluster, mainMd, refs, evalsObj){
  const files=[{ path:'SKILL.md', main:true, md:mainMd }];
  (refs||[]).forEach(r=>files.push({ path:'references/'+r.f, md:mkRef(r.t, r.b) }));
  if(evalsObj) files.push({ path:'evals/evals.json', md:JSON.stringify(evalsObj,null,2), json:true });
  return { id, name, cluster, kind:'skill',
    desc:(mainMd.match(/^>\s+(.+)$/m)||[])[1] || name,
    files };
}

/* ---------------- SKILLS in claude-master/skills ---------------- */
export const SKILL_CATALOG = [
  skillBundle('web-design','ออกแบบเว็บ','design',
`# ออกแบบเว็บ
> ออกแบบหน้าเว็บ/แลนดิ้งที่สวยและแปลงผลได้จริง — ใช้เมื่อต้องสร้าง UI หน้าเว็บใหม่

ทักษะนี้ช่วยวางเลย์เอาต์ ระบบสี ไทโปกราฟี และลำดับสายตา ให้ออกมาเป็นหน้าเว็บที่ทั้งสวยและพาผู้ใช้ไปสู่เป้าหมาย

## เมื่อไหร่ควรใช้
- ต้องขึ้นหน้าแลนดิ้ง/เว็บใหม่จากศูนย์
- ปรับดีไซน์หน้าเดิมให้ทันสมัย
- วาง design system เล็กๆ สำหรับโปรเจกต์

## ขั้นตอน
1. เก็บโจทย์ + กลุ่มเป้าหมาย + โทนแบรนด์
2. ร่าง wireframe ลำดับเนื้อหา
3. เลือกระบบสี + ไทโป
4. ลงรายละเอียด hi-fi
5. ตรวจ responsive + การเข้าถึง`,
    [{f:'overview.md',t:'ภาพรวม',b:'หลักการออกแบบเว็บที่ดี: ลำดับชั้นชัด คอนทราสต์พอ เว้นวรรคหายใจ และ CTA เด่น'},
     {f:'usage.md',t:'วิธีใช้',b:'เริ่มจาก wireframe เสมอ อย่ากระโดดไป hi-fi ก่อนตกลงโครงสร้าง'},
     {f:'examples.md',t:'ตัวอย่าง',b:'แลนดิ้ง SaaS, หน้า portfolio, เพจสินค้า — แต่ละแบบมีจังหวะต่างกัน'},
     {f:'frameworks.md',t:'เฟรมเวิร์ก',b:'ใช้ 8pt grid, type scale 1.25, และ 60-30-10 สำหรับสัดส่วนสี'}],
    {skill:'web-design',cases:18,pass:16,notes:'เน้นเทสต์ responsive + contrast'}),

  skillBundle('pdf-tools','จัดการ PDF','eng',
`# จัดการ PDF
> อ่าน แยก รวม และดึงข้อมูลจากไฟล์ PDF — ใช้เมื่อมีเอกสาร PDF ต้องประมวลผล

แปลง PDF เป็นข้อความ ดึงตาราง รวม/แยกหน้า และกรอกฟอร์มอัตโนมัติ

## เมื่อไหร่ควรใช้
- ดึงข้อมูลจากใบแจ้งหนี้/รายงาน
- รวมหลายไฟล์เป็นเล่มเดียว
- กรอกฟอร์ม PDF เป็นชุด

## ข้อควรระวัง
- PDF สแกนต้องผ่าน OCR ก่อน
- ตรวจ encoding ภาษาไทยให้ดี`,
    [{f:'overview.md',t:'ภาพรวม',b:'PDF มีทั้งแบบ text-based และ scanned — วิธีจัดการต่างกัน'},
     {f:'usage.md',t:'วิธีใช้',b:'ระบุหน้า/ช่วงที่ต้องการก่อน เพื่อลดเวลาในการประมวลผล'},
     {f:'examples.md',t:'ตัวอย่าง',b:'ดึงตารางตัวเลขจากรายงานการเงินรายไตรมาส'}],
    {skill:'pdf-tools',cases:12,pass:11,notes:'ระวัง PDF ที่ embed ฟอนต์แปลก'}),

  skillBundle('data-viz','ทำกราฟข้อมูล','research',
`# ทำกราฟข้อมูล
> เปลี่ยนข้อมูลดิบเป็นกราฟที่อ่านง่ายและเล่าเรื่องได้ — ใช้เมื่อต้อง visualize ข้อมูล

เลือกชนิดกราฟให้เหมาะกับข้อมูล จัดสี ป้ายกำกับ และไฮไลต์ข้อค้นพบสำคัญ

## เลือกกราฟยังไง
- เทียบปริมาณ → bar
- แนวโน้มเวลา → line
- สัดส่วน → stacked / donut (ใช้อย่างประหยัด)
- ความสัมพันธ์ → scatter`,
    [{f:'overview.md',t:'ภาพรวม',b:'กราฟที่ดีตอบคำถามเดียวชัดๆ อย่ายัดทุกอย่างลงกราฟเดียว'},
     {f:'usage.md',t:'วิธีใช้',b:'เริ่มจากคำถาม แล้วค่อยเลือกชนิดกราฟ ไม่ใช่ตรงข้าม'},
     {f:'examples.md',t:'ตัวอย่าง',b:'แดชบอร์ดผลตอบแทนพอร์ต, กราฟ funnel การตลาด'},
     {f:'frameworks.md',t:'เฟรมเวิร์ก',b:'หลัก data-ink ratio ของ Tufte: ลดหมึกที่ไม่ใช่ข้อมูล'}],
    {skill:'data-viz',cases:15,pass:14,notes:'ตรวจ colorblind-safe palette'}),

  skillBundle('market-scan','สแกนตลาด','finance',
`# สแกนตลาด
> สแกนหาโอกาสและความเสี่ยงในตลาดตามเกณฑ์ที่ตั้งไว้ — ใช้ก่อนตลาดเปิดทุกวัน

คัดกรองสินทรัพย์ ติดตามข่าว ตั้งจุดเตือนราคา และสรุปภาพตลาดให้พร้อมตัดสินใจ

## เมื่อไหร่ควรใช้
- เช็คภาพตลาดก่อนเปิด
- หาหุ้นเข้าเกณฑ์ที่กำหนด
- เฝ้าจุดเข้า/ออก`,
    [{f:'overview.md',t:'ภาพรวม',b:'แยกสัญญาณจาก noise — โฟกัสตัวชี้วัดที่สัมพันธ์กับกลยุทธ์'},
     {f:'usage.md',t:'วิธีใช้',b:'ตั้งเกณฑ์คัดกรองล่วงหน้า อย่าตัดสินใจระหว่างตลาดวิ่ง'},
     {f:'triggers.md',t:'ทริกเกอร์',b:'ราคาทะลุแนวต้าน, วอลุ่มพุ่ง, ข่าวผลประกอบการ'}],
    {skill:'market-scan',cases:20,pass:18,notes:'backtest เกณฑ์คัดกรองก่อนใช้จริง'}),

  skillBundle('copywriting','เขียนคอนเทนต์ขาย','content',
`# เขียนคอนเทนต์ขาย
> เขียนคอนเทนต์และแคปชั่นที่ดึงดูดและกระตุ้นการกระทำ — ใช้เมื่อต้องสื่อสารกับลูกค้า

เขียนตามโทนแบรนด์ จับ pain point และปิดด้วย CTA ที่ชัด

## โครงที่ใช้บ่อย
- AIDA: สนใจ → อยากรู้ → อยากได้ → ลงมือ
- PAS: ปัญหา → ขยี้ → ทางออก`,
    [{f:'overview.md',t:'ภาพรวม',b:'เขียนให้คนอ่านคนเดียว ไม่ใช่เขียนให้มวลชน'},
     {f:'usage.md',t:'วิธีใช้',b:'หัวเรื่องสำคัญที่สุด ใช้เวลากับมันให้มาก'},
     {f:'examples.md',t:'ตัวอย่าง',b:'แคปชั่นเปิดตัวสินค้า, อีเมลโปรโมชั่น, สคริปต์โฆษณา'}],
    {skill:'copywriting',cases:14,pass:13,notes:'เทสต์ A/B หัวเรื่อง'}),

  skillBundle('code-review','รีวิวโค้ด','eng',
`# รีวิวโค้ด
> ตรวจคุณภาพ ความปลอดภัย และสไตล์ของโค้ด — ใช้ก่อน merge ทุก PR

ไล่หาบั๊ก จุดเสี่ยงด้านความปลอดภัย และเสนอการปรับปรุงที่ทำได้จริง

## เช็คลิสต์
- ตรรกะถูกต้อง + เคสขอบ
- ความปลอดภัย (injection, secrets)
- อ่านง่าย + ตั้งชื่อดี
- มีเทสต์ครอบคลุม`,
    [{f:'overview.md',t:'ภาพรวม',b:'รีวิวเพื่อช่วยทีม ไม่ใช่จับผิด — ให้ฟีดแบ็กเชิงสร้างสรรค์'},
     {f:'usage.md',t:'วิธีใช้',b:'แยกประเด็น blocking ออกจาก nitpick ให้ชัด'},
     {f:'examples.md',t:'ตัวอย่าง',b:'ตรวจ PR ฟีเจอร์ใหม่, รีวิว migration ฐานข้อมูล'},
     {f:'advanced.md',t:'ขั้นสูง',b:'มองภาพ architecture ไม่ใช่แค่ระดับบรรทัด'}],
    {skill:'code-review',cases:22,pass:21,notes:'เน้นเคสความปลอดภัย'}),

  skillBundle('brand-kit','ชุดแบรนด์','design',
`# ชุดแบรนด์
> สร้างและดูแลความสม่ำเสมอของแบรนด์ — ใช้เมื่อทำสื่อใดๆ ในนามแบรนด์

รวมโลโก้ สี ฟอนต์ และโทนเสียง ให้ทุกชิ้นงานออกมาเป็นอันหนึ่งอันเดียว

## องค์ประกอบ
- โลโก้ + พื้นที่ปลอดภัย
- พาเลตสีหลัก/รอง
- ไทโปกราฟี
- โทนเสียง + ตัวอย่างคำ`,
    [{f:'overview.md',t:'ภาพรวม',b:'แบรนด์ที่แข็งแรงคือความสม่ำเสมอข้ามทุกจุดสัมผัส'},
     {f:'usage.md',t:'วิธีใช้',b:'ยึด guideline เสมอ ความสม่ำเสมอสำคัญกว่าความสร้างสรรค์รายชิ้น'},
     {f:'examples.md',t:'ตัวอย่าง',b:'คู่มือแบรนด์ฉบับย่อ, เทมเพลตโซเชียล'}],
    {skill:'brand-kit',cases:10,pass:10,notes:'ตรวจ contrast โลโก้บนพื้นต่างๆ'}),

  skillBundle('meeting-notes','สรุปประชุม','coord',
`# สรุปประชุม
> สรุปประเด็น การตัดสินใจ และงานที่ต้องทำจากการประชุม — ใช้หลังประชุมทุกครั้ง

จับสาระสำคัญ แยก action item พร้อมผู้รับผิดชอบและกำหนดเวลา

## โครงสรุป
- ประเด็นหลัก
- การตัดสินใจ
- Action items (ใคร/อะไร/เมื่อไหร่)
- ติดตามครั้งหน้า`,
    [{f:'overview.md',t:'ภาพรวม',b:'สรุปที่ดีอ่าน 30 วินาทีแล้วรู้ว่าต้องทำอะไรต่อ'},
     {f:'usage.md',t:'วิธีใช้',b:'เน้น action item ให้เด่น อย่าฝังในย่อหน้ายาว'}],
    {skill:'meeting-notes',cases:8,pass:8,notes:'ตรวจว่าทุก action มีเจ้าของ'}),

  skillBundle('competitor-research','วิจัยคู่แข่ง','research',
`# วิจัยคู่แข่ง
> สำรวจและเปรียบเทียบคู่แข่งอย่างเป็นระบบ — ใช้ก่อนวางกลยุทธ์หรือเปิดตัวสินค้า

รวบรวมข้อมูลคู่แข่ง ทำตารางเปรียบเทียบ และหาช่องว่างในตลาด

## มิติที่ดู
- จุดยืน + ราคา
- ฟีเจอร์เด่น
- จุดอ่อน/ช่องว่าง
- กลุ่มลูกค้า`,
    [{f:'overview.md',t:'ภาพรวม',b:'เป้าหมายคือหาช่องว่าง ไม่ใช่ลอกคู่แข่ง'},
     {f:'usage.md',t:'วิธีใช้',b:'ใช้แหล่งข้อมูลปฐมภูมิเมื่อทำได้ ระวังข้อมูลเก่า'},
     {f:'examples.md',t:'ตัวอย่าง',b:'ตารางเปรียบเทียบ 5 คู่แข่งหลักในตลาด'}],
    {skill:'competitor-research',cases:11,pass:10,notes:'อ้างอิงแหล่งทุกข้อมูล'}),

  skillBundle('automation','ออโตเมชัน','ops',
`# ออโตเมชัน
> เปลี่ยนงานซ้ำๆ ให้ระบบทำเองอัตโนมัติ — ใช้เมื่อมีงานทำซ้ำเป็นประจำ

ระบุงานที่ทำซ้ำ ออกแบบ workflow และวางระบบให้ทำงานเองพร้อมการแจ้งเตือน

## เริ่มยังไง
1. หางานที่ทำซ้ำบ่อย + กฎชัด
2. แตกเป็นขั้นตอน
3. วาง trigger + action
4. ใส่ error handling + แจ้งเตือน`,
    [{f:'overview.md',t:'ภาพรวม',b:'อัตโนมัติงานที่ "ชัดและซ้ำ" ก่อน งานที่ต้องตัดสินใจให้คนทำ'},
     {f:'usage.md',t:'วิธีใช้',b:'เริ่มเล็กๆ ทีละ workflow แล้วค่อยขยาย'},
     {f:'triggers.md',t:'ทริกเกอร์',b:'ตามเวลา, เมื่อมีไฟล์ใหม่, เมื่อได้รับอีเมล'}],
    {skill:'automation',cases:16,pass:15,notes:'ทดสอบ error path ทุกครั้ง'}),
];

/* ---------------- AGENTS in claude-master/agents ---------------- */
function agentDoc(name, role, desc, skills){
  return `# ${name}
> ${role} — ${desc}

## บทบาท
${desc}

## ทักษะ
${skills.map(s=>'- **'+s+'**').join('\n')}

## หมายเหตุ
นำเข้าจาก claude-master/agents`;
}

export const AGENT_CATALOG = [
  { id:'nova', name:'NOVA', role:'นักวิจัยตลาด', cluster:'research', model:'sonnet',
    skills:['หาข้อมูล','เปรียบเทียบ','สรุปบทความ'],
    desc:'ขุดข้อมูลเชิงลึกและสรุปให้พร้อมตัดสินใจ' },
  { id:'forge', name:'FORGE', role:'วิศวกรระบบ', cluster:'eng', model:'opus',
    skills:['เขียนโค้ด','แก้บั๊ก','ออโตเมชัน'],
    desc:'สร้างและดูแลระบบหลังบ้านให้เสถียร' },
  { id:'lumen', name:'LUMEN', role:'ดีไซเนอร์', cluster:'design', model:'sonnet',
    skills:['ออกแบบ UI','โลโก้','แบนเนอร์'],
    desc:'ออกแบบงานภาพที่สวยและสื่อสารตรงจุด' },
  { id:'verse', name:'VERSE', role:'นักเขียนคอนเทนต์', cluster:'content', model:'haiku',
    skills:['เขียนคอนเทนต์','คิดแคปชั่น','วางแผนโพสต์'],
    desc:'ผลิตคอนเทนต์ต่อเนื่องตามโทนแบรนด์' },
  { id:'tally', name:'TALLY', role:'นักบัญชี', cluster:'finance', model:'sonnet',
    skills:['ทำบัญชี','สรุปงบ','เตือนบิล'],
    desc:'ดูแลตัวเลขการเงินให้เป๊ะและตรงเวลา' },
  { id:'atlas', name:'ATLAS', role:'ผู้ช่วยวางแผน', cluster:'coord', model:'opus',
    skills:['วางแผนงาน','สรุปสถานะ','มอบหมายงาน'],
    desc:'แตกเป้าหมายใหญ่เป็นแผนที่ลงมือได้' },
  { id:'pixelle', name:'PIXELLE', role:'พิกเซลอาร์ทิสต์', cluster:'design', model:'sonnet',
    skills:['พิกเซลอาร์ต','ออกแบบ UI'],
    desc:'วาดตัวละครและไอคอนสไตล์เกม' },
  { id:'riley', name:'RILEY', role:'ผู้ดูแลระบบ', cluster:'ops', model:'haiku',
    skills:['จัดไฟล์','ตั้งนัด','เก็บกวาด'],
    desc:'จัดระเบียบและดูแลงานปฏิบัติการ' },
];
AGENT_CATALOG.forEach(a=>{ a.kind='agent'; a.md=agentDoc(a.name,a.role,a.desc,a.skills);
  a.files=[{path:'AGENT.md',main:true,md:a.md}]; });

/* build a synced-skill record (for store.syncedSkills) from a catalog skill */
export function syncedFromCatalog(it){
  const main=(it.files||[]).find(f=>f.main) || it.files[0];
  return { id:'syn-'+it.id, catId:it.id, name:it.name, cluster:it.cluster, desc:it.desc,
    file:'skills/'+it.id+'/SKILL.md', md:main?main.md:'',
    files:(it.files||[]).map(f=>({ path:f.path, md:f.md, main:!!f.main, json:!!f.json })) };
}
