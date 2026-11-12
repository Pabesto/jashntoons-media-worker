'use client';
import {useEffect,useRef,useState,type VideoHTMLAttributes} from 'react';
/** Gallery cards only connect to media when they approach the viewport. */
export function LazyVideo({src,onPlay,...props}:VideoHTMLAttributes<HTMLVideoElement>){
 const ref=useRef<HTMLVideoElement>(null),[visible,setVisible]=useState(false);
 useEffect(()=>{const video=ref.current;if(!video)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)setVisible(true);else video.pause()},{rootMargin:'100px'});observer.observe(video);const pause=()=>{if(document.hidden)video.pause()};document.addEventListener('visibilitychange',pause);return()=>{observer.disconnect();document.removeEventListener('visibilitychange',pause);video.pause();video.removeAttribute('src');video.load()}},[src]);
 return <video {...props} ref={ref} src={visible?src:undefined} preload={visible?'metadata':'none'} data-reel-player onPlay={e=>{document.querySelectorAll<HTMLVideoElement>('video[data-reel-player]').forEach(v=>{if(v!==e.currentTarget)v.pause()});onPlay?.(e)}}/>;
}
