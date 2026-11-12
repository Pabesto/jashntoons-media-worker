import {env} from 'cloudflare:workers';
import {APIError} from './api';
import type {ReelJob} from './credits';
import {momentStyles} from './moment-presets';

export type SavedCreationAvatar={id:string;artId:string;sourcePhotos:string[];created:number;label?:string;styleId?:string};
export type SavedCreationPhoto={id:string;created:number};
export type CreationLibrary={voices:{id:string;created:number}[];avatars:SavedCreationAvatar[];photos:SavedCreationPhoto[]};
type RecordValue=Record<string,unknown>;
type Lookup={image:(id:string)=>Promise<boolean>;parent:(id:string)=>Promise<RecordValue|null>};
const db=()=>env.DB!;
const uuid=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const imageTypes="'image/jpeg','image/png','image/webp'";
const safeJson=(column:string)=>`CASE WHEN json_valid(${column}) THEN ${column} ELSE '{}' END`;
const unavailable=()=>new APIError(404,'This saved character is not available in your account.');
function record(value:unknown):RecordValue|null{return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as RecordValue:null;}
function payload(value:string):RecordValue|null{try{return record(JSON.parse(value))}catch{return null;}}
function photos(data:RecordValue):string[]|null{const list=data.photos;return Array.isArray(list)&&list.length>0&&list.length<=8&&list.every(id=>typeof id==='string'&&uuid.test(id))?[...list]:null;}
function style(data:RecordValue){const chosen=record(data.creation)?.styleId??record(data.aiMoment)?.styleId??'watercolor';return typeof chosen==='string'&&momentStyles.some(s=>s.id===chosen)?chosen:null;}
function invite(parent:RecordValue|null){return parent?.kind==='directed-reel'?record(parent.data):null;}
function links(parent:RecordValue,job:ReelJob){return parent.artId===job.media_id||record(parent.result)?.artId===job.media_id||(Array.isArray(parent.steps)&&parent.steps.some(step=>{const s=record(step);return s?.kind==='art'&&s.existing===job.id}));}

function lookup(owner:string):Lookup{
 const images=new Map<string,Promise<boolean>>(),parents=new Map<string,Promise<RecordValue|null>>();
 return {
  image(id){if(!images.has(id))images.set(id,db().prepare(`SELECT id FROM media WHERE owner=? AND id=? AND mime IN (${imageTypes})`).bind(owner,id).first().then(Boolean));return images.get(id)!;},
  parent(id){if(!parents.has(id))parents.set(id,db().prepare('SELECT payload FROM reel_jobs WHERE owner=? AND id=?').bind(owner,id).first<{payload:string}>().then(row=>row?payload(row.payload):null));return parents.get(id)!;},
 };
}

async function sourceInvite(owner:string,job:ReelJob,p:RecordValue,refs:Lookup):Promise<RecordValue|null>{
 if(p.kind!=='director-asset'){
  // Legacy generation jobs used an invite wrapper, an ownInvite wrapper, or the Invite itself.
  if(p.kind!==undefined)return null;
  return record(p.invite)??record(p.ownInvite)??(typeof p.templateId==='string'?p:null);
 }
 if(p.type!=='art')return null;
 if(p.parentJobId!==undefined){
  if(typeof p.parentJobId!=='string'||!uuid.test(p.parentJobId))return null;
  // The origin link is written when the art job starts, before a parent can fail.
  return invite(await refs.parent(p.parentJobId));
 }
 // Old art jobs have no origin link. Only explicit media/result/step references count;
 // timestamps, project similarity and the most recent user's photos are not evidence.
 const safe=safeJson('payload');
 const matches=await db().prepare(`SELECT payload FROM reel_jobs WHERE owner=? AND json_extract(${safe},'$.kind')='directed-reel' AND (json_extract(${safe},'$.artId')=? OR json_extract(${safe},'$.result.artId')=? OR EXISTS (SELECT 1 FROM json_each(${safe},'$.steps') step WHERE json_extract(CASE WHEN json_valid(step.value) THEN step.value ELSE '{}' END,'$.kind')='art' AND json_extract(CASE WHEN json_valid(step.value) THEN step.value ELSE '{}' END,'$.existing')=?)) ORDER BY created ASC LIMIT 101`).bind(owner,job.media_id,job.media_id,job.id).all<{payload:string}>();
 if(!matches.results.length||matches.results.length>100)return null;
 let origin:RecordValue|null=null,identity='';
 for(const row of matches.results){const parent=payload(row.payload),data=invite(parent),source=data&&photos(data),styleId=data&&style(data);if(!parent||!links(parent,job)||!data||!source||!styleId)return null;const next=JSON.stringify([source,styleId]);if(identity&&next!==identity)return null;origin??=data;identity=next;}
 return origin;
}

async function resolve(owner:string,job:ReelJob|null,refs:Lookup):Promise<{avatar:SavedCreationAvatar;job:ReelJob}|null>{
 if(!job||job.owner!==owner||!uuid.test(job.id)||!['ready','completed'].includes(job.status)||!job.media_id||!uuid.test(job.media_id)||!await refs.image(job.media_id))return null;
 const p=payload(job.payload);if(!p)return null;
 const data=await sourceInvite(owner,job,p,refs),source=data&&photos(data),styleId=data&&style(data);
 if(!data||!source||!styleId||!(await Promise.all(source.map(id=>refs.image(id)))).every(Boolean))return null;
 const label=typeof data.names==='string'?data.names.trim().slice(0,100):'';
 return {avatar:{id:job.id,artId:job.media_id,sourcePhotos:source,created:job.created,...(label?{label}:{}),styleId},job};
}

/** Resolve by art job UUID, never by a client-supplied media ID or parent film ID. */
export async function resolveSavedCreationAvatar(owner:string,id:string):Promise<{avatar:SavedCreationAvatar;job:ReelJob}>{
 if(!uuid.test(id))throw unavailable();
 const job=await db().prepare('SELECT * FROM reel_jobs WHERE owner=? AND id=?').bind(owner,id).first<ReelJob>();
 const found=await resolve(owner,job,lookup(owner));if(!found)throw unavailable();return found;
}

export async function listCreationLibrary(owner:string):Promise<CreationLibrary>{
 const safe=safeJson('j.payload');
 const [jobs,media,voices]=await Promise.all([
  db().prepare(`SELECT j.*,parent.payload AS parent_payload FROM reel_jobs j JOIN media m ON m.id=j.media_id AND m.owner=j.owner LEFT JOIN reel_jobs parent ON parent.owner=j.owner AND parent.id=json_extract(${safe},'$.parentJobId') WHERE j.owner=? AND j.status IN ('ready','completed') AND m.mime IN (${imageTypes}) AND (json_extract(${safe},'$.kind') IS NULL OR (json_extract(${safe},'$.kind')='director-asset' AND json_extract(${safe},'$.type')='art')) ORDER BY j.created DESC,j.id DESC LIMIT 100`).bind(owner).all<ReelJob&{parent_payload:string|null}>(),
  // No universal upload flag exists for old media. Exclude known generated outputs,
  // while keeping old uploads whose digest predates the deduplication migration.
  db().prepare(`SELECT m.id,m.created,EXISTS(SELECT 1 FROM reel_jobs j WHERE j.owner=m.owner AND j.media_id=m.id) AS generated FROM media m WHERE m.owner=? AND m.mime IN (${imageTypes}) ORDER BY m.created DESC,m.id DESC`).bind(owner).all<SavedCreationPhoto&{generated:number}>(),
  db().prepare(`SELECT id,created FROM reel_jobs WHERE owner=? AND status='ready' AND (json_extract(${safeJson('payload')},'$.kind')='voice-profile' OR (json_extract(${safeJson('payload')},'$.kind')='director-asset' AND json_extract(${safeJson('payload')},'$.type')='voice')) ORDER BY created DESC,id DESC LIMIT 30`).bind(owner).all<{id:string;created:number}>(),
 ]);
 const imageIds=new Set(media.results.map(row=>row.id)),parents=new Map<string,RecordValue|null>();
 for(const row of jobs.results){const p=payload(row.payload);if(typeof p?.parentJobId==='string')parents.set(p.parentJobId,row.parent_payload?payload(row.parent_payload):null);}
 const fallback=lookup(owner),refs:Lookup={image:async id=>imageIds.has(id),parent:id=>parents.has(id)?Promise.resolve(parents.get(id)!):fallback.parent(id)},avatars:SavedCreationAvatar[]=[];
 for(const row of jobs.results){const {parent_payload:_,...job}=row;const found=await resolve(owner,job,refs);if(found)avatars.push(found.avatar);}
 return {voices:voices.results.map(({id,created})=>({id,created})),avatars,photos:media.results.filter(row=>!row.generated&&uuid.test(row.id)).slice(0,100).map(({id,created})=>({id,created}))};
}
