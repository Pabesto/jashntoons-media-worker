const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'),secret='test-only-storage-bridge-secret-32-bytes-long';

function harness({render=false,db,objects=new Map(),user=null}={}) {
  db ||= new DatabaseSync(':memory:');
  if (!db.prepare("SELECT name FROM sqlite_master WHERE name='auth_states'").get()) for(const f of fs.readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort()) db.exec(fs.readFileSync(path.join(root,'drizzle',f),'utf8'));
  function prepare(sql,values=[]) {return {bind(...v){return prepare(sql,v)},async first(column){const row=db.prepare(sql).get(...values);return column===undefined?(row||null):(row?.[column]??null)},async all(){return {success:true,results:db.prepare(sql).all(...values),meta:{}}},async run(){return {success:true,results:[],meta:db.prepare(sql).run(...values)}}};}
  const bucket={
    async head(key){const o=objects.get(key);return o?{key,size:o.bytes.length,etag:'test-etag',httpEtag:'"test-etag"',uploaded:new Date(0),httpMetadata:{contentType:o.mime}}:null},
    async get(key,options){const m=await this.head(key);if(!m)return null;let b=objects.get(key).bytes;if(options?.range)b=b.slice(options.range.offset,options.range.offset+options.range.length);const r=new Response(b);return {...m,body:r.body,arrayBuffer:()=>r.arrayBuffer()}},
    async put(key,stream,options){const bytes=new Uint8Array(await new Response(stream).arrayBuffer());objects.set(key,{bytes,mime:options?.httpMetadata?.contentType});return this.head(key)},
    async delete(key){objects.delete(key)},
  };
  const env={DB:{prepare,batch:async statements=>{db.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.all());db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}},BUCKET:bucket,STORAGE_BRIDGE_SECRET:secret,STORAGE_ORIGIN:'https://storage.test',PUBLIC_SITE_ORIGIN:'https://render.test',RENDER_SITE_ORIGIN:'https://render.test'};
  const runtime={env:{NODE_ENV:'production',...(render?{JASHNTOONS_RUNTIME:'render'}:{})}},cache=new Map();
  let headerValues=new Headers(),dbCalls=0;
  const originalPrepare=env.DB.prepare;env.DB.prepare=(...args)=>{dbCalls++;return originalPrepare(...args)};
  function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);
    const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(compiled,{module,exports:module.exports,require(name){
      if(name==='cloudflare:workers')return {env};
      if(name==='next/headers')return {headers:async()=>headerValues};
      if(name==='next/navigation')return {redirect:()=>{throw Error('Unexpected navigation')}};
      if((name==='@/lib/app-auth' || name==='./app-auth') && user)return {getAppUser:async()=>user};
      if(name.startsWith('@/'))return load(name.slice(2)+'.ts');
      if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(file),name+'.ts')));
      return require(name);
    },process:runtime,console:{error(){}},crypto,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,Response,Request,Headers,File,FormData,AbortSignal,Date,Math,Set,Number,JSON,Error,btoa,atob,
      FixedLengthStream:class extends TransformStream {constructor(size){let read=0;super({transform(chunk,controller){read+=chunk.length;if(read>size)throw Error('Too much data');controller.enqueue(chunk)},flush(){if(read!==size)throw Error('Truncated data')}})}},
    },{filename:file});return module.exports;
  }
  return {db,env,load,objects,runtime,headers(value){headerValues=new Headers(value)},calls:()=>dbCalls};
}
async function client(edge,requestOverride){
  const {createStorageClient}=await import('../services/render-web/storage-client.mjs');
  const routes=edge.load('app/api/hosting/storage/route.ts');
  return createStorageClient({origin:'https://storage.test',secret,request:requestOverride||((url,init)=>{
    const headers=new Headers(init.headers);
    if(init.body && init.method==='PUT')headers.set('content-length',String(typeof init.body==='string'?Buffer.byteLength(init.body):init.body.byteLength));
    return routes[init.method](new Request(url,{...init,headers}));
  })});
}

test('Storage bridge denies missing/wrong credentials and is absent on Render',async()=>{
  const h=harness(),route=h.load('app/api/hosting/storage/route.ts'),before=h.calls();
  for(const authorization of ['', 'Bearer wrong']){const r=await route.POST(new Request('https://storage.test/api/hosting/storage?action=sql',{method:'POST',headers:{authorization},body:'{}'}));assert.equal(r.status,401);}
  assert.equal(h.calls(),before);
  const node=harness({render:true}),r=await node.load('app/api/hosting/storage/route.ts').GET(new Request('https://render.test/api/hosting/storage?action=health',{headers:{authorization:'Bearer '+secret}}));assert.equal(r.status,404);
});
test('Remote SQL preserves atomic credit reservations, wallet balance and owner isolation',async()=>{
  const edge=harness(),remote=await client(edge),node=harness({render:true});node.env.DB=remote.DB;
  edge.db.prepare('INSERT INTO credit_grants(id,owner,credits,created) VALUES(?,?,?,?)').run('grant','alice',1000,Date.now());
  const credits=node.load('lib/credits.ts');assert.equal((await credits.balance('alice')).remaining,1002);assert.equal((await credits.balance('bob')).remaining,2);
  const id=crypto.randomUUID();await Promise.all([credits.reserve('alice',id,'{}','reserved',{cost:5}),credits.reserve('alice',id,'{}','reserved',{cost:5})]);
  assert.equal((await credits.balance('alice')).used,5);assert.equal((await credits.balance('bob')).used,0);
  const wallet=await remote.DB.prepare('SELECT owner,credits FROM credit_grants WHERE owner=?').bind('alice').first();assert.equal(wallet.owner,'alice');assert.equal(wallet.credits,1000);
});
test('Stored media keeps content, metadata and byte ranges across the adapter',async()=>{
  const h=harness(),remote=await client(h),bytes=Uint8Array.from({length:32},(_,i)=>i);
  await remote.BUCKET.put('reels/one',bytes,{httpMetadata:{contentType:'video/mp4'}});
  assert.equal((await remote.BUCKET.head('reels/one')).size,32);
  const whole=await remote.BUCKET.get('reels/one');assert.equal(whole.httpMetadata.contentType,'video/mp4');assert.deepEqual(new Uint8Array(await whole.arrayBuffer()),bytes);
  const part=await remote.BUCKET.get('reels/one',{range:{offset:5,length:7}});assert.deepEqual(new Uint8Array(await part.arrayBuffer()),bytes.slice(5,12));
  await remote.BUCKET.delete('reels/one');assert.equal(await remote.BUCKET.head('reels/one'),null);assert.equal(await remote.BUCKET.get('missing'),null);
});
test('Mutating requests are sent once; errors reveal neither SQL nor secrets',async()=>{
  let calls=0;const remote=await client(harness(),async()=>{calls++;return new Response('provider-secret-and-sql',{status:503})});
  await assert.rejects(remote.DB.prepare('UPDATE credit_grants SET credits=9').run(),e=>{assert.equal(e.message,'Storage request failed (503).');return true});assert.equal(calls,1);
});

test('Render saves reel request streams and optimized uploads through the real storage adapter',async()=>{
  const edge=harness(),node=harness({render:true,user:{userId:'alice'}}),remote=await client(edge);
  node.env.DB=remote.DB;node.env.BUCKET=remote.BUCKET;
  node.env.MEDIA_WORKER_ENABLED='1';node.env.MEDIA_WORKER_SECRET='test-only-media-worker-secret-32-bytes';
  const id=crypto.randomUUID(),bytes=new Uint8Array(128);bytes.set(new TextEncoder().encode('ftyp'),4);
  edge.db.prepare('INSERT INTO reel_jobs(id,owner,status,payload,created,updated) VALUES(?,?,?,?,?,?)').run(id,'alice','reserved','{}',Date.now(),Date.now());
  const context=id=>({params:Promise.resolve({id})});
  const uploaded=await node.load('app/api/reels/[id]/route.ts').PUT(new Request('https://render.test/api/reels/'+id,{method:'PUT',headers:{origin:'https://render.test','content-type':'video/mp4','content-length':String(bytes.length)},body:bytes}),context(id));
  assert.equal(uploaded.status,200);assert.deepEqual(edge.objects.get('reels/'+id).bytes,bytes);
  const service=node.load('lib/media-worker.ts'),job=await service.leaseDelivery();assert.ok(job);
  const optimized=await node.load('app/api/render-worker/[id]/route.ts').PUT(new Request('https://render.test/api/render-worker/'+job.id,{method:'PUT',headers:{authorization:'Bearer '+node.env.MEDIA_WORKER_SECRET,'x-render-lease':job.lease,'content-type':'video/mp4','content-length':String(bytes.length)},body:bytes}),context(job.id));
  assert.equal(optimized.status,200);assert.equal((await service.deliveryFor(id)).status,'ready');
  const saved=await remote.BUCKET.get(service.optimizedKey(job.id,job.lease),{range:{offset:4,length:4}});assert.equal(await saved.text(),'ftyp');
});

test('Node cancels oversized request streams before sending private storage mutations',async()=>{
  let calls=0,cancelled=false;const remote=await client(harness(),async()=>{calls++;throw Error('Unexpected write')});
  const chunk=new Uint8Array(1000000),stream=new ReadableStream({pull(c){c.enqueue(chunk)},cancel(){cancelled=true}});
  await assert.rejects(remote.BUCKET.put('oversized',stream),/exceeds 80 MB/);assert.equal(cancelled,true);assert.equal(calls,0);
});
test('Malformed bridge queries and oversized uploads are rejected before mutation',async()=>{
  const h=harness(),routes=h.load('app/api/hosting/storage/route.ts'),headers={authorization:'Bearer '+secret},before=h.calls();
  for(const body of ['null','{bad',JSON.stringify({mode:'first',statements:[]}),JSON.stringify({mode:'all',statements:[{sql:'SELECT 1',params:[{}]}]})])assert.equal((await routes.POST(new Request('https://storage.test/api/hosting/storage?action=sql',{method:'POST',headers,body}))).status,400);
  const r=await routes.PUT(new Request('https://storage.test/api/hosting/storage?action=put&key=x',{method:'PUT',headers:{...headers,'content-length':'80000001'},body:'bad'}));assert.equal(r.status,413);assert.equal(h.calls(),before);assert.equal(h.objects.size,0);
});
test('Render does not accept spoofed Sites identity headers and checks the canonical write origin',async()=>{
  const h=harness({render:true});h.headers({'oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.test'});
  assert.equal(await h.load('app/chatgpt-auth.ts').getChatGPTUser(),null);
  const api=h.load('lib/api.ts');assert.throws(()=>api.originCheck(new Request('https://render.test/api/projects',{headers:{origin:'https://evil.test'}})),e=>e.status===403);
  assert.doesNotThrow(()=>api.originCheck(new Request('http://localhost:10000/api/projects',{headers:{origin:'https://render.test'}})));
});
test('Existing account sign-in transfers the exact owner with a single-use state-bound code',async()=>{
  const user={userId:'original-owner',email:'owner@example.test',displayName:'Owner'},edge=harness({user}),node=harness({render:true,db:edge.db}),remote=await client(edge);node.env.DB=remote.DB;
  const begun=await node.load('app/api/hosting/signin/route.ts').GET(new Request('https://render.test/api/hosting/signin'));
  const state=new URL(begun.headers.get('location')).searchParams.get('state');assert.ok(state);assert.match(begun.headers.get('set-cookie'),/Secure; SameSite=Lax/);
  const issued=await edge.load('app/api/hosting/signin/route.ts').GET(new Request(begun.headers.get('location'))),target=new URL(issued.headers.get('location'));assert.equal(target.origin,'https://render.test');
  const callback=node.load('app/api/hosting/callback/route.ts');
  const wrong=await callback.GET(new Request(target,{headers:{cookie:'__Host-jashntoons-transfer=wrong'}}));assert.match(wrong.headers.get('location'),/auth_error/);
  const req=()=>new Request(target,{headers:{cookie:'__Host-jashntoons-transfer='+state}}),done=await callback.GET(req());assert.equal(done.headers.get('location'),'/?studio=1');
  const session=done.headers.getSetCookie().find(c=>c.startsWith('__Host-jashntoons-session=')).split(';')[0];node.headers({cookie:session});
  const authenticated=await node.load('lib/app-auth.ts').getAppUser();assert.equal(authenticated.userId,user.userId);assert.equal(authenticated.provider,'chatgpt');
  assert.match((await callback.GET(req())).headers.get('location'),/auth_error/);assert.equal(edge.db.prepare('SELECT COUNT(*) AS n FROM auth_sessions').get().n,1);
});
