import {guarded,json} from '@/lib/api';
import {marketingAuth,marketingTick} from '@/lib/marketing';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>guarded(async()=>{marketingAuth(req);return json(await marketingTick());});
