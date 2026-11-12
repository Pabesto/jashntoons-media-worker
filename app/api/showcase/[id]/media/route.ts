import {env} from 'cloudflare:workers';
import {APIError,guarded} from '@/lib/api';
import {privateFile} from '@/lib/private-file';
export const dynamic='force-dynamic';
export const GET=(req:Request,{params}:{params:Promise<{id:string}>})=>guarded(async()=>{const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))throw new APIError(404,'Reel not found.');const row=await env.DB!.prepare('SELECT id FROM marketing_reels WHERE id=? AND published=1').bind(id).first();if(!row)throw new APIError(404,'Reel not found.');const poster=new URL(req.url).searchParams.get('kind')==='poster',key='marketing/'+id+(poster?'/poster.jpg':'/video.mp4'),object=poster?await env.BUCKET!.head(key):null;return privateFile(req,key,poster?(object?.httpMetadata?.contentType||'image/jpeg'):'video/mp4');});
export async function HEAD(req:Request,ctx:{params:Promise<{id:string}>}){const r=await GET(req,ctx);await r.body?.cancel();return new Response(null,{status:r.status,headers:r.headers});}
