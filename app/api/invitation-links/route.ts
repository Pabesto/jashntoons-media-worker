import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {APIError,guarded,identity,json,originCheck,smallJson} from '@/lib/api';
import {invitationLinkSchema,publishLinkProblem} from '@/lib/invitation-link-data';
import {checkInvitationAssets,ownerInvitationLink,type InvitationLinkRow} from '@/lib/invitation-links';
export const dynamic='force-dynamic';
export const GET=()=>guarded(async()=>{const user=await identity(),rows=await env.DB!.prepare('SELECT * FROM invitation_links WHERE owner=? ORDER BY updated DESC LIMIT 50').bind(user.userId).all<InvitationLinkRow>();return json({links:rows.results.map(ownerInvitationLink)})});
export const POST=(req:Request)=>guarded(async()=>{
 originCheck(req);const user=await identity(),parsed=z.object({id:z.string().uuid(),version:z.number().int().min(0),action:z.enum(['save','publish']),consent:z.boolean().optional(),data:invitationLinkSchema}).strict().safeParse(await smallJson(req));
 if(!parsed.success)throw new APIError(400,parsed.error.issues[0]?.message||'Check your invitation details.');
 const {id,version,action,consent,data}=parsed.data;
 const old=await env.DB!.prepare('SELECT * FROM invitation_links WHERE id=?').bind(id).first<InvitationLinkRow>();
 if(old&&old.owner!==user.userId)throw new APIError(404,'Invitation not found.');
 if((old?.version??0)!==version)throw new APIError(409,'This invitation changed in another tab. Reopen it from My invitation links.');
 if(action==='publish'){if(consent!==true)throw new APIError(400,'Confirm that guests with the link may view these details and selected media.');const problem=publishLinkProblem(data);if(problem)throw new APIError(400,problem)}
 await checkInvitationAssets(user.userId,data);
 const now=Date.now(),slug=old?.slug??crypto.randomUUID().replaceAll('-',''),encoded=JSON.stringify(data),published=action==='publish'?encoded:old?.published_data??null;
 const row=await env.DB!.prepare('INSERT INTO invitation_links(id,owner,slug,draft_data,published_data,version,created,updated) SELECT ?,?,?,?,?,1,?,? WHERE (SELECT COUNT(*) FROM invitation_links WHERE owner=?)<50 OR EXISTS(SELECT 1 FROM invitation_links WHERE id=? AND owner=?) ON CONFLICT(id) DO UPDATE SET draft_data=excluded.draft_data,published_data=excluded.published_data,version=invitation_links.version+1,updated=excluded.updated WHERE invitation_links.owner=excluded.owner AND invitation_links.version=? RETURNING *').bind(id,user.userId,slug,encoded,published,now,now,user.userId,id,user.userId,version).first<InvitationLinkRow>();
 if(!row)throw new APIError(409,'Could not save: the invitation changed, or your account has 50 invitation links.');
 return json({link:ownerInvitationLink(row)},old?200:201);
});
