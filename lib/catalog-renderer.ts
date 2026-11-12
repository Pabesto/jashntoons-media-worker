import {videoFrame} from './video-playback';
import {getTemplate,prettyDate,type Invite} from './templates';
import {sceneAt} from './cinematic-renderer';
import {personalScene} from './avatar-state';
import {settings} from './editor-settings';
import {animateAvatar,drawAtmosphere} from './studio-motion';
import {sceneDesign} from './storyboard';
export function drawCatalog(canvas:HTMLCanvasElement,data:Invite,art:HTMLImageElement,photos:HTMLImageElement[],seconds:number,avatar?:HTMLImageElement,backgrounds?:Record<string,HTMLImageElement>,video?:HTMLVideoElement,prop?:HTMLImageElement){
 const c=canvas.getContext('2d')!,t=getTemplate(data.templateId),scene=sceneAt(data,seconds),s=settings(data),edit=s.sceneEdits[scene.kind]??{},p=scene.local,design=sceneDesign(data,scene.kind),kind=scene.kind;
 c.setTransform(canvas.width/720,0,0,canvas.height/1280,0,0);c.globalAlpha=1;
 const cover=(im:HTMLImageElement|HTMLVideoElement,x:number,y:number,w:number,h:number,z=1)=>{const iw='videoWidth' in im?im.videoWidth:im.width,ih='videoHeight' in im?im.videoHeight:im.height;const k=Math.max(w/iw,h/ih)*z;c.drawImage('videoWidth' in im?videoFrame(im):im,x+(w-iw*k)/2,y+(h-ih*k)/2,iw*k,ih*k)};
 const fullScene=personalScene(data),bg=fullScene?(video&&video.readyState>=2?video:avatar??art):backgrounds?.[design.background]??art;cover(bg,0,0,720,1280,data.motion==='cinematic'?1.04+p*.055:1.02);
 const wash=c.createLinearGradient(0,0,0,1100);wash.addColorStop(0,'rgba(20,27,30,.72)');wash.addColorStop(.53,'rgba(20,27,30,.30)');wash.addColorStop(1,'rgba(20,27,30,.10)');c.fillStyle=wash;c.fillRect(0,0,720,1280);
 c.save();c.globalAlpha=s.transition==='none'?1:Math.min(1,p*9+.15,(1-p)*12+.15);if(s.transition==='slide')c.translate((1-Math.min(p*5,1))*65,0);if(s.transition==='zoom'){const z=.94+.06*Math.min(p*7,1);c.translate(360,640);c.scale(z,z);c.translate(-360,-640);}
 const text=(value:string,y:number,size:number,color=edit.textColor??'#fff9ed',width=590,x=360,max=3)=>{let font=size,lines:string[]=[];
  for(let attempt=0;attempt<9;attempt++){c.font=`500 ${font}px ${data.font==='modern'?'"DM Sans", Arial':'Fraunces, Georgia'}`;lines=[];let line='';for(const word of value.split(/\s+/)){if(c.measureText(line+' '+word).width>width&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);if(lines.length<=max)break;font*=.88;}
  c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=8;lines.slice(0,max).forEach((v,i)=>c.fillText(v,x,y+i*font*1.2,width));c.shadowBlur=0;return Math.min(lines.length,max)*font*1.2;
 };
 const panel=(x:number,y:number,w:number,h:number)=>{c.fillStyle='rgba(23,35,33,.82)';c.strokeStyle='rgba(255,235,196,.5)';c.lineWidth=1;c.beginPath();c.roundRect(x,y,w,h,22);c.fill();c.stroke();};
 let title=data.names||'Your celebration',sub=data.message,label=data.headline||t.label;
 if(kind==='venue'){title=data.venue||'Your special place';sub=[prettyDate(data.date),data.time].filter(Boolean).join(' / ');label='THE PLACE WE WILL CELEBRATE';}
 if(kind==='family'){title=data.family||'With our favourite people';sub=data.message;label='WITH LOVE & BLESSINGS';}
 if(kind==='closing'){title='You are invited';sub='';label=prettyDate(data.date);}
 if(kind==='photos'){title='Our little story';sub='';label='THE MOMENTS THAT MADE US';}
 if(kind==='events'){title='The celebrations';sub='';label='A LITTLE JOY, EVERY CHAPTER';}
 const y=(edit.textY??design.textY)*12.8;
 if(kind==='venue')panel(52,y-62,616,360);
 if(kind==='family'){c.strokeStyle=data.accent;c.lineWidth=2;c.beginPath();c.arc(360,285,240,Math.PI,2*Math.PI);c.stroke();}
 text(label,Math.max(60,y-78),17);
 const h=text(edit.title??title,y,edit.textSize??(kind==='couple'?64:50));
 text(edit.subtitle??sub,y+h+25,24,undefined,560,360,kind==='venue'?2:3);
 if(kind==='opening')text(prettyDate(data.date),y+h+155,23);
 if(kind==='events'){const events=data.events.length?data.events:[{title:data.names||'Our special day',detail:[prettyDate(data.date),data.time,data.venue].filter(Boolean).join(' / ')}];events.forEach((e,i)=>{const yy=340+i*145;panel(60,yy,600,126);text(String(i+1).padStart(2,'0'),yy+60,19,data.accent,65,102);text(e.title,yy+35,28,undefined,450,395,1);text(e.detail,yy+78,20,undefined,450,395,2);});}
 if(kind==='photos'&&photos.length){const photo=photos[Math.min(photos.length-1,Math.floor(p*photos.length))];c.save();c.translate(340,710);c.rotate(-.035+Math.sin(seconds*.5)*.012);c.fillStyle='#fff6e5';c.fillRect(-264,-350,528,700);cover(photo,-246,-332,492,630,1+p*.025);text(data.names,322,22,'#314439',450,0,1);c.restore();}
 if(!fullScene&&avatar&&s.avatarVisible){
  const cutout=!!data.stockAvatarId||!!data.generatedArt&&data.avatarMode==='cutout',height=design.h*s.avatarScale,width=Math.min(cutout?610:440,height*(cutout?avatar.width/avatar.height:.72));
  const x=720*(design.x+s.avatarX-50)/100,yc=1280*(design.y+s.avatarY-72)/100+Math.sin(seconds*1.2)*4;
  c.save();animateAvatar(c,data.avatarAnimation,seconds,p,x,yc,height);c.shadowBlur=18;c.shadowColor='rgba(0,0,0,.22)';
  if(cutout){const k=Math.min(height/avatar.height,width/avatar.width);c.drawImage(avatar,x-avatar.width*k/2,yc-avatar.height*k/2,avatar.width*k,avatar.height*k);}
  else{const hh=Math.min(height,650);c.beginPath();c.roundRect(x-width/2,yc-hh/2,width,hh,[width/2,width/2,18,18]);c.clip();cover(video&&video.readyState>=2?video:avatar,x-width/2,yc-hh/2,width,hh,1+p*.02);}
  c.restore();
 }
 if(kind==='venue'){text('COME CELEBRATE WITH US',1080,18,undefined,560);text(data.names,1120,30);}
 if(kind==='closing'){panel(60,1050,600,120);text(data.rsvp||'We cannot wait to celebrate with you',1080,22,undefined,540);text(data.names,1130,27);}
 c.restore();if(s.transition==='curtain'&&p<.14){const w=360*(1-p/.14);c.fillStyle=t.bg;c.fillRect(0,0,w,1280);c.fillRect(720-w,0,w,1280);c.strokeStyle=data.accent;c.lineWidth=3;c.strokeRect(w-5,0,1,1280);c.strokeRect(724-w,0,1,1280);}
 c.globalAlpha=.8;c.strokeStyle='#fff4df';c.lineWidth=1;c.strokeRect(25,25,670,1230);text('JASHNTOONS / MADE FOR YOUR MOMENT',1220,12);c.globalAlpha=1;
}
export function drawEffects(canvas:HTMLCanvasElement,data:Invite,seconds:number){const c=canvas.getContext('2d')!,s=settings(data);c.setTransform(canvas.width/720,0,0,canvas.height/1280,0,0);c.globalAlpha=1;c.filter='none';if(s.vignette){const g=c.createRadialGradient(360,580,240,360,640,800);g.addColorStop(0,'transparent');g.addColorStop(1,`rgba(0,0,0,${s.vignette/100})`);c.fillStyle=g;c.fillRect(0,0,720,1280);}if(s.particles==='none')return;if(!['petals','confetti','sparkles'].includes(s.particles)){drawAtmosphere(c,data,seconds,s.particles,s.intensity);c.globalAlpha=1;return;}for(let i=0;i<Math.round(s.intensity*.6);i++){const x=(i*173+Math.sin(seconds*.5+i)*36+800)%720,y=(i*277+seconds*(20+i%5*8))%1280,r=2+i%5;c.save();c.translate(x,y);c.rotate(seconds*.4+i);c.globalAlpha=.45+i%4*.12;c.fillStyle=s.particles==='petals'?['#f7bac8','#efce96','#e8a7b7'][i%3]:s.particles==='confetti'?['#f2c66d','#bcd5ca','#da8b9c','#c5b0e7'][i%4]:data.accent;if(s.particles==='petals'){c.beginPath();c.ellipse(0,0,r*1.7,r,0,0,Math.PI*2);c.fill();}else if(s.particles==='confetti')c.fillRect(-r,-r,r*2,r);else{c.fillRect(-r,0,r*2,1.5);c.fillRect(0,-r,1.5,r*2);}c.restore();}c.globalAlpha=1;}
