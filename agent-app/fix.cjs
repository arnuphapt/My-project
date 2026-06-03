const fs=require('fs'); 
const path='./src/pages'; 
fs.readdirSync(path).forEach(f => { 
  if(!f.endsWith('.jsx')) return;
  const fp = path+'/'+f; 
  let c = fs.readFileSync(fp,'utf8'); 
  c = c.replace(/import '\.\.\/\.\.\/image-slot\.js';/g, "import '../../../image-slot.js';"); 
  fs.writeFileSync(fp,c); 
});
