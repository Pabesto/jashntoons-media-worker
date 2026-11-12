import {isReferenceEdit} from './reference-edit-contract';
import {creationPreviewKind} from './creation-library-client';
import type {Invite} from './templates';
import {recreationBrief} from './live-style';

export type FinishedReel={id:string;projectId:string|null;created:number;mime:string;title:string;photos:string[];duration:number;published:boolean;optimization?:string|null;data:Invite};
export type SavedProject={id:string;title:string;data:Invite;updated:number;completed?:boolean};
export type ReelAction='edit'|'finish'|'regenerate';
export function readyToFinish(data:Invite){if((isReferenceEdit(data)||data.creation?.format==='film')&&creationPreviewKind(data)!=='reel')return false;return !data.pendingCreationId&&!data.pendingGenerationId&&!data.pendingTalkingId&&(data.creation?.format==='card'?!!data.names.trim()&&!!data.date&&!!data.venue.trim():!!(data.directedReel||data.generatedVideo||data.generatedArt||data.talkingClip));}
export function regenerationDraft(data:Invite):Invite{
 // A fresh film take; the cast and speech cache keys stay unchanged.
 const next=recreationBrief(data);
 return {...next,creation:{...next.creation!,regenerationId:crypto.randomUUID()}};
}
