'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Check,ImagePlus,Images,LoaderCircle,RefreshCw,UserRound,X} from 'lucide-react';
import {request} from './Commerce';
import type {CreationLibrary,LibraryAvatar} from '@/lib/creation-library-client';

const emptyLibrary:CreationLibrary={avatars:[],photos:[],voices:[]};
export function useCreationLibrary(refreshKey?:string){
 const [library,setLibrary]=useState<CreationLibrary>(emptyLibrary),[loading,setLoading]=useState(true),[error,setError]=useState(''),version=useRef(0);
 const reload=useCallback(async()=>{const token=++version.current;setLoading(true);setError('');try{const value=await request<CreationLibrary>('/api/create/library');if(token===version.current)setLibrary({avatars:value.avatars??[],photos:value.photos??[],voices:value.voices??[]});}catch(e){if(token===version.current)setError((e as Error).message||'Your saved people could not load.');}finally{if(token===version.current)setLoading(false);}},[]);
 useEffect(()=>{void reload();return()=>{version.current++}},[reload,refreshKey]);
 return {library,loading,error,reload};
}

export function CreationLibraryPicker({library,loading,error,disabled,selectedAvatarId,selectedArtId,photos,onReload,onAvatar,onClearAvatar,onPhoto}:{library:CreationLibrary;loading:boolean;error:string;disabled:boolean;selectedAvatarId?:string;selectedArtId?:string;photos:string[];onReload:()=>void;onAvatar:(avatar:LibraryAvatar)=>void;onClearAvatar:()=>void;onPhoto:(id:string)=>void}){
 const [tab,setTab]=useState<'avatars'|'photos'>('avatars'),[more,setMore]=useState(false);
 const selected=library.avatars.find(a=>a.id===selectedAvatarId),items=tab==='avatars'?library.avatars:library.photos,shown=more?items:items.slice(0,6);
 function chooseTab(next:'avatars'|'photos'){setTab(next);setMore(false)}
 return <div className="creation-library"><div className="creation-library-heading"><div><span>YOUR PRIVATE LIBRARY</span><h3>Already made yours.</h3></div><button aria-label="Refresh saved people and photos" disabled={loading||disabled} onClick={onReload}><RefreshCw size={14} className={loading?'spin':''}/></button></div><p>Use a saved avatar in this template. No upload or new avatar charge.</p>
 {selectedAvatarId&&selectedArtId&&<div className="creation-selected-person"><img src={'/api/media?id='+selectedArtId} alt="Your selected saved avatar"/><div><strong><Check size={12}/>Saved avatar selected</strong><span>{selected?.label||'Your saved people'}</span><small>Reused as-is. This template stays selected.</small></div><button aria-label="Clear saved avatar selection" disabled={disabled} onClick={onClearAvatar}><X size={14}/></button></div>}
 <div className="creation-library-tabs" role="group" aria-label="Saved library type"><button aria-pressed={tab==='avatars'} onClick={()=>chooseTab('avatars')}><UserRound size={14}/>Avatars <span>{library.avatars.length}</span></button><button aria-pressed={tab==='photos'} onClick={()=>chooseTab('photos')}><Images size={14}/>Photos <span>{library.photos.length}</span></button></div>
 {loading&&!items.length?<div className="creation-library-state" role="status"><LoaderCircle size={18} className="spin"/><span>Loading your saved {tab}...</span></div>:null}
 {error&&<div className="creation-library-error" role="alert"><p>{error}</p><button disabled={loading||disabled} onClick={onReload}>Try again <RefreshCw size={12}/></button></div>}
 {!loading&&!error&&!items.length&&<div className="creation-library-state"><ImagePlus size={23}/><strong>{tab==='avatars'?'Your avatars will live here.':'Your uploaded photos will live here.'}</strong><span>{tab==='avatars'?'Create an avatar once. Choose it here for your next invitation.':'Upload below once, then reuse the photo in any new draft.'}</span></div>}
 {!!shown.length&&<div className={'creation-library-grid '+(tab==='photos'?'is-photos':'is-avatars')}>{tab==='avatars'?(shown as LibraryAvatar[]).map((avatar,i)=><button key={avatar.id} disabled={disabled} aria-pressed={selectedAvatarId===avatar.id} onClick={()=>onAvatar(avatar)} aria-label={'Use '+(avatar.label||'saved avatar '+(i+1))}><span className="creation-library-thumb"><UserRound size={27}/><img src={'/api/media?id='+avatar.artId} loading="lazy" alt={avatar.label||'Saved avatar '+(i+1)} onError={e=>{e.currentTarget.hidden=true}}/>{selectedAvatarId===avatar.id&&<i><Check size={12}/></i>}</span><strong>{avatar.label||'Saved avatar '+(i+1)}</strong><small>Reuse · 0 avatar credits</small></button>):shown.map((photo,i)=><button key={photo.id} aria-pressed={photos.includes(photo.id)} disabled={disabled||(!photos.includes(photo.id)&&photos.length>=8)} onClick={()=>onPhoto(photo.id)} aria-label={(photos.includes(photo.id)?'Remove':'Add')+' saved photo '+(i+1)}><span className="creation-library-thumb"><Images size={24}/><img src={'/api/media?id='+photo.id} loading="lazy" alt={'Saved photo '+(i+1)} onError={e=>{e.currentTarget.hidden=true}}/>{photos.includes(photo.id)&&<i><Check size={12}/></i>}</span><strong>{photos.includes(photo.id)?'Added to this draft':'Use photo'}</strong></button>)}</div>}
 {items.length>6&&<button className="creation-library-more" onClick={()=>setMore(!more)}>{more?'Show fewer':'Show all '+items.length+' '+tab}</button>}
 {tab==='photos'&&!!items.length&&<p className="creation-library-hint">Up to 8 reference photos. Different photos need a new avatar; review the quote before creating.</p>}
 </div>;
}
