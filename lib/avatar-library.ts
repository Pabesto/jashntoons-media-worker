import type {AIMoment} from './ai-moments';
import {env} from 'cloudflare:workers';
import {APIError} from './api';
import {applyAvatar} from './avatar-state';
import {type Invite} from './templates';
import {type ReelJob} from './credits';
export type SavedAvatar={id:string;owner:string;art_id:string;video_id:string|null;mode:'scene'|'cutout';template_id:string;created:number;credit_cost?:number;aiMoment?:AIMoment;payload?:string};
export function avatarResult(a:SavedAvatar){const aiMoment=a.aiMoment??(a.payload?JSON.parse(a.payload).invite?.aiMoment:undefined);return {...(aiMoment?{aiMoment}:{}),id:a.id,status:'ready',generatedArt:a.art_id,generatedVideo:a.video_id??undefined,avatarMode:a.mode,templateId:a.template_id,customReady:!!a.video_id&&(a.credit_cost??0)>=5};}
export async function rememberAvatar(job:ReelJob){
 if(!job.media_id||!['ready','completed'].includes(job.status))return null;
 const payload=JSON.parse(job.payload),data=(payload.invite??payload) as Invite;
 if(!data.templateId)return null;
 const avatar:SavedAvatar={id:job.id,owner:job.owner,art_id:job.media_id,video_id:payload.videoId??data.generatedVideo??null,mode:data.avatarMode??'scene',template_id:data.templateId,created:job.created,credit_cost:job.credit_cost,aiMoment:data.aiMoment};
 await env.DB!.prepare('INSERT INTO avatars(id,owner,art_id,video_id,mode,template_id,created) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(avatar.id,avatar.owner,avatar.art_id,avatar.video_id,avatar.mode,avatar.template_id,avatar.created).run();return avatar;
}
export async function resolveAvatar(owner:string,data:Invite){
 if(!data.pendingGenerationId)return data;
 const job=await env.DB!.prepare('SELECT * FROM reel_jobs WHERE id=? AND owner=?').bind(data.pendingGenerationId,owner).first<ReelJob>();
 if(!job)return {...data,pendingGenerationId:undefined};
 if(job.status==='failed')return {...data,pendingGenerationId:undefined};
 const a=await rememberAvatar(job);return a?applyAvatar(data,avatarResult(a)):data;
}
export async function requireProject(owner:string,id:string){const row=await env.DB!.prepare('SELECT id,payload FROM projects WHERE id=? AND owner=?').bind(id,owner).first<{id:string;payload:string}>();if(!row)throw new APIError(404,'Save this draft to your account before continuing.');return row;}
export async function generationFingerprint(value:unknown){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
