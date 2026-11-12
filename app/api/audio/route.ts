export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,identity,originCheck,boundedBytes,APIError,json} from '@/lib/api';
import {customFilm,wavInfo} from '@/lib/custom-film';
import {requireProject} from '@/lib/avatar-library';
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const u=await identity(),raw=await boundedBytes(req,4100000),form=await new Response(raw,{headers:{'Content-Type':req.headers.get('Content-Type')||''}}).formData(),project=String(form.get('projectId')||''),saved=await requireProject(u.userId,project);
 if(!customFilm(JSON.parse(saved.payload)))throw new APIError(403,'Your own audio is available in the Custom AI package.');
 const file=form.get('file');if(!(file instanceof File)||file.size>4000000)throw new APIError(400,'Choose a recording under 60 seconds.');
 const bytes=new Uint8Array(await file.arrayBuffer());let info;try{info=wavInfo(bytes);}catch(e){throw new APIError(400,(e as Error).message);}
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');const prior=await env.DB!.prepare('SELECT id,mime FROM media WHERE owner=? AND digest=?').bind(u.userId,digest).first<{id:string;mime:string}>();if(prior&&prior.mime==='audio/wav')return json({id:prior.id,duration:info.duration,reused:true});
 const count=await env.DB!.prepare('SELECT COUNT(*) AS total FROM media WHERE owner=?').bind(u.userId).first<{total:number}>();if((count?.total??0)>=100)throw new APIError(409,'Your media library is full. Contact support to remove unused files.');
 const id=crypto.randomUUID();await env.BUCKET!.put(id,bytes,{httpMetadata:{contentType:'audio/wav'}});try{await env.DB!.prepare('INSERT INTO media(id,owner,mime,size,created,digest) VALUES(?,?,?,?,?,?)').bind(id,u.userId,'audio/wav',bytes.length,Date.now(),digest).run();}catch(e){await env.BUCKET!.delete(id);throw e;}return json({id,duration:info.duration});
});
