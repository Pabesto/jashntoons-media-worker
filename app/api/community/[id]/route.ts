export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {getAppUser} from '@/lib/app-auth';
import {guarded,identity,json,originCheck,smallJson,APIError} from '@/lib/api';
import {ownedBundle,checkItems,publicBundle,bundleSelect,type BundleRow} from '@/lib/creator-community';
type Context={params:Promise<{id:string}>};
export const GET=(req:Request,ctx:Context)=>guarded(async()=>{const {id}=await ctx.params,user=await getAppUser(),row=await env.DB!.prepare(`${bundleSelect} WHERE b.id=? AND b.published=1`).bind(user?.userId??'',id).first<BundleRow>();if(!row)throw new APIError(404,'This bundle is no longer public.');return json({bundle:publicBundle(row)});});
export const DELETE=(req:Request,ctx:Context)=>guarded(async()=>{originCheck(req);const user=await identity(),{id}=await ctx.params;await ownedBundle(id,user.userId);await env.DB!.prepare('UPDATE creator_bundles SET published=0 WHERE id=? AND owner=?').bind(id,user.userId).run();return json({hidden:true});});
export const PUT=(req:Request,ctx:Context)=>guarded(async()=>{originCheck(req);const user=await identity(),{id}=await ctx.params,body=await smallJson(req);if(body.consent!==true)throw new APIError(400,'Confirm public sharing to publish again.');const row=await ownedBundle(id,user.userId);await checkItems(user.userId,JSON.parse(row.items));await env.DB!.prepare('UPDATE creator_bundles SET published=1 WHERE id=? AND owner=?').bind(id,user.userId).run();return json({bundle:publicBundle({...row,published:1})});});
