/* ---------- stage ---------- */
const box=$('#stageBox'),compC=$('#comp'),overC=$('#over'),cx=compC.getContext('2d'),ox=overC.getContext('2d');
function resizeStage(fit){const r=box.getBoundingClientRect(),D=dpr();compC.width=overC.width=Math.max(2,r.width*D|0);compC.height=overC.height=Math.max(2,r.height*D|0);if(fit)fitView();invalidate();}
function fitView(){if(!S.doc)return;const r=box.getBoundingClientRect(),d=S.doc;const k=S.camView?1:1.45,z=Math.min((r.width-24)/(d.w*k),(r.height-24)/(d.h*k));S.view.z=z;S.view.x=(r.width-d.w*z)/2;S.view.y=(r.height-d.h*z)/2;invalidate();}
const baseM=()=>{const D=dpr(),v=S.view;return[v.z*D,0,0,v.z*D,v.x*D,v.y*D];};
function curMat(l){const sc=cur(),F=stepF(l,S.frame);return layerMatrix(l,sc,F,baseM(),S.camView,camState(sc,S.frame));}
function paintStage(){
 const d=S.doc,w=compC.width,h=compC.height,base=baseM();
 cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#15171f';cx.fillRect(0,0,w,h);
 cx.save();cx.setTransform(...base);cx.shadowColor='rgba(255,217,140,.28)';cx.shadowBlur=46;cx.fillStyle='#000';cx.fillRect(0,0,d.w,d.h);cx.restore();
 const l=layer();
 const o={base,useCam:S.camView,clip:S.camView,live:Live,setup:S.setup&&l?l.id:null,onion:S.onion&&l&&!S.playing&&!S.sel.cam?{layer:l.id,n:S.onionN,gap:S.onionGap}:null};
 if(S.playing&&S.playAll)renderProject(cx,sceneStart(S.si)+S.frame,o);else renderScene(cx,cur(),S.frame,o);
 drawOverlay();
 const sec=Math.floor(S.frame/d.fps);$('#hud').textContent=`${(S.view.z*100|0)}%  ${d.w}×${d.h}  ${d.fps} fps`;
}
const OV={blue:'#57b6ff',red:'#ff6a5c',glow:'#ffd98c',green:'#6fd3a4'};
function poly(pts,close=true){ox.beginPath();pts.forEach((p,i)=>i?ox.lineTo(p[0],p[1]):ox.moveTo(p[0],p[1]));if(close)ox.closePath();}
function layerBounds(l){const d=S.doc,F=stepF(l,S.frame);
 if(l.type==='image'){const b=Bitmaps.get(l.asset);return b?[0,0,b.w,b.h]:null;}
 if(l.type==='solid')return[0,0,d.w,d.h];
 if(l.type==='text')return textBounds(l);
 if(l.type==='draw'){const c=celAt(l,F),b=c&&c.a&&Bitmaps.get(c.a);return b?[c.x,c.y,b.w,b.h]:null;}
 if(l.type==='rig'&&l.rig.parts.length){let a=1e9,b=1e9,c=-1e9,e=-1e9;l.rig.parts.forEach(p=>{a=Math.min(a,p.x);b=Math.min(b,p.y);c=Math.max(c,p.x+p.w);e=Math.max(e,p.y+p.h);});return[a,b,c-a,e-b];}
 return null;}
function boxPts(m,b){return[[b[0],b[1]],[b[0]+b[2],b[1]],[b[0]+b[2],b[1]+b[3]],[b[0],b[1]+b[3]]].map(p=>M.ap(m,p[0],p[1]));}
function selHandles(l){const b=layerBounds(l);if(!b)return null;const m=curMat(l),q=boxPts(m,b),top=[(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2],c=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2],dx=top[0]-c[0],dy=top[1]-c[1],L=Math.hypot(dx,dy)||1,D=dpr();
 return{q,rot:[top[0]+dx/L*26*D,top[1]+dy/L*26*D],top};}
const RIG_TOOLS=new Set(['bone','pose','deform','weight']);
function drawOverlay(){
 const D=dpr(),l=layer();ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,overC.width,overC.height);
 if(S.playing)return;ox.lineWidth=1*D;
 const d=S.doc,base=baseM();
 if(!S.camView){
  poly(boxPts(base,[0,0,d.w,d.h]));ox.setLineDash([5*D,4*D]);ox.strokeStyle='#666c80';ox.stroke();ox.setLineDash([]);
  const cam=camState(cur(),S.frame),im=M.inv(camMatrix(cam,1,d.w,d.h)),q=boxPts(M.mul(base,im),[0,0,d.w,d.h]);poly(q);ox.lineWidth=2*D;ox.strokeStyle=OV.glow;ox.stroke();ox.lineWidth=D;ox.fillStyle=OV.glow;ox.font=`${11*D}px DM Mono,monospace`;ox.fillText('CAMERA',q[0][0]+4*D,q[0][1]-5*D);
 }
 if(!l)return;
 if(S.tool==='select'&&!(S.setup&&l.type==='rig')&&!S.sel.cam&&l.type!=='fx'){const h=selHandles(l);if(h){poly(h.q);ox.strokeStyle=OV.blue;ox.stroke();ox.fillStyle='#fff';h.q.forEach(p=>{ox.fillRect(p[0]-4*D,p[1]-4*D,8*D,8*D);ox.strokeRect(p[0]-4*D,p[1]-4*D,8*D,8*D);});ox.beginPath();ox.moveTo(...h.top);ox.lineTo(...h.rot);ox.stroke();ox.beginPath();ox.arc(h.rot[0],h.rot[1],5*D,0,7);ox.fill();ox.stroke();}}
 if(l.type==='rig'){
  const m=curMat(l),rig=l.rig,pose=rigPose(rig,stepF(l,S.frame),S.setup);
  const p=part();
  if(S.setup&&S.tool==='select'&&p){poly(boxPts(m,[p.x,p.y,p.w,p.h]));ox.strokeStyle=OV.glow;ox.stroke();}
  if(p&&p.mesh&&(S.tool==='deform'||S.tool==='weight'||S.showMesh)){
   const pos=meshPositions(p,pose,S.frame,S.setup),ms=p.mesh,P=i=>M.ap(m,pos[i*2],pos[i*2+1]);
   ox.strokeStyle='rgba(87,182,255,.55)';ox.lineWidth=D*.7;ox.beginPath();
   for(let i=0;i<ms.t.length;i+=3){const a=P(ms.t[i]),b=P(ms.t[i+1]),c=P(ms.t[i+2]);ox.moveTo(...a);ox.lineTo(...b);ox.lineTo(...c);ox.closePath();}ox.stroke();
   if(S.tool==='weight'&&S.sel.boneId){const j=ms.bn.indexOf(S.sel.boneId);for(let i=0;i<pos.length/2;i++){let w=0;if(j>=0)for(let k=0;k<4;k++)if(ms.wi[i*4+k]===j)w+=ms.ww[i*4+k];const q=P(i);ox.fillStyle=`hsl(${(1-w)*230},90%,${w?55:30}%)`;ox.beginPath();ox.arc(q[0],q[1],2.8*D,0,7);ox.fill();}}
  }
  if(RIG_TOOLS.has(S.tool)||S.setup){
   for(const b of rig.bones){const h=M.ap(m,...boneHead(pose,b)),t=M.ap(m,...boneTip(pose,b)),dx=t[0]-h[0],dy=t[1]-h[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,wd=Math.min(9*D,L*.18),mx=h[0]+dx*.18,my=h[1]+dy*.18;
    const sel=b.id===S.sel.boneId,keyed=['rot','x','y','sx','sy'].some(k=>hasTrack(b,k)&&b.tr[k].some(q=>q.f===S.frame));
    poly([h,[mx+nx*wd,my+ny*wd],t,[mx-nx*wd,my-ny*wd]]);ox.fillStyle=sel?'rgba(255,217,140,.55)':keyed?'rgba(255,106,92,.42)':'rgba(87,182,255,.32)';ox.fill();ox.strokeStyle=sel?OV.glow:keyed?OV.red:OV.blue;ox.lineWidth=D;ox.stroke();
    ox.beginPath();ox.arc(h[0],h[1],3.5*D,0,7);ox.fillStyle=ox.strokeStyle;ox.fill();
    ox.beginPath();ox.arc(t[0],t[1],S.pins.has(b.id)?6*D:3*D,0,7);ox.fillStyle=S.pins.has(b.id)?OV.red:'#fff';ox.fill();ox.stroke();}
  }
 }
 if(S.tool==='bone'&&Ptr.drag&&Ptr.drag.head){const m=curMat(l),a=M.ap(m,...Ptr.drag.head),b=M.ap(m,...Ptr.drag.tip);ox.strokeStyle=OV.glow;ox.lineWidth=3*D;ox.beginPath();ox.moveTo(...a);ox.lineTo(...b);ox.stroke();}
 if(S.lasso&&S.lasso.pts.length>1){const m=curMat(l);poly(S.lasso.pts.map(p=>M.ap(m,p[0],p[1])),S.lasso.closed);ox.strokeStyle='#000';ox.lineWidth=D*2;ox.stroke();ox.setLineDash([6*D,5*D]);ox.lineDashOffset=-(performance.now()/40%22);ox.strokeStyle='#fff';ox.lineWidth=D;ox.stroke();ox.setLineDash([]);}
 if(Ptr.x!=null){const z=S.view.z*D,sc=l?M.scale(curMat(l)):z;let r=0;
  if(S.tool==='brush')r=S.brush.size/2*sc;else if(S.tool==='eraser')r=S.eraser.size/2*sc;else if(S.tool==='deform'||S.tool==='weight')r=S.brushR*D;
  if(r){ox.beginPath();ox.arc(Ptr.x,Ptr.y,Math.max(r,1),0,7);ox.strokeStyle='rgba(0,0,0,.6)';ox.lineWidth=D*2;ox.stroke();ox.strokeStyle='#fff';ox.lineWidth=D;ox.stroke();}}
}
/* ---------- pointer routing ---------- */
const Ptr={x:null,y:null,down:false,drag:null,space:false};
const evPt=(e)=>{const r=overC.getBoundingClientRect(),D=dpr();return[(e.clientX-r.left)*D,(e.clientY-r.top)*D];};
const toLocal=(l,p)=>M.ap(M.inv(curMat(l)),p[0],p[1]);
overC.addEventListener('contextmenu',e=>e.preventDefault());
overC.addEventListener('pointerdown',e=>{
 if(S.playing)stopPlay();overC.setPointerCapture(e.pointerId);const p=evPt(e);Ptr.down=true;Ptr.x=p[0];Ptr.y=p[1];
 if(e.button===1||Ptr.space||S.tool==='hand'){Ptr.drag={pan:1,sx:e.clientX,sy:e.clientY,vx:S.view.x,vy:S.view.y};return;}
 if(e.button===2)return;
 const t=Tools[S.tool];t&&t.down&&t.down(p,e);invalidate();});
overC.addEventListener('pointermove',e=>{
 const p=evPt(e);Ptr.x=p[0];Ptr.y=p[1];
 if(Ptr.drag&&Ptr.drag.pan){S.view.x=Ptr.drag.vx+e.clientX-Ptr.drag.sx;S.view.y=Ptr.drag.vy+e.clientY-Ptr.drag.sy;invalidate();return;}
 const t=Tools[S.tool];
 if(Ptr.down&&t&&t.move){const ev=e.getCoalescedEvents?e.getCoalescedEvents():[];if(S.tool==='brush'||S.tool==='eraser'){(ev.length?ev:[e]).forEach(c=>t.move(evPt(c),c));}else t.move(p,e);}
 invalidate();});
const endPtr=e=>{if(!Ptr.down)return;Ptr.down=false;if(Ptr.drag&&Ptr.drag.pan){Ptr.drag=null;return;}const t=Tools[S.tool];t&&t.up&&t.up(evPt(e),e);Ptr.drag=null;invalidate();};
overC.addEventListener('pointerup',endPtr);overC.addEventListener('pointercancel',endPtr);
overC.addEventListener('pointerleave',()=>{if(!Ptr.down){Ptr.x=null;invalidate();}});
box.addEventListener('wheel',e=>{e.preventDefault();const r=box.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,k=Math.exp(-e.deltaY*.0015),z=clamp(S.view.z*k,.05,8),q=z/S.view.z;S.view.x=mx-(mx-S.view.x)*q;S.view.y=my-(my-S.view.y)*q;S.view.z=z;invalidate();},{passive:false});
/* ---------- drawing ---------- */
function ensureDrawLayer(){let l=layer();if(!l||l.type!=='draw'){l=newLayer('draw','Drawing',{cels:[]});l.p.x=S.doc.w/2;l.p.y=S.doc.h/2;l.p.ax=S.doc.w/2;l.p.ay=S.doc.h/2;addLayer(l);structure();toast('Added a new drawing layer.');}
 if(l.lock){toast('This layer is locked. Unlock it to draw.');return null;}return l;}
function beginLive(l){
 const d=S.doc,w=d.w*2,h=d.h*2,o=-d.w/2,q=-d.h/2,F=stepF(l,S.frame);let c=celAt(l,F);
 if(!c){c={f:S.frame,a:null,x:0,y:0};l.cels.push(c);l.cels.sort((a,b)=>a.f-b.f);}
 const base=Pool.get(w,h),stroke=Pool.get(w,h);const b=c.a&&Bitmaps.get(c.a);
 if(b)base.getContext('2d').drawImage(b.canvas,c.x-o,c.y-q);
 Live={layer:l.id,base,stroke,ox:o,oy:q,alpha:1,cel:c,dirty:b?[c.x-o,c.y-q,c.x-o+b.w,c.y-q+b.h]:null};return Live;}
function grow(L,x0,y0,x1,y1){const r=L.dirty;if(!r)L.dirty=[x0,y0,x1,y1];else{r[0]=Math.min(r[0],x0);r[1]=Math.min(r[1],y0);r[2]=Math.max(r[2],x1);r[3]=Math.max(r[3],y1);}}
function endLive(){
 const L=Live;if(!L)return;const bx=L.base.getContext('2d');bx.globalAlpha=L.alpha;bx.drawImage(L.stroke,0,0);bx.globalAlpha=1;
 if(L.dirty){const pad=2,x0=clamp(Math.floor(L.dirty[0])-pad,0,L.base.width),y0=clamp(Math.floor(L.dirty[1])-pad,0,L.base.height),x1=clamp(Math.ceil(L.dirty[2])+pad,0,L.base.width),y1=clamp(Math.ceil(L.dirty[3])+pad,0,L.base.height);
  if(x1>x0&&y1>y0){const n=mkCanvas(x1-x0,y1-y0);n.getContext('2d').drawImage(L.base,x0,y0,x1-x0,y1-y0,0,0,x1-x0,y1-y0);L.cel.a=addBitmap(n);L.cel.x=x0+L.ox;L.cel.y=y0+L.oy;}}
 Pool.put(L.base,L.stroke);Live=null;commit();buildCuts();}
function stampLine(L,g,a,b,ra,rb){const dist=Math.hypot(b[0]-a[0],b[1]-a[1]),step=Math.max(.6,Math.min(ra,rb)*.25),n=Math.max(1,Math.ceil(dist/step));g.beginPath();for(let i=1;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,r=ra+(rb-ra)*t;g.moveTo(x+r,y);g.arc(x,y,r,0,7);}g.fill();const R=Math.max(ra,rb)+2;grow(L,Math.min(a[0],b[0])-R,Math.min(a[1],b[1])-R,Math.max(a[0],b[0])+R,Math.max(a[1],b[1])+R);}
const pressure=(e,dr)=>{if(e.pointerType==='pen'&&e.pressure>0)return Math.pow(e.pressure,1.3);if(!dr)return 1;return dr;};
const Tools={};
const brushDown=erase=>(p,e)=>{const l=ensureDrawLayer();if(!l)return;const L=beginLive(l);L.alpha=erase?1:S.brush.opacity;const g=erase?L.base.getContext('2d'):L.stroke.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation=erase?'destination-out':'source-over';g.fillStyle=erase?'#000':S.brush.color;
 const q=toLocal(l,p),a=[q[0]-L.ox,q[1]-L.oy];const size=erase?S.eraser.size:S.brush.size;const r0=size/2*(e.pointerType==='pen'?pressure(e):S.brush.taper&&!erase?.35:1);
 Ptr.drag={l,g,erase,sm:a.slice(),last:a.slice(),r:r0,size,t:performance.now()};stampLine(L,g,a,[a[0]+.01,a[1]],r0,r0);};
const brushMove=(p,e)=>{const D=Ptr.drag;if(!D||!Live)return;const q=toLocal(D.l,p),raw=[q[0]-Live.ox,q[1]-Live.oy],k=D.erase?1:1-S.brush.smooth*.88;D.sm[0]+=(raw[0]-D.sm[0])*k;D.sm[1]+=(raw[1]-D.sm[1])*k;const dist=Math.hypot(D.sm[0]-D.last[0],D.sm[1]-D.last[1]);if(dist<.5)return;
 let tgt;if(e.pointerType==='pen')tgt=pressure(e);else if(S.brush.taper&&!D.erase){const sp=dist;tgt=clamp(1.15-sp/70,.4,1);}else tgt=1;
 const r1=lerp(D.r,D.size/2*tgt,.3);stampLine(Live,D.g,D.last,D.sm,D.r,r1);D.last=D.sm.slice();D.r=r1;};
Tools.brush={down:brushDown(false),move:brushMove,up(){if(Ptr.drag&&Live){endLive();}}};
Tools.eraser={down:brushDown(true),move:brushMove,up(){if(Ptr.drag&&Live){Ptr.drag.g.globalCompositeOperation='source-over';endLive();}}};
const shapeTool=(paint)=>({down(p){const l=ensureDrawLayer();if(!l)return;const L=beginLive(l);L.alpha=S.brush.opacity;const q=toLocal(l,p);Ptr.drag={l,a:[q[0]-L.ox,q[1]-L.oy]};},
 move(p,e){const D=Ptr.drag;if(!D||!Live)return;const q=toLocal(D.l,p);let b=[q[0]-Live.ox,q[1]-Live.oy];if(e.shiftKey&&S.tool!=='line'){const s=Math.max(Math.abs(b[0]-D.a[0]),Math.abs(b[1]-D.a[1]));b=[D.a[0]+Math.sign(b[0]-D.a[0])*s,D.a[1]+Math.sign(b[1]-D.a[1])*s];}const g=Live.stroke.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,Live.stroke.width,Live.stroke.height);g.strokeStyle=g.fillStyle=S.brush.color;g.lineWidth=S.brush.size;g.lineCap=g.lineJoin='round';g.beginPath();paint(g,D.a,b);if(S.shapeFill&&S.tool!=='line')g.fill();g.stroke();D.b=b;},
 up(){const D=Ptr.drag;if(D&&Live){if(D.b)grow(Live,Math.min(D.a[0],D.b[0])-S.brush.size,Math.min(D.a[1],D.b[1])-S.brush.size,Math.max(D.a[0],D.b[0])+S.brush.size,Math.max(D.a[1],D.b[1])+S.brush.size);endLive();}}});
Tools.line=shapeTool((g,a,b)=>{g.moveTo(...a);g.lineTo(...b);});
Tools.rect=shapeTool((g,a,b)=>g.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]));
Tools.ellipse=shapeTool((g,a,b)=>g.ellipse((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2,Math.abs(b[1]-a[1])/2,0,0,7));
Tools.fill={down(p){const l=ensureDrawLayer();if(!l)return;const L=beginLive(l),q=toLocal(l,p),sx=Math.round(q[0]-L.ox),sy=Math.round(q[1]-L.oy);
 const g=L.base.getContext('2d',{willReadFrequently:true}),W=S.doc.w,H=S.doc.h,x0=-L.ox,y0=-L.oy;
 if(sx<x0||sy<y0||sx>=x0+W||sy>=y0+H){Pool.put(L.base,L.stroke);Live=null;return toast('Click inside the frame to fill.');}
 const px=g.getImageData(x0,y0,W,H).data,wall=new Uint8Array(W*H);for(let i=0;i<W*H;i++)wall[i]=px[i*4+3]>110?1:0;
 const gap=S.fillGap;if(gap>0){for(let k=0;k<gap;k++){const c=wall.slice();for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(!c[i]&&(c[i-1]||c[i+1]||c[i-W]||c[i+W]))wall[i]=1;}}}
 const st=new Int32Array(W*H),mask=new Uint8Array(W*H);let n=0;const s0=(sy-y0)*W+(sx-x0);if(wall[s0]){Pool.put(L.base,L.stroke);Live=null;return toast('That spot is on a line. Click inside the shape.');}
 st[n++]=s0;mask[s0]=1;let minx=W,miny=H,maxx=0,maxy=0;
 while(n){const i=st[--n],x=i%W,y=(i-x)/W;if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
  if(x>0&&!mask[i-1]&&!wall[i-1]){mask[i-1]=1;st[n++]=i-1;}if(x<W-1&&!mask[i+1]&&!wall[i+1]){mask[i+1]=1;st[n++]=i+1;}if(y>0&&!mask[i-W]&&!wall[i-W]){mask[i-W]=1;st[n++]=i-W;}if(y<H-1&&!mask[i+W]&&!wall[i+W]){mask[i+W]=1;st[n++]=i+W;}}
 const mc=mkCanvas(W,H),mg=mc.getContext('2d'),im=mg.createImageData(W,H),col=parseInt(S.brush.color.slice(1),16),r=col>>16,gc=(col>>8)&255,b=col&255;
 for(let i=0;i<W*H;i++)if(mask[i]){im.data[i*4]=r;im.data[i*4+1]=gc;im.data[i*4+2]=b;im.data[i*4+3]=255;}mg.putImageData(im,0,0);
 g.globalCompositeOperation='destination-over';const sp=gap+2;for(const[a,c]of[[0,0],[sp,0],[-sp,0],[0,sp],[0,-sp],[sp*.7,sp*.7],[-sp*.7,sp*.7],[sp*.7,-sp*.7],[-sp*.7,-sp*.7]])g.drawImage(mc,x0+a,y0+c);g.globalCompositeOperation='source-over';
 grow(L,x0+minx-sp-2,y0+miny-sp-2,x0+maxx+sp+3,y0+maxy+sp+3);endLive();}};
Tools.pick={down(p){const c=cx.getImageData(p[0]|0,p[1]|0,1,1).data;S.brush.color='#'+[c[0],c[1],c[2]].map(v=>v.toString(16).padStart(2,'0')).join('');buildOpts();toast('Picked '+S.brush.color);}};
Tools.text={down(p){const m=M.inv(baseM()),q=M.ap(m,p[0],p[1]);const cam=camState(cur(),S.frame);const w=S.camView?M.ap(M.inv(camMatrix(cam,1,S.doc.w,S.doc.h)),q[0],q[1]):q;const l=textLayer('Your words here',w[0],w[1],{align:'left',size:96,color:S.brush.color==='#35222e'?'#ffffff':S.brush.color});l.screen=false;addLayer(l);selectTool('select');structure();commit();setTimeout(()=>{const t=$('#textVal');t&&(t.focus(),t.select());},30);}};
Tools.zoom={down(p,e){const r=box.getBoundingClientRect(),mx=p[0]/dpr(),my=p[1]/dpr(),k=e.altKey?.7:1.4,z=clamp(S.view.z*k,.05,8),q=z/S.view.z;S.view.x=mx-(mx-S.view.x)*q;S.view.y=my-(my-S.view.y)*q;S.view.z=z;}};
Tools.camera={down(p,e){S.sel.cam=true;const c=cur().camera;Ptr.drag={p,x:val(c,'x',S.frame),y:val(c,'y',S.frame),z:val(c,'zoom',S.frame)};buildInspector();buildRows();},
 move(p,e){const D=Ptr.drag;if(!D)return;const c=cur().camera,dz=baseM()[0];if(e.shiftKey){writeProp(c,'zoom',clamp(D.z*Math.exp((D.p[1]-p[1])*.003),.1,10));return;}const k=(S.camView?-1:1)/dz/(S.camView?D.z:1);writeProp(c,'x',D.x+(p[0]-D.p[0])*k);writeProp(c,'y',D.y+(p[1]-D.p[1])*k);},
 up(){commit();}};
/* select / transform */
function pickLayer(p){const sc=cur();for(let i=sc.layers.length-1;i>=0;i--){const l=sc.layers[i];if(!l.vis||l.lock||l.type==='fx'||l.type==='solid')continue;const b=layerBounds(l);if(!b)continue;const q=toLocal(l,p);if(q[0]<b[0]||q[1]<b[1]||q[0]>b[0]+b[2]||q[1]>b[1]+b[3])continue;
  const src=l.type==='image'?Bitmaps.get(l.asset):l.type==='draw'?Bitmaps.get(celAt(l,stepF(l,S.frame))?.a):null;
  if(src&&alphaAt(src,q[0]-b[0],q[1]-b[1])<12)continue;return l;}return null;}
function alphaAt(b,x,y){if(!b.ctx)b.ctx=b.canvas.getContext('2d',{willReadFrequently:true});x|=0;y|=0;if(x<0||y<0||x>=b.w||y>=b.h)return 0;return b.ctx.getImageData(x,y,1,1).data[3];}
function pickPart(l,p){const q=toLocal(l,p);for(let i=l.rig.parts.length-1;i>=0;i--){const t=l.rig.parts[i];if(t.hidden)continue;const b=Bitmaps.get(t.assets[0]);if(q[0]<t.x||q[1]<t.y||q[0]>t.x+t.w||q[1]>t.y+t.h)continue;if(alphaAt(b,q[0]-t.x,q[1]-t.y)>12)return t;}return null;}
Tools.select={
 down(p){const l=layer(),D=dpr();
  if(l&&l.type==='rig'&&S.setup){const t=pickPart(l,p);S.sel.partId=t?t.id:null;S.sel.boneId=null;buildInspector();buildRows();if(t){const q=toLocal(l,p);Ptr.drag={part:t,l,q,x:t.x,y:t.y,v:t.mesh?t.mesh.v.slice():null};}return;}
  if(l&&l.type!=='fx'){const h=selHandles(l);if(h){const near=(a)=>Math.hypot(a[0]-p[0],a[1]-p[1])<9*D;
   const own=layerOwn(l,stepF(l,S.frame)),par=M.mul(curMat(l),M.inv(own)),F=S.frame,pv=M.ap(par,val(l,'x',F),val(l,'y',F));
   if(near(h.rot)){Ptr.drag={l,mode:'rot',pv,r0:val(l,'rot',F),a0:Math.atan2(p[1]-pv[1],p[0]-pv[0])};return;}
   if(h.q.some(near)){Ptr.drag={l,mode:'scale',pv,sx:val(l,'sx',F),sy:val(l,'sy',F),d0:Math.hypot(p[0]-pv[0],p[1]-pv[1])||1};return;}}}
  const hit=pickLayer(p)||(l&&l.type!=='fx'&&(()=>{const b=layerBounds(l);if(!b)return null;const q=toLocal(l,p);return q[0]>=b[0]&&q[1]>=b[1]&&q[0]<=b[0]+b[2]&&q[1]<=b[1]+b[3]?l:null;})());
  if(!hit){return;}
  if(hit.id!==S.layerId||S.sel.cam)selectLayer(hit.id);
  if(hit.lock)return;
  const own=layerOwn(hit,stepF(hit,S.frame)),par=M.inv(M.mul(curMat(hit),M.inv(own))),F=S.frame;
  Ptr.drag={l:hit,mode:'move',par,p0:M.ap(par,p[0],p[1]),x:val(hit,'x',F),y:val(hit,'y',F)};},
 move(p,e){const D=Ptr.drag;if(!D)return;
  if(D.part){const q=toLocal(D.l,p),dx=q[0]-D.q[0],dy=q[1]-D.q[1],t=D.part;t.x=Math.round(D.x+dx);t.y=Math.round(D.y+dy);if(t.mesh)for(let i=0;i<t.mesh.v.length;i+=2){t.mesh.v[i]=D.v[i]+t.x-D.x;t.mesh.v[i+1]=D.v[i+1]+t.y-D.y;}return;}
  const l=D.l;
  if(D.mode==='move'){const q=M.ap(D.par,p[0],p[1]);let dx=q[0]-D.p0[0],dy=q[1]-D.p0[1];if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;}writeProp(l,'x',Math.round((D.x+dx)*10)/10);writeProp(l,'y',Math.round((D.y+dy)*10)/10);}
  if(D.mode==='scale'){const k=Math.hypot(p[0]-D.pv[0],p[1]-D.pv[1])/D.d0;writeProp(l,'sx',+(D.sx*k).toFixed(3));writeProp(l,'sy',+(D.sy*k).toFixed(3));}
  if(D.mode==='rot'){let r=D.r0+(Math.atan2(p[1]-D.pv[1],p[0]-D.pv[0])-D.a0)*180/Math.PI;if(e.shiftKey)r=Math.round(r/15)*15;writeProp(l,'rot',+r.toFixed(2));}},
 up(){if(Ptr.drag){commit();}}};
/* lasso: outline an area, then move it or lift it out into a layer or rig part */
Tools.lasso={down(p){const l=layer();if(!l||!(l.type==='draw'||l.type==='image'))return toast('Select a drawing or image layer to use the lasso.');const q=toLocal(l,p);
  if(S.lasso&&S.lasso.closed&&l.type==='draw'&&inPoly(S.lasso.pts,q)){const ex=lassoExtract(l);if(!ex)return;lassoCut(l);Ptr.drag={float:ex,q,l,c:celAt(l,stepF(l,S.frame)),dx:0,dy:0};return;}
  S.lasso={pts:[q],closed:false};buildOpts();},
 move(p){const l=layer();if(Ptr.drag&&Ptr.drag.float){const q=toLocal(l,p);Ptr.drag.dx=q[0]-Ptr.drag.q[0];Ptr.drag.dy=q[1]-Ptr.drag.q[1];const D=Ptr.drag;const{canvas,x,y}=D.float;if(!Live){beginLive(l);}const g=Live.stroke.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,Live.stroke.width,Live.stroke.height);g.drawImage(canvas,x+D.dx-Live.ox,y+D.dy-Live.oy);return;}
  if(S.lasso&&!S.lasso.closed){const q=toLocal(l,p),a=S.lasso.pts[S.lasso.pts.length-1];if(Math.hypot(q[0]-a[0],q[1]-a[1])>2)S.lasso.pts.push(q);}},
 up(){if(Ptr.drag&&Ptr.drag.float){const D=Ptr.drag;if(Live){grow(Live,D.float.x+D.dx-Live.ox,D.float.y+D.dy-Live.oy,D.float.x+D.dx-Live.ox+D.float.canvas.width,D.float.y+D.dy-Live.oy+D.float.canvas.height);endLive();}S.lasso.pts=S.lasso.pts.map(a=>[a[0]+D.dx,a[1]+D.dy]);return;}
  if(S.lasso&&!S.lasso.closed){if(S.lasso.pts.length<4)S.lasso=null;else S.lasso.closed=true;buildOpts();}}};
function inPoly(ps,q){let c=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
function lassoSrc(l){if(l.type==='image')return{b:Bitmaps.get(l.asset),x:0,y:0};const c=celAt(l,stepF(l,S.frame));return c&&c.a?{b:Bitmaps.get(c.a),x:c.x,y:c.y,c}:null;}
function lassoExtract(l){const s=lassoSrc(l);if(!s||!S.lasso)return null;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;S.lasso.pts.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);});x0=Math.floor(x0);y0=Math.floor(y0);const c=mkCanvas(x1-x0+2,y1-y0+2),g=c.getContext('2d');g.beginPath();S.lasso.pts.forEach((p,i)=>i?g.lineTo(p[0]-x0,p[1]-y0):g.moveTo(p[0]-x0,p[1]-y0));g.closePath();g.clip();g.drawImage(s.b.canvas,s.x-x0,s.y-y0);return{canvas:c,x:x0,y:y0};}
function lassoCut(l){const s=lassoSrc(l);if(!s)return;const c=mkCanvas(s.b.w,s.b.h),g=c.getContext('2d');g.drawImage(s.b.canvas,0,0);g.globalCompositeOperation='destination-out';g.beginPath();S.lasso.pts.forEach((p,i)=>i?g.lineTo(p[0]-s.x,p[1]-s.y):g.moveTo(p[0]-s.x,p[1]-s.y));g.closePath();g.fill();const id=addBitmap(c);if(l.type==='image')l.asset=id;else s.c.a=id;}
function lassoToLayer(){const l=layer(),ex=lassoExtract(l);if(!ex)return;const{x:ax,y:ay}=l.p;lassoCut(l);const n=newLayer('draw','Cut-out',{cels:[{f:0,a:addBitmap(ex.canvas),x:ex.x,y:ex.y}]});n.p=JSON.parse(JSON.stringify(l.p));n.tr=JSON.parse(JSON.stringify(l.tr));S.lasso=null;addLayer(n);structure();commit();toast('Moved the selection to a new layer.');}
function targetRig(){const sc=cur();let r=[...sc.layers].reverse().find(l=>l.type==='rig');if(!r){r=newLayer('rig','Character rig',{rig:{bones:[],parts:[]}});addLayer(r);}return r;}
function lassoToPart(){const l=layer(),ex=lassoExtract(l);if(!ex)return;lassoCut(l);const own=layerOwn(l,S.frame),q=M.ap(own,ex.x,ex.y);const r=targetRig();const t=newPart('Part '+(r.rig.parts.length+1),addBitmap(ex.canvas),Math.round(q[0]),Math.round(q[1]));r.rig.parts.push(t);S.lasso=null;commit();structure();toast(`Added "${t.name}" to ${r.name}.`);}
function layerToPart(){const l=layer();const b=layerBounds(l);if(!b)return toast('This layer has nothing drawn on this frame.');const src=l.type==='image'?Bitmaps.get(l.asset):Bitmaps.get(celAt(l,stepF(l,S.frame)).a);const own=layerOwn(l,S.frame),q=M.ap(own,b[0],b[1]);const name=l.name,id=l.id;const r=targetRig();r.rig.parts.push(newPart(name,l.type==='image'?l.asset:celAt(l,stepF(l,S.frame)).a,Math.round(q[0]),Math.round(q[1])));cur().layers=cur().layers.filter(x=>x.id!==id);S.layerId=r.id;structure();commit();toast(`Moved "${name}" into ${r.name}.`);}
/* ---------- rig tools ---------- */
const rigLayer=()=>{const l=layer();return l&&l.type==='rig'?l:null;};
function rigPts(l){const m=curMat(l),pose=rigPose(l.rig,stepF(l,S.frame),S.setup);return{m,pose,items:l.rig.bones.map(b=>({b,h:M.ap(m,...boneHead(pose,b)),t:M.ap(m,...boneTip(pose,b))}))};}
function pickBone(l,p){const D=dpr(),{items}=rigPts(l);let best=null,bd=1e9;for(const it of items){const dt=Math.hypot(it.t[0]-p[0],it.t[1]-p[1]),dh=Math.hypot(it.h[0]-p[0],it.h[1]-p[1]),ds=segDist(p[0],p[1],it.h[0],it.h[1],it.t[0],it.t[1]);
  if(dt<10*D&&dt<bd){best={b:it.b,zone:'tip'};bd=dt-2;}else if(dh<8*D&&dh<bd){best={b:it.b,zone:'head'};bd=dh-1;}else if(ds<9*D&&ds<bd){best={b:it.b,zone:'body'};bd=ds;}}return best;}
Tools.bone={down(p){const l=rigLayer();if(!l)return toast('Select or add a rig layer first (Add > Empty rig).');const q=toLocal(l,p),hit=pickBone(l,p);
  if(hit&&hit.zone==='body'){S.sel.boneId=hit.b.id;S.sel.partId=null;buildInspector();buildRows();return;}
  let parent=bone(),head=q;if(hit&&hit.zone==='tip'){parent=hit.b;const pose=rigPose(l.rig,0,true);head=boneTip(pose,hit.b);}
  Ptr.drag={l,parent,head,tip:q};},
 move(p){if(!Ptr.drag)return;const D=Ptr.drag;D.tip=toLocal(D.l,p);const g=ox;},
 up(){const D=Ptr.drag;if(!D)return;const{l,parent,head,tip}=D,len=Math.hypot(tip[0]-head[0],tip[1]-head[1]);if(len<8)return;const pose=rigPose(l.rig,0,true),pm=parent?pose[parent.id].m:M.id(),a=M.ap(M.inv(pm),head[0],head[1]),w=Math.atan2(tip[1]-head[1],tip[0]-head[0])*180/Math.PI,pr=Math.atan2(pm[1],pm[0])*180/Math.PI;const b=newBone('Bone '+(l.rig.bones.length+1),parent?parent.id:null,+a[0].toFixed(1),+a[1].toFixed(1),+(w-pr).toFixed(2),+len.toFixed(1));l.rig.bones.push(b);S.sel.boneId=b.id;commit();structure();}};
Tools.pose={down(p,e){const l=rigLayer();if(!l)return toast('Select a rig layer to pose it.');const hit=pickBone(l,p);if(!hit){S.sel.boneId=null;buildInspector();buildRows();return;}
  S.sel.boneId=hit.b.id;S.sel.partId=null;S.sel.cam=false;buildInspector();buildRows();const b=hit.b,f=S.frame,q=toLocal(l,p),pose=rigPose(l.rig,stepF(l,f),S.setup),h=boneHead(pose,b);
  const pins=[...S.pins].map(id=>l.rig.bones.find(x=>x.id===id)).filter(Boolean).map(x=>({x,tip:boneTip(pose,x)}));
  if(S.setup){Ptr.drag={l,b,mode:hit.zone==='head'?'restMove':'restTip',q,x:b.x,y:b.y};return;}
  let mode='rot';if(e.shiftKey||(hit.zone==='head'&&!b.parent))mode='move';else if(hit.zone==='tip'&&S.ik&&b.parent)mode='ik';
  const pm=b.parent?pose[b.parent].m:M.id();
  Ptr.drag={l,b,mode,q,h,a0:Math.atan2(q[1]-h[1],q[0]-h[0]),r0:val(b,'rot',f),x:val(b,'x',f),y:val(b,'y',f),ipm:M.inv([pm[0],pm[1],pm[2],pm[3],0,0]),pins};},
 move(p,e){const D=Ptr.drag;if(!D)return;const{l,b,q}=D,n=toLocal(l,p),f=S.frame;
  if(D.mode==='restMove'){const pose=rigPose(l.rig,0,true),pm=b.parent?pose[b.parent].m:M.id(),a=M.ap(M.inv(pm),n[0],n[1]);b.x=+a[0].toFixed(1);b.y=+a[1].toFixed(1);return;}
  if(D.mode==='restTip'){const pose=rigPose(l.rig,0,true),h=boneHead(pose,b),pm=b.parent?pose[b.parent].m:M.id(),pr=Math.atan2(pm[1],pm[0])*180/Math.PI;b.rot=+(Math.atan2(n[1]-h[1],n[0]-h[0])*180/Math.PI-pr).toFixed(2);b.len=Math.max(4,+Math.hypot(n[0]-h[0],n[1]-h[1]).toFixed(1));return;}
  if(D.mode==='rot'){let r=D.r0+(Math.atan2(n[1]-D.h[1],n[0]-D.h[0])-D.a0)*180/Math.PI;writeProp(b,'rot',+r.toFixed(2));}
  if(D.mode==='move'){const a=M.ap(D.ipm,n[0]-q[0],n[1]-q[1]);writeProp(b,'x',+(D.x+a[0]).toFixed(1));writeProp(b,'y',+(D.y+a[1]).toFixed(1));}
  if(D.mode==='ik'){const chain=ikChain(l.rig,b,S.ikLen),ov=solveIK(l.rig,chain,n,f);chain.forEach(c=>writeProp(c,'rot',+ov[c.id].rot.toFixed(2)));}
  for(const pin of D.pins){if(pin.x===b)continue;const chain=ikChain(l.rig,pin.x,2);if(chain.includes(b))continue;const ov=solveIK(l.rig,chain,pin.tip,f);chain.forEach(c=>writeProp(c,'rot',+ov[c.id].rot.toFixed(2)));}},
 up(){if(Ptr.drag)commit();}};
function brushVerts(l,t,p){const pose=rigPose(l.rig,stepF(l,S.frame),S.setup),pos=meshPositions(t,pose,S.frame,S.setup),m=curMat(l),R=S.brushR*dpr(),hits=[];for(let i=0;i<pos.length/2;i++){const q=M.ap(m,pos[i*2],pos[i*2+1]),d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<R){const u=1-d/R;hits.push([i,u*u*(3-2*u)]);}}return{hits,pose};}
function partForBrush(l,p){let t=part();if(!t||!t.mesh){const h=pickPart(l,p);if(h){S.sel.partId=h.id;S.sel.boneId=S.tool==='weight'?S.sel.boneId:null;buildInspector();buildRows();t=h;}}if(t&&!t.mesh){buildMesh(t);t.bone?rigidWeights(t):rigidWeights(t);buildInspector();toast('Added a mesh to '+t.name+'.');}return t&&t.mesh?t:null;}
Tools.deform={down(p){const l=rigLayer();if(!l)return toast('Select a rig layer and a part to deform.');if(S.setup)return toast('Switch to Animate to deform. Deforms are keyframed.');const t=partForBrush(l,p);if(!t)return;const n=t.mesh.v.length,cur0=val(t,'deform',S.frame);Ptr.drag={l,t,p,arr:(cur0&&cur0.length===n?cur0:new Array(n).fill(0)).slice()};},
 move(p){const D=Ptr.drag;if(!D)return;const{l,t,arr}=D,a=toLocal(l,D.p),b=toLocal(l,p),{hits,pose}=brushVerts(l,t,p);D.p=p;const dx=b[0]-a[0],dy=b[1]-a[1],ms=t.mesh;
  for(const[i,u]of hits){let bi=0,bw=0;for(let k=0;k<4;k++)if(ms.ww[i*4+k]>bw){bw=ms.ww[i*4+k];bi=ms.wi[i*4+k];}const sk=pose[ms.bn[bi]]?pose[ms.bn[bi]].skin:M.id(),v=M.ap(M.inv([sk[0],sk[1],sk[2],sk[3],0,0]),dx,dy);arr[i*2]=+(arr[i*2]+v[0]*u).toFixed(1);arr[i*2+1]=+(arr[i*2+1]+v[1]*u).toFixed(1);}
  writeProp(t,'deform',arr.slice());if(!S.autokey&&!hasTrack(t,'deform'))t.p.deform=arr.slice();},
 up(){if(Ptr.drag)commit();}};
Tools.weight={down(p,e){const l=rigLayer();if(!l)return toast('Select a rig layer to paint weights.');if(!S.sel.boneId)return toast('Pick a bone in the panel first. Paint adds that bone\'s pull.');const t=partForBrush(l,p);if(!t)return;t.painted=true;if(!t.mesh.bn.includes(S.sel.boneId))t.mesh.bn.push(S.sel.boneId);Ptr.drag={l,t};Tools.weight.move(p,e);},
 move(p,e){const D=Ptr.drag;if(!D)return;const ms=D.t.mesh,j=ms.bn.indexOf(S.sel.boneId),{hits}=brushVerts(D.l,D.t,p),s=e.altKey?-1:1;
  for(const[i,u]of hits){let k=-1,lo=0;for(let a=0;a<4;a++){if(ms.wi[i*4+a]===j&&ms.ww[i*4+a]>0)k=a;if(ms.ww[i*4+a]<ms.ww[i*4+lo])lo=a;}if(k<0){if(s<0)continue;k=lo;ms.wi[i*4+k]=j;ms.ww[i*4+k]=0;}ms.ww[i*4+k]=clamp(ms.ww[i*4+k]+s*S.weightAmt*u,0,1);let sum=0;for(let a=0;a<4;a++)sum+=ms.ww[i*4+a];if(sum>0)for(let a=0;a<4;a++)ms.ww[i*4+a]=+(ms.ww[i*4+a]/sum).toFixed(3);}},
 up(){if(Ptr.drag)commit();}};
