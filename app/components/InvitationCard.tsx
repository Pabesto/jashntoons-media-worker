'use client';
import {useEffect,useRef,useState} from 'react';
import {Download,LoaderCircle} from 'lucide-react';
import type {Invite} from '@/lib/templates';
import {drawInvitationCard} from '@/lib/invitation-card';
export function InvitationCard({data,disabled=false,onBeforeExport}:{data:Invite;disabled?:boolean;onBeforeExport?:()=>Promise<unknown>}){
 const ref=useRef<HTMLCanvasElement>(null),version=useRef(0),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;const token=++version.current;setReady(false);setError('');const buffer=document.createElement('canvas');drawInvitationCard(buffer,data).then(()=>{if(cancelled||version.current!==token||!ref.current)return;ref.current.width=buffer.width;ref.current.height=buffer.height;ref.current.getContext('2d')!.drawImage(buffer,0,0);setReady(true)}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[data]);
 async function download(){if(!ready||!ref.current)return;setBusy(true);setError('');try{if(!data.names.trim()||!data.date||!data.venue.trim())throw Error('Add names, date and venue before downloading your card.');await onBeforeExport?.();const blob=await new Promise<Blob>((resolve,reject)=>ref.current!.toBlob(b=>b?resolve(b):reject(Error('The card could not be exported.')),'image/png')),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='jashntoons-invitation.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <div className="invitation-card-preview"><canvas ref={ref} aria-label="Matching invitation card with your current names, date, venue and RSVP"/>{!ready&&!error&&<p role="status">Preparing your invitation card…</p>}{error&&<p role="alert">{error}</p>}<button className="button button-outline full-width" disabled={disabled||busy||!ready} onClick={download}>{busy?<LoaderCircle size={16} className="spin"/>:<Download size={16}/>}Download invitation card</button><small>1080 × 1920 PNG · No extra AI credits.<br/>The card uses your current details and saved artwork or photo.</small></div>;
}
