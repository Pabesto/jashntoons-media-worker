import {getTemplate,type Invite} from './templates';
import {creationBrief} from './director-contract';
import {momentCollection,getMoment,getMomentStyle} from './ai-moments';
import {invitationDirection} from './invitation-directions';
import {referenceFilm} from './reference-films';

export function invitationStyle(data:Invite){return getMomentStyle(creationBrief(data).styleId??'watercolor')??getMomentStyle('watercolor')!;}
export function invitationMoment(data:Invite){const collection=momentCollection(getTemplate(data.templateId).category),choice=getMoment(creationBrief(data).momentId??'');return choice?.categoryId===collection.id?choice:getMoment(collection.moments[0].id)!;}
export function invitationStory(data:Invite){
 const t=getTemplate(data.templateId),b=creationBrief(data),direction=invitationDirection(t.invitationDirection),ref=referenceFilm(t.referenceFilm),moment=invitationMoment(data);
 const bases=direction?.shots??ref?.shots??[`Reveal the ${t.mood} setting and welcome the guest.`,`Celebrate ${t.category.toLowerCase()} with your people in this world.`,'Reveal a new corner of the same world and finish with a welcoming gesture.'];
 return bases.slice(0,3).map((setting,i)=>({id:['opening','celebration','invitation'][i],title:['The reveal','Your signature moment','The invitation'][i],seconds:10,setting,action:i===1?moment.action:i===0?'Enter naturally or reveal the invitation setting; adapt to the number and ages of uploaded people.':'Turn toward the guest and finish with a warm, age-appropriate welcome.',camera:i===1?moment.camera:i===0?'A smooth architectural reveal, then settle on the people.':'A gentle pullback; leave calm space for the closing details.',note:b.sceneNotes?.[i]?.trim()??''}));
}
export function invitationVisualKey(data:Invite){const b=creationBrief(data);return JSON.stringify([data.templateId,invitationStyle(data).id,invitationMoment(data).id,b.backgroundId??'',b.sceneNotes??[],b.direction??'',b.voice,b.dialogue??'',b.audioId??'',b.voiceId??'',!b.dialogue&&['clone','saved'].includes(b.voice)?[data.names,data.date,data.venue]:[]]);}
export function invitationVisualChanged(data:Invite){const previous=data.directedReel;if(!previous)return false;if(previous.sourceVisualKey){if(previous.videoId)return previous.sourceVisualKey!==invitationVisualKey(data);try{return JSON.parse(previous.sourceVisualKey)[1]!==invitationStyle(data).id;}catch{return false;}}return !!previous.videoId&&!!previous.sourceTemplateId&&previous.sourceTemplateId!==data.templateId;}
