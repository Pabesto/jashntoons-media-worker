'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Bookmark,Check,Clapperboard,Coins,FolderHeart,Heart,Home,Layers3,Play,Plus,Search,Sparkles,X} from 'lucide-react';
import {reelFeed,type ReelFeedItem} from '@/lib/reel-feed';
import {getTemplate,type Template} from '@/lib/templates';
import {ReferencePlayer} from './ReferencePlayer';
import {CreatorHome} from './CreatorHome';
import type {CreationIntent} from '@/lib/creation-entry';
import {type SpotlightIntent} from './StudioSpotlight';

export type AppTab='home'|'reels'|'plans'|'creators'|'help';
export type AppReelIntent=SpotlightIntent&{key:number};
type Props={tab:AppTab;onTab:(tab:AppTab)=>void;intent:AppReelIntent;openReels:(intent?:Omit<AppReelIntent,'key'>)=>void;create:(t:Template)=>void;begin:(intent:CreationIntent)=>void;openLibrary:()=>void;active:boolean;name?:string;credits?:number;signout?:{url:string;clear:()=>void};resume?:{title:string;open:()=>void}};
const duration=(r:ReelFeedItem)=>Math.round(r.seconds)+'s';

export function MobileApp(p:Props){
 const [reelsOpened,setReelsOpened]=useState(p.tab==='reels');useEffect(()=>{if(p.tab==='reels')setReelsOpened(true)},[p.tab]);
 return <><div className={'mobile-app mobile-app-'+p.tab}>
  {p.tab==='home'&&<main className="app-home" aria-label="Your invitation studio">
   <CreatorHome mobile active={p.active&&p.tab==='home'} onExplore={p.openReels} onCreate={p.begin} onLibrary={p.openLibrary} onPlans={()=>p.onTab('plans')} onCommunity={()=>p.onTab('creators')} name={p.name} credits={p.credits} resume={p.resume}/>
   <div className="app-help-links"><button onClick={()=>p.onTab('help')}>Help & FAQs</button><button onClick={p.openLibrary}>My reels & avatars</button><a href="/privacy">Privacy</a><a href="/terms">Terms</a>{p.signout&&<a href={p.signout.url} target="_top" onClick={p.signout.clear}>Sign out</a>}</div>
  </main>}
  {(reelsOpened||p.tab==='reels')&&<div hidden={p.tab!=='reels'}><MobileReels key={p.intent.key} intent={p.intent} create={p.create} active={p.active&&p.tab==='reels'}/></div>}
 </div><nav className={'app-bottom-nav'+(p.tab==='reels'?' app-bottom-dark':'')} aria-label="App navigation" hidden={!p.active}>
   <button aria-current={['home','creators','help'].includes(p.tab)?'page':undefined} onClick={()=>p.onTab('home')}><Home size={22}/><span>Home</span></button>
   <button onClick={()=>{p.onTab('home');requestAnimationFrame(()=>document.getElementById((matchMedia('(max-width:760px)').matches?'phone':'desktop')+'-creation-tools')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}))}} aria-label="Create an invitation"><Plus size={24}/><span>Create</span></button>
   <button className="app-reels-button" aria-current={p.tab==='reels'?'page':undefined} onClick={()=>p.onTab('reels')}><span><Clapperboard size={24}/></span><small>Reels</small></button>
   <button aria-current={p.tab==='plans'?'page':undefined} onClick={()=>p.onTab('plans')}><Coins size={22}/><span>Plans</span></button>
   <button onClick={p.openLibrary}><FolderHeart size={22}/><span>My reels</span></button>
  </nav>
 </>;
}

function MobileReels({intent,create,active}:{intent:AppReelIntent;create:Props['create'];active:boolean}){
 const [category,setCategory]=useState(intent.category??'All'),[query,setQuery]=useState(''),[selected,setSelected]=useState(intent.id??reelFeed[0].id),[browse,setBrowse]=useState(!!intent.browse),[long,setLong]=useState(!!intent.long),[savedOnly,setSavedOnly]=useState(false),[saved,setSaved]=useState<string[]>([]),[limit,setLimit]=useState(12);
 const dialog=useRef<HTMLDialogElement>(null),search=useRef<HTMLInputElement>(null);
 const categories=['All',...new Set(reelFeed.map(r=>getTemplate(r.templateId).category))];
 const results=reelFeed.filter(r=>(category==='All'||getTemplate(r.templateId).category===category)&&(!long||r.seconds>=40)&&(!savedOnly||saved.includes(r.id))&&[r.name,r.tag,r.description].join(' ').toLowerCase().includes(query.toLowerCase()));
 useEffect(()=>{if(!active)setBrowse(false)},[active]);
 useEffect(()=>{if(!browse)return;try{const list=JSON.parse(localStorage.getItem('jashntoons-saved-film-styles')||'[]');setSaved(Array.isArray(list)?list:[])}catch{}},[browse]);
 useLayoutEffect(()=>{if(!browse)return;const el=dialog.current!;el.showModal();const cancel=(e:Event)=>{e.preventDefault();setBrowse(false)};el.addEventListener('cancel',cancel);return()=>{el.removeEventListener('cancel',cancel);el.close()}},[browse]);
 const clear=()=>{setCategory('All');setQuery('');setSavedOnly(false);setLong(false);setLimit(12)};
 return <section className="app-reel-screen" aria-label="Invitation reel feed">
  {results.length>0?<ReferencePlayer key={category+'|'+query+'|'+savedOnly+'|'+selected} film={results.find(r=>r.id===selected)??results[0]} items={results} embedded appView active={active&&!browse} onClose={()=>setBrowse(true)} create={create}/>:<div className="app-reels-empty"><Search size={32}/><h2>No reels found</h2><p>Try another occasion or see all styles.</p><button onClick={clear}>Show all reels</button><button onClick={()=>setBrowse(true)}>Change filters</button></div>}
  {browse&&<dialog ref={dialog} className="app-reel-browser" aria-label="Find your invitation reel"><header><button onClick={()=>setBrowse(false)} aria-label="Back to reels"><ArrowLeft size={22}/></button><div><small>YOUR INVITATION STARTS HERE</small><h2>Find your reel</h2></div><span>{results.length}</span></header><label className="app-browser-search"><Search size={18}/><input ref={search} value={query} placeholder="Search a mood or celebration" aria-label="Search mobile invitation reels" onChange={e=>{setQuery(e.target.value);setLimit(12)}}/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}</label><div className="app-browser-categories" role="group" aria-label="Filter mobile reels"><button aria-pressed={savedOnly} onClick={()=>{setSavedOnly(v=>!v);setLimit(12)}}><Bookmark size={14}/>Saved</button><button aria-pressed={long} onClick={()=>{setLong(v=>!v);setLimit(12)}}><Layers3 size={14}/>All functions</button>{categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>{setCategory(c);setLimit(12)}}>{c}{category===c&&<Check size={12}/>}</button>)}</div><p className="app-browser-note">Pick a reel. Add your photos and details once.</p><div className="app-browser-grid">{results.slice(0,limit).map(r=><button key={r.id} onClick={()=>{setSelected(r.id);setBrowse(false)}} aria-label={'Watch '+r.name}><img src={r.poster} alt="" loading="lazy"/><span className="app-browser-duration"><Play size={10} fill="currentColor"/>{duration(r)}</span><span className="app-browser-caption"><small>{getTemplate(r.templateId).category}</small><strong>{r.name}</strong></span></button>)}</div>{results.length>limit&&<button className="app-load-more" onClick={()=>setLimit(n=>n+12)}>More reels <Plus size={16}/></button>}{!results.length&&<div className="app-browser-empty"><Bookmark size={30}/><h3>{savedOnly?'Your favourites belong here.':'No reels in this search.'}</h3><p>{savedOnly?'Tap Save on any reel, then find it here.':'Try a different mood or occasion.'}</p><button onClick={clear}>Explore all reels</button></div>}</dialog>}
 </section>;
}
