import type {Invite,SceneKind} from './templates';

// This source's measured chapters also drive text, preview seeking and the editor.
export function hasReferenceTimeline(data:Invite){return data.directedReel?.referenceEdit===true&&data.directedReel.sourceReferenceId==='shaadi-haveli'&&(data.editor?.videoLayout??'full')==='full';}
export function referenceTimeline(data:Invite):{kind:SceneKind;index:number;start:number;duration:number}[]|null{
 if(data.creation?.experience==='reference-v2'&&data.directedReel?.referenceEdit&&(data.editor?.videoLayout??'full')==='full'){
  const duration=data.directedReel.duration,n=data.events.length,events=n?Math.min(duration-12,n*4+(duration>=40?4:0)):0;
  const remaining=duration-events,opening=remaining*.32,family=remaining*.18,closing=remaining*.5;
  return [{kind:'opening' as const,index:0,start:0,duration:opening},{kind:'family' as const,index:1,start:opening,duration:family},...(n?[{kind:'events' as const,index:2,start:opening+family,duration:events}]:[]),{kind:'closing' as const,index:n?3:2,start:duration-closing,duration:closing}];
 }
 if(!hasReferenceTimeline(data))return null;
 return ([['opening',0,14],['couple',14,10],['events',24,16],['venue',40,8],['closing',48,4]] as [SceneKind,number,number][]).map(([kind,start,duration],index)=>({kind,index,start,duration}));
}
