import {getTemplate,prettyDate,type Invite} from './templates';
import {sceneAt} from './cinematic-renderer';
import {settings} from './editor-settings';
import {sceneDesign} from './storyboard';
import {animateAvatar} from './studio-motion';

const ease=(n:number)=>1-Math.pow(1-Math.max(0,Math.min(1,n)),3);
const W=720,H=1280;

/** The same five-scene composition drives the editor, browser export and library MP4s. */
export function drawPhotoReel(canvas:HTMLCanvasElement,data:Invite,art:HTMLImageElement,avatar:HTMLImageElement|undefined,backgrounds:Record<string,HTMLImageElement>|undefined,seconds:number,door?:HTMLImageElement,photos:HTMLImageElement[]=[]){
 const c=canvas.getContext('2d')!,t=getTemplate(data.templateId),s=settings(data),scene=sceneAt(data,seconds),{kind,local:p}=scene,design=sceneDesign(data,kind),edit=s.sceneEdits[kind]??{},bg=backgrounds?.[design.background]??art;
 const variant=Math.max(0,Number(t.id.match(/(\d+)$/)?.[1]??1)-1),serif=data.font!=='modern',ink='#303e35',paper='#fff9ee',gold=data.accent;
 c.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);c.globalAlpha=1;
 const cover=(im:HTMLImageElement,x:number,y:number,w:number,h:number,z=1,offset=0)=>{const k=Math.max(w/im.width,h/im.height)*z;c.drawImage(im,x+(w-im.width*k)/2+offset,y+(h-im.height*k)/2,im.width*k,im.height*k);};
 const zoom=data.motion==='cinematic'?1.035+Math.sin((p*.5+scene.index)*1.2)*.02+p*.035:1.025;
 cover(bg,0,0,W,H,zoom,(variant%2?1:-1)*Math.sin(seconds*.12)*8);
 const wash=c.createLinearGradient(0,0,0,H);wash.addColorStop(0,'rgba(21,33,28,.67)');wash.addColorStop(.42,'rgba(21,33,28,.12)');wash.addColorStop(1,'rgba(21,33,28,.38)');c.fillStyle=wash;c.fillRect(0,0,W,H);
 function text(value:string,y:number,size:number,color=paper,width=570,x=360,maxLines=3,heading=true){
  let font=size,lines:string[]=[];
  for(let attempt=0;attempt<14;attempt++){c.font=`${heading?500:400} ${font}px ${heading&&serif?'Fraunces, Georgia':'"DM Sans", Arial'}, "Noto Sans Devanagari", sans-serif`;lines=[];for(const para of value.split('\n')){let line='';for(const word of para.split(/\s+/)){if(line&&c.measureText(line+' '+word).width>width){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);}if(lines.length<=maxLines)break;font*=.9;}
  c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';for(let i=0;i<Math.min(maxLines,lines.length);i++)c.fillText(lines[i],x,y+i*font*1.18,width);return Math.min(maxLines,lines.length)*font*1.18;
 }
 function rule(y:number,w=82){c.strokeStyle=gold;c.lineWidth=1;c.beginPath();c.moveTo(360-w/2,y);c.lineTo(360+w/2,y);c.stroke();c.save();c.translate(360,y);c.rotate(Math.PI/4);c.fillStyle=gold;c.fillRect(-3,-3,6,6);c.restore();}
 function card(y:number,h:number){c.save();c.shadowColor='#1e2b2833';c.shadowBlur=32;c.fillStyle='#fff9eef5';c.beginPath();c.roundRect(46,y,628,h,[72,72,8,8]);c.fill();c.shadowBlur=0;c.strokeStyle=gold;c.globalAlpha=.65;c.lineWidth=1;c.beginPath();c.roundRect(59,y+13,602,h-26,[62,62,4,4]);c.stroke();c.restore();}
 function character(height:number,centerX:number,bottom:number,alpha=1){if(!avatar||!s.avatarVisible)return;const h=height*s.avatarScale,k=Math.min(h/avatar.height,600/avatar.width),w=avatar.width*k,hh=avatar.height*k,x=centerX+(s.avatarX-50)*7.2,y=bottom+(s.avatarY-72)*12.8;
  const enter=s.transition==='none'?1:ease(p*6);
  c.save();c.globalAlpha*=alpha*enter;c.translate(x,y+(1-enter)*28);animateAvatar(c,data.avatarAnimation,seconds,p,0,-hh/2,hh);
  c.shadowBlur=18;c.shadowColor='#172b2930';c.drawImage(avatar,-w/2,-hh,w,hh);c.restore();
 }
 const fade=s.transition==='none'?1:Math.min(1,ease(p*8),ease((1-p)*9));c.save();c.globalAlpha=fade;
 if(s.transition==='slide')c.translate((1-ease(p*5))*60,0);
 if(s.transition==='zoom'){const z=.97+.03*ease(p*6);c.translate(360,640);c.scale(z,z);c.translate(-360,-640);}
 const ty=edit.textY!==undefined?(edit.textY-design.textY)*12.8:0;
 if(kind==='opening'){
  const reveal=door?ease((p-.35)*3):ease(p*3);c.globalAlpha*=reveal;
  text(data.headline||t.label,142+ty,17,paper,560,360,2,false);rule(192+ty);
  text(edit.title??(data.names||'Your celebration'),252+ty,edit.textSize??62,edit.textColor??paper,580,360,3);
  text(edit.subtitle??data.family,456+ty,21,paper,530,360,2,false);
  character(650,360,1132);text(prettyDate(data.date),1160,26);c.globalAlpha=fade;
 }else if(kind==='couple'||kind==='family'||kind==='photos'){
  text(kind==='family'?'TOGETHER, WITH LOVE':kind==='photos'?'THE MOMENTS THAT MADE US':'THE STARS OF THE CELEBRATION',105+ty,15,paper,600,360,1,false);rule(148+ty);
  const title=edit.title??((kind==='family'?data.family:data.names)||'Your celebration');
  const th=text(title,216+ty,edit.textSize??60,edit.textColor??paper,580,360,3);
  text(edit.subtitle??data.message,230+ty+th,23,paper,550,360,3,false);
  if(kind==='photos'&&photos.length){c.save();c.beginPath();c.roundRect(99,480,522,650,[261,261,8,8]);c.clip();cover(photos[Math.min(photos.length-1,Math.floor(p*photos.length))],99,480,522,650,1+p*.025);c.restore();}else character(730,360,1156);
 }else if(kind==='events'){
  const events=data.events.length?data.events:[{title:data.names||'The celebration',detail:[prettyDate(data.date),data.time,data.venue].filter(Boolean).join(' / ')}];
  const n=Math.min(4,events.length),height=Math.min(930,290+n*145);card(100,height);
  text('THE ITINERARY',157+ty,15,ink,560,360,1,false);text(edit.title??'A day to remember.',222+ty,edit.textSize??43,edit.textColor??ink);rule(282+ty);
  events.slice(0,4).forEach((e,i)=>{c.save();c.globalAlpha*=ease(p*8-i*.45);const yy=338+i*145;text(String(i+1).padStart(2,'0'),yy,15,gold,500,360,1,false);text(e.title,yy+39,29,ink,520,360,1);text(e.detail,yy+77,18,ink,520,360,2,false);c.restore();});
  if(edit.subtitle)text(edit.subtitle,100+height-50,19,ink,530,360,2,false);character(Math.max(170,Math.min(340,1100-height)),552,1168);
 }else if(kind==='venue'){
  card(100,600);text('MEET US HERE',160+ty,16,ink,500,360,1,false);rule(204+ty);
  const hh=text(edit.title??(data.venue||'Your celebration venue'),270+ty,edit.textSize??45,edit.textColor??ink,500,360,3);
  text(prettyDate(data.date),290+ty+hh,28,ink);text(formatTime(data.time),340+ty+hh,20,ink,500,360,1,false);rule(500);text(edit.subtitle??'Good company. Beautiful memories.',555,21,ink,480,360,2,false);character(480,360,1178);
 }else{
  text('THE BEGINNING OF SOMETHING BEAUTIFUL',100+ty,14,paper,600,360,2,false);rule(156+ty);
  text(edit.title??'You are invited.',228+ty,edit.textSize??60,edit.textColor??paper);text(data.names,326+ty,36);text(prettyDate(data.date),389+ty,24);
  character(610,360,1080);c.fillStyle='#fff9eef0';c.beginPath();c.roundRect(48,1095,624,90,4);c.fill();text(edit.subtitle??(data.rsvp||'We cannot wait to celebrate with you.'),1125,20,ink,550,360,2,false);
 }
 c.restore();
 if(s.transition==='curtain'&&p<.14&&!(kind==='opening'&&door)){const width=360*(1-ease(p/.14));c.fillStyle=ink;c.fillRect(0,0,width,H);c.fillRect(W-width,0,width,H);}
 c.strokeStyle='#fff1d77a';c.lineWidth=1;c.strokeRect(24,24,672,1232);text('J A S H N T O O N S',1226,11,paper,590,360,1,false);
 // The opening is actual raster door artwork; all personalised character layers remain behind it.
 if(kind==='opening'&&door&&p<.62){
  const open=ease((p-.10)/.48),frameFade=1-ease((open-.8)*5),sx=door.width/W,sy=door.height/H;
  const slice=(x:number,y:number,w:number,h:number,dx=x,dw=w)=>c.drawImage(door,x*sx,y*sy,w*sx,h*sy,dx,y,dw,h);
  c.save();c.globalAlpha=frameFade;
  // Fixed carved arch, two hinged leaves. Only the actual door panels move.
  slice(0,0,720,373);slice(0,373,98,635);slice(622,373,98,635);slice(0,1008,720,272);
  const leaf=262*(1-open);if(leaf>.1){slice(98,373,262,635,98,leaf);slice(360,373,262,635,622-leaf,leaf);}
  c.restore();if(p<.15){c.save();c.globalAlpha=1-p/.15;text('A LITTLE DOOR TO A BEAUTIFUL DAY',1125,15,paper,560,360,2,false);c.restore();}
 }
}

function formatTime(time:string){if(!/^\d{2}:\d{2}$/.test(time))return time;const [h,m]=time.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'} ONWARDS`;}
