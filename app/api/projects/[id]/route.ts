export const dynamic = 'force-dynamic';
import { env } from 'cloudflare:workers';
import { guarded,identity,json,originCheck,APIError } from '@/lib/api';
export const DELETE=(req:Request,context:{params:Promise<{id:string}>})=>guarded(async()=>{originCheck(req);const u=await identity();const {id}=await context.params;const result=await env.DB!.prepare('DELETE FROM projects WHERE id=? AND owner=?').bind(id,u.userId).run();if(!result.meta.changes)throw new APIError(404,'Invitation not found.');return json({deleted:true});});
