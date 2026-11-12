export const dynamic='force-dynamic';
import {guarded,json} from '@/lib/api';
import {workerAuth,leaseDelivery} from '@/lib/media-worker';
export const POST=(req:Request)=>guarded(async()=>{workerAuth(req);const job=await leaseDelivery();return json({job:job?{id:job.id,lease:job.lease}:null});});
