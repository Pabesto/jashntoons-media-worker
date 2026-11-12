'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,Camera,Clapperboard,Heart,Layers3,PartyPopper,Play,Sparkles} from 'lucide-react';
import {reelFeed} from '@/lib/reel-feed';
import {reelPlaybackSource} from '@/lib/reel-playback';

export type SpotlightIntent={id?:string;category?:string;browse?:boolean;long?:boolean};
const stories=[
 {template:'reference-vintage-date',label:'THE WEDDING EDIT',title:<>A little extra.<br/>A lot of you.</>,tone:'wedding'},
 {template:'reference-shaadi-haveli',label:'EVERY FUNCTION. ONE FILM.',title:<>The whole celebration.<br/>One unforgettable invite.</>,tone:'functions'},
 {template:'candy-carnival',label:'BIRTHDAYS, REIMAGINED',title:<>Big wishes.<br/>A little wonder.</>,tone:'birthday'},
];
const shortcuts=[
 {icon:Camera,title:'Photo to invitation',copy:'Start with your people',intent:{browse:true}},
 {icon:Heart,title:'Wedding stories',copy:'Find your forever style',intent:{category:'Wedding',browse:true}},
 {icon:PartyPopper,title:'Birthday magic',copy:'Make their day feel big',intent:{category:'Birthday',browse:true}},
 {icon:Layers3,title:'All functions',copy:'Bring every event together',intent:{long:true,browse:true}},
] satisfies Array<{icon:typeof Camera;title:string;copy:string;intent:SpotlightIntent}>;

export function StudioSpotlight({onExplore,active=true}:{onExplore:(intent:SpotlightIntent)=>void;active?:boolean}){
 const section=useRef<HTMLElement>(null),[preview,setPreview]=useState(false);
 useEffect(()=>{const el=section.current;if(!el)return;let visible=false;const motion=matchMedia('(prefers-reduced-motion: reduce)');const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;const update=()=>setPreview(active&&visible&&!document.hidden&&!motion.matches&&!connection?.saveData);const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting&&entry.intersectionRatio>=.15;update()},{threshold:[0,.15]});observer.observe(el);motion.addEventListener('change',update);document.addEventListener('visibilitychange',update);return()=>{observer.disconnect();motion.removeEventListener('change',update);document.removeEventListener('visibilitychange',update)}},[active]);
 return <section ref={section} className="studio-spotlight" aria-label="Studio spotlight invitation banner">
  <header className="spotlight-header"><div><span className="spotlight-eyebrow"><Sparkles size={13}/> THE CREATIVE STUDIO</span><h2>Your next big moment.</h2></div><button onClick={()=>onExplore({browse:true})}>Explore styles <ArrowUpRight size={17}/></button></header>
  <div className="spotlight-stories" aria-label="Featured invitation styles">{stories.map((story,i)=>{const reel=reelFeed.find(r=>r.templateId===story.template)??reelFeed[i];return <button key={story.template} className={'spotlight-story spotlight-'+story.tone} onClick={()=>onExplore({id:reel.id})} aria-label={'Explore '+reel.name}>
   <img src={reel.poster} alt="" loading="lazy"/>{i===0&&preview&&<video src={reelPlaybackSource(reel.video)} poster={reel.poster} autoPlay muted loop playsInline preload="none" aria-hidden="true"/>}
   <span className="spotlight-story-top"><span><Clapperboard size={12}/>{story.label}</span><i><ArrowUpRight size={18}/></i></span>
   <span className="spotlight-story-copy"><strong>{story.title}</strong><span><Play size={11} fill="currentColor"/> {Math.round(reel.seconds)}s reference <i>Make it yours <ArrowRight size={13}/></i></span></span>
  </button>})}</div>
  <div className="spotlight-tools"><div className="spotlight-personal"><span className="spotlight-personal-label"><Sparkles size={12}/> MADE PERSONAL</span><h3>Your photo.<br/><em>Their favourite invite.</em></h3><p>Pick a style. Add your people.<br/>Let the celebration begin.</p><button onClick={()=>onExplore({browse:true})}>Find your style <ArrowUpRight size={15}/></button><span className="spotlight-flower" aria-hidden="true">✳</span></div><div className="spotlight-shortcuts">{shortcuts.map(({icon:Icon,title,copy,intent})=><button key={title} onClick={()=>onExplore(intent)}><span><Icon size={19}/></span><div><strong>{title}</strong><small>{copy}</small></div><ArrowUpRight size={15}/></button>)}</div></div>
  <div className="spotlight-footer"><span><span/> Your photos. Your story. Your invitation.</span><span>{reelFeed.length} reference styles <i>·</i> Up to 60 seconds</span></div>
 </section>;
}
