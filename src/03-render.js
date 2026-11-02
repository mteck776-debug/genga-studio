/* ---------- buffers ---------- */
const Pool={free:[],get(w,h){let c=this.free.pop();if(!c)c=mkCanvas(w,h);if(c.width!==w||c.height!==h){c.width=w;c.height=h;}else{const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.filter='none';x.clearRect(0,0,w,h);}return c;},put(...cs){this.free.push(...cs);}};
let grainTile=null;
function grainPattern(ctx){if(!grainTile){grainTile=mkCanvas(256,256);const x=grainTile.getContext('2d'),d=x.createImageData(256,256);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}x.putImageData(d,0,0);}return grainTile;}
/* ---------- camera + layer maths ---------- */
function camState(sc,f){const c=sc.camera;let x=val(c,'x',f),y=val(c,'y',f),sh=val(c,'shake',f)||0;
 if(sh){const q=Math.floor(f/2);x+=(rnd(q+.1)-.5)*sh*2;y+=(rnd(q+.7)-.5)*sh*2;}
 return{x,y,zoom:val(c,'zoom',f),rot:val(c,'rot',f)};}
function camMatrix(cam,par,W,H){const z=1+(cam.zoom-1)*par;return M.chain(M.t(W/2,H/2),M.r(-cam.rot*Math.min(par,1)),M.s(z),M.t(-W/2-cam.x*par,-H/2-cam.y*par));}
function layerOwn(l,f){return M.chain(M.t(val(l,'x',f),val(l,'y',f)),M.r(val(l,'rot',f)),M.s(val(l,'sx',f),val(l,'sy',f)),M.t(-val(l,'ax',f),-val(l,'ay',f)));}
function layerWorld(l,sc,f,seen){let m=layerOwn(l,f);if(l.parent&&!(seen||[]).includes(l.id)){const p=sc.layers.find(x=>x.id===l.parent);if(p)m=M.mul(layerWorld(p,sc,f,[...(seen||[]),l.id]),m);}return m;}
function rootLayer(l,sc){let r=l,g=0;while(r.parent&&g++<20){const p=sc.layers.find(x=>x.id===r.parent);if(!p)break;r=p;}return r;}
function layerMatrix(l,sc,f,base,useCam,cam){
 const root=rootLayer(l,sc),own=layerWorld(l,sc,f);
 if(root.screen||!useCam)return M.mul(base,root.screen&&!useCam?own:own);
 return M.chain(base,camMatrix(cam,root.parallax,DOC().w,DOC().h),own);
}
const DOC=()=>S.doc;
const stepF=(l,f)=>l.step>1?Math.floor(f/l.step)*l.step:f;
const celAt=(l,f)=>{let r=null;for(const c of l.cels){if(c.f<=f)r=c;else break;}return r;};
/* ---------- layer contents ---------- */
function drawText(cx,l,f,scale){
 const t=l.text;const reveal=val(l,'reveal',f);
 cx.font=`${t.weight||400} ${t.size}px ${FONT_STACK(t.font)}`;cx.textBaseline='alphabetic';
 const chars=[...t.value];const shown=Math.round(chars.length*reveal);const str=chars.slice(0,shown).join('');
 const lines=str.split('\n');const lh=t.size*(t.lead||1.25);
 const paint=(s,x,y)=>{
  if(t.glow>0){cx.save();cx.shadowColor=t.glowColor||t.color;cx.shadowBlur=t.glow*scale;cx.fillStyle=t.color;cx.fillText(s,x,y);cx.fillText(s,x,y);cx.restore();}
  if(t.strokeW>0){cx.lineJoin='round';cx.lineWidth=t.strokeW*2;cx.strokeStyle=t.stroke;cx.strokeText(s,x,y);}
  cx.fillStyle=t.color;cx.fillText(s,x,y);};
 if(t.vertical){
  cx.textAlign='center';const sp=t.size*(1+(t.spacing||0)/100);
  lines.forEach((ln,i)=>{[...ln].forEach((c,j)=>paint(c,-i*lh,j*sp+t.size));});
 }else{
  try{cx.letterSpacing=(t.spacing||0)/100*t.size+'px';}catch(e){}
  cx.textAlign=t.align||'left';
  lines.forEach((ln,i)=>paint(ln,0,i*lh+t.size));
  try{cx.letterSpacing='0px';}catch(e){}
 }
}
function textBounds(l){const t=l.text,c=Pool.get(4,4),x=c.getContext('2d');x.font=`${t.weight||400} ${t.size}px ${FONT_STACK(t.font)}`;const ls=t.value.split('\n'),lh=t.size*(t.lead||1.25);
 try{x.letterSpacing=(t.spacing||0)/100*t.size+'px';}catch(e){}
 let w=0;ls.forEach(s=>w=Math.max(w,x.measureText(s).width));try{x.letterSpacing='0px';}catch(e){}Pool.put(c);
 if(t.vertical){const n=Math.max(...ls.map(s=>[...s].length));const sp=t.size*(1+(t.spacing||0)/100);return[-(ls.length-.5)*lh,0,ls.length*lh,n*sp+t.size*.3];}
 const a=t.align||'left';return[a==='center'?-w/2:a==='right'?-w:0,0,w,ls.length*lh+t.size*.3];}
function drawRig(cx,l,f,mat,o){
 const rig=l.rig,setup=o.setup===l.id;
 const pose=rigPose(rig,f,setup,o.poseOv&&o.poseOv.layer===l.id?o.poseOv.ov:null);
 const baseAlpha=cx.globalAlpha;
 for(const part of rig.parts){
  if(part.hidden)continue;
  const a=val(part,'opacity',f);if(a<=.001)continue;
  const idx=clamp(Math.round(val(part,'swap',f)||0),0,part.assets.length-1),asset=part.assets[idx],b=Bitmaps.get(asset);if(!b)continue;
  cx.globalAlpha=baseAlpha*a;
  if(part.mesh)GLM.draw(cx,asset,meshPositions(part,pose,f,setup),part,mat);
  else{const sk=part.bone&&pose[part.bone]?pose[part.bone].skin:M.id();cx.setTransform(...M.mul(mat,sk));cx.drawImage(b.canvas,part.x,part.y);}
 }
 cx.globalAlpha=baseAlpha;
}
function rigFX(cx,l,f,W,H,frame){
 /* particle + overlay effects paint in frame space */
 const p={};for(const k in l.p)p[k]=val(l,k,f);
 const kind=l.fx,sec=f/DOC().fps;
 cx.save();
 const part=(fn)=>{for(let i=0;i<p.count;i++)fn(i,rnd(i*1.3+p.seed),rnd(i*2.7+p.seed),rnd(i*4.1+p.seed),rnd(i*5.9+p.seed));};
 cx.globalAlpha=p.opacity==null?1:p.opacity;
 if(kind==='gradient'){const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,p.top);g.addColorStop(clamp(p.midPos,.01,.99),p.mid);g.addColorStop(1,p.low);cx.fillStyle=g;cx.fillRect(-W,-H,W*3,H*3);}
 else if(kind==='petals'){part((i,a,b,c,d)=>{const z=.4+c*1.1,sp=(50+a*70)*p.speed*z,T=sec+d*40;const x=((a*(W+200)+T*sp*p.wind*1.2+Math.sin(T*(.8+b)+i)*50)%(W+200)+W+200)%(W+200)-100,y=((b*(H+200)+T*sp)%(H+200))-100,s=(7+c*9)*p.size*z;
   cx.save();cx.translate(x,y);cx.rotate(T*(1+d)+i);cx.scale(1,.35+.65*Math.abs(Math.cos(T*1.7+i)));cx.fillStyle=p.color;cx.globalAlpha=(p.opacity)*(.55+c*.45);cx.beginPath();cx.moveTo(0,-s);cx.bezierCurveTo(s,-s*.6,s*.9,s*.6,0,s);cx.bezierCurveTo(-s*.9,s*.6,-s,-s*.6,0,-s);cx.fill();cx.restore();});}
 else if(kind==='snow'){part((i,a,b,c,d)=>{const z=.3+c,T=sec+d*30,x=((a*(W+40)+T*30*p.wind*z+Math.sin(T+i)*18)%(W+40)+W+40)%(W+40)-20,y=(b*(H+40)+T*(60*p.speed*z))%(H+40)-20;cx.fillStyle=p.color;cx.globalAlpha=p.opacity*(.3+c*.7);cx.beginPath();cx.arc(x,y,(1.5+c*3)*p.size,0,7);cx.fill();});}
 else if(kind==='rain'){cx.strokeStyle=p.color;cx.lineCap='round';part((i,a,b,c,d)=>{const z=.4+c,T=sec+d*30,sp=1500*p.speed*z,x=((a*(W+200)+T*sp*p.wind)%(W+200)+W+200)%(W+200)-100,y=(b*(H+200)+T*sp)%(H+200)-100,len=(26+c*40)*p.size;cx.globalAlpha=p.opacity*(.4+c*.6);cx.lineWidth=1+c;cx.beginPath();cx.moveTo(x,y);cx.lineTo(x-len*p.wind,y-len);cx.stroke();});}
 else if(kind==='sparkle'){cx.globalCompositeOperation='lighter';cx.fillStyle=p.color;part((i,a,b,c,d)=>{const x=a*W+Math.sin(sec*.5+i)*20*p.wind,y=b*H+Math.sin(sec*.3*p.speed+i*2)*20,tw=Math.pow(Math.abs(Math.sin(sec*p.speed*(1+c*2)+d*6.3)),6),s=(4+c*16)*p.size*tw;if(s<.3)return;cx.globalAlpha=p.opacity*tw;cx.save();cx.translate(x,y);cx.beginPath();for(let k=0;k<4;k++){cx.rotate(Math.PI/2);cx.moveTo(0,-s);cx.quadraticCurveTo(0,0,s,0);cx.quadraticCurveTo(0,0,0,s*.0);}cx.moveTo(-s,0);cx.quadraticCurveTo(0,0,0,-s);cx.quadraticCurveTo(0,0,s,0);cx.quadraticCurveTo(0,0,0,s);cx.quadraticCurveTo(0,0,-s,0);cx.fill();cx.restore();});}
 else if(kind==='embers'){cx.globalCompositeOperation='lighter';cx.fillStyle=p.color;part((i,a,b,c,d)=>{const z=.4+c,T=sec+d*30,x=((a*(W+80)+T*40*p.wind+Math.sin(T*2+i)*16)%(W+80)+W+80)%(W+80)-40,y=H+40-((b*(H+80)+T*90*p.speed*z)%(H+80));cx.globalAlpha=p.opacity*(.3+.7*Math.abs(Math.sin(T*3+i)));cx.beginPath();cx.arc(x,y,(1.2+c*3)*p.size,0,7);cx.fill();});}
 else if(kind==='speedlines'){const cxx=p.cx*W,cy=p.cy*H,R=Math.hypot(W,H),q=f;cx.fillStyle=p.color;for(let i=0;i<p.count;i++){const a=(i+rnd(i+q*1.3))/p.count*Math.PI*2,w=.004+rnd(i*3+q)*.014,inner=(p.inner+rnd(i*7+q*.7)*.35)*.62;const rx=inner*W,ry=inner*H;cx.beginPath();cx.moveTo(cxx+Math.cos(a)*rx,cy+Math.sin(a)*ry);cx.lineTo(cxx+Math.cos(a-w)*R,cy+Math.sin(a-w)*R);cx.lineTo(cxx+Math.cos(a+w)*R,cy+Math.sin(a+w)*R);cx.fill();}}
 else if(kind==='rays'){const ox=p.cx*W,oy=p.cy*H,R=Math.hypot(W,H)*1.3;cx.globalCompositeOperation='screen';for(let i=0;i<p.count;i++){const a=1.15+rnd(i+p.seed)*1.6+sec*.03*p.spin*(i%2?1:-1),w=.03+rnd(i*3+p.seed)*.09;const g=cx.createRadialGradient(ox,oy,0,ox,oy,R);g.addColorStop(0,p.color);g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.globalAlpha=p.opacity*(.6+.4*Math.sin(sec*.7+i));cx.beginPath();cx.moveTo(ox,oy);cx.lineTo(ox+Math.cos(a-w)*R,oy+Math.sin(a-w)*R);cx.lineTo(ox+Math.cos(a+w)*R,oy+Math.sin(a+w)*R);cx.fill();}}
 else if(kind==='letterbox'){cx.fillStyle=p.color;const h=p.amount*H;cx.fillRect(-1,-1,W+2,h+1);cx.fillRect(-1,H-h,W+2,h+1);}
 else if(kind==='vignette'){const g=cx.createRadialGradient(W/2,H/2,H*.42,W/2,H/2,Math.hypot(W,H)*.56);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,p.color);cx.globalAlpha=p.amount;cx.fillStyle=g;cx.fillRect(0,0,W,H);}
 else if(kind==='flash'){cx.globalAlpha=p.amount;cx.fillStyle=p.color;cx.fillRect(-1,-1,W+2,H+2);}
 cx.restore();
}
function adjustFX(ctx,l,f){
 /* adjustment effects re-process everything already painted below them */
 const cv=ctx.canvas,w=cv.width,h=cv.height,p={};for(const k in l.p)p[k]=val(l,k,f);
 const sc=frameScale(ctx);
 if(FX[l.fx].filter){const t=Pool.get(w,h);t.getContext('2d').drawImage(cv,0,0);FXGL.run(t,FX[l.fx].filter,k=>p[k],f,sc);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation='source-over';ctx.drawImage(t,0,0);ctx.restore();Pool.put(t);return;}
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.filter='none';
 const copy=(filter)=>{const t=Pool.get(w,h),x=t.getContext('2d');x.filter=filter||'none';x.drawImage(cv,0,0);x.filter='none';return t;};
 if(l.fx==='grade'){const g=copy(`brightness(${p.bright}) contrast(${p.contrast}) saturate(${p.sat}) hue-rotate(${p.hue}deg)`);ctx.drawImage(g,0,0);Pool.put(g);
  if(p.warm){ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=Math.abs(p.warm);ctx.fillStyle=p.warm>0?'#ff9a4a':'#3f6fe0';ctx.fillRect(0,0,w,h);}}
 else if(l.fx==='bloom'&&p.amount>0){const g=copy(`brightness(.85) contrast(1.8) blur(${p.radius*sc}px)`);ctx.globalCompositeOperation='screen';ctx.globalAlpha=p.amount;ctx.drawImage(g,0,0);Pool.put(g);}
 else if(l.fx==='chroma'&&p.amount>0){const a=p.amount*sc,ch=(col)=>{const t=copy(),x=t.getContext('2d');x.globalCompositeOperation='multiply';x.fillStyle=col;x.fillRect(0,0,w,h);return t;};
  const r=ch('#f00'),g=ch('#0f0'),b=ch('#00f');ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='lighter';ctx.drawImage(r,-a,0);ctx.drawImage(g,0,0);ctx.drawImage(b,a,0);Pool.put(r,g,b);}
 else if(l.fx==='impact'&&p.amount>0){const g=copy(`grayscale(1) contrast(9) ${p.invert>.5?'invert(1)':''}`);ctx.globalAlpha=p.amount;ctx.drawImage(g,0,0);Pool.put(g);}
 else if(l.fx==='grain'&&p.amount>0){const t=grainPattern();ctx.globalCompositeOperation='overlay';ctx.globalAlpha=p.amount;const pat=ctx.createPattern(t,'repeat');ctx.fillStyle=pat;ctx.translate(-Math.floor(rnd(f)*256),-Math.floor(rnd(f+.5)*256));ctx.fillRect(0,0,w+256,h+256);}
 ctx.restore();
}
const FXGL={cv:document.createElement('canvas'),gl:null,init(){
 const gl=this.gl=this.cv.getContext('webgl2',{premultipliedAlpha:true,alpha:true,preserveDrawingBuffer:true});if(!gl)return;
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o;};
 const p=gl.createProgram();
 gl.attachShader(p,sh(gl.VERTEX_SHADER,`#version 300 es
 void main(){vec2 v=vec2(gl_VertexID==1?3.:-1.,gl_VertexID==2?3.:-1.);gl_Position=vec4(v,0,1);}`));
 gl.attachShader(p,sh(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;uniform sampler2D t;uniform vec2 r;uniform float px,a,b,s;uniform int m;uniform vec3 col;out vec4 o;
 float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){return n(p)*.6+n(p*2.1+7.)*.3+n(p*4.3+3.)*.1;}
 vec4 tx(vec2 q){return texture(t,q/r);}
 vec3 un(vec4 c){return c.a>.001?c.rgb/c.a:vec3(0);}
 void main(){vec2 q=gl_FragCoord.xy,d=q/px,S=vec2(mod(s,97.)*13.7,mod(s,97.)*7.3);
  if(m==0){vec2 w=vec2(fbm(d/b+S),fbm(d/b+S+vec2(41,17)))-.5;o=tx(q+w*3.*a*px);}
  else if(m==1){vec2 w=vec2(fbm(d/18.+S),fbm(d/18.+S+vec2(41,17)))-.5;vec4 c=tx(q+w*3.*px);float g=fbm(d/b*.8+S*.6);o=c*smoothstep(a*.75-.1,a*.75+.1,g);}
  else if(m==2){vec4 c=tx(q);o=vec4(floor(un(c)*a+.5)/a*c.a,c.a);}
  else if(m==3){vec4 c=tx(q);vec3 rgb=un(c);float L=dot(rgb,vec3(.3,.59,.11));vec2 u=mat2(.707,-.707,.707,.707)*d/a;vec2 g=fract(u)-.5;float R=sqrt(max(1.-L,0.))*.72,D=length(g);float e=.5/(a*px)+.04;float dotv=smoothstep(R+e,R-e,D);vec3 tone=mix(vec3(1),col,dotv);o=vec4(mix(rgb,tone,b)*c.a,c.a);}
  else if(m==4){vec4 c=tx(q);float e=0.;for(int i=0;i<16;i++){float t2=float(i)*.3927;e=max(e,tx(q+vec2(cos(t2),sin(t2))*a*px).a);e=max(e,tx(q+vec2(cos(t2),sin(t2))*a*px*.5).a);}o=c+vec4(col,1)*e*(1.-c.a);}
  else if(m==5){vec2 w=vec2(fbm(d/b+S),fbm(d/b+S+vec2(41,17)))-.5;vec4 c=tx(q+w*3.*a*px);vec3 rgb=un(c);float bl=fbm(d/(b*1.6)+S*.4);rgb=mix(rgb,vec3(1),.12)*(.86+.3*bl);float ed=0.;for(int i=0;i<8;i++){float t2=float(i)*.785;ed+=tx(q+vec2(cos(t2),sin(t2))*5.*px).a;}ed=1.-ed/8.;rgb*=1.-ed*.35;o=vec4(rgb*c.a,c.a);}
  else{vec2 c0=r*.5;float tr=(h(vec2(mod(s,97.),3.))-.5)*2.*b*.01745;float cs=cos(tr),sn=sin(tr);vec2 sh=(vec2(h(vec2(mod(s,97.),1.)),h(vec2(mod(s,97.),2.)))-.5)*2.*a*px;o=tx(c0+mat2(cs,-sn,sn,cs)*(q-c0)+sh);}
 }`));
 gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))console.error(gl.getProgramInfoLog(p));gl.useProgram(p);this.u={};for(const k of['r','px','a','b','s','m','col'])this.u[k]=gl.getUniformLocation(p,k);
 gl.bindVertexArray(gl.createVertexArray());const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 for(const[k,v]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
 gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.clearColor(0,0,0,0);
 this.cv.addEventListener('webglcontextlost',e=>e.preventDefault());this.cv.addEventListener('webglcontextrestored',()=>this.init());},
 run(canvas,type,get,f,pxs){if(!this.gl)this.init();const gl=this.gl;if(!gl)return;const w=canvas.width,h=canvas.height,cv=this.cv;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}
  const d=FILTERS[type],rate=Math.max(1,Math.round(get('rate')||1)),cyc=Math.round(get('cycle')||0);let k=Math.floor(f/rate);if(cyc>0)k%=cyc;
  const s=k+(get('seed')||0)*11+1,u=this.u;let a=0,b=0;
  if(type==='boil'||type==='water'){a=get('amount');b=Math.max(1,get('scale'));}else if(type==='pencil'){a=get('amount');b=get('grain');}else if(type==='cel')a=get('levels');else if(type==='halftone'){a=Math.max(1,get('size'));b=get('amount');}else if(type==='outline')a=get('width');else if(type==='jitter'){a=get('amount');b=get('turn');}
  const c=parseInt((get('color')||'#000000').slice(1),16);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.uniform2f(u.r,w,h);gl.uniform1f(u.px,pxs);gl.uniform1f(u.a,a);gl.uniform1f(u.b,b);gl.uniform1f(u.s,s);gl.uniform1i(u.m,d.mode);gl.uniform3f(u.col,(c>>16)/255,((c>>8)&255)/255,(c&255)/255);
  gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);gl.flush();
  const x=canvas.getContext('2d');x.save();x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.filter='none';x.globalCompositeOperation='copy';x.drawImage(cv,0,0);x.restore();}};
const frameScale=(ctx)=>ctx._frameScale||1;
const ADJUST=new Set(['grade','bloom','chroma','impact','grain',...Object.keys(FX).filter(k=>FX[k].filter)]);
function layerFilter(l,f,s){const b=val(l,'blur',f),br=val(l,'bright',f),sa=val(l,'sat',f);if(!b&&br===1&&sa===1)return'none';return`${b?`blur(${b*s}px) `:''}${br!==1?`brightness(${br}) `:''}${sa!==1?`saturate(${sa})`:''}`;}
function drawBody(cx,l,f,mat,o,sc){
 const d=DOC();
 if(l.type==='draw'){
  const c=celAt(l,f),live=o.live&&o.live.layer===l.id?o.live:null;
  cx.setTransform(...mat);
  if(live){cx.drawImage(live.base,live.ox,live.oy);if(live.stroke){const ga=cx.globalAlpha;cx.globalAlpha=ga*live.alpha;cx.drawImage(live.stroke,live.ox,live.oy);cx.globalAlpha=ga;}}
  else if(c&&c.a){const b=Bitmaps.get(c.a);b&&cx.drawImage(b.canvas,c.x,c.y);}
 }else if(l.type==='image'){const b=Bitmaps.get(l.asset);cx.setTransform(...mat);b&&cx.drawImage(b.canvas,0,0);}
 else if(l.type==='solid'){cx.setTransform(...mat);cx.fillStyle=l.color;cx.fillRect(0,0,d.w,d.h);}
 else if(l.type==='text'){cx.setTransform(...mat);drawText(cx,l,f,M.scale(mat));}
 else if(l.type==='rig')drawRig(cx,l,f,mat,o);
}
function renderLayer(ctx,l,sc,f,o,cam){
 const d=DOC(),F=stepF(l,f);
 if(l.type==='fx'){
  if(ADJUST.has(l.fx)){if(o.useCam!==false)adjustFX(ctx,l,FX[l.fx].filter?f:F);return;}
  const op=val(l,'opacity',F);
  ctx.save();ctx.setTransform(...o.base);ctx.globalCompositeOperation=l.blend;ctx.globalAlpha=1;rigFX(ctx,l,F,d.w,d.h);ctx.restore();return;
 }
 const mat=layerMatrix(l,sc,F,o.base,o.useCam!==false,cam);
 const alpha=val(l,'opacity',F),s=M.scale(mat);
 if(alpha<=.001)return;
 const pics=(l.filters||[]).filter(x=>x.on!==false),tint=val(l,'tint',F),filter=layerFilter(l,F,s),buffered=tint>0||pics.length>0||(l.type==='rig'&&(alpha<1||filter!=='none'||l.blend!=='source-over'));
 if(!buffered){
  ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation=l.blend;ctx.filter=filter;drawBody(ctx,l,F,mat,o,sc);ctx.restore();return;
 }
 const b=Pool.get(ctx.canvas.width,ctx.canvas.height),x=b.getContext('2d');x._frameScale=ctx._frameScale;
 drawBody(x,l,F,mat,o,sc);
 x.setTransform(1,0,0,1,0,0);
 if(tint>0){x.globalCompositeOperation='source-atop';x.globalAlpha=tint;x.fillStyle=l.tintColor;x.fillRect(0,0,b.width,b.height);x.globalCompositeOperation='source-over';x.globalAlpha=1;}
 /* filters use the real frame, not the stepped one, so lines keep boiling on held drawings */
 for(const q of pics)FXGL.run(b,q.type,k=>val(q,k,f),f,frameScale(ctx));
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=alpha;ctx.globalCompositeOperation=l.blend;ctx.filter=filter;ctx.drawImage(b,0,0);ctx.restore();
 Pool.put(b);
}
function ghost(ctx,l,sc,f,o,cam,color,alpha){
 const b=Pool.get(ctx.canvas.width,ctx.canvas.height),x=b.getContext('2d');
 const F=stepF(l,f),mat=layerMatrix(l,sc,F,o.base,o.useCam!==false,cam);
 drawBody(x,l,F,mat,{...o,live:null},sc);x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=.75;x.fillStyle=color;x.fillRect(0,0,b.width,b.height);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=alpha;ctx.drawImage(b,0,0);ctx.restore();Pool.put(b);
}
function renderScene(ctx,sc,f,o){
 const d=DOC();
 ctx._frameScale=M.scale(o.base);
 ctx.save();ctx.setTransform(...o.base);
 if(o.clip!==false){ctx.beginPath();ctx.rect(0,0,d.w,d.h);ctx.clip();}
 ctx.fillStyle=sc.bg;ctx.fillRect(0,0,d.w,d.h);
 const cam=camState(sc,f);
 for(const l of sc.layers){
  if(!l.vis)continue;
  if(o.onion&&o.onion.layer===l.id){
   for(let k=o.onion.n;k>=1;k--){const st=o.onion.gap;const al=.34*(1-(k-1)/o.onion.n);
    let pf=f-k*st,nf=f+k*st;
    if(l.type==='draw'){const cs=l.cels,i=cs.indexOf(celAt(l,f));pf=i-k>=0?cs[i-k].f:-1;nf=i+k<cs.length?cs[i+k].f:-1;}
    if(pf>=0)ghost(ctx,l,sc,pf,o,cam,'#ff5a4e',al);if(nf>=0&&nf<sc.dur)ghost(ctx,l,sc,nf,o,cam,'#46b4ff',al);}
  }
  renderLayer(ctx,l,sc,f,o,cam);
 }
 ctx.restore();
}
/* ---------- whole-project timing and transitions ---------- */
const sceneStart=(i)=>{let g=0;for(let k=0;k<i;k++)g+=DOC().scenes[k].dur;return g;};
const totalFrames=()=>DOC().scenes.reduce((a,s)=>a+s.dur,0);
function locate(g){const ss=DOC().scenes;let t=0;for(let i=0;i<ss.length;i++){if(g<t+ss[i].dur)return{i,scene:ss[i],local:g-t};t+=ss[i].dur;}const i=ss.length-1;return{i,scene:ss[i],local:ss[i].dur-1};}
function renderProject(ctx,g,o){
 const d=DOC(),{i,scene,local}=locate(g),ss=d.scenes;
 renderScene(ctx,scene,local,o);
 let T=null,p=0,other=null,oF=0;
 const c=sceneStart(i);
 if(i>0&&scene.trans.type!=='cut'&&g<c+scene.trans.dur/2){T=scene.trans;p=(g-(c-T.dur/2))/T.dur;other=ss[i-1];oF=other.dur-1;}
 else if(i<ss.length-1){const n=ss[i+1],c2=c+scene.dur;if(n.trans.type!=='cut'&&g>=c2-n.trans.dur/2){T=n.trans;p=(g-(c2-T.dur/2))/T.dur;other=n;oF=0;}}
 if(!T)return;
 const a=1-Math.abs(2*p-1);
 ctx.save();ctx.setTransform(...o.base);ctx.beginPath();ctx.rect(0,0,d.w,d.h);ctx.clip();
 if(T.type==='black'||T.type==='white'){ctx.globalAlpha=a;ctx.fillStyle=T.type==='black'?'#000':'#fff';ctx.fillRect(0,0,d.w,d.h);}
 else if(T.type==='flash'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.pow(a,1.5);ctx.fillStyle='#fff';ctx.fillRect(0,0,d.w,d.h);}
 else{const b=Pool.get(ctx.canvas.width,ctx.canvas.height),x=b.getContext('2d');renderScene(x,other,oF,{...o,onion:null});
  ctx.setTransform(1,0,0,1,0,0);
  if(T.type==='cross'){ctx.globalAlpha=p<.5?p:1-p;ctx.drawImage(b,0,0);}
  else if(T.type==='wipe'){const w=ctx.canvas.width,h=ctx.canvas.height,inA=p<.5;const X=p*w;if(inA)ctx.drawImage(b,0,0,X,h,0,0,X,h);else ctx.drawImage(b,X,0,w-X,h,X,0,w-X,h);}
  Pool.put(b);}
 ctx.restore();
}
