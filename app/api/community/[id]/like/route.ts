export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,identity,json,originCheck,smallJson,APIError} from '@/lib/api';
import {publicBundle,bundleSelect,type BundleRow} from '@/lib/creator-community';
export const PUT=(req:Request,ctx:{params:Promise<{id:string}>})=>guarded(async()=>{
 originCheck(req);const user=await identity(),{id}=await ctx.params,body=await smallJson(req);if(typeof body.liked!=='boolean')throw new APIError(400,'Choose like or unlike.');
 const row=await env.DB!.prepare('SELECT owner FROM creator_bundles WHERE id=? AND published=1').bind(id).first<{owner:string}>();if(!row)throw new APIError(404,'This bundle is no longer public.');if(row.owner===user.userId)throw new APIError(400,'Likes come from other creators. Share your bundle with them.');
 if(body.liked)await env.DB!.prepare('INSERT INTO creator_likes(bundle_id,owner,created) SELECT id,?,? FROM creator_bundles WHERE id=? AND published=1 ON CONFLICT(bundle_id,owner) DO NOTHING').bind(user.userId,Date.now(),id).run();
 else await env.DB!.prepare('DELETE FROM creator_likes WHERE bundle_id=? AND owner=?').bind(id,user.userId).run();
 const updated=await env.DB!.prepare(`${bundleSelect} WHERE b.id=? AND b.published=1`).bind(user.userId,id).first<BundleRow>();if(!updated)throw new APIError(404,'This bundle is no longer public.');return json({bundle:publicBundle(updated)});
});
