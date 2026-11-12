import {env} from 'cloudflare:workers';
import {APIError,guarded} from '@/lib/api';
import {publishedInvitation} from '@/lib/invitation-links';
import {invitationLinkSchema} from '@/lib/invitation-link-data';
import {privateFile} from '@/lib/private-file';
import {deliveryFor,optimizedKey} from '@/lib/media-worker';
export const dynamic='force-dynamic';
export const GET=(req:Request,ctx:{params:Promise<{slug:string}>})=>guarded(async()=>{
 const {slug}=await ctx.params,kind=new URL(req.url).searchParams.get('kind');if(kind!=='photo'&&kind!=='reel')throw new APIError(404,'Media not found.');
 const row=await publishedInvitation(slug);if(!row)throw new APIError(404,'Invitation unavailable.');
 const data=invitationLinkSchema.parse(JSON.parse(row.published_data!));
 if(kind==='photo'){if(!data.photoId)throw new APIError(404,'Photo not shared.');const photo=await env.DB!.prepare('SELECT mime FROM media WHERE id=? AND owner=?').bind(data.photoId,row.owner).first<{mime:string}>();if(!photo||!['image/jpeg','image/png','image/webp'].includes(photo.mime))throw new APIError(404,'Photo unavailable.');return privateFile(req,data.photoId,photo.mime)}
 if(!data.reelId)throw new APIError(404,'Reel not shared.');const reel=await env.DB!.prepare("SELECT mime FROM reel_jobs WHERE id=? AND owner=? AND status='completed'").bind(data.reelId,row.owner).first<{mime:string}>();if(!reel||!['video/mp4','video/webm'].includes(reel.mime))throw new APIError(404,'Reel unavailable.');
 const delivery=await deliveryFor(data.reelId),key=delivery?.status==='ready'?optimizedKey(delivery.id,delivery.lease):null,ready=key&&await env.BUCKET!.head(key);return privateFile(req,ready?key!:'reels/'+data.reelId,ready?'video/mp4':reel.mime);
});
