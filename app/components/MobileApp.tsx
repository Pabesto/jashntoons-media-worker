'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Bookmark,Check,Clapperboard,Coins,FolderHeart,Heart,Home,Layers3,Play,Plus,Search,Sparkles,X} from 'lucide-react';
import {reelFeed,type ReelFeedItem} from '@/lib/reel-feed';
import {getTemplate,type Template} from '@/lib/templates';
import {ReferencePlayer} from './ReferencePlayer';
import {BrandMark} from './BrandLogo';

export type AppTab='home'|'reels'|'plans'|'creators'|'help';
export type AppReelIntent={id?:string;category?:string;browse?:boolean;key:number};
type Props={tab:AppTab;onTab:(tab:AppTab)=>void;intent:AppReelIntent;openReels:(intent?:Omit<AppReelIntent,'key'>)=>void;create:(t:Template)=>void;openLibrary:()=>void;active:boolean;name?:string;credits?:number;resume?:{title:string;open:()=>void}};
const occasions=['Wedding','Birthday','Haldi & Mehendi','Engagement','Baby shower','Party'];
const example=(category:string)=>reelFeed.find(r=>getTemplate(r.templateId).category===category)??reelFeed[0];
const duration=(r:ReelFeedItem)=>Math.round(r.seconds)+'s';

export function MobileApp(p:Props){
 const [reelsOpened,setReelsOpened]=useState(p.tab==='reels');useEffect(()=>{if(p.tab==='reels')setReelsOpened(true)},[p.tab]);
 return <div className={'mobile-app mobile-app-'+p.tab}>
  {p.tab==='home'&&<main className="app-home" aria-label="Your invitation studio">
   <div className="app-welcome"><div><p>{p.name?'HELLO, '+p.name.split(' ')[0].toUpperCase():'A LITTLE MAGIC, ALL YOURS'}</p><h1>Make a moment.<br/><em>Make it yours.</em></h1></div><span className="app-welcome-mark"><BrandMark/></span></div>
   <button className="app-search" onClick={()=>p.openReels({browse:true})}><Search size={19}/><span>Find your invitation reel</span><span className="app-search-key"><Sparkles size={14}/></span></button>
   <section className="app-occasions" aria-label="Choose your celebration">{occasions.map(c=><button key={c} onClick={()=>p.openReels({category:c})}><span><img src={example(c).poster} alt="" loading="lazy"/></span><strong>{c==='Haldi & Mehendi'?'Haldi':c==='Baby shower'?'Baby':c}</strong></button>)}</section>
   {p.resume&&<button className="app-resume" onClick={p.resume.open}><span><FolderHeart size={20}/></span><div><small>PICK UP WHERE YOU LEFT OFF</small><strong>{p.resume.title||'Your invitation'}</strong></div><ArrowRight size={17}/></button>}
   <button className="app-feature" onClick={()=>p.openReels({id:reelFeed[0].id})} aria-label="Watch the featured vintage invitation reel"><img src={reelFeed[0].poster} alt=""/><span className="app-feature-label"><Sparkles size={12}/> THE STUDIO EDIT</span><span className="app-feature-play"><Play size={24} fill="currentColor"/></span><span className="app-feature-copy"><small>YOUR PEOPLE. A WHOLE NEW WORLD.</small><strong>A little extra.<br/>A lot of you.</strong><span>Watch & personalise <ArrowUpRight size={18}/></span></span></button>
   <section className="app-picks" aria-labelledby="app-picks-title"><div className="app-section-heading"><div><span>FIND YOUR NEXT FAVOURITE</span><h2 id="app-picks-title">Made for your moment</h2></div><button onClick={()=>p.openReels({browse:true})} aria-label="See all invitation reels"><ArrowRight size={20}/></button></div><div className="app-picks-track">{[example('Wedding'),example('Birthday'),example('Engagement'),example('Baby shower')].map(r=><button className="app-pick" key={r.id} onClick={()=>p.openReels({id:r.id})}><div><img src={r.poster} alt="" loading="lazy"/><span><Play size={11} fill="currentColor"/> {duration(r)}</span><i><ArrowUpRight size={16}/></i></div><small>{getTemplate(r.templateId).category}</small><strong>{r.name}</strong></button>)}</div></section>
   <button className="app-long-reel" onClick={()=>p.openReels({id:reelFeed.find(r=>r.seconds>=45)?.id})}><span><Layers3 size={23}/></span><div><small>ONE INVITATION. EVERY FUNCTION.</small><strong>From haldi to happily ever after.</strong><p>Bring the whole celebration into one reel.</p></div><ArrowUpRight size={18}/></button>
   <section className="app-three-steps" aria-label="How it works">{[[Clapperboard,'Pick a reel'],[Heart,'Add your people'],[Sparkles,'Make it yours']].map(([Icon,label],i)=>{const I=Icon as typeof Heart;return <div key={String(label)}><span><I size={19}/></span><small>0{i+1}</small><strong>{String(label)}</strong></div>})}</section>
   <button className="app-wallet-card" onClick={()=>p.onTab('plans')}><span><Coins size={22}/></span><div><small>YOUR CREATIVE WALLET</small><strong>{p.credits!==undefined?p.credits+' credits ready':'Start with 2 free credits'}</strong><p>Review the cost before you create.</p></div><ArrowRight size={18}/></button>
   <button className="app-community-card" onClick={()=>p.onTab('creators')}><span><Heart size={20}/></span><div><small>THE CREATOR SPOTLIGHT</small><strong>Real people. Their big moments.</strong><p>See before & after reels from the community.</p></div><ArrowUpRight size={18}/></button>
   <div className="app-help-links"><button onClick={()=>p.onTab('help')}>Help & FAQs</button><button onClick={p.openLibrary}>My reels & avatars</button><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
  </main>}
  {(reelsOpened||p.tab==='reels')&&<div hidden={p.tab!=='reels'}><MobileReels key={p.intent.key} intent={p.intent} create={p.create} active={p.active&&p.tab==='reels'}/></div>}
  <nav className={'app-bottom-nav'+(p.tab==='reels'?' app-bottom-dark':'')} aria-label="App navigation" hidden={!p.active}>
   <button aria-current={['home','creators','help'].includes(p.tab)?'page':undefined} onClick={()=>p.onTab('home')}><Home size={22}/><span>Home</span></button>
   <button aria-current={p.tab==='reels'?'page':undefined} onClick={()=>p.onTab('reels')}><Clapperboard size={22}/><span>Reels</span></button>
   <button className="app-create" onClick={()=>p.openReels({browse:true})} aria-label="Create an invitation"><span><Plus size={26}/></span><small>Create</small></button>
   <button aria-current={p.tab==='plans'?'page':undefined} onClick={()=>p.onTab('plans')}><Coins size={22}/><span>Plans</span></button>
   <button onClick={p.openLibrary}><FolderHeart size={22}/><span>My reels</span></button>
  </nav>
 </div>;
}

function MobileReels({intent,create,active}:{intent:AppReelIntent;create:Props['create'];active:boolean}){
 const [category,setCategory]=useState(intent.category??'All'),[query,setQuery]=useState(''),[selected,setSelected]=useState(intent.id??reelFeed[0].id),[browse,setBrowse]=useState(!!intent.browse),[savedOnly,setSavedOnly]=useState(false),[saved,setSaved]=useState<string[]>([]),[limit,setLimit]=useState(12);
 const dialog=useRef<HTMLDialogElement>(null),search=useRef<HTMLInputElement>(null);
 const categories=['All',...new Set(reelFeed.map(r=>getTemplate(r.templateId).category))];
 const results=reelFeed.filter(r=>(category==='All'||getTemplate(r.templateId).category===category)&&(!savedOnly||saved.includes(r.id))&&[r.name,r.tag,r.description].join(' ').toLowerCase().includes(query.toLowerCase()));
 useEffect(()=>{if(!active)setBrowse(false)},[active]);
 useEffect(()=>{if(!browse)return;try{const list=JSON.parse(localStorage.getItem('jashntoons-saved-film-styles')||'[]');setSaved(Array.isArray(list)?list:[])}catch{}},[browse]);
 useLayoutEffect(()=>{if(!browse)return;const el=dialog.current!;el.showModal();const cancel=(e:Event)=>{e.preventDefault();setBrowse(false)};el.addEventListener('cancel',cancel);return()=>{el.removeEventListener('cancel',cancel);el.close()}},[browse]);
 const clear=()=>{setCategory('All');setQuery('');setSavedOnly(false);setLimit(12)};
 return <section className="app-reel-screen" aria-label="Invitation reel feed">
  {results.length>0?<ReferencePlayer key={category+'|'+query+'|'+savedOnly+'|'+selected} film={results.find(r=>r.id===selected)??results[0]} items={results} embedded appView active={active&&!browse} onClose={()=>setBrowse(true)} create={create}/>:<div className="app-reels-empty"><Search size={32}/><h2>No reels found</h2><p>Try another occasion or see all styles.</p><button onClick={clear}>Show all reels</button><button onClick={()=>setBrowse(true)}>Change filters</button></div>}
  {browse&&<dialog ref={dialog} className="app-reel-browser" aria-label="Find your invitation reel"><header><button onClick={()=>setBrowse(false)} aria-label="Back to reels"><ArrowLeft size={22}/></button><div><small>YOUR INVITATION STARTS HERE</small><h2>Find your reel</h2></div><span>{results.length}</span></header><label className="app-browser-search"><Search size={18}/><input ref={search} value={query} placeholder="Search a mood or celebration" aria-label="Search mobile invitation reels" onChange={e=>{setQuery(e.target.value);setLimit(12)}}/>{query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X size={16}/></button>}</label><div className="app-browser-categories" role="group" aria-label="Filter mobile reels"><button aria-pressed={savedOnly} onClick={()=>{setSavedOnly(v=>!v);setLimit(12)}}><Bookmark size={14}/>Saved</button>{categories.map(c=><button key={c} aria-pressed={category===c} onClick={()=>{setCategory(c);setLimit(12)}}>{c}{category===c&&<Check size={12}/>}</button>)}</div><p className="app-browser-note">Pick a reel. Add your photos and details once.</p><div className="app-browser-grid">{results.slice(0,limit).map(r=><button key={r.id} onClick={()=>{setSelected(r.id);setBrowse(false)}} aria-label={'Watch '+r.name}><img src={r.poster} alt="" loading="lazy"/><span className="app-browser-duration"><Play size={10} fill="currentColor"/>{duration(r)}</span><span className="app-browser-caption"><small>{getTemplate(r.templateId).category}</small><strong>{r.name}</strong></span></button>)}</div>{results.length>limit&&<button className="app-load-more" onClick={()=>setLimit(n=>n+12)}>More reels <Plus size={16}/></button>}{!results.length&&<div className="app-browser-empty"><Bookmark size={30}/><h3>{savedOnly?'Your favourites belong here.':'No reels in this search.'}</h3><p>{savedOnly?'Tap Save on any reel, then find it here.':'Try a different mood or occasion.'}</p><button onClick={clear}>Explore all reels</button></div>}</dialog>}
 </section>;
}
