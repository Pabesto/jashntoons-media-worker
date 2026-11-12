const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
function harness(){
 const sqlite=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync(path.join(root,'drizzle',f),'utf8'));
 const objects=new Map();let user='alice';
 const DB={prepare(sql){return {bind(...args){return {first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}})};}};}};
 const env={MEDIA_WORKER_ENABLED:"1",MEDIA_WORKER_SECRET:"test-worker-secret-which-is-at-least-32-bytes",DB,BUCKET:{put:async(key,body)=>{const bytes=new Uint8Array(await new Response(body).arrayBuffer());objects.set(key,bytes);return {size:bytes.length}},delete:async key=>objects.delete(key),head:async key=>objects.has(key)?{size:objects.get(key).length}:null,get:async(key,options)=>{const b=objects.get(key);if(!b)return null;const data=options?.range?b.slice(options.range.offset,options.range.offset+options.range.length):b;return {body:data,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};}}};
 const cache=new Map();function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(compiled,{module,exports:module.exports,require(name){if(name==='cloudflare:workers')return {env};if(name==='./app-auth'||name==='@/lib/app-auth')return {getAppUser:async()=>user?{userId:user,email:user+'@example.test'}:null};if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(file),name+'.ts')));return require(name);},console,crypto,URL,URLSearchParams,TextEncoder,TextDecoder,Uint8Array,Response,Request,Headers,File,FormData,AbortSignal,Date,Math,Set,Number,JSON,Error,btoa,atob,setTimeout,clearTimeout},{filename:file});return module.exports;}
 function request(url,body,method='POST'){return new Request('https://jashntoons.test'+url,{method,headers:{Origin:'https://jashntoons.test','Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});}
 function reel(owner='alice',status='completed'){const id=crypto.randomUUID(),photo=crypto.randomUUID(),data={templateId:'studio-wedding-01',names:'Our celebration',photos:[photo]};sqlite.prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').run(photo,owner,'image/jpeg',4,Date.now());objects.set(photo,new Uint8Array([1,2,3,4]));sqlite.prepare('INSERT INTO reel_jobs(id,owner,status,payload,created,updated,mime) VALUES(?,?,?,?,?,?,?)').run(id,owner,status,JSON.stringify(data),Date.now(),Date.now(),'video/mp4');objects.set('reels/'+id,new Uint8Array([10,20,30,40,50,60]));return {reelId:id,beforeId:photo};}
 const context=id=>({params:Promise.resolve({id})});
 return {env,sqlite,objects,load,request,reel,context,setUser:v=>user=v};
}

function workerRequest(h,path,method='POST',lease,bytes){return new Request('https://jashntoons.test'+path,{method,headers:{Authorization:'Bearer '+h.env.MEDIA_WORKER_SECRET,...(lease?{'x-render-lease':lease}:{}),...(bytes?{'Content-Type':'video/mp4','Content-Length':String(bytes.byteLength)}:{})},...(bytes?{body:bytes}:{})})}
function mp4(){const a=new Uint8Array(128);a.set(new TextEncoder().encode('ftyp'),4);return a}
test('Optimization is owned, authenticated, idempotent, disabled until configured, and costs no credits',async()=>{
 const h=harness(),a=h.reel(),b=h.reel('bob'),route=h.load('app/api/reels/[id]/optimize/route.ts'),api=h.load('app/api/render-worker/lease/route.ts');
 const queue=id=>route.POST(h.request('/optimize',undefined),h.context(id));h.setUser(null);assert.equal((await queue(a.reelId)).status,401);h.setUser('alice');assert.equal((await queue(b.reelId)).status,404);
 h.env.MEDIA_WORKER_ENABLED='0';assert.equal((await queue(a.reelId)).status,503);assert.equal((await api.POST(workerRequest(h,'/lease'))).status,503);h.env.MEDIA_WORKER_ENABLED='1';
 assert.equal((await api.POST(new Request('https://jashntoons.test/lease',{method:'POST'}))).status,401);
 await Promise.all([queue(a.reelId),queue(a.reelId)]);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM reel_delivery').get().n,1);assert.equal(h.sqlite.prepare('SELECT COUNT(*) n FROM credit_grants').get().n,0);
 const one=await (await api.POST(workerRequest(h,'/lease'))).json();assert.ok(one.job.id);assert.equal((await (await api.POST(workerRequest(h,'/lease'))).json()).job,null);assert.equal(JSON.stringify(one).includes('alice'),false);
});
test('Expired workers cannot replace newer optimized output; downloads retain private range access and original fallback',async()=>{
 const h=harness(),r=h.reel(),service=h.load('lib/media-worker.ts'),worker=h.load('app/api/render-worker/[id]/route.ts'),reel=h.load('app/api/reels/[id]/route.ts');await service.enqueueDelivery(r.reelId,'alice');const first=await service.leaseDelivery();
 h.sqlite.prepare('UPDATE reel_delivery SET lease_until=0 WHERE id=?').run(first.id);const second=await service.leaseDelivery();assert.notEqual(first.lease,second.lease);
 assert.equal((await worker.PUT(workerRequest(h,'/worker','PUT',first.lease,mp4()),h.context(first.id))).status,409);
 assert.equal((await worker.PUT(workerRequest(h,'/worker','PUT',second.lease,mp4()),h.context(second.id))).status,200);
 let response=await reel.GET(new Request('https://jashntoons.test/reel?download=1',{headers:{Range:'bytes=4-7'}}),h.context(r.reelId));assert.equal(response.status,206);assert.equal(await response.text(),'ftyp');assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(response.headers.get('Content-Disposition'),/attachment/);
 const original=await reel.GET(new Request('https://jashntoons.test/reel?version=original',{headers:{Range:'bytes=0-2'}}),h.context(r.reelId));assert.equal(original.status,206);assert.deepEqual([...new Uint8Array(await original.arrayBuffer())],[10,20,30]);
 h.setUser('bob');assert.equal((await reel.GET(new Request('https://jashntoons.test/reel'),h.context(r.reelId))).status,404);h.setUser('alice');h.objects.delete(service.optimizedKey(second.id,second.lease));response=await reel.GET(new Request('https://jashntoons.test/reel'),h.context(r.reelId));assert.equal((await response.arrayBuffer()).byteLength,6);
});
test('Lease expiration during upload deletes only the stale artifact and preserves the winning output',async()=>{
 const h=harness(),r=h.reel(),service=h.load('lib/media-worker.ts'),worker=h.load('app/api/render-worker/[id]/route.ts');await service.enqueueDelivery(r.reelId,'alice');const old=await service.leaseDelivery();let winner;
 h.env.BUCKET.put=async(key,body)=>{const bytes=new Uint8Array(await new Response(body).arrayBuffer());h.objects.set(key,bytes);h.sqlite.prepare('UPDATE reel_delivery SET lease_until=0 WHERE id=?').run(old.id);winner=await service.leaseDelivery();h.objects.set(service.optimizedKey(winner.id,winner.lease),mp4());h.sqlite.prepare("UPDATE reel_delivery SET status='ready' WHERE id=?").run(old.id);return {size:bytes.length}};
 assert.equal((await worker.PUT(workerRequest(h,'/worker','PUT',old.lease,mp4()),h.context(old.id))).status,409);assert.equal(h.objects.has(service.optimizedKey(old.id,old.lease)),false);assert.equal(h.objects.has(service.optimizedKey(winner.id,winner.lease)),true);
});

test('Worker upload streams MP4 directly and rejects invalid, oversized, or mismatched payloads',async()=>{
 const h=harness(),r=h.reel(),service=h.load('lib/media-worker.ts'),worker=h.load('app/api/render-worker/[id]/route.ts');await service.enqueueDelivery(r.reelId,'alice');const j=await service.leaseDelivery(),key=service.optimizedKey(j.id,j.lease);
 const send=(body,extra={})=>worker.PUT(new Request('https://jashntoons.test/worker',{method:'PUT',headers:{Authorization:'Bearer '+h.env.MEDIA_WORKER_SECRET,'x-render-lease':j.lease,'Content-Type':'video/mp4','Content-Length':String(body.length),...extra},body}),h.context(j.id));
 assert.equal((await send(mp4(),{'Content-Length':'80000001'})).status,413);assert.equal(h.objects.has(key),false);
 assert.equal((await send(new Uint8Array(128))).status,400);assert.equal(h.objects.has(key),false);
 assert.equal((await send(mp4(),{'Content-Length':'129'})).status,400);assert.equal(h.objects.has(key),false);
 const put=h.env.BUCKET.put;let streamed=false;h.env.BUCKET.put=async(key,body)=>{streamed=typeof body.getReader==='function';return put(key,body)};
 assert.equal((await send(mp4())).status,200);assert.equal(streamed,true);assert.equal(h.objects.get(key).length,128);
});
