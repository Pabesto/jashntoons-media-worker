import {validateCreation} from '@/lib/creation-jobs';
import {validateVoiceDraft} from '@/lib/voice-studio';
﻿export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,identity,json,originCheck,APIError,smallJson} from '@/lib/api';
import {draftInviteSchema} from '@/lib/validation';
import {ownedMedia,ownedAudio} from '@/lib/credits';
import {resolveAvatar} from '@/lib/avatar-library';
export const GET=()=>guarded(async()=>{
 const u=await identity(),result=await env.DB!.prepare("SELECT p.id,p.title,p.payload,p.updated,EXISTS(SELECT 1 FROM reel_jobs r WHERE r.owner=p.owner AND (r.project_id=p.id OR r.id=p.id) AND r.status='completed' AND r.mime IN ('video/mp4','video/webm') AND r.payload=p.payload) AS completed FROM projects p WHERE p.owner=? ORDER BY p.updated DESC LIMIT 50").bind(u.userId).all();
 return json({projects:await Promise.all(result.results.map(async row=>({id:row.id,title:row.title,updated:row.updated,completed:!!row.completed,data:await resolveAvatar(u.userId,JSON.parse(String(row.payload)))})))});
});
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const u=await identity(),body=await smallJson(req),parsed=draftInviteSchema.safeParse(body.data);
 if(!parsed.success)throw new APIError(400,'Please check the invitation details.');
 const id=typeof body.id==='string'?body.id:crypto.randomUUID();if(!/^[a-f0-9-]{36}$/.test(id))throw new APIError(400,'Invalid project.');
 const data=await resolveAvatar(u.userId,parsed.data);
 await ownedAudio(u.userId,data);
 await validateVoiceDraft(u.userId,data);
 await validateCreation(u.userId,data);
 await ownedMedia(u.userId,[...data.photos,...[data.generatedArt,data.generatedVideo].filter((x):x is string=>!!x)]);
 const existing=await env.DB!.prepare('SELECT owner FROM projects WHERE id=?').bind(id).first<{owner:string}>();
 if(existing&&existing.owner!==u.userId)throw new APIError(404,'Invitation not found.');
 if(!existing){const count=await env.DB!.prepare('SELECT COUNT(*) AS total FROM projects WHERE owner=?').bind(u.userId).first<{total:number}>();if((count?.total??0)>=50)throw new APIError(409,'You have 50 saved invitations. Delete an old draft to save another.');}
 const updated=Date.now();
 await env.DB!.prepare('INSERT INTO projects(id,owner,title,payload,updated) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,payload=excluded.payload,updated=excluded.updated WHERE projects.owner=excluded.owner').bind(id,u.userId,data.names||(data.creation?.format==='image'?'My illustrated avatar':'Untitled invitation'),JSON.stringify(data),updated).run();
 return json({id,updated,data});
});
