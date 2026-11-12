import {env} from 'cloudflare:workers';
import {APIError} from './api';
import {reserve,type ReelJob} from './credits';
export type AssemblyPayload={kind:'reference-assembly';parts:string[];seconds:number[];attempts:number;retryParent?:string};
export const ASSEMBLY_LEASE_MS=600000;
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const safePayload="CASE WHEN json_valid(payload) THEN payload ELSE '{}' END";
const assemblyKind=`json_extract(${safePayload},'$.kind')='reference-assembly'`;
export function readAssemblyPayload(raw:string):AssemblyPayload{
 let p:AssemblyPayload;try{p=JSON.parse(raw)}catch{throw new APIError(409,'This saved film sequence is invalid.');}
 if(!p||p.kind!=='reference-assembly'||!Array.isArray(p.parts)||!Array.isArray(p.seconds)||p.parts.length<1||p.parts.length>4||p.parts.length!==p.seconds.length||p.parts.some(id=>typeof id!=='string'||!uuid.test(id))||p.seconds.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<3||x>30)||p.seconds.reduce((n,x)=>n+x,0)>90||!Number.isInteger(p.attempts)||p.attempts<0||p.attempts>3||(p.retryParent!==undefined&&(typeof p.retryParent!=='string'||!uuid.test(p.retryParent))))throw new APIError(409,'This saved film sequence is invalid.');
 return {kind:'reference-assembly',parts:[...p.parts],seconds:[...p.seconds],attempts:p.attempts,...(p.retryParent?{retryParent:p.retryParent}:{})};
}
export async function assemblyAsset(owner:string,key:string,parts:string[],seconds:number[],parentId?:string){
 let payload:AssemblyPayload;try{payload=readAssemblyPayload(JSON.stringify({kind:'reference-assembly',parts,seconds,attempts:0,...(parentId?{retryParent:parentId}:{})}))}catch{throw new APIError(400,'Invalid reference film sequence.');}
 if(parentId){const parent=await env.DB!.prepare('SELECT payload,status FROM reel_jobs WHERE id=? AND owner=?').bind(parentId,owner).first<{payload:string;status:string}>();let data;try{data=parent&&JSON.parse(parent.payload)}catch{/* Reject malformed parent records below. */}if(!data||data.kind!=='directed-reel'||!['generating','processing'].includes(parent!.status)||!Array.isArray(data.steps)||!data.steps.some((step:{kind?:string;key?:string}|null)=>step?.kind==='assembly'&&step.key===key))throw new APIError(403,'This film sequence does not belong to the active creation.');}
 for(const id of payload.parts){if(!await env.DB!.prepare("SELECT id FROM media WHERE id=? AND owner=? AND mime='video/mp4'").bind(id,owner).first())throw new APIError(404,'A saved film part is not available in your account.');}
 const r=await reserve(owner,crypto.randomUUID(),JSON.stringify(payload),'queued',{cost:0,generationKey:key}),previous=readAssemblyPayload(r.job.payload);
 if(JSON.stringify(previous.parts)!==JSON.stringify(payload.parts)||JSON.stringify(previous.seconds)!==JSON.stringify(payload.seconds))throw new APIError(409,'The saved film sequence does not match this creation.');
 if(r.job.status!=='failed'||!parentId||previous.retryParent===parentId)return r.job;
 // A failed join stays failed for its original parent. A new, explicit creation
 // may retry local assembly once; neither polling nor a duplicate call resets it.
 payload={...previous,attempts:0,retryParent:parentId};
 const changed=await env.DB!.prepare("UPDATE reel_jobs SET status='queued',payload=?,provider_task=NULL,media_id=NULL,updated=?,error=NULL WHERE id=? AND owner=? AND status='failed' RETURNING *").bind(JSON.stringify(payload),Date.now(),r.job.id,owner).first<ReelJob>();
 return changed??(await env.DB!.prepare('SELECT * FROM reel_jobs WHERE id=? AND owner=?').bind(r.job.id,owner).first<ReelJob>())!;
}
export async function leaseAssembly(){
 const now=Date.now();
 await env.DB!.prepare(`UPDATE reel_jobs SET status='failed',error='The film could not be joined. Your edited scenes are saved.',updated=? WHERE ${assemblyKind} AND (status='queued' OR status='processing' AND updated<=?) AND json_extract(${safePayload},'$.attempts')>=3`).bind(now,now-ASSEMBLY_LEASE_MS).run();
 const job=await env.DB!.prepare(`UPDATE reel_jobs SET status='processing',provider_task=?,updated=?,payload=json_set(payload,'$.attempts',coalesce(json_extract(payload,'$.attempts'),0)+1) WHERE id=(SELECT id FROM reel_jobs WHERE ${assemblyKind} AND (status='queued' OR status='processing' AND updated<=?) AND coalesce(json_extract(${safePayload},'$.attempts'),0)<3 ORDER BY created,id LIMIT 1) RETURNING *`).bind(crypto.randomUUID(),now,now-ASSEMBLY_LEASE_MS).first<ReelJob>();
 if(job){try{readAssemblyPayload(job.payload)}catch{await env.DB!.prepare("UPDATE reel_jobs SET status='failed',error='The saved film sequence is invalid.',updated=? WHERE id=? AND provider_task=? AND status='processing'").bind(now,job.id,job.provider_task).run();return null;}}
 return job;
}
export async function leasedAssembly(id:string,lease:string|null){if(!uuid.test(id)||!lease||!uuid.test(lease))throw new APIError(409,'This film assembly lease expired.');const j=await env.DB!.prepare(`SELECT * FROM reel_jobs WHERE id=? AND provider_task=? AND status='processing' AND ${assemblyKind} AND updated>?`).bind(id,lease,Date.now()-ASSEMBLY_LEASE_MS).first<ReelJob>();if(!j)throw new APIError(409,'This film assembly lease expired.');readAssemblyPayload(j.payload);return j;}
