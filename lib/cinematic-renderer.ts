import {filmTimeline} from './full-films';
import {getTemplate,prettyDate,type Invite,type SceneKind} from './templates';
export type CinemaAssets=Record<string,HTMLImageElement>;
const W=720,H=1280;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>1-Math.pow(1-clamp(v),3);
export function sceneAt(data:Invite,seconds:number){const timeline=filmTimeline(data);const point=Math.max(0,Math.min(seconds,data.duration-.001));const scene=timeline.find(s=>point<s.start+s.duration)??timeline[timeline.length-1];return {...scene,local:clamp((point-scene.start)/scene.duration),count:timeline.length};}
function text(c:CanvasRenderingContext2D,value:string,x:number,y:number,max:number,size:number,color:string,serif=true,lines=3){
 c.textAlign='center';c.textBaseline='middle';let list:string[]=[];let fontSize=size;
 for(let attempt=0;attempt<12;attempt++){c.font=`${serif?'500':'500'} ${fontSize}px ${serif?'Fraunces, Georgia':'"DM Sans", Arial'}, "Noto Sans Devanagari", sans-serif`;list=[];for(const paragraph of value.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(line&&c.measureText(line+' '+word).width>max){list.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)list.push(line);}if(list.length<=lines)break;fontSize*=.9;}
 c.fillStyle=color;list.slice(0,lines).forEach((line,i)=>c.fillText(line,x,y+i*fontSize*1.25,max));return list.length*fontSize*1.25;
}
function cover(c:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number,zoom=1){const scale=Math.max(w/img.width,h/img.height)*zoom;c.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale)/2,img.width*scale,img.height*scale);}
function contain(c:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number){const scale=Math.min(w/img.width,h/img.height);c.drawImage(img,x+(w-img.width*scale)/2,y+(h-img.height*scale),img.width*scale,img.height*scale);}
function arch(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number){c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,0);c.lineTo(x+w,y+h);c.closePath();}
function blossom(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=color;for(let i=0;i<5;i++){c.rotate(Math.PI*2/5);c.beginPath();c.ellipse(0,r*.55,r*.38,r*.62,0,0,Math.PI*2);c.fill();}c.fillStyle='#f4cf7c';c.beginPath();c.arc(0,0,r*.21,0,Math.PI*2);c.fill();c.restore();}
function ornaments(c:CanvasRenderingContext2D,accent:string,seconds:number,festival=false){c.save();c.strokeStyle=accent;c.lineWidth=1;c.globalAlpha=.7;c.strokeRect(25,25,670,1230);c.strokeRect(32,32,656,1216);for(let corner=0;corner<4;corner++){const x=corner%2?688:32,y=corner>1?1248:32;c.save();c.translate(x,y);c.scale(corner%2?-1:1,corner>1?-1:1);for(let i=0;i<4;i++){c.beginPath();c.arc(0,0,24+i*13,0,Math.PI/2);c.stroke();}c.restore();}c.globalAlpha=1;
 for(let i=0;i<18;i++){const x=38+(i*163)%645,y=(seconds*(12+i%5*3)+i*131)%1280;c.save();c.globalAlpha=.38;c.translate(x,y);c.rotate(seconds*.2+i);c.fillStyle=i%3===0?accent:festival?'#ed9c3b':'#df9ba4';c.beginPath();c.ellipse(0,0,4+i%3,9+i%4,.6,0,Math.PI*2);c.fill();c.restore();}
 for(let i=0;i<13;i++){const x=i*65-30,y=38+Math.sin(i*.5)*24;blossom(c,x,y,18+i%3*4,i%2?'#e2a0a0':'#e9c876',Math.sin(seconds*.4)*.12);}c.restore();}
function plaque(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,accent:string){c.fillStyle='#fff8e9f5';c.beginPath();c.roundRect(x,y,w,h,18);c.fill();c.strokeStyle=accent;c.lineWidth=1;c.strokeRect(x+12,y+12,w-24,h-24);}
function doors(c:CanvasRenderingContext2D,p:number,accent:string,ink:string,door?:HTMLImageElement){if(door){const open=ease((p-.08)/.62),half=door.width/2,shift=360*open;c.drawImage(door,0,0,half,door.height,-shift,0,360,1280);c.drawImage(door,half,0,half,door.height,360+shift,0,360,1280);return;}const open=ease((p-.12)/.63),panel=335*(1-open);if(panel<1)return;c.save();c.fillStyle=ink;for(const right of [false,true]){c.save();c.translate(right?W:0,0);c.scale(right?-1:1,1);c.fillRect(0,0,panel+25,H);c.strokeStyle=accent;c.lineWidth=2;c.strokeRect(14,25,panel-1,1230);c.save();c.beginPath();c.rect(0,0,panel+20,H);c.clip();for(let row=0;row<7;row++){c.strokeRect(35,90+row*155,Math.max(1,panel-40),124);blossom(c,panel*.53,150+row*155,25,'#c48a75',row*.7);}c.fillStyle=accent;c.beginPath();c.ellipse(panel-10,780,7,24,0,0,Math.PI*2);c.fill();c.restore();c.restore();}c.restore();}
export function drawCinematic(canvas:HTMLCanvasElement,data:Invite,assets:CinemaAssets,photos:HTMLImageElement[],seconds:number){
 const c=canvas.getContext('2d')!,t=getTemplate(data.templateId),{kind,local}=sceneAt(data,seconds),soft=data.motion==='gentle',travel=soft?.018:.065,serif=data.font!=='modern';c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.globalAlpha=1;
 cover(c,assets.haveli,0,0,W,H,1+travel*local);const shade=c.createLinearGradient(0,0,0,H);shade.addColorStop(0,t.ink+'e8');shade.addColorStop(.35,t.ink+'22');shade.addColorStop(.75,t.ink+'44');shade.addColorStop(1,t.ink+'ee');c.fillStyle=shade;c.fillRect(0,0,W,H);
 if(kind!=='opening'){c.fillStyle=t.bg+'ed';c.fillRect(46,74,628,1128);c.strokeStyle=data.accent;c.lineWidth=1;arch(c,65,95,590,1088);c.stroke();}
 const reveal=Math.min(ease(local*6),clamp((1-local)*12));c.save();c.globalAlpha=reveal;c.translate(0,(1-ease(local*5))*(soft?12:30));
 const picture=data.character==='photos'?photos[0]:assets[data.character]??assets.couple;
 if(kind==='opening'){
  text(c,data.headline,360,158,570,22,'#fff5df',false,2);text(c,data.names.replace(/\s*&\s*/,'\n&\n'),360,264,590,65,'#fff5df',serif,3);
  text(c,prettyDate(data.date),360,1085,560,29,'#fff5df',serif);text(c,'THE WEDDING CELEBRATION',360,1143,560,15,'#fff5df',false);
  if(t.motif==='car'&&picture){const z=.78+ease(local)*.22;c.save();c.translate(360,850+Math.sin(seconds*1.2)*3);c.scale(z,z);contain(c,picture,-290,-330,580,530);c.restore();}
 }else if(kind==='couple'){
  text(c,data.family,360,152,540,19,t.ink,false,2);text(c,data.names,360,243,540,56,t.ink,serif,2);
  c.save();arch(c,98,345,524,610);c.clip();cover(c,assets.haveli,98,345,524,610,1.04+local*.03);c.fillStyle='#f7e9d747';c.fillRect(98,345,524,610);if(picture){if(data.character==='photos')cover(c,picture,98,345,524,610,1+local*.04);else contain(c,picture,110+(1-ease(local*2))*-40,350+Math.sin(seconds)*3,500,615);}c.restore();c.strokeStyle=data.accent;c.lineWidth=2;arch(c,98,345,524,610);c.stroke();blossom(c,110,910,38,'#c78b96',seconds*.1);blossom(c,610,385,33,'#c78b96',-.2);
  text(c,'A love story, a lifetime in the making.',360,1030,510,27,t.ink,serif,2);
 }else if(kind==='events'){
  text(c,'THE CELEBRATIONS',360,153,530,18,t.ink,false);text(c,'Every little jashn.',360,239,550,48,t.ink,serif);
  const events=data.events.filter(e=>e.title.trim());if(events.length){const height=Math.min(205,760/events.length);events.forEach((event,i)=>{const y=355+i*height;c.save();c.globalAlpha*=ease(local*7-i*.45);text(c,String(i+1).padStart(2,'0'),360,y,500,18,data.accent,false);text(c,event.title,360,y+47,510,36,t.ink,serif,1);text(c,event.detail,360,y+99,485,20,t.ink,false,2);c.fillStyle=data.accent;c.fillRect(327,y+height-26,66,1);c.restore();});}else{text(c,prettyDate(data.date),360,520,530,40,t.ink,serif);text(c,data.venue,360,650,520,30,t.ink,serif);}
 }else if(kind==='photos'){
  text(c,'OUR LITTLE STORY',360,151,530,18,t.ink,false);
  const pic=photos.length?photos[Math.min(photos.length-1,Math.floor(local*photos.length))]:assets[data.character==='car'?'car':'couple'];
  c.save();arch(c,105,229,510,652);c.clip();if(photos.length)cover(c,pic,105,229,510,652,1+local*.06);else{cover(c,assets.haveli,105,229,510,652,1.06);c.fillStyle='#ffeedb50';c.fillRect(105,229,510,652);contain(c,pic,110,260,500,625);}c.restore();c.strokeStyle=data.accent;c.lineWidth=2;arch(c,105,229,510,652);c.stroke();text(c,data.message,360,978,525,31,t.ink,serif,4);
 }else{
  if(picture){c.save();arch(c,200,145,320,345);c.clip();if(data.character==='photos')cover(c,picture,200,145,320,345);else contain(c,picture,205,145,310,345);c.restore();}
  text(c,'You are warmly invited.',360,555,550,45,t.ink,serif,2);text(c,prettyDate(data.date),360,677,530,39,t.ink,serif);const [h,m]=data.time.split(':').map(Number);text(c,`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'} ONWARDS`,360,745,500,20,t.ink,false);
  plaque(c,105,800,510,160,data.accent);text(c,data.venue,360,854,450,27,t.ink,serif,3);text(c,data.rsvp,360,1048,515,24,t.ink,false,3);
 }
 c.restore();ornaments(c,data.accent,seconds,t.motif==='festival');if(kind==='opening'&&t.motif!=='car')doors(c,local,data.accent,t.ink,assets['royal-door']);text(c,'J A S H N T O O N S',360,1218,500,13,kind==='opening'?'#fff5df':t.ink,false);
}
