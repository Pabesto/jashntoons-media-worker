'use client';
import {useEffect,useId} from 'react';

/** Vector-native motion art keeps its shape on every screen, with no extra media requests. */
export function MotionGlyph({className=''}:{className?:string}){
 const id=useId().replace(/:/g,'');
 return <svg className={'motion-glyph '+className} viewBox="0 0 240 240" width="240" height="240" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id={id+'-r'} x1="36" y1="24" x2="207" y2="215" gradientUnits="userSpaceOnUse"><stop stopColor="#e8ffc0"/><stop offset=".45" stopColor="#b5f065"/><stop offset=".72" stopColor="#638f36"/><stop offset="1" stopColor="#efffdc"/></linearGradient><radialGradient id={id+'-c'}><stop stopColor="#efffd9"/><stop offset=".5" stopColor="#c8f68c"/><stop offset="1" stopColor="#8bb95b"/></radialGradient></defs><g className="motion-glyph-orbits" stroke={'url(#'+id+'-r)'} strokeWidth="9"><ellipse cx="120" cy="120" rx="101" ry="39" transform="rotate(-30 120 120)"/><ellipse cx="120" cy="120" rx="101" ry="39" transform="rotate(30 120 120)"/><ellipse cx="120" cy="120" rx="101" ry="39" transform="rotate(90 120 120)"/></g><circle cx="120" cy="120" r="23" fill={'url(#'+id+'-c)'}/><circle cx="120" cy="120" r="36" stroke="#e4ffbf" strokeOpacity=".25" strokeDasharray="2 9"/><circle cx="202" cy="73" r="5" fill="#f4ffdf"/></svg>;
}
export function StudioSignal({busy=false}:{busy?:boolean}){return <span className={'studio-signal'+(busy?' is-working':'')}><MotionGlyph/><span>{busy?'AI IN MOTION':'AI CREATIVE STUDIO'}</span></span>}
export function MotionAtmosphere(){
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>('.ai-experience');if(!root)return;
  const elements=root.querySelectorAll('main>section,.occasion-collection__heading,.reel-edit-heading,.creator-heading,.packages-heading');
  if(typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.setAttribute('data-in-view','true');observer.unobserve(entry.target)}}),{threshold:.08});
  elements.forEach(el=>{el.setAttribute('data-motion-reveal','true');observer.observe(el)});
  const visibility=()=>{root.dataset.ambientPaused=String(document.hidden)};visibility();document.addEventListener('visibilitychange',visibility);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',visibility)};
 },[]);
 return <div className="motion-atmosphere" aria-hidden="true"><span/><span/><span/></div>;
}
