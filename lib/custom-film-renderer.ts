import {syncVideo,videoFrame} from './video-playback';
import type {Invite} from './templates';
import {getTemplate,prettyDate} from './templates';
import {sceneAt} from './cinematic-renderer';
import {settings} from './editor-settings';
import {drawReferenceText} from './reference-text';
export function drawCustomFilm(canvas:HTMLCanvasElement,data:Invite,art:HTMLImageElement,seconds:number,video?:HTMLVideoElement,playing=false,background?:HTMLImageElement){
 const c=canvas.getContext('2d')!,scene=sceneAt(data,seconds),s=settings(data),edit=s.sceneEdits[scene.kind]??{};
 c.setTransform(canvas.width/720,0,0,canvas.height/1280,0,0);c.globalAlpha=1;
 if(video)syncVideo(video,seconds%Math.max(.1,video.duration||10),playing);
 const media=video&&video.readyState>=2?video:art,iw='videoWidth' in media?media.videoWidth:media.width,ih='videoHeight' in media?media.videoHeight:media.height;
 const layout=s.videoLayout??'full',framed=layout!=='full',t=getTemplate(s.videoTemplateId??data.templateId);
 if(framed){c.fillStyle=t.bg;c.fillRect(0,0,720,1280);if(background){const bk=Math.max(720/background.width,1280/background.height);c.drawImage(background,(720-background.width*bk)/2,(1280-background.height*bk)/2,background.width*bk,background.height*bk);}c.fillStyle='rgba(10,20,12,.23)';c.fillRect(0,0,720,1280);}
 const box=layout==='arch'?{x:90,y:285,w:540,h:865,r:[270,270,20,20]}:layout==='card'?{x:85,y:285,w:550,h:820,r:[12,12,12,12]}:layout==='cinema'?{x:35,y:315,w:650,h:800,r:[25,25,25,25]}:{x:0,y:0,w:720,h:1280,r:[0,0,0,0]};
 if(framed){c.save();c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=35;c.shadowOffsetY=16;c.fillStyle=layout==='card'?'#fff8e9':'#142013';c.beginPath();c.roundRect(box.x-10,box.y-10,box.w+20,box.h+20,box.r);c.fill();c.restore();}
 c.save();c.beginPath();c.roundRect(box.x,box.y,box.w,box.h,box.r);c.clip();c.fillStyle='#0c130b';c.fillRect(box.x,box.y,box.w,box.h);const k=framed?Math.min(box.w/iw,box.h/ih):Math.max(720/iw,1280/ih);c.drawImage(video&&media===video?videoFrame(video):media,box.x+(box.w-iw*k)/2,box.y+(box.h-ih*k)/2,iw*k,ih*k);c.restore();
 if(framed){c.strokeStyle=data.accent;c.lineWidth=3;c.beginPath();c.roundRect(box.x-10,box.y-10,box.w+20,box.h+20,box.r);c.stroke();}
 if(drawReferenceText(c,data,seconds))return;
 const shade=c.createLinearGradient(0,0,0,470);shade.addColorStop(0,'rgba(27,29,23,.7)');shade.addColorStop(1,'rgba(27,29,23,0)');c.fillStyle=shade;c.fillRect(0,0,720,470);
 const text=(value:string,y:number,size:number,maxHeight=105)=>{c.fillStyle=edit.textColor??'#fff5dc';c.textAlign='center';c.textBaseline='middle';let fontSize=size,rows:string[]=[];do{c.font=`500 ${fontSize}px ${data.font==='modern'?'Arial':'Georgia'}`;rows=[];let line='';for(const word of value.split(/\s+/)){if(c.measureText(line+' '+word).width>610&&line){rows.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)rows.push(line);if(rows.length*fontSize*1.15<=maxHeight&&rows.every(l=>c.measureText(l).width<=610))break;fontSize-=1;}while(fontSize>12);rows.forEach((line,i)=>c.fillText(line,360,y+i*fontSize*1.15,610));};
 const event=data.events[Math.min(data.events.length-1,Math.floor(scene.local*data.events.length))];
 const closing=scene.kind==='closing',y=(edit.textY??12)*12.8; c.save();c.globalAlpha=s.transition==='none'?1:Math.min(1,scene.local*8+.15,(1-scene.local)*10+.15);
 text(closing?'YOU ARE INVITED':data.headline||'A WARM WELCOME',Math.max(48,y-65),17);const title=data.directedReel?scene.kind==='family'?data.family:scene.kind==='venue'?data.venue:scene.kind==='events'?(event?.title||data.names):scene.kind==='photos'?data.message:data.names:data.names;const subtitle=data.directedReel&&scene.kind==='events'&&data.events.length?event?.detail??'':closing?data.venue:prettyDate(data.date);text(edit.title??(title||'Your celebration'),y,edit.textSize??47);text(edit.subtitle??subtitle,y+125,23);
 if(closing){c.fillStyle='rgba(23,37,30,.75)';c.fillRect(35,1100,650,123);text(prettyDate(data.date)+' \u00b7 '+data.time,1135,23);text(data.rsvp,1180,19);}c.restore();
 if(!data.generatedArt){c.fillStyle='rgba(23,37,30,.85)';c.fillRect(65,740,590,180);text('YOUR PERSONAL AI SCENE',790,24);text('Add your photos, then create your film.',842,19);}
}
