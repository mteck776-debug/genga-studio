/* ---------- skeleton ---------- */
const BONE_P=()=>({rot:0,x:0,y:0,sx:1,sy:1});
function newBone(name,parent,x,y,rot,len){return{id:uid('b'),name,parent:parent||null,x,y,rot,len,p:BONE_P(),tr:{}};}
function newPart(name,assetId,x,y){const b=Bitmaps.get(assetId);return{id:uid('p'),name,assets:[assetId],x,y,w:b.w,h:b.h,bone:null,mesh:null,density:0,hidden:false,bound:null,p:{opacity:1,swap:0,deform:null},tr:{}};}
/* pose: map bone id -> {m world, skin (pose * inverse rest)}; rest=true gives bind pose */
function rigPose(rig,f,rest,overrides){
 const out={};
 const restM={};
 for(const b of rig.bones){
  const local=M.mul(M.t(b.x,b.y),M.r(b.rot));
  const pr=b.parent&&restM[b.parent];
  restM[b.id]=pr?M.mul(pr,local):local;
  let m;
  if(rest)m=restM[b.id];
  else{
   const ov=overrides&&overrides[b.id];
   const dx=ov&&'x' in ov?ov.x:val(b,'x',f), dy=ov&&'y' in ov?ov.y:val(b,'y',f), dr=ov&&'rot' in ov?ov.rot:val(b,'rot',f);
   const sx=val(b,'sx',f), sy=val(b,'sy',f);
   const l=M.chain(M.t(b.x+dx,b.y+dy),M.r(b.rot+dr),M.s(sx,sy));
   const p=b.parent&&out[b.parent];
   m=p?M.mul(p.m,l):l;
  }
  out[b.id]={m,skin:M.mul(m,M.inv(restM[b.id])),rest:restM[b.id],b};
 }
 return out;
}
const boneTip=(pose,b)=>M.ap(pose[b.id].m,b.len,0), boneHead=(pose,b)=>M.ap(pose[b.id].m,0,0);
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1e-6;const t=clamp(((px-ax)*dx+(py-ay)*dy)/l,0,1);return Math.hypot(px-ax-dx*t,py-ay-dy*t);}
/* ---------- mesh ---------- */
function partAlpha(part){
 const c=mkCanvas(part.w,part.h),x=c.getContext('2d',{willReadFrequently:true});
 part.assets.forEach(a=>{const b=Bitmaps.get(a);b&&x.drawImage(b.canvas,0,0);});
 return x.getImageData(0,0,c.width,c.height).data;
}
/* grid clipped to the painted area. Empty cells are dropped so holes and gaps stay separate. */
function buildMesh(part,density){
 const w=part.w,h=part.h,cell=Math.max(6,density||Math.round(Math.max(w,h)/18));
 part.density=cell;
 const cols=Math.max(1,Math.ceil(w/cell)),rows=Math.max(1,Math.ceil(h/cell));
 const d=partAlpha(part),on=new Uint8Array(cols*rows);
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const x0=Math.floor(c*w/cols),x1=Math.ceil((c+1)*w/cols),y0=Math.floor(r*h/rows),y1=Math.ceil((r+1)*h/rows);
  outer:for(let y=y0;y<y1;y+=2)for(let x=x0;x<x1;x+=2)if(d[(y*Math.ceil(w)+x)*4+3]>6){on[r*cols+c]=1;break outer;}
 }
 const dil=on.slice();
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(on[r*cols+c])for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const R=r+a,C=c+b;if(R>=0&&C>=0&&R<rows&&C<cols)dil[R*cols+C]=1;}
 const idx=new Map(),v=[],uv=[],t=[];
 const vid=(c,r)=>{const k=r*(cols+1)+c;if(idx.has(k))return idx.get(k);const i=v.length/2;idx.set(k,i);const u=c/cols,w2=r/rows;v.push(Math.round((part.x+u*w)*10)/10,Math.round((part.y+w2*h)*10)/10);uv.push(+u.toFixed(5),+w2.toFixed(5));return i;};
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)if(dil[r*cols+c]){const a=vid(c,r),b=vid(c+1,r),e=vid(c+1,r+1),g=vid(c,r+1);t.push(a,b,e,a,e,g);}
 part.mesh={v,uv,t,bn:[],wi:[],ww:[],cell};
 delete part.tr.deform;part.p.deform=null;
}
/* automatic skin weights: a bone's pull falls off with distance from its segment */
function autoWeights(rig,part,boneIds){
 const ms=part.mesh;if(!ms)return;
 const bones=(boneIds&&boneIds.length?boneIds:rig.bones.map(b=>b.id)).map(id=>rig.bones.find(b=>b.id===id)).filter(Boolean);
 const pose=rigPose(rig,0,true);
 const segs=bones.map(b=>[...boneHead(pose,b),...boneTip(pose,b)]);
 const scale=Math.max(part.density||20,Math.min(part.w,part.h)*.14);
 ms.bn=bones.map(b=>b.id);ms.wi=[];ms.ww=[];
 const n=ms.v.length/2;
 for(let i=0;i<n;i++){
  const x=ms.v[i*2],y=ms.v[i*2+1],all=segs.map((s,j)=>{const d=segDist(x,y,s[0],s[1],s[2],s[3])/scale;return[j,1/Math.pow(1+d*d,3)];}).sort((a,b)=>b[1]-a[1]).slice(0,4);
 const top=all[0][1];const kept=all.filter(a=>a[1]>top*.04),sum=kept.reduce((s,a)=>s+a[1],0);
  for(let k=0;k<4;k++){ms.wi.push(kept[k]?kept[k][0]:0);ms.ww.push(kept[k]?+(kept[k][1]/sum).toFixed(3):0);}
 }
}
function rigidWeights(part){
 const ms=part.mesh;if(!ms)return;ms.bn=part.bone?[part.bone]:[];ms.wi=[];ms.ww=[];
 const n=ms.v.length/2;for(let i=0;i<n;i++){ms.wi.push(0,0,0,0);ms.ww.push(part.bone?1:0,0,0,0);}
}
/* deformed mesh positions in rig space */
function meshPositions(part,pose,f,rest){
 const ms=part.mesh,n=ms.v.length/2,out=new Float32Array(n*2);
 let def=rest?null:val(part,'deform',f);
 if(def&&def.length!==n*2)def=null;
 const sk=ms.bn.map(id=>pose[id]?pose[id].skin:null);
 const fallback=part.bone&&pose[part.bone]?pose[part.bone].skin:null;
 for(let i=0;i<n;i++){
  const x=ms.v[i*2]+(def?def[i*2]:0),y=ms.v[i*2+1]+(def?def[i*2+1]:0);
  let X=0,Y=0,W=0;
  for(let k=0;k<4;k++){const w=ms.ww[i*4+k];if(!w)continue;const m=sk[ms.wi[i*4+k]];if(!m)continue;X+=w*(m[0]*x+m[2]*y+m[4]);Y+=w*(m[1]*x+m[3]*y+m[5]);W+=w;}
  if(W<.001){if(fallback){X=fallback[0]*x+fallback[2]*y+fallback[4];Y=fallback[1]*x+fallback[3]*y+fallback[5];}else{X=x;Y=y;}}
  else if(W<.999){X/=W;Y/=W;}
  out[i*2]=X;out[i*2+1]=Y;
 }
 return out;
}
/* inverse kinematics (CCD). chain = bones from tip to root; target in rig space. Returns rotation offsets. */
function solveIK(rig,chain,target,f,base){
 const ov=Object.assign({},base);
 chain.forEach(b=>{if(!ov[b.id])ov[b.id]={};if(!('rot' in ov[b.id]))ov[b.id].rot=val(b,'rot',f);});
 const tipB=chain[0];
 for(let it=0;it<24;it++){
  for(const b of chain){
   const pose=rigPose(rig,f,false,ov),tip=boneTip(pose,tipB),h=boneHead(pose,b);
   const a1=Math.atan2(tip[1]-h[1],tip[0]-h[0]),a2=Math.atan2(target[1]-h[1],target[0]-h[0]);
   let d=(a2-a1)*180/Math.PI;while(d>180)d-=360;while(d<-180)d+=360;
   ov[b.id].rot+=d*.8;
  }
  const pose=rigPose(rig,f,false,ov),tip=boneTip(pose,tipB);
  if(Math.hypot(tip[0]-target[0],tip[1]-target[1])<.4)break;
 }
 return ov;
}
function ikChain(rig,tip,n){const c=[];let b=tip;while(b&&c.length<n){c.push(b);b=b.parent?rig.bones.find(x=>x.id===b.parent):null;}return c;}
/* ---------- WebGL mesh painter, composited onto the 2D canvas part by part ---------- */
const GLM={cv:document.createElement('canvas'),gl:null,tex:new Map(),init(){
 const gl=this.gl=this.cv.getContext('webgl2',{premultipliedAlpha:true,alpha:true,antialias:true,preserveDrawingBuffer:true});
 if(!gl)return;
 const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o;};
 const p=this.prog=gl.createProgram();
 gl.attachShader(p,sh(gl.VERTEX_SHADER,`#version 300 es
 in vec2 p;in vec2 u;out vec2 v;uniform vec2 r;void main(){v=u;gl_Position=vec4(p.x/r.x*2.-1.,1.-p.y/r.y*2.,0,1);}`));
 gl.attachShader(p,sh(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;in vec2 v;uniform sampler2D t;out vec4 o;void main(){o=texture(t,v);}`));
 gl.linkProgram(p);gl.useProgram(p);
 this.uR=gl.getUniformLocation(p,'r');this.buf=gl.createBuffer();this.ibo=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ibo);
 const a=gl.getAttribLocation(p,'p'),b=gl.getAttribLocation(p,'u');
 gl.enableVertexAttribArray(a);gl.enableVertexAttribArray(b);gl.vertexAttribPointer(a,2,gl.FLOAT,false,16,0);gl.vertexAttribPointer(b,2,gl.FLOAT,false,16,8);
 gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);
 gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
 this.cv.addEventListener('webglcontextlost',e=>e.preventDefault());
 this.cv.addEventListener('webglcontextrestored',()=>{this.tex.clear();this.init();});
},
 texture(id){let t=this.tex.get(id);if(t)return t;const gl=this.gl,b=Bitmaps.get(id);if(!b)return null;
  t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,b.canvas);gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  this.tex.set(id,t);return t;},
 draw(ctx,assetId,pos,part,mat){
  if(!this.gl)this.init();const gl=this.gl;if(!gl)return;
  const W=ctx.canvas.width,H=ctx.canvas.height,cv=this.cv;
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;gl.viewport(0,0,W,H);}
  const ms=part.mesh,n=pos.length/2,data=new Float32Array(n*4);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let i=0;i<n;i++){const x=mat[0]*pos[i*2]+mat[2]*pos[i*2+1]+mat[4],y=mat[1]*pos[i*2]+mat[3]*pos[i*2+1]+mat[5];data[i*4]=x;data[i*4+1]=y;data[i*4+2]=ms.uv[i*2];data[i*4+3]=ms.uv[i*2+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  x0=clamp(Math.floor(x0)-2,0,W);y0=clamp(Math.floor(y0)-2,0,H);x1=clamp(Math.ceil(x1)+2,0,W);y1=clamp(Math.ceil(y1)+2,0,H);
  if(x1<=x0||y1<=y0)return;
  const tex=this.texture(assetId);if(!tex)return;
  gl.bindBuffer(gl.ARRAY_BUFFER,this.buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(ms.t),gl.DYNAMIC_DRAW);
  gl.uniform2f(this.uR,W,H);gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.enable(gl.SCISSOR_TEST);gl.scissor(x0,H-y1,x1-x0,y1-y0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES,ms.t.length,gl.UNSIGNED_INT,0);gl.disable(gl.SCISSOR_TEST);gl.flush();
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(cv,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0);ctx.restore();
 }};
