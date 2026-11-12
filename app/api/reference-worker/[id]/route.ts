import {env} from 'cloudflare:workers';
import {guarded,json,APIError,smallJson} from '@/lib/api';
import {workerAuth} from '@/lib/media-worker';
import {leasedAssembly,readAssemblyPayload,ASSEMBLY_LEASE_MS} from '@/lib/reference-assembly';
import {privateFile} from '@/lib/private-file';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export const GET=(req:Request,c:Context)=>guarded(async()=>{workerAuth(req);const {id}=await c.params,j=await leasedAssembly(id,req.headers.get('x-render-lease')),p=readAssemblyPayload(j.payload),part=new URL(req.url).searchParams.get('part');if(part===null||!/^\d+$/.test(part))throw new APIError(400,'Invalid film part.');const index=Number(part);if(!Number.isSafeInteger(index)||index>=p.parts.length)throw new APIError(400,'Invalid film part.');const media=await env.DB!.prepare("SELECT id FROM media WHERE id=? AND owner=? AND mime='video/mp4'").bind(p.parts[index],j.owner).first();if(!media)throw new APIError(404,'The saved scene is missing.');return privateFile(req,p.parts[index],'video/mp4');});
export const PUT=(req:Request,c:Context)=>guarded(async()=>{
 workerAuth(req);const {id}=await c.params,j=await leasedAssembly(id,req.headers.get('x-render-lease'));
 const length=req.headers.get('content-length'),size=Number(length);if(!length||!/^\d+$/.test(length)||!Number.isSafeInteger(size)||size<100||!req.body||req.headers.get('content-type')!=='video/mp4')throw new APIError(400,'An MP4 with its content length is required.');if(size>80000000)throw new APIError(413,'This upload is too large.');
 const mediaId=crypto.randomUUID();let completionAttempted=false;
 try{
  // Stream the full film once: buffering two 80 MB copies can exhaust the edge runtime.
  const stored=await env.BUCKET!.put(mediaId,req.body,{httpMetadata:{contentType:'video/mp4'}}),header=await env.BUCKET!.get(mediaId,{range:{offset:0,length:8}}),prefix=header?new Uint8Array(await header.arrayBuffer()):new Uint8Array();
  if(stored?.size!==size||new TextDecoder().decode(prefix.subarray(4,8))!=='ftyp')throw new APIError(400,'Invalid MP4.');
  await env.DB!.prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').bind(mediaId,j.owner,'video/mp4',size,Date.now()).run();
  completionAttempted=true;
  const updated=await env.DB!.prepare("UPDATE reel_jobs SET media_id=?,status='ready',updated=?,error=NULL WHERE id=? AND owner=? AND provider_task=? AND status='processing' AND updated>?").bind(mediaId,Date.now(),id,j.owner,j.provider_task,Date.now()-ASSEMBLY_LEASE_MS).run();
  if(!updated.meta.changes)throw new APIError(409,'This film assembly lease expired or was already completed.');
 }catch(error){
  // A database acknowledgement can fail after a successful commit. Never delete
  // a file that the ready job already references, or guess when that read fails.
  if(completionAttempted){let current;try{current=await env.DB!.prepare('SELECT status,media_id FROM reel_jobs WHERE id=? AND owner=?').bind(id,j.owner).first<{status:string;media_id:string|null}>()}catch{throw error;}if(current?.status==='ready'&&current.media_id===mediaId)return json({ready:true});}
  await env.BUCKET!.delete(mediaId);await env.DB!.prepare('DELETE FROM media WHERE id=? AND owner=?').bind(mediaId,j.owner).run();throw error;
 }
 return json({ready:true});
});
export const PATCH=(req:Request,c:Context)=>guarded(async()=>{workerAuth(req);const {id}=await c.params,j=await leasedAssembly(id,req.headers.get('x-render-lease')),body=await smallJson(req);if(!body||typeof body!=='object'||Array.isArray(body))throw new APIError(400,'Invalid processing result.');const changed=await env.DB!.prepare("UPDATE reel_jobs SET status='failed',error='The edited scenes could not be joined at their original timing. Your scenes remain saved; retry joining them without new AI work.',updated=? WHERE id=? AND owner=? AND provider_task=? AND status='processing' AND updated>?").bind(Date.now(),id,j.owner,j.provider_task,Date.now()-ASSEMBLY_LEASE_MS).run();if(!changed.meta.changes)throw new APIError(409,'This film assembly lease expired or was already completed.');return json({saved:true});});
