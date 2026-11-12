import type {Invite,SceneKind} from './templates';
import {customFilm} from './custom-film';
import {hasReferenceTimeline} from './reference-timeline';

export function personalReelReady(data:Invite){
 return customFilm(data)?!!data.generatedVideo:!!data.generatedArt;
}
export function firstCreatorTool(data:Invite){
 if(data.creation)return 'Details';
 return data.pendingGenerationId||!personalReelReady(data)?data.aiMoment?'Moments':'Avatar':'Details';
}
export function detailScene(data:Invite,field:string):SceneKind{
 if(hasReferenceTimeline(data))return ({names:'couple',headline:'opening',family:'couple',date:'couple',time:'venue',venue:'venue',message:'venue',rsvp:'closing'} as Record<string,SceneKind>)[field]??'opening';
 const preferred:Record<string,SceneKind>={names:'couple',headline:'opening',family:'family',date:'opening',time:'venue',venue:'venue',message:'photos',rsvp:'closing'};
 const kind=preferred[field];
 return data.scenes.includes(kind)?kind:data.scenes[0];
}
// Only reload media when the selected assets change. Text, placement and effects
// redraw the same assets immediately, without another AI request or credit.
export function previewAssetKey(data:Invite){
 return JSON.stringify([data.editor?.videoLayout,data.editor?.videoTemplateId,data.talkingClip?.videoId,data.templateId,data.scenes,data.photos,data.generatedArt,data.generatedVideo,data.avatarMode,data.stockAvatarId,data.backgroundId,data.propId,data.creationTier,data.scenes.map(kind=>data.editor?.sceneEdits?.[kind]?.background)]);
}
