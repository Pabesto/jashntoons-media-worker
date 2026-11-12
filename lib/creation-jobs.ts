import {env} from 'cloudflare:workers';
import {resolveSavedCreationAvatar} from './creation-library';
import {referenceEditSource,isReferenceEdit,referenceAssetKey,referenceAssetName,referenceEditCredits,referenceEditRequest,referenceVideoPrompt,REFERENCE_SOURCE_VERSION} from './reference-edit-contract';
import {assemblyAsset} from './reference-assembly';
import {workerReady} from './media-worker';
import {APIError,boundedBytes} from './api';
import {reserve,ownedMedia,type ReelJob} from './credits';
import {requireProject,generationFingerprint} from './avatar-library';
import {voiceRequest,remoteState,voiceConfigured} from './voice-provider';
import {wavInfo} from './custom-film';
import {invitationStyle,invitationVisualKey} from './invitation-story';
import {directReel,directorReferences} from './reel-director';
import {creationBrief,applyDirectedReel,type CreationQuote,type CreationView,type DirectedReel} from './director-contract';
import {getTemplate,type Invite} from './templates';
import {generationFailure,type GenerationFailure} from './generation-failure';

type Step={kind:'art'|'voice'|'speech'|'film'|'reference-film'|'assembly';segment?:number;key:string;credits:number;label:string;existing?:string};
type JobPayload={kind:'directed-reel';data:Invite;steps:Step[];index:number;partIds?:string[];artId?:string;voiceId?:string;audioId?:string;videoId?:string;result?:DirectedReel;failure?:GenerationFailure;diagnosticsChecked?:boolean};
type Asset={kind:'director-asset';type:Step['kind'];remoteVoice?:string;failure?:GenerationFailure;parentJobId?:string};
class AssetFailedError extends APIError{constructor(public failure:GenerationFailure){super(502,failure.message)}}
const db=()=>env.DB!;
const get=(owner:string,id:string)=>db().prepare('SELECT * FROM reel_jobs WHERE id=? AND owner=?').bind(id,owner).first<ReelJob>();
const cached=(owner:string,key:string)=>db().prepare("SELECT * FROM reel_jobs WHERE owner=? AND generation_key=?").bind(owner,key).first<ReelJob>();

export async function creationJob(owner:string,id:string){const j=await get(owner,id);if(!j||JSON.parse(j.payload).kind!=='directed-reel')throw new APIError(404,'This creation is not in your account.');return j;}
export function creationView(j:ReelJob):CreationView{const p=JSON.parse(j.payload) as JobPayload;return {id:j.id,status:j.status,phase:p.steps[p.index]?.label??'Your invitation is ready',error:j.error??undefined,result:p.result,savedArtId:p.artId,failure:p.failure};}

async function recordFailure(asset:ReelJob,key:string,remote:{failureCode?:string;failure?:string}){
 const p=JSON.parse(asset.payload) as Asset,failure=generationFailure(remote,p.type==='art'?'avatar':['film','reference-film','assembly'].includes(p.type)?'video':p.type as 'voice'|'speech');
 p.failure=failure;
 // A moderation/input rejection is terminal for these exact inputs. Do not make
 // another billable request just because the user clicks Create again.
 const holder=await cached(asset.owner,key),retain=!failure.retryable&&(!holder||holder.id===asset.id);
 await db().prepare("UPDATE reel_jobs SET status='failed',generation_key=?,payload=?,error=?,updated=? WHERE id=?").bind(retain?key:null,JSON.stringify(p),failure.message,Date.now(),asset.id).run();
 console.error('creation_asset_failed',{jobId:asset.id,taskId:asset.provider_task,kind:p.type,code:failure.code??'UNKNOWN'});
 return failure;
}

async function recoverFailure(job:ReelJob){
 const p=JSON.parse(job.payload) as JobPayload;if(job.status!=='failed'||p.failure||p.diagnosticsChecked)return job;
 const step=p.steps[p.index];if(!step)return job;
 // Older releases discarded provider diagnostics and cleared the asset key.
 // Only inspect the asset inside this owner's exclusive creation window.
 const asset=await db().prepare("SELECT * FROM reel_jobs WHERE owner=? AND status='failed' AND json_extract(payload,'$.kind')='director-asset' AND json_extract(payload,'$.type')=? AND created>=? AND created<=? ORDER BY created DESC LIMIT 1").bind(job.owner,step.kind,job.created,job.updated).first<ReelJob>();
 if(asset?.provider_task&&step.kind!=='assembly'){
  const remote=await voiceRequest('tasks/'+encodeURIComponent(asset.provider_task));
  if(remoteState(remote.status)==='failed')p.failure=await recordFailure(asset,step.key,remote);
 }
 p.diagnosticsChecked=true;
 const error=p.failure?failureMessage(p.failure.message):job.error;
 await db().prepare('UPDATE reel_jobs SET payload=?,error=? WHERE id=?').bind(JSON.stringify(p),error,job.id).run();return {...job,payload:JSON.stringify(p),error};
}
export async function creationRecovery(owner:string,projectId:string){
 const project=await requireProject(owner,projectId),data=JSON.parse(project.payload) as Invite;
 const job=await db().prepare("SELECT * FROM reel_jobs WHERE owner=? AND project_id=? AND json_extract(payload,'$.kind')='directed-reel' ORDER BY created DESC LIMIT 1").bind(owner,projectId).first<ReelJob>();
 if(!job||job.status!=='failed'||JSON.stringify((JSON.parse(job.payload) as JobPayload).data.photos)!==JSON.stringify(data.photos))return null;
 return creationView(await recoverFailure(job));
}

export async function validateCreation(owner:string,data:Invite){
 if(data.creation?.selectedAvatarId){const {avatar}=await resolveSavedCreationAvatar(owner,data.creation.selectedAvatarId);if(JSON.stringify(avatar.sourcePhotos)!==JSON.stringify(data.photos))throw new APIError(400,'Choose the saved character again, or use the new photos to create another character.');}
 if(data.creation?.audioId){const row=await db().prepare('SELECT mime FROM media WHERE owner=? AND id=?').bind(owner,data.creation.audioId).first<{mime:string}>();if(row?.mime!=='audio/wav')throw new APIError(403,'Choose a recording saved to your own account.');}
 if(data.creation?.voiceId){const j=await get(owner,data.creation.voiceId);if(!j||j.status!=='ready'||!['voice-profile','director-asset'].includes(JSON.parse(j.payload).kind)||(!JSON.parse(j.payload).sampleId&&JSON.parse(j.payload).type!=='voice'))throw new APIError(403,'Choose your own saved voice.');}
 if(data.pendingCreationId)await creationJob(owner,data.pendingCreationId);
 if(data.directedReel){const j=await creationJob(owner,data.directedReel.jobId),result=(JSON.parse(j.payload) as JobPayload).result;if(j.status!=='ready'||JSON.stringify(result?.sourcePhotos)!==JSON.stringify(data.directedReel.sourcePhotos)||result?.sourceTemplateId!==data.directedReel.sourceTemplateId||(['referenceEdit','sourceReferenceId','sourceVisualKey','jobId','artId','videoId','audioId','hasSpeech','duration'] as const).some(k=>result?.[k]!==data.directedReel?.[k])||data.generatedArt!==result?.artId||data.generatedVideo!==result?.videoId||(!!result?.videoId&&data.duration!==result.duration))throw new APIError(403,'Choose a completed reel from your account.');}
}
async function reference(owner:string,id:string,type:'image'|'audio'){
 const row=await db().prepare('SELECT mime,size FROM media WHERE id=? AND owner=?').bind(id,owner).first<{mime:string;size:number}>();if(!row||!row.mime.startsWith(type+'/'))throw new APIError(403,'Choose your own saved '+type+'.');
 const object=await env.BUCKET!.get(id);if(!object)throw new APIError(404,'A saved attachment is missing.');const bytes=new Uint8Array(await object.arrayBuffer());
 if(bytes.length<=3300000){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'data:'+row.mime+';base64,'+btoa(binary);}
 // Provider-owned ephemeral input: private media never gets a public website URL.
 const e=env as unknown as Record<string,string>,r=await fetch('https://api.dev.runwayml.com/v1/uploads',{method:'POST',headers:{Authorization:'Bearer '+(e.RUNWAY_API_KEY||e.RUNWAYML_API_SECRET),'X-Runway-Version':'2024-11-06','Content-Type':'application/json'},body:JSON.stringify({filename:id+'.'+(type==='image'?'png':'wav'),type:'ephemeral'}),signal:AbortSignal.timeout(60000)});
 if(!r.ok)throw new APIError(502,'The saved reference could not be prepared.');const upload=await r.json() as {runwayUri:string;uploadUrl:string;fields:Record<string,string>};if(!upload.uploadUrl?.startsWith('https://')||!upload.runwayUri?.startsWith('runway://'))throw new APIError(502,'The media service returned an invalid upload.');const form=new FormData();Object.entries(upload.fields).forEach(([k,v])=>form.append(k,v));form.append('file',new File([bytes],id+'.png',{type:row.mime}));const sent=await fetch(upload.uploadUrl,{method:'POST',body:form,signal:AbortSignal.timeout(60000)});if(!sent.ok)throw new APIError(502,'The reference upload did not finish.');return upload.runwayUri;
}
async function saveOutput(owner:string,url:string|undefined,type:'art'|'speech'|'film'){
 if(!url?.startsWith('https://'))throw new APIError(502,'The AI output is missing.');const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new APIError(502,'The output could not be saved. Retry to save the existing result.');const mime=r.headers.get('content-type')?.split(';')[0]??'',allowed=type==='art'?['image/png','image/jpeg','image/webp']:type==='speech'?['audio/mpeg','audio/mp3','audio/wav']:['video/mp4','video/webm'];if(!allowed.includes(mime))throw new APIError(502,'The AI returned an unsupported file.');const bytes=await boundedBytes(r,type==='film'?64000000:16000000);if(!bytes.length)throw new APIError(502,'The AI returned an empty file.');const id=crypto.randomUUID();await env.BUCKET!.put(id,bytes,{httpMetadata:{contentType:mime}});try{await db().prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').bind(id,owner,mime,bytes.length,Date.now()).run();}catch(e){await env.BUCKET!.delete(id);throw e;}return id;
}
async function plan(owner:string,data:Invite){
 if(!data.photos.length||(creationBrief(data).format!=='image'&&(!data.names.trim()||!data.date||!data.venue.trim())))throw new APIError(400,'Add names, date, venue and at least one clear photo first.');
 await validateCreation(owner,data);await ownedMedia(owner,data.photos);const b=creationBrief(data);const source=isReferenceEdit(data)?referenceEditSource(data):null;
 if(source){if(b.voice!=='none')throw new APIError(400,'Voice lip-sync for this exact reference film is not connected yet. Choose music only to keep the original scenes and movement.');if(!workerReady())throw new APIError(503,'Reference film finishing is temporarily unavailable. Your saved people and brief are safe.');for(const segment of source.segments){if(!await env.BUCKET!.head(referenceAssetKey(source.id,referenceAssetName(segment.index))))throw new APIError(503,'This exact reference film is still being prepared. No credits have been used.');}}
 if(getTemplate(data.templateId).studio&&b.format==='template'&&b.voice!=='none')throw new APIError(400,'This template keeps its original animation with music. Voice lip-sync for this fixed template is not connected yet.');
 if(['image','card'].includes(b.format)&&b.voice!=='none')throw new APIError(400,'Voice is available for video reels.');if(b.voice!=='none'&&!b.consent)throw new APIError(400,'Confirm that you own this voice or have permission to use it.');
 if(['recording','clone'].includes(b.voice)){if(!b.audioId)throw new APIError(400,'Attach your recording first.');const object=await env.BUCKET!.get(b.audioId);if(!object)throw new APIError(400,'The recording is missing.');const info=wavInfo(new Uint8Array(await object.arrayBuffer()));if(info.duration>30||(b.voice==='clone'&&info.duration<10))throw new APIError(400,b.voice==='clone'?'For voice cloning, upload 10–30 seconds of clear speech.':'Use a speech recording up to 30 seconds.');}
 if(b.voice==='saved'&&!b.voiceId)throw new APIError(400,'Choose a saved voice.');
 const selected=b.selectedAvatarId?await resolveSavedCreationAvatar(owner,b.selectedAvatarId):null;
 const d=directReel(data),artKey=selected?(selected.job.generation_key??'saved-cast:'+selected.job.id):'director-art-v1:'+await generationFingerprint([data.photos,invitationStyle(data).id==='watercolor'?"reusable-illustrated-cast":"cast-style:"+invitationStyle(data).id]),steps:Step[]=[{kind:'art',key:artKey,credits:selected?0:1,...(selected?{existing:selected.job.id}:{}),label:selected?'Using your saved character':'Reading all photos and illustrating your people'}];
 let voiceKey=b.voiceId??'';
 if(b.voice==='clone'){const row=await db().prepare('SELECT digest FROM media WHERE id=? AND owner=?').bind(b.audioId,owner).first<{digest:string}>();voiceKey='voice:'+row!.digest;steps.push({kind:'voice',key:voiceKey,credits:1,label:'Saving your reusable voice'});}
 if(b.voice==='clone'||b.voice==='saved')steps.push({kind:'speech',key:'director-speech-v1:'+await generationFingerprint([voiceKey,d.dialogue]),credits:1,label:'Preparing your invitation dialogue'});
 if(source){for(const segment of source.segments)steps.push({kind:'reference-film',segment:segment.index,key:'reference-edit-v1:'+await generationFingerprint([REFERENCE_SOURCE_VERSION,source.id,segment,artKey,referenceVideoPrompt(),b.regenerationId??'']),credits:referenceEditCredits(segment.seconds),label:`Replacing your people in original footage ${segment.index+1}/${source.segments.length}`});steps.push({kind:'assembly',key:'reference-join-v1:'+await generationFingerprint(steps.map(s=>s.key)),credits:0,label:'Joining the complete film at its original timing'});}
 else if(b.format==='film'||b.voice!=='none')steps.push({kind:'film',key:'director-film-v1:'+await generationFingerprint([artKey,d.video,b.voice,b.audioId??'',voiceKey,d.dialogue,...(b.regenerationId?[b.regenerationId]:[])]),credits:7,label:'Creating scenes, movement and speech together'});
 const key='director-v1:'+await generationFingerprint([steps.map(s=>s.key),...(['image','card'].includes(b.format)?[b.format]:[]),source?.seconds??(steps.some(s=>s.kind==='film')?30:data.duration)]);const previous=await cached(owner,key);const reused:string[]=[];
 for(const s of steps){let asset=s.existing?await get(owner,s.existing):await cached(owner,s.key);if(asset?.status==='failed'){const failure=(JSON.parse(asset.payload) as Asset).failure;if(failure&&!failure.retryable)throw new APIError(409,failure.message+' Your completed avatar stays in your private library. Contact support before repeating this request.');}if(!asset&&s.kind==='art'&&invitationStyle(data).id==='watercolor'&&data.photos.length<=2){const prior=await db().prepare("SELECT * FROM reel_jobs WHERE owner=? AND status IN ('ready','completed') AND media_id IS NOT NULL AND json_extract(payload,'$.invite.avatarMode')='cutout' ORDER BY created DESC LIMIT 100").bind(owner).all<ReelJob>();asset=prior.results.find(j=>JSON.stringify(JSON.parse(j.payload).invite?.photos)===JSON.stringify(data.photos))??null;}if(asset&&['ready','completed'].includes(asset.status)){s.credits=0;s.existing=asset.id;reused.push(s.kind==='art'?'Saved character':s.kind==='voice'?'Saved voice':s.kind==='speech'?'Saved dialogue':'Saved film');}}
 const quote:CreationQuote={key,credits:previous&&previous.status!=='failed'?0:steps.reduce((n,s)=>n+s.credits,0),reused,steps:steps.map(s=>({label:s.label,credits:s.credits})),dialogue:d.dialogue,shots:source?source.segments.map(s=>`${s.start.toFixed(1)}?${(s.start+s.seconds).toFixed(1)}s ? Original ${source.name} footage, your character replacement`):d.shots};return {steps,quote,previous};
}
export async function quoteCreation(owner:string,data:Invite){return (await plan(owner,data)).quote;}
export async function startCreation(owner:string,projectId:string,data:Invite,approval:{key:string;credits:number}){
 await requireProject(owner,projectId);await creationRecovery(owner,projectId);const p=await plan(owner,data);
 if(p.previous&&p.previous.status!=='failed')return creationView(p.previous);
 if(p.quote.key!==approval.key||p.quote.credits!==approval.credits)throw new APIError(409,'The brief or saved assets changed. Review the updated total before creating.');
 if(!voiceConfigured())throw new APIError(503,'The creation service is not connected. Your brief is saved.');
 const payload:JobPayload={kind:'directed-reel',data,steps:p.steps,index:0,...(data.creation?.voice==='recording'?{audioId:data.creation.audioId}:{})};
 if(data.creation?.voice==='saved'){const v=await get(owner,data.creation.voiceId!);payload.voiceId=v!.provider_task!;}
 const r=await reserve(owner,crypto.randomUUID(),JSON.stringify(payload),'generating',{cost:p.quote.credits,projectId,generationKey:p.quote.key,exclusiveCreation:true});
 // The account draft is the recovery pointer. No provider request runs before it is saved.
 await db().prepare("UPDATE projects SET payload=json_set(payload,'$.pendingCreationId',?),updated=? WHERE id=? AND owner=?").bind(r.job.id,Date.now(),projectId,owner).run();return creationView(r.job);
}
async function update(j:ReelJob,p:JobPayload,status='generating'){await db().prepare('UPDATE reel_jobs SET payload=?,status=?,updated=?,error=NULL WHERE id=?').bind(JSON.stringify(p),status,Date.now(),j.id).run();return creationView((await get(j.owner,j.id))!);}
function failureMessage(message:string){return message+' Reserved Jashntoons credits were returned. Your photos, details and completed avatar remain saved.';}
async function fail(j:ReelJob,message:string,p:JobPayload){await db().prepare("UPDATE reel_jobs SET status='failed',generation_key=NULL,payload=?,error=?,updated=? WHERE id=?").bind(JSON.stringify(p),failureMessage(message),Date.now(),j.id).run();return creationView((await get(j.owner,j.id))!);}
async function readyAsset(j:ReelJob,s:Step,p:JobPayload){
 let asset=s.existing?await get(j.owner,s.existing):await cached(j.owner,s.key);
 if(s.kind==='assembly'){if(!asset||asset.status==='failed'&&JSON.parse(asset.payload).retryParent!==j.id)asset=await assemblyAsset(j.owner,s.key,p.partIds??[],referenceEditSource(p.data)!.segments.map(s=>s.seconds),j.id);if(asset.status==='failed')throw new APIError(502,asset.error||'The edited film could not be joined.');return asset.status==='ready'?asset:null;}
 if(!asset){
  const r=await reserve(j.owner,crypto.randomUUID(),JSON.stringify({kind:'director-asset',type:s.kind,parentJobId:j.id} satisfies Asset),'processing',{cost:0,generationKey:s.key});asset=r.job;
  if(r.created){try{
   const b=creationBrief(p.data),d=directReel(p.data);let remote;
   if(s.kind==='art')remote=await voiceRequest('text_to_image',{model:'gpt_image_2_6_flare',ratio:'auto',background:'transparent',quality:'medium',reasoningEffort:'medium',promptText:d.art,referenceImages:await Promise.all(p.data.photos.map(async id=>({uri:await reference(j.owner,id,'image')})))});
   else if(s.kind==='voice')remote=await voiceRequest('voices',{name:'My Jashntoons voice',from:{type:'audio',audio:await reference(j.owner,b.audioId!,'audio')}});
   else if(s.kind==='speech')remote=await voiceRequest('text_to_speech',{model:'eleven_v4',promptText:d.dialogue,voice:{type:'custom',id:p.voiceId}});
   else if(s.kind==='reference-film'){const source=referenceEditSource(p.data)!;remote=await voiceRequest('video_to_video',referenceEditRequest(source,source.segments[s.segment!],await reference(j.owner,p.artId!,'image')));}
   else remote=await voiceRequest('image_to_video',{model:'seedance2_5',duration:30,ratio:'720:1280',outputFormat:'mp4',audio:b.voice!=='none',promptText:d.video,promptImage:[{uri:await reference(j.owner,p.artId!,'image')},...directorReferences(p.data).map(path=>({uri:'https://jashntoons.ai'+path}))],...(p.audioId?{referenceAudio:[{type:'audio',uri:await reference(j.owner,p.audioId,'audio')}]}:{})});
   await db().prepare("UPDATE reel_jobs SET provider_task=?,status='generating',updated=? WHERE id=?").bind(remote.id,Date.now(),asset.id).run();
  }catch{await db().prepare("UPDATE reel_jobs SET status='failed',error=?,updated=? WHERE id=?").bind('The provider did not confirm this request. Contact support before submitting it again; we will not automatically repeat a potentially billable request.',Date.now(),asset.id).run();}
  }
  asset=(await get(j.owner,asset.id))!;
 }
 if(asset.status==='failed'){const failure=(JSON.parse(asset.payload) as Asset).failure;if(failure)throw new AssetFailedError(failure);throw new APIError(502,asset.error||'This scene could not be created.');}
 if(['ready','completed'].includes(asset.status))return asset;
 if(asset.status==='processing'){if(Date.now()-asset.updated>180000)throw new APIError(502,'This saved request needs a support check before it can be repeated.');return null;}
 if(!asset.provider_task)return null;
 const remote=await voiceRequest((s.kind==='voice'?'voices/':'tasks/')+encodeURIComponent(asset.provider_task)),state=remoteState(remote.status);
 if(state==='pending')return null;
 if(state==='failed')throw new AssetFailedError(await recordFailure(asset,s.key,remote));
 const lock=await db().prepare("UPDATE reel_jobs SET status='processing',updated=? WHERE id=? AND status='generating' RETURNING id").bind(Date.now(),asset.id).first();if(!lock)return null;
 try{const media=s.kind==='voice'?null:await saveOutput(j.owner,remote.output?.[0],s.kind==='reference-film'?'film':s.kind);await db().prepare("UPDATE reel_jobs SET media_id=?,status='ready',updated=? WHERE id=?").bind(media,Date.now(),asset.id).run();return (await get(j.owner,asset.id))!;}catch(e){await db().prepare("UPDATE reel_jobs SET status='generating',updated=? WHERE id=?").bind(Date.now(),asset.id).run();throw e;}
}
export async function advanceCreation(job:ReelJob){
 if(['ready','failed'].includes(job.status))return creationView(job.status==='failed'?await recoverFailure(job):job);
 if(job.status==='processing'){if(Date.now()-job.updated>180000){await db().prepare("UPDATE reel_jobs SET status='generating' WHERE id=? AND status='processing'").bind(job.id).run();}else return creationView(job);}
 const lock=await db().prepare("UPDATE reel_jobs SET status='processing',updated=? WHERE id=? AND status='generating' RETURNING id").bind(Date.now(),job.id).first();if(!lock)return creationView(job);
 const p=JSON.parse(job.payload) as JobPayload;
 try{
  const step=p.steps[p.index];if(step){const asset=await readyAsset(job,step,p);if(!asset)return update(job,p);if(step.kind==='art')p.artId=asset.media_id!;if(step.kind==='voice')p.voiceId=asset.provider_task!;if(step.kind==='speech')p.audioId=asset.media_id!;if(step.kind==='film'||step.kind==='assembly')p.videoId=asset.media_id!;if(step.kind==='reference-film'){p.partIds??=[];p.partIds[step.segment!]=asset.media_id!;}p.index++;}
  if(p.index===p.steps.length){const source=p.steps.some(s=>s.kind==='reference-film')?referenceEditSource(p.data):null;p.result={...(source?{referenceEdit:true,sourceReferenceId:source.id}:{}),sourceVisualKey:invitationVisualKey(p.data),sourceTemplateId:p.data.templateId,sourcePhotos:p.data.photos,jobId:job.id,artId:p.artId!,...(p.videoId?{videoId:p.videoId}:{}),...(p.audioId?{audioId:p.audioId}:{}),hasSpeech:creationBrief(p.data).voice!=='none',duration:source?.seconds??(p.videoId?30:getTemplate(p.data.templateId).studio?getTemplate(p.data.templateId).duration??30:p.data.duration)};
   await update(job,p,'ready');const project=await requireProject(job.owner,job.project_id!);const latest=JSON.parse(project.payload) as Invite;
   if(latest.pendingCreationId===job.id)await db().prepare('UPDATE projects SET payload=?,updated=? WHERE id=? AND owner=?').bind(JSON.stringify(applyDirectedReel(latest,p.result)),Date.now(),job.project_id,job.owner).run();return creationView((await get(job.owner,job.id))!);
  }return update(job,p);
 }catch(e){if(e instanceof APIError&&[429,503].includes(e.status)){await update(job,p);throw e;}if(e instanceof AssetFailedError)p.failure=e.failure;return fail(job,e instanceof APIError?e.message:'Creation was interrupted. Retry to reuse completed work.',p);}
}
