import {REEL_EXPERIENCE,isReelBrief,reelSource} from './reel-experience';
import {referenceEditSource} from './reference-edit-contract';
import {defaultInvite,getTemplate,templates,type Invite,type Template} from './templates';
import {invitationDirection} from './invitation-directions';
import {invitationStyle} from './invitation-story';
import {creationBrief} from './director-contract';
export type CreationOutput='video'|'template'|'image'|'card';
export type CreationIntent={templateId:string;output:CreationOutput;experience?:typeof REEL_EXPERIENCE};
export const intentKey='jashntoons-creation-intent';
export function readCreationIntent(raw:string|null):CreationIntent|null{try{const v=JSON.parse(raw??'null');return v&&templates.some(t=>t.id===v.templateId)&&['video','template','image','card'].includes(v.output)?{templateId:v.templateId,output:v.output,...(v.experience===REEL_EXPERIENCE?{experience:REEL_EXPERIENCE}:{})}:null;}catch{return null;}}
export function newCreation(t:Template,output:CreationOutput):Invite{const source=referenceEditSource({templateId:t.id}),format=output==='card'?'card':output==='image'?'image':output==='template'&&!source?'template':'film';return {...defaultInvite(t),creation:{styleId:invitationDirection(t.invitationDirection)?.styleId,format,voice:'none',consent:false,language:'hinglish'},aiMoment:undefined,creationTier:'standard',duration:source?.seconds??30,scenes:format==='template'?defaultInvite(t).scenes:['opening','events','closing'],stockAvatarId:undefined};}
export function intentFromQuery(query:URLSearchParams):CreationIntent|null{const id=query.get('template'),output=query.get('output');return id&&templates.some(t=>t.id===id)?{templateId:id,output:output==='card'?'card':output==='image'?'image':output==='template'?'template':'video',...(!output||output==='video'?{experience:REEL_EXPERIENCE}:{})}:null;}
export function switchCreationTemplate(data:Invite,t:Template):Invite{
 const base=defaultInvite(t),b=creationBrief(data),reel=isReelBrief(data)?reelSource(t):null;
 // Keep private uploads and completed assets, but reset the old template's
 // scene timing, layout overrides and world. Saved video remains a prior take.
 const format=['image','card'].includes(b.format)?b.format:referenceEditSource({templateId:t.id})?'film':b.format;
 return {...base,names:data.names,date:data.date,time:data.time,venue:data.venue,message:data.message,rsvp:data.rsvp,family:data.family,events:data.events,photos:data.photos,quality:data.quality,generatedArt:data.generatedArt,generatedVideo:data.generatedVideo,directedReel:data.directedReel,avatarMode:data.generatedVideo?'scene':'cutout',duration:reel?.seconds??referenceEditSource({templateId:t.id})?.seconds??30,scenes:format==='film'?['opening','events','closing']:base.scenes,stockAvatarId:undefined,creation:{...b,format,momentId:undefined,styleId:invitationStyle(data).id,sceneNotes:undefined,backgroundId:undefined,regenerationId:undefined}};
}
export function creationIntentData(intent:CreationIntent){const t=getTemplate(intent.templateId),data=newCreation(t,intent.output),source=reelSource(t);return intent.experience===REEL_EXPERIENCE&&source?{...data,duration:source.seconds,events:[],rsvp:'',creation:{...data.creation!,experience:REEL_EXPERIENCE,format:'film' as const,wardrobe:'auto' as const,movement:t.studio?'directed' as const:'original' as const}}:data;}
