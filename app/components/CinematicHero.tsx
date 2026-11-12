'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowDown,ArrowUpRight,Check,Flower2,Pause,Play,Sparkles,Volume2} from 'lucide-react';
import {getTemplate,type Template} from '@/lib/templates';
import {CUSTOM_FILM_ID} from '@/lib/custom-film';

export function CinematicHero({create}:{create:(template:Template)=>void}){
 const hero=useRef<HTMLElement>(null),stage=useRef<HTMLDivElement>(null),reel=useRef<HTMLVideoElement>(null);
 const [effects,setEffects]=useState(true),[playing,setPlaying]=useState(false);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setEffects(!preference.matches);update();preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const root=hero.current?.closest<HTMLElement>('.home-studio');if(!root)return;
  root.dataset.effects=effects?'on':'off';
  const seen=new WeakSet<Element>();let frame=0;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){(entry.target as HTMLElement).dataset.reveal='visible';observer.unobserve(entry.target);}}),{threshold:.06,rootMargin:'0px 0px -30px 0px'});
  const scan=()=>root.querySelectorAll<HTMLElement>('main > section:not(.cinematic-hero), .reel-library-card, .home-how li, .package-card').forEach((el,i)=>{if(seen.has(el))return;seen.add(el);el.style.setProperty('--reveal-delay',(i%3)*60+'ms');if(effects&&el.getBoundingClientRect().top>innerHeight-35){el.dataset.reveal='pending';observer.observe(el);}else el.dataset.reveal='visible';});
  scan();const updates=new MutationObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(scan);});updates.observe(root.querySelector('main')??root,{childList:true,subtree:true});
  return()=>{observer.disconnect();updates.disconnect();cancelAnimationFrame(frame);root.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el=>el.dataset.reveal='visible');};
 },[effects]);
 useEffect(()=>{
  const el=stage.current,section=hero.current;if(!el||!section||!effects||!matchMedia('(pointer:fine)').matches)return;
  let frame=0;const move=(event:PointerEvent)=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const bounds=section.getBoundingClientRect();el.style.setProperty('--pointer-x',String((event.clientX-bounds.left)/bounds.width-.5));el.style.setProperty('--pointer-y',String((event.clientY-bounds.top)/bounds.height-.5));});};
  const reset=()=>{cancelAnimationFrame(frame);el.style.setProperty('--pointer-x','0');el.style.setProperty('--pointer-y','0');};section.addEventListener('pointermove',move);section.addEventListener('pointerleave',reset);return()=>{section.removeEventListener('pointermove',move);section.removeEventListener('pointerleave',reset);reset();};
 },[effects]);
 useEffect(()=>{
  const video=reel.current;if(!video)return;let visible=false,pausedByViewer=false;
  const play=()=>{if(visible&&effects&&!document.hidden&&!pausedByViewer)void video.play().catch(()=>{});};
  const paused=()=>{if(visible&&effects&&!document.hidden&&!video.ended)pausedByViewer=true;};
  const resumed=()=>{pausedByViewer=false;};
  const visibility=()=>{if(document.hidden)video.pause();else play();};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)play();else video.pause();},{threshold:.2});
  observer.observe(video);video.addEventListener('pause',paused);video.addEventListener('play',resumed);document.addEventListener('visibilitychange',visibility);if(!effects)video.pause();
  return()=>{observer.disconnect();video.removeEventListener('pause',paused);video.removeEventListener('play',resumed);document.removeEventListener('visibilitychange',visibility);video.pause();};
 },[effects]);
 function watch(){const video=reel.current;if(!video)return;video.muted=false;void video.play().catch(()=>{});video.scrollIntoView({block:'center',behavior:effects?'smooth':'instant'});}
 function toggleVideo(){const video=reel.current;if(!video)return;if(video.paused)void video.play().catch(()=>{});else video.pause();}
 const ribbon=['Your people','Your story','A little movie magic','Weddings','Birthdays','Beautiful beginnings'];
 return <>
  <section ref={hero} className="cinematic-hero" aria-labelledby="home-title">
   <div className="cinema-scenery" aria-hidden="true"><img src="/studio/scenes-photo/wedding.webp" alt=""/><div className="cinema-light"/><div className="cinema-grain"/>{Array.from({length:12},(_,i)=><i key={i} className="cinema-petal" style={{'--petal-x':(i*37%97)+'%','--petal-delay':-i*1.7+'s','--petal-time':14+i%5*3+'s','--petal-size':5+i%4*2+'px'} as CSSProperties}/>)}</div>
   <div className="cinema-hero-inner">
    <div className="cinema-copy"><span className="cinema-hero-overline"><span/>THE ART OF SAYING “YOU’RE INVITED”</span><h1 id="home-title">Big feelings.<br/>Little films.<br/><em>All you.</em><Flower2 aria-hidden="true" strokeWidth={.65}/></h1><p>Turn your favourite people and life’s beautiful moments into invitations worth watching. And watching again.</p><div className="cinema-actions"><a href="#templates" className="button cinema-primary">Find your invitation <ArrowUpRight size={18}/></a><button className="cinema-watch" onClick={watch}><span><Play size={13} fill="currentColor"/></span>Watch with sound</button></div><div className="cinema-promise"><span><Check size={13}/>2 free standard reel credits</span><span>Your photos. Your story.</span></div><div className="cinema-editor-note"><span className="cinema-note-line"/><small>FROM A LITTLE IDEA<br/><b>TO A BIG “WOW”.</b></small><Sparkles size={22} strokeWidth={1}/></div></div>
    <div ref={stage} className="cinema-stage" aria-label="Featured invitation film">
     <div className="cinema-stage-heading"><span>THE FEATURED FILM</span><span>01 / HAVELI NAMASTE</span></div>
     <div className="cinema-orbit" aria-hidden="true"><span/><span/><Flower2 strokeWidth={.5}/></div>
     <button className="cinema-floating-card cinema-float-birthday" onClick={()=>create(getTemplate('studio-birthday-01'))} aria-label="Explore photo birthday invitations"><img src="/studio/posters/birthday-01.webp" alt="Photo-style birthday invitation" width={720} height={1280}/><span>FOR THEIR LITTLE BIG DAY <ArrowUpRight size={12}/></span></button>
     <button className="cinema-floating-card cinema-float-baby" onClick={()=>create(getTemplate('studio-baby-shower-01'))} aria-label="Explore baby shower invitations"><img src="/studio/posters/baby-shower-01.webp" alt="Photo-style baby shower invitation" width={720} height={1280}/><span>A BEAUTIFUL BEGINNING <ArrowUpRight size={12}/></span></button>
     <figure className="cinema-main-reel"><div className="cinema-reel-frame"><video ref={reel} controls muted loop playsInline preload="metadata" poster="/studio/films/haveli-door-film.webp" src="/studio/films/haveli-door-film.mp4" aria-label="Featured Haveli Namaste invitation reel" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/></div><figcaption><div><span>Haveli Namaste</span><small>15 SEC / STYLE REFERENCE</small></div><button onClick={()=>create(getTemplate(CUSTOM_FILM_ID))} aria-label="Create this Haveli Namaste reel">Make it yours <ArrowUpRight size={17}/></button></figcaption></figure>
     <div className="cinema-wax-seal" aria-hidden="true"><Flower2 size={24} strokeWidth={1}/><span>A LITTLE<br/>MAIN CHARACTER<br/>ENERGY</span></div>
     <div className="cinema-film-controls"><button onClick={toggleVideo} aria-label={playing?'Pause featured reel':'Play featured reel'}>{playing?<Pause size={13}/>:<Play size={13}/>} {playing?'Playing the magic':'Play the magic'}</button><span/><button onClick={watch} aria-label="Turn on featured reel sound"><Volume2 size={14}/>Sound on</button></div>
    </div>
   </div>
   <div className="cinema-hero-foot"><a href="#occasions">SCROLL INTO THE CELEBRATION <ArrowDown size={14}/></a><button onClick={()=>setEffects(v=>!v)} aria-pressed={!effects} aria-label={effects?'Pause visual effects':'Enable visual effects'}>{effects?<Pause size={12}/>:<Play size={12}/>} {effects?'Pause visual effects':'Enable visual effects'}</button><span>MADE WITH FEELING. PERSONALISED BY YOU.</span></div>
  </section>
  <div className="celebration-ribbon" aria-label="Your people, your story. Invitations for weddings, birthdays and beautiful beginnings."><div aria-hidden="true">{[0,1].map(copy=><span key={copy}>{ribbon.map(word=><span key={word}>{word}<Flower2 size={22} strokeWidth={1}/></span>)}</span>)}</div></div>
 </>;
}
