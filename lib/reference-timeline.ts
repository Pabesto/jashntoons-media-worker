import type {Invite,SceneKind} from './templates';

// This source's measured chapters also drive text, preview seeking and the editor.
export function hasReferenceTimeline(data:Invite){return data.directedReel?.referenceEdit===true&&data.directedReel.sourceReferenceId==='shaadi-haveli'&&(data.editor?.videoLayout??'full')==='full';}
export function referenceTimeline(data:Invite):{kind:SceneKind;index:number;start:number;duration:number}[]|null{
 if(!hasReferenceTimeline(data))return null;
 return ([['opening',0,14],['couple',14,10],['events',24,16],['venue',40,8],['closing',48,4]] as [SceneKind,number,number][]).map(([kind,start,duration],index)=>({kind,index,start,duration}));
}
