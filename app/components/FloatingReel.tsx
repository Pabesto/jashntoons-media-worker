'use client';
import {reelPlaybackSource} from '@/lib/reel-playback';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowUpRight,Pause,Play,Volume2,VolumeX,X} from 'lucide-react';
import {referenceFilm,referenceFile,type ReferenceFilm} from '@/lib/reference-films';

export function FloatingReel({active,motion,onWatch}:{active:boolean;motion:boolean;onWatch:(film:ReferenceFilm)=>void}){
 const film=referenceFilm('shaadi-haveli')!;
 const [collapsed,setCollapsed]=useState(false),[compact,setCompact]=useState(false),[muted,setMuted]=useState(true),[paused,setPaused]=useState(false),[playing,setPlaying]=useState(false);
 const [previewWidth,setPreviewWidth]=useState(208);
 const video=useRef<HTMLVideoElement>(null),manual=useRef(false);
 const [otherPlaying,setOtherPlaying]=useState(false);
 // Fit into the page's existing gutter; never reserve space or move page content.
 useEffect(()=>{
  if(!active)return;
  let frame=0;
  const sync=()=>{
   if(innerWidth<1840||innerHeight<601){setCompact(true);return}
   const height=Math.min(208,(innerHeight-322)*.5625)*16/9+86,top=(innerHeight-height)/2;
   const sections=[...document.querySelectorAll('.desktop-home-content > *, .jashntoons > .site-footer')];
   const visible=sections.map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0&&r.bottom>top&&r.top<top+height);
   const available=visible.length?Math.floor(Math.min(...visible.map(r=>r.left))-36):208;
   setCompact(available<164);setPreviewWidth(Math.max(164,Math.min(208,available)));
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(sync)};
  const observer=new ResizeObserver(schedule);const main=document.querySelector('.desktop-home-content');if(main)observer.observe(main);
  window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,{passive:true});sync();
  return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule)};
 },[active]);
 // Muted background previews can run alongside the dock. A visible film with
 // sound or native playback controls takes priority when someone watches it.
 useEffect(()=>{let frame=0;const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setOtherPlaying([...document.querySelectorAll('video')].some(v=>{if(v===video.current||v.paused||(!v.controls&&!v.closest('.reels-shell')&&(v.muted||v.volume===0)))return false;const r=v.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.width>0})));};document.addEventListener('play',sync,true);document.addEventListener('pause',sync,true);document.addEventListener('volumechange',sync,true);window.addEventListener('scroll',sync,{passive:true});sync();return()=>{cancelAnimationFrame(frame);document.removeEventListener('play',sync,true);document.removeEventListener('pause',sync,true);document.removeEventListener('volumechange',sync,true);window.removeEventListener('scroll',sync)}},[]);
 const [overlay,setOverlay]=useState(false);
 useEffect(()=>{const sync=()=>setOverlay(Boolean(document.querySelector('dialog[open]')));sync();const observer=new MutationObserver(sync);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});return()=>observer.disconnect()},[]);
 useEffect(()=>{const el=video.current;if(!el)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>{if(active&&!overlay&&!otherPlaying&&!collapsed&&!compact&&!paused&&!document.hidden&&((motion&&!reduced.matches)||manual.current))void el.play().catch(()=>setPlaying(false));else el.pause()};sync();document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);return()=>{el.pause();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync)}},[active,collapsed,compact,motion,paused,overlay,otherPlaying]);
 if(!active||overlay||otherPlaying)return null;
 if(compact||collapsed)return <button className="reel-dock-reopen" onClick={()=>compact?onWatch(film):setCollapsed(false)} aria-label={compact?'Watch invitation sample':'Show invitation sample'}><img src={referenceFile(film.id,'poster')} alt=""/><Play size={15}/><span>Watch sample</span></button>;
 return <aside className="reel-dock" style={{'--reel-preview-width':`${previewWidth}px`} as CSSProperties} aria-label="Jashntoons sample invitation"><div className="reel-dock-heading"><span><i/> STUDIO SPOTLIGHT</span><button onClick={()=>setCollapsed(true)} aria-label="Minimise sample reel"><X size={14}/></button></div><div className="reel-dock-screen"><video ref={video} src={reelPlaybackSource(referenceFile(film.id))} poster={referenceFile(film.id,'poster')} muted={muted} playsInline loop preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/><button className="reel-dock-open" onClick={()=>onWatch(film)} aria-label="Watch the complete Shaadi Ka Ghar reference"><span>Made for<br/><em>your people.</em></span><ArrowUpRight size={20}/></button><div className="reel-dock-controls"><button aria-label={playing?'Pause sample':'Play sample'} onClick={()=>{const el=video.current;if(!el)return;if(el.paused){manual.current=true;setPaused(false);void el.play().catch(()=>{})}else{manual.current=false;setPaused(true);el.pause()}}}>{playing?<Pause size={13}/>:<Play size={13}/>}</button><span>STYLE REFERENCE</span><button aria-label={muted?'Unmute sample':'Mute sample'} onClick={()=>setMuted(v=>!v)}>{muted?<VolumeX size={13}/>:<Volume2 size={13}/>}</button></div></div><button className="reel-dock-cta" onClick={()=>onWatch(film)}>Make a reel like this <ArrowUpRight size={14}/></button></aside>;
}
