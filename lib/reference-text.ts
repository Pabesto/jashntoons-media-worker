import type {Invite,SceneKind} from './templates';
import {prettyDate} from './templates';
import {settings} from './editor-settings';
import {hasReferenceTimeline} from './reference-timeline';

/** Measured in the source film's 720 × 1280 coordinate system, not the generic scene timeline. */
export type ReferenceTextBlock={text:string;y:number;height:number;size:number;color:string;weight:number};
export type ReferenceTextPanel={x:number;y:number;width:number;height:number;blocks:ReferenceTextBlock[]};
export type ReferenceTextPlan={stage:'opening'|'camera'|'courtyard'|'scroll'|'venue'|'closing';scene:SceneKind;panels:ReferenceTextPanel[]};
const ink='#69492e',muted='#826347';
const bounded=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const clean=(value:unknown)=>typeof value==='string'?value.trim():'';

/** This measured treatment is intentionally exclusive to the verified Shaadi source and full layout. */
export function usesReferenceText(data:Invite):boolean{
 return hasReferenceTimeline(data);
}

export function referenceTextPlan(data:Invite,seconds:number):ReferenceTextPlan|null{
 if(!usesReferenceText(data))return null;
 const time=bounded(Number.isFinite(seconds)?seconds:0,0,52),s=settings(data);
 const date=[prettyDate(data.date),clean(data.time)].filter(Boolean).join(' · ');
 const panel=(scene:SceneKind,x:number,y:number,width:number,height:number,rows:{text:string;y:number;height:number;size:number;title?:boolean;style?:SceneKind}[]):ReferenceTextPanel=>{
  const edit=s.sceneEdits[scene]??{};
  // A text-position edit moves ink inside its original plaque; the opaque mask never moves off old lettering.
  const offset=edit.textY===undefined?0:bounded((edit.textY-12)*2,-12,12);
  return {x,y,width,height,blocks:rows.map(row=>{const rowEdit=row.style?s.sceneEdits[row.style]??{}:edit;return {text:clean(row.text),y:bounded(row.y+offset,16,height-row.height-16),height:row.height,size:row.title?bounded(rowEdit.textSize??row.size,16,58):row.size,color:rowEdit.textColor|| (row.title?ink:muted),weight:row.title?500:400};})};
 };
 if(time<3.5)return {stage:'opening',scene:'opening',panels:[panel('opening',110,82,500,132,[
  {text:s.sceneEdits.opening?.title??data.headline??'A beautiful beginning',y:22,height:48,size:30,title:true},
  {text:s.sceneEdits.opening?.subtitle??data.names,y:79,height:30,size:24},
 ])]};
 // The original moving haveli/door plaques are already clean in the edited video. Leave camera travel and cast unobstructed.
 if(time<14)return {stage:'camera',scene:'couple',panels:[]};
 if(time<24)return {stage:'courtyard',scene:'couple',panels:[panel('couple',116,318,488,252,[
  {text:s.sceneEdits.family?.title??data.family,y:18,height:49,size:22},
  {text:s.sceneEdits.couple?.title??data.names,y:80,height:76,size:43,title:true,style:'couple'},
  {text:s.sceneEdits.couple?.subtitle??s.sceneEdits.family?.subtitle??date,y:174,height:53,size:22},
 ])]};
 if(time<40){
  const events=data.events.filter(event=>clean(event.title)||clean(event.detail));
  const pages=Math.max(1,Math.ceil(events.length/3));
  const page=Math.min(pages-1,Math.floor((time-24)/16*pages));
  const current=events.slice(page*3,page*3+3);
  const rows:{text:string;y:number;height:number;size:number;title?:boolean}[]=[
   {text:s.sceneEdits.events?.title??'Our celebrations',y:27,height:80,size:36,title:true},
   {text:s.sceneEdits.events?.subtitle??date,y:119,height:73,size:22},
  ];
  const count=Math.max(1,current.length),space=530/count;
  if(current.length)current.forEach((event,index)=>{rows.push({text:event.title,y:228+space*index,height:Math.min(73,space*.38),size:34,title:true},{text:event.detail,y:228+space*index+Math.min(83,space*.42),height:Math.min(105,space*.5),size:23});});
  else rows.push({text:data.names,y:286,height:120,size:40,title:true},{text:data.venue,y:464,height:155,size:28});
  // The first edited segment keeps the original title/scroll until the 26-second join;
  // the second has an inset floral border. Both are measured against the actual output.
  const scroll=time<26?{x:124,y:218,width:472,height:824}:{x:174,y:282,width:372,height:760};
  return {stage:'scroll',scene:'events',panels:[panel('events',scroll.x,scroll.y,scroll.width,scroll.height,rows)]};
 }
 if(time<48)return {stage:'venue',scene:'venue',panels:[
  panel('venue',90,354,540,438,[{text:'JOIN US AT',y:25,height:40,size:20},{text:s.sceneEdits.venue?.title??data.venue,y:91,height:214,size:43,title:true},{text:s.sceneEdits.venue?.subtitle??data.message,y:326,height:82,size:22}]),
  panel('venue',160,915,400,125,[{text:date,y:26,height:72,size:24}]),
 ]};
 return {stage:'closing',scene:'closing',panels:[
  panel('closing',130,290,460,150,[{text:s.sceneEdits.closing?.title??'Aap zaroor aana!',y:18,height:49,size:34,title:true},{text:data.names,y:82,height:49,size:30}]),
  panel('closing',90,1110,540,110,[{text:s.sceneEdits.closing?.subtitle??data.rsvp,y:25,height:60,size:23}]),
 ]};
}

function wrapped(c:CanvasRenderingContext2D,text:string,width:number):string[]{
 const lines:string[]=[];let line='';
 for(const word of text.split(/\s+/)){
  if(c.measureText(word).width>width){
   if(line){lines.push(line);line='';}
   for(const glyph of Array.from(word)){if(line&&c.measureText(line+glyph).width>width){lines.push(line);line='';}line+=glyph;}
  }else if(line&&c.measureText(line+' '+word).width>width){lines.push(line);line=word;}
  else line+=(line?' ':'')+word;
 }
 if(line)lines.push(line);return lines;
}

/** Shared canvas path is used by both the live preview and downloaded film. No generation is required. */
export function drawReferenceText(c:CanvasRenderingContext2D,data:Invite,seconds:number):boolean{
 const plan=referenceTextPlan(data,seconds);if(!plan)return false;
 c.save();c.globalAlpha=1;c.shadowBlur=0;c.shadowOffsetX=0;c.shadowOffsetY=0;
 for(const panel of plan.panels){
  const {x,y,width,height}=panel;
  c.save();c.beginPath();c.roundRect(x,y,width,height,10);c.clip();
  // Every stop is fully opaque: even during source crossfades no old name, date or phone number can bleed through.
  const paper=c.createLinearGradient(x,y,x+width,y+height);paper.addColorStop(0,'#f5dfb7');paper.addColorStop(.48,'#f2d4a4');paper.addColorStop(1,'#ecd0a6');
  c.fillStyle=paper;c.fillRect(x,y,width,height);
  c.strokeStyle='rgba(121,82,43,.045)';c.lineWidth=.65;
  for(let row=7;row<height;row+=9){c.beginPath();c.moveTo(x,y+row);c.bezierCurveTo(x+width*.3,y+row+2,x+width*.68,y+row-2,x+width,y+row);c.stroke();}
  c.strokeStyle='#b28a53';c.lineWidth=1;c.strokeRect(x+7,y+7,width-14,height-14);
  c.strokeStyle='rgba(178,138,83,.42)';c.strokeRect(x+11,y+11,width-22,height-22);
  c.beginPath();c.rect(x+20,y+15,width-40,height-30);c.clip();
  c.textAlign='center';c.textBaseline='middle';
  for(const block of panel.blocks){
   if(!block.text)continue;let size=block.size,lines:string[]=[];
   while(size>=11){c.font=`${block.weight} ${size}px ${data.font==='modern'?'Arial':'Georgia'}`;lines=wrapped(c,block.text,width-54);if(lines.length*size*1.22<=block.height)break;size-=1;}
   const maxRows=Math.max(1,Math.floor(block.height/(size*1.22)));
   if(lines.length>maxRows){lines=lines.slice(0,maxRows);let last=lines[maxRows-1];while(last&&c.measureText(last+'…').width>width-54)last=last.slice(0,-1);lines[maxRows-1]=last+'…';}
   c.fillStyle=block.color;const top=y+block.y+block.height/2-(lines.length-1)*size*1.22/2;
   lines.forEach((line,index)=>c.fillText(line,x+width/2,top+index*size*1.22,width-54));
  }
  c.restore();
 }
 c.restore();return true;
}
