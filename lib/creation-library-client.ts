import {getTemplate,defaultInvite,type Invite} from './templates';
import {creationBrief,previewSavedCast} from './director-contract';
import {referenceEditSource} from './reference-edit-contract';

export type LibraryAvatar={id:string;artId:string;sourcePhotos:string[];created:number;label?:string;styleId?:string};
export type LibraryPhoto={id:string;created:number};
export type CreationLibrary={avatars:LibraryAvatar[];photos:LibraryPhoto[];voices:{id:string;created:number}[]};

// The server resolves this saved job again before quoting. The client only
// updates the draft and its portrait preview; it never authorizes generation.
export function selectLibraryAvatar(data:Invite,avatar:LibraryAvatar):Invite{
 if(!avatar.sourcePhotos.length)throw Error('The original photos for this avatar are unavailable. Refresh your library and choose another saved avatar.');
 const preview=previewSavedCast(data,avatar.artId);
 return {...preview,photos:[...avatar.sourcePhotos],pendingCreationId:undefined,pendingGenerationId:undefined,pendingTalkingId:undefined,generationJobId:undefined,customAudio:undefined,
  creation:{...creationBrief(data),selectedAvatarId:avatar.id,...(avatar.styleId?{styleId:avatar.styleId}:{}),regenerationId:undefined}};
}

// New references must never silently keep a previously selected paid cast.
// A completed old result can stay visible as a clearly labelled previous take.
export function replaceCreationPhotos(data:Invite,photos:string[]):Invite{
 const clearPortrait=!!creationBrief(data).selectedAvatarId&&!data.directedReel;
 return {...data,photos:[...photos],...(clearPortrait?{generatedArt:undefined,generatedVideo:undefined,generationJobId:undefined}:{}),creation:{...creationBrief(data),selectedAvatarId:undefined}};
}

export function creationPreviewKind(data:Invite,artId=data.generatedArt):'card'|'portrait'|'reel'|'reference'|'style'{
 const b=creationBrief(data),source=referenceEditSource(data),result=data.directedReel,template=getTemplate(data.templateId);
 if(b.format==='card')return 'card';
 if(b.format==='image')return artId?'portrait':'style';
 // Older adaptations, changed people, and another source's completed film do
 // not satisfy the current source edit. Keep those outputs in My reels.
 if(source)return result?.referenceEdit===true&&result.sourceReferenceId===source.id&&!!result.videoId&&data.generatedVideo===result.videoId&&JSON.stringify(result.sourcePhotos)===JSON.stringify(data.photos)?'reel':'reference';
 if(template.studio&&!(b.format==='film'&&b.regenerationId))return b.format==='template'&&!!result&&!result.videoId&&!data.generatedVideo&&result.artId===data.generatedArt&&result.sourceTemplateId===template.id&&JSON.stringify(result.sourcePhotos)===JSON.stringify(data.photos)?'reel':'reference';
 if(result?.videoId||data.generatedVideo)return 'reel';
 if(b.format==='template'&&data.directedReel)return 'reel';
 return artId?'portrait':'style';
}

// Called only by the explicit Review action. Opening an old draft must not
// rewrite an in-flight job or approve another generation automatically.
export function creationForReview(data:Invite):Invite{
 const brief=creationBrief(data),template=getTemplate(data.templateId);
 if(data.pendingCreationId||['image','card'].includes(brief.format))return data;
 if(template.studio&&brief.format==='film'&&!brief.regenerationId){const defaults=defaultInvite(template);return {...data,scenes:defaults.scenes,duration:defaults.duration,creation:{...brief,format:'template'}};}
 if(brief.format==='template'&&referenceEditSource(data))return {...data,creation:{...brief,format:'film'}};
 return data;
}
