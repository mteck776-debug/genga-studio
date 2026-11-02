/* ---------- timeline ---------- */
const grid=$('#grid'),gx=grid.getContext('2d'),RH=24,RULER=22;
let ROWS=[];
function rigRowsOpen(l){return S.rowOpen[l.id];}
function trackNames(o){return Object.keys(o.tr||{}).filter(k=>o.tr[k].length);}
const PROP_LABEL={x:'Position X',y:'Position Y',rot:'Rotation',sx:'Scale X',sy:'Scale Y',opacity:'Opacity',blur:'Blur',bright:'Brightness',sat:'Saturation',tint:'Tint',ax:'Anchor X',ay:'Anchor Y',zoom:'Zoom',shake:'Shake',swap:'Image swap',deform:'Mesh deform',reveal:'Text reveal'};
function buildRowsList(){
 const sc=cur(),R=[];
 R.push({k:'cam',o:sc.camera,name:'Camera',ty:'CAM'});
 for(let i=sc.layers.length-1;i>=0;i--){const l=sc.layers[i];
  const ty={draw:'DRAW',image:'IMG',text:'TEXT',rig:'RIG',fx:'FX',solid:'FILL'}[l.type];
  R.push({k:'layer',o:l,l,name:l.name,ty});
  if(S.rowOpen[l.id]){
   trackNames(l).forEach(p=>R.push({k:'prop',o:l,l,p,name:PROP_LABEL[p]||p}));
   (l.filters||[]).forEach(q=>trackNames(q).forEach(p=>R.push({k:'prop',o:q,l,p,name:`${FILTERS[q.type].label}: ${FILTER_LABEL[p]||p}`})));
   if(l.rig){l.rig.bones.forEach(b=>R.push({k:'bone',o:b,l,name:b.name}));l.rig.parts.forEach(t=>R.push({k:'part',o:t,l,name:t.name}));}
  }
 }
 S.doc.audio.forEach(c=>R.push({k:'audio',clip:c,name:c.name}));
 ROWS=R;
}
function rowTracks(r){
 if(r.k==='prop')return[[r.o,r.p]];
 if(r.k==='audio')return[];
 const out=trackNames(r.o).map(p=>[r.o,p]);
 if(r.k==='layer')(r.l.filters||[]).forEach(q=>trackNames(q).forEach(p=>out.push([q,p])));
 if(r.k==='layer'&&r.l.rig){r.l.rig.bones.forEach(b=>trackNames(b).forEach(p=>out.push([b,p])));r.l.rig.parts.forEach(t=>trackNames(t).forEach(p=>out.push([t,p])));}
 return out;
}
function buildRows(){
 buildRowsList();const host=$('#rows');host.innerHTML='';const inner=el('div',{id:'rowsIn'});host.append(inner);
 ROWS.forEach(r=>{
  let d;
  if(r.k==='layer'){const l=r.l;d=el('div',{class:'r'+(l.id===S.layerId&&!S.sel.cam&&!S.sel.boneId&&!S.sel.partId?' on':'')});
   d.append(el('button',{class:'ic','aria-label':'Expand tracks',title:'Show tracks',onclick:e=>{e.stopPropagation();S.rowOpen[l.id]=!S.rowOpen[l.id];buildRows();invalidate();}},S.rowOpen[l.id]?'▾':'▸'),
    el('span',{class:'ty'},r.ty),el('span',{class:'nm',title:'Double-click to rename'},r.name),
    el('button',{class:'ic'+(l.vis?'':' off'),'aria-label':'Show or hide layer',title:'Show or hide',onclick:e=>{e.stopPropagation();l.vis=!l.vis;commit();buildRows();buildCuts();}},'◉'),
    el('button',{class:'ic'+(l.lock?'':' off'),'aria-label':'Lock layer',title:'Lock',onclick:e=>{e.stopPropagation();l.lock=!l.lock;commit();buildRows();}},'▣'));
   d.addEventListener('click',()=>selectLayer(l.id));
   d.addEventListener('dblclick',()=>renameRow(d,l,'name'));
   d.draggable=true;d.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/x-layer',l.id);e.dataTransfer.effectAllowed='move';});
   d.addEventListener('dragover',e=>e.preventDefault());
   d.addEventListener('drop',e=>{const id=e.dataTransfer.getData('text/x-layer');if(!id||id===l.id)return;e.preventDefault();e.stopPropagation();const ls=cur().layers,a=ls.findIndex(x=>x.id===id),m=ls.splice(a,1)[0],b=ls.findIndex(x=>x.id===l.id);ls.splice(b+1,0,m);commit();structure();});
  }else if(r.k==='cam'){d=el('div',{class:'r'+(S.sel.cam?' on':'')},el('span',{class:'ic'}),el('span',{class:'ty'},'CAM'),el('span',{class:'nm'},'Camera'));d.addEventListener('click',()=>{S.sel.cam=true;S.sel.boneId=S.sel.partId=null;buildRows();buildInspector();invalidate();});}
  else if(r.k==='audio'){d=el('div',{class:'r'},el('span',{class:'ic'}),el('span',{class:'ty'},'SND'),el('span',{class:'nm',title:r.name},r.name),el('button',{class:'ic','aria-label':'Remove sound',title:'Remove',onclick:e=>{e.stopPropagation();S.doc.audio=S.doc.audio.filter(c=>c!==r.clip);commit();structure();}},'✕'));d.addEventListener('click',()=>{S.sel.clip=r.clip.id;S.layerId=null;buildInspector();});}
  else{const on=(r.k==='bone'&&r.o.id===S.sel.boneId)||(r.k==='part'&&r.o.id===S.sel.partId);d=el('div',{class:'r sub'+(on?' on':'')},el('span',{class:'ic'}),el('span',{class:'ty'},r.k==='bone'?'bone':r.k==='part'?'part':''),el('span',{class:'nm'},r.name));
   d.addEventListener('click',()=>{S.layerId=r.l.id;S.sel.cam=false;if(r.k==='bone'){S.sel.boneId=r.o.id;S.sel.partId=null;}if(r.k==='part'){S.sel.partId=r.o.id;S.sel.boneId=null;}buildRows();buildInspector();buildOpts();invalidate();});
   if(r.k!=='prop')d.addEventListener('dblclick',()=>renameRow(d,r.o,'name'));}
  inner.append(d);});
 inner.style.transform=`translateY(${-S.tl.sy}px)`;
}
function renameRow(d,o,key){const i=el('input',{value:o[key]});i.style.cssText='position:relative;width:100%;height:22px';d.replaceChildren(i);i.focus();i.select();const fin=()=>{o[key]=i.value||o[key];commit();structure();};i.addEventListener('blur',fin);i.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')i.blur();if(e.key==='Escape'){i.value=o[key];i.blur();}});}
const fx=(f)=>f*S.tl.ppf-S.tl.sx, xf=(x)=>Math.round((x+S.tl.sx)/S.tl.ppf);
function sizeGrid(){const r=$('#gridWrap').getBoundingClientRect(),D=dpr();grid.width=Math.max(2,r.width*D|0);grid.height=Math.max(2,r.height*D|0);}
const keyId=(o,p,f)=>`${o.id}|${p}|${f}`;
function drawGrid(){
 const D=dpr(),w=grid.width/D,h=grid.height/D,sc=cur(),d=S.doc,ppf=S.tl.ppf;gx.setTransform(D,0,0,D,0,0);
 gx.fillStyle='#1b1f29';gx.fillRect(0,0,w,h);
 const f0=Math.max(0,xf(0)-1),f1=xf(w)+1,endX=fx(sc.dur);
 /* one-second bands, as on an anime timesheet */
 for(let s=Math.floor(f0/d.fps);s*d.fps<f1;s++){if(s%2){gx.fillStyle='#20242f';gx.fillRect(fx(s*d.fps),RULER,d.fps*ppf,h);}}
 if(ppf>=6){gx.strokeStyle='#272c39';gx.lineWidth=1;gx.beginPath();for(let f=f0;f<f1;f++){const x=Math.round(fx(f))+.5;gx.moveTo(x,RULER);gx.lineTo(x,h);}gx.stroke();}
 gx.fillStyle='rgba(8,9,14,.62)';gx.fillRect(endX,0,Math.max(0,w-endX),h);
 gx.save();gx.beginPath();gx.rect(0,RULER,w,h-RULER);gx.clip();
 ROWS.forEach((r,i)=>{
  const y=RULER+i*RH-S.tl.sy;if(y+RH<RULER||y>h)return;
  gx.strokeStyle='#2a2f3d';gx.beginPath();gx.moveTo(0,y+RH-.5);gx.lineTo(w,y+RH-.5);gx.stroke();const cy=y+RH/2;
  if(r.k==='layer'&&r.l.type==='draw'){r.l.cels.forEach((c,j)=>{const nx=r.l.cels[j+1]?r.l.cels[j+1].f:sc.dur,x0=fx(c.f),x1=fx(nx);gx.fillStyle=c.a?'#3b4a6b':'#2a2f3d';gx.fillRect(x0,y+3,x1-x0-1,RH-7);gx.fillStyle=c.a?'#ffd98c':'#6b7186';const on=S.keys.has(celId(r.l,c.f));if(on)gx.fillStyle='#57b6ff';gx.beginPath();gx.arc(x0+ppf/2,cy-1,Math.min(on?5:4,ppf*.45),0,7);if(c.a||on)gx.fill();else{gx.strokeStyle=gx.fillStyle;gx.stroke();}if(on){gx.strokeStyle='#fff';gx.stroke();}});}
  if(r.k==='audio'){const c=r.clip,st=sceneStart(S.si),s=Sounds.get(c.asset);if(s){const x0=fx(c.start-st),wd=s.buffer.duration*d.fps*ppf;gx.fillStyle='#2b4a48';gx.fillRect(x0,y+2,wd,RH-5);const pk=peaks(s);gx.strokeStyle='#6fd3a4';gx.beginPath();const a=Math.max(0,-x0|0),b=Math.min(wd,w-x0)|0;for(let px=a;px<b;px+=2){const v=pk[Math.floor(px/wd*pk.length)]||0,X=x0+px+.5;gx.moveTo(X,cy-1-v*8);gx.lineTo(X,cy-1+v*8);}gx.stroke();}return;}
  const tr=rowTracks(r),seen=new Map();tr.forEach(([o,p])=>o.tr[p].forEach(k=>{const e=seen.get(k.f)||{sel:false,hold:false};if(S.keys.has(keyId(o,p,k.f)))e.sel=true;if(k.e==='hold')e.hold=true;seen.set(k.f,e);}));
  if(r.k!=='layer'||!r.l.rig){const fs=[...seen.keys()].sort((a,b)=>a-b);if(fs.length>1){gx.fillStyle='rgba(255,106,92,.13)';gx.fillRect(fx(fs[0])+ppf/2,cy-3,fx(fs[fs.length-1])-fx(fs[0]),6);}}
  seen.forEach((e,f)=>{const x=fx(f)+ppf/2;if(x<-8||x>w+8)return;const s=r.k==='layer'&&r.l.rig?4:5;gx.fillStyle=e.sel?'#ffd98c':'#ff6a5c';gx.beginPath();if(e.hold)gx.rect(x-s+1,cy-s+1,s*2-2,s*2-2);else{gx.moveTo(x,cy-s);gx.lineTo(x+s,cy);gx.lineTo(x,cy+s);gx.lineTo(x-s,cy);gx.closePath();}gx.fill();gx.strokeStyle='#0b0d14';gx.stroke();});
 });
 if(TLdrag&&TLdrag.marq){const m=TLdrag.marq;gx.fillStyle='rgba(87,182,255,.15)';gx.strokeStyle='#57b6ff';gx.fillRect(m[0],m[1],m[2]-m[0],m[3]-m[1]);gx.strokeRect(m[0],m[1],m[2]-m[0],m[3]-m[1]);}
 gx.restore();
 /* ruler in sec+frame (koma) notation */
 gx.fillStyle='#262b37';gx.fillRect(0,0,w,RULER);gx.font='11px "DM Mono",monospace';gx.textBaseline='middle';
 const every=ppf>=30?1:ppf>=6?(d.fps>=24?6:5):d.fps;
 for(let f=Math.floor(f0/every)*every;f<f1;f+=every){const x=Math.round(fx(f))+.5;const isSec=f%d.fps===0;gx.strokeStyle=isSec?'#7e8598':'#4b5163';gx.beginPath();gx.moveTo(x,isSec?10:15);gx.lineTo(x,RULER);gx.stroke();if(isSec){gx.fillStyle='#d0d3dc';gx.fillText(`${f/d.fps}+00`,x+3,7);}else if(ppf>=12){gx.fillStyle='#7e8598';gx.fillText(`${f%d.fps}`,x+3,8);}}
 gx.fillStyle='#ffd98c';gx.fillRect(endX-1,0,3,RULER);
 const px=fx(S.frame);gx.fillStyle='rgba(87,182,255,.2)';gx.fillRect(px,RULER,ppf,h);gx.strokeStyle='#57b6ff';gx.lineWidth=1.5;gx.beginPath();gx.moveTo(px+ppf/2,0);gx.lineTo(px+ppf/2,h);gx.stroke();gx.lineWidth=1;gx.fillStyle='#57b6ff';gx.beginPath();gx.moveTo(px+ppf/2-6,0);gx.lineTo(px+ppf/2+6,0);gx.lineTo(px+ppf/2+6,9);gx.lineTo(px+ppf/2,15);gx.lineTo(px+ppf/2-6,9);gx.fill();
 const tc=$('#tc'),fr=$('#fr');if(tc){tc.textContent=`${Math.floor(S.frame/d.fps)}+${String(S.frame%d.fps).padStart(2,'0')}`;fr.textContent=`f ${S.frame+1} / ${sc.dur}`;}
}
function peaks(s){if(s.pk)return s.pk;const ch=s.buffer.getChannelData(0),n=Math.min(6000,Math.ceil(s.buffer.duration*60)),o=new Float32Array(n),st=Math.floor(ch.length/n);for(let i=0;i<n;i++){let m=0;for(let j=0;j<st;j+=8){const v=Math.abs(ch[i*st+j]||0);if(v>m)m=v;}o[i]=m;}return s.pk=o;}
let TLdrag=null;
function keyAt(mx,my){const i=Math.floor((my-RULER+S.tl.sy)/RH),r=ROWS[i];if(!r)return{r:null};const f=xf(mx-S.tl.ppf/2);let hit=null;const tr=rowTracks(r);for(const[o,p]of tr){for(const k of o.tr[p]){if(Math.abs(fx(k.f)+S.tl.ppf/2-mx)<=Math.max(6,S.tl.ppf/2)){hit=k.f;break;}}if(hit!=null)break;}return{r,i,hit,tr,f};}
const celId=(l,f)=>`${l.id}|@cel|${f}`;
function selectedCels(){const out=[];for(const id of S.keys){const[lid,p,f]=id.split('|');if(p!=='@cel')continue;const l=cur().layers.find(x=>x.id===lid),c=l&&l.cels&&l.cels.find(q=>q.f===+f);if(c)out.push({l,cel:c});}return out;}
function dragItems(){return[...allSelected().map(a=>({...a,f0:a.k.f})),...selectedCels().map(a=>({...a,f0:a.cel.f}))];}
function refreshSel(items){S.keys=new Set(items.map(a=>a.cel?celId(a.l,a.cel.f):keyId(a.o,a.p,a.k.f)));}
function dedupeCels(items){new Set(items.filter(a=>a.cel).map(a=>a.l)).forEach(l=>{l.cels.sort((a,b)=>a.f-b.f);const moved=new Set(items.map(a=>a.cel));for(let i=l.cels.length-1;i>0;i--)if(l.cels[i].f===l.cels[i-1].f)l.cels.splice(moved.has(l.cels[i])?i-1:i,1);});}
function allSelected(){const out=[];for(const id of S.keys){const[oid,p,f]=id.split('|');const o=findOwner(oid);if(!o||!o.tr||!o.tr[p])continue;const k=o.tr[p].find(q=>q.f===+f);if(k)out.push({o,p,k});}return out;}
function findOwner(id){const sc=cur();if(sc.camera.id===id)return sc.camera;for(const l of sc.layers){if(l.id===id)return l;const q=(l.filters||[]).find(x=>x.id===id);if(q)return q;if(l.rig){const b=l.rig.bones.find(x=>x.id===id)||l.rig.parts.find(x=>x.id===id);if(b)return b;}}return null;}
function gridPt(e){const r=grid.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
grid.addEventListener('pointerdown',e=>{
 grid.setPointerCapture(e.pointerId);if(S.playing)stopPlay();const[mx,my]=gridPt(e);
 if(my<RULER){if(Math.abs(mx-fx(cur().dur))<6){TLdrag={dur:1};return;}TLdrag={scrub:1};setFrame(xf(mx-S.tl.ppf/2));return;}
 const h=keyAt(mx,my);
 if(h.r&&h.r.k==='audio'){const c=h.r.clip;TLdrag={clip:c,x:mx,st:c.start};return;}
 if(h.r&&h.r.k==='layer'&&h.r.l.cels&&e.shiftKey&&S.anchor&&S.anchor.l===h.r.l.id){const f=h.hit!=null?h.hit:xf(mx-S.tl.ppf/2),a=Math.min(f,S.anchor.f),b=Math.max(f,S.anchor.f);h.r.l.cels.forEach(c=>{if(c.f>=a&&c.f<=b)S.keys.add(celId(h.r.l,c.f));});h.tr.forEach(([o,p])=>o.tr[p].forEach(k=>{if(k.f>=a&&k.f<=b)S.keys.add(keyId(o,p,k.f));}));buildInspector();invalidate();return;}
 if(h.r&&h.r.k==='layer'&&h.r.l.type==='draw'&&h.hit==null){const c=h.r.l.cels.find(q=>Math.abs(fx(q.f)-mx)<6||(mx>=fx(q.f)&&mx<fx(q.f)+Math.min(S.tl.ppf,14)));if(c&&c.f>=0){const l=h.r.l,id=celId(l,c.f);if(S.layerId!==l.id)selectLayer(l.id);if(!S.keys.has(id)){if(!e.shiftKey)S.keys.clear();S.keys.add(id);}else if(e.shiftKey)S.keys.delete(id);S.anchor={l:l.id,f:c.f};buildInspector();setFrame(c.f);TLdrag={keys:dragItems(),x:mx,df:0};invalidate();return;}}
 if(h.r&&h.hit!=null){
  const anySel=h.tr.some(([o,p])=>S.keys.has(keyId(o,p,h.hit)));
  if(!anySel){if(!e.shiftKey)S.keys.clear();h.tr.forEach(([o,p])=>{if(o.tr[p].some(k=>k.f===h.hit))S.keys.add(keyId(o,p,h.hit));});}
  else if(e.shiftKey){h.tr.forEach(([o,p])=>S.keys.delete(keyId(o,p,h.hit)));}
  if(h.r.k==='layer'&&h.r.l.cels){const c=h.r.l.cels.find(q=>q.f===h.hit);if(c)S.keys.add(celId(h.r.l,c.f));S.anchor={l:h.r.l.id,f:h.hit};}
  buildInspector();setFrame(h.hit);
  TLdrag={keys:dragItems(),x:mx,df:0};invalidate();return;}
 if(!e.shiftKey){S.keys.clear();buildInspector();}
 TLdrag={marq:[mx,my,mx,my],sx:mx,sy:my,base:new Set(S.keys)};invalidate();});
grid.addEventListener('pointermove',e=>{if(!TLdrag)return;const[mx,my]=gridPt(e);
 if(TLdrag.scrub)setFrame(xf(mx-S.tl.ppf/2));
 else if(TLdrag.dur){cur().dur=Math.max(1,xf(mx));S.frame=Math.min(S.frame,cur().dur-1);syncDur();invalidate();}
 else if(TLdrag.clip){TLdrag.clip.start=Math.max(0,TLdrag.st+Math.round((mx-TLdrag.x)/S.tl.ppf));invalidate();}
 else if(TLdrag.keys){const D=TLdrag,df=Math.round((mx-D.x)/S.tl.ppf);const min=Math.min(...D.keys.map(k=>k.f0));const dd=Math.max(df,-min);D.df=dd;D.keys.forEach(a=>{if(a.cel)a.cel.f=a.f0+dd;else a.k.f=a.f0+dd;});new Set(D.keys.filter(a=>!a.cel).map(a=>a.o.tr[a.p])).forEach(t=>t.sort((a,b)=>a.f-b.f));new Set(D.keys.filter(a=>a.cel).map(a=>a.l)).forEach(l=>l.cels.sort((a,b)=>a.f-b.f));invalidate();}
 else if(TLdrag.marq){const D=TLdrag;D.marq=[Math.min(D.sx,mx),Math.min(D.sy,my),Math.max(D.sx,mx),Math.max(D.sy,my)];S.keys=new Set(D.base);const m=D.marq;ROWS.forEach((r,i)=>{const y=RULER+i*RH-S.tl.sy+RH/2;if(y<m[1]||y>m[3])return;rowTracks(r).forEach(([o,p])=>o.tr[p].forEach(k=>{const x=fx(k.f)+S.tl.ppf/2;if(x>=m[0]&&x<=m[2])S.keys.add(keyId(o,p,k.f));}));if(r.k==='layer'&&r.l.cels)r.l.cels.forEach(c=>{const x=fx(c.f)+S.tl.ppf/2;if(x>=m[0]&&x<=m[2])S.keys.add(celId(r.l,c.f));});});invalidate();}});
const gridUp=()=>{if(!TLdrag)return;const D=TLdrag;TLdrag=null;
 if(D.keys&&D.df){const ts=new Set();D.keys.forEach(a=>{if(!a.cel)ts.add(a.o.tr[a.p]);});ts.forEach(t=>{for(let i=t.length-1;i>0;i--)if(t[i].f===t[i-1].f)t.splice(D.keys.some(a=>a.k===t[i])?i-1:i,1);});dedupeCels(D.keys);refreshSel(D.keys.filter(a=>a.cel?a.l.cels.includes(a.cel):a.o.tr[a.p].includes(a.k)));commit();}
 else if(D.dur){commit();buildCuts();}else if(D.clip)commit();
 else if(D.marq){buildInspector();invalidate();}};
grid.addEventListener('pointerup',gridUp);grid.addEventListener('pointercancel',gridUp);
$('#tlBody').addEventListener('wheel',e=>{e.preventDefault();
 if(e.ctrlKey||e.metaKey){const r=grid.getBoundingClientRect(),mx=e.clientX-r.left,f=(mx+S.tl.sx)/S.tl.ppf;S.tl.ppf=clamp(S.tl.ppf*Math.exp(-e.deltaY*.002),2,48);S.tl.sx=Math.max(0,f*S.tl.ppf-mx);const z=$('#tlZoom');if(z)z.value=S.tl.ppf;}
 else if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))S.tl.sx=Math.max(0,S.tl.sx+(e.deltaX||e.deltaY));
 else{const max=Math.max(0,ROWS.length*RH-grid.clientHeight+RULER+8);S.tl.sy=clamp(S.tl.sy+e.deltaY,0,max);const ri=$('#rowsIn');if(ri)ri.style.transform=`translateY(${-S.tl.sy}px)`;}
 invalidate();},{passive:false});
/* key operations */
function deleteSelected(){if(S.keys.size){selectedCels().forEach(({l,cel})=>{l.cels=l.cels.filter(c=>c!==cel);});allSelected().forEach(({o,p,k})=>delKey(o,p,k.f));S.keys.clear();commit();structure();return true;}return false;}
let Clip=null;
function copyKeys(){const a=allSelected(),cs=selectedCels();if(!a.length&&!cs.length)return;const min=Math.min(...a.map(x=>x.k.f),...cs.map(x=>x.cel.f));Clip=[...a.map(x=>({oid:x.o.id,p:x.p,df:x.k.f-min,v:JSON.parse(JSON.stringify(x.k.v)),e:x.k.e})),...cs.map(x=>({lid:x.l.id,df:x.cel.f-min,a:x.cel.a,x:x.cel.x,y:x.cel.y}))];toast(`Copied ${Clip.length} keyframes.`);}
function pasteKeys(){if(!Clip)return;S.keys.clear();Clip.forEach(c=>{const f=S.frame+c.df;if(c.lid){const l=cur().layers.find(x=>x.id===c.lid);if(!l)return;l.cels=l.cels.filter(q=>q.f!==f);l.cels.push({f,a:c.a,x:c.x,y:c.y});l.cels.sort((a,b)=>a.f-b.f);S.keys.add(celId(l,f));return;}const o=findOwner(c.oid);if(!o)return;setKey(o,c.p,f,c.v,c.e);S.keys.add(keyId(o,c.p,f));});commit();}
/* transport */
function syncDur(){const i=$('#cutLen');if(i&&document.activeElement!==i)i.value=cur().dur;}
function buildTransport(){
 const T=$('#transport');T.innerHTML='';
 const B=(label,title,fn,id)=>el('button',{title,onclick:fn,id,'aria-label':title},label);
 T.append(B('⏮','First frame',()=>setFrame(0)),B('◂','Previous frame ( , )',()=>setFrame(S.frame-1)),B('▶','Play / pause (Space)',togglePlay,'btnPlay'),B('▸','Next frame ( . )',()=>setFrame(S.frame+1)),B('⏭','Last frame',()=>setFrame(cur().dur-1)),
  el('span',{class:'tc',id:'tc',title:'Seconds + frames'},'0+00'),el('span',{class:'fr',id:'fr'}),
  el('button',{class:'tog'+(S.playAll?' on':''),id:'btnAll',title:'Play every cut in order, with transitions and sound',onclick:e=>{S.playAll=!S.playAll;e.target.classList.toggle('on',S.playAll);}},'Whole film'),
  B('◆ Key','Add a keyframe for the selection (F6)',keyHere),B('Blank','New blank drawing on this frame (F7)',()=>newCel(false)),B('+Hold','Hold this drawing one frame longer (F5)',()=>holdFrames(1)),B('−Hold','Hold one frame less (Shift+F5)',()=>holdFrames(-1)),
  el('label',{},'Cut length',el('input',{id:'cutLen',type:'number',min:1,value:cur().dur,style:'width:58px',title:'Frames',onchange:e=>{cur().dur=Math.max(1,+e.target.value||1);S.frame=Math.min(S.frame,cur().dur-1);commit();buildCuts();}})),
  el('div',{class:'spacer'}),el('label',{},'Zoom',el('input',{id:'tlZoom',type:'range',min:2,max:48,step:1,value:S.tl.ppf,style:'width:90px',oninput:e=>{S.tl.ppf=+e.target.value;invalidate();}})));
}
/* cut strip */
const thumbs=new Map();
function buildCuts(){
 const h=$('#cuts');h.innerHTML='';
 S.doc.scenes.forEach((s,i)=>{
  if(i>0){h.append(el('button',{class:'tmark',title:`Transition: ${s.trans.type}`,onclick:()=>{gotoScene(i);}},{cut:'|',black:'▮',white:'▯',flash:'✦',cross:'×',wipe:'▸'}[s.trans.type]));}
  const c=mkCanvas(192,108),b=el('button',{class:'cut'+(i===S.si?' on':''),title:`${s.name}, ${(s.dur/S.doc.fps).toFixed(1)} sec`,onclick:()=>gotoScene(i)},c,el('span',{},`${s.name}`));
  b.draggable=true;
  b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/x-cut',String(i));e.dataTransfer.effectAllowed='move';b.classList.add('lift');});
  b.addEventListener('dragend',()=>{b.classList.remove('lift');$$('.cut').forEach(x=>x.classList.remove('dropL','dropR'));});
  const side=e=>{const r=b.getBoundingClientRect();return e.clientX>r.left+r.width/2;};
  b.addEventListener('dragover',e=>{if(![...e.dataTransfer.types].includes('text/x-cut'))return;e.preventDefault();const R=side(e);b.classList.toggle('dropR',R);b.classList.toggle('dropL',!R);});
  b.addEventListener('dragleave',()=>b.classList.remove('dropL','dropR'));
  b.addEventListener('drop',e=>{const v=e.dataTransfer.getData('text/x-cut');if(v==='')return;e.preventDefault();e.stopPropagation();const from=+v;let to=i+(side(e)?1:0);if(from<to)to--;moveScene(from,to);});
  h.append(b);thumbs.set(s.id,c);});
 h.append(el('button',{class:'cut add',title:'Add a new cut',onclick:addScene},'+'));
 scheduleThumbs();
}
let thumbT=null;
function scheduleThumbs(){clearTimeout(thumbT);thumbT=setTimeout(()=>{const k=192/S.doc.w;S.doc.scenes.forEach(s=>{const c=thumbs.get(s.id);if(c){const g=c.getContext('2d');renderScene(g,s,Math.min(s.dur-1,Math.floor(s.dur*.6)),{base:[k,0,0,k,0,0],useCam:true,clip:true});}});},350);}
function moveScene(from,to){const ss=S.doc.scenes;to=clamp(to,0,ss.length-1);if(from===to)return;const active=cur(),[m]=ss.splice(from,1);ss.splice(to,0,m);S.si=ss.indexOf(active);commit();buildCuts();buildInspector();toast(`Moved ${m.name}.`);}
function gotoScene(i){S.si=i;S.frame=Math.min(S.frame,cur().dur-1);S.layerId=cur().layers[cur().layers.length-1]?.id||null;S.keys.clear();S.sel={cam:false,boneId:null,partId:null};S.setup=false;structure();}
function addScene(){const s=newScene('Cut '+(S.doc.scenes.length+1),48);s.bg=cur().bg;S.doc.scenes.splice(S.si+1,0,s);S.si++;S.frame=0;S.layerId=null;commit();structure();}
function dupScene(){const sc=cur(),c=JSON.parse(JSON.stringify(sc));c.id=uid('s');c.camera.id=uid('c');c.name=sc.name+' copy';const map={};c.layers=c.layers.map(l=>{if(l.rig){const n=cloneRigLayer(l);map[l.id]=n.id;return n;}const id=uid('l');map[l.id]=id;l.id=id;return l;});c.layers.forEach(l=>{if(l.parent)l.parent=map[l.parent]||null;});S.doc.scenes.splice(S.si+1,0,c);S.si++;commit();structure();}
function delScene(){if(S.doc.scenes.length<2)return toast('A film needs at least one cut.');S.doc.scenes.splice(S.si,1);S.si=clamp(S.si,0,S.doc.scenes.length-1);S.frame=Math.min(S.frame,cur().dur-1);S.layerId=null;commit();structure();}
/* playback */
const Audio_={ctx:null,src:[]};
function audioCtx(){if(!Audio_.ctx)Audio_.ctx=new (window.AudioContext||window.webkitAudioContext)();Audio_.ctx.resume&&Audio_.ctx.resume();return Audio_.ctx;}
function startAudio(g){stopAudio();if(!S.doc.audio.length)return;const ac=audioCtx(),fps=S.doc.fps,now=g/fps,t0=ac.currentTime+.04;for(const c of S.doc.audio){const s=Sounds.get(c.asset);if(!s)continue;const st=c.start/fps+0,off=(c.offset||0),n=ac.createBufferSource();n.buffer=s.buffer;const gn=ac.createGain();n.connect(gn).connect(ac.destination);const d=st-now;let begin=off,at=t0+d;if(d<0){begin=off-d;at=t0;if(begin>=s.buffer.duration)continue;}n.start(at,begin);fadeGain(gn.gain,c,s,t0-now);Audio_.src.push(n);}}
/* tz converts film time to audio-context time */
function fadeGain(g,c,s,tz){const fps=S.doc.fps,st=c.start/fps+tz,clipEnd=st+s.buffer.duration-(c.offset||0),end=Math.min(clipEnd,totalFrames()/fps+tz),fi=c.fadeIn||0,fo=c.fadeOut||0;g.setValueAtTime(fi?0:c.vol,Math.max(0,st));if(fi)g.linearRampToValueAtTime(c.vol,st+fi);if(fo&&end-fo>st+fi){g.setValueAtTime(c.vol,end-fo);g.linearRampToValueAtTime(0,end);}}
function stopAudio(){Audio_.src.forEach(n=>{try{n.stop();}catch(e){}});Audio_.src=[];}
function togglePlay(){S.playing?stopPlay():startPlay();}
function startPlay(){S.playing=true;const d=S.doc;let g0=sceneStart(S.si)+S.frame;if(S.playAll&&g0>=totalFrames()-1)g0=0;const b=$('#btnPlay');if(b)b.textContent='❚❚';const t0=performance.now();startAudio(g0);let base=g0,start=t0;
 const tick=()=>{if(!S.playing)return;const el=(performance.now()-start)/1000,fr=Math.floor(el*d.fps);let g=base+fr;
  if(S.playAll){if(g>=totalFrames()){stopPlay();return;}const L=locate(g);if(L.i!==S.si){S.si=L.i;S.layerId=null;S.frame=L.local;buildCuts();buildRows();buildTransport();const b=$('#btnPlay');if(b)b.textContent='❚❚';}S.frame=L.local;}
  else{const st=sceneStart(S.si);let f=g-st;if(f>=cur().dur){base=st;start=performance.now();f=0;startAudio(st);}S.frame=f;}
  paintStage();drawGrid();requestAnimationFrame(tick);};
 requestAnimationFrame(tick);}
function stopPlay(){S.playing=false;stopAudio();const b=$('#btnPlay');if(b)b.textContent='▶';invalidate();}

/* spread or squeeze timing: works on the selection, or on the whole active layer when nothing is selected */
function retimeTargets(){
 let items=[...allSelected().map(a=>({key:a.k,t:a.o.tr[a.p],o:a.o})),...selectedCels().map(a=>({cel:a.cel,l:a.l}))];let scope='selection';
 if(!items.length){scope='layer';const l=layer();const owners=[];if(S.sel.cam)owners.push(cur().camera);else if(l){const b=bone(),p=part();if(b)owners.push(b);else if(p)owners.push(p);else{owners.push(l,...(l.filters||[]));if(l.rig)owners.push(...l.rig.bones,...l.rig.parts);if(l.cels)l.cels.forEach(c=>items.push({cel:c,l}));}}owners.forEach(o=>trackNames(o).forEach(p=>o.tr[p].forEach(k=>items.push({key:k,t:o.tr[p],o}))));}
 return{items,scope};}
function retime(mode,n){
 const{items}=retimeTargets();if(!items.length)return toast('Nothing to space out yet.');
 const fOf=a=>a.cel?a.cel.f:a.key.f,U=[...new Set(items.map(fOf))].sort((a,b)=>a-b);if(U.length<2)return toast('Select at least two keys on different frames.');
 const first=U[0],last=U[U.length-1],map=new Map();let prev=-1e9;
 U.forEach((f,i)=>{let nf=mode==='even'?first+i*n:first+Math.round((f-first)*n);nf=Math.max(nf,prev+1);map.set(f,nf);prev=nf;});
 const delta=map.get(last)-last,tracks=new Set(items.filter(a=>a.t).map(a=>a.t)),layers=new Set(items.filter(a=>a.l).map(a=>a.l)),picked=new Set(items.map(a=>a.cel||a.key));
 /* later keys on the same tracks slide along so nothing lands on top of them */
 if(S.ripple!==false){tracks.forEach(t=>t.forEach(k=>{if(!picked.has(k)&&k.f>last)k.f+=delta;}));layers.forEach(l=>l.cels.forEach(c=>{if(!picked.has(c)&&c.f>last)c.f+=delta;}));}
 items.forEach(a=>{if(a.cel)a.cel.f=map.get(a.cel.f);else if(!a.done){a.key.f=map.get(a.key.f);}});
 tracks.forEach(t=>t.sort((a,b)=>a.f-b.f));layers.forEach(l=>l.cels.sort((a,b)=>a.f-b.f));
 if(S.keys.size)S.keys=new Set(retimeIds(items));
 const sc=cur();let msg=`Spaced ${U.length} keys over ${map.get(last)-first+1} frames.`;if(delta>0&&S.ripple!==false&&last<sc.dur){sc.dur+=delta;msg+=` This cut is now ${sc.dur} frames.`;}
 const maxF=Math.max(...[...map.values()]);if(maxF>=sc.dur){sc.dur=maxF+1;msg=`Spaced ${U.length} keys. This cut is now ${sc.dur} frames.`;}
 S.frame=Math.min(S.frame,sc.dur-1);commit();structure();toast(msg);}
function retimeIds(items){const out=[];items.forEach(a=>{if(a.cel)out.push(celId(a.l,a.cel.f));else for(const p in a.o.tr)if(a.o.tr[p]===a.t)out.push(keyId(a.o,p,a.key.f));});return out;}
function selectAllKeys(){S.keys.clear();const l=layer();if(S.sel.cam){const c=cur().camera;trackNames(c).forEach(p=>c.tr[p].forEach(k=>S.keys.add(keyId(c,p,k.f))));}else if(l){const r={k:'layer',o:l,l};rowTracks(r).forEach(([o,p])=>o.tr[p].forEach(k=>S.keys.add(keyId(o,p,k.f))));(l.cels||[]).forEach(c=>S.keys.add(celId(l,c.f)));}buildInspector();invalidate();toast(`Selected ${S.keys.size} keys.`);}
