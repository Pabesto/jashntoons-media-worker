import {defaultInvite,getTemplate,type Invite,type Template} from './templates';
import {settings} from './editor-settings';
import {creationBrief} from './director-contract';
import {getStudioBackground,studioBackgrounds} from './studio-backgrounds';
import {personalScene} from './avatar-state';

export const filmLayouts=[{id:'full',name:'Original film',note:'Edge-to-edge scene'},{id:'arch',name:'Royal arch',note:'Arched film + setting'},{id:'card',name:'Keepsake',note:'A moving photo card'},{id:'cinema',name:'Cinema',note:'A wide framed stage'}] as const;
export type FilmLayout=typeof filmLayouts[number]['id'];
export function bakedScene(data:Invite){return !!data.generatedVideo||personalScene(data);}
export function liveBackground(data:Invite){const t=getTemplate(data.editor?.videoTemplateId??data.templateId);return data.backgroundId??t.defaultBackgroundId??studioBackgrounds.find(b=>b.category===t.category)?.id??studioBackgrounds[0].id;}
export function liveTemplate(data:Invite,t:Template):Invite{
 const base=defaultInvite(t),s=settings(data),sceneEdits=Object.fromEntries(Object.entries(s.sceneEdits).map(([k,v])=>{const {background,...rest}=v??{};return [k,rest]}));
 if(bakedScene(data))return {...data,accent:t.accent,backgroundId:t.defaultBackgroundId??studioBackgrounds.find(b=>b.category===t.category)?.id,editor:{...s,sceneEdits,videoTemplateId:t.id,videoLayout:s.videoLayout==='full'?'arch':s.videoLayout}};
 // Change the design, keeping the user's people, text, voice, duration and paid provenance.
 return {...data,templateId:t.id,accent:t.accent,backgroundId:undefined,propId:t.propPreset,scenes:base.scenes,avatarAnimation:t.motionPreset??data.avatarAnimation,editor:{...s,sceneEdits,videoTemplateId:undefined,particles:t.effectPreset??s.particles,transition:base.editor!.transition}};
}
export function withLiveBackground(data:Invite,id:string):Invite{
 if(!getStudioBackground(id))return data;
 const s=settings(data),sceneEdits=Object.fromEntries(Object.entries(s.sceneEdits).map(([k,v])=>{const {background,...rest}=v??{};return [k,rest]}));
 return {...data,backgroundId:id,editor:{...s,sceneEdits,...(bakedScene(data)&&s.videoLayout==='full'?{videoLayout:'arch' as const}:{})}};
}
export function recreationBrief(data:Invite):Invite{
 return {...data,templateId:data.editor?.videoTemplateId??data.templateId,creation:{...creationBrief(data),format:'film',momentId:data.aiMoment?.presetId??data.creation?.momentId,backgroundId:liveBackground(data)}};
}
