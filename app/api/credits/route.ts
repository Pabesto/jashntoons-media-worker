export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {guarded,identity,json} from '@/lib/api';
import {balance} from '@/lib/credits';
export const GET=()=>guarded(async()=>{const u=await identity();return json({...await balance(u.userId),checkoutReady:false,generationReady:!!env.RUNWAY_API_KEY});});
