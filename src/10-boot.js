/* ---------- boot ---------- */
async function boot(){
 buildTools();buildMenus();
 $('#projName').addEventListener('change',e=>{S.doc.name=e.target.value;commit();});$('#projName').addEventListener('keydown',e=>e.stopPropagation());
 const setView=c=>{S.camView=c;$('#vCam').classList.toggle('on',c);$('#vStage').classList.toggle('on',!c);fitView();};
 $('#vCam').onclick=()=>setView(true);$('#vStage').onclick=()=>setView(false);$('#vCam').classList.add('on');
 $('#btnOnion').onclick=e=>{S.onion=!S.onion;e.target.classList.toggle('on',S.onion);invalidate();};
 const au=$('#btnAuto');au.classList.add('on');au.onclick=()=>{S.autokey=!S.autokey;au.classList.toggle('on',S.autokey);buildOpts();toast(S.autokey?'Auto-key on: changes and strokes record keyframes.':'Auto-key off: strokes edit the held drawing.');};
 $('#btnExport').onclick=openExport;
 const sp=$('#split');sp.addEventListener('pointerdown',e=>{sp.setPointerCapture(e.pointerId);const y=e.clientY,h=$('#tl').getBoundingClientRect().height;const mv=m=>{document.documentElement.style.setProperty('--tlh',clamp(h+y-m.clientY,150,innerHeight-220)+'px');onResize();};const up=()=>{sp.removeEventListener('pointermove',mv);sp.removeEventListener('pointerup',up);onResize(true);};sp.addEventListener('pointermove',mv);sp.addEventListener('pointerup',up);});
 const onResize=(f)=>{resizeStage(f===true);sizeGrid();invalidate();};
 new ResizeObserver(()=>onResize(true)).observe(box);new ResizeObserver(()=>{sizeGrid();invalidate();}).observe($('#gridWrap'));
 document.fonts&&document.fonts.ready.then(()=>{invalidate();scheduleThumbs();});
 await Promise.all(FONTS.map(f=>document.fonts.load(`40px "${f}"`,'あA').catch(()=>{})));
 const opened=await Store.open();
 const saved=opened&&await Store.restore();
 S.doc=saved||sampleDoc();
 sizeGrid();resizeStage(false);
 loadDoc(S.doc,!saved);
 if(saved)toast('Restored your last session from this browser.');
 else{S.si=1;S.frame=66;S.layerId=null;const r=cur().layers.find(l=>l.type==='rig');S.layerId=r.id;S.tool='pose';buildTools();buildTransport();structure();}
 fitView();
 setInterval(()=>{if(S.lasso&&!S.playing)invalidate();},120);
 addEventListener('beforeunload',()=>{Store.flush();});
 window.__genga={S,Hist,Bitmaps,Sounds,Tools,renderProject,renderVideo,M,rigPose,meshPositions,buildMesh,autoWeights,invalidate,structure,commit};
}
boot();
