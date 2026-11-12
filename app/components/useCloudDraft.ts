'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {type Invite} from '@/lib/templates';
import {cacheDraft} from '@/lib/draft-cache';
import {request} from './Commerce';
export function useCloudDraft(data:Invite,initialId:string|undefined,account:string){
 const [id]=useState(()=>initialId??crypto.randomUUID()),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false),[error,setError]=useState('');
 const latest=useRef(data),queue=useRef<Promise<unknown>>(Promise.resolve()),written=useRef(''),mounted=useRef(true);latest.current=data;
 const persist=useCallback(async(snapshot:Invite=latest.current)=>{
  const payload=JSON.stringify(snapshot);cacheDraft(account,{id,data:snapshot,updated:Date.now()});
  const task=queue.current.catch(()=>{}).then(async()=>{
   if(written.current===payload)return id;
   if(mounted.current){setSaving(true);setError('');}
   try{await request('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,data:snapshot}),keepalive:true});written.current=payload;if(mounted.current)setSaved(JSON.stringify(latest.current)===payload);return id;}
   catch(e){if(mounted.current){setSaved(false);setError((e as Error).message);}throw e;}
   finally{if(mounted.current)setSaving(false);}
  });queue.current=task;return task;
 },[id,account]);
 useEffect(()=>{setSaved(false);cacheDraft(account,{id,data,updated:Date.now()});const timer=setTimeout(()=>void persist(data).catch(()=>{}),600);return()=>clearTimeout(timer);},[data,persist,id,account]);
 useEffect(()=>{mounted.current=true;const flush=()=>{if(written.current!==JSON.stringify(latest.current))void persist().catch(()=>{});};window.addEventListener('pagehide',flush);window.addEventListener('online',flush);return()=>{flush();mounted.current=false;window.removeEventListener('pagehide',flush);window.removeEventListener('online',flush);};},[persist]);
 return {id,saved,saving,error,persist};
}
