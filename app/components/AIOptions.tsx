'use client';
import {Sparkles,Check} from 'lucide-react';
import {customFilm} from '@/lib/custom-film';
import {getTemplate,type Invite} from '@/lib/templates';
import {composition,type StudioCapabilities} from '@/lib/studio-automation';
export function AIOptions({data,onChange,studio,busy}:{data:Invite;onChange:(d:Invite)=>void;studio:StudioCapabilities;busy:boolean}){
 const mode=composition(data,studio),catalog=!!getTemplate(data.templateId).catalog;
 if(customFilm(data))return <section className="automatic-studio"><div className="automatic-heading"><Sparkles/><strong>Your photos become a whole new film.</strong></div><p>AI paints your people into the scene, then adds natural gestures and camera movement. A new 10-second film uses 5 credits. Add your voice or song in Audio.</p><div className="photo-tips"><span>1–2 clear face references</span><span>Full scene + natural movement</span><span>Preview and confirm before creating</span></div></section>;
 return <section className="automatic-studio" aria-label="Automatic character creation">
  <div className="automatic-heading"><span className="automatic-icon"><Sparkles size={20}/></span><div><strong>Your photo. A new character.</strong><span>Matched to your template automatically</span></div>{studio.ready&&<Check size={16} aria-label="Studio available"/>}</div>
  <p>Upload a clear face photo. We illustrate your people, choose the right AI in the background and place the result into your invitation.</p>
  <div className="photo-tips"><span>Clear, front-facing photo</span><span>1–2 people references</span><span>JPG, PNG or WebP · up to 8 MB each</span></div>
  <details className="creation-options"><summary>Character & animation options <span>Optional</span></summary>
   {studio.cutoutReady&&<label className="field">What would you like to create?<select aria-label="Illustration composition" disabled={busy} value={data.generationMode??'cutout'} onChange={e=>onChange({...data,generationMode:e.target.value as Invite['generationMode'],aiMotion:e.target.value==='cutout'?false:data.aiMotion})}><option value="cutout">Character on my template</option><option value="scene">Character with a new background</option></select><small>Separate characters can be moved and resized after creation.</small></label>}
   {mode==='scene'?<><p className="muted-small">Your people and background are created together as one illustrated scene.</p>{studio.motionReady&&<label className="portal-check"><input type="checkbox" disabled={busy} checked={!!data.aiMotion} onChange={e=>onChange({...data,aiMotion:e.target.checked})}/>Add natural movement ? 5 credits total</label>}<small>A motion scene adds a 10-second animated clip to your full reel. Template effects still work without it.</small></>:<small>The template adds gentle movement, transitions and effects to your character.</small>}
  </details>
 </section>;
}
