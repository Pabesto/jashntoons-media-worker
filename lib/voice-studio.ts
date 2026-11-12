import {env} from 'cloudflare:workers';
import {APIError,boundedBytes} from './api';
import {reserve,type ReelJob} from './credits';
import {generationFingerprint,requireProject} from './avatar-library';
import {voiceRequest,remoteState,voiceConfigured} from './voice-provider';
import {VOICE_CREDITS,TALKING_CREDITS,type VoiceJobView} from './voice-contract';
import type {Invite} from './templates';
type Payload={kind:'voice-profile'|'talking-reel';name?:string;sampleId?:string;consentAt?:number;phase:'voice'|'speech'|'avatar'|'video';voiceId?:string;referenceId?:string;script?:string;audioId?:string;videoId?:string;avatarId?:string;providerVoice?:string};
const db=()=>env.DB!;
export function voiceView(job:ReelJob):VoiceJobView{const p=JSON.parse(job.payload) as Payload;return {id:job.id,kind:p.kind,name:p.name,status:job.status,phase:p.phase,error:job.error??undefined,sampleId:p.sampleId,audioId:p.audioId,videoId:p.videoId,referenceId:p.referenceId,voiceId:p.voiceId,script:p.script};}
export async function ownedVoiceJob(owner:string,id:string){const j=await db().prepare('SELECT * FROM reel_jobs WHERE id=? AND owner=?').bind(id,owner).first<ReelJob>();if(!j||!['voice-profile','talking-reel'].includes(JSON.parse(j.payload).kind))throw new APIError(404,'This saved voice creation is not available.');return j;}
function base64(bytes:Uint8Array){let b='';for(let i=0;i<bytes.length;i+=8192)b+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(b);}
async function mediaURI(owner:string,id:string,type:'image'|'audio'){
 const m=await db().prepare('SELECT mime,size FROM media WHERE id=? AND owner=?').bind(id,owner).first<{mime:string;size:number}>();
 if(!m||!m.mime.startsWith(type+'/'))throw new APIError(403,'Choose your own saved '+type+' file.');if(m.size>3300000)throw new APIError(400,'Use a '+type+' file smaller than 3.3 MB for this creation.');
 const file=await env.BUCKET!.get(id);if(!file)throw new APIError(404,'The saved '+type+' file is missing.');return 'data:'+m.mime+';base64,'+base64(new Uint8Array(await file.arrayBuffer()));
}
async function store(owner:string,bytes:Uint8Array,mime:string){const id=crypto.randomUUID();await env.BUCKET!.put(id,bytes,{httpMetadata:{contentType:mime}});try{await db().prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').bind(id,owner,mime,bytes.length,Date.now()).run();}catch(e){await env.BUCKET!.delete(id);throw e;}return id;}
async function download(owner:string,url:string|undefined,type:'audio'|'video'){
 if(!url?.startsWith('https://'))throw new APIError(502,'The generated '+type+' is missing.');const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new APIError(502,'The generated '+type+' could not be saved.');
 const mime=r.headers.get('content-type')?.split(';')[0]??'',allowed=type==='audio'?['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4']:['video/mp4','video/webm'];if(!allowed.includes(mime))throw new APIError(502,'The generated file has an unsupported format.');
 const bytes=await boundedBytes(r,type==='audio'?3300000:32000000);if(!bytes.length)throw new APIError(502,'The generated file was empty.');return store(owner,bytes,mime);
}
async function fail(job:ReelJob,error:string){await db().prepare("UPDATE reel_jobs SET status='failed',error=?,generation_key=NULL,updated=? WHERE id=? AND status NOT IN ('ready','completed','failed')").bind(error+' Reserved credits were returned.',Date.now(),job.id).run();return voiceView(await ownedVoiceJob(job.owner,job.id));}
async function persist(job:ReelJob,p:Payload,task:string,status='generating',media:string|null=null){await db().prepare('UPDATE reel_jobs SET payload=?,provider_task=?,status=?,media_id=?,updated=? WHERE id=?').bind(JSON.stringify(p),task,status,media,Date.now(),job.id).run();}
async function cached(owner:string,key:string){return db().prepare("SELECT * FROM reel_jobs WHERE owner=? AND generation_key=? AND status!='failed'").bind(owner,key).first<ReelJob>();}
export async function createVoice(owner:string,input:{name:string;bytes:Uint8Array;consent:boolean;approveCredits:number}){
 if(!input.consent)throw new APIError(400,'Confirm that this is your voice or you have permission to clone it.');if(input.approveCredits!==VOICE_CREDITS)throw new APIError(400,'Confirm the 1-credit voice creation first.');if(!voiceConfigured())throw new APIError(503,'Voice studio is not connected yet.');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',input.bytes as BufferSource))).map(x=>x.toString(16).padStart(2,'0')).join(''),key='voice:'+digest,old=await cached(owner,key);if(old)return voiceView(old);
 const count=await db().prepare("SELECT COUNT(*) total FROM reel_jobs WHERE owner=? AND json_extract(payload,'$.kind')='voice-profile' AND status!='failed'").bind(owner).first<{total:number}>();if((count?.total??0)>=5)throw new APIError(409,'Your account already has 5 saved voices. Reuse one of them.');
 const p:Payload={kind:'voice-profile',name:input.name,phase:'voice',consentAt:Date.now()},r=await reserve(owner,crypto.randomUUID(),JSON.stringify(p),'generating',{cost:VOICE_CREDITS,generationKey:key});if(!r.created)return voiceView(r.job);
 try{p.sampleId=await store(owner,input.bytes,'audio/wav');await persist(r.job,p,'');const remote=await voiceRequest('voices',{name:input.name,from:{type:'audio',audio:await mediaURI(owner,p.sampleId,'audio')}});await persist(r.job,p,remote.id,remoteState(remote.status)==='ready'?'ready':'generating',p.sampleId);return voiceView(await ownedVoiceJob(owner,r.job.id));}catch(e){return fail(r.job,e instanceof APIError?e.message:'Voice creation could not start.');}
}
export async function createTalking(owner:string,input:{projectId:string;voiceId:string;referenceId:string;script:string;approveCredits:number}){
 await requireProject(owner,input.projectId);if(input.approveCredits!==TALKING_CREDITS)throw new APIError(400,'Confirm the 5-credit speaking scene first.');const voice=await ownedVoiceJob(owner,input.voiceId);if(JSON.parse(voice.payload).kind!=='voice-profile'||voice.status!=='ready'||!voice.provider_task)throw new APIError(400,'Choose a ready saved voice.');
 const reference=await mediaURI(owner,input.referenceId,'image');const key='talk:'+await generationFingerprint([input.voiceId,input.referenceId,input.script]),old=await cached(owner,key);if(old)return voiceView(old);
 const p:Payload={kind:'talking-reel',phase:'speech',voiceId:input.voiceId,referenceId:input.referenceId,script:input.script,providerVoice:voice.provider_task};
 const existing=await db().prepare("SELECT payload FROM reel_jobs WHERE owner=? AND status='ready' AND json_extract(payload,'$.kind')='talking-reel' AND json_extract(payload,'$.voiceId')=? AND json_extract(payload,'$.referenceId')=? LIMIT 1").bind(owner,input.voiceId,input.referenceId).first<{payload:string}>();if(existing)p.avatarId=JSON.parse(existing.payload).avatarId;
 void reference;const r=await reserve(owner,crypto.randomUUID(),JSON.stringify(p),'generating',{cost:TALKING_CREDITS,projectId:input.projectId,generationKey:key});if(!r.created)return voiceView(r.job);
 try{const remote=await voiceRequest('text_to_speech',{model:'eleven_v4',promptText:input.script,voice:{type:'custom',id:voice.provider_task}});await persist(r.job,p,remote.id);return voiceView(await ownedVoiceJob(owner,r.job.id));}catch(e){return fail(r.job,e instanceof APIError?e.message:'The speaking scene could not start.');}
}
export async function advanceVoice(job:ReelJob){
 if(['ready','failed'].includes(job.status))return voiceView(job);const p=JSON.parse(job.payload) as Payload;
 if(Date.now()-job.created>86400000)return fail(job,'This voice creation expired.');
 if(job.status==='processing'){if(Date.now()-job.updated>180000)return fail(job,'The connection stopped while saving this creation.');return voiceView(job);}
 if(!job.provider_task){if(Date.now()-job.updated>180000)return fail(job,'The voice creation did not start.');return voiceView(job);}
 let remote;try{remote=await voiceRequest((p.phase==='voice'?'voices/':p.phase==='avatar'?'avatars/':'tasks/')+encodeURIComponent(job.provider_task));}catch(e){if(e instanceof APIError&&e.status===429)throw e;return voiceView(job);}
 if(remoteState(remote.status)==='failed')return fail(job,'The voice service could not complete this creation.');if(remoteState(remote.status)!=='ready')return voiceView(job);
 const claim=await db().prepare("UPDATE reel_jobs SET status='processing',updated=? WHERE id=? AND status='generating' RETURNING id").bind(Date.now(),job.id).first();if(!claim)return voiceView(await ownedVoiceJob(job.owner,job.id));
 try{
  if(p.phase==='voice')await persist(job,p,job.provider_task,'ready',p.sampleId!);
  else if(p.phase==='speech'){
   p.audioId=await download(job.owner,remote.output?.[0],'audio');
   if(!p.avatarId){const avatar=await voiceRequest('avatars',{name:'Jashntoons invitation host',referenceImage:await mediaURI(job.owner,p.referenceId!,'image'),personality:'You are a warm invitation host. Deliver the supplied words naturally and clearly.',voice:{type:'custom',id:p.providerVoice}});p.avatarId=avatar.id;}
   p.phase='avatar';await persist(job,p,p.avatarId);
  }else if(p.phase==='avatar'){
   const video=await voiceRequest('avatar_videos',{model:'gwm1_avatars',avatar:{type:'custom',avatarId:p.avatarId},speech:{type:'audio',audio:await mediaURI(job.owner,p.audioId!,'audio')}});p.phase='video';await persist(job,p,video.id);
  }else{p.videoId=await download(job.owner,remote.output?.[0],'video');await persist(job,p,job.provider_task,'ready',p.videoId);}
  return voiceView(await ownedVoiceJob(job.owner,job.id));
 }catch(e){return fail(job,e instanceof APIError?e.message:'The voice creation could not be saved.');}
}
export async function validateVoiceDraft(owner:string,data:Invite){
 if(data.voiceDraft?.voiceId){const j=await ownedVoiceJob(owner,data.voiceDraft.voiceId);if(JSON.parse(j.payload).kind!=='voice-profile')throw new APIError(400,'Select a saved voice.');}
 if(data.voiceDraft?.referenceId){const m=await db().prepare('SELECT mime FROM media WHERE owner=? AND id=?').bind(owner,data.voiceDraft.referenceId).first<{mime:string}>();if(!m?.mime.startsWith('image/'))throw new APIError(403,'Select your own speaking portrait.');}
 if(data.pendingTalkingId){const j=await ownedVoiceJob(owner,data.pendingTalkingId);if(JSON.parse(j.payload).kind!=='talking-reel')throw new APIError(400,'Choose a speaking scene.');}
 if(data.talkingClip){const c=data.talkingClip,j=await ownedVoiceJob(owner,c.jobId),p=JSON.parse(j.payload) as Payload;if(j.status!=='ready'||p.kind!=='talking-reel'||p.videoId!==c.videoId||p.audioId!==c.audioId||p.referenceId!==c.referenceId||p.voiceId!==c.voiceId||p.script!==c.script)throw new APIError(403,'Choose a finished speaking scene from your account.');}
}
