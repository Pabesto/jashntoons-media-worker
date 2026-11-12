'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Film,Play} from 'lucide-react';
import {referenceFilms,referenceTemplates,referenceFile,type ReferenceFilm} from '@/lib/reference-films';
import type {Template} from '@/lib/templates';
import {ReferencePlayer} from './ReferencePlayer';
export {ReferencePlayer} from './ReferencePlayer';

const collections=[
 {name:'All films',ids:referenceFilms.map(f=>f.id)},
 {name:'Haveli stories',ids:['nyota-welcome','shaadi-haveli','wedding-street']},
 {name:'Royal romance',ids:['rajasthan-folk','heritage-scroll','royal-doors','storybook-wedding']},
 {name:'Save the date',ids:['vintage-date']},
];
const time=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;

export function ReferenceCollection({create,onWatch}:{create:(t:Template)=>void;onWatch?:(film:ReferenceFilm)=>void}){
 const [watch,setWatch]=useState<ReferenceFilm|null>(null),[collection,setCollection]=useState(0),[edges,setEdges]=useState({start:true,end:false});
 const track=useRef<HTMLDivElement>(null),films=referenceFilms.filter(f=>collections[collection].ids.includes(f.id));
 const refresh=()=>{const el=track.current;if(el)setEdges({start:el.scrollLeft<4,end:el.scrollLeft+el.clientWidth>=el.scrollWidth-4})};
 useEffect(()=>{const el=track.current;if(!el)return;el.scrollTo({left:0});const observer=new ResizeObserver(refresh);observer.observe(el);refresh();return()=>observer.disconnect()},[collection]);
 const slide=(by:number)=>{const el=track.current;if(el)el.scrollBy({left:by*(el.clientWidth*.8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})};
 return <section className="reference-collection film-shelf" id="reference-reels" aria-labelledby="film-shelf-heading">
  <div className="film-shelf-heading"><div><span className="film-kicker"><i/> THE SIGNATURE COLLECTION / 08 WORLDS</span><h2 id="film-shelf-heading">A little cinema.<br/><em>A lot of you.</em></h2></div><div><p>Watch the whole story. Find your setting.<br/>Then bring your own people into the picture.</p><a href="#how-it-works">How it becomes yours <ArrowUpRight size={15}/></a></div></div>
  <div className="film-shelf-toolbar"><div role="group" aria-label="Filter reference films">{collections.map((item,i)=><button key={item.name} aria-pressed={collection===i} onClick={()=>setCollection(i)}>{item.name}<span>{item.ids.length}</span></button>)}</div><div className="film-shelf-arrows"><button disabled={edges.start} aria-label="Scroll films left" onClick={()=>slide(-1)}><ArrowLeft size={18}/></button><button disabled={edges.end} aria-label="Scroll films right" onClick={()=>slide(1)}><ArrowRight size={18}/></button></div></div>
  <div ref={track} className="film-shelf-track" onScroll={refresh} tabIndex={0} aria-label="Reference film collection. Scroll horizontally to browse.">{films.map(f=>{const i=referenceFilms.indexOf(f);return <article key={f.id} className="film-shelf-card"><button className="film-shelf-poster" aria-label={'Watch full reference: '+f.name} onClick={()=>onWatch?onWatch(f):setWatch(f)}><img src={referenceFile(f.id,'poster')} alt={f.description} loading="lazy" width={540} height={960}/><span className="film-card-index">{String(i+1).padStart(2,'0')}<i> / ORIGINAL FILM</i></span><span className="film-card-play"><Play size={17} fill="currentColor"/> Watch film <b>{time(f.seconds)}</b></span><span className="film-card-tag">{f.tag}</span></button><div className="film-shelf-copy"><div><h3>{f.name}</h3><p>{f.description}</p></div><button aria-label={'Create in '+f.name+' style'} onClick={()=>create(referenceTemplates[i])}><ArrowUpRight size={20}/></button></div></article>})}</div>
  <div className="film-shelf-foot"><span><Film size={15}/> Full original films. Personalise the selected film at its original duration.</span><span>YOUR PHOTOS <i>→</i> YOUR CHARACTERS <i>→</i> YOUR FILM</span></div>
  {watch&&<ReferencePlayer film={watch} onClose={()=>setWatch(null)} create={create}/>}
 </section>;
}
