export const dynamic='force-dynamic';
import {guarded,identity,originCheck,json,APIError,smallJson} from '@/lib/api';
import {creationInviteSchema} from '@/lib/validation';
import {quoteCreation,startCreation,creationRecovery} from '@/lib/creation-jobs';
import {z} from 'zod';
export const GET=(req:Request)=>guarded(async()=>{const u=await identity(),id=z.string().uuid().safeParse(new URL(req.url).searchParams.get('projectId'));if(!id.success)throw new APIError(400,'Choose a saved invitation.');return json({job:await creationRecovery(u.userId,id.data)});});
export const POST=(req:Request)=>guarded(async()=>{originCheck(req);const u=await identity(),parsed=z.object({action:z.enum(['quote','create']),projectId:z.string().uuid(),data:creationInviteSchema,approval:z.object({key:z.string().max(100),credits:z.number().int().min(0).max(100)}).optional()}).safeParse(await smallJson(req));if(!parsed.success)throw new APIError(400,'Check your invitation details and attachments.');const p=parsed.data;if(p.action==='quote'){await creationRecovery(u.userId,p.projectId);return json(await quoteCreation(u.userId,p.data));}if(!p.approval)throw new APIError(400,'Review the total credits first.');return json(await startCreation(u.userId,p.projectId,p.data,p.approval));});
