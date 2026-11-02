/* ---------- tool strip and option bar ---------- */
const I=(d)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const TOOLS=[
 ['select','Select / move (V)','v','<path d="M5 3l14 9-6.5 1.2L9 20z"/>'],['camera','Camera: drag to pan, Shift+drag to zoom (C)','c','<rect x="3" y="7" width="13" height="11" rx="1"/><path d="M16 11l5-3v9l-5-3"/>'],'-',
 ['brush','Brush, pressure-sensitive (B)','b','<path d="M4 20c3 0 5-1 5.5-3.5S13 12 20 4c-7 3-11 7-12.500 9.500S6 17 4 20z"/>'],['eraser','Eraser (E)','e','<path d="M8 19h12M5 15l9-10 6 5-9 9H8z"/>'],['fill','Fill closed shapes (G)','g','<path d="M12 3l8 8-7 8-8-8zM19 16s2 2.500 2 4a2 2 0 01-4 0c0-1.500 2-4 2-4z"/>'],['line','Line (L)','l','<path d="M5 19L19 5"/>'],['rect','Rectangle (U)','u','<rect x="4" y="6" width="16" height="12"/>'],['ellipse','Ellipse (O)','o','<ellipse cx="12" cy="12" rx="9" ry="7"/>'],['pick','Eyedropper (I)','i','<path d="M14 6l4 4M5 19l1-4 8-8 3 3-8 8z"/>'],['lasso','Lasso: move an area or lift it into a rig part (A)','a','<path d="M12 4c5 0 9 2.500 9 6s-4 6-9 6-9-2.500-9-6 4-6 9-6zM7 15c-1 2 0 4 2 5"/>'],['text','Text (T)','t','<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'],'-',
 ['bone','Bone: drag to draw a bone, start on a tip to chain (J)','j','<path d="M6 18L18 6M18 6a2 2 0 112-2 2 2 0 11-2 2zM6 18a2 2 0 11-2 2 2 2 0 112-2z"/>'],['pose','Pose bones: drag to rotate, tip for IK, Shift to move (P)','p','<circle cx="12" cy="5" r="2"/><path d="M12 7v7M12 14l-4 6M12 14l4 6M6 10l6-1 6-1"/>'],['deform','Deform mesh with a soft brush (D)','d','<path d="M3 8c4-3 6 3 9 0s5-3 9 0M3 16c4-3 6 3 9 0s5-3 9 0M8 4v16M16 4v16"/>'],['weight','Paint bone weights (W), Alt removes','w','<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 010 16z" fill="currentColor"/>'],'-',
 ['hand','Pan view (H, or hold Space)','h','<path d="M8 12V6a1.500 1.500 0 013 0v5V4.500a1.500 1.500 0 013 0V11V6a1.500 1.500 0 013 0v9c0 3-2 6-6 6-3 0-4-1-6-5l-2-3c-1-2 1-3 2-2z"/>'],['zoom','Zoom, Alt zooms out (Z)','z','<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6M7.500 10h5M10 7.500v5"/>'],
];
function buildTools(){const h=$('#tools');h.innerHTML='';TOOLS.forEach(t=>{if(t==='-')return h.append(el('hr'));h.append(el('button',{id:'tool-'+t[0],title:t[1],'aria-label':t[1],html:I(t[3]),class:S.tool===t[0]?'on':'',onclick:()=>selectTool(t[0])}));});}
function selectTool(t){S.tool=t;$$('#tools button').forEach(b=>b.classList.toggle('on',b.id==='tool-'+t));if(t==='bone'){const l=rigLayer();if(l&&!S.setup){S.setup=true;buildInspector();}}if(t==='deform'&&S.setup)setRigMode(false);buildOpts();invalidate();}
function setRigMode(setup){const was=S.setup;S.setup=setup;if(was&&!setup){const l=rigLayer();if(l)l.rig.parts.forEach(p=>{if(p.mesh&&p.bound&&!p.painted)autoWeights(l.rig,p,p.bound);});commit();}buildInspector();invalidate();}
function rng(id,label,min,max,step,get,set){const o=el('output',{},String(get()));return el('label',{for:id},label,el('input',{id,type:'range',min,max,step,value:get(),oninput:e=>{set(+e.target.value);o.textContent=e.target.value;invalidate();}}),o);}
function buildOpts(){
 const h=$('#opts');h.innerHTML='';const t=S.tool,add=(...x)=>h.append(...x);
 const color=()=>el('label',{},'Colour',el('input',{id:'brushColor',type:'color',value:S.brush.color,oninput:e=>{S.brush.color=e.target.value;}}));
 const tip=s=>el('span',{class:'tip'},s);
 const celOpt=()=>S.autokey?el('label',{title:'What a new auto keyframe contains when you draw on a held frame'},'New keyframe starts',sel('oCel',[['copy','From last drawing'],['blank','Blank']],S.celStart,v=>{S.celStart=v;})):null;
 if(t==='brush'||t==='line'||t==='rect'||t==='ellipse'){add(color(),rng('oSize','Size',1,120,1,()=>S.brush.size,v=>S.brush.size=v),rng('oOp','Opacity',.05,1,.05,()=>S.brush.opacity,v=>S.brush.opacity=v));
  if(t==='brush')add(rng('oSm','Smoothing',0,1,.05,()=>S.brush.smooth,v=>S.brush.smooth=v),el('label',{},el('input',{id:'oTaper',type:'checkbox',checked:S.brush.taper,onchange:e=>S.brush.taper=e.target.checked}),'Tapered lines'),celOpt()||'');
  else if(t!=='line')add(el('label',{},el('input',{id:'oFill',type:'checkbox',checked:S.shapeFill,onchange:e=>S.shapeFill=e.target.checked}),'Filled'));
  if(t!=='brush'&&celOpt())add(celOpt());}
 else if(t==='eraser')add(rng('oEr','Size',2,200,1,()=>S.eraser.size,v=>S.eraser.size=v));
 else if(t==='fill')add(color(),rng('oGap','Close gaps',0,6,1,()=>S.fillGap,v=>S.fillGap=v),tip('Fills stop at your line art. Raise this if colour leaks through small gaps.'));
 else if(t==='select')add(tip(S.setup?'Drag a part to line it up with the skeleton.':'Drag to move. Corners scale, the top circle rotates. Shift keeps it straight.'));
 else if(t==='camera')add(tip('Drag to pan the camera. Shift+drag to zoom. Layers with low depth move less.'));
 else if(t==='bone')add(tip('Drag out a bone. Start on a white tip to chain the next one. Select a bone first to make it the parent.'));
 else if(t==='pose'){add(el('label',{},el('input',{id:'oIK',type:'checkbox',checked:S.ik,onchange:e=>S.ik=e.target.checked}),'IK on bone tips'),rng('oIKn','Chain',2,5,1,()=>S.ikLen,v=>S.ikLen=v),el('button',{onclick:()=>{const b=bone();if(!b)return toast('Select a bone to pin.');S.pins.has(b.id)?S.pins.delete(b.id):S.pins.add(b.id);invalidate();}},'Pin / unpin bone (M)'),tip('Pinned tips stay put while you pose. Use it to plant feet and hands.'));}
 else if(t==='deform')add(rng('oR','Brush radius',10,300,5,()=>S.brushR,v=>S.brushR=v),tip('Pick a part, then push the mesh. Each push keys the shape, so hair and cloth can morph between frames.'));
 else if(t==='weight')add(rng('oR2','Brush radius',10,300,5,()=>S.brushR,v=>S.brushR=v),rng('oW','Strength',.02,.5,.02,()=>S.weightAmt,v=>S.weightAmt=v),tip('Red dots follow the selected bone fully. Blue dots ignore it.'));
 else if(t==='lasso'){if(S.lasso&&S.lasso.closed)add(el('button',{onclick:lassoToPart},'Lift into rig part'),el('button',{onclick:lassoToLayer},'Lift into new layer'),el('button',{onclick:()=>{lassoCut(layer());S.lasso=null;commit();buildOpts();}},'Delete area'),el('button',{onclick:()=>{S.lasso=null;buildOpts();invalidate();}},'Deselect'),tip('Drag inside the outline to move it.'));else add(tip('Draw around an area. This is how you cut a flat character image into rig parts.'));}
}
/* ---------- inspector ---------- */
let Binds=[];
function numField(o,p,opts={}){const{min=-1e6,max=1e6,step=1,scale=1,dec=2}=opts,inp=el('input',{class:'num',id:`f-${p}`,type:'text',inputmode:'decimal','aria-label':opts.label||p});
 const apply=v=>{v=clamp(v,min,max);writeProp(o,p,+(v/scale).toFixed(4));invalidate();};
 inp.addEventListener('change',()=>{const v=parseFloat(inp.value);if(!isNaN(v)){apply(v);commit();}});
 inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')inp.blur();});
 let drag=null;inp.addEventListener('pointerdown',e=>{drag={x:e.clientX,v:val(o,p,S.frame)*scale,moved:false};inp.setPointerCapture(e.pointerId);});
 inp.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>3)drag.moved=true;if(drag.moved){const nv=clamp(drag.v+dx*step*(e.shiftKey?10:1),min,max);apply(nv);inp.value=+nv.toFixed(dec);e.preventDefault();}});
 inp.addEventListener('pointerup',e=>{if(drag&&drag.moved){commit();inp.blur();}drag=null;});
 const kb=el('button',{class:'kbtn','aria-label':'Toggle keyframe',title:'Add or remove a keyframe here',onclick:()=>{if(hasTrack(o,p)&&o.tr[p].some(k=>k.f===S.frame))delKey(o,p,S.frame);else setKey(o,p,S.frame,val(o,p,S.frame));commit();buildRows();}},'◆');
 Binds.push({inp,kb,o,p,scale,dec});return{inp,kb};}
function row(label,ctl,kb){return el('div',{class:'row'},el('label',{},label),el('div',{class:'ctl'},ctl),kb||el('span'));}
function nr(o,p,label,opts){const{inp,kb}=numField(o,p,{...opts,label});return row(label,inp,kb);}
function sel(id,opts,v,fn){return el('select',{id,onchange:e=>fn(e.target.value)},opts.map(([a,b])=>el('option',{value:a,selected:a===v},b)));}
function sec(title,...kids){return el('div',{class:'sec'},el('h3',{},title),...kids);}
function syncInspector(){for(const b of Binds){if(document.activeElement!==b.inp||b.inp.dataset.d){const v=val(b.o,b.p,S.frame);if(v!=null&&typeof v==='number')b.inp.value=+(v*b.scale).toFixed(b.dec);}const has=hasTrack(b.o,b.p);b.kb.classList.toggle('has',has);b.kb.classList.toggle('on',has&&b.o.tr[b.p].some(k=>k.f===S.frame));}}
const BLENDS=[['source-over','Normal'],['screen','Screen'],['lighter','Add'],['multiply','Multiply'],['overlay','Overlay'],['soft-light','Soft light'],['color-dodge','Colour dodge'],['hard-light','Hard light']];
function buildInspector(){
 Binds=[];const h=$('#inspBody');h.innerHTML='';const l=layer(),sc=cur();
 if(S.keys.size)h.append(easeSection());
 if(S.sel.cam){const c=sc.camera;h.append(sec('Camera',nr(c,'x','Pan X'),nr(c,'y','Pan Y'),nr(c,'zoom','Zoom',{step:.01,min:.05,max:20}),nr(c,'rot','Roll',{step:.2}),nr(c,'shake','Shake',{step:.5,min:0}),el('p',{class:'hint'},'Set depth on each layer for multiplane parallax: 0 stays still, 1 moves with the camera, above 1 passes faster in the foreground.')));}
 else if(l){
  h.append(layerHead(l));
  if(l.type==='rig')rigPanel(h,l);
  if(l.type==='text')textPanel(h,l);
  if(l.type==='fx')fxPanel(h,l);
  if(l.type==='solid')h.append(sec('Fill',row('Colour',el('input',{id:'solidC',type:'color',value:l.color,oninput:e=>{l.color=e.target.value;invalidate();},onchange:commit}))));
  if(l.type==='draw'||l.type==='image')h.append(sec('Rig',el('div',{class:'btns'},el('button',{onclick:layerToPart},'Send to rig as a part')),el('p',{class:'hint'},'Draw a body part here, then send it to the character rig.')));
  if(l.type!=='fx'&&!(part()||bone()))h.append(transformPanel(l));
 }
 if(!l&&!S.sel.cam&&S.sel.clip){const c=S.doc.audio.find(x=>x.id===S.sel.clip);if(c)h.append(sec('Sound',el('p',{class:'hint'},c.name),row('Volume',el('input',{id:'sndV',type:'range',min:0,max:1.5,step:.01,value:c.vol,oninput:e=>{c.vol=+e.target.value;},onchange:commit})),row('Start frame',el('input',{id:'sndS',type:'number',value:c.start,onchange:e=>{c.start=Math.max(0,+e.target.value);commit();}})),row('Skip (sec)',el('input',{id:'sndO',type:'number',min:0,step:.1,value:c.offset||0,title:'Skip this much of the start of the file',onchange:e=>{c.offset=Math.max(0,+e.target.value);commit();}})),row('Fade in (sec)',el('input',{id:'sndFi',type:'number',min:0,step:.1,value:c.fadeIn||0,onchange:e=>{c.fadeIn=Math.max(0,+e.target.value);commit();}})),row('Fade out (sec)',el('input',{id:'sndFo',type:'number',min:0,step:.1,value:c.fadeOut||0,title:'Fades before the sound or the film ends, whichever comes first',onchange:e=>{c.fadeOut=Math.max(0,+e.target.value);commit();}}))));}
 h.append(scenePanel(sc));
 h.append(sec('Film',row('Frame rate',sel('dFps',[['12','12 fps'],['24','24 fps (anime standard)'],['30','30 fps']],String(S.doc.fps),v=>{S.doc.fps=+v;commit();buildCuts();toast('Frame rate changed. Keys stay on their frame numbers, so timing shifts.');}))));
}
function layerHead(l){return sec('Layer',row('Name',el('input',{id:'lName',value:l.name,onchange:e=>{l.name=e.target.value;commit();buildRows();},onkeydown:e=>e.stopPropagation()})),
 el('div',{class:'btns'},el('button',{onclick:()=>{const c=l.rig?cloneRigLayer(l):Object.assign(JSON.parse(JSON.stringify(l)),{id:uid('l')});c.name=l.name+' copy';addLayer(c);structure();commit();}},'Duplicate'),el('button',{onclick:()=>removeLayer(l.id)},'Delete')));}
function transformPanel(l){const ps=cur().layers.filter(x=>x.id!==l.id&&x.type!=='fx');return el('div',{style:'display:contents'},
 sec('Transform',nr(l,'x','X'),nr(l,'y','Y'),nr(l,'rot','Rotation',{step:.5}),nr(l,'sx','Scale X',{step:.01,dec:3}),nr(l,'sy','Scale Y',{step:.01,dec:3}),nr(l,'ax','Anchor X'),nr(l,'ay','Anchor Y'),nr(l,'opacity','Opacity',{step:.01,min:0,max:1})),
 sec('Look',nr(l,'blur','Blur',{step:.2,min:0}),nr(l,'bright','Brightness',{step:.01,min:0,max:4}),nr(l,'sat','Saturation',{step:.01,min:0,max:4}),nr(l,'tint','Tint amount',{step:.01,min:0,max:1}),row('Tint colour',el('input',{id:'lTint',type:'color',value:l.tintColor,oninput:e=>{l.tintColor=e.target.value;invalidate();},onchange:commit})),row('Blend',sel('lBlend',BLENDS,l.blend,v=>{l.blend=v;commit();}))),
 sec('Timing and depth',row('Animate on',sel('lStep',[['1','Ones (full)'],['2','Twos'],['3','Threes (anime limited)'],['4','Fours']],String(l.step),v=>{l.step=+v;commit();})),row('Depth',el('input',{id:'lPar',type:'number',step:.05,value:l.parallax,onchange:e=>{l.parallax=+e.target.value;commit();}})),row('Parent',sel('lParent',[['','None'],...ps.map(x=>[x.id,x.name])],l.parent||'',v=>{l.parent=v||null;commit();})),row('Pin to screen',el('input',{id:'lScreen',type:'checkbox',checked:l.screen,onchange:e=>{l.screen=e.target.checked;commit();}}))));}
function textPanel(h,l){const t=l.text;const up=fn=>e=>{fn(e.target);invalidate();commit();};
 h.append(sec('Text',el('textarea',{id:'textVal',rows:3,onkeydown:e=>e.stopPropagation(),oninput:e=>{t.value=e.target.value;invalidate();},onchange:commit},t.value),
  row('Font',sel('tFont',FONTS.map(f=>[f,f]),t.font,v=>{t.font=v;document.fonts.load(`40px "${v}"`,'あA').then(invalidate);commit();})),
  row('Size',el('input',{id:'tSize',type:'number',value:t.size,onchange:up(e=>t.size=+e.value)})),row('Weight',sel('tW',[['400','Regular'],['700','Bold'],['800','Heavy']],String(t.weight),v=>{t.weight=+v;commit();})),
  row('Colour',el('input',{id:'tCol',type:'color',value:t.color,oninput:e=>{t.color=e.target.value;invalidate();},onchange:commit})),row('Spacing',el('input',{id:'tSp',type:'number',value:t.spacing,onchange:up(e=>t.spacing=+e.value)})),
  row('Outline',el('input',{id:'tSt',type:'color',value:t.stroke,oninput:e=>{t.stroke=e.target.value;invalidate();},onchange:commit}),null),row('Outline size',el('input',{id:'tSw',type:'number',min:0,value:t.strokeW,onchange:up(e=>t.strokeW=+e.value)})),
  row('Glow',el('input',{id:'tGl',type:'number',min:0,value:t.glow,onchange:up(e=>t.glow=+e.value)})),row('Glow colour',el('input',{id:'tGc',type:'color',value:t.glowColor,oninput:e=>{t.glowColor=e.target.value;invalidate();},onchange:commit})),
  row('Align',sel('tAl',[['left','Left'],['center','Centre'],['right','Right']],t.align,v=>{t.align=v;commit();})),row('Vertical',el('input',{id:'tV',type:'checkbox',checked:t.vertical,onchange:up(e=>t.vertical=e.checked)})),nr(l,'reveal','Reveal',{step:.01,min:0,max:1})));}
function fxPanel(h,l){const def=FX[l.fx],k=[];for(const p in l.p){if(typeof l.p[p]==='string'){k.push(row(p==='color'?'Colour':p[0].toUpperCase()+p.slice(1),el('input',{id:'fx'+p,type:'color',value:l.p[p],oninput:e=>{l.p[p]=e.target.value;invalidate();},onchange:commit})));}else{const R=(def.range&&def.range[p])||FX_RANGE[p]||[-1e4,1e4,.1];k.push(nr(l,p,p[0].toUpperCase()+p.slice(1),{min:R[0],max:R[1],step:R[2]}));}}
 h.append(sec(def.label,...k,row('Animate on',sel('lStep',[['1','Ones'],['2','Twos'],['3','Threes']],String(l.step),v=>{l.step=+v;commit();})),row('Blend',sel('lBlend',BLENDS,l.blend,v=>{l.blend=v;commit();}))));}
function rigPanel(h,l){
 const rig=l.rig,b=bone(),p=part();
 h.append(sec('Character rig',el('div',{class:'seg',role:'group'},el('button',{class:S.setup?'on':'',onclick:()=>setRigMode(true)},'Set up'),el('button',{class:S.setup?'':'on',onclick:()=>setRigMode(false)},'Animate')),
  el('p',{class:'hint'},S.setup?'Set up shows the rest pose. Place parts, draw bones, bind, then switch to Animate.':'Use Pose (P) to bend bones. Auto-key records each pose at the playhead.'),
  el('div',{class:'btns'},el('button',{onclick:()=>importAsParts()},'Add images'),el('button',{onclick:()=>importPSD()},'Import PSD'),el('button',{onclick:()=>autoBindAll(l)},'Auto-bind all parts'))));
 h.append(sec(`Bones (${rig.bones.length})`,el('div',{class:'list'},rig.bones.map(x=>{let dep=0,q=x;while(q.parent&&dep<9){q=rig.bones.find(y=>y.id===q.parent);dep++;}return el('div',{class:x.id===S.sel.boneId?'on':'',style:`padding-left:${6+dep*10}px`,onclick:()=>{S.sel.boneId=x.id;S.sel.partId=null;buildInspector();buildRows();invalidate();}},x.name);}))));
 if(b)h.append(sec('Selected bone',row('Name',el('input',{id:'bName',value:b.name,onchange:e=>{b.name=e.target.value;commit();structure();},onkeydown:e=>e.stopPropagation()})),nr(b,'rot','Rotation',{step:.5}),nr(b,'x','Offset X'),nr(b,'y','Offset Y'),nr(b,'sx','Stretch',{step:.01}),nr(b,'sy','Squash',{step:.01}),
  el('div',{class:'btns'},el('button',{onclick:()=>{['rot','x','y','sx','sy'].forEach(k=>{if(hasTrack(b,k)||S.autokey)setKey(b,k,S.frame,BONE_P()[k]);else b.p[k]=BONE_P()[k];});commit();}},'Reset pose'),el('button',{onclick:()=>deleteBone(l,b)},'Delete bone'))));
 h.append(sec(`Parts, top is in front (${rig.parts.length})`,el('div',{class:'list'},[...rig.parts].reverse().map(x=>el('div',{class:x.id===S.sel.partId?'on':'',onclick:()=>{S.sel.partId=x.id;S.sel.boneId=null;buildInspector();buildRows();invalidate();}},x.name,el('span',{class:'tag'},(x.mesh?(x.mesh.ww.some(w=>w>0&&w<1)?'smooth':'mesh'):x.bone?'rigid':'loose')+(x.assets.length>1?' ×'+x.assets.length:''))))))); 
 if(p)partPanel(h,l,p);
}
function deleteBone(l,b){const r=l.rig;r.bones.forEach(x=>{if(x.parent===b.id)x.parent=b.parent;});r.bones=r.bones.filter(x=>x!==b);r.parts.forEach(p=>{if(p.bone===b.id)p.bone=null;if(p.bound)p.bound=p.bound.filter(i=>i!==b.id);if(p.mesh&&p.bound&&p.bound.length)autoWeights(r,p,p.bound);else if(p.mesh)rigidWeights(p);});S.sel.boneId=null;commit();structure();}
function nearestBone(rig,p){const pose=rigPose(rig,0,true);const c=[p.x+p.w/2,p.y+p.h/2];let best=null,d=1e9;rig.bones.forEach(b=>{const[h,t]=[boneHead(pose,b),boneTip(pose,b)],q=segDist(c[0],c[1],h[0],h[1],t[0],t[1]);if(q<d){d=q;best=b;}});return best;}
function autoBindAll(l){let n=0;l.rig.parts.forEach(p=>{if(!p.bone&&!p.mesh){const b=nearestBone(l.rig,p);if(b){p.bone=b.id;n++;}}});commit();structure();toast(n?`Bound ${n} parts to their nearest bones.`:'Every part is already bound.');}
function partPanel(h,l,p){
 const rig=l.rig,isSmooth=p.bound&&p.bound.length>0;
 const move=d=>{const i=rig.parts.indexOf(p),j=clamp(i+d,0,rig.parts.length-1);rig.parts.splice(i,1);rig.parts.splice(j,0,p);commit();structure();};
 const kids=[row('Name',el('input',{id:'pName',value:p.name,onchange:e=>{p.name=e.target.value;commit();structure();},onkeydown:e=>e.stopPropagation()})),
  el('div',{class:'btns'},el('button',{onclick:()=>move(1)},'Forward'),el('button',{onclick:()=>move(-1)},'Back'),el('button',{onclick:()=>{p.hidden=!p.hidden;commit();structure();}},p.hidden?'Show':'Hide'),el('button',{onclick:()=>{rig.parts=rig.parts.filter(x=>x!==p);S.sel.partId=null;commit();structure();}},'Delete')),
  row('Follows bone',sel('pBone',[['','None'],...rig.bones.map(b=>[b.id,b.name])],p.bone||'',v=>{p.bone=v||null;p.bound=null;if(p.mesh)rigidWeights(p);commit();structure();})),
  nr(p,'opacity','Opacity',{step:.01,min:0,max:1})];
 if(p.assets.length>1)kids.push(nr(p,'swap','Image swap',{step:1,min:0,max:p.assets.length-1,dec:0}));
 kids.push(el('div',{class:'btns'},el('button',{onclick:()=>addSwap(p)},'Add swap image'),p.assets.length>1&&S.doc.audio.length?el('button',{onclick:()=>lipSync(p)},'Lip-sync to sound'):null));
 h.append(sec('Selected part',...kids));
 const list=el('div',{class:'list',style:'max-height:130px'},rig.bones.map(b=>{const c=el('input',{type:'checkbox',id:'sb'+b.id,checked:!!(p.bound&&p.bound.includes(b.id))});c.dataset.b=b.id;return el('label',{for:'sb'+b.id,style:'display:flex;gap:6px;padding:2px 6px'},c,b.name);}));
 h.append(sec('Smooth bend',el('p',{class:'hint'},'Tick the bones that should bend this part, then bind. The elbow of a one-piece arm needs both arm bones.'),list,
  row('Mesh detail',el('input',{id:'pDens',type:'range',min:6,max:80,step:2,value:p.density||24,title:'Lower is finer',onchange:e=>{p.density=+e.target.value;}})),
  el('div',{class:'btns'},el('button',{class:'primary',onclick:()=>{const ids=$$('input[type=checkbox]',list).filter(c=>c.checked).map(c=>c.dataset.b);if(!ids.length)return toast('Tick at least one bone.');if(!p.mesh||p.density!==p.mesh.cell)buildMesh(p,p.density);p.bound=ids;p.painted=false;autoWeights(rig,p,ids);commit();structure();toast(`Bound ${p.name} to ${ids.length} bones.`);}},isSmooth?'Rebind':'Bind smooth'),p.mesh?el('button',{onclick:()=>{p.mesh=null;p.bound=null;p.p.deform=null;delete p.tr.deform;commit();structure();}},'Remove mesh'):null,
   el('button',{class:'tog'+(S.showMesh?' on':''),onclick:()=>{S.showMesh=!S.showMesh;buildInspector();invalidate();}},'Show mesh'))));
}
async function addSwap(p){const fs=await pick('image/*',true);if(!fs.length)return;const imgs=await Promise.all(fs.map(fileBitmap));let w=p.w,h=p.h;imgs.forEach(c=>{w=Math.max(w,c.width);h=Math.max(h,c.height);});
 const pad=(cv)=>{if(cv.width===w&&cv.height===h)return cv;const c=mkCanvas(w,h);c.getContext('2d').drawImage(cv,(w-cv.width)/2|0,(h-cv.height)/2|0);return c;};
 p.assets=p.assets.map(a=>addBitmap(pad(Bitmaps.get(a).canvas)));imgs.forEach(c=>p.assets.push(addBitmap(pad(c))));if(w!==p.w||h!==p.h){p.w=w;p.h=h;}commit();structure();toast('Added swap images. Key "Image swap" to change them.');}
function lipSync(p){const d=S.doc,sc=cur(),st=sceneStart(S.si),n=p.assets.length,fps=d.fps;delete p.tr.swap;let last=-1;const levels=[];
 for(let f=0;f<sc.dur;f+=2){let rms=0;for(const c of d.audio){const s=Sounds.get(c.asset);if(!s)continue;const t=(st+f-c.start)/fps+(c.offset||0);if(t<0||t>=s.buffer.duration)continue;const ch=s.buffer.getChannelData(0),a=Math.floor(t*s.buffer.sampleRate),L=Math.floor(s.buffer.sampleRate/12);let e=0;for(let i=0;i<L;i+=16){const v=ch[a+i]||0;e+=v*v;}rms=Math.max(rms,Math.sqrt(e/(L/16))*c.vol);}levels.push(rms);}
 const top=Math.max(...levels,.001);levels.forEach((v,i)=>{const r=v/top,idx=r<.12?0:Math.min(n-1,1+Math.floor(r*(n-1)*.999));if(idx!==last){setKey(p,'swap',i*2,idx,'hold');last=idx;}});commit();structure();toast('Lip-sync keys added on twos.');}
function scenePanel(sc){const t=sc.trans;return sec('This cut',row('Name',el('input',{id:'sName',value:sc.name,onchange:e=>{sc.name=e.target.value;commit();buildCuts();},onkeydown:e=>e.stopPropagation()})),row('Backdrop',el('input',{id:'sBg',type:'color',value:sc.bg,oninput:e=>{sc.bg=e.target.value;invalidate();},onchange:commit})),
 row('Way in',sel('sTr',[['cut','Hard cut'],['black','Dip to black'],['white','Dip to white'],['flash','Flash'],['cross','Cross fade'],['wipe','Wipe']],t.type,v=>{t.type=v;commit();buildCuts();})),row('Transition',el('input',{id:'sTd',type:'number',min:2,value:t.dur,title:'Length in frames',onchange:e=>{t.dur=Math.max(2,+e.target.value);commit();}})),
 el('div',{class:'btns'},el('button',{onclick:dupScene},'Duplicate cut'),el('button',{onclick:delScene},'Delete cut')));}
/* easing editor */
function easeSection(){
 const a=allSelected();const first=a[0]?.k.e;const e0=Array.isArray(first)?first.slice():first==='hold'?null:[0,0,1,1];
 const c=el('canvas',{id:'curve'});const g=()=>c.getContext('2d');let cur_=e0;const wrap=el('div',{class:'sec'});
 const W=()=>c.clientWidth,H=()=>c.clientHeight;const X=v=>10+v*(W()-20),Y=v=>H()-30-v*(H()-60);
 const draw=()=>{const D=dpr();c.width=W()*D;c.height=H()*D;const x=g();x.scale(D,D);x.strokeStyle='#383e50';x.strokeRect(X(0),Y(1),X(1)-X(0),Y(0)-Y(1));if(!cur_){x.fillStyle='#9aa0b2';x.font='12px Zen Kaku Gothic New';x.fillText('Hold: the value jumps at the next key',16,H()/2);return;}x.strokeStyle='#6b7186';x.beginPath();x.moveTo(X(0),Y(0));x.lineTo(X(cur_[0]),Y(cur_[1]));x.moveTo(X(1),Y(1));x.lineTo(X(cur_[2]),Y(cur_[3]));x.stroke();x.strokeStyle='#ff6a5c';x.lineWidth=2;x.beginPath();x.moveTo(X(0),Y(0));x.bezierCurveTo(X(cur_[0]),Y(cur_[1]),X(cur_[2]),Y(cur_[3]),X(1),Y(1));x.stroke();x.fillStyle='#ffd98c';[[cur_[0],cur_[1]],[cur_[2],cur_[3]]].forEach(p=>{x.beginPath();x.arc(X(p[0]),Y(p[1]),5,0,7);x.fill();});};
 const apply=(v)=>{allSelected().forEach(({k})=>{if(v==null)delete k.e;else k.e=Array.isArray(v)?v.map(n=>+n.toFixed(3)):v;});invalidate();};
 let dr=-1;c.addEventListener('pointerdown',e=>{if(!cur_)return;c.setPointerCapture(e.pointerId);const r=c.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;dr=Math.hypot(mx-X(cur_[0]),my-Y(cur_[1]))<Math.hypot(mx-X(cur_[2]),my-Y(cur_[3]))?0:1;});
 c.addEventListener('pointermove',e=>{if(dr<0)return;const r=c.getBoundingClientRect();cur_[dr*2]=clamp((e.clientX-r.left-10)/(W()-20),0,1);cur_[dr*2+1]=clamp((H()-30-(e.clientY-r.top))/(H()-60),-.5,1.5);apply(cur_);draw();});
 c.addEventListener('pointerup',()=>{if(dr>=0)commit();dr=-1;});
 wrap.append(el('h3',{},`Easing, ${a.length} selected key${a.length===1?'':'s'}`),c,el('div',{class:'btns'},Object.keys(EASES).map(n=>el('button',{onclick:()=>{const v=EASES[n];cur_=Array.isArray(v)?v.slice():v==='hold'?null:[0,0,1,1];apply(v);draw();commit();}},n))));
 requestAnimationFrame(draw);return wrap;
}
/* menus */
const closeMenus=()=>$$('.menu>div').forEach(m=>m.remove());
function menu(label,items){const w=el('div',{class:'menu'});const b=el('button',{onclick:e=>{e.stopPropagation();const open=$('div',w);closeMenus();if(open)return;const m=el('div',{});items().forEach(it=>{if(it==='-')m.append(el('hr'));else if(typeof it==='string')m.append(el('div',{class:'hd'},it));else m.append(el('button',{onclick:()=>{closeMenus();it[1]();}},it[0],it[2]?el('kbd',{},it[2]):null));});w.append(m);}},label);w.append(b);return w;}
function buildMenus(){const h=$('#menus');h.replaceChildren(
 menu('File',()=>[['New film',newFilm],['Open project…',openProject,'Ctrl+O'],['Save project…',saveProject,'Ctrl+S'],'-',['Export video…',openExport],['Save this frame as PNG',saveStill],'-',['Load the sample again',()=>loadDoc(sampleDoc(),true)]]),
 menu('Add',()=>[['Drawing layer',()=>addNew('draw')],['Text',()=>addNew('text')],['Solid colour',()=>addNew('solid')],['Empty rig',()=>addNew('rig')],'-',['Image…',importImages],['Layered PSD as a rig…',importPSD],['Images as rig parts…',importAsParts],['Sound…',importAudio],'Effects',...Object.keys(FX).map(k=>[FX[k].label,()=>addNew('fx',k)])]),
 el('button',{onclick:openGuide},'Guide'));}
function addNew(t,k){const d=S.doc;let l;if(t==='draw'){l=newLayer('draw','Drawing',{cels:[]});l.p.x=l.p.ax=d.w/2;l.p.y=l.p.ay=d.h/2;}if(t==='text'){l=textLayer('Your words here',d.w/2,d.h/2,{});l.screen=false;}if(t==='solid'){l=newLayer('solid','Solid colour',{color:'#223355'});}if(t==='rig'){l=newLayer('rig','Character rig',{rig:{bones:[],parts:[]}});}if(t==='fx')l=fxLayer(k);addLayer(l);if(t==='rig')S.setup=true;if(t==='fx'&&l.fx==='gradient'){const ls=cur().layers;ls.splice(ls.indexOf(l),1);ls.unshift(l);}structure();commit();}
function openGuide(){dialog(el('div',{class:'dlg'},el('h2',{},'Making a shot in Genga'),
 el('ol',{},el('li',{},'Get your art in. Draw on a drawing layer, or use Add > Layered PSD to bring each Photoshop layer in as a part. With a flat image, use the Lasso to cut it into parts.'),el('li',{},'Rig it. Select the rig layer, choose Set up, and draw bones with the Bone tool (J) from the hips outward. Press Auto-bind for stiff parts. For bending parts, tick their bones and press Bind smooth.'),el('li',{},'Animate. Switch to Animate, move the playhead, and pose with the Pose tool (P). Auto-key records each pose. Drag keys in the timeline to retime them.'),el('li',{},'Give it the anime feel. Set Animate on to Twos or Threes, use Snap easing on fast moves, and hold poses. Add Impact frame, Speed lines and Colour fringe for big beats.'),el('li',{},'Direct it. Use cuts for each shot, move the Camera, set layer Depth for parallax, then add music with Add > Sound.'),el('li',{},'Save the project often, then press Export video.')),
 el('h3',{},'Shortcuts'),el('div',{class:'keys',html:[['Space','Play'],[', .','Step a frame'],['F6 / K','Keyframe'],['F7','Blank drawing'],['F5','Hold longer'],['[ ]','Brush size'],['V','Select'],['B','Brush'],['E','Eraser'],['G','Fill'],['A','Lasso'],['J','Bone'],['P','Pose'],['D','Deform'],['W','Weights'],['M','Pin bone'],['C','Camera'],['Ctrl Z','Undo'],['Ctrl S','Save'],['Ctrl C / V','Copy keys'],['Delete','Remove keys'],['Ctrl wheel','Zoom timeline']].map(k=>`<span><kbd>${k[0]}</kbd>${k[1]}</span>`).join('')}),
 el('div',{class:'acts'},el('button',{class:'primary',onclick:closeDialog},'Got it'))));}
function dialog(c){const m=$('#modal');m.replaceChildren(c);m.hidden=false;}
function closeDialog(){$('#modal').hidden=true;}
/* keyboard */
let spaceTap=false;
addEventListener('keydown',e=>{
 const t=e.target;if(t.matches&&t.matches('input:not([type=range]):not([type=checkbox]):not([type=color]),textarea,select'))return;
 const k=e.key,lk=k.toLowerCase(),mod=e.ctrlKey||e.metaKey;
 if(mod&&lk==='z'){e.preventDefault();e.shiftKey?Hist.go(1):Hist.go(-1);return;}
 if(mod&&lk==='y'){e.preventDefault();Hist.go(1);return;}
 if(mod&&lk==='s'){e.preventDefault();saveProject();return;}
 if(mod&&lk==='o'){e.preventDefault();openProject();return;}
 if(mod&&lk==='c'){copyKeys();return;}if(mod&&lk==='v'){pasteKeys();return;}
 if(mod)return;
 if(k===' '){e.preventDefault();if(!e.repeat){Ptr.space=true;spaceTap=true;}return;}
 if(k===','){setFrame(S.frame-1);return;}if(k==='.'){setFrame(S.frame+1);return;}
 if(k==='ArrowLeft'){setFrame(S.frame-1);e.preventDefault();return;}if(k==='ArrowRight'){setFrame(S.frame+1);e.preventDefault();return;}
 if(k==='F6'){e.preventDefault();keyHere();return;}if(k==='F7'){e.preventDefault();newCel(false);return;}if(k==='F5'){e.preventDefault();holdFrames(e.shiftKey?-1:1);return;}
 if(k==='['||k===']'){const d=k==='['?-1:1,g=S.tool==='eraser'?S.eraser:S.brush;if(S.tool==='deform'||S.tool==='weight')S.brushR=clamp(S.brushR+d*10,10,300);else g.size=clamp(g.size+d*Math.max(1,g.size*.15|0),1,200);buildOpts();invalidate();return;}
 if(k==='Delete'||k==='Backspace'){if(!deleteSelected()&&layer()&&!S.sel.boneId&&!S.sel.partId)removeLayer(S.layerId);return;}
 if(k==='Escape'){S.lasso=null;S.keys.clear();closeMenus();buildInspector();invalidate();return;}
 if(lk==='k'){keyHere();return;}
 if(lk==='m'){const b=bone();if(b){S.pins.has(b.id)?S.pins.delete(b.id):S.pins.add(b.id);invalidate();}return;}
 const tool=TOOLS.find(x=>x!=='-'&&x[2]===lk);if(tool)selectTool(tool[0]);});
addEventListener('keyup',e=>{if(e.key===' '){Ptr.space=false;if(spaceTap&&!Ptr.drag)togglePlay();spaceTap=false;}});
overC.addEventListener('pointerdown',()=>{if(Ptr.space)spaceTap=false;},true);
addEventListener('pointerdown',e=>{if(!e.target.closest('.menu'))closeMenus();});
