export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {APIError,boundedBytes,guarded,json} from '@/lib/api';
import {balance} from '@/lib/credits';

// This operation cannot choose a recipient or amount from an HTTP request.
// The site owner configures one fixed, expiring grant in server-only settings.
// Its ledger ID makes retries and concurrent calls safe.
const configuration=z.object({id:z.string().uuid(),owner:z.string().min(1).max(200),credits:z.number().int().min(1).max(10000),tokenHash:z.string().regex(/^[a-f0-9]{64}$/),expires:z.number().int().positive()}).strict();
export const POST=(req:Request)=>guarded(async()=>{
 let raw:unknown;try{raw=JSON.parse(env.CREDIT_GRANT_ONCE??'null');}catch{throw new APIError(404,'Not found.');}
 const parsed=configuration.safeParse(raw),token=req.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
 if(!parsed.success||!token||Date.now()>parsed.data.expires)throw new APIError(404,'Not found.');
 const grant=parsed.data,bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const digest=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 let mismatch=0;for(let i=0;i<64;i++)mismatch|=digest.charCodeAt(i)^grant.tokenHash.charCodeAt(i);
 if(mismatch)throw new APIError(404,'Not found.');
 // Cloudflare supplies an empty ReadableStream even for bodyless POSTs.
 if(req.body&&(await boundedBytes(req,1)).length)throw new APIError(400,'This operation does not accept request parameters.');
 const account=await env.DB!.prepare('SELECT owner FROM auth_accounts WHERE owner=? UNION ALL SELECT owner FROM auth_sessions WHERE owner=? UNION ALL SELECT owner FROM projects WHERE owner=? LIMIT 1').bind(grant.owner,grant.owner,grant.owner).first();
 if(!account)throw new APIError(404,'The configured account does not exist.');
 const existing=await env.DB!.prepare('SELECT owner,credits FROM credit_grants WHERE id=?').bind(grant.id).first<{owner:string;credits:number}>();
 if(existing&&(existing.owner!==grant.owner||existing.credits!==grant.credits))throw new APIError(409,'This grant ID already belongs to a different ledger entry.');
 const inserted=await env.DB!.prepare('INSERT INTO credit_grants(id,owner,credits,created) VALUES(?,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id').bind(grant.id,grant.owner,grant.credits,Date.now()).first();
 return json({id:grant.id,owner:grant.owner,credits:grant.credits,applied:!!inserted,...await balance(grant.owner)});
});
