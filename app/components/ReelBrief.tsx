'use client';
import {Plus,X,Sparkles,ArrowUpRight} from 'lucide-react';
import {getTemplate,type Invite} from '@/lib/templates';
import type {CreationBrief} from '@/lib/director-contract';
import {functionCapacity,reelSource} from '@/lib/reel-experience';
import {momentCollection} from '@/lib/ai-moments';
import {invitationMoment} from '@/lib/invitation-story';

type Props={data:Invite;disabled:boolean;change:(data:Invite)=>void;option:(value:Partial<CreationBrief>)=>void;chooseLong:()=>void};
export function ReelDetails({data,disabled,change,chooseLong}:Props){
 const capacity=functionCapacity(reelSource(getTemplate(data.templateId))?.seconds??0);
 const set=<K extends keyof Invite>(key:K,value:Invite[K])=>change({...data,[key]:value});
 const event=(index:number,key:keyof Invite['events'][number],value:string)=>set('events',data.events.map((e,i)=>i===index?{...e,[key]:value}:e));
 return <section className="brief-card reel-complete-details" data-brief="details"><div className="brief-heading"><span className="brief-number">03</span><div><h2>Your complete invitation</h2><p>Fill it once. We place these exact words throughout your reel.</p></div></div><div className="brief-fields">
  <label className="wide">Names / celebration title<input required maxLength={70} value={data.names} disabled={disabled} placeholder="Aanya & Kabir" onChange={e=>set('names',e.target.value)}/></label>
  <label className="wide">Opening heading<input maxLength={90} value={data.headline} disabled={disabled} placeholder="Save the date" onChange={e=>set('headline',e.target.value)}/></label>
  <label>Date<input required type="date" value={data.date} disabled={disabled} onChange={e=>set('date',e.target.value)}/></label><label>Time<input required type="time" value={data.time} disabled={disabled} onChange={e=>set('time',e.target.value)}/></label>
  <label className="wide">Main venue & city<input required maxLength={150} value={data.venue} disabled={disabled} placeholder="The Rose Garden, Jaipur" onChange={e=>set('venue',e.target.value)}/></label>
  <label className="wide">Family / hosts<input maxLength={100} value={data.family} disabled={disabled} onChange={e=>set('family',e.target.value)}/></label>
  <label className="wide">Invitation message<textarea maxLength={200} value={data.message} disabled={disabled} placeholder="Join us for a celebration filled with love." onChange={e=>set('message',e.target.value)}/></label>
  <label className="wide">RSVP name / phone number<input type="text" autoComplete="tel" maxLength={100} value={data.rsvp} disabled={disabled} placeholder="RSVP: Riya · +91 98765 43210" onChange={e=>set('rsvp',e.target.value)}/><small>Shown on your final invitation. Add a country code for overseas guests.</small></label>
 </div><div className="reel-function-heading"><div><h3>All your functions, one reel</h3><p>{capacity?`This reel fits up to ${capacity} functions, with a separate title and schedule for each.`:'Choose a longer reel to include several functions.'}</p></div><button className="text-link" disabled={disabled} onClick={chooseLong}>Browse longer reels <ArrowUpRight size={14}/></button></div>
 {data.events.map((e,i)=><fieldset className="reel-function" key={i} disabled={disabled}><legend>Function {i+1}</legend><button className="reel-remove-function" aria-label={'Remove function '+(i+1)} onClick={()=>set('events',data.events.filter((_,n)=>n!==i))}><X size={16}/></button><div className="brief-fields"><label className="wide">Function name<input maxLength={45} value={e.title} placeholder="Haldi / Mehendi / Sangeet / Reception" onChange={v=>event(i,'title',v.target.value)}/></label><label>Date<input type="date" value={e.date??''} onChange={v=>event(i,'date',v.target.value)}/></label><label>Time<input type="time" value={e.time??''} onChange={v=>event(i,'time',v.target.value)}/></label><label className="wide">Venue<input maxLength={100} value={e.venue??''} placeholder="Function venue & city" onChange={v=>event(i,'venue',v.target.value)}/></label><label className="wide">Extra detail (optional)<input maxLength={100} value={e.detail} placeholder="Dress code, welcome message or directions" onChange={v=>event(i,'detail',v.target.value)}/></label></div></fieldset>)}
 {data.events.length<capacity&&<button className="button button-outline full-width" disabled={disabled} onClick={()=>set('events',[...data.events,{title:'',date:data.date,time:data.time,venue:data.venue,detail:''}])}><Plus size={16}/>Add another function</button>}
 {data.events.length>capacity&&<p role="alert">Choose a longer reel to include all {data.events.length} functions.</p>}
 </section>;
}
export function ReelPersonalisation({data,disabled,option}:Pick<Props,'data'|'disabled'|'option'>){
 const b=data.creation!,moments=momentCollection(getTemplate(data.templateId).category),moment=invitationMoment(data);
 return <section className="brief-card reel-personalisation" data-brief="story"><div className="brief-heading"><span className="brief-number">04</span><div><h2>The look & the movement</h2><p>AI adjusts your people to the scene. No manual prompt or cropping needed.</p></div><Sparkles size={19}/></div>
 <label className="brief-label">Character clothing<select value={b.wardrobe??'auto'} disabled={disabled} onChange={e=>option({wardrobe:e.target.value as CreationBrief['wardrobe']})}><option value="auto">Automatic — match this celebration</option><option value="photo">Keep clothing from my photos</option><option value="custom">Describe our outfits</option></select><small>Faces and age stay your own. AI fits clothing, pose, lighting and placement to the reel.</small></label>
 {b.wardrobe==='custom'&&<label className="brief-label">Your outfit details<textarea disabled={disabled} maxLength={300} value={b.outfit??''} placeholder="Ivory sherwani and a coral lehenga, with matching floral jewellery…" onChange={e=>option({outfit:e.target.value})}/></label>}
 <label className="brief-label">Movement<select disabled={disabled} value={b.movement??'original'} onChange={e=>option({movement:e.target.value as CreationBrief['movement']})}><option value="original">Keep this reel’s original actions</option><option value="directed">Choose a different character moment</option></select></label>
 {b.movement==='directed'&&<label className="brief-label">{moments.moments.length} moments for {moments.name}<select disabled={disabled} value={moment.id} onChange={e=>option({momentId:e.target.value})}>{moments.moments.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select><small>{moment.description}</small></label>}
 <label className="brief-label">Decoration changes (optional)<textarea disabled={disabled} maxLength={300} value={b.decoration??''} placeholder="Peach roses, marigold strings, warm fairy lights…" onChange={e=>option({decoration:e.target.value})}/></label>
 <label className="brief-label">Props & scene assets (optional)<input disabled={disabled} maxLength={200} value={b.props??''} placeholder="A vintage car, dhol, floral umbrella, balloons…" onChange={e=>option({props:e.target.value})}/></label>
 <label className="brief-label">Anything else for the director? (optional)<textarea disabled={disabled} maxLength={400} value={b.direction??''} placeholder="Keep the entrance gentle, then have us wave to our guests." onChange={e=>option({direction:e.target.value})}/></label>
 <p className="brief-note">Your selected reel supplies the reference. Changed actions, outfits and scenery need a new AI edit; exact motion and likeness can vary.</p>
 </section>;
}
