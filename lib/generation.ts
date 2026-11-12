import {momentPrompts} from './ai-moments';
import {rememberAvatar,avatarResult} from './avatar-library';
import {avatarBrief} from './editor-settings';
import {env} from 'cloudflare:workers';
import {APIError,boundedBytes} from './api';
import {avatarPlacement} from './avatar-state';
import {type Invite,getTemplate} from './templates';
import {type ReelJob,balance} from './credits';
import {type ImageProvider,type MotionProvider} from './ai-options';
import {pollProvider,startMotion,googleOutput,type AIOutput} from './ai-providers';
export {runway} from './ai-providers';
export type Generation={invite:Invite;prompt:string;animate:boolean;phase:'image'|'video';videoId?:string;imageProvider?:ImageProvider;motionProvider?:MotionProvider;motionPrompt?:string};
function base64(bytes:Uint8Array){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}
async function mediaURI(id:string,owner:string){const row=await env.DB!.prepare('SELECT mime,size FROM media WHERE id=? AND owner=?').bind(id,owner).first<{mime:string;size:number}>();if(!row||!row.mime.startsWith('image/'))throw new APIError(400,'Choose an image reference.');const object=await env.BUCKET!.get(id);if(!object)throw new APIError(404,'Reference photo is missing.');return {uri:`data:${row.mime};base64,${base64(new Uint8Array(await object.arrayBuffer()))}`,size:row.size};}
export async function imageRequest(data:Invite,prompt:string,owner:string){
 const refs=[];for(const id of data.photos.slice(0,2)){const ref=await mediaURI(id,owner);if(ref.size>3300000)throw new APIError(400,'For AI character creation, use reference photos smaller than 3.3 MB.');refs.push({uri:ref.uri});}
 if(data.aiMoment)return {model:'gpt_image_2',ratio:'1088:1920',quality:'medium',promptText:momentPrompts(data.aiMoment).image,referenceImages:refs};
 const t=getTemplate(data.templateId),cutout=data.avatarMode==='cutout';
 return {...(cutout?{model:'gpt_image_2_6_flare',ratio:'auto',background:'transparent',quality:'medium',reasoningEffort:'medium'}:{model:'gpt_image_2',ratio:'1088:1920',quality:'medium'}),promptText:`Create an original premium photo-like cinematic invitation scene for ${t.category}. Art direction: ${t.name}; ${t.mood}. ${t.id==='haveli-namaste'?'A richly painted pink Rajasthani haveli with green carved doors, marigold garlands, hanging flowers, warm sunlight and a full-body Indian wedding couple. Use ONLY the uploaded people as identity references, never stock example faces. Leave the upper 25 percent uncluttered for editable text.':''} User creative brief: ${avatarBrief(data)} ${prompt}. Use the supplied people as identity references; preserve their recognisable facial features, skin tone and requested clothing. ${cutout?'A full-body photo-like character cutout on a completely transparent background, head to toe visible, no ground plane, no scene, no frame, no shadow rectangle. All people together, centred, with space around their outlines.':'A complete cinematic vertical composition, realistic cinematic lighting and materials, expressive photo-like characters in lower half, elegant uncluttered upper third for invitation typography.'} No text, no letters, no logos, no watermarks. Never copy a celebrity.`,referenceImages:refs};
}
async function storeOutput(output:AIOutput,owner:string,video=false){
 const limit=video?32000000:16000000;let bytes:Uint8Array,mime:string;
 if(output.b64){if(output.b64.length>Math.ceil(limit*4/3)+4)throw new APIError(502,'AI output is too large.');try{const raw=atob(output.b64);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));}catch{throw new APIError(502,'AI output could not be decoded.');}mime=output.mime||'';}
 else {let res:Response|null;if(output.googleFile)res=await googleOutput(output.googleFile);else{if(!output.url?.startsWith('https://'))throw new APIError(502,'The AI output is unavailable.');res=await fetch(output.url,{signal:AbortSignal.timeout(60000)});}if(!res)return null;if(!res.ok)throw new APIError(502,'Could not retrieve the AI output.');mime=res.headers.get('content-type')?.split(';')[0]||'';bytes=await boundedBytes(res,limit);}
 if(!bytes.length||bytes.length>limit||(video?!['video/mp4','video/webm'].includes(mime):!['image/png','image/jpeg','image/webp'].includes(mime)))throw new APIError(502,'The AI output has an unsupported format.');
 const id=crypto.randomUUID();await env.BUCKET!.put(id,bytes,{httpMetadata:{contentType:mime}});try{await env.DB!.prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').bind(id,owner,mime,bytes.length,Date.now()).run();}catch(e){await env.BUCKET!.delete(id);throw e;}return id;
}
async function failed(job:ReelJob,message='AI generation did not finish. Your reel credit has been returned.'){
 await env.DB!.prepare("UPDATE reel_jobs SET status='failed',error=?,updated=? WHERE id=? AND status IN ('generating','processing')").bind(message,Date.now(),job.id).run();return {id:job.id,status:'failed',error:message,...await balance(job.owner)};
}
export async function advance(job:ReelJob){
 if(['ready','completed'].includes(job.status)){const saved=await rememberAvatar(job);if(saved)return {...avatarResult(saved),...await balance(job.owner)};}
 const payload=JSON.parse(job.payload) as Generation;
 if(!payload.phase)throw new APIError(400,'This is not an AI generation job.');
 const provider=payload.phase==='image'?(payload.imageProvider??'runway'):(payload.motionProvider==='google'?'google':'runway');
 const info={customReady:job.credit_cost>=5&&payload.animate,avatarMode:payload.invite.avatarMode,templateId:payload.invite.templateId,imageProvider:payload.imageProvider??'runway'};
 if(job.status==='ready')return {id:job.id,status:'ready',generatedArt:job.media_id,generatedVideo:payload.videoId,...info,...await balance(job.owner)};
 if(job.status==='failed')return {id:job.id,status:'failed',error:job.error,...await balance(job.owner)};
 if(job.status==='processing'&&Date.now()-job.updated>120000){await env.DB!.prepare("UPDATE reel_jobs SET status='generating' WHERE id=? AND status='processing'").bind(job.id).run();job={...job,status:'generating'};}
 if(job.status!=='generating')return {id:job.id,status:job.status,phase:payload.phase};
 if(!job.provider_task){if(Date.now()-job.created>30*60*1000)return failed(job,'Creation did not start. Your credit was returned.');return {id:job.id,status:'generating'};}
 let task;try{task=await pollProvider(provider,job.provider_task,payload.phase==='video');}catch(e){if(e instanceof APIError&&e.status!==429)return failed(job,e.message+' Your reel credit was returned.');throw e;}
 if(task.status==='failed')return failed(job);
 if(task.status!=='succeeded'){if(Date.now()-job.created>86400000)return failed(job,'This generation timed out. Your credit was returned.');return {id:job.id,status:'generating',phase:payload.phase};}
 const claimed=await env.DB!.prepare("UPDATE reel_jobs SET status='processing',updated=? WHERE id=? AND status='generating' RETURNING id").bind(Date.now(),job.id).first();if(!claimed)return {id:job.id,status:'processing',phase:payload.phase};
 try{
  if(!task.output)throw new Error('Missing output');const media=await storeOutput(task.output,job.owner,payload.phase==='video');
  if(!media){await env.DB!.prepare("UPDATE reel_jobs SET status='generating' WHERE id=? AND status='processing'").bind(job.id).run();return {id:job.id,status:'generating',phase:payload.phase};}
  if(payload.phase==='image'&&payload.animate){const motionProvider=payload.motionProvider==='google'?'google':'runway';const input=motionProvider==='runway'&&task.output.url?task.output.url:(await mediaURI(media,job.owner)).uri;const next=await startMotion(motionProvider,input,payload.motionPrompt??(payload.invite.templateId==='haveli-namaste'?'A single continuous 10-second shot. The illustrated Indian wedding couple smiles warmly, then gently brings their hands together in a namaste welcome. Subtle natural head, hand and fabric movement. Marigold garlands sway softly. Slowly dolly out to reveal the beautiful pink haveli. Preserve the exact people, faces, outfits and architecture from the image. No cuts, no extra people, no text, no dialogue.':undefined));if(next.status==='failed')throw new Error('Motion failed');await env.DB!.prepare("UPDATE reel_jobs SET status='generating',media_id=?,provider_task=?,payload=?,updated=? WHERE id=?").bind(media,next.id,JSON.stringify({...payload,phase:'video'}),Date.now(),job.id).run();return {id:job.id,status:'generating',phase:'video'};}
  const art=payload.phase==='image'?media:job.media_id,finished={...payload,...(payload.phase==='video'?{videoId:media}:{})};await env.DB!.prepare("UPDATE reel_jobs SET status='ready',media_id=?,payload=?,updated=? WHERE id=?").bind(art,JSON.stringify(finished),Date.now(),job.id).run();await rememberAvatar({...job,status:'ready',media_id:art,payload:JSON.stringify(finished)});if(job.project_id)await env.DB!.prepare("UPDATE projects SET payload=json_remove(json_patch(payload,?),'$.pendingGenerationId'),updated=? WHERE id=? AND owner=? AND json_extract(payload,'$.pendingGenerationId')=?").bind(JSON.stringify({stockAvatarId:null,generatedArt:art,generatedVideo:finished.videoId??null,generationJobId:job.id,avatarMode:payload.invite.avatarMode??'scene',editor:avatarPlacement}),Date.now(),job.project_id,job.owner,job.id).run();return {id:job.id,status:'ready',generatedArt:art,generatedVideo:finished.videoId,...info,...await balance(job.owner)};
 }catch(e){return failed(job,(e instanceof APIError?e.message:'Generation could not finish.')+' Your reel credit has been returned.');}
}
