'use client';
import {useState,type KeyboardEvent} from 'react';
import {ArrowRight,ArrowUpRight,AudioLines,Check,ImagePlus,Layers3,Play,ScanFace,Type} from 'lucide-react';
import {getTemplate,type Template} from '@/lib/templates';

const steps=[
 {title:'Choose the feeling.',label:'Pick a style',icon:Layers3,description:'Watch a complete sample, choose its style and select Video reel or Avatar / photo. Your choice follows you into the studio.',image:'/reference-films/shaadi-haveli.webp',alt:'Pink haveli invitation style reference',caption:'Start with a world you love.',note:'Original style reference',chips:['Watch the complete sample','Keep your selected style']},
 {title:'Bring your people.',label:'Add photos & details',icon:ImagePlus,description:'Upload clear photos, then add names, date and venue for a reel. Add your own voice if you want speaking and lip-sync; music-only works too.',image:'/studio/avatars-photo/wedding-01.webp',alt:'Example of an illustrated wedding couple',caption:'Your people are the main characters.',note:'Illustration example',chips:['Read your photos together','Save your illustrated people']},
 {title:'Make the final cut.',label:'Create, preview & share',icon:Play,description:'Review the credit total and create. Check the result, edit the text, adjust the look and sound, then finish your reel. Download privately or choose Publish.',image:'/reference-films/shaadi-haveli-scene-3.webp',alt:'Flower-filled garden invitation scene reference',caption:'Every detail, in its place.',note:'Scene and layout example',chips:['Preview your changes','Choose when to publish']},
];

export function AIWorkflow({create}:{create:(template:Template)=>void}){
 const [selected,setSelected]=useState(0),step=steps[selected];
 function move(event:KeyboardEvent<HTMLButtonElement>,index:number){let next=index;if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%steps.length;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+steps.length-1)%steps.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=steps.length-1;else return;event.preventDefault();setSelected(next);document.getElementById('workflow-tab-'+next)?.focus();}
 return <section className="home-process" id="how-it-works" aria-labelledby="how-title">
  <div className="home-process-copy"><span className="home-workbench-kicker">THE PROCESS / THREE SIMPLE STEPS</span><h2 id="how-title">You have the story.<br/><em>Here's the studio.</em></h2><p>No blank canvas. No prompt to figure out.<br/>Just your celebration, one step at a time.</p>
   <div className="home-process-tabs" role="tablist" aria-label="Explore the creation workflow" aria-orientation="vertical">{steps.map((item,i)=><button key={item.label} type="button" id={'workflow-tab-'+i} role="tab" aria-selected={selected===i} aria-controls="workflow-preview" tabIndex={selected===i?0:-1} onClick={()=>setSelected(i)} onKeyDown={e=>move(e,i)}><span className="home-process-number">0{i+1}</span><span><small>{item.label}</small><strong>{item.title}</strong></span><ArrowUpRight size={19}/></button>)}</div>
   <button className="home-process-start" onClick={()=>create(getTemplate('reference-shaadi-haveli'))}>Open your studio <ArrowRight size={17}/></button>
  </div>
  <div className="home-process-preview" id="workflow-preview" role="tabpanel" aria-labelledby={'workflow-tab-'+selected} tabIndex={0}>
   <div className="home-process-toolbar"><span><i/> STUDIO WALKTHROUGH</span><span>0{selected+1} / 03</span></div>
   <div className="home-process-stage" data-step={selected}>
    <div className="home-process-plane" aria-hidden="true"/><div className="home-process-photo" key={step.image}><img src={step.image} alt={step.alt} width="720" height="1280" loading="lazy"/>{selected===1&&<div className="home-process-crop" aria-hidden="true"><i/><i/><i/><i/></div>}<span>{step.note}</span></div>
    <div className="home-process-caption"><span>THE ART OF AN INVITATION</span><strong>{step.caption}</strong><div>{step.chips.map(chip=><span key={chip}><Check size={13}/>{chip}</span>)}</div></div>
    <div className="home-process-tools" aria-hidden="true"><Layers3 className={selected===0?'active':''}/><ScanFace className={selected===1?'active':''}/><Type className={selected===2?'active':''}/><AudioLines/></div>
   </div>
   <div className="home-process-description"><step.icon size={21}/><p>{step.description}</p></div>
   <div className="home-process-track" aria-hidden="true">{steps.map((s,i)=><div key={s.label} className={selected===i?'is-active':''}><span>0{i+1}</span><span>{['Style','Your people','Your reel'][i]}</span></div>)}</div>
  </div>
 </section>;
}
