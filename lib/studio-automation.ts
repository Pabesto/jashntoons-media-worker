import {type Invite,getTemplate} from './templates';
import {customFilm} from './custom-film';
import {type ImageProvider,type MotionProvider,type ProviderStatus} from './ai-options';
export type StudioCapabilities={ready:boolean;cutoutReady:boolean;motionReady:boolean};
export const emptyStudio:StudioCapabilities={ready:false,cutoutReady:false,motionReady:false};
export function studioCapabilities(status:ProviderStatus):StudioCapabilities{return {ready:status.openai||status.runway||status.google,cutoutReady:status.openai||status.runway,motionReady:status.runway||status.google};}
export function composition(data:Invite,studio:StudioCapabilities){return !customFilm(data)&&data.generationMode!=='scene'&&studio.cutoutReady?'cutout':'scene';}
// Provider routing belongs to the studio, not customer drafts or request parameters.
export function automaticGeneration(data:Invite,status:ProviderStatus,animate=false){
 const studio=studioCapabilities(status),mode=composition(data,studio);
 const imageProvider=(['openai','runway','google'] as ImageProvider[]).find(id=>status[id]);
 const motionProvider:MotionProvider=(animate||customFilm(data))&&mode==='scene'?(status.runway?'runway':status.google?'google':'none'):'none';
 return {imageProvider,motionProvider,mode,studio};
}
