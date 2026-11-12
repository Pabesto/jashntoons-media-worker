import {settings} from './editor-settings';
import type {Invite} from './templates';
import type {GenerationFailure} from './generation-failure';
import {avatarPlacement} from './avatar-state';

export type CreationBrief={experience?:'reference-v2';wardrobe?:'auto'|'photo'|'custom';outfit?:string;decoration?:string;props?:string;movement?:'original'|'directed';selectedAvatarId?:string;styleId?:string;direction?:string;sceneNotes?:string[];regenerationId?:string;momentId?:string;backgroundId?:string;format:'template'|'film'|'image'|'card';voice:'none'|'recording'|'clone'|'saved';audioId?:string;audioName?:string;audioDuration?:number;voiceId?:string;consent:boolean;language:'hinglish'|'english';dialogue?:string};
export type DirectedReel={referenceEdit?:boolean;sourceReferenceId?:string;sourceVisualKey?:string;sourceTemplateId?:string;sourcePhotos?:string[];jobId:string;artId:string;videoId?:string;audioId?:string;hasSpeech:boolean;duration:number};
export type CreationQuote={key:string;credits:number;reused:string[];steps:{label:string;credits:number}[];dialogue:string;shots:string[]};
export type CreationView={id:string;status:string;phase:string;error?:string;result?:DirectedReel;savedArtId?:string;failure?:GenerationFailure;progress?:{completed:number;total:number;startedAt:number}};
export const defaultBrief:CreationBrief={format:'template',voice:'none',consent:false,language:'hinglish'};
export function creationBrief(data:Invite):CreationBrief{return {...defaultBrief,...data.creation};}
// Partial art is a preview, not a claim that the requested AI film succeeded.
export function previewSavedCast(data:Invite,artId:string):Invite{return {...data,generatedArt:artId,generatedVideo:undefined,stockAvatarId:undefined,avatarMode:'cutout',directedReel:undefined,talkingClip:undefined,aiMoment:undefined,creationTier:'standard',editor:{...settings(data),...avatarPlacement,videoLayout:'full',videoTemplateId:undefined}};}
export function templateRecovery(data:Invite):Invite{return {...data,pendingCreationId:undefined,creation:{...creationBrief(data),format:'template',voice:'none',audioId:undefined,voiceId:undefined,regenerationId:undefined}};}
export function applyDirectedReel(data:Invite,result:DirectedReel):Invite{return {...data,editor:{...settings(data),videoLayout:'full',videoTemplateId:undefined},directedReel:result,pendingCreationId:undefined,generatedArt:result.artId,generatedVideo:result.videoId,avatarMode:result.videoId?'scene':'cutout',duration:result.duration,stockAvatarId:undefined,aiMoment:undefined,creationTier:'standard',talkingClip:undefined,pendingTalkingId:undefined,pendingGenerationId:undefined,generationJobId:undefined,customAudio:undefined};}
