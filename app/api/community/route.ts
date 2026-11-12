export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {getAppUser} from '@/lib/app-auth';
import {guarded,identity,json,originCheck,smallJson,APIError} from '@/lib/api';
import {bundleSchema,checkItems,publicBundle,bundleSelect,type BundleRow} from '@/lib/creator-community';
export const GET=(req:Request)=>guarded(async()=>{
 const params=new URL(req.url).searchParams,mine=params.get('mine')==='1',user=mine?await identity():await getAppUser(),offset=Number(params.get('offset')??0);
 if(!Number.isSafeInteger(offset)||offset<0||offset>10000)throw new APIError(400,'Invalid page.');
 const query=mine?'b.owner=?':'b.published=1',order=params.get('sort')==='latest'||mine?'b.created DESC,b.id DESC':'likes DESC,b.created DESC,b.id DESC';
 const rows=await env.DB!.prepare(`${bundleSelect} WHERE ${query} ORDER BY ${order} LIMIT 13 OFFSET ?`).bind(user?.userId??'',...(mine?[user!.userId]:[]),offset).all<BundleRow>();
 return json({bundles:rows.results.slice(0,12).map(publicBundle),nextOffset:rows.results.length>12?offset+12:null});
});
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const user=await identity(),parsed=bundleSchema.safeParse(await smallJson(req));if(!parsed.success)throw new APIError(400,'Add a title, creator name, 1–10 finished reels and confirm public sharing.');
 const {id,title,creator,caption,items}=parsed.data,checked=await checkItems(user.userId,items),encoded=JSON.stringify(checked);
 const old=await env.DB!.prepare('SELECT * FROM creator_bundles WHERE id=?').bind(id).first<BundleRow>();
 if(old){if(old.owner!==user.userId)throw new APIError(404,'Bundle not found.');if(old.title!==title||old.creator!==creator||old.caption!==caption||old.items!==encoded)throw new APIError(409,'This bundle was already saved. Refresh My reels.');return json({bundle:publicBundle(old)});}
 const now=Date.now();
 const added=await env.DB!.prepare('INSERT INTO creator_bundles(id,owner,title,creator,caption,items,published,created) SELECT ?,?,?,?,?,?,1,? WHERE (SELECT COUNT(*) FROM creator_bundles WHERE owner=?)<50 ON CONFLICT(id) DO NOTHING RETURNING id').bind(id,user.userId,title,creator,caption,encoded,now,user.userId).first();
 if(!added){const retry=await env.DB!.prepare('SELECT * FROM creator_bundles WHERE id=? AND owner=?').bind(id,user.userId).first<BundleRow>();if(retry&&retry.items===encoded&&retry.title===title&&retry.creator===creator&&retry.caption===caption)return json({bundle:publicBundle(retry)});throw new APIError(409,'You can publish up to 50 bundles.');}
 return json({bundle:publicBundle({id,owner:user.userId,title,creator,caption,items:encoded,published:1,created:now})},201);
});
