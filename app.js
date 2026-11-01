/* Lidcheck app logic */
const TCOLOR={new:'var(--blue)',openbox:'var(--teal)',applerefurb:'var(--green)',refurb:'var(--orange)',used:'var(--purple)'};
const QICON={box:['package','orange'],cover:['shield-check','blue'],cos:['sparkles','purple'],parts:['cpu','gray'],boot:['power','green'],claim:['message-circle','indigo']};

/* state */
const KEY='lidcheck-v2';
let S={mode:'used',checks:{},ev:{}};
try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&typeof s==='object') S=Object.assign(S,s); }catch(e){}
const save=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} };
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const icons=()=>{ if(window.lucide) lucide.createIcons(); };
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

/* routing */
function route(){
  let v=(location.hash||'#detect').slice(1);
  if(!['detect','inspect','tools'].includes(v)) v='detect';
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('on',el.id==='view-'+v));
  document.querySelectorAll('[data-view]').forEach(a=>{ if(a.dataset.view===v) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  document.body.className='v-'+v;
}
window.addEventListener('hashchange',()=>{ route(); window.scrollTo(0,0); });

function decodePN(raw){
  raw=(raw||'').toUpperCase().replace(/\s+/g,'');
  if(!raw) return null;
  const f=raw[0], p=PREFIX[f];
  if(f==='Z') return {prefix:'Z',p,region:null,ok:true};
  const m=raw.match(/^([A-Z0-9]{5})([A-Z]{1,2})\/[A-Z]$/);
  if(!m) return {ok:false};
  return {ok:true,prefix:f,p,code:m[2],region:REGIONS[m[2]]||null};
}


function score(){
  const e=S.ev, s={new:0,openbox:0,applerefurb:0,refurb:0,used:0}, why=[], flags=[];
  const add=(o)=>{ for(const k in o) s[k]+=o[k]; };
  let n=0;
  const d=decodePN(e.pn);
  if(d&&d.ok){ n++;
    if(d.prefix==='F'){ add({applerefurb:6,new:-5,openbox:-3,refurb:1,used:1}); why.push('Part number starts with F: refurbished by Apple, so it cannot be brand new.'); }
    else if(d.prefix==='N'){ add({new:-4,openbox:-2,applerefurb:-1,refurb:2,used:2}); why.push('Part number starts with N: a service replacement unit, not a retail new Mac.'); }
    else if(d.prefix==='M'||d.prefix==='Z'){ add({new:2,openbox:2,refurb:1,used:1,applerefurb:-5}); why.push(`Part number starts with ${d.prefix}: a retail unit, which rules out Apple refurbished.`); }
  }
  const cyc=e.cyc===''||e.cyc==null?null:parseInt(e.cyc,10);
  if(cyc!=null&&!isNaN(cyc)){ n++;
    if(cyc<=5){ add({new:3,openbox:2,applerefurb:2,refurb:1,used:-2}); why.push(`${cyc} battery cycles: consistent with new or a freshly replaced battery.`); }
    else if(cyc<=20){ add({openbox:2,applerefurb:1,refurb:1,used:1,new:-2}); why.push(`${cyc} cycles: lightly used, more than a sealed Mac usually has.`); }
    else if(cyc<=100){ add({used:2,refurb:2,new:-5,openbox:-2,applerefurb:-1}); why.push(`${cyc} cycles: it has been used for weeks or months.`); }
    else { add({used:3,refurb:2,new:-6,openbox:-4,applerefurb:-3}); why.push(`${cyc} cycles: clearly used for a long time.`); }
  }
  const cap=e.cap===''||e.cap==null?null:parseInt(e.cap,10);
  if(cap!=null&&!isNaN(cap)){ n++;
    if(cap>=100){ add({new:1,openbox:1,applerefurb:1}); why.push('100% capacity: battery is as new.'); }
    else if(cap>=95){ add({openbox:0.5,used:0.5,refurb:0.5}); why.push(`${cap}% capacity: slightly aged battery.`); }
    else { add({used:2,refurb:1,new:-3,openbox:-2,applerefurb:-2}); why.push(`${cap}% capacity: the battery has worn with use.`); if(cap<80) flags.push(`Battery at ${cap}%: budget for a replacement.`); }
  }
  const B={sealed:[{new:5,openbox:-3,applerefurb:-1,used:-2},'Sealed box with intact tabs: strongest sign of a new Mac.'],
    opened:[{openbox:3,used:1,refurb:0.5,new:-2},'Retail box already opened: open box or used.'],
    white:[{applerefurb:5,new:-4,openbox:-2},'Plain white box: how Apple ships its certified refurbished Macs.'],
    generic:[{refurb:4,used:1,new:-5,openbox:-2,applerefurb:-3},'Generic shop box: typical of a third-party refurb.'],
    none:[{used:3,refurb:1,new:-4,openbox:-2,applerefurb:-3},'No box: most often a second hand sale.']};
  if(B[e.box]){ n++; add(B[e.box][0]); why.push(B[e.box][1]); }
  const C={notact:[{new:4,openbox:2,used:-2,refurb:-2},'Purchase date not validated: Apple has not recorded a sale yet, typical of an unsold new Mac.'],
    fresh:[{openbox:2,applerefurb:2,new:1},'Nearly a full year of warranty left: sold or activated very recently.'],
    partial:[{used:2,refurb:1,openbox:0.5,new:-3,applerefurb:-1},'Warranty partly used: someone bought it months ago.'],
    applecare:[{used:1.5,refurb:0.5,new:-1},'AppleCare active: a previous owner bought coverage, ask if it transfers.'],
    expired:[{used:3,refurb:3,new:-6,openbox:-4,applerefurb:-1},'Coverage expired: more than a year since its first sale.']};
  if(C[e.cover]){ n++; add(C[e.cover][0]); why.push(C[e.cover][1]); }
  const K={flawless:[{new:2,openbox:2,applerefurb:2,refurb:1},'Flawless finish: matches new or Apple refurbished.'],
    light:[{used:2,refurb:2,openbox:-1,new:-4,applerefurb:-2},'Light marks: handled and used.'],
    worn:[{used:4,refurb:1,new:-6,openbox:-4,applerefurb:-4},'Visible wear: second hand or a lower grade refurb.']};
  if(K[e.cos]){ n++; add(K[e.cos][0]); why.push(K[e.cos][1]); }
  if(e.parts==='none'){ n++; add({new:0.5,openbox:0.5}); why.push('No Parts & Service entry: no repairs detected.'); }
  if(e.parts==='genuine'){ n++; add({refurb:3,used:2,applerefurb:1,new:-5,openbox:-3}); why.push('Parts & Service lists replaced parts: it has been repaired.'); }
  if(e.parts==='unknown'){ n++; add({refurb:3,used:3,new:-6,openbox:-5,applerefurb:-5}); why.push('Unknown part detected: repaired with non-genuine parts.'); flags.push('Non-genuine part inside. Negotiate hard or walk away.'); }
  if(e.boot==='hello'){ n++; add({new:0.5,applerefurb:0.5}); why.push('Hello setup screen: freshly set up or erased. Not proof of new on its own.'); }
  if(e.boot==='account'){ n++; add({used:2,new:-3,openbox:-1,applerefurb:-2}); why.push('Already signed in: someone used it. It must be erased in front of you.'); }
  if(e.al==='Enabled') flags.push('Activation Lock is enabled. Do not buy until the owner removes it.');
  if(d&&d.ok&&d.code&&!d.region) flags.push(`Region code ${d.code}/A is unusual. Look it up before trusting the unit.`);
  return {s,why,flags,n};
}


function parsePaste(txt){
  const g=(re)=>{ const m=txt.match(re); return m?m[1].trim():null; };
  const out={
    model:g(/Model Name:\s*(.+)/), id:g(/Model Identifier:\s*(.+)/), pn:g(/Model Number:\s*(\S+)/),
    chip:g(/Chip:\s*(.+)/)||g(/Processor Name:\s*(.+)/), mem:g(/Memory:\s*(.+)/),
    serial:g(/Serial Number \(system\):\s*(\S+)/), al:g(/Activation Lock Status:\s*(\w+)/),
    cyc:g(/Cycle Count:\s*(\d+)/), cap:g(/Maximum Capacity:\s*(\d+)\s*%/), cond:g(/Condition:\s*(.+)/)
  };
  return out;
}


/* condition form */
function renderQs(){
  const e=S.ev;
  const q=x=>QS.find(z=>z.id===x);
  const sel=(qq)=>{ const [ic,col]=QICON[qq.id]; const v=e[qq.id]||'';
    return `<div class="row has-icon q"><span class="tile ${col}"><i data-lucide="${ic}"></i></span><div class="rtext"><span class="t">${qq.t}</span><small>${qq.h}</small></div>
      <div class="popup"><select data-q="${qq.id}" class="${v?'':'unset'}" aria-label="${esc(qq.t)}"><option value="">Choose</option>${qq.o.map(([k,l])=>`<option value="${k}"${v===k?' selected':''}>${l}</option>`).join('')}</select><i data-lucide="chevrons-up-down"></i></div></div>`; };
  document.getElementById('qs').innerHTML=`
    <div class="gtitle">From the Mac</div>
    <div class="group">
      <label class="row field"><span class="rtext"><span class="t">Part number</span></span><input class="mono" data-ev="pn" value="${esc(e.pn||'')}" placeholder="MRX33LL/A" autocomplete="off" spellcheck="false"></label>
      <label class="row field"><span class="rtext"><span class="t">Battery cycle count</span></span><input data-ev="cyc" inputmode="numeric" value="${esc(e.cyc??'')}" placeholder="0"></label>
      <label class="row field"><span class="rtext"><span class="t">Maximum capacity</span></span><input data-ev="cap" inputmode="numeric" value="${esc(e.cap??'')}" placeholder="100" style="flex-basis:80px"><span class="unit">%</span></label>
      <details class="disc" id="pasteDisc"><summary class="row"><span class="rtext"><span class="t" style="color:var(--blue)">Fill automatically from Terminal</span></span><i data-lucide="chevron-right" class="chev"></i></summary>
        <div class="dbody">
          <small style="color:var(--label2);font-size:13px">Run this on the Mac, then paste the whole result below.</small>
          <div class="cmd"><code>system_profiler SPHardwareDataType SPPowerDataType</code><button type="button" class="copy" data-cmd="system_profiler SPHardwareDataType SPPowerDataType"><i data-lucide="copy"></i><span>Copy</span></button></div>
          <textarea id="pasteBox" placeholder="Paste Terminal output here" aria-label="Terminal output"></textarea>
          <div class="chips" id="pasteChips"></div>
        </div></details>
    </div>
    <p class="pnread" id="pnRead"></p>
    <div class="gtitle">What you can see</div>
    <div class="group">${['box','cover','cos','parts','boot'].map(id=>sel(q(id))).join('')}</div>
    <p class="gfoot">Cycle count, box and the coverage result are the strongest signals.</p>
    <div class="gtitle">Seller</div>
    <div class="group">${sel(q('claim'))}</div>
    <p class="gfoot">Lidcheck compares the seller’s claim with the evidence.</p>`;
  pnLine(); if(e.pasted) showChips(e.pasted);
}
function pnLine(){
  const d=decodePN(S.ev.pn), el=document.getElementById('pnRead');
  if(!d){ el.innerHTML=''; return; }
  if(!d.ok){ el.innerHTML='<span style="color:var(--red)">Part number format not recognized. It should look like MRX33LL/A.</span>'; return; }
  el.innerHTML=`<b>${d.p?d.p.label:'Unusual prefix '+d.prefix}</b>${d.code?`, sold for <b>${d.region||d.code+'/A (look this code up)'}</b>`:''}`;
}
function showChips(o){
  const c=[]; if(o.model) c.push(o.model+(o.id?` (${o.id})`:'')); if(o.chip) c.push(o.chip); if(o.mem) c.push(o.mem+' memory'); if(o.serial) c.push('Serial '+o.serial); if(o.cond) c.push('Battery '+o.cond);
  document.getElementById('pasteChips').innerHTML=c.map(x=>`<span class="chip">${esc(x)}</span>`).join('')+(o.al?`<span class="chip${o.al==='Enabled'?' bad':''}">Activation Lock ${esc(o.al)}</span>`:'');
}

function renderResult(){
  const r=score(), el=document.getElementById('result');
  const dbFails=allChecks().filter(i=>S.checks[i.id]==='issue'&&i.db);
  const safety=dbFails.length?`<p class="safety">${dbFails.length} deal-breaker${dbFails.length>1?'s':''} failed in the checklist.</p>`:'';
  const nav=document.getElementById('navCond');
  if(r.n<2){
    el.innerHTML=`<p class="k">Best match</p><h2>Waiting for evidence</h2><div class="stack"></div><p class="empty">Answer at least two questions. The more you answer, the more confident the verdict.</p>${safety}`;
    document.getElementById('miniWord').textContent='Waiting for answers'; nav.textContent=''; icons(); return;
  }
  const ex=Object.fromEntries(Object.entries(r.s).map(([k,v])=>[k,Math.exp(v*0.35)]));
  const tot=Object.values(ex).reduce((a,b)=>a+b,0);
  const p=Object.fromEntries(Object.entries(ex).map(([k,v])=>[k,v/tot]));
  const order=TYPES.map(t=>t.id).sort((a,b)=>p[b]-p[a]);
  const top=order[0], pc=Math.min(97,Math.round(p[top]*100));
  const conf=pc>=70?'Strong match':pc>=45?'Likely':'Mixed signals. Answer more questions.';
  let claim='';
  if(S.ev.claim){ const c=S.ev.claim, cp=p[c];
    if(c===top) claim=`<div class="banner ok"><i data-lucide="circle-check"></i><span>Matches the seller’s claim of <b>${TNAME[c].toLowerCase()}</b>.</span></div>`;
    else if(cp<.15) claim=`<div class="banner bad"><i data-lucide="triangle-alert"></i><span>Seller says <b>${TNAME[c].toLowerCase()}</b>, but the evidence points to <b>${TNAME[top].toLowerCase()}</b>. Price it as what it is, or walk away.</span></div>`;
    else claim=`<div class="banner warn"><i data-lucide="circle-help"></i><span>Seller says <b>${TNAME[c].toLowerCase()}</b>. Possible, but <b>${TNAME[top].toLowerCase()}</b> fits better.</span></div>`;
  }
  el.innerHTML=`<p class="k">Best match</p><h2>${TNAME[top]}</h2>
    <p class="conf"><span class="badge" style="background:${TCOLOR[top]}">${pc}%</span>${conf}</p>
    <div class="stack">${order.map(k=>`<span style="flex-basis:${p[k]*100}%;background:${TCOLOR[k]}"></span>`).join('')}</div>
    <ul class="legend">${order.map(k=>`<li class="${k===top?'top':''}"><span class="d" style="background:${TCOLOR[k]}"></span>${TNAME[k]}<span class="p">${k===top?pc:Math.round(p[k]*100)}%</span></li>`).join('')}</ul>
    ${claim}
    <div class="why"><h3>Why</h3><ul>${r.flags.map(f=>`<li class="flag"><i data-lucide="octagon-alert"></i><span>${f}</span></li>`).join('')}${r.why.map(w=>`<li><span class="bul" aria-hidden="true"></span><span>${w}</span></li>`).join('')}</ul></div>
    ${safety}
    <button class="btn wide" type="button" data-mode="${top}">Open checklist for ${TNAME[top].toLowerCase()}</button>
    <p class="fine">An estimate, not proof. Apple can confirm history from the serial.</p>`;
  document.getElementById('miniWord').textContent=`${TNAME[top]}, ${pc}%`;
  nav.textContent=pc+'%';
  icons();
}

/* checklist */
const allChecks=()=>STAGES.flatMap(s=>s.items.filter(i=>i.m.includes(S.mode)));
let vis=[];
function renderTypes(){
  document.getElementById('types').innerHTML=TYPES.map(t=>`<button type="button" role="radio" data-type="${t.id}" aria-checked="${S.mode===t.id}">${t.name}</button>`).join('');
}
function itemHTML(it){
  const v=S.checks[it.id];
  return `<div class="row item${v==='issue'?' is-issue':''}" data-id="${it.id}"><div class="rtext">
    <span class="t">${it.t}${it.db?'<span class="pill">Deal-breaker</span>':''}</span><small>${it.d}</small>
    ${it.w?`<span class="where"><i data-lucide="corner-down-right"></i>${it.w}</span>`:''}
    ${it.cmd?`<div class="cmd"><code>${esc(it.cmd)}</code><button type="button" class="copy" data-cmd="${esc(it.cmd)}"><i data-lucide="copy"></i><span>Copy</span></button></div>`:''}
  </div><div class="seg mini" role="group" aria-label="Result for ${esc(it.t)}">
    <button type="button" data-v="pass" aria-pressed="${v==='pass'}"><i data-lucide="check"></i>Pass</button>
    <button type="button" data-v="issue" aria-pressed="${v==='issue'}"><i data-lucide="x"></i>Issue</button></div></div>`;
}
function renderStages(){
  vis=STAGES.map(s=>({...s,items:s.items.filter(i=>i.m.includes(S.mode))})).filter(s=>s.items.length);
  document.getElementById('stages').innerHTML=vis.map((s,i)=>`<section id="st-${s.id}"><div class="gtitle"><span>${i+1}. ${s.title}</span><span class="meta" data-meta="${s.id}"></span></div><div class="group">${s.items.map(itemHTML).join('')}</div><p class="gfoot">${s.intro}</p></section>`).join('');
  updateChecklist(); icons();
}
function ring(pass,iss,total){
  const r=30,C=2*Math.PI*r, a=pass/total*C, b=iss/total*C;
  return `<svg class="ring" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="${r}" stroke="var(--fill2)"/>
    <circle cx="36" cy="36" r="${r}" stroke="var(--green)" stroke-dasharray="${a} ${C}" transform="rotate(-90 36 36)" style="opacity:${pass?1:0}"/>
    <circle cx="36" cy="36" r="${r}" stroke="var(--red)" stroke-dasharray="${b} ${C}" stroke-dashoffset="${-a}" transform="rotate(-90 36 36)" style="opacity:${iss?1:0}"/></svg>`;
}
function updateChecklist(){
  const items=allChecks(), total=items.length;
  const pass=items.filter(i=>S.checks[i.id]==='pass').length, iss=items.filter(i=>S.checks[i.id]==='issue'), db=iss.filter(i=>i.db), done=pass+iss.length;
  let w,t,c='';
  if(db.length){ w='Walk away'; c='walk'; t='Deal-breaker failed: '+db.map(i=>i.t.toLowerCase()).join('; ')+'.'; }
  else if(!done){ w='Not started'; t=`${total} checks for ${TNAME[S.mode].toLowerCase()}.`; }
  else if(done===total&&!iss.length){ w='Clear to buy'; c='clear'; t='Every check passed. Keep the receipt.'; }
  else if(iss.length){ w='Negotiate'; t=`${iss.length} issue${iss.length>1?'s':''} found. Price the fixes into your offer.${done<total?' '+(total-done)+' left.':''}`; }
  else { w='In progress'; t=`${pass} passed, ${total-done} left. No issues so far.`; }
  document.getElementById('summary').innerHTML=`${ring(pass,iss.length,total)}<div class="st"><h2 class="${c}">${w}</h2><p>${t}</p></div>
    <div class="acts"><div class="popup"><select id="jump" aria-label="Jump to section"><option value="">Jump to section</option>${vis.map(s=>`<option value="${s.id}">${s.title}</option>`).join('')}</select><i data-lucide="chevrons-up-down"></i></div>
    <button class="btn plain" id="resetBtn" type="button">Reset</button></div>`;
  vis.forEach(s=>{ const m=document.querySelector(`[data-meta="${s.id}"]`); if(m){ const d=s.items.filter(i=>S.checks[i.id]).length; m.textContent=`${d} of ${s.items.length}`; } });
  document.getElementById('navCheck').textContent=`${done}/${total}`;
  icons();
}

/* events */
document.addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.ev;
  if(k){ S.ev[k]=e.target.value.trim(); save(); if(k==='pn') pnLine(); renderResult(); }
  if(e.target.id==='pasteBox'){
    const o=parsePaste(e.target.value);
    if(!o.pn&&!o.cyc&&!o.serial){ document.getElementById('pasteChips').innerHTML=e.target.value.trim()?'<span class="chip">Nothing recognized yet. Paste the full output.</span>':''; return; }
    if(o.pn) S.ev.pn=o.pn; if(o.cyc) S.ev.cyc=o.cyc; if(o.cap) S.ev.cap=o.cap; if(o.al) S.ev.al=o.al;
    S.ev.pasted=o; save();
    ['pn','cyc','cap'].forEach(k=>{ const i=document.querySelector(`[data-ev="${k}"]`); if(i) i.value=S.ev[k]||''; });
    pnLine(); showChips(o); renderResult();
  }
});
document.addEventListener('change',e=>{
  const q=e.target.dataset&&e.target.dataset.q;
  if(q){ if(e.target.value) S.ev[q]=e.target.value; else delete S.ev[q]; e.target.classList.toggle('unset',!e.target.value); save(); renderResult(); }
  if(e.target.id==='jump'&&e.target.value){ document.getElementById('st-'+e.target.value).scrollIntoView({behavior:reduce()?'auto':'smooth'}); e.target.value=''; }
});
document.addEventListener('click',e=>{
  const mk=e.target.closest('.seg.mini button');
  if(mk){ const row=mk.closest('.item'), id=row.dataset.id, v=mk.dataset.v; S.checks[id]=S.checks[id]===v?undefined:v; if(!S.checks[id]) delete S.checks[id]; save();
    row.querySelectorAll('.seg.mini button').forEach(x=>x.setAttribute('aria-pressed',String(S.checks[id]===x.dataset.v))); row.classList.toggle('is-issue',S.checks[id]==='issue'); updateChecklist(); renderResult(); return; }
  const ty=e.target.closest('[data-type]'); if(ty){ S.mode=ty.dataset.type; save(); renderTypes(); renderStages(); return; }
  const go=e.target.closest('[data-mode]'); if(go){ S.mode=go.dataset.mode; save(); renderTypes(); renderStages(); location.hash='#inspect'; return; }
  const gt=e.target.closest('[data-goto]'); if(gt){ location.hash='#'+gt.dataset.goto; return; }
  if(e.target.closest('#resetBtn')){ if(confirm('Clear all marked checks?')){ S.checks={}; save(); renderStages(); renderResult(); } return; }
  const cp=e.target.closest('.copy');
  if(cp){ const txt=cp.dataset.cmd, lab=cp.querySelector('span');
    const ok=()=>{ lab.textContent='Copied'; setTimeout(()=>lab.textContent='Copy',1500); };
    const fb=()=>{ const r=document.createRange(); r.selectNodeContents(cp.parentElement.querySelector('code')); const s=getSelection(); s.removeAllRanges(); s.addRange(r); lab.textContent='Press ⌘C'; };
    try{ navigator.clipboard.writeText(txt).then(ok,fb); }catch(err){ fb(); } }
});
document.getElementById('miniGo').addEventListener('click',()=>document.getElementById('result').scrollIntoView({behavior:reduce()?'auto':'smooth'}));

document.getElementById('rtable').innerHTML = Object.entries(REGIONS).map(([k,v])=>`<tr><td>${k}/A</td><td>${v}</td></tr>`).join('');
function runDecode(){
  const v=document.getElementById('pn').value, d=decodePN(v), out=document.getElementById('pnOut');
  if(!d){ out.innerHTML=''; return; }
  if(!d.ok){ out.innerHTML='<div class="drow flag"><b>Format</b><span>Not recognized. Expected something like MRX33LL/A.</span></div>'; return; }
  const rows=[['Type',d.p?d.p.label:'Unusual prefix '+d.prefix,d.p?d.p.cls:'flag'],['Meaning',d.p?d.p.note:'Not a standard retail prefix. Ask for the receipt and verify with Apple.']];
  if(d.code) rows.push(['Region',d.region?`${d.code}/A: ${d.region}`:`${d.code}/A: not in the common list, look it up`,d.region?'':'flag']);
  rows.push(['Next','Check the keyboard layout matches, then confirm the model on checkcoverage.apple.com.']);
  out.innerHTML=rows.map(([k,v,c])=>`<div class="drow ${c||''}"><b>${k}</b><span>${v}</span></div>`).join('');
}
document.getElementById('pnBtn').addEventListener('click',runDecode);
document.getElementById('pn').addEventListener('keydown',e=>{ if(e.key==='Enter') runDecode(); });

const ROWS=[
 [['Escape','esc'],['F1'],['F2'],['F3'],['F4'],['F5'],['F6'],['F7'],['F8'],['F9'],['F10'],['F11'],['F12']],
 [['Backquote','`'],['Digit1','1'],['Digit2','2'],['Digit3','3'],['Digit4','4'],['Digit5','5'],['Digit6','6'],['Digit7','7'],['Digit8','8'],['Digit9','9'],['Digit0','0'],['Minus','-'],['Equal','='],['Backspace','delete','w15']],
 [['Tab','tab','w15'],...'QWERTYUIOP'.split('').map(k=>['Key'+k,k]),['BracketLeft','['],['BracketRight',']'],['Backslash','\\']],
 [['CapsLock','caps','w2'],...'ASDFGHJKL'.split('').map(k=>['Key'+k,k]),['Semicolon',';'],['Quote',"'"],['Enter','return','w2']],
 [['ShiftLeft','shift','w25'],...'ZXCVBNM'.split('').map(k=>['Key'+k,k]),['Comma',','],['Period','.'],['Slash','/'],['ShiftRight','shift','w25']],
 [['ControlLeft','ctrl'],['AltLeft','opt'],['MetaLeft','cmd','w15'],['Space','space','w6'],['MetaRight','cmd','w15'],['AltRight','opt'],['ArrowLeft','←'],['ArrowUp','↑'],['ArrowDown','↓'],['ArrowRight','→']]
];
const hit=new Set(), kb=document.getElementById('kb'), KTOTAL=ROWS.flat().length;
kb.innerHTML=ROWS.map(r=>`<div class="kr">${r.map(([c,l,w])=>`<div class="key ${w||''}" data-code="${c}">${l||c}</div>`).join('')}</div>`).join('');
const kcount=()=>document.getElementById('kbCount').textContent=`${hit.size} of ${KTOTAL} keys detected`; kcount();
kb.addEventListener('focus',()=>kb.classList.add('active')); kb.addEventListener('blur',()=>kb.classList.remove('active'));
const mark=c=>{ const el=kb.querySelector(`[data-code="${c}"]`); if(el){ hit.add(c); el.classList.add('hit','now'); kcount(); } return el; };
kb.addEventListener('keydown',e=>{ e.preventDefault(); mark(e.code); });
kb.addEventListener('keyup',e=>{ const el=e.code==='CapsLock'?mark('CapsLock'):kb.querySelector(`[data-code="${e.code}"]`); if(el) el.classList.remove('now'); });
document.getElementById('kbReset').addEventListener('click',()=>{ hit.clear(); kb.querySelectorAll('.key').forEach(k=>k.classList.remove('hit','now')); kcount(); kb.focus(); });

document.getElementById('pxBtn').addEventListener('click',()=>{
  const cols=['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#808080']; let i=0;
  const o=document.createElement('div'); o.className='px'; o.style.background=cols[0];
  o.innerHTML='<span class="hint">Click or Space for next color. Esc to exit.</span>'; document.body.appendChild(o);
  setTimeout(()=>o.querySelector('.hint').classList.add('gone'),2500);
  const close=()=>{ o.remove(); document.removeEventListener('keydown',key); document.removeEventListener('fullscreenchange',fs); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); };
  const next=()=>{ i++; if(i>=cols.length) return close(); o.style.background=cols[i]; };
  const key=e=>{ if(e.key==='Escape') close(); else if(e.key===' '||e.key==='ArrowRight'){ e.preventDefault(); next(); } };
  const fs=()=>{ if(!document.fullscreenElement&&document.body.contains(o)) close(); };
  o.addEventListener('click',next); document.addEventListener('keydown',key); document.addEventListener('fullscreenchange',fs);
  if(o.requestFullscreen) o.requestFullscreen().catch(()=>{});
});
let ctx; const ac=()=>{ ctx=ctx||new (window.AudioContext||window.webkitAudioContext)(); if(ctx.state==='suspended') ctx.resume(); return ctx; };
document.querySelectorAll('[data-pan]').forEach(b=>b.addEventListener('click',()=>{
  const c=ac(),o=c.createOscillator(),g=c.createGain(),p=c.createStereoPanner(); o.frequency.value=440; p.pan.value=+b.dataset.pan;
  g.gain.setValueAtTime(0,c.currentTime); g.gain.linearRampToValueAtTime(.4,c.currentTime+.05); g.gain.setValueAtTime(.4,c.currentTime+1.4); g.gain.linearRampToValueAtTime(0,c.currentTime+1.5);
  o.connect(g).connect(p).connect(c.destination); o.start(); o.stop(c.currentTime+1.55);
}));
document.getElementById('sweep').addEventListener('click',()=>{
  const c=ac(),o=c.createOscillator(),g=c.createGain();
  o.frequency.setValueAtTime(60,c.currentTime); o.frequency.exponentialRampToValueAtTime(10000,c.currentTime+6);
  g.gain.setValueAtTime(0,c.currentTime); g.gain.linearRampToValueAtTime(.35,c.currentTime+.1); g.gain.setValueAtTime(.35,c.currentTime+5.8); g.gain.linearRampToValueAtTime(0,c.currentTime+6);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime+6.05);
});



/* boot */
renderQs(); renderTypes(); renderStages(); renderResult(); route(); icons();
