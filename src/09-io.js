/* ---------- files ---------- */
function pick(accept,multiple){return new Promise(res=>{const i=$('#fileAny');i.value='';i.accept=accept;i.multiple=!!multiple;const on=()=>{i.removeEventListener('change',on);res([...i.files]);};i.addEventListener('change',on);i.click();});}
async function fileBitmap(file){const b=await createImageBitmap(file),c=mkCanvas(b.width,b.height);c.getContext('2d').drawImage(b,0,0);b.close&&b.close();return c;}
let Dl;async function getDownloads(){if(Dl!==undefined)return Dl;if(!window.claude||!window.claude.use)return Dl=null;try{return Dl=await window.claude.use('downloads');}catch(e){return Dl=null;}}
async function saveBlob(filename,blob){const d=await getDownloads();if(d){try{await d.save({filename,data:blob});return true;}catch(e){if(e&&e.code==='declined')return false;toast('Could not save: '+(e&&e.message||'try again'));return false;}}
 const a=el('a',{href:URL.createObjectURL(blob),download:filename});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);return true;}
const safeName=()=>(S.doc.name||'film').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-')||'film';
async function importImages(){const fs=await pick('image/*',true);for(const f of fs)await addImageFile(f);if(fs.length){structure();commit();}}
async function addImageFile(f){const c=await fileBitmap(f),id=addBitmap(c),d=S.doc,l=newLayer('image',f.name.replace(/\.\w+$/,''),{asset:id});l.p.ax=c.width/2;l.p.ay=c.height/2;l.p.x=d.w/2;l.p.y=d.h/2;const k=Math.min(1,d.w/c.width,d.h/c.height);l.p.sx=l.p.sy=+k.toFixed(3);addLayer(l);}
async function importAsParts(){const fs=await pick('image/*',true);if(!fs.length)return;const r=rigLayer()||targetRig();for(const f of fs){const c=await fileBitmap(f);const k=Math.min(1,S.doc.h/c.height);const cv=k<1?scaled(c,k):c;r.rig.parts.push(newPart(f.name.replace(/\.\w+$/,''),addBitmap(cv),Math.round((S.doc.w-cv.width)/2),Math.round((S.doc.h-cv.height)/2)));}S.layerId=r.id;S.setup=true;structure();commit();toast(`Added ${fs.length} parts. Drag them into place, then draw bones.`);}
function scaled(c,k){const o=mkCanvas(c.width*k,c.height*k),g=o.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(c,0,0,o.width,o.height);return o;}
function loadScript(src,test){return new Promise((res,rej)=>{if(test())return res();const s=el('script',{src});s.onload=()=>res();s.onerror=()=>rej(new Error('load'));document.head.append(s);});}
async function importPSD(){const fs=await pick('.psd,.psb',false);if(fs.length)await psdFile(fs[0]);}
async function psdFile(f){toast('Reading the PSD…',8000);try{await loadScript('https://cdn.jsdelivr.net/npm/ag-psd@22.0.2/dist/bundle.js',()=>!!window.agPsd);}catch(e){return toast('Could not load the PSD reader. Check your connection and try again.');}
 let psd;try{psd=agPsd.readPsd(await f.arrayBuffer(),{skipThumbnail:true,skipCompositeImageData:true});}catch(e){return toast('This PSD could not be read: '+e.message);}
 const d=S.doc,k=Math.min(1,d.w/psd.width,d.h/psd.height),ox0=(d.w-psd.width*k)/2,oy0=(d.h-psd.height*k)/2,l=newLayer('rig',f.name.replace(/\.\w+$/,''),{rig:{bones:[],parts:[]}});let n=0;
 const walk=(arr,hidden,prefix)=>{for(const c of arr||[]){const h=hidden||c.hidden;if(c.children){walk(c.children,h,c.name?c.name+' / ':prefix);continue;}if(!c.canvas||!c.canvas.width)continue;const cv=k<1?scaled(c.canvas,k):c.canvas;const p=newPart(prefix+(c.name||'Layer'),addBitmap(cv),Math.round(ox0+(c.left||0)*k),Math.round(oy0+(c.top||0)*k));p.hidden=!!h;l.rig.parts.push(p);n++;}};
 walk(psd.children,false,'');
 if(!n)return toast('No paint layers found. Rasterise text and smart objects, then try again.');
 addLayer(l);S.setup=true;structure();commit();toast(`Imported ${n} layers as parts. Now draw the bones.`);}
async function importAudio(){const fs=await pick('audio/*,.mp3,.wav,.m4a,.ogg,.flac',true);for(const f of fs)await addAudioFile(f);if(fs.length){structure();commit();}}
async function decodeSound(id,bytes,name){const ac=audioCtx();const buffer=await ac.decodeAudioData(bytes.slice(0));Sounds.set(id,{buffer,bytes,name});}
async function addAudioFile(f){const bytes=await f.arrayBuffer(),id=uid('snd');try{await decodeSound(id,bytes,f.name);}catch(e){return toast('This sound file could not be read. Try an mp3 or wav.');}S.doc.audio.push({id:uid('c'),asset:id,name:f.name,start:sceneStart(S.si)+S.frame,offset:0,vol:1});buildRows();}
/* drag files anywhere onto the app */
addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault();});
addEventListener('drop',async e=>{if(!e.dataTransfer||!e.dataTransfer.files.length)return;e.preventDefault();for(const f of e.dataTransfer.files){const n=f.name.toLowerCase();if(/\.(psd|psb)$/.test(n))await psdFile(f);else if(f.type.startsWith('image/'))await addImageFile(f);else if(f.type.startsWith('audio/'))await addAudioFile(f);else if(n.endsWith('.json'))await readProject(f);}structure();commit();});
/* project save / open: one JSON file with every image and sound embedded */
const blobURL=c=>new Promise(res=>c.toBlob(b=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(b);},'image/png'));
const b64=(buf)=>new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.readAsDataURL(new Blob([buf]));});
function usedAssets(){const s=JSON.stringify(S.doc),ids=new Set();for(const m of s.matchAll(/"(a_[a-z0-9]+|snd_[a-z0-9]+)"/g))ids.add(m[1]);return ids;}
async function saveProject(){toast('Packing the project…',9000);const parts=['{"genga":1,"doc":',JSON.stringify(S.doc),',"assets":{'];let first=true;
 for(const id of usedAssets()){const b=Bitmaps.get(id);if(!b)continue;parts.push((first?'':',')+JSON.stringify(id)+':"',await blobURL(b.canvas),'"');first=false;}
 parts.push('},"sounds":{');first=true;for(const id of usedAssets()){const s=Sounds.get(id);if(!s)continue;parts.push((first?'':',')+JSON.stringify(id)+':{"name":'+JSON.stringify(s.name)+',"data":"',await b64(s.bytes),'"}');first=false;}parts.push('}}');
 const ok=await saveBlob(safeName()+'.genga.json',new Blob(parts,{type:'application/json'}));toast(ok?'Project saved.':'Save cancelled.');}
function urlBitmap(u){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>{const c=mkCanvas(i.naturalWidth,i.naturalHeight);c.getContext('2d').drawImage(i,0,0);res(c);};i.onerror=rej;i.src=u;});}
async function openProject(){const fs=await pick('.json',false);if(fs.length)await readProject(fs[0]);}
async function readProject(f){toast('Opening…',9000);let j;try{j=JSON.parse(await f.text());}catch(e){return toast('That file is not a Genga project.');}if(!j.genga)return toast('That file is not a Genga project.');
 for(const id in j.assets){if(!Bitmaps.has(id))addBitmap(await urlBitmap(j.assets[id]),id);}
 for(const id in j.sounds||{}){const b=Uint8Array.from(atob(j.sounds[id].data),c=>c.charCodeAt(0)).buffer;await decodeSound(id,b,j.sounds[id].name);}
 loadDoc(j.doc,false);toast('Opened '+j.doc.name);}
function loadDoc(doc,sample){S.doc=doc;S.si=0;S.frame=0;S.keys.clear();S.sel={cam:false,boneId:null,partId:null};S.setup=false;S.isSample=!!sample;S.layerId=cur().layers[cur().layers.length-1]?.id||null;Hist.reset();$('#projName').value=doc.name;$('#sampleChip').hidden=!sample;buildTransport();fitView();structure();Store.touch();}
function newFilm(){dialog(el('div',{class:'dlg',style:'max-width:420px'},el('h2',{},'Start a new film?'),el('p',{},'This replaces the open project. Save first if you want to keep it.'),el('div',{class:'acts'},el('button',{onclick:closeDialog},'Keep working'),el('button',{class:'primary',onclick:()=>{closeDialog();loadDoc(newDoc('Anniversary trailer'),false);}},'Start new'))));}
async function saveStill(){const d=S.doc,c=mkCanvas(d.w,d.h),g=c.getContext('2d');renderScene(g,cur(),S.frame,{base:M.id(),useCam:true,clip:true});c.toBlob(async b=>{if(await saveBlob(`${safeName()}-f${S.frame+1}.png`,b))toast('Frame saved.');},'image/png');}
/* autosave to this browser: lets a closed tab recover the work, but a saved file is still the real backup */
const Store={db:null,t:null,saved:new Set(),open(){return new Promise(res=>{try{const r=indexedDB.open('genga',1);r.onupgradeneeded=()=>{const d=r.result;d.createObjectStore('kv');d.createObjectStore('blobs');};r.onsuccess=()=>{this.db=r.result;res(true);};r.onerror=()=>res(false);r.onblocked=()=>res(false);}catch(e){res(false);}});},
 touch(){clearTimeout(this.t);this.t=setTimeout(()=>this.flush(),2500);},
 async flush(){if(!this.db||S.isSample&&Hist.st.length<2)return;try{const ids=usedAssets();for(const id of ids){if(this.saved.has(id))continue;const b=Bitmaps.get(id),s=Sounds.get(id);let v;if(b)v=await new Promise(r=>b.canvas.toBlob(r,'image/png'));else if(s)v={name:s.name,bytes:s.bytes};if(!v)continue;await this.put('blobs',id,v);this.saved.add(id);}await this.put('kv','doc',JSON.stringify(S.doc));}catch(e){}},
 put(st,k,v){return new Promise((res,rej)=>{const t=this.db.transaction(st,'readwrite');t.objectStore(st).put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error);});},
 get(st,k){return new Promise((res,rej)=>{const q=this.db.transaction(st).objectStore(st).get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});},
 async restore(){if(!this.db)return false;try{const j=await this.get('kv','doc');if(!j)return false;const doc=JSON.parse(j),prev=S.doc;S.doc=doc;const ids=usedAssets();S.doc=prev;for(const id of ids){const v=await this.get('blobs',id);if(!v)continue;if(v instanceof Blob){const b=await createImageBitmap(v),c=mkCanvas(b.width,b.height);c.getContext('2d').drawImage(b,0,0);addBitmap(c,id);}else await decodeSound(id,v.bytes,v.name);this.saved.add(id);}return doc;}catch(e){return false;}}};
/* ---------- video export: every frame is rendered and encoded, so slow machines still get a smooth film ---------- */
function openExport(){const d=S.doc,tot=totalFrames(),sec=(tot/d.fps).toFixed(1);
 const res=el('select',{id:'xRes'},[[1920,'1080p, full HD'],[1280,'720p, smaller file'],[3840,'4K, slow']].map(([v,t])=>el('option',{value:v},t)));
 const scope=el('select',{id:'xScope'},el('option',{value:'all'},`Whole film (${sec} sec)`),el('option',{value:'cut'},`Only ${cur().name}`));
 const bar=el('i'),info=el('p',{},'Your video is rendered frame by frame on this computer. Leave this tab open while it runs.');
 const go=el('button',{class:'primary',id:'xGo'},'Render');const cancel=el('button',{onclick:()=>{X.stop=true;closeDialog();}},'Close');
 const X={stop:false};go.addEventListener('click',async()=>{go.disabled=true;try{const blob=await renderVideo({w:+res.value,scope:scope.value,X,onp:(p,m)=>{bar.style.width=(p*100).toFixed(1)+'%';info.textContent=m;}});if(!blob)return;const mb=(blob.size/1048576).toFixed(1);info.textContent=`Finished: ${mb} MB. Press Save to keep the file.`;bar.style.width='100%';go.disabled=false;go.textContent='Save video';const r=go.cloneNode(true);go.replaceWith(r);r.addEventListener('click',()=>saveBlob(`${safeName()}.${blob.ext}`,blob.data||blob));}catch(e){console.error(e);info.textContent='Export stopped: '+e.message;go.disabled=false;}});
 dialog(el('div',{class:'dlg',style:'max-width:480px'},el('h2',{},'Export video'),row('Size',res),row('What',scope),el('div',{class:'bar'},bar),info,el('div',{class:'acts'},cancel,go)));}
async function mixAudio(startSec,durSec){const d=S.doc;if(!d.audio.length)return null;const sr=48000,oc=new OfflineAudioContext(2,Math.ceil(durSec*sr),sr);let any=false;
 for(const c of d.audio){const s=Sounds.get(c.asset);if(!s)continue;const n=oc.createBufferSource();n.buffer=s.buffer;const g=oc.createGain();n.connect(g).connect(oc.destination);const at=c.start/d.fps-startSec,off=c.offset||0;if(at>=0)n.start(at,off);else if(off-at<s.buffer.duration)n.start(0,off-at);else continue;fadeGain(g.gain,c,s,-startSec);any=true;}
 return any?await oc.startRendering():null;}
async function renderVideo({w,scope,X,onp}){
 if(typeof VideoEncoder==='undefined')throw new Error('this browser cannot encode video. Use Chrome or Edge.');
 if(!window.Mp4Muxer)throw new Error('the video library did not load. Check your connection and reload.');
 const d=S.doc,k=w/d.w,W=w&~1,H=Math.round(d.h*k)&~1,c=mkCanvas(W,H),g=c.getContext('2d',{alpha:false});
 await Promise.all(FONTS.map(f=>document.fonts.load(`40px "${f}"`,'あA').catch(()=>{})));await document.fonts.ready;
 const g0=scope==='cut'?sceneStart(S.si):0,n=scope==='cut'?cur().dur:totalFrames(),fps=d.fps,bitrate=Math.round(W*H*fps*.16);
 const cand=[[`avc1.${W>1920?'640033':'640028'}`,'avc'],['vp09.00.40.08','vp9'],['vp8','vp8']];let vcfg=null,vc=null;
 for(const[codec,name]of cand){const cfg={codec,width:W,height:H,bitrate,framerate:fps,latencyMode:'quality'};try{const r=await VideoEncoder.isConfigSupported(cfg);if(r.supported&&name!=='vp8'){vcfg=cfg;vc=name;break;}}catch(e){}}
 if(!vcfg)throw new Error('no video encoder is available in this browser.');
 onp(0,'Mixing sound…');
 const mix=await mixAudio(g0/fps,n/fps);let acfg=null,ac=null;
 if(mix){for(const[codec,name]of[['mp4a.40.2','aac'],['opus','opus']]){const cfg={codec,sampleRate:48000,numberOfChannels:2,bitrate:192000};try{const r=await AudioEncoder.isConfigSupported(cfg);if(r.supported){acfg=cfg;ac=name;break;}}catch(e){}}}
 const target=new Mp4Muxer.ArrayBufferTarget();
 const mux=new Mp4Muxer.Muxer({target,fastStart:'in-memory',video:{codec:vc,width:W,height:H,frameRate:fps},...(acfg?{audio:{codec:ac,numberOfChannels:2,sampleRate:48000}}:{})});
 let err=null;const enc=new VideoEncoder({output:(ch,m)=>mux.addVideoChunk(ch,m),error:e=>err=e});enc.configure(vcfg);
 const was=S.playing;if(was)stopPlay();const base=M.s(W/d.w);const t0=performance.now();
 for(let i=0;i<n;i++){if(X.stop){enc.close();return null;}if(err)throw err;
  renderProject(g,g0+i,{base,useCam:true,clip:true});
  const fr=new VideoFrame(c,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps)});enc.encode(fr,{keyFrame:i%(fps*2)===0});fr.close();
  while(enc.encodeQueueSize>4)await new Promise(r=>setTimeout(r,4));
  if(i%4===0){const left=(performance.now()-t0)/(i+1)*(n-i)/1000;onp(i/n*.97,`Frame ${i+1} of ${n}. About ${Math.ceil(left)} sec left.`);await new Promise(r=>setTimeout(r));}}
 await enc.flush();enc.close();if(err)throw err;
 if(acfg){onp(.98,'Encoding sound…');let aerr=null;const ae=new AudioEncoder({output:(ch,m)=>mux.addAudioChunk(ch,m),error:e=>aerr=e});ae.configure(acfg);const L=mix.getChannelData(0),R=mix.getChannelData(1),sz=4800;
  for(let i=0;i<L.length;i+=sz){const m=Math.min(sz,L.length-i),b=new Float32Array(m*2);b.set(L.subarray(i,i+m),0);b.set(R.subarray(i,i+m),m);const ad=new AudioData({format:'f32-planar',sampleRate:48000,numberOfFrames:m,numberOfChannels:2,timestamp:Math.round(i/48000*1e6),data:b});ae.encode(ad);ad.close();if(ae.encodeQueueSize>20)await new Promise(r=>setTimeout(r,2));}
  await ae.flush();ae.close();if(aerr)throw aerr;}
 mux.finalize();onp(1,'Done');const b=new Blob([target.buffer],{type:'video/mp4'});return{data:b,size:b.size,ext:'mp4'};}
