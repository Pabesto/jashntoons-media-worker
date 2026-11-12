import {env} from 'cloudflare:workers';
import {APIError, boundedBytes, guarded, json} from '@/lib/api';

export const dynamic = 'force-dynamic';
const settings = () => env as unknown as Record<string, string | undefined>;

function authenticate(req:Request) {
  const secret = settings().STORAGE_BRIDGE_SECRET;
  if ((typeof process !== 'undefined' && process.env.JASHNTOONS_RUNTIME === 'render') || !secret || secret.length < 32) throw new APIError(404, 'Not found.');
  const expected = new TextEncoder().encode('Bearer '+secret), actual = new TextEncoder().encode(req.headers.get('authorization') || '');
  let difference = expected.length ^ actual.length;
  for (let i=0; i<expected.length; i++) difference |= expected[i] ^ (actual[i] || 0);
  if (difference) throw new APIError(401, 'Unauthorized.');
}
function objectKey(url:URL) {
  const key = url.searchParams.get('key');
  if (!key || key.length>1024 || /[\u0000-\u001f]/.test(key)) throw new APIError(400, 'Invalid object.');
  return key;
}
function objectHeaders(object:R2Object) {
  const metadata={key:object.key,size:object.size,etag:object.etag,httpEtag:object.httpEtag,uploaded:object.uploaded,httpMetadata:object.httpMetadata};
  const bytes = new TextEncoder().encode(JSON.stringify(metadata));
  return {'Cache-Control':'private, no-store', 'x-jashntoons-object':btoa(String.fromCharCode(...bytes)),'Content-Type':object.httpMetadata?.contentType || 'application/octet-stream'};
}
async function handle(req:Request) {
  authenticate(req);
  const url=new URL(req.url), action=url.searchParams.get('action');
  if (action==='health' && req.method==='GET') {
    await env.DB!.prepare('SELECT 1 AS ok').first();
    if (!env.BUCKET) throw new APIError(503,'Storage unavailable.');
    return json({ok:true});
  }
  if (action==='sql' && req.method==='POST') {
    const raw=await boundedBytes(req,256000);
    let input:{statements:{sql:string;params:unknown[]}[];mode:string;column?:string};
    try { input=JSON.parse(new TextDecoder().decode(raw)); } catch { throw new APIError(400,'Invalid request.'); }
    if (!input || !['first','all','run','batch'].includes(input.mode) || !Array.isArray(input.statements) || !input.statements.length || input.statements.length>32 || (input.mode!=='batch' && input.statements.length!==1) || (input.column!==undefined && (typeof input.column!=='string' || input.column.length>200))) throw new APIError(400,'Invalid query.');
    const statements=input.statements.map(s=>{
      if (!s || typeof s.sql!=='string' || !s.sql || s.sql.length>50000 || !Array.isArray(s.params) || s.params.length>100 || s.params.some(p=>p!==null && typeof p!=='string' && (typeof p!=='number' || !Number.isFinite(p)))) throw new APIError(400,'Invalid query.');
      return env.DB!.prepare(s.sql).bind(...s.params);
    });
    if (input.mode==='batch') return json(await env.DB!.batch(statements));
    if (input.mode==='first') return json(await (input.column===undefined?statements[0].first():statements[0].first(input.column)));
    return json(await statements[0][input.mode as 'all'|'run']());
  }
  const key=objectKey(url);
  if (action==='head' && req.method==='HEAD') {
    const object=await env.BUCKET!.head(key);
    return new Response(null,{status:object?200:404,headers:object?objectHeaders(object):{'Cache-Control':'private, no-store'}});
  }
  if (action==='get' && req.method==='GET') {
    let range:{offset:number;length:number}|undefined;
    if (url.searchParams.has('offset') || url.searchParams.has('length')) {
      const offset=Number(url.searchParams.get('offset')),length=Number(url.searchParams.get('length'));
      if (!Number.isSafeInteger(offset) || offset<0 || !Number.isSafeInteger(length) || length<1 || length>80000000) throw new APIError(400,'Invalid range.');
      range={offset,length};
    }
    const object=await env.BUCKET!.get(key,range?{range}:undefined);
    if (!object) return json({error:'Not found.'},404);
    return new Response(object.body,{headers:objectHeaders(object)});
  }
  if (action==='put' && req.method==='PUT') {
    const length=Number(req.headers.get('content-length'));
    if (!req.body || !Number.isSafeInteger(length) || length<1 || length>80000000) throw new APIError(413,'Invalid upload size.');
    // Stream through a fixed-size pipe instead of buffering two copies in an isolate.
    const stream=new FixedLengthStream(length);
    const [object]=await Promise.all([
      env.BUCKET!.put(key,stream.readable,{httpMetadata:{contentType:req.headers.get('content-type') || 'application/octet-stream'}}),
      req.body.pipeTo(stream.writable),
    ]);
    return json({key:object.key,size:object.size});
  }
  if (action==='delete' && req.method==='DELETE') { await env.BUCKET!.delete(key); return json({ok:true}); }
  throw new APIError(405,'Method not allowed.');
}
export const GET=(req:Request)=>guarded(()=>handle(req));
export const POST=GET;
export const HEAD=GET;
export const PUT=GET;
export const DELETE=GET;
