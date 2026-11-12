import {getTemplate,prettyDate,type Invite} from './templates';
import {studioBackgrounds} from './studio-backgrounds';
import {directionPoster} from './invitation-directions';

function image(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('The card artwork could not load. Please try again.'));img.src=src;});}
function lines(c:CanvasRenderingContext2D,value:string,width:number){const out:string[]=[];let line='';for(const word of value.trim().split(/\s+/)){if(c.measureText((line?line+' ':'')+word).width<=width){line+=(line?' ':'')+word;continue;}if(line)out.push(line);line='';for(const letter of Array.from(word)){if(c.measureText(line+letter).width>width&&line){out.push(line);line='';}line+=letter;}}if(line)out.push(line);return out;}
export async function drawInvitationCard(canvas:HTMLCanvasElement,data:Invite){
 await document.fonts.ready;const t=getTemplate(data.templateId),samePeople=!data.directedReel?.sourcePhotos||JSON.stringify(data.directedReel.sourcePhotos)===JSON.stringify(data.photos),art=samePeople?data.generatedArt:undefined;
 // Only character-free artwork may be a card background. Reference-film posters
 // can contain sample people and must never appear behind a user's personal cast.
 const src=t.invitationDirection?directionPoster(t.invitationDirection):studioBackgrounds.find(b=>b.category===t.category)?.src??directionPoster('sunehri-darwaze'),[bg,person]=await Promise.all([image(src),art||data.photos[0]?image('/api/media?id='+encodeURIComponent(art??data.photos[0])):Promise.resolve(null)]);
 const c=canvas.getContext('2d')!;canvas.width=1080;canvas.height=1920;c.fillStyle=t.bg;c.fillRect(0,0,1080,1920);const k=Math.max(1080/bg.width,1920/bg.height);c.drawImage(bg,(1080-bg.width*k)/2,(1920-bg.height*k)/2,bg.width*k,bg.height*k);
 const textBottom=person?1320:1700;c.fillStyle='rgba(255,251,241,.94)';c.beginPath();c.roundRect(80,100,920,textBottom-100,36);c.fill();c.strokeStyle=data.accent;c.lineWidth=2;c.strokeRect(105,125,870,textBottom-150);
 const groups=[{text:data.family,size:27,gap:30},{text:data.headline||'YOU ARE INVITED',size:25,gap:35},{text:data.names||'Your celebration',size:79,gap:40},{text:prettyDate(data.date)+(data.time?' · '+data.time:''),size:36,gap:25},{text:data.venue||'Your venue',size:38,gap:33},{text:data.message,size:29,gap:25},...data.events.filter(e=>e.title||e.detail).map(e=>({text:[e.title,e.detail].filter(Boolean).join(' · '),size:29,gap:20})),{text:data.rsvp,size:27,gap:0}].filter(g=>g.text.trim());
 const font=data.font==='modern'?'Arial, sans-serif':'Georgia, serif',available=textBottom-230;
 const height=(scale:number)=>groups.reduce((h,g)=>{c.font=`${g.size*scale}px ${font}`;return h+lines(c,g.text,770).length*g.size*scale*1.24+g.gap*scale;},0);
 let scale=1;while(height(scale)>available&&scale>.45)scale-=.025;let y=160+Math.max(0,(available-height(scale))/2);c.fillStyle='#2e3f34';c.textAlign='center';c.textBaseline='top';
 for(const g of groups){c.font=`${g.size*scale}px ${font}`;for(const line of lines(c,g.text,770)){c.fillText(line,540,y);y+=g.size*scale*1.24;}y+=g.gap*scale;}
 if(person){const box={x:220,y:1350,w:640,h:495};c.save();if(!art){c.beginPath();c.roundRect(box.x,box.y,box.w,box.h,[160,160,22,22]);c.clip();}const ratio=art?Math.min(box.w/person.width,box.h/person.height):Math.max(box.w/person.width,box.h/person.height);c.drawImage(person,box.x+(box.w-person.width*ratio)/2,box.y+(box.h-person.height*ratio)/2,person.width*ratio,person.height*ratio);c.restore();}
}
