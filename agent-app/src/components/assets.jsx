/* ============ ASSETS ============ */
function Assets(){
  const [s,set]=useOffice();
  const [active,setActive]=useS('ALL');
  // slot count per group is stored in state.assetSlots so user can add more
  const slots = s.assetSlots || {};
  const groups = window.SEED.assetGroups;

  const setCount=(gid,delta)=>OfficeStore.setState(st=>{
    const cur=(st.assetSlots&&st.assetSlots[gid])!=null ? st.assetSlots[gid] : (groups.find(g=>g.id===gid)?.count||4);
    return {...st, assetSlots:{...(st.assetSlots||{}), [gid]:Math.max(1,Math.min(40,cur+delta))}};
  },{now:true});

  const countOf=g=> (slots[g.id]!=null ? slots[g.id] : g.count);
  const total = groups.reduce((a,g)=>a+countOf(g),0);
  const shown = active==='ALL'? groups : groups.filter(g=>g.id===active);

  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <PageHead title="ASSETS" sub="คลังเก็บไฟล์ — ลากรูป โลโก้ พิกเซลอาร์ต หรือเอกสารมาวางในช่องได้เลย"
        right={<span className="tag" style={{padding:'6px 10px'}}>ทั้งหมด {total} ช่อง</span>}/>

      {/* group filter */}
      <div style={{display:'flex',gap:7,flexWrap:'wrap',marginBottom:18}}>
        <button className={'btn sm '+(active==='ALL'?'':'ghost')} onClick={()=>setActive('ALL')}>ทั้งหมด</button>
        {groups.map(g=>(
          <button key={g.id} className={'btn sm '+(active===g.id?'':'ghost')} onClick={()=>setActive(g.id)}>{g.name}</button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:22}}>
        {shown.map(g=>(
          <AssetGroup key={g.id} g={g} count={countOf(g)} onAdd={()=>setCount(g.id,1)} onRemove={()=>setCount(g.id,-1)}/>
        ))}
      </div>
    </div>
  );
}

const GROUP_ICON = { img:'🖼️', logo:'🏷️', pix:'👾', doc:'📄' };
const GROUP_SHAPE = { img:'rect', logo:'rounded', pix:'rect', doc:'rounded' };

function AssetGroup({ g, count, onAdd, onRemove }){
  const shape=GROUP_SHAPE[g.id]||'rounded';
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:11}}>
        <span style={{fontSize:18}}>{GROUP_ICON[g.id]||'📁'}</span>
        <span style={{fontFamily:'var(--pixel)',fontSize:11,color:'var(--cyan)',letterSpacing:1,textShadow:'0 0 8px rgba(58,208,255,.4)'}}>{g.name}</span>
        <span style={{fontSize:13,color:'var(--text-dim)'}}>{g.th}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--text-mute)'}}>· {count} ช่อง</span>
        <div style={{flex:1}}></div>
        <button className="btn ghost sm" onClick={onRemove} disabled={count<=1}>－</button>
        <button className="btn sm" onClick={onAdd}>＋ เพิ่มช่อง</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
        {Array.from({length:count}).map((_,i)=>(
          <div key={i} style={{position:'relative',aspectRatio:'1/1'}}>
            <image-slot id={'asset-'+g.id+'-'+i} shape={shape} radius="10"
              placeholder={g.name+' #'+(i+1)}
              style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Assets = Assets;
