import {guarded,json} from '@/lib/api';
import {workerAuth} from '@/lib/media-worker';
import {leaseAssembly,readAssemblyPayload} from '@/lib/reference-assembly';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>guarded(async()=>{workerAuth(req);const j=await leaseAssembly(),p=j?readAssemblyPayload(j.payload):null;return json({job:j&&p?{id:j.id,lease:j.provider_task,parts:p.parts.length,seconds:p.seconds}:null});});
