import React, { useState as useS, useEffect as useE, useRef as useR, useMemo, useCallback } from 'react';
import { OfficeStore, useOffice, fmt, SEED } from '../store';
import { Win, Row, Bar, StatusDot, Avatar, NavBar, PageHead, Modal, Rarity, ClassTag, RARITY, SumCard } from '../components/UI.jsx';
import '../../../image-slot.js';

/* ============ PORTFOLIO (tabbed) ============ */
function Portfolio(){
  const [tab,setTab]=useS('sim');
  return (
    <div style={{maxWidth:1280,margin:'0 auto',padding:'20px 22px'}}>
      <div style={{display:'flex',gap:8,marginBottom:18,padding:5,borderRadius:11,
        background:'rgba(8,10,18,.6)',border:'1px solid var(--line)',width:'fit-content'}}>
        <button className={'pf-tab'+(tab==='sim'?' on':'')} onClick={()=>setTab('sim')}>
          🧪 จำลอง <span style={{opacity:.7,fontSize:11}}>· Simulate</span>
        </button>
        <button className={'pf-tab'+(tab==='live'?' on':'')} onClick={()=>setTab('live')}>
          ⚡ ลงทุนจริง <span style={{opacity:.7,fontSize:11}}>· Live</span>
        </button>
      </div>
      {tab==='sim' ? <SimPortfolio/> : <LiveTrading/>}
    </div>
  );
}

/* ============ SIMULATED PORTFOLIO ============ */
function SimPortfolio(){
  const [s,set]=useOffice();
  const v=OfficeStore.valuation();
  const FX=OfficeStore.FX;
  const [filter,setFilter]=useS('ALL');
  const [trade,setTrade]=useS(null); // {sym, side}
  const [depo,setDepo]=useS(false);

  const realizedUSD = s.realized.usd + s.realized.thb/FX;
  const list = Object.values(s.market).filter(m=>filter==='ALL'||m.cls===filter);

  return (
    <div>
      <PageHead title="พอร์ตจำลอง" sub="ฝึกลงทุนด้วยเงินจำลอง · ราคาขยับเรียลไทม์ทุก 2 วินาที"
        right={<div style={{display:'flex',gap:10}}>
          <button className="btn gold" onClick={()=>setDepo(true)}>＋ เติมเงิน</button>
        </div>}/>

      {/* summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <SumCard label="มูลค่ารวม (Net Worth)" main={'฿'+fmt.n(v.totalUSD*FX,0)} sub={'$'+fmt.n(v.totalUSD,2)} tone="gold"/>
        <SumCard label="กำไรลอยตัว (Unrealized)" main={fmt.money(v.unrealUSD,'USD')} sub={fmt.pct(v.unrealPct)} tone={v.unrealUSD>=0?'pos':'neg'}/>
        <SumCard label="กำไรที่ขายแล้ว (Realized)" main={fmt.money(realizedUSD,'USD')} sub={'฿'+fmt.n(realizedUSD*FX,0)} tone={realizedUSD>=0?'pos':'neg'}/>
        <SumCard label="เงินสดพร้อมลงทุน" main={'฿'+fmt.n(s.cash.thb,0)} sub={'$'+fmt.n(s.cash.usd,2)} tone="cyan" onClick={()=>setDepo(true)}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) minmax(0,1fr)',gap:14,alignItems:'start'}}>
        {/* holdings */}
        <Win title="MY HOLDINGS" th={false} right={<span className="tag" style={{marginRight:6}}>{v.rows.length} รายการ</span>}>
          {v.rows.length===0 && <div className="empty">ยังไม่มีสินทรัพย์ — เลือกซื้อจากตลาดด้านขวา</div>}
          {v.rows.length>0 &&
          <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontFamily:'var(--mono)',fontSize:13}}>
            <thead><tr style={{color:'var(--text-mute)',fontSize:11,textAlign:'right'}}>
              <th style={{textAlign:'left',padding:'6px 4px'}}>สินทรัพย์</th>
              <th>ถือ</th><th>ราคา</th><th>มูลค่า</th><th>กำไร/ขาดทุน</th><th></th>
            </tr></thead>
            <tbody>
              {v.rows.map(r=>(
                <tr key={r.symbol} style={{borderTop:'1px solid rgba(39,66,146,.35)'}}>
                  <td style={{padding:'9px 4px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div>
                        <div style={{color:'var(--white)',fontWeight:600}}>{r.symbol}</div>
                        <div style={{fontFamily:'var(--thai)',fontSize:11,color:'var(--text-mute)'}}>{r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{textAlign:'right',color:'var(--text)'}}>{fmt.n(r.qty, r.qty<1?4:0)}</td>
                  <td style={{textAlign:'right'}}>
                    <div style={{color:'var(--white)'}}>{r.cur==='USD'?'$':'฿'}{fmt.n(r.price, r.price<1?4:2)}</div>
                    <div style={{fontSize:11,color:r.dayPct>=0?'var(--green)':'var(--red)'}}>{fmt.pct(r.dayPct,2)}</div>
                  </td>
                  <td style={{textAlign:'right',color:'var(--text)'}}>{r.cur==='USD'?'$':'฿'}{fmt.n(r.mv,0)}</td>
                  <td style={{textAlign:'right'}}>
                    <div style={{color:r.pnl>=0?'var(--green)':'var(--red)'}}>{fmt.money(r.pnl,r.cur,0)}</div>
                    <div style={{fontSize:11,color:r.pnl>=0?'var(--green)':'var(--red)'}}>{fmt.pct(r.pnlPct,1)}</div>
                  </td>
                  <td style={{textAlign:'right',paddingLeft:8}}>
                    <div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                      <button className="btn green sm" onClick={()=>setTrade({sym:r.symbol,side:'buy'})}>+</button>
                      <button className="btn red sm" onClick={()=>setTrade({sym:r.symbol,side:'sell'})}>−</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>}
          <TxnLog/>
        </Win>

        {/* market */}
        <Win title="MARKET" th={false}>
          <MarketSearch />
          <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {['ALL','SET','US','FUND','CRYPTO'].map(f=>(
              <button key={f} className={'btn sm '+(filter===f?'':'ghost')} onClick={()=>setFilter(f)}>{f==='ALL'?'ทั้งหมด':f}</button>
            ))}
            <div style={{flex:1}}></div>
            <button className="btn cyan sm ghost" onClick={()=>OfficeStore.restoreDefaultMarket()} title="กู้คืนรายการหุ้นเริ่มต้น">↺</button>
            <button className="btn red sm ghost" onClick={()=>confirm('ล้างรายการทั้งหมดใน Market (ยกเว้นที่กำลังถืออยู่)?') && OfficeStore.clearAllMarket()} title="ล้างรายการทั้งหมด">🗑</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {list.map(m=>{
              const ch=(m.price-m.prevClose)/m.prevClose*100;
              return (
                <div key={m.symbol} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 6px',borderRadius:7}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(40,60,140,.2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <ClassTag cls={m.cls}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:'var(--white)',fontWeight:600,fontSize:14}}>{m.symbol}</div>
                    <div style={{fontSize:11,color:'var(--text-mute)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.name}</div>
                  </div>
                  <div style={{textAlign:'right',fontFamily:'var(--mono)'}}>
                    <div style={{color:'var(--white)',fontSize:14}}>{m.cur==='USD'?'$':'฿'}{fmt.n(m.price, m.price<1?4:2)}</div>
                    <div style={{fontSize:11,color:ch>=0?'var(--green)':'var(--red)'}}>{fmt.pct(ch,2)}</div>
                  </div>
                  <button className="btn green sm" onClick={()=>setTrade({sym:m.symbol,side:'buy'})}>ซื้อ</button>
                  <button className="btn red sm ghost" style={{padding:'4px 6px'}} title="ลบออกจาก Market" 
                    onClick={() => confirm('ลบ '+m.symbol+' ออกจากรายการ?') && OfficeStore.removeFavorite(m.symbol)}>✕</button>
                </div>
              );
            })}
          </div>
        </Win>
      </div>

      {trade && <TradeModal sym={trade.sym} side={trade.side} onClose={()=>setTrade(null)}/>}
      {depo && <DepositModal onClose={()=>setDepo(false)}/>}
    </div>
  );
}

function TxnLog(){
  const [s]=useOffice();
  if(!s.txns.length) return null;
  return (
    <div style={{marginTop:14,paddingTop:12,borderTop:'1px solid var(--line)'}}>
      <div style={{fontFamily:'var(--pixel2)',fontSize:11,color:'var(--text-dim)',marginBottom:8,letterSpacing:.5}}>ประวัติการเทรด</div>
      <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:140,overflow:'auto',fontFamily:'var(--mono)',fontSize:12}}>
        {s.txns.map((t,i)=>(
          <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{color:'var(--text-mute)'}}>{t.t}</span>
            <span style={{color:t.type==='BUY'?'var(--green)':'var(--red)',width:34}}>{t.type==='BUY'?'ซื้อ':'ขาย'}</span>
            <span style={{color:'var(--white)',flex:1}}>{t.sym} ×{fmt.n(t.qty,t.qty<1?4:0)} @ {t.cur==='USD'?'$':'฿'}{fmt.n(t.price,2)}</span>
            {t.pnl!=null && <span style={{color:t.pnl>=0?'var(--green)':'var(--red)'}}>{fmt.money(t.pnl,t.cur,0)}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeModal({ sym, side, onClose }){
  const [s]=useOffice();
  const m=s.market[sym];
  const held=s.holdings.find(h=>h.symbol===sym);
  const [mode,setMode]=useS(side);
  const [qty,setQty]=useS(m.cls==='CRYPTO'?'0.01':'1');
  const [err,setErr]=useS('');
  const q=parseFloat(qty)||0;
  const cost=m.price*q;
  const ccy=m.cur==='USD'?'usd':'thb';
  const cash=s.cash[ccy];
  const go=()=>{
    const r= mode==='buy'? OfficeStore.buy(sym,q) : OfficeStore.sell(sym,q);
    if(!r.ok){ setErr(r.msg); return; }
    onClose();
  };
  return (
    <Modal title={(mode==='buy'?'ซื้อ ':'ขาย ')+sym} onClose={onClose} width={440}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div>
          <div style={{color:'var(--white)',fontSize:17,fontWeight:700}}>{m.name}</div>
          <div style={{marginTop:5}}><ClassTag cls={m.cls}/></div>
        </div>
        <div style={{textAlign:'right',fontFamily:'var(--mono)'}}>
          <div style={{color:'var(--white)',fontSize:22}}>{m.cur==='USD'?'$':'฿'}{fmt.n(m.price,m.price<1?4:2)}</div>
          <div style={{fontSize:12,color:'var(--text-mute)'}}>ราคาตลาด · {m.cur}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <button className={'btn '+(mode==='buy'?'green':'ghost')} style={{flex:1}} onClick={()=>{setMode('buy');setErr('');}}>ซื้อ</button>
        <button className={'btn '+(mode==='sell'?'red':'ghost')} style={{flex:1}} onClick={()=>{setMode('sell');setErr('');}}>ขาย</button>
      </div>
      <label className="lbl">จำนวน{held?' · ถืออยู่ '+fmt.n(held.qty,held.qty<1?4:0):''}</label>
      <input className="fld" type="number" value={qty} onChange={e=>{setQty(e.target.value);setErr('');}} step="any" min="0"/>
      <div style={{display:'flex',gap:6,marginTop:8}}>
        {(m.cls==='CRYPTO'?[0.01,0.05,0.1]:[1,5,10,50]).map(x=>(
          <button key={x} className="btn ghost sm" onClick={()=>setQty(String(x))}>{x}</button>
        ))}
        {mode==='sell'&&held&&<button className="btn ghost sm" onClick={()=>setQty(String(held.qty))}>ทั้งหมด</button>}
      </div>
      <div style={{marginTop:16,padding:'12px 14px',background:'rgba(6,10,30,.6)',borderRadius:8,border:'1px solid var(--line)'}}>
        <Row k="มูลค่ารวม" v={(m.cur==='USD'?'$':'฿')+fmt.n(cost,2)} cls="gold"/>
        <Row k="เงินสดคงเหลือ" v={(m.cur==='USD'?'$':'฿')+fmt.n(cash,2)}/>
      </div>
      {err && <div style={{color:'var(--red)',fontSize:13,marginTop:10,fontFamily:'var(--mono)'}}>⚠ {err}</div>}
      <button className={'btn '+(mode==='buy'?'green':'red')} style={{width:'100%',marginTop:16}} onClick={go} disabled={q<=0}>
        ยืนยัน{mode==='buy'?'ซื้อ':'ขาย'} {sym}
      </button>
    </Modal>
  );
}

function DepositModal({ onClose }){
  const [s] = useOffice();
  const [ccy,setCcy]=useS('thb');
  const [mode,setMode]=useS('set');
  
  // Keep input in sync with current balance when switching currency or mode (if in set mode)
  const [amt,setAmt]=useS(String(s.cash.thb));
  
  useE(()=>{
    if(mode === 'set') setAmt(String(s.cash[ccy]));
    else setAmt('100000');
  }, [ccy, mode, s.cash]);

  return (
    <Modal title="จัดการงบประมาณ (Budget)" onClose={onClose} width={420}>
      <p style={{color:'var(--text-dim)',fontSize:13,marginTop:0}}>ตั้งค่ายอดเงินสดคงเหลือ หรือเติมเงินจำลองเข้าพอร์ต</p>
      
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        <button className={'btn '+(mode==='set'?'cyan':'ghost')} style={{flex:1}} onClick={()=>setMode('set')}>✎ แก้ไขยอดใหม่</button>
        <button className={'btn '+(mode==='add'?'gold':'ghost')} style={{flex:1}} onClick={()=>setMode('add')}>＋ เติมเงินเพิ่ม</button>
      </div>

      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button className={'btn '+(ccy==='thb'?'ghost on':'ghost')} style={{flex:1}} onClick={()=>setCcy('thb')}>บาท ฿</button>
        <button className={'btn '+(ccy==='usd'?'ghost on':'ghost')} style={{flex:1}} onClick={()=>setCcy('usd')}>ดอลลาร์ $</button>
      </div>
      
      <label className="lbl">จำนวนเงิน</label>
      <input className="fld" type="number" value={amt} onChange={e=>setAmt(e.target.value)}/>
      
      <div style={{display:'flex',gap:6,marginTop:8}}>
        {(ccy==='thb'?[0, 50000, 100000, 500000, 1000000]:[0, 1000, 5000, 10000, 50000]).map(x=>(
          <button key={x} className="btn ghost sm" onClick={()=>setAmt(String(x))}>
            {x===0 ? '0' : fmt.compact(x)}
          </button>
        ))}
      </div>
      
      <button className={'btn '+(mode==='add'?'gold':'cyan')} style={{width:'100%',marginTop:18}} onClick={()=>{
        const val = parseFloat(amt)||0;
        if(mode==='add') OfficeStore.deposit(ccy, val);
        else OfficeStore.setCash(ccy, val);
        onClose();
      }}>
        {mode==='add'?'เติมเงิน ':'บันทึกยอดเป็น '}{(ccy==='thb'?'฿':'$')+fmt.n(parseFloat(amt)||0,0)}
      </button>
    </Modal>
  );
}

function MarketSearch() {
  const [q, setQ] = useS('');
  const [results, setResults] = useS([]);
  
  useE(()=>{
    if(q.trim().length < 1) { setResults([]); return; }
    const timer = setTimeout(async ()=>{
      try {
        const res = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=6`);
        if(res.ok) {
          const data = await res.json();
          setResults(data.quotes || []);
        }
      }catch(e){}
    }, 400);
    return ()=>clearTimeout(timer);
  }, [q]);

  const add = (r) => {
    let cls = 'US';
    if(r.quoteType==='CRYPTOCURRENCY') cls='CRYPTO';
    else if(r.exchDisp==='SET') cls='SET';
    else if(r.quoteType==='MUTUALFUND' || r.quoteType==='ETF') cls='FUND';
    
    OfficeStore.addFavorite({
       symbol: r.symbol,
       name: r.shortname || r.longname || r.symbol,
       cls: cls,
       price: 1, 
       cur: (cls==='SET' || cls==='FUND') ? 'THB' : 'USD',
       prevClose: 1,
       seed: 1
    });
    setQ('');
    setResults([]);
  };

  return (
    <div style={{marginBottom:12}}>
      <input className="fld" placeholder="🔍 ค้นหาชื่อหุ้น, คริปโต (เช่น AAPL, BTC)..." 
        value={q} onChange={e=>setQ(e.target.value)} />
      
      {results.length > 0 && (
        <div style={{background:'#080a12',
          border:'1px solid var(--line)',borderRadius:8,marginTop:8,
          maxHeight:300,overflow:'auto',boxShadow:'0 4px 12px rgba(0,0,0,.3)'}}>
          <div style={{padding:'6px 12px',background:'rgba(255,255,255,0.05)',fontSize:11,color:'var(--text-dim)',borderBottom:'1px solid var(--line)'}}>
            ผลการค้นหา (คลิกเพื่อเพิ่มลง Market)
          </div>
          {results.map((r,i)=>(
            <div key={i} style={{padding:'8px 12px',cursor:'pointer',borderBottom:'1px solid rgba(255,255,255,.05)',display:'flex',justifyContent:'space-between'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(40,60,140,.3)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              onClick={()=>add(r)}>
              <div>
                <div style={{color:'var(--white)',fontWeight:600}}>{r.symbol}</div>
                <div style={{fontSize:11,color:'var(--text-dim)'}}>{r.shortname||r.longname}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <span className="chip" style={{fontSize:10}}>{r.exchDisp||r.quoteType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ LIVE TRADING (future · TradingView bot) ============ */
function LiveTrading(){
  const [s]=useOffice();
  const L=s.live;
  const upd=patch=>OfficeStore.setState(st=>({...st,live:{...st.live,...patch}}),{now:true});
  const webhook='https://my-office.app/hook/'+(L.apiKey? L.apiKey.slice(0,6).toLowerCase():'xxxxxx')+'-tv';
  const canConnect = L.apiKey.trim().length>6 && L.apiSecret.trim().length>6;

  return (
    <div>
      <PageHead title="ลงทุนจริง · LIVE" sub="เชื่อม TradingView เพื่อรันบอทเทรดอัตโนมัติ — ส่วนนี้กำลังพัฒนา ตั้งค่าล่วงหน้าได้"
        right={<span className="chip" style={{padding:'6px 11px',
          color:L.connected?'var(--green)':'var(--gold)',
          borderColor:(L.connected?'var(--green)':'var(--gold)')+'66'}}>
          <span className={'sdot s-'+(L.connected?'working':'idle')} style={{marginRight:2}}></span>
          {L.connected?'เชื่อมต่อแล้ว (Paper)':'ยังไม่เชื่อมต่อ'}
        </span>}/>

      {/* roadmap banner */}
      <div className="win" style={{flexDirection:'row',alignItems:'center',gap:16,padding:'14px 18px',marginBottom:16,
        borderColor:'rgba(157,107,255,.4)'}}>
        <div style={{fontSize:26}}>🤖</div>
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:15,color:'var(--white)'}}>โหมดเทรดอัตโนมัติ (Coming Soon)</div>
          <div style={{fontSize:13,color:'var(--text-dim)',marginTop:4,lineHeight:1.5}}>
            ตั้งค่า API + สัญญาณจาก TradingView ไว้ล่วงหน้า เมื่อระบบพร้อม บอทจะรับ alert แล้วส่งคำสั่งซื้อขายจริงให้อัตโนมัติ
          </div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',maxWidth:200,justifyContent:'flex-end'}}>
          {['Webhook','Risk Guard','Paper→Live','Backtest'].map(x=>
            <span key={x} className="chip" style={{fontSize:10}}>{x}</span>)}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:14,alignItems:'start'}}>

        {/* CONNECT */}
        <Win title="CONNECT · เชื่อมต่อ" accent="purple" bodyStyle={{padding:16}}>
          <label className="lbl">Exchange / Broker</label>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            {['Binance','Bybit','OKX','MT5'].map(x=>(
              <button key={x} className={'btn sm '+(L.exchange===x?'':'ghost')} onClick={()=>{ upd({exchange:x}); window.electronAPI?.saveLog('info', 'Changed exchange to: ' + x); }}>{x}</button>
            ))}
          </div>

          <label className="lbl">API Key</label>
          <input className="fld" placeholder="วาง API Key ของคุณ" value={L.apiKey} onChange={e=>upd({apiKey:e.target.value})}/>
          <label className="lbl" style={{marginTop:11}}>API Secret</label>
          <input className="fld" type="password" placeholder="••••••••••••" value={L.apiSecret} onChange={e=>upd({apiSecret:e.target.value})}/>
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6}}>🔒 เก็บไว้ในเครื่องนี้เท่านั้น · ยังไม่ส่งออกจริง</div>

          <label className="lbl" style={{marginTop:14}}>TradingView Webhook URL</label>
          <div style={{display:'flex',gap:6}}>
            <input className="fld" readOnly value={webhook} style={{fontFamily:'var(--mono)',fontSize:12,color:'var(--cyan)'}}/>
            <button className="btn ghost sm" onClick={()=>{navigator.clipboard&&navigator.clipboard.writeText(webhook);}}>คัดลอก</button>
          </div>
          <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--text-mute)',marginTop:6}}>วาง URL นี้ในช่อง Webhook ของ Alert บน TradingView</div>

          <button className={'btn '+(L.connected?'red':'green')} style={{width:'100%',marginTop:16}}
            disabled={!canConnect&&!L.connected}
            onClick={()=>{ upd({connected:!L.connected, botOn:false}); window.electronAPI?.saveLog('info', 'Exchange connection status: ' + (!L.connected?'Connected':'Disconnected')); }}>
            {L.connected?'ตัดการเชื่อมต่อ':(canConnect?'เชื่อมต่อ (Paper Mode)':'กรอก API ก่อนเชื่อมต่อ')}
          </button>
        </Win>

        {/* BOT CONFIG */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Win title="BOT CONTROL · ตั้งค่าบอท" bodyStyle={{padding:16}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 14px',borderRadius:9,marginBottom:14,
              background:L.botOn?'rgba(60,229,148,.08)':'rgba(8,10,18,.5)',
              border:'1px solid '+(L.botOn?'rgba(60,229,148,.4)':'var(--line)')}}>
              <div>
                <div style={{fontFamily:'var(--pixel2)',fontWeight:700,fontSize:14,color:'var(--white)'}}>สถานะบอท</div>
                <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--text-mute)',marginTop:2}}>
                  {!L.connected?'เชื่อมต่อก่อนเปิดบอท':(L.botOn?'กำลังรับสัญญาณ TradingView':'พร้อมทำงาน · ปิดอยู่')}</div>
              </div>
              <Toggle on={L.botOn} disabled={!L.connected} onClick={()=>{ upd({botOn:!L.botOn}); window.electronAPI?.saveLog('info', 'Trading Bot status: ' + (!L.botOn?'ON':'OFF')); }}/>
            </div>

            <SliderRow label="ความเสี่ยงต่อไม้" value={L.riskPct} unit="%" min={0.5} max={10} step={0.5} onChange={v=>upd({riskPct:v})}/>
            <SliderRow label="ทุนสูงสุดต่อโพสิชัน" value={L.maxCapital} unit="$" min={500} max={50000} step={500} onChange={v=>upd({maxCapital:v})}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
              <SliderRow label="Take Profit" value={L.tp} unit="%" min={1} max={30} step={1} onChange={v=>upd({tp:v})} compact/>
              <SliderRow label="Stop Loss" value={L.sl} unit="%" min={1} max={20} step={1} onChange={v=>upd({sl:v})} compact/>
            </div>
          </Win>

          <Win title="LIVE POSITIONS" right={<span className="tag" style={{marginRight:6}}>realtime</span>} bodyStyle={{padding:16}}>
            <div className="empty" style={{padding:'18px 10px'}}>
              {L.connected? 'บอทยังไม่เปิดโพสิชัน — รอสัญญาณจาก TradingView' : 'ยังไม่เชื่อมต่อ — สถานะจริงจะแสดงที่นี่'}
            </div>
          </Win>
        </div>
      </div>

      {/* CHART */}
      <Win title="TRADINGVIEW CHART" style={{marginTop:14}} right={<span className="tag" style={{marginRight:6}}>{L.exchange}</span>}
        bodyStyle={{padding:0}}>
        <div style={{position:'relative',height:300}}>
          <image-slot id="tv-chart" shape="rect"
            placeholder="ฝังกราฟ TradingView ที่นี่ (วางสกรีนช็อต/วิดเจ็ตกราฟ)"
            style={{position:'absolute',inset:0,width:'100%',height:'100%'}}></image-slot>
        </div>
      </Win>
    </div>
  );
}

function Toggle({ on, disabled, onClick }){
  return (
    <div onClick={()=>!disabled&&onClick()} style={{width:50,height:28,borderRadius:14,cursor:disabled?'not-allowed':'pointer',
      background:on?'var(--green)':'#2a3650',opacity:disabled?.4:1,position:'relative',transition:'.15s',flex:'none',
      border:'1px solid '+(on?'var(--green)':'var(--line)')}}>
      <div style={{position:'absolute',top:2,left:on?24:2,width:22,height:22,borderRadius:'50%',
        background:'#fff',transition:'.15s',boxShadow:'0 2px 4px rgba(0,0,0,.4)'}}></div>
    </div>
  );
}

function SliderRow({ label, value, unit, min, max, step, onChange, compact }){
  return (
    <div style={{marginBottom:compact?0:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
        <span style={{fontSize:13,color:'var(--text-dim)'}}>{label}</span>
        <span style={{fontFamily:'var(--mono)',fontSize:14,color:'var(--cyan)'}}>{unit==='$'?'$'+fmt.compact(value):value+unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(parseFloat(e.target.value))} style={{width:'100%',accentColor:'var(--cyan)'}}/>
    </div>
  );
}

export default Portfolio;
