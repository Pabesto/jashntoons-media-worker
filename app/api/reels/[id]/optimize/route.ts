export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,identity,originCheck,json,APIError} from '@/lib/api';
import {enqueueDelivery,deliveryFor,workerReady} from '@/lib/media-worker';
export const POST=(req:Request,c:{params:Promise<{id:string}>})=>guarded(async()=>{originCheck(req);const u=await identity(),{id}=await c.params;const reel=await env.DB!.prepare("SELECT payload FROM reel_jobs WHERE id=? AND owner=? AND status='completed'").bind(id,u.userId).first<{payload:string}>();if(!reel||JSON.parse(reel.payload).kind)throw new APIError(404,'Finished reel not found.');if(!workerReady())throw new APIError(503,'Video processing is not connected yet.');await enqueueDelivery(id,u.userId);return json({status:(await deliveryFor(id))?.status});});
