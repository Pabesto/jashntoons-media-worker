export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {guarded,identity,json,originCheck,smallJson,APIError} from '@/lib/api';
import {draftInviteSchema} from '@/lib/validation';
import {reserve,ownedMedia,type ReelJob} from '@/lib/credits';
import {momentPrompts,MOMENT_PROMPT_REVISION} from '@/lib/ai-moments';
import {imageRequest} from '@/lib/generation';
import {automaticGeneration} from '@/lib/studio-automation';
import {providerStatus,startImage} from '@/lib/ai-providers';
import {customFilm,CUSTOM_FILM_CREDITS} from '@/lib/custom-film';
import {generationFingerprint,requireProject,rememberAvatar,avatarResult} from '@/lib/avatar-library';
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const u=await identity();const parsed=z.object({requestId:z.string().uuid(),projectId:z.string().uuid(),data:draftInviteSchema,prompt:z.string().trim().max(1500).default(''),animate:z.boolean().default(false),newVersion:z.boolean().default(false),approvedCredits:z.union([z.literal(1),z.literal(5)]).default(1)}).safeParse(await smallJson(req));
 if(!parsed.success)throw new APIError(400,'Please save this draft and check your avatar options.');
 const {requestId,projectId,prompt,newVersion}=parsed.data;if(customFilm(parsed.data.data)&&parsed.data.data.duration!==10)throw new APIError(400,'Custom AI films are 10 seconds.');await requireProject(u.userId,projectId);
 const selected=automaticGeneration(parsed.data.data,providerStatus(),parsed.data.data.aiMotion??parsed.data.animate),{imageProvider,motionProvider}=selected;
 const data={...parsed.data.data,imageProvider:'auto' as const,motionProvider:'none' as const,avatarMode:selected.mode as 'scene'|'cutout'},animate=motionProvider!=='none';
 if(!data.photos.length)throw new APIError(400,'Upload a reference photo to create your personal avatar.');
 await ownedMedia(u.userId,data.photos);
 const key=await generationFingerprint({photos:data.photos.slice(0,2),template:data.templateId,style:data.avatarStyle??'auto',pose:data.avatarPose??'standing',mode:data.avatarMode,prompt,animate,...(data.aiMoment?{aiMoment:data.aiMoment,revision:MOMENT_PROMPT_REVISION}:{}),tier:customFilm(data)?'custom':'standard',...(newVersion?{version:requestId}:{})});
 const cached=await env.DB!.prepare('SELECT * FROM reel_jobs WHERE owner=? AND generation_key=?').bind(u.userId,key).first<ReelJob>();
 if(cached){const a=await rememberAvatar(cached);if(a)return json({...avatarResult(a),reused:true});if(['generating','processing'].includes(cached.status)){await env.DB!.prepare("UPDATE projects SET payload=json_set(payload,'$.pendingGenerationId',?),updated=? WHERE id=? AND owner=?").bind(cached.id,Date.now(),projectId,u.userId).run();return json({id:cached.id,status:cached.status,reused:true});}await env.DB!.prepare('UPDATE reel_jobs SET generation_key=NULL WHERE id=? AND owner=?').bind(cached.id,u.userId).run();}
 if(!imageProvider)throw new APIError(503,'Illustration creation is temporarily unavailable. Your photos are saved; please try again later.');
 if((customFilm(data)||animate)&&motionProvider==='none')throw new APIError(503,'Scene animation is temporarily unavailable.');
 if(animate&&parsed.data.approvedCredits!==CUSTOM_FILM_CREDITS)throw new APIError(409,'Review and confirm the 5-credit AI film cost before creating.');
 const request=await imageRequest(data,prompt,u.userId);
 const {job,created}=await reserve(u.userId,requestId,JSON.stringify({invite:data,prompt,animate,phase:'image',imageProvider,motionProvider,...(data.aiMoment?{motionPrompt:momentPrompts(data.aiMoment).motion,momentRevision:MOMENT_PROMPT_REVISION}:{})}),'generating',{projectId,generationKey:key,cost:animate?CUSTOM_FILM_CREDITS:1});
 await env.DB!.prepare("UPDATE projects SET payload=json_set(payload,'$.pendingGenerationId',?),updated=? WHERE id=? AND owner=?").bind(job.id,Date.now(),projectId,u.userId).run();
 if(!created){const a=await rememberAvatar(job);return json(a?{...avatarResult(a),reused:true}:{id:job.id,status:job.status,reused:true});}
 try{
  const count=await env.DB!.prepare("SELECT COUNT(*) AS n FROM reel_jobs WHERE owner=? AND created>? AND json_extract(payload,'$.phase') IS NOT NULL").bind(u.userId,Date.now()-86400000).first<{n:number}>();
  if((count?.n??0)>(data.aiMoment?30:6))throw new APIError(429,'Please wait until tomorrow before starting another AI generation.');
  const task=await startImage(imageProvider,request,u.userId,requestId);if(task.status==='failed')throw new APIError(502,'The AI provider could not create this illustration.');
  await env.DB!.prepare('UPDATE reel_jobs SET provider_task=?,updated=? WHERE id=?').bind(task.id,Date.now(),requestId).run();return json({id:requestId,status:'generating'});
 }catch(e){await env.DB!.prepare("UPDATE reel_jobs SET status='failed',generation_key=NULL,error=?,updated=? WHERE id=?").bind('AI creation could not start. Your credit was returned.',Date.now(),requestId).run();throw e;}
});
