'use strict';
/* ---------- basics ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t;
let _uid=0; const uid=(p='i')=>p+'_'+Date.now().toString(36)+(++_uid).toString(36)+Math.random().toString(36).slice(2,5);
const el=(tag,attrs={},...kids)=>{const e=document.createElement(tag);for(const k in attrs){if(k==='class')e.className=attrs[k];else if(k.startsWith('on'))e.addEventListener(k.slice(2),attrs[k]);else if(k==='html')e.innerHTML=attrs[k];else if(attrs[k]!==false&&attrs[k]!=null)e.setAttribute(k,attrs[k]===true?'':attrs[k]);}kids.flat().forEach(c=>c!=null&&e.append(c));return e;};
const mkCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;};
const rnd=(seed)=>{const x=Math.sin(seed*127.1+311.7)*43758.5453;return x-Math.floor(x);};
/* 2x3 matrices [a,b,c,d,e,f], same layout as canvas setTransform */
const M={
 id:()=>[1,0,0,1,0,0],
 mul:(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]],
 inv:(m)=>{const d=m[0]*m[3]-m[1]*m[2]||1e-9;return[m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];},
 ap:(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]],
 t:(x,y)=>[1,0,0,1,x,y],
 r:(deg)=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return[c,s,-s,c,0,0];},
 s:(x,y=x)=>[x,0,0,y,0,0],
 chain:(...ms)=>ms.reduce(M.mul),
 scale:(m)=>Math.hypot(m[0],m[1]),
};
/* cubic-bezier easing */
function bez(e,t){
 const[x1,y1,x2,y2]=e;let lo=0,hi=1,u=t;
 const bx=u=>3*(1-u)*(1-u)*u*x1+3*(1-u)*u*u*x2+u*u*u, by=u=>3*(1-u)*(1-u)*u*y1+3*(1-u)*u*u*y2+u*u*u;
 for(let i=0;i<22;i++){const x=bx(u);if(Math.abs(x-t)<1e-4)break;if(x<t)lo=u;else hi=u;u=(lo+hi)/2;}
 return by(u);
}
const EASES={
 'Linear':null,'Hold':'hold','Ease':[.42,0,.58,1],'Ease in':[.55,0,1,.45],'Ease out':[0,.55,.45,1],
 'Snap':[.05,.9,.1,1],'Anticipate':[.5,-.5,.75,0],'Overshoot':[.2,.9,.3,1.35],
};
/* ---------- keyframe tracks ---------- */
function trackVal(ks,f){
 if(f<=ks[0].f)return ks[0].v;
 const n=ks.length;if(f>=ks[n-1].f)return ks[n-1].v;
 let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(ks[m].f<=f)lo=m;else hi=m;}
 const a=ks[lo],b=ks[hi];if(a.e==='hold')return a.v;
 let t=(f-a.f)/(b.f-a.f);if(Array.isArray(a.e))t=bez(a.e,t);
 if(Array.isArray(a.v)){const o=new Array(a.v.length),bv=b.v;for(let i=0;i<o.length;i++)o[i]=a.v[i]+(bv[i]-a.v[i])*t;return o;}
 return typeof a.v==='number'?a.v+(b.v-a.v)*t:a.v;
}
const hasTrack=(o,p)=>!!(o.tr&&o.tr[p]&&o.tr[p].length);
const val=(o,p,f)=>hasTrack(o,p)?trackVal(o.tr[p],f):o.p[p];
function setKey(o,p,f,v,e){
 if(p==='swap'&&e===undefined)e='hold';
 o.tr=o.tr||{};const t=o.tr[p]=o.tr[p]||[];
 const i=t.findIndex(k=>k.f===f);
 if(i>=0){t[i].v=v;if(e!==undefined)t[i].e=e;return t[i];}
 const k={f,v};if(e!==undefined)k.e=e;t.push(k);t.sort((a,b)=>a.f-b.f);return k;
}
function delKey(o,p,f){const t=o.tr&&o.tr[p];if(!t)return;const i=t.findIndex(k=>k.f===f);if(i>=0)t.splice(i,1);if(!t.length){delete o.tr[p];}}
/* ---------- bitmap + sound stores (immutable, so undo only tracks ids) ---------- */
const Bitmaps=new Map(), Sounds=new Map();
function addBitmap(canvas,id){id=id||uid('a');Bitmaps.set(id,{canvas,w:canvas.width,h:canvas.height});return id;}
/* ---------- document ---------- */
const LAYER_P=()=>({x:0,y:0,rot:0,sx:1,sy:1,ax:0,ay:0,opacity:1,blur:0,bright:1,sat:1,tint:0});
function newLayer(type,name,extra={}){
 return Object.assign({id:uid('l'),name,type,vis:true,lock:false,open:false,blend:'source-over',parallax:1,screen:false,step:1,parent:null,tintColor:'#ffffff',filters:[],p:LAYER_P(),tr:{}},extra);
}
function newScene(name,dur=72){return{id:uid('s'),name,dur,bg:'#000000',trans:{type:'cut',dur:12},camera:{id:uid('c'),name:'Camera',p:{x:0,y:0,zoom:1,rot:0,shake:0},tr:{}},layers:[]};}
function newDoc(name='Untitled trailer'){return{v:1,name,w:1920,h:1080,fps:24,scenes:[newScene('Cut 1')],audio:[]};}
const FX={
 gradient:{label:'Sky gradient',p:{top:'#20345e',mid:'#d98a7c',low:'#fbd6a2',midPos:.55}},
 petals:{label:'Sakura petals',p:{count:60,speed:1,size:1,wind:1,opacity:.95,color:'#ffc6d3',seed:1}},
 snow:{label:'Snow',p:{count:150,speed:1,size:1,wind:.3,opacity:.9,color:'#ffffff',seed:2}},
 rain:{label:'Rain',p:{count:220,speed:1,size:1,wind:.2,opacity:.45,color:'#cfe2ff',seed:3}},
 sparkle:{label:'Sparkles',p:{count:50,speed:1,size:1,wind:0,opacity:1,color:'#fff2c4',seed:4}},
 embers:{label:'Embers',p:{count:70,speed:1,size:1,wind:.2,opacity:.9,color:'#ffa24d',seed:5}},
 speedlines:{label:'Speed lines',p:{count:120,inner:.45,opacity:1,color:'#ffffff',cx:.5,cy:.5,seed:6}},
 rays:{label:'Light rays',p:{count:9,opacity:.35,color:'#fff0c8',cx:.8,cy:-.1,spin:.3,seed:7}},
 letterbox:{label:'Letterbox',p:{amount:.11,color:'#000000'}},
 vignette:{label:'Vignette',p:{amount:.55,color:'#050510'}},
 flash:{label:'Flash',p:{amount:0,color:'#ffffff'}},
 grain:{label:'Film grain',p:{amount:.08}},
 grade:{label:'Colour grade',p:{bright:1,contrast:1,sat:1,hue:0,warm:0}},
 bloom:{label:'Bloom glow',p:{amount:.45,radius:24}},
 chroma:{label:'Colour fringe',p:{amount:3}},
 impact:{label:'Impact frame',p:{amount:0,invert:0}},
};
const FX_RANGE={count:[0,400,1],speed:[0,5,.05],size:[.1,5,.05],wind:[-4,4,.05],opacity:[0,1,.01],seed:[0,99,1],inner:[0,1,.01],cx:[-.5,1.5,.01],cy:[-.5,1.5,.01],spin:[-3,3,.05],amount:[0,1,.01],radius:[0,80,1],midPos:[0,1,.01],bright:[0,2,.01],contrast:[0,3,.01],sat:[0,3,.01],hue:[-180,180,1],warm:[-1,1,.01],invert:[0,1,.01]};
FX.chroma.range={amount:[0,30,.5]};

/* picture filters: the same set works on one layer or, as an effect layer, on everything below it */
const FILTERS={
 colour:{label:'Colour',mode:7,p:{color:'#ffffff',amount:1},range:{amount:[0,1,.01]}},
 adjust:{label:'Adjust colours',mode:8,p:{hue:0,sat:1,bright:1},range:{hue:[-180,180,1],sat:[0,3,.01],bright:[0,3,.01]}},
 boil:{label:'Sketchy lines',mode:0,p:{amount:2.5,scale:26,rate:3,cycle:4,seed:1},range:{amount:[0,20,.1],scale:[4,200,1]}},
 pencil:{label:'Pencil texture',mode:1,p:{amount:.28,grain:4,rate:4,cycle:4,seed:2},range:{amount:[0,1,.01],grain:[1,30,.5]}},
 cel:{label:'Cel shade',mode:2,p:{levels:5},range:{levels:[2,12,1]}},
 halftone:{label:'Manga dots',mode:3,p:{size:9,amount:.9,color:'#15121a'},range:{size:[3,40,1],amount:[0,1,.01]}},
 outline:{label:'Ink outline',mode:4,p:{width:4,color:'#1a1420'},range:{width:[.5,30,.5]}},
 water:{label:'Watercolour',mode:5,p:{amount:3,scale:60,rate:6,cycle:4,seed:3},range:{amount:[0,20,.1],scale:[4,200,1]}},
 jitter:{label:'Hand-held shake',mode:6,p:{amount:3,turn:.4,rate:2,cycle:0,seed:4},range:{amount:[0,30,.1],turn:[0,5,.05]}},
};
const FILTER_COMMON={rate:[1,12,1],cycle:[0,12,1],seed:[0,99,1]};
const FILTER_LABEL={hue:'Hue shift',sat:'Saturation',bright:'Brightness',rate:'Hold frames',cycle:'Loop drawings',amount:'Amount',scale:'Wobble size',grain:'Grain',levels:'Tones',size:'Dot size',width:'Width',turn:'Turn',seed:'Variation',color:'Colour'};
for(const k of ['colour','adjust','boil','pencil','cel','halftone','water','jitter']){const f=FILTERS[k];FX['f_'+k]={label:f.label+' (whole picture)',p:{...f.p},filter:k,range:{...FILTER_COMMON,...f.range}};}
function newFilter(type){return{id:uid('f'),type,on:true,p:{...FILTERS[type].p},tr:{}};}
