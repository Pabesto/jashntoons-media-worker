'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Bookmark,Check,ChevronDown,ChevronUp,Info,LoaderCircle,Pause,Play,Share2,Volume2,VolumeX,X} from 'lucide-react';
import {reelFeed} from '@/lib/reel-feed';
import {getTemplate,type Template} from '@/lib/templates';
import {BrandMark} from './BrandLogo';

const savedKey='jashntoons-saved-film-styles';
const time=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;

export function ReferencePlayer({film,onClose,create}:{film:{id:string};onClose:()=>void;create:(t:Template)=>void}){
 const [index,setIndex]=useState(Math.max(0,reelFeed.findIndex(f=>f.id===film.id)));
 const [muted,setMuted]=useState(true),[playing,setPlaying]=useState(false),[position,setPosition]=useState(0),[length,setLength]=useState(reelFeed.find(f=>f.id===film.id)?.seconds??30);
 const [failed,setFailed]=useState(false),[buffering,setBuffering]=useState(true),[details,setDetails]=useState(false),[saved,setSaved]=useState<string[]>([]),[notice,setNotice]=useState(''),[direction,setDirection]=useState(1);
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),stage=useRef<HTMLDivElement>(null),detailsButton=useRef<HTMLButtonElement>(null),sheetClose=useRef<HTMLButtonElement>(null);
 const touch=useRef<{x:number;y:number}|null>(null),wheel=useRef({sum:0,last:0,moved:0}),close=useRef(onClose),detailsOpen=useRef(details),wasDetailsOpen=useRef(false);close.current=onClose;detailsOpen.current=details;
 const current=reelFeed[index],isSaved=saved.includes(current.id);
 const move=useCallback((by:number)=>{setDirection(by);setIndex(i=>(i+by+reelFeed.length)%reelFeed.length);setDetails(false);setNotice('')},[]);

 useEffect(()=>{
  const el=dialog.current!,old=document.body.style.overflow;el.showModal();document.body.style.overflow='hidden';document.querySelectorAll('video').forEach(v=>{if(v!==video.current)v.pause()});
  const cancel=(e:Event)=>{e.preventDefault();if(detailsOpen.current)setDetails(false);else close.current()};
  const key=(e:KeyboardEvent)=>{
   if(detailsOpen.current||(e.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]'))return;
   if(e.key==='ArrowDown'||e.key==='ArrowRight'){e.preventDefault();move(1)}
   if(e.key==='ArrowUp'||e.key==='ArrowLeft'){e.preventDefault();move(-1)}
   if(e.code==='Space'&&!(e.target as HTMLElement).closest('button')){e.preventDefault();const v=video.current;if(v){if(v.paused)void v.play().catch(()=>{});else v.pause()}}
  };
  el.addEventListener('cancel',cancel);el.addEventListener('keydown',key);
  try{const value=JSON.parse(localStorage.getItem(savedKey)||'[]');if(Array.isArray(value))setSaved(value.filter((id:unknown)=>typeof id==='string'&&reelFeed.some(f=>f.id===id)))}catch{}
  return()=>{el.removeEventListener('cancel',cancel);el.removeEventListener('keydown',key);el.close();document.body.style.overflow=old};
 },[move]);
 useEffect(()=>{
  const el=video.current;if(!el)return;setPosition(0);setLength(current.seconds);setPlaying(false);setFailed(false);setBuffering(true);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)void el.play().catch(()=>{setPlaying(false);setBuffering(false)});
  const visibility=()=>{if(document.hidden)el.pause()};document.addEventListener('visibilitychange',visibility);return()=>{el.pause();document.removeEventListener('visibilitychange',visibility)};
 },[current.id,current.seconds]);
 useEffect(()=>{
  const el=stage.current;if(!el)return;
  const scroll=(e:WheelEvent)=>{
   if(e.ctrlKey||detailsOpen.current||Math.abs(e.deltaX)>Math.abs(e.deltaY)||(e.target as HTMLElement).closest('input,button:not(.reels-tap-zone)'))return;
   e.preventDefault();const now=Date.now(),w=wheel.current;if(now-w.last>180)w.sum=0;w.last=now;
   if(now-w.moved<700)return;w.sum+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
   if(Math.abs(w.sum)>55){w.moved=now;move(w.sum>0?1:-1);w.sum=0;}
  };
  el.addEventListener('wheel',scroll,{passive:false});return()=>el.removeEventListener('wheel',scroll);
 },[move]);
 useEffect(()=>{if(details)sheetClose.current?.focus();else if(wasDetailsOpen.current)detailsButton.current?.focus({preventScroll:true});wasDetailsOpen.current=details},[details]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3000);return()=>clearTimeout(timer)},[notice]);

 function toggle(){const el=video.current;if(!el)return;if(el.paused)void el.play().catch(()=>setPlaying(false));else el.pause()}
 function save(){const next=isSaved?saved.filter(id=>id!==current.id):[...saved,current.id];try{localStorage.setItem(savedKey,JSON.stringify(next));setSaved(next);setNotice(isSaved?'Removed from saved styles':'Style saved on this device')}catch{setNotice('Saving is unavailable in this browser')}}
 async function share(){const url=new URL('/',location.origin);url.searchParams.set('watch',current.id);try{if(navigator.share)await navigator.share({title:current.name+' · Jashntoons',url:url.href});else{await navigator.clipboard.writeText(url.href);setNotice('Reel link copied')}}catch(e){if((e as Error).name!=='AbortError')setNotice('Could not share this reel. Please try again.')}}
 function choose(){onClose();create(getTemplate(current.templateId))}
 function closeDetails(){setDetails(false)}

 return <dialog ref={dialog} className="reels-viewer" aria-label="Invitation reels" onClick={e=>{if(e.target===dialog.current)onClose()}}>
  <div className="reels-shell" inert={details}>
   <header className="reels-header"><button onClick={onClose} aria-label="Back to website"><ArrowLeft size={20}/><span>Reels</span></button><span className="reels-header-brand">JASHNTOONS <BrandMark/></span><button onClick={onClose} aria-label="Close film viewer"><X size={23}/></button></header>
   <main className="reels-stage" ref={stage} aria-label="Swipe up or down to explore invitation reels" onTouchStart={e=>{touch.current=(e.target as HTMLElement).closest('button:not(.reels-tap-zone),input')?null:{x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{const start=touch.current;touch.current=null;if(!start)return;const dy=start.y-e.changedTouches[0].clientY,dx=start.x-e.changedTouches[0].clientX;if(Math.abs(dy)>60&&Math.abs(dy)>Math.abs(dx)*1.2){e.preventDefault();move(dy>0?1:-1)}}} onTouchCancel={()=>{touch.current=null}}>
    <div className="reels-frame" key={current.id} data-direction={direction>0?'next':'previous'}>
     <div className="reels-backdrop" style={{backgroundImage:`url("${current.poster}")`}}/>
     <video ref={video} src={current.video} poster={current.poster} playsInline muted={muted} loop preload="metadata" aria-label={current.name+' original style reference'} onLoadedMetadata={e=>setLength(e.currentTarget.duration||current.seconds)} onCanPlay={()=>setBuffering(false)} onWaiting={()=>setBuffering(true)} onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onPlay={()=>setPlaying(true)} onPlaying={()=>setBuffering(false)} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setBuffering(false)}}/>
     <button className="reels-tap-zone" onClick={toggle} aria-label={playing?'Pause film':'Play film'}>{!playing&&!buffering&&!failed&&<span><Play size={34} fill="currentColor"/></span>}</button>
     <span className="reels-reference-label">{current.kind==='template'?'TEMPLATE PREVIEW':'ORIGINAL INVITATION'}</span>
     <span className="reels-counter" aria-live="polite">{index+1} / {reelFeed.length}</span>
     {buffering&&!failed&&<div className="reels-buffering" role="status" aria-label="Loading reel"><LoaderCircle size={30}/></div>}
     {failed&&<div className="reels-error"><p>This reel could not load.</p><button onClick={()=>{setFailed(false);setBuffering(true);video.current?.load();void video.current?.play().catch(()=>setBuffering(false))}}>Try again</button><button onClick={()=>move(1)}>Next reel</button></div>}
     <div className="reels-caption"><div className="reels-creator"><span><BrandMark/></span><strong>jashntoons</strong><Check size={12}/><small>Invitation studio</small></div><h2>{current.name}</h2><p>{current.tag} <span>· {Math.round(length)}s</span></p><button className="reels-use-style" onClick={choose}>Use this reel <ArrowUpRight size={16}/></button></div>
     <div className="reels-actions" aria-label="Reel actions"><button aria-label={muted?'Turn sound on':'Mute film'} onClick={()=>setMuted(v=>!v)}>{muted?<VolumeX/>:<Volume2/>}<span>{muted?'Sound':'Mute'}</span></button><button aria-label={isSaved?'Unsave this style':'Save this style on this device'} aria-pressed={isSaved} onClick={save}><Bookmark fill={isSaved?'currentColor':'none'}/><span>{isSaved?'Saved':'Save'}</span></button><button aria-label="Share this reel" onClick={()=>void share()}><Share2/><span>Share</span></button><button ref={detailsButton} aria-label="About this invitation style" aria-expanded={details} onClick={()=>setDetails(true)}><Info/><span>Details</span></button></div>
     <div className="reels-progress"><button aria-label={playing?'Pause reel playback':'Play reel playback'} onClick={toggle}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><span>{time(position)}</span><input type="range" min="0" max={length||1} step="0.1" value={Math.min(position,length||1)} aria-label="Film playback position" onChange={e=>{const n=Number(e.target.value);if(video.current)video.current.currentTime=n;setPosition(n)}}/><span>{time(length)}</span></div>
    </div>
    <nav className="reels-pagination" aria-label="Browse invitation reels"><button aria-label="Previous film" onClick={()=>move(-1)}><ChevronUp/></button><button aria-label="Next film" onClick={()=>move(1)}><ChevronDown/></button><span>Scroll to explore</span></nav>
   </main>
   <span className="reels-swipe-hint"><ChevronUp size={13}/> Swipe up for the next invitation</span>
  </div>
  {notice&&<div className="reels-notice" role="status">{notice}</div>}
  {details&&<div className="reels-details-layer"><button className="reels-details-dismiss" aria-label="Close style details" onClick={closeDetails}/><section className="reels-details" aria-label="Invitation style details"><button ref={sheetClose} className="reels-sheet-close" aria-label="Back to reel" onClick={closeDetails}><X/></button><span>{current.tag}</span><h2>{current.name}</h2><p>{current.description}</p>{current.shots.length>0&&<ol>{current.shots.map((shot,i)=><li key={shot}><b>0{i+1}</b>{shot}</li>)}</ol>}<p className="reels-details-note">{current.note}</p><button className="reels-use-style" onClick={choose}>Use this reel <ArrowUpRight size={17}/></button><small>Review credits before creating your invitation.</small></section></div>}
 </dialog>;
}
