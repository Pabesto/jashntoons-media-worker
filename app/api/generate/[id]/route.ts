export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,identity,json,originCheck,APIError} from '@/lib/api';
import {type ReelJob} from '@/lib/credits';
import {rememberAvatar,avatarResult,type SavedAvatar} from '@/lib/avatar-library';
import {advance} from '@/lib/generation';
export const POST=(req:Request,context:{params:Promise<{id:string}>})=>guarded(async()=>{originCheck(req);const u=await identity();const {id}=await context.params;const job=await env.DB!.prepare('SELECT * FROM reel_jobs WHERE id=? AND owner=?').bind(id,u.userId).first<ReelJob>();if(!job)throw new APIError(404,'Generation not found.');return json(await advance(job));});
export const GET=()=>guarded(async()=>{
 const u=await identity(),r=await env.DB!.prepare("SELECT * FROM reel_jobs WHERE owner=? AND (json_extract(payload,'$.phase') IS NOT NULL OR media_id IS NOT NULL) AND status IN ('generating','processing','ready','completed') ORDER BY created DESC LIMIT 100").bind(u.userId).all();
 const pending=[];for(const raw of r.results){const row=raw as unknown as ReelJob,a=await rememberAvatar(row),p=JSON.parse(row.payload);if(!a)pending.push({id:row.id,status:row.status,projectId:row.project_id,templateId:p.invite?.templateId});}
 const saved=await env.DB!.prepare('SELECT a.*,j.credit_cost,j.payload FROM avatars a JOIN reel_jobs j ON j.id=a.id AND j.owner=a.owner WHERE a.owner=? ORDER BY a.created DESC LIMIT 100').bind(u.userId).all();
 return json({jobs:[...pending,...saved.results.map(a=>avatarResult(a as unknown as SavedAvatar))]});
});
