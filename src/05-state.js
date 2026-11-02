/* ---------- app state ---------- */
const FONTS=['Shippori Mincho','Noto Serif JP','Dela Gothic One','Reggae One','Yuji Syuku','Zen Maru Gothic','Zen Kaku Gothic New','Noto Sans JP'];
const FONT_STACK=f=>`"${f}","Noto Sans JP",serif`;
const S={doc:null,si:0,frame:0,layerId:null,tool:'select',autokey:true,playing:false,playAll:false,loop:true,onion:false,onionN:2,onionGap:2,camView:true,view:{z:.5,x:0,y:0},
 brush:{size:7,opacity:1,color:'#35222e',smooth:.45,taper:true},celStart:'copy',eraser:{size:30},shapeFill:false,fillGap:2,
 sel:{cam:false,boneId:null,partId:null},keys:new Set(),setup:false,ik:true,ikLen:2,pins:new Set(),brushR:70,weightAmt:.12,lasso:null,tl:{ppf:9,sx:0,sy:0},rowOpen:{},isSample:false};
let Live=null;
const cur=()=>S.doc.scenes[S.si];
const layer=()=>cur().layers.find(l=>l.id===S.layerId)||null;
const bone=()=>{const l=layer();return l&&l.rig?l.rig.bones.find(b=>b.id===S.sel.boneId)||null:null;};
const part=()=>{const l=layer();return l&&l.rig?l.rig.parts.find(p=>p.id===S.sel.partId)||null:null;};
const dpr=()=>Math.min(window.devicePixelRatio||1,2);
function toast(msg,ms=2600){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),ms);}
function writeProp(o,p,v){
 if(!hasTrack(o,p)&&!S.autokey){o.p[p]=v;return;}
 if(!hasTrack(o,p)&&S.frame>0){const start=o.p[p]==null&&Array.isArray(v)?new Array(v.length).fill(0):o.p[p];if(start!=null)setKey(o,p,0,Array.isArray(start)?start.slice():start);}
 setKey(o,p,S.frame,v);
}
/* ---------- undo: the doc is plain JSON, bitmaps are immutable and addressed by id ---------- */
const Hist={st:[],i:-1,reset(){this.st=[JSON.stringify(S.doc)];this.i=0;},
 commit(){const s=JSON.stringify(S.doc);if(s===this.st[this.i])return;this.st.length=this.i+1;this.st.push(s);if(this.st.length>70)this.st.shift();this.i=this.st.length-1;Store.touch();},
 go(d){const n=this.i+d;if(n<0||n>=this.st.length)return;this.i=n;S.doc=JSON.parse(this.st[n]);S.si=clamp(S.si,0,S.doc.scenes.length-1);S.frame=clamp(S.frame,0,cur().dur-1);S.keys.clear();structure();Store.touch();}};
const commit=()=>{Hist.commit();invalidate();};
/* ---------- redraw scheduling ---------- */
let needPaint=false,needThumb=false;
function invalidate(){if(!S.doc)return;if(!needPaint){needPaint=true;requestAnimationFrame(()=>{needPaint=false;paintStage();drawGrid();syncInspector();});}}
function structure(){buildRows();buildInspector();buildCuts();buildOpts();syncDur();invalidate();}
function setFrame(f){S.frame=clamp(Math.round(f),0,cur().dur-1);invalidate();}
function selectLayer(id,keep){S.layerId=id;if(!keep){S.sel.boneId=null;S.sel.partId=null;S.sel.cam=false;S.lasso=null;}const l=layer();if(!l||l.type!=='rig')S.setup=false;buildRows();buildInspector();buildOpts();invalidate();}
function addLayer(l,sc=cur()){const i=sc.layers.findIndex(x=>x.id===S.layerId);sc.layers.splice(i>=0?i+1:sc.layers.length,0,l);S.layerId=l.id;S.sel.boneId=S.sel.partId=null;S.sel.cam=false;}
function removeLayer(id){const sc=cur(),i=sc.layers.findIndex(l=>l.id===id);if(i<0)return;sc.layers.forEach(l=>{if(l.parent===id)l.parent=null;});sc.layers.splice(i,1);S.layerId=sc.layers[Math.min(i,sc.layers.length-1)]?.id||null;structure();commit();}
function selectedOwners(){
 const l=layer();if(S.sel.cam)return[{o:cur().camera,ps:['x','y','zoom','rot']}];
 if(!l)return[];const b=bone(),p=part();
 if(b)return[{o:b,ps:['rot','x','y','sx','sy']}];
 if(p)return[{o:p,ps:['opacity','swap']}];
 return[{o:l,ps:['x','y','rot','sx','sy','opacity']}];
}
function keyHere(){
 const l=layer();
 if(l&&l.type==='draw'&&!S.sel.cam){newCel(true);return;}
 for(const{o,ps}of selectedOwners())for(const p of ps){if(o.p[p]==null)continue;setKey(o,p,S.frame,val(o,p,S.frame));}
 commit();
}
function newCel(dup){
 const l=layer();if(!l||l.type!=='draw')return toast('Select a drawing layer first.');
 const F=S.frame,c=celAt(l,F),at=l.cels.find(x=>x.f===F);
 if(at){if(!dup){at.a=null;commit();}else toast('This frame already has a drawing.');return;}
 const n={f:F,a:dup&&c?c.a:null,x:dup&&c?c.x:0,y:dup&&c?c.y:0};l.cels.push(n);l.cels.sort((a,b)=>a.f-b.f);commit();
}
function holdFrames(d){const l=layer();if(!l||l.type!=='draw')return;const F=S.frame;
 if(d<0){const c=celAt(l,F),nx=l.cels.find(x=>x.f>F);if(!nx||nx.f-1<=(c?c.f:-1))return;}
 l.cels.forEach(c=>{if(c.f>F)c.f+=d;});commit();}
