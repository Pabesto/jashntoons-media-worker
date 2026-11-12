import {workerReady} from '@/lib/media-worker';
import {validateCreation} from '@/lib/creation-jobs';
import {validateVoiceDraft} from '@/lib/voice-studio';
﻿export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {guarded,identity,json,originCheck,smallJson,APIError} from '@/lib/api';
import {inviteSchema} from '@/lib/validation';
import {reserve,balance,ownedMedia,ownedAudio,RESERVATION_MS,type ReelJob} from '@/lib/credits';
import {customFilm,CUSTOM_FILM_CREDITS} from '@/lib/custom-film';
import {requireProject,rememberAvatar} from '@/lib/avatar-library';
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const u=await identity(),input=z.object({requestId:z.string().uuid(),projectId:z.string().uuid(),data:inviteSchema}).safeParse(await smallJson(req));
 if(!input.success)throw new APIError(400,'Save this draft and check your invitation details.');
 const {requestId,projectId,data}=input.data;await requireProject(u.userId,projectId);
 await ownedAudio(u.userId,data);
 await validateVoiceDraft(u.userId,data);
 await validateCreation(u.userId,data);
 if(customFilm(data)&&(data.duration!==10||!data.generatedVideo||!data.generationJobId))throw new APIError(400,'Create your 10-second Custom AI video before exporting.');
 await ownedMedia(u.userId,[...data.photos,...[data.generatedArt,data.generatedVideo].filter((x):x is string=>!!x)]);
 if(data.pendingCreationId)throw new APIError(409,'Your reel is still being created. Reopen the saved draft to continue.');
 if(data.pendingTalkingId)throw new APIError(409,'Wait for your speaking scene to finish, or remove it before exporting.');
 if(data.pendingGenerationId)throw new APIError(409,'Wait for your avatar to finish before exporting.');
 if(data.generationJobId){
  const original=await env.DB!.prepare('SELECT * FROM reel_jobs WHERE id=? AND owner=?').bind(data.generationJobId,u.userId).first<ReelJob>();
  if(!original||original.media_id!==data.generatedArt||!['ready','completed'].includes(original.status))throw new APIError(400,'Choose a finished avatar from your saved library.');
  if(customFilm(data)){const p=JSON.parse(original.payload);if(data.aiMoment&&JSON.stringify(data.aiMoment)!==JSON.stringify(p.invite?.aiMoment))throw new APIError(400,'Generate the selected AI moment before exporting.');if(original.credit_cost<CUSTOM_FILM_CREDITS||p.videoId!==data.generatedVideo)throw new APIError(400,'Choose a completed Custom AI film.');}
  await rememberAvatar(original);
  if(!original.project_id)await env.DB!.prepare('UPDATE reel_jobs SET project_id=? WHERE id=? AND owner=? AND project_id IS NULL').bind(projectId,original.id,u.userId).run();
 }
 const paid=data.directedReel||data.talkingClip||await env.DB!.prepare("SELECT id FROM reel_jobs WHERE owner=? AND project_id=? AND credit_cost>0 AND status IN ('ready','completed') LIMIT 1").bind(u.userId,projectId).first();
 const payload=JSON.stringify(data),exportId=paid?requestId:projectId;
 if(!paid)await env.DB!.prepare("DELETE FROM reel_jobs WHERE id=? AND owner=? AND (status IN ('cancelled','failed') OR (status='reserved' AND created<?))").bind(exportId,u.userId,Date.now()-RESERVATION_MS).run();
 const {job}=await reserve(u.userId,exportId,payload,'reserved',{cost:paid?0:1,projectId});
 if(job.payload!==payload)throw new APIError(409,'An export for this draft is already in progress. Finish or cancel it first.');
 if(job.status==='completed')return json({id:job.id,download:'/api/reels/'+job.id+'?download=1',...await balance(u.userId)});
 if(job.status!=='reserved')throw new APIError(409,'This reel is already exporting. Please wait.');
 return json({id:job.id,reusedCredit:!!paid,...await balance(u.userId)});
});
export const GET=(req:Request)=>guarded(async()=>{
 const u=await identity(),params=new URL(req.url).searchParams,offset=Number(params.get('offset')??0),ids=params.get('ids')?.split(',');
 if(!Number.isSafeInteger(offset)||offset<0||offset>10000||ids&&(ids.length>10||ids.some(id=>!z.string().uuid().safeParse(id).success)))throw new APIError(400,'Invalid reel page.');
 const where="r.owner=? AND r.status='completed' AND r.mime IN ('video/mp4','video/webm') AND json_valid(r.payload) AND json_extract(r.payload,'$.templateId') IS NOT NULL AND json_extract(r.payload,'$.kind') IS NULL";
 const filter=ids?' AND r.id IN ('+ids.map(()=>'?').join(',')+')':'';
 const result=await env.DB!.prepare(`SELECT r.id,r.project_id,r.created,r.mime,r.payload,d.status AS optimization,EXISTS(SELECT 1 FROM creator_bundles b,json_each(b.items) item WHERE b.owner=r.owner AND b.published=1 AND json_extract(item.value,'$.reelId')=r.id) AS published FROM reel_jobs r LEFT JOIN reel_delivery d ON d.reel_id=r.id WHERE ${where}${filter} ORDER BY r.created DESC,r.id DESC LIMIT 25 OFFSET ?`).bind(u.userId,...(ids??[]),offset).all();
 const total=await env.DB!.prepare(`SELECT COUNT(*) AS total FROM reel_jobs r WHERE ${where}`).bind(u.userId).first<{total:number}>();
 return json({optimizationReady:workerReady(),total:total?.total??0,nextOffset:result.results.length>24?offset+24:null,reels:result.results.slice(0,24).map(row=>{const data=JSON.parse(String(row.payload));return {id:row.id,projectId:row.project_id,created:row.created,mime:row.optimization==='ready'?'video/mp4':row.mime,optimization:row.optimization,title:data.names||'Invitation film',photos:data.photos??[],duration:(data.duration??0)+(data.talkingClip?.duration??0),published:!!row.published,data};})});
});
