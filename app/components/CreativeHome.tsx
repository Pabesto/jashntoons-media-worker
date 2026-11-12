'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowDown,ArrowUpRight,AudioLines,Check,Clapperboard,ImagePlus,Layers3,Pause,Play,Sparkles,Volume2,VolumeX} from 'lucide-react';
import {getTemplate,type Template} from '@/lib/templates';
import {directionPoster,directionVideo} from '@/lib/invitation-directions';

const worlds=[
 {label:'Wedding',id:'invitation-sunehri-darwaze',name:'Sunehri Darwaze',tone:'#d4f78a',video:directionVideo('sunehri-darwaze'),poster:directionPoster('sunehri-darwaze'),duration:'15s',direction:'Carved doors. A rose-pink courtyard. A luminous garden mandap.',settingLabel:'A place to begin',cardTitle:'Together\nbegins here'},
 {label:'Birthday',id:'invitation-birthday-express',name:'The Birthday Express',tone:'#f4bea4',video:directionVideo('birthday-express'),poster:directionPoster('birthday-express'),duration:'15s',direction:'A tiny train. A storybook station. A very big birthday wish.',settingLabel:'A world of little wishes',cardTitle:'Let the\nfun begin'},
 {label:'Party',id:'invitation-afterglow',name:'Afterglow Celebration',tone:'#cbb6fb',video:directionVideo('afterglow'),poster:directionPoster('afterglow'),duration:'15s',direction:'Velvet curtains. Lilac spotlights. A little mirrorball magic.',settingLabel:'Set the atmosphere',cardTitle:'Meet us\nafter dark'},
];

export function CreativeHome({create,active=true,motion=true,onMotion}:{create:(template:Template)=>void;active?:boolean;motion?:boolean;onMotion:()=>void}){
 const [selected,setSelected]=useState(0),[playing,setPlaying]=useState(false),[muted,setMuted]=useState(true),[userPaused,setUserPaused]=useState(false);
 const video=useRef<HTMLVideoElement>(null),progress=useRef<HTMLDivElement>(null),manualPlay=useRef(false),sample=worlds[selected];
 useEffect(()=>{manualPlay.current=false},[motion]);
 useEffect(()=>{
  const el=video.current;if(!el)return;let visible=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>{const inView=visible&&!document.hidden&&active&&!document.querySelector('dialog[open]');const root=el.closest<HTMLElement>('.atelier-hero');if(root)root.dataset.visible=String(inView);if(inView&&((motion&&!reduced.matches)||manualPlay.current)&&!userPaused)void el.play().catch(()=>{});else el.pause()};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()},{threshold:.25});observer.observe(el);
  const dialogs=new MutationObserver(sync);dialogs.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  return()=>{observer.disconnect();dialogs.disconnect();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);el.pause()};
 },[selected,active,motion,userPaused]);
 function toggleVideo(){const el=video.current;if(!el)return;if(el.paused){manualPlay.current=true;setUserPaused(false);void el.play().catch(()=>{})}else{manualPlay.current=false;setUserPaused(true);el.pause()}}
 function chooseWorld(i:number){if(i===selected)return;manualPlay.current=false;setSelected(i);setUserPaused(false);setPlaying(false);if(progress.current)progress.current.style.transform='scaleX(0)';}
 const start=()=>create(getTemplate(sample.id));
 return <section className="ai-home atelier-hero" aria-labelledby="ai-home-title" data-active={active&&motion} style={{'--world-tone':sample.tone} as CSSProperties}>
  <div className="atelier-topline"><span><i/> JASHNTOONS / THE INVITATION STUDIO</span><button onClick={onMotion} aria-pressed={motion}>{motion?<Pause size={12}/>:<Play size={12}/>}Motion {motion?'on':'off'}</button></div>
  <div className="atelier-hero-grid">
   <div className="atelier-copy"><span className="atelier-kicker"><Sparkles size={14}/> AI INVITATION MAKER / SMALL FILMS. BIG FEELINGS.</span><h1 id="ai-home-title">An invitation.<br/>A little film.<br/><em>Entirely you.</em></h1><p>Choose an original style. Add your people. Make a personal invitation film and a matching card for your next big moment.</p>
    <div className="atelier-actions"><button className="atelier-primary" onClick={start}>Create a reel <ArrowUpRight size={19}/></button><a href="#invitation-collection"><Play size={15} fill="currentColor"/>Explore the films</a></div>
    <div className="atelier-assurance"><Check size={14}/><span>Video, matching card or character artwork.<br/><small>See the credit total before creating.</small></span></div>
    <div className="atelier-worlds"><span>FIND YOUR FEELING</span><div role="group" aria-label="Choose a sample celebration">{worlds.map((w,i)=><button key={w.id} aria-pressed={selected===i} onClick={()=>chooseWorld(i)}><i style={{background:w.tone}}/>{w.label}{selected===i&&<Check size={13}/>}</button>)}</div></div>
   </div>
   <div className="atelier-showcase" aria-label={sample.label+' film style preview'}>
    <div className="atelier-stage" data-playing={playing}>
     <div className="atelier-stage-texture" aria-hidden="true"/><div className="atelier-orbit atelier-orbit-one" aria-hidden="true"/><div className="atelier-orbit atelier-orbit-two" aria-hidden="true"/>
     <div className="atelier-stage-heading"><span><Clapperboard size={14}/> THE FILM ROOM</span><span>ORIGINAL SHOWCASE / {sample.duration}</span></div>
     <figure className="atelier-print atelier-print-setting" key={sample.poster+'-setting'}><img src={sample.poster} alt={sample.name+' original setting artwork'} width="540" height="960"/><figcaption><span>01 / THE SETTING</span><strong>{sample.settingLabel}</strong></figcaption></figure>
     <figure className="atelier-print atelier-print-detail atelier-print-card" key={sample.poster+'-card'}><div className="atelier-card-art"><img src={sample.poster} alt="" width="540" height="960"/><div><span>YOU'RE INVITED</span><strong>{sample.cardTitle}</strong><i>Your people. Your moment.</i></div></div><figcaption><span>02 / CARD DESIGN</span><strong>One story. A matching card.</strong></figcaption></figure>
     <div className="atelier-film"><div className="atelier-film-top"><span><i/> {sample.label.toUpperCase()} COLLECTION</span><span>9:16</span></div><div className="atelier-film-screen"><video key={sample.video} ref={video} src={sample.video} poster={sample.poster} muted={muted} playsInline loop preload="metadata" aria-label={sample.name+' sample film'} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>{const v=e.currentTarget;if(progress.current)progress.current.style.transform=`scaleX(${v.duration?v.currentTime/v.duration:0})`}}/><span className="atelier-sample-label">SAMPLE FILM</span><div className="atelier-film-controls"><button onClick={toggleVideo} aria-label={playing?'Pause sample film':'Play sample film'}>{playing?<Pause size={17}/>:<Play size={17} fill="currentColor"/>}</button><span>{sample.name}</span><button onClick={()=>setMuted(!muted)} aria-label={muted?'Unmute sample film':'Mute sample film'}>{muted?<VolumeX size={17}/>:<Volume2 size={17}/>}</button></div></div><div className="atelier-progress"><div ref={progress}/></div></div>
     <span className="atelier-stage-cross atelier-stage-cross-a" aria-hidden="true">+</span><span className="atelier-stage-cross atelier-stage-cross-b" aria-hidden="true">+</span><span className="atelier-stage-edition" aria-hidden="true">A LITTLE MOVIE MAGIC</span>
    </div>
    <div className="atelier-feature-caption"><span><small>IN THE SPOTLIGHT</small><strong>{sample.name}</strong><em>{sample.direction}</em></span><button onClick={start} aria-label={'Create with '+sample.name}>Use this style <ArrowUpRight size={17}/></button></div>
    <p className="atelier-sample-note">15-second original film and card styling example. Personalise this full film with your people and details; the original scenes guide the AI edit.</p>
   </div>
  </div>
  <div className="atelier-capabilities"><span>YOUR STORY,<br/><b>FROM FIRST PHOTO TO FINAL FRAME.</b></span><div><ImagePlus size={19}/><span>Your own characters</span></div><div><Layers3 size={19}/><span>Scenes with depth</span></div><div><AudioLines size={19}/><span>Your film, with music</span></div><a href="#how-it-works">See how it works <ArrowDown size={16}/></a></div>
 </section>;
}
