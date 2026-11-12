export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,json,APIError,smallJson} from '@/lib/api';
import {workerAuth,leasedDelivery,optimizedKey} from '@/lib/media-worker';
import {privateFile} from '@/lib/private-file';
type Context={params:Promise<{id:string}>};
export const GET=(req:Request,c:Context)=>guarded(async()=>{workerAuth(req);const {id}=await c.params,j=await leasedDelivery(id,req.headers.get('x-render-lease'));return privateFile(req,'reels/'+j.reel_id,'application/octet-stream');});
export const PUT=(req:Request,c:Context)=>guarded(async()=>{
 workerAuth(req);
 const {id}=await c.params,j=await leasedDelivery(id,req.headers.get('x-render-lease'));
 const size=Number(req.headers.get('content-length'));
 if(!Number.isSafeInteger(size)||size<100||!req.body||req.headers.get('content-type')!=='video/mp4')throw new APIError(400,'A valid optimized MP4 with its content length is required.');
 if(size>80000000)throw new APIError(413,'This upload is too large.');
 const key=optimizedKey(j.id,j.lease);
 // Keep the request's fixed-length stream: buffering an 80 MB upload twice exceeds
 // the edge worker memory limit. Validate the stored header before publishing it.
 try{
  const stored=await env.BUCKET!.put(key,req.body,{httpMetadata:{contentType:'video/mp4'}});
  const header=await env.BUCKET!.get(key,{range:{offset:0,length:8}});
  const prefix=header?new Uint8Array(await header.arrayBuffer()):new Uint8Array();
  if(stored?.size!==size||new TextDecoder().decode(prefix.subarray(4,8))!=='ftyp')throw new APIError(400,'A valid optimized MP4 is required.');
  const updated=await env.DB!.prepare("UPDATE reel_delivery SET status='ready',size=?,error=NULL,updated=? WHERE id=? AND lease=? AND status='processing' AND lease_until>?").bind(size,Date.now(),j.id,j.lease,Date.now()).run();
  if(!updated.meta.changes)throw new APIError(409,'This processing lease expired.');
 }catch(error){await env.BUCKET!.delete(key);throw error;}
 return json({ready:true});
});
export const PATCH=(req:Request,c:Context)=>guarded(async()=>{workerAuth(req);const {id}=await c.params,j=await leasedDelivery(id,req.headers.get('x-render-lease'));await smallJson(req);await env.DB!.prepare("UPDATE reel_delivery SET status='failed',error='Video processing could not finish. The original is still available.',updated=? WHERE id=? AND lease=? AND status='processing'").bind(Date.now(),j.id,j.lease).run();return json({saved:true});});
