export const dynamic='force-dynamic';
import {guarded,identity,originCheck,json} from '@/lib/api';
import {creationJob,advanceCreation} from '@/lib/creation-jobs';
export const POST=(req:Request,{params}:{params:Promise<{id:string}>})=>guarded(async()=>{originCheck(req);const u=await identity();return json(await advanceCreation(await creationJob(u.userId,(await params).id)));});
