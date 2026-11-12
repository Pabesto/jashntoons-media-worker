import {type AIMoment} from './ai-moments';
import type {Invite} from './templates';
import {editorDefaults,settings} from './editor-settings';

export type AvatarResult={aiMoment?:AIMoment;templateId?:string;id:string;generatedArt?:string;generatedVideo?:string;avatarMode?:Invite['avatarMode']};

// An explicitly selected character must be visible, even in a draft that hid or
// moved its previous character off canvas. Keep all unrelated scene styling.
export const avatarPlacement={
 avatarVisible:true,
 avatarX:editorDefaults.avatarX,
 avatarY:editorDefaults.avatarY,
 avatarScale:editorDefaults.avatarScale,
};
export function applyAvatar(data:Invite,result:AvatarResult):Invite{
 const base:Invite=result.aiMoment?{...data,templateId:result.templateId??data.templateId,aiMoment:result.aiMoment,creationTier:'custom',duration:10,generationMode:'scene',avatarMode:'scene',aiMotion:true,scenes:['opening','closing']}:data;
 return {...base,stockAvatarId:undefined,generatedArt:result.generatedArt,generatedVideo:result.generatedVideo,
  generationJobId:result.id,pendingGenerationId:undefined,avatarMode:result.avatarMode??'scene',
  editor:{...settings(data),...avatarPlacement}};
}

// The first two photos are identity references. Replacing a character must not
// append new references behind the old pair and silently regenerate that pair.
export function avatarPhotos(data:Invite,ids:string[],replace:boolean):Invite{
 return {...data,photos:replace?[...ids]:[...data.photos,...ids]};
}

export function personalScene(data:Invite){
 return !!(data.generatedArt||data.generatedVideo)&&data.avatarMode!=='cutout';
}
