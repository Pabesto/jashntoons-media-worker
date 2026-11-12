'use client';
import {useState} from 'react';
import {Check,Copy,Film,Sparkles,RotateCcw} from 'lucide-react';
import {defaultInvite,getTemplate,templates,type Invite} from '@/lib/templates';
import {momentCollections,momentStyles,momentCollection,defaultMoment,momentDraft,momentPrompts,type AIMoment} from '@/lib/ai-moments';

export function AIMoments({data,onChange,busy}:{data:Invite;onChange:(d:Invite)=>void;busy:boolean}){
 const [copied,setCopied]=useState(false);
 const selection=data.aiMoment??defaultMoment(getTemplate(data.templateId).category),plan=momentPrompts(selection),collection=momentCollection(plan.preset.category);
 function update(patch:Partial<AIMoment>){setCopied(false);onChange(momentDraft(data,{...selection,...patch}));}
 function category(id:string){const c=momentCollections.find(c=>c.id===id)!;const t=templates.find(t=>t.studio&&t.category===c.name)!;const defaults=defaultInvite(t);onChange(momentDraft({...data,templateId:t.id,headline:defaults.headline,music:defaults.music},defaultMoment(c.name)));}
 return <section className="ai-moments" aria-label="AI Moments director">
  <div className="moments-intro"><span className="moments-icon"><Film size={22}/></span><div><strong>A photo. A performance.</strong><p>Choose what your people do. AI creates a new scene and animates the action.</p></div></div>
  <div className="moments-facts"><span>10 actions per occasion</span><span>10 visual styles</span><span>10 seconds / 5 credits</span></div>
  <label className="field">Moment category<select disabled={busy} value={collection.id} onChange={e=>category(e.target.value)}>{momentCollections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <div className="moments-heading"><span>01 / CHOOSE THE ACTION</span><small>One action per film</small></div>
  <div className="moment-options" role="group" aria-label="Choose an AI moment">{collection.moments.map((m,i)=><button type="button" disabled={busy} key={m.id} aria-pressed={selection.presetId===m.id} onClick={()=>update({presetId:m.id,motionPrompt:undefined})}><span className="moment-number">{String(i+1).padStart(2,'0')}</span><span><strong>{m.title}</strong><small>{m.description}</small></span>{selection.presetId===m.id&&<Check size={15}/>}</button>)}</div>
  <div className="moments-heading"><span>02 / CHOOSE THE LOOK</span><small>Keep your identity</small></div>
  <div className="moment-styles" role="group" aria-label="Choose a visual style">{momentStyles.map((s,i)=><button type="button" disabled={busy} key={s.id} aria-pressed={selection.styleId===s.id} onClick={()=>update({styleId:s.id})}><i className={'style-chip style-chip-'+i} aria-hidden="true"/><span>{s.name}</span>{selection.styleId===s.id&&<Check size={12}/>}</button>)}</div>
  <div className="moment-shot-plan"><span><Sparkles size={15}/>YOUR SHOT PLAN</span><h3>{plan.preset.title} <em>in {plan.style.name}</em></h3><p>{plan.preset.action}</p><small>{plan.preset.camera}</small></div>
  <label className="field">Personal touches <span className="muted-small">Optional</span><input disabled={busy} value={selection.direction??''} maxLength={120} onChange={e=>update({direction:e.target.value})} placeholder="Keep our purple and ivory outfits, soft evening light..."/></label>
  <details className="moment-prompt"><summary>Automatic prompt <span>Review or edit</span></summary><p>Ready to use. Category, action and style update the direction automatically.</p><label className="field">Motion direction<textarea rows={7} maxLength={800} disabled={busy} value={selection.motionPrompt??plan.action} onChange={e=>update({motionPrompt:e.target.value})}/></label><small>{plan.motion.length}/1,000 characters including identity instructions</small><div><button type="button" disabled={busy} onClick={()=>update({motionPrompt:undefined})}><RotateCcw size={13}/>Reset automatic prompt</button><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText('FIRST FRAME\n'+plan.image+'\n\nMOTION\n'+plan.motion);setCopied(true);}catch{setCopied(false);}}}><Copy size={13}/>{copied?'Copied':'Copy both prompts'}</button></div></details>
  <p className="moment-expectation">Upload a clear photo above. Faces, expressions, hands and body actions are AI generated; review the result before sharing. A different action or style creates a new paid film. Text, audio and re-downloads on this reel are included.</p>
 </section>;
}
