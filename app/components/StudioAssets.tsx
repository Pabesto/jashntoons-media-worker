'use client';
import {useState} from 'react';
import {Check,Search,Sparkles,Minus,Flower2,PartyPopper,Sun,Orbit,Circle,Star,Zap,Bubbles,Leaf} from 'lucide-react';
import {studioAvatars,studioProps} from '@/lib/studio-avatars';
import {studioBackgrounds} from '@/lib/studio-backgrounds';
import {avatarAnimations,studioEffects} from '@/lib/studio-motion';
import {avatarPlacement,personalScene} from '@/lib/avatar-state';
import {getTemplate,type Invite,type SceneKind} from '@/lib/templates';
import {settings} from '@/lib/editor-settings';

export function StudioAssetPicker({data,onChange,kind,scene,busy=false}:{data:Invite;onChange:(d:Invite)=>void;kind:'avatar'|'background';scene?:SceneKind;busy?:boolean}){
 const [category,setCategory]=useState(getTemplate(data.templateId).category as string),[search,setSearch]=useState(''),[limit,setLimit]=useState(12),[scope,setScope]=useState<'all'|'scene'>('all');
 const library=kind==='avatar'?studioAvatars:studioBackgrounds,options=[...new Set(library.map(a=>a.category))],filtered=library.filter(a=>(category==='All'||a.category===category)&&[a.name,a.category,...('tags' in a?a.tags:[])].join(' ').toLowerCase().includes(search.toLowerCase())),s=settings(data);
 function choose(id:string){
  if(kind==='avatar')onChange({...data,stockAvatarId:id,avatarMode:'cutout',generatedArt:undefined,generatedVideo:undefined,generationJobId:undefined,pendingGenerationId:undefined,avatarAnimation:studioAvatars.find(a=>a.id===id)?.pose??'sway',editor:{...s,...avatarPlacement}});
  else if(scope==='scene'&&scene)onChange({...data,editor:{...s,sceneEdits:{...s.sceneEdits,[scene]:{...s.sceneEdits[scene],background:id}}}});
  else{const edits={...s.sceneEdits};for(const key of Object.keys(edits) as SceneKind[]){const {background,...rest}=edits[key]??{};edits[key]=rest;}onChange({...data,backgroundId:id,editor:{...s,sceneEdits:edits}});}
 }
 const active=kind==='avatar'?data.stockAvatarId:scope==='scene'&&scene?s.sceneEdits[scene]?.background:data.backgroundId;
 return <section className="studio-asset-picker" aria-label={kind==='avatar'?'Avatar collection':'Background collection'}>
  <div className="studio-asset-intro"><span><Sparkles size={15}/>{library.length} {kind==='avatar'?'characters':'backgrounds'}</span><h3>{kind==='avatar'?'Meet your main characters.':'A new world for every moment.'}</h3><p>{kind==='avatar'?'Photo-style dhol players, wedding couples, birthday stars and more. Choose one to replace the current character across your reel.':'Choose a setting for your whole reel, or art-direct the selected scene.'}</p></div>
  {kind==='background'&&personalScene(data)&&<div className="info-box">Your AI result includes its own background. Choose a character from the avatar collection to combine it with these separate backgrounds.</div>}
  <label className="field">Collection<select aria-label={kind==='avatar'?'Avatar category':'Background category'} value={category} onChange={e=>{setCategory(e.target.value);setLimit(12)}}><option value="All">Every occasion / {library.length}</option>{options.map(c=><option key={c}>{c}</option>)}</select></label>
  <label className="studio-asset-search"><Search size={15}/><input aria-label={'Search '+kind+' library'} placeholder={kind==='avatar'?'Search dhol, couple, birthday…':'Search garden, palace, disco…'} value={search} onChange={e=>{setSearch(e.target.value);setLimit(12)}}/></label>
  {kind==='background'&&scene&&<div className="studio-scope" role="group" aria-label="Apply background to"><button aria-pressed={scope==='all'} onClick={()=>setScope('all')}>Whole reel</button><button aria-pressed={scope==='scene'} onClick={()=>setScope('scene')}>Selected scene</button></div>}
  <div className={'studio-asset-grid '+kind+'-asset-grid'}>{filtered.slice(0,limit).map(a=><button key={a.id} aria-label={'Use '+a.name} aria-pressed={active===a.id} disabled={busy||kind==='background'&&personalScene(data)} onClick={()=>choose(a.id)}><span><img src={a.src} alt="" loading="lazy"/>{active===a.id&&<i><Check size={12}/></i>}</span><strong>{a.name}</strong></button>)}</div>
  {!filtered.length&&<div className="studio-asset-empty">No matches. Try a different collection or search.</div>}
  {filtered.length>limit&&<button className="button button-outline full-width studio-asset-more" onClick={()=>setLimit(v=>v+18)}>Show more / {filtered.length-limit} remaining</button>}
  {kind==='background'&&<button className="text-link" onClick={()=>onChange({...data,backgroundId:undefined,editor:{...s,sceneEdits:Object.fromEntries(Object.entries(s.sceneEdits).map(([key,edit])=>{const {background,...rest}=edit??{};return [key,rest]}))}})}>Restore automatic scene backgrounds</button>}
  {kind==='avatar'&&data.stockAvatarId&&<div className="studio-avatar-controls"><label className="field">Character motion<select aria-label="Character motion" value={data.avatarAnimation??'sway'} onChange={e=>onChange({...data,avatarAnimation:e.target.value as Invite['avatarAnimation']})}>{avatarAnimations.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><label className="portal-check"><input type="checkbox" checked={s.avatarVisible} onChange={e=>onChange({...data,editor:{...s,avatarVisible:e.target.checked}})}/>Show character in the reel</label>{([{id:'avatarScale',name:'Character size',min:.3,max:1.6,step:.05},{id:'avatarX',name:'Move horizontally',min:0,max:100,step:1},{id:'avatarY',name:'Move vertically',min:20,max:100,step:1}] as const).map(v=><label className="portal-slider" key={v.id}><span>{v.name}<output>{s[v.id]}</output></span><input type="range" aria-label={v.name} min={v.min} max={v.max} step={v.step} value={s[v.id]} onChange={e=>onChange({...data,editor:{...s,[v.id]:Number(e.target.value)}})}/></label>)}</div>}
 </section>;
}

const effectIcons={none:Minus,petals:Leaf,confetti:PartyPopper,sparkles:Sparkles,marigold:Flower2,fireworks:Sun,balloons:Circle,bokeh:Orbit,stars:Star,lasers:Zap,bubbles:Bubbles};
export function StudioEffectPicker({data,onChange}:{data:Invite;onChange:(d:Invite)=>void}){
 const s=settings(data);
 return <><div className="studio-effects-intro"><span className="reel-overline">THE FINISHING TOUCHES</span><h3>A little movie magic.</h3><p>These animations and props appear in your preview and exported reel.</p></div><div className="studio-effect-grid" aria-label="Visual effects">{studioEffects.map(e=>{const Icon=effectIcons[e.id];return <button key={e.id} aria-label={e.name} aria-pressed={s.particles===e.id} onClick={()=>onChange({...data,editor:{...s,particles:e.id}})}><span className={'effect-swatch swatch-'+e.id} aria-hidden="true"><Icon size={28} strokeWidth={1.6}/></span><strong>{e.name}</strong>{s.particles===e.id&&<Check size={12}/>}</button>})}</div><h3 className="studio-props-heading">Celebration props</h3><p className="portal-copy">Add a little detail to every scene.</p><div className="studio-prop-grid"><button aria-pressed={!data.propId} onClick={()=>onChange({...data,propId:undefined})}><span className="studio-no-prop"><Minus size={24} aria-hidden="true"/></span><strong>None</strong></button>{studioProps.map(p=><button key={p.id} aria-label={'Add '+p.name} aria-pressed={data.propId===p.id} onClick={()=>onChange({...data,propId:p.id})}><img src={p.src} alt="" loading="lazy"/><strong>{p.name}</strong></button>)}</div></>;
}
