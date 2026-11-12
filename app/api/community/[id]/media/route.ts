export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,APIError} from '@/lib/api';
import {deliveryFor,optimizedKey} from '@/lib/media-worker';
import {privateFile} from '@/lib/private-file';
import type {BundleRow,CommunityItem} from '@/lib/creator-community';
export const GET=(req:Request,ctx:{params:Promise<{id:string}>})=>guarded(async()=>{
 const {id}=await ctx.params,p=new URL(req.url).searchParams,index=Number(p.get('item')),kind=p.get('kind');
 if(!p.has('item')||!Number.isInteger(index)||index<0||index>9||!['before','after'].includes(kind??''))throw new APIError(404,'Preview not found.');
 const row=await env.DB!.prepare('SELECT * FROM creator_bundles WHERE id=? AND published=1').bind(id).first<BundleRow>();if(!row)throw new APIError(404,'This bundle is no longer public.');
 const item=(JSON.parse(row.items) as CommunityItem[])[index];if(!item)throw new APIError(404,'Preview not found.');
 if(kind==='before'){if(!item.beforeId)throw new APIError(404,'No reference photo shared.');const photo=await env.DB!.prepare('SELECT mime FROM media WHERE id=? AND owner=?').bind(item.beforeId,row.owner).first<{mime:string}>();if(!photo)throw new APIError(404,'Photo unavailable.');return privateFile(req,item.beforeId,photo.mime);}
 const job=await env.DB!.prepare("SELECT mime FROM reel_jobs WHERE id=? AND owner=? AND status='completed'").bind(item.reelId,row.owner).first<{mime:string}>();if(!job)throw new APIError(404,'Reel unavailable.');const delivery=await deliveryFor(item.reelId),key=delivery?.status==='ready'?optimizedKey(delivery.id,delivery.lease):null,ready=key&&await env.BUCKET!.head(key);return privateFile(req,ready?key!:'reels/'+item.reelId,ready?'video/mp4':job.mime);
});
