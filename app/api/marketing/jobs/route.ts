import {env} from 'cloudflare:workers';
import {guarded,json,smallJson} from '@/lib/api';
import {addCampaign,marketingAuth,marketingReadiness} from '@/lib/marketing';
export const dynamic='force-dynamic';
export const GET=(req:Request)=>guarded(async()=>{marketingAuth(req);const rows=await env.DB!.prepare('SELECT id,slug,title,status,instagram_status,published,scheduled_at,error FROM marketing_reels ORDER BY created DESC LIMIT 100').all();return json({...marketingReadiness(),jobs:rows.results});});
export const POST=(req:Request)=>guarded(async()=>{marketingAuth(req);return json(await addCampaign(await smallJson(req)),201);});
