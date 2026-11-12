import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {APIError} from './api';
import {getTemplate} from './templates';

export type CommunityItem={reelId:string;beforeId:string|null;category:string};
export type BundleRow={id:string;owner:string;title:string;creator:string;caption:string;items:string;published:number;created:number;likes?:number;liked?:number};
export const bundleSchema=z.object({id:z.string().uuid(),title:z.string().trim().min(2).max(80),creator:z.string().trim().min(2).max(40),caption:z.string().trim().max(240),consent:z.literal(true),items:z.array(z.object({reelId:z.string().uuid(),beforeId:z.string().uuid().nullable()}).strict()).min(1).max(10)}).strict();
const imageMimes=['image/png','image/jpeg','image/webp'];
export async function checkItems(owner:string,items:{reelId:string;beforeId:string|null}[]):Promise<CommunityItem[]>{
 if(new Set(items.map(i=>i.reelId)).size!==items.length)throw new APIError(400,'Choose each reel only once.');
 const checked:CommunityItem[]=[];
 for(const item of items){
  const job=await env.DB!.prepare("SELECT payload,mime FROM reel_jobs WHERE id=? AND owner=? AND status='completed'").bind(item.reelId,owner).first<{payload:string;mime:string}>();
  if(!job||!['video/mp4','video/webm'].includes(job.mime))throw new APIError(400,'Only your finished, exported reels can be published.');
  const data=JSON.parse(job.payload);
  if(!data.templateId||!Array.isArray(data.photos)||data.kind)throw new APIError(400,'Export the finished invitation before publishing it.');
  if(!await env.BUCKET!.head('reels/'+item.reelId))throw new APIError(400,'A selected video is unavailable. Export it again first.');
  if(item.beforeId){
   if(!data.photos.includes(item.beforeId))throw new APIError(400,'Choose a reference photo used in this reel.');
   const photo=await env.DB!.prepare('SELECT mime FROM media WHERE id=? AND owner=?').bind(item.beforeId,owner).first<{mime:string}>();
   if(!photo||!imageMimes.includes(photo.mime)||!await env.BUCKET!.head(item.beforeId))throw new APIError(400,'The selected reference photo is unavailable.');
  }
  checked.push({...item,category:getTemplate(data.templateId).category});
 }
 return checked;
}
export function publicBundle(row:BundleRow){
 const items=JSON.parse(row.items) as CommunityItem[];
 return {id:row.id,title:row.title,creator:row.creator,caption:row.caption,created:row.created,published:!!row.published,likes:Number(row.likes??0),liked:!!row.liked,items:items.map((item,index)=>({category:item.category,before:item.beforeId?`/api/community/${row.id}/media?item=${index}&kind=before`:null,after:`/api/community/${row.id}/media?item=${index}&kind=after`}))};
}
export const bundleSelect=`SELECT b.*, (SELECT COUNT(*) FROM creator_likes l WHERE l.bundle_id=b.id) AS likes, (SELECT COUNT(*) FROM creator_likes l WHERE l.bundle_id=b.id AND l.owner=?) AS liked FROM creator_bundles b`;
export async function ownedBundle(id:string,owner:string){const row=await env.DB!.prepare('SELECT * FROM creator_bundles WHERE id=? AND owner=?').bind(id,owner).first<BundleRow>();if(!row)throw new APIError(404,'Bundle not found.');return row;}
