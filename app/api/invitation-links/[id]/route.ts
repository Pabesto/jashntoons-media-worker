import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {APIError,guarded,identity,json,originCheck,smallJson} from '@/lib/api';
import {ownerInvitationLink,type InvitationLinkRow} from '@/lib/invitation-links';
export const dynamic='force-dynamic';
export const PATCH=(req:Request,ctx:{params:Promise<{id:string}>})=>guarded(async()=>{
 originCheck(req);const user=await identity(),{id}=await ctx.params,input=z.object({action:z.literal('hide'),version:z.number().int().min(1)}).strict().safeParse(await smallJson(req));
 if(!z.string().uuid().safeParse(id).success||!input.success)throw new APIError(400,'Invalid invitation.');
 const old=await env.DB!.prepare('SELECT * FROM invitation_links WHERE id=? AND owner=?').bind(id,user.userId).first<InvitationLinkRow>();if(!old)throw new APIError(404,'Invitation not found.');
 const row=await env.DB!.prepare('UPDATE invitation_links SET published_data=NULL,version=version+1,updated=? WHERE id=? AND owner=? AND version=? RETURNING *').bind(Date.now(),id,user.userId,input.data.version).first<InvitationLinkRow>();
 if(!row)throw new APIError(409,'This invitation changed in another tab. Reopen it before hiding.');return json({link:ownerInvitationLink(row)});
});
