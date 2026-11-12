import {referenceEditSource} from './reference-edit-contract';
import {defaultInvite,getTemplate,templates,type Invite,type Template} from './templates';
import {invitationDirection} from './invitation-directions';
import {invitationStyle} from './invitation-story';
import {creationBrief} from './director-contract';
export type CreationOutput='video'|'image'|'card';
export type CreationIntent={templateId:string;output:CreationOutput};
export const intentKey='jashntoons-creation-intent';
export function readCreationIntent(raw:string|null):CreationIntent|null{try{const v=JSON.parse(raw??'null');return v&&templates.some(t=>t.id===v.templateId)&&['video','image','card'].includes(v.output)?{templateId:v.templateId,output:v.output}:null;}catch{return null;}}
export function newCreation(t:Template,output:CreationOutput):Invite{return {...defaultInvite(t),creation:{styleId:invitationDirection(t.invitationDirection)?.styleId,format:output==='card'?'card':output==='image'?'image':t.studio?'template':'film',voice:'none',consent:false,language:'hinglish'},aiMoment:undefined,creationTier:'standard',duration:referenceEditSource({templateId:t.id})?.seconds??30,scenes:t.studio?defaultInvite(t).scenes:['opening','events','closing'],stockAvatarId:undefined};}
export function intentFromQuery(query:URLSearchParams):CreationIntent|null{const id=query.get('template');return id&&templates.some(t=>t.id===id)?{templateId:id,output:query.get('output')==='card'?'card':query.get('output')==='image'?'image':'video'}:null;}
export function switchCreationTemplate(data:Invite,t:Template):Invite{
 const base=defaultInvite(t),b=creationBrief(data);
 // Keep private uploads and completed assets, but reset the old template's
 // scene timing, layout overrides and world. Saved video remains a prior take.
 return {...base,names:data.names,date:data.date,time:data.time,venue:data.venue,message:data.message,rsvp:data.rsvp,family:data.family,events:data.events,photos:data.photos,quality:data.quality,generatedArt:data.generatedArt,generatedVideo:data.generatedVideo,directedReel:data.directedReel,avatarMode:data.generatedVideo?'scene':'cutout',duration:data.generatedVideo?data.duration:30,stockAvatarId:undefined,creation:{...b,format:['image','card'].includes(b.format)?b.format:t.studio?'template':'film',momentId:undefined,styleId:invitationStyle(data).id,sceneNotes:undefined,backgroundId:undefined,regenerationId:undefined}};
}
export function creationIntentData(intent:CreationIntent){return newCreation(getTemplate(intent.templateId),intent.output);}
