/* ---------- the sample character, painted in code so a new file has something to play with ---------- */
function paintBitmap(x,y,w,h,fn){const c=mkCanvas(w,h),g=c.getContext('2d');g.translate(-x,-y);g.lineJoin='round';g.lineCap='round';fn(g);return addBitmap(c);}
function buildSampleRig(){
 const INK='#35222e',SKIN='#fde6d8',SK2='#f4c2b0',HAIR='#6a3f3a',HA2='#8f5a4d',HA3='#4c2a2e',NAVY='#2c3a63',NV2='#222d50',WHITE='#fbf7f2',WH2='#d9d7e6',RED='#d6404e';
 const P=[];const add=(name,x,y,w,h,fn)=>{const a=paintBitmap(x,y,w,h,fn);const p=newPart(name,a,x,y);P.push(p);return p;};
 const line=(g,w=3.2)=>{g.strokeStyle=INK;g.lineWidth=w;g.stroke();};
 const shape=(g,f,fill,lw=3.2)=>{g.beginPath();f(g);g.closePath();g.fillStyle=fill;g.fill();if(lw)line(g,lw);};
 const hairBack=add('Hair back',730,130,460,760,g=>{shape(g,g=>{g.moveTo(960,145);g.bezierCurveTo(1110,140,1170,260,1168,420);g.bezierCurveTo(1168,560,1178,700,1150,860);g.lineTo(1090,800);g.lineTo(1040,866);g.lineTo(985,810);g.lineTo(930,870);g.lineTo(880,806);g.lineTo(825,862);g.lineTo(775,860);g.bezierCurveTo(742,700,752,560,752,420);g.bezierCurveTo(750,260,810,140,960,145);},HA3);});
 const armL=add('Arm (left)',660,590,220,500,g=>{shape(g,g=>{g.moveTo(790,610);g.bezierCurveTo(838,612,852,652,842,700);g.lineTo(812,860);g.lineTo(838,1000);g.bezierCurveTo(846,1040,816,1062,790,1056);g.lineTo(750,1040);g.lineTo(722,870);g.lineTo(734,690);g.bezierCurveTo(736,636,756,610,790,610);},WHITE);
  shape(g,g=>{g.moveTo(752,1032);g.lineTo(838,1012);g.lineTo(842,1040);g.lineTo(762,1062);},NAVY,2.5);
  shape(g,g=>{g.moveTo(768,1056);g.bezierCurveTo(762,1080,776,1088,800,1086);g.bezierCurveTo(824,1084,838,1070,830,1040);},SKIN,2.6);});
 const armR=add('Arm (right)',1040,590,220,500,g=>{g.save();g.translate(1920,0);g.scale(-1,1);shape(g,g=>{g.moveTo(790,610);g.bezierCurveTo(838,612,852,652,842,700);g.lineTo(812,860);g.lineTo(838,1000);g.bezierCurveTo(846,1040,816,1062,790,1056);g.lineTo(750,1040);g.lineTo(722,870);g.lineTo(734,690);g.bezierCurveTo(736,636,756,610,790,610);},WHITE);
  shape(g,g=>{g.moveTo(752,1032);g.lineTo(838,1012);g.lineTo(842,1040);g.lineTo(762,1062);},NAVY,2.5);
  shape(g,g=>{g.moveTo(768,1056);g.bezierCurveTo(762,1080,776,1088,800,1086);g.bezierCurveTo(824,1084,838,1070,830,1040);},SKIN,2.6);g.restore();});
 const neck=add('Neck',895,450,130,190,g=>{shape(g,g=>{g.moveTo(918,460);g.lineTo(1002,460);g.lineTo(1006,590);g.bezierCurveTo(1010,620,910,620,914,590);},SKIN);g.beginPath();g.moveTo(918,470);g.lineTo(1002,470);g.bezierCurveTo(1000,530,920,530,918,470);g.fillStyle=SK2;g.fill();});
 const torso=add('Torso',740,570,440,530,g=>{
  shape(g,g=>{g.moveTo(905,588);g.bezierCurveTo(860,610,800,610,772,650);g.lineTo(790,1098);g.lineTo(1130,1098);g.lineTo(1148,650);g.bezierCurveTo(1120,610,1060,610,1015,588);g.lineTo(960,680);},WHITE);
  g.beginPath();g.moveTo(1030,700);g.bezierCurveTo(1090,780,1080,960,1120,1096);g.lineTo(1130,1096);g.lineTo(1146,660);g.closePath();g.fillStyle=WH2;g.fill();
  shape(g,g=>{g.moveTo(903,588);g.lineTo(790,640);g.lineTo(838,740);g.lineTo(960,782);g.lineTo(1082,740);g.lineTo(1130,640);g.lineTo(1017,588);g.lineTo(960,680);},NAVY);
  g.strokeStyle=WHITE;g.lineWidth=4;g.beginPath();g.moveTo(800,642);g.lineTo(846,732);g.lineTo(960,770);g.lineTo(1074,732);g.lineTo(1120,642);g.stroke();
  shape(g,g=>{g.moveTo(960,700);g.bezierCurveTo(910,676,880,700,892,742);g.bezierCurveTo(910,752,940,736,960,716);g.bezierCurveTo(980,736,1010,752,1028,742);g.bezierCurveTo(1040,700,1010,676,960,700);},RED);
  shape(g,g=>{g.moveTo(948,712);g.lineTo(922,830);g.lineTo(955,812);g.lineTo(960,722);},RED,2.6);shape(g,g=>{g.moveTo(972,712);g.lineTo(998,830);g.lineTo(965,812);g.lineTo(960,722);},RED,2.6);
  shape(g,g=>{g.ellipse(960,708,16,14,0,0,7);},RED,2.6);});
 const faceShape=g=>{g.moveTo(842,292);g.bezierCurveTo(838,380,868,440,960,488);g.bezierCurveTo(1052,440,1082,380,1078,292);g.bezierCurveTo(1078,190,1020,170,960,170);g.bezierCurveTo(900,170,842,190,842,292);};
 const head=add('Face',825,160,270,340,g=>{shape(g,faceShape,SKIN,3.4);
  g.fillStyle='rgba(240,120,120,.32)';g.beginPath();g.ellipse(884,395,34,17,0,0,7);g.ellipse(1036,395,34,17,0,0,7);g.fill();
  g.strokeStyle='rgba(216,90,90,.6)';g.lineWidth=2.2;for(const X of[872,884,896,1024,1036,1048]){g.beginPath();g.moveTo(X+4,386);g.lineTo(X-3,402);g.stroke();}
  g.strokeStyle=INK;g.lineWidth=2.4;g.beginPath();g.moveTo(958,398);g.lineTo(964,404);g.stroke();
  g.lineWidth=3.2;g.strokeStyle=HA3;g.beginPath();g.moveTo(868,288);g.quadraticCurveTo(900,270,936,288);g.moveTo(984,288);g.quadraticCurveTo(1020,270,1052,288);g.stroke();});
 const openEye=(g,X,flip)=>{const IR='#2f7f8f',I2='#7fd3d1';g.save();g.translate(X,350);g.scale(flip,1);
  g.fillStyle='#fff';g.beginPath();g.moveTo(-42,0);g.bezierCurveTo(-30,-40,32,-44,44,-8);g.bezierCurveTo(36,30,-28,34,-42,0);g.fill();
  const gr=g.createLinearGradient(0,-36,0,38);gr.addColorStop(0,'#1d3b4f');gr.addColorStop(.55,IR);gr.addColorStop(1,I2);g.fillStyle=gr;g.beginPath();g.ellipse(2,-1,27,37,0,0,7);g.fill();g.strokeStyle=INK;g.lineWidth=2.4;g.stroke();
  g.fillStyle='#12202c';g.beginPath();g.ellipse(2,-3,13,19,0,0,7);g.fill();
  g.fillStyle='#fff';g.beginPath();g.ellipse(-9*flip,-18,10,13,.3,0,7);g.fill();g.beginPath();g.ellipse(13*flip,16,5,6.5,0,0,7);g.fill();
  g.strokeStyle=INK;g.lineWidth=7.5;g.beginPath();g.moveTo(-47,6);g.bezierCurveTo(-34,-46,34,-50,50,-12);g.stroke();
  g.lineWidth=3.6;g.beginPath();g.moveTo(50,-12);g.lineTo(62,-5);g.moveTo(-14,33);g.quadraticCurveTo(10,38,30,27);g.stroke();g.restore();};
 const eyes=add('Eyes',835,290,250,120,g=>{openEye(g,902,-1);openEye(g,1018,1);});
 const eyesShut=paintBitmap(835,290,250,120,g=>{g.strokeStyle=INK;g.lineWidth=7;g.beginPath();g.moveTo(860,352);g.quadraticCurveTo(902,380,944,352);g.moveTo(976,352);g.quadraticCurveTo(1018,380,1060,352);g.stroke();g.lineWidth=3.4;g.beginPath();g.moveTo(860,352);g.lineTo(848,344);g.moveTo(1060,352);g.lineTo(1072,344);g.stroke();});
 const eyesHappy=paintBitmap(835,290,250,120,g=>{g.strokeStyle=INK;g.lineWidth=7;g.beginPath();g.moveTo(860,362);g.quadraticCurveTo(902,316,944,362);g.moveTo(976,362);g.quadraticCurveTo(1018,316,1060,362);g.stroke();});
 eyes.assets.push(eyesShut,eyesHappy);
 const mouth=add('Mouth',915,415,90,50,g=>{g.strokeStyle=INK;g.lineWidth=3;g.beginPath();g.moveTo(942,436);g.quadraticCurveTo(960,446,978,436);g.stroke();});
 mouth.assets.push(paintBitmap(915,415,90,50,g=>{shape(g,g=>{g.moveTo(936,430);g.quadraticCurveTo(960,436,984,430);g.bezierCurveTo(982,462,938,462,936,430);},'#b8404c',2.8);g.fillStyle='#f8a5a5';g.beginPath();g.ellipse(960,450,12,5,0,0,7);g.fill();}));
 const sideL=add('Hair lock (left)',770,270,130,470,g=>{shape(g,g=>{g.moveTo(860,280);g.bezierCurveTo(800,380,790,520,812,728);g.bezierCurveTo(850,640,884,480,880,330);},HAIR);g.strokeStyle=HA2;g.lineWidth=7;g.beginPath();g.moveTo(848,340);g.bezierCurveTo(824,430,816,520,822,620);g.stroke();});
 const sideR=add('Hair lock (right)',1020,270,130,470,g=>{g.save();g.translate(1920,0);g.scale(-1,1);shape(g,g=>{g.moveTo(860,280);g.bezierCurveTo(800,380,790,520,812,728);g.bezierCurveTo(850,640,884,480,880,330);},HAIR);g.strokeStyle=HA2;g.lineWidth=7;g.beginPath();g.moveTo(848,340);g.bezierCurveTo(824,430,816,520,822,620);g.stroke();g.restore();});
 const bangs=add('Fringe',800,120,320,240,g=>{shape(g,g=>{g.moveTo(960,134);g.bezierCurveTo(1060,126,1110,200,1104,330);g.lineTo(1066,272);g.lineTo(1052,330);g.lineTo(1006,246);g.lineTo(990,310);g.lineTo(952,240);g.lineTo(922,318);g.lineTo(906,256);g.lineTo(858,336);g.lineTo(846,274);g.lineTo(816,330);g.bezierCurveTo(810,200,860,126,960,134);},HAIR);
  g.strokeStyle=HA2;g.lineWidth=9;g.beginPath();g.moveTo(866,205);g.quadraticCurveTo(960,160,1056,206);g.stroke();
  g.fillStyle=RED;g.strokeStyle=INK;g.lineWidth=2.6;g.beginPath();g.ellipse(1062,218,20,11,.7,0,7);g.fill();g.stroke();});
 const rig={bones:[],parts:P};
 const mk=(name,parent,hx,hy,tx,ty)=>{const pose=rigPose(rig,0,true),pm=parent?pose[parent.id].m:M.id(),a=M.ap(M.inv(pm),hx,hy),world=Math.atan2(ty-hy,tx-hx)*180/Math.PI,pr=parent?Math.atan2(pm[1],pm[0])*180/Math.PI:0;const b=newBone(name,parent&&parent.id,a[0],a[1],world-pr,Math.hypot(tx-hx,ty-hy));rig.bones.push(b);return b;};
 const hip=mk('Hips',null,960,1100,960,880),chest=mk('Chest',hip,960,880,960,640),nk=mk('Neck',chest,960,640,960,520),hd=mk('Head',nk,960,520,960,250);
 const backH=mk('Hair back',hd,960,420,960,840);
 const l1=mk('Lock L top',hd,850,300,822,500),l2=mk('Lock L tip',l1,822,500,812,725),r1=mk('Lock R top',hd,1070,300,1098,500),r2=mk('Lock R tip',r1,1098,500,1108,725);
 const fr=mk('Fringe',hd,960,160,960,300);
 const ua=mk('Upper arm L',chest,790,650,768,860),fa=mk('Forearm L',ua,768,860,796,1060),ub=mk('Upper arm R',chest,1130,650,1152,860),fb=mk('Forearm R',ub,1152,860,1124,1060);
 const smooth=(p,bs,cell)=>{buildMesh(p,cell);p.bound=bs.map(b=>b.id);autoWeights(rig,p,p.bound);};
 const rigid=(p,b)=>{p.bone=b.id;};
 smooth(hairBack,[hd,backH],24);smooth(armL,[ua,fa],18);smooth(armR,[ub,fb],18);smooth(sideL,[l1,l2],14);smooth(sideR,[r1,r2],14);smooth(bangs,[hd,fr],16);
 rigid(neck,nk);rigid(torso,chest);rigid(head,hd);rigid(eyes,hd);rigid(mouth,hd);
 return{rig,b:{hip,chest,nk,hd,backH,l1,l2,r1,r2,fr,ua,fa,ub,fb},p:{eyes,mouth}};
}
function sampleBackdrops(){
 const hills=paintBitmap(-200,0,2320,1080,g=>{
  const ridge=(y,a,col,seed)=>{g.beginPath();g.moveTo(-200,1080);for(let x=-200;x<=2120;x+=24)g.lineTo(x,y+Math.sin(x*.0033+seed)*a+Math.sin(x*.011+seed*2)*a*.35);g.lineTo(2120,1080);g.closePath();g.fillStyle=col;g.fill();};
  ridge(640,70,'rgba(140,110,160,.75)',1);ridge(720,60,'#7d6a93',2.4);ridge(810,46,'#5d5580',4);ridge(900,34,'#3f4068',5.3);});
 const blossom=paintBitmap(-240,-120,2400,1320,g=>{
  const trunk=(x,y,ang,len,w,d)=>{const X=x+Math.cos(ang)*len,Y=y+Math.sin(ang)*len;g.strokeStyle='#3b2a3a';g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x,y);g.quadraticCurveTo((x+X)/2+rnd(x)*30-15,(y+Y)/2,X,Y);g.stroke();
   if(d>0){trunk(X,Y,ang-.45-rnd(y)*.3,len*.74,w*.68,d-1);trunk(X,Y,ang+.35+rnd(x)*.3,len*.7,w*.62,d-1);}
   else for(let i=0;i<7;i++){const a=rnd(i+x)*6.3,r=rnd(i*2+y)*70;g.fillStyle=['#ffc9d6','#ffb3c7','#ffdfe6','#f79db8'][i%4];g.beginPath();g.arc(X+Math.cos(a)*r,Y+Math.sin(a)*r,16+rnd(i+y)*26,0,7);g.fill();}};
  trunk(-120,1180,-1.2,430,70,5);trunk(2080,1180,-1.95,380,60,5);});
 return{hills,blossom};
}
function cloneRigLayer(l){const c=JSON.parse(JSON.stringify(l));c.id=uid('l');const map={};c.rig.bones.forEach(b=>{const n=uid('b');map[b.id]=n;b.id=n;});c.rig.bones.forEach(b=>{if(b.parent)b.parent=map[b.parent];});c.rig.parts.forEach(p=>{p.id=uid('p');if(p.bone)p.bone=map[p.bone];if(p.bound)p.bound=p.bound.map(i=>map[i]);if(p.mesh)p.mesh.bn=p.mesh.bn.map(i=>map[i]);});return c;}
function fxLayer(kind,over={},name){const f=FX[kind];const l=newLayer('fx',name||f.label,{fx:kind,screen:true});l.p=Object.assign({},f.p,over);return l;}
function textLayer(value,x,y,o={}){const l=newLayer('text',value.split('\n')[0].slice(0,18)||'Text',{screen:true});l.p.x=x;l.p.y=y;l.p.reveal=1;l.text=Object.assign({value,font:'Shippori Mincho',weight:700,size:90,color:'#ffffff',stroke:'#000000',strokeW:0,glow:0,glowColor:'#ffffff',align:'center',vertical:false,spacing:6,lead:1.3},o);return l;}
function sampleDoc(){
 const d=newDoc('Sample trailer');const{hills,blossom}=sampleBackdrops();
 const pre=(a,x,y,name,par)=>{const l=newLayer('image',name,{asset:a,parallax:par});const b=Bitmaps.get(a);l.p.ax=0;l.p.ay=0;l.p.x=x;l.p.y=y;return l;};
 /* Cut 1: wide establishing shot */
 const c1=d.scenes[0];c1.name='Cut 1  Spring';c1.dur=96;
 c1.layers.push(fxLayer('gradient',{top:'#31508c',mid:'#e7a59d',low:'#fde0b4'}),fxLayer('rays',{opacity:.3}),pre(hills,-200,0,'Far hills',.25),pre(blossom,-240,-120,'Blossom branches',.9),fxLayer('petals',{count:70}));
 const t1=textLayer('桜の季節に',1500,180,{vertical:true,size:84,color:'#fff8f0',spacing:22,glow:18,glowColor:'#7a4560',align:'center'});t1.name='Vertical title';
 setKey(t1,'opacity',12,0,[0,.55,.45,1]);setKey(t1,'opacity',36,1);setKey(t1,'reveal',12,0);setKey(t1,'reveal',48,1);t1.p.opacity=1;
 const t1b=textLayer('When the cherry trees bloomed',960,890,{font:'Zen Kaku Gothic New',weight:400,size:34,spacing:18,color:'#fff8f0',glow:12,glowColor:'#3a2a4a'});
 setKey(t1b,'opacity',40,0);setKey(t1b,'opacity',60,1);
 c1.layers.push(t1,t1b,fxLayer('letterbox',{amount:.1}),fxLayer('vignette',{amount:.4}));
 setKey(c1.camera,'y',0,70,[.42,0,.58,1]);setKey(c1.camera,'y',95,-30);setKey(c1.camera,'zoom',0,1.05,[.42,0,.58,1]);setKey(c1.camera,'zoom',95,1.12);
 /* Cut 2: rigged character with multiplane background */
 const c2=newScene('Cut 2  Her',120);c2.trans={type:'white',dur:10};
 const{rig,b,p}=buildSampleRig();
 const ch=newLayer('rig','Heroine rig',{rig,step:2,parallax:1,open:false});ch.p.x=0;ch.p.y=40;
 const K=(o,pr,arr,e=[.42,0,.58,1])=>arr.forEach(([f,v])=>setKey(o,pr,f,v,e));
 K(b.hd,'rot',[[0,-3],[28,-3],[44,6],[84,6],[100,-1],[119,-1]]);K(b.nk,'rot',[[0,-1],[44,2],[100,0]]);
 K(b.chest,'rot',[[0,-.6],[60,1],[119,-.6]]);K(b.chest,'sy',[[0,1],[30,1.012],[60,1],[90,1.012],[119,1]]);
 const wave=(bone,amp,ph)=>{for(let f=0;f<120;f+=16)setKey(bone,'rot',f,Math.sin(f/16*Math.PI/2+ph)*amp,[.42,0,.58,1]);};
 wave(b.l1,4,0);wave(b.l2,7,.9);wave(b.r1,4,.5);wave(b.r2,7,1.3);wave(b.backH,1.5,.4);wave(b.fr,1.6,.2);
 K(b.ub,'rot',[[46,0]],[.2,.9,.3,1.3]);K(b.ub,'rot',[[66,-48],[119,-46]]);K(b.fb,'rot',[[46,0]],[.2,.9,.3,1.3]);K(b.fb,'rot',[[66,-110],[80,-96],[94,-112],[108,-98],[119,-108]]);
 K(p.eyes,'swap',[[0,0],[20,1],[23,0],[70,2],[106,0]],'hold');K(p.mouth,'swap',[[0,0],[52,1],[64,0],[72,1],[98,0]],'hold');
 c2.layers.push(fxLayer('gradient',{top:'#6d8fd0',mid:'#f4b8b8',low:'#ffe6c4'}),pre(hills,-200,60,'Far hills',.2),pre(blossom,-240,-120,'Blossom branches',.5),ch,fxLayer('petals',{count:46,size:1.3}),fxLayer('bloom',{amount:.3,radius:18}),fxLayer('letterbox',{amount:.08}));
 c2.layers[2].p.opacity=.9;c2.layers[2].p.blur=5;
 setKey(c2.camera,'zoom',0,1.02,[.3,0,.3,1]);setKey(c2.camera,'zoom',119,1.2);setKey(c2.camera,'y',0,40,[.3,0,.3,1]);setKey(c2.camera,'y',119,-110);
 /* Cut 3: impact frame into title card */
 const c3=newScene('Cut 3  Title',96);c3.bg='#0d1020';c3.trans={type:'flash',dur:8};
 const ch2=cloneRigLayer(ch);ch2.tr={};ch2.rig.bones.forEach(b=>{if(b.name==='Head'||b.name==='Chest')return;});ch2.rig.bones.forEach(x=>{x.tr={};});ch2.rig.parts.forEach(x=>{x.tr={};});ch2.name='Heroine close-up';ch2.step=3;
 ch2.p.x=960;ch2.p.y=330;ch2.p.ax=960;ch2.p.ay=330;setKey(ch2,'sx',0,1.9,[.05,.9,.1,1]);setKey(ch2,'sy',0,1.9,[.05,.9,.1,1]);setKey(ch2,'sx',8,1.6);setKey(ch2,'sy',8,1.6);setKey(ch2,'opacity',36,1,[.42,0,.58,1]);setKey(ch2,'opacity',46,0);
 const sl=fxLayer('speedlines',{count:150,inner:.52,color:'#f4f4ff'});sl.step=2;setKey(sl,'opacity',30,1);setKey(sl,'opacity',40,0);
 const imp=fxLayer('impact',{amount:0});setKey(imp,'amount',0,1,'hold');setKey(imp,'amount',5,0,'hold');setKey(imp,'invert',0,1,'hold');setKey(imp,'invert',3,0,'hold');
 const t2=textLayer('いつも、君と',960,410,{font:'Dela Gothic One',weight:400,size:140,spacing:8,color:'#fff4ef',glow:30,glowColor:'#ff8fa8'});setKey(t2,'opacity',44,0,[0,.55,.45,1]);setKey(t2,'opacity',54,1);setKey(t2,'sx',44,1.08,[.05,.9,.1,1]);setKey(t2,'sy',44,1.08,[.05,.9,.1,1]);setKey(t2,'sx',60,1);setKey(t2,'sy',60,1);t2.name='Title';
 const t3=textLayer('ALWAYS, WITH YOU',960,620,{font:'Zen Kaku Gothic New',weight:500,size:38,spacing:42,color:'#ffd9e2'});setKey(t3,'opacity',54,0);setKey(t3,'opacity',66,1);t3.name='Subtitle';
 c3.layers.push(ch2,sl,imp,fxLayer('sparkle',{count:40,opacity:.8}),t2,t3,fxLayer('chroma',{amount:2}),fxLayer('letterbox',{amount:.1}));
 setKey(c3.camera,'shake',0,18,[.2,0,.5,1]);setKey(c3.camera,'shake',14,0);
 d.scenes.push(c2,c3);return d;
}
