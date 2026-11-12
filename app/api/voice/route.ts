export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {guarded,identity,json,originCheck,APIError,boundedBytes,smallJson} from '@/lib/api';
import {type ReelJob,balance} from '@/lib/credits';
import {wavInfo} from '@/lib/custom-film';
import {createVoice,createTalking,voiceView} from '@/lib/voice-studio';
import {voiceConfigured} from '@/lib/voice-provider';
export const GET=()=>guarded(async()=>{const u=await identity(),rows=await env.DB!.prepare("SELECT * FROM reel_jobs WHERE owner=? AND json_extract(payload,'$.kind') IN ('voice-profile','talking-reel') ORDER BY CASE WHEN json_extract(payload,'$.kind')='voice-profile' THEN 0 WHEN status IN ('generating','processing') THEN 1 ELSE 2 END,created DESC LIMIT 100").bind(u.userId).all<ReelJob>();return json({connected:voiceConfigured(),items:rows.results.map(voiceView)});});
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const u=await identity();
 if(req.headers.get('content-type')?.startsWith('multipart/form-data')){
  const bytes=await boundedBytes(req,3400000),form=await new Request(req.url,{method:'POST',headers:{'Content-Type':req.headers.get('content-type')!},body:bytes as BodyInit}).formData(),file=form.get('file'),name=String(form.get('name')??'').trim();
  if(!(file instanceof File)||!name||name.length>50)throw new APIError(400,'Add a voice name and a 10–60 second recording.');
  const sample=new Uint8Array(await file.arrayBuffer());let info;try{info=wavInfo(sample)}catch{throw new APIError(400,'Upload a valid 10?60 second PCM WAV recording.');}if(info.duration<10||info.duration>60.1)throw new APIError(400,'Record 10–60 seconds of clear speech.');
  return json({...await createVoice(u.userId,{name,bytes:sample,consent:form.get('consent')==='true',approveCredits:Number(form.get('approveCredits'))}),...await balance(u.userId)});
 }
 const parsed=z.object({projectId:z.string().uuid(),voiceId:z.string().uuid(),referenceId:z.string().uuid(),script:z.string().trim().min(5).max(240),approveCredits:z.literal(5)}).safeParse(await smallJson(req));if(!parsed.success)throw new APIError(400,'Choose your voice and portrait, then write 5–240 characters to speak.');return json({...await createTalking(u.userId,parsed.data),...await balance(u.userId)});
});
