import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {APIError,boundedBytes} from './api';
import {siteOrigin} from './seo';
import {marketingCampaigns} from './marketing-campaigns';
import {writeMarketingCopy} from './marketing-writer';
const settings=()=>env as unknown as Record<string,string|undefined>;
export type MarketingRow={id:string;slug:string;title:string;description:string;caption:string;script:string;scheduled_at:number;created:number;updated:number;status:string;video_id:string|null;duration:number|null;published:number;published_at:number|null;instagram_container:string|null;instagram_id:string|null;instagram_url:string|null;instagram_status:string;lease:string|null;lease_until:number;error:string|null};
const required=['ANTHROPIC_API_KEY','CLAUDE_MARKETING_MODEL','HEYGEN_API_KEY','HEYGEN_AVATAR_ID','HEYGEN_VOICE_ID','INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_USER_ID','INSTAGRAM_GRAPH_VERSION'] as const;
export function marketingReadiness(){const e=settings();return {enabled:e.MARKETING_ENABLED==='1',missing:required.filter(k=>!e[k]),dailyTime:'19:00 Asia/Kolkata',dailyLimit:1};}
export function marketingAuth(req:Request){const secret=settings().MARKETING_AUTOMATION_SECRET;if(!secret||secret.length<32)throw new APIError(404,'Not found.');const expected=new TextEncoder().encode('Bearer '+secret),actual=new TextEncoder().encode(req.headers.get('authorization')||'');let diff=expected.length^actual.length;for(let i=0;i<expected.length;i++)diff|=expected[i]^(actual[i]||0);if(diff)throw new APIError(401,'Unauthorized.');}
export const campaignSchema=z.object({id:z.string().uuid(),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),title:z.string().min(3).max(100),description:z.string().min(15).max(300),caption:z.string().min(10).max(2000),script:z.string().min(15).max(850),scheduledAt:z.number().int().positive()}).strict();
export async function addCampaign(input:unknown){const p=campaignSchema.safeParse(input);if(!p.success)throw new APIError(400,'Invalid campaign.');const d=p.data,now=Date.now();await env.DB!.prepare('INSERT INTO marketing_reels(id,slug,title,description,caption,script,scheduled_at,created,updated) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING').bind(d.id,d.slug,d.title,d.description,d.caption,d.script,d.scheduledAt,now,now).run();const row=await env.DB!.prepare('SELECT * FROM marketing_reels WHERE id=?').bind(d.id).first<MarketingRow>();if(!row||row.slug!==d.slug||row.script!==d.script||row.caption!==d.caption||row.title!==d.title||row.description!==d.description||row.scheduled_at!==d.scheduledAt)throw new APIError(409,'Campaign already exists with different content.');return {id:row.id,status:row.status};}
async function ensureDailyCampaign(){if(settings().MARKETING_DAILY_CAMPAIGN!=='1')return;const now=Date.now(),india=new Date(now+330*60000),date=india.toISOString().slice(0,10),scheduledAt=Date.parse(date+'T19:00:00+05:30');if(now<scheduledAt)return;const slug='studio-story-'+date;if(await env.DB!.prepare('SELECT id FROM marketing_reels WHERE slug=?').bind(slug).first())return;const item=marketingCampaigns[Math.floor(scheduledAt/86400000)%marketingCampaigns.length];try{await addCampaign({id:crypto.randomUUID(),slug,...item,scheduledAt});}catch(e){if(!(e instanceof APIError&&e.status===409))throw e;}}
async function update(row:MarketingRow,fields:Record<string,string|number|null>){const keys=Object.keys(fields);if(!keys.length)return;await env.DB!.prepare(`UPDATE marketing_reels SET ${keys.map(k=>k+'=?').join(',')},updated=? WHERE id=? AND lease=?`).bind(...keys.map(k=>fields[k]),Date.now(),row.id,row.lease).run();Object.assign(row,fields);}
async function heygen(path:string,body?:unknown,id?:string){const r=await fetch('https://api.heygen.com/v3/'+path,{method:body?'POST':'GET',headers:{'X-Api-Key':settings().HEYGEN_API_KEY!,'Content-Type':'application/json',...(id?{'Idempotency-Key':id}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(45000)});if(!r.ok)throw new APIError(502,'HeyGen returned HTTP '+r.status+'. Check the provider account.');const j=await r.json() as {data?:Record<string,unknown>};if(!j.data)throw new APIError(502,'HeyGen returned an invalid response.');return j.data;}
export function safeHeygenUrl(value:unknown){if(typeof value!=='string')throw new APIError(502,'HeyGen media is missing.');const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!['heygen.ai','heygen.com'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw new APIError(502,'HeyGen media host is not approved.');return u.href;}
async function download(value:unknown,kind:'video'|'poster'){const r=await fetch(safeHeygenUrl(value),{redirect:'error',signal:AbortSignal.timeout(60000)});if(!r.ok)throw new APIError(502,'Could not download completed HeyGen media.');const mime=r.headers.get('content-type')?.split(';')[0];if(kind==='video'?mime!=='video/mp4':!['image/jpeg','image/png','image/webp'].includes(mime||''))throw new APIError(502,'Unexpected HeyGen media format.');const bytes=await boundedBytes(r,kind==='video'?75000000:6000000);return {bytes,mime:mime!};}
async function instagram(path:string,body?:Record<string,string>){const e=settings();if(!/^v\d+\.\d+$/.test(e.INSTAGRAM_GRAPH_VERSION||'')||!/^\d+$/.test(e.INSTAGRAM_USER_ID||''))throw new APIError(503,'Instagram account configuration is incomplete.');const r=await fetch('https://graph.instagram.com/'+e.INSTAGRAM_GRAPH_VERSION+'/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+e.INSTAGRAM_ACCESS_TOKEN,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},...(body?{body:new URLSearchParams(body)}:{}),redirect:'error',signal:AbortSignal.timeout(45000)});if(!r.ok)throw new APIError(502,'Instagram returned HTTP '+r.status+'. Check account access and publishing permissions.');return r.json() as Promise<Record<string,unknown>>;}
async function publishInstagram(row:MarketingRow){
 if(row.instagram_status==='pending'){
  await update(row,{instagram_status:'creating'});
  const r=await instagram(settings().INSTAGRAM_USER_ID!+'/media',{media_type:'REELS',video_url:siteOrigin+'/api/showcase/'+row.id+'/media',caption:row.caption,share_to_feed:'true'});if(typeof r.id!=='string')throw new APIError(502,'Instagram did not return a media container.');
  await update(row,{instagram_container:r.id,instagram_status:'processing'});return;
 }
 if(row.instagram_status==='processing'){
  const r=await instagram(encodeURIComponent(row.instagram_container!)+'?fields=status_code');if(r.status_code==='ERROR'||r.status_code==='EXPIRED'){await update(row,{instagram_status:'failed',error:'Instagram processing failed. Review the container before retrying.'});return;}if(r.status_code!=='FINISHED')return;
  // Persist before an irreversible call. An ambiguous result requires reconciliation, never an automatic second publish.
  await update(row,{instagram_status:'publishing'});const result=await instagram(settings().INSTAGRAM_USER_ID!+'/media_publish',{creation_id:row.instagram_container!});if(typeof result.id!=='string')throw new APIError(502,'Instagram publish result needs reconciliation.');await update(row,{instagram_id:result.id,instagram_status:'published'});
 }
 if(row.instagram_status==='published'&&!row.instagram_url&&row.instagram_id){const r=await instagram(encodeURIComponent(row.instagram_id)+'?fields=permalink');if(typeof r.permalink==='string'&&/^https:\/\/(www\.)?instagram\.com\//.test(r.permalink))await update(row,{instagram_url:r.permalink});}
}
export async function marketingTick(){
 const ready=marketingReadiness();if(!ready.enabled||ready.missing.length)return {status:'not-configured',...ready};
 await ensureDailyCampaign();const now=Date.now(),lease=crypto.randomUUID();
 const row=await env.DB!.prepare("UPDATE marketing_reels SET lease=?,lease_until=? WHERE id=(SELECT id FROM marketing_reels WHERE scheduled_at<=? AND lease_until<? AND (status IN ('queued','scripted','rendering') OR (status='ready' AND instagram_status IN ('pending','processing','published') AND instagram_url IS NULL)) ORDER BY CASE WHEN status='queued' THEN 1 ELSE 0 END,scheduled_at ASC LIMIT 1) RETURNING *").bind(lease,now+300000,now,now).first<MarketingRow>();
 if(!row)return {status:'idle'};
 try{
  if(row.status==='queued'){
   // One paid generation at most per India calendar day. A distinct job never retries an uncertain submission.
   const indiaDate=new Date(now+330*60000).toISOString().slice(0,10),start=Date.parse(indiaDate+'T00:00:00+05:30');
   const claim=await env.DB!.prepare("UPDATE marketing_reels SET status='writing',started_at=? WHERE id=? AND lease=? AND NOT EXISTS(SELECT 1 FROM marketing_reels WHERE id<>? AND started_at>=?) RETURNING id").bind(now,row.id,lease,row.id,start).first();if(!claim)return {id:row.id,status:'daily-limit'};
   row.status='writing';const copy=await writeMarketingCopy(row);await update(row,{...copy,status:'scripted',error:null});
  }else if(row.status==='scripted'){
   await update(row,{status:'submitting'});const result=await heygen('videos',{type:'avatar',avatar_id:settings().HEYGEN_AVATAR_ID,voice_id:settings().HEYGEN_VOICE_ID,script:row.script,title:row.title,resolution:'1080p',aspect_ratio:'9:16',caption:{file_format:'srt',style:'default'}},row.id);
   if(typeof result.video_id!=='string')throw new APIError(502,'HeyGen submission needs reconciliation.');await update(row,{status:'rendering',video_id:result.video_id,error:null});
  }else if(row.status==='rendering'){
   const result=await heygen('videos/'+encodeURIComponent(row.video_id!));if(result.status==='failed'){await update(row,{status:'failed',error:'HeyGen generation failed. Review the provider result.'});}
   else if(result.status==='completed'){
    if(typeof result.duration!=='number'||result.duration<=0||result.duration>90)throw new APIError(502,'Reel duration must be between 1 and 90 seconds.');
    const video=await download(result.captioned_video_url||result.video_url,'video'),poster=await download(result.thumbnail_url,'poster');
    await env.BUCKET!.put('marketing/'+row.id+'/video.mp4',video.bytes,{httpMetadata:{contentType:'video/mp4'}});await env.BUCKET!.put('marketing/'+row.id+'/poster.jpg',poster.bytes,{httpMetadata:{contentType:poster.mime}});
    await update(row,{status:'ready',published:1,published_at:now,duration:result.duration,error:null});
   }
  }else await publishInstagram(row);
  return {id:row.id,status:row.status,instagramStatus:row.instagram_status};
 }catch(e){await update(row,{error:e instanceof APIError?e.message:'Publishing request failed. Inspect job status before retrying.'});throw e;}
 finally{await env.DB!.prepare('UPDATE marketing_reels SET lease=NULL,lease_until=0 WHERE id=? AND lease=?').bind(row.id,lease).run();}
}
