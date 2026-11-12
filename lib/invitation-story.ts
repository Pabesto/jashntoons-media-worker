import {isReelBrief} from './reel-experience';
import {getTemplate,type Invite} from './templates';
import {creationBrief} from './director-contract';
import {momentCollection,getMoment,getMomentStyle} from './ai-moments';
import {invitationDirection} from './invitation-directions';
import {referenceFilm} from './reference-films';

export function invitationStyle(data:Invite){return getMomentStyle(creationBrief(data).styleId??'watercolor')??getMomentStyle('watercolor')!;}
export function invitationMoment(data:Invite){
 const t=getTemplate(data.templateId),collection=momentCollection(t.category);let selected=creationBrief(data).momentId;
 // Keep the reviewed action of an older paid result when introducing new defaults.
 if(!selected&&data.directedReel?.sourceTemplateId===t.id&&data.directedReel.sourceVisualKey){try{selected=JSON.parse(data.directedReel.sourceVisualKey)[2];}catch{/* New drafts use their template's default below. */}}
 const choice=getMoment(selected??''),variant=Number(t.id.match(/-(\d{2})$/)?.[1]??1)-1;
 return choice?.categoryId===collection.id?choice:getMoment(collection.moments[Math.max(0,variant)%collection.moments.length].id)!;
}
export function invitationStory(data:Invite){
 const t=getTemplate(data.templateId),b=creationBrief(data),direction=invitationDirection(t.invitationDirection),ref=referenceFilm(t.referenceFilm),moment=invitationMoment(data);
 const bases=direction?.shots??ref?.shots??[`Reveal the ${t.mood} setting and welcome the guest.`,`Celebrate ${t.category.toLowerCase()} with your people in this world.`,'Reveal a new corner of the same world and finish with a welcoming gesture.'];
 const collection=momentCollection(t.category),index=Math.max(0,collection.moments.findIndex(m=>m.id===moment.id));
 const actions=[collection.moments[(index+3)%collection.moments.length],moment,collection.moments[(index+6)%collection.moments.length]];
 return bases.slice(0,3).map((setting,i)=>({id:['opening','celebration','invitation'][i],title:['The reveal','Your signature moment','The invitation'][i],seconds:10,setting,action:actions[i].action,camera:actions[i].camera,note:b.sceneNotes?.[i]?.trim()??''}));
}
export function invitationVisualKey(data:Invite){const b=creationBrief(data);return JSON.stringify([data.templateId,invitationStyle(data).id,invitationMoment(data).id,b.backgroundId??'',b.sceneNotes??[],b.direction??'',b.voice,b.dialogue??'',b.audioId??'',b.voiceId??'',!b.dialogue&&['clone','saved'].includes(b.voice)?[data.names,data.date,data.venue]:[],...(isReelBrief(data)?[b.experience,b.wardrobe??'auto',b.outfit??'',b.decoration??'',b.props??'',b.movement??'original']:[])]);}
export function invitationVisualChanged(data:Invite){const previous=data.directedReel;if(!previous)return false;if(previous.sourceVisualKey){if(previous.videoId)return previous.sourceVisualKey!==invitationVisualKey(data);try{return JSON.parse(previous.sourceVisualKey)[1]!==invitationStyle(data).id;}catch{return false;}}return !!previous.videoId&&!!previous.sourceTemplateId&&previous.sourceTemplateId!==data.templateId;}
