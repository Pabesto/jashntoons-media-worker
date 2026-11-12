const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'),plain=value=>JSON.parse(JSON.stringify(value));

test('Authenticated creation library includes saved characters, source uploads and existing voices without private job data',async()=>{
 const h=harness(),source=h.media(),other=h.media('bob'),art=h.media(),data=h.invite([source]);
 const parent=h.job({kind:'directed-reel',data,steps:[],failure:{message:'private failure'}},'failed');
 const avatar=h.job({kind:'director-asset',type:'art',parentJobId:parent,privatePrompt:'PRIVATE_PROMPT'},'ready',art);
 const voice=h.job({kind:'voice-profile',remoteVoice:'PRIVATE_VOICE',sampleId:source}),directorVoice=h.job({kind:'director-asset',type:'voice'});
 h.job({kind:'voice-profile'},'ready',null,'bob');h.job({kind:'voice-profile'},'failed');h.media('alice','audio/wav');h.media('alice','video/mp4');h.media('alice','image/svg+xml');
 const route=h.load('app/api/create/library/route.ts');h.user('');const denied=await route.GET();assert.equal(denied.status,401);
 h.user('alice');const before=h.changes(),response=await route.GET(),body=await response.json();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.deepEqual(body.avatars,[{id:avatar,artId:art,sourcePhotos:[source],created:h.get(avatar).created,label:'Our celebration',styleId:'watercolor'}]);
 assert.deepEqual(body.photos.map(p=>p.id),[source]);assert.deepEqual(body.voices.map(v=>v.id),[directorVoice,voice]);assert.ok(!JSON.stringify(body).includes(other));
 assert.doesNotMatch(JSON.stringify(body),/PRIVATE_|provider_task|credit_cost|private failure|"owner"|"payload"/);assert.equal(h.changes(),before);
});

test('Resolver returns the original completed art job after its parent film fails, before parent artId is persisted',async()=>{
 const h=harness(),photos=[h.media(),h.media()],data=h.invite(photos,'cinematic-real'),parent=h.job({kind:'directed-reel',data,steps:[],index:0},'failed'),art=h.media();
 const id=h.job({kind:'director-asset',type:'art',parentJobId:parent},'ready',art),found=await h.library().resolveSavedCreationAvatar('alice',id);
 assert.equal(found.job.id,id);assert.equal(found.job.owner,'alice');assert.equal(found.job.media_id,art);assert.equal(found.job.provider_task,'PRIVATE_PROVIDER_TASK');assert.equal(found.avatar.styleId,'cinematic-real');assert.deepEqual(Array.from(found.avatar.sourcePhotos),photos);
 assert.equal((await h.library().listCreationLibrary('alice')).avatars[0].id,id);
 await assert.rejects(h.library().resolveSavedCreationAvatar('bob',id),e=>e.status===404);
 await assert.rejects(h.library().resolveSavedCreationAvatar('alice',art),e=>e.status===404);
 await assert.rejects(h.library().resolveSavedCreationAvatar('alice',parent),e=>e.status===404);
});

test('Legacy invite, ownInvite and root Invite generations are available with their owned sources',async()=>{
 const h=harness(),source=h.media(),data=h.invite([source]),ids=[];
 for(const p of [{invite:data},{ownInvite:data},data])ids.push(h.job(p,'completed',h.media()));
 const legacy=h.job({invite:{...data,creation:undefined,aiMoment:{styleId:'cinematic-real'}}},'ready',h.media());
 for(const id of ids){const out=await h.library().resolveSavedCreationAvatar('alice',id);assert.equal(out.avatar.id,id);assert.equal(out.avatar.styleId,'watercolor');assert.deepEqual(Array.from(out.avatar.sourcePhotos),[source]);}
 assert.equal((await h.library().resolveSavedCreationAvatar('alice',legacy)).avatar.styleId,'cinematic-real');assert.equal((await h.library().listCreationLibrary('alice')).avatars.length,4);
});

test('Pending, failed, non-art and cross-owner records cannot be selected as a saved avatar',async()=>{
 const h=harness(),source=h.media(),data=h.invite([source]),invalid=[];
 for(const status of ['pending','reserved','generating','processing','failed','uploading'])invalid.push(h.job({invite:data},status,h.media()));
 for(const kind of ['voice-profile','talking-reel','directed-reel'])invalid.push(h.job({kind,invite:data,data},'ready',h.media()));
 for(const type of ['voice','speech','film'])invalid.push(h.job({kind:'director-asset',type,invite:data},'ready',h.media()));
 invalid.push(h.job({invite:data},'ready',h.media('bob'),'bob'));
 for(const id of invalid)await assert.rejects(h.library().resolveSavedCreationAvatar('alice',id),e=>e.status===404);
 assert.deepEqual(plain((await h.library().listCreationLibrary('alice')).avatars),[]);
});

test('Actual media ownership and MIME are verified for art, not the job mime field',async()=>{
 const h=harness(),source=h.media(),data=h.invite([source]);
 for(const art of [h.media('alice','video/mp4'),h.media('alice','audio/wav'),h.media('alice','image/svg+xml'),h.media('bob'),crypto.randomUUID()]){
  const id=h.job({invite:data},'ready',art);await assert.rejects(h.library().resolveSavedCreationAvatar('alice',id),e=>e.status===404);
 }
 const id=h.job({invite:data},'ready',h.media('alice','image/webp'));h.sqlite.prepare('UPDATE reel_jobs SET mime=? WHERE id=?').run('video/mp4',id);
 assert.equal((await h.library().resolveSavedCreationAvatar('alice',id)).avatar.id,id);assert.equal((await h.library().listCreationLibrary('alice')).avatars.length,1);
});

test('Every source photo must be valid owned image media, and unknown identity or style is rejected',async()=>{
 const h=harness(),source=h.media(),invalid=[[],undefined,['not-a-uuid'],[crypto.randomUUID()],[h.media('bob')],[h.media('alice','video/mp4')],[h.media('alice','audio/wav')],[h.media('alice','image/svg+xml')],Array(9).fill(source)];
 for(const refs of invalid){const id=h.job({invite:h.invite(refs)},'ready',h.media());await assert.rejects(h.library().resolveSavedCreationAvatar('alice',id),e=>e.status===404);}
 const badStyle=h.job({invite:h.invite([source],'unknown-secret-style')},'ready',h.media());await assert.rejects(h.library().resolveSavedCreationAvatar('alice',badStyle),e=>e.status===404);
 assert.deepEqual(plain((await h.library().listCreationLibrary('alice')).avatars),[]);
});

test('Old director assets recover only from explicit parent media, result, or art-step references',async()=>{
 for(const link of ['artId','result','step']){
  const h=harness(),source=h.media(),art=h.media(),id=h.job({kind:'director-asset',type:'art'},'completed',art),data=h.invite([source]);
  const extra=link==='artId'?{artId:art}:link==='result'?{result:{artId:art}}:{steps:[{kind:'art',existing:id}]};
  h.job({kind:'directed-reel',data,...extra},'failed');const out=await h.library().resolveSavedCreationAvatar('alice',id);assert.deepEqual(Array.from(out.avatar.sourcePhotos),[source]);assert.equal((await h.library().listCreationLibrary('alice')).avatars[0].id,id);
 }
});

test('Old assets do not guess from a nearby parent, another owner, malformed steps, or a non-art step',async()=>{
 const h=harness(),source=h.media(),art=h.media(),id=h.job({kind:'director-asset',type:'art'},'ready',art),data=h.invite([source]);
 h.job({kind:'directed-reel',data,steps:[]},'failed');h.job({kind:'directed-reel',data,artId:art},'ready',null,'bob');h.job({kind:'directed-reel',data,steps:['malformed',5,null,{kind:'film',existing:id}]},'ready');
 await assert.rejects(h.library().resolveSavedCreationAvatar('alice',id),e=>e.status===404);assert.deepEqual(plain((await h.library().listCreationLibrary('alice')).avatars),[]);
});

test('Ambiguous old avatar provenance is rejected; repeated parents with the same verified identity remain reusable',async()=>{
 for(const change of ['photos','style']){
  const h=harness(),source=h.media(),art=h.media(),id=h.job({kind:'director-asset',type:'art'},'ready',art),data=h.invite([source]);
  h.job({kind:'directed-reel',data,artId:art},'failed');h.job({kind:'directed-reel',data:{...data,templateId:'a-different-template'},result:{artId:art}},'ready');
  assert.equal((await h.library().resolveSavedCreationAvatar('alice',id)).avatar.id,id);
  const changed=change==='photos'?h.invite([h.media()]):h.invite([source],'cinematic-real');h.job({kind:'directed-reel',data:changed,steps:[{kind:'art',existing:id}]},'ready');
  await assert.rejects(h.library().resolveSavedCreationAvatar('alice',id),e=>e.status===404);assert.deepEqual(plain((await h.library().listCreationLibrary('alice')).avatars),[]);
 }
});

test('An explicit bad parent link never falls back to an unrelated parent or another owner',async()=>{
 for(const target of ['missing','foreign','wrong-kind','invalid-id']){
  const h=harness(),source=h.media(),art=h.media(),data=h.invite([source]);let parent=crypto.randomUUID();
  if(target==='foreign')parent=h.job({kind:'directed-reel',data},'failed',null,'bob');if(target==='wrong-kind')parent=h.job({kind:'voice-profile',data});if(target==='invalid-id')parent='bad';
  const id=h.job({kind:'director-asset',type:'art',parentJobId:parent},'ready',art);h.job({kind:'directed-reel',data,artId:art},'ready');await assert.rejects(h.library().resolveSavedCreationAvatar('alice',id),e=>e.status===404);
 }
});

test('Malformed historical payloads cannot break a private library request or leak job contents',async()=>{
 const h=harness(),source=h.media(),good=h.job({invite:h.invite([source])},'ready',h.media()),broken=h.job({},'ready',h.media());h.sqlite.prepare('UPDATE reel_jobs SET payload=? WHERE id=?').run('{broken-private-json',broken);
 h.job({kind:'director-asset',type:'art'},'ready',h.media());
 await assert.rejects(h.library().resolveSavedCreationAvatar('alice',broken),e=>e.status===404);
 const response=await h.load('app/api/create/library/route.ts').GET();assert.equal(response.status,200);const body=await response.json();assert.equal(body.avatars.length,1);assert.equal(body.avatars[0].id,good);
});

test('Photo list retains pre-digest uploads, excludes generated outputs, and returns the newest bounded set',async()=>{
 const h=harness(),ids=Array.from({length:105},()=>h.media()),data=h.invite([ids[0]]),output=h.media();h.job({invite:data},'failed',output);h.media('bob');
 const out=await h.library().listCreationLibrary('alice');assert.equal(out.photos.length,100);assert.equal(out.photos[0].id,ids[104]);assert.equal(out.photos.at(-1).id,ids[5]);assert.ok(!out.photos.some(p=>p.id===output));assert.deepEqual(Object.keys(out.photos[0]).sort(),['created','id']);
});

function harness(){
 const sqlite=new DatabaseSync(':memory:');for(const file of fs.readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync(path.join(root,'drizzle',file),'utf8'));
 let user='alice',clock=1700000000000;
 const env={DB:{prepare(sql){return {bind(...args){return {first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}})}}}}}};
 class APIError extends Error{constructor(status,message){super(message);this.status=status}}
 const api={APIError,identity:async()=>{if(!user)throw new APIError(401,'Sign in');return {userId:user}},json:(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}}),guarded:async action=>{try{return await action()}catch(error){if(error instanceof APIError)return api.json({error:error.message},error.status);throw error}}};
 const cache=new Map();function load(relative){const file=path.resolve(root,relative);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(output,{module,exports:module.exports,require(name){if(name==='cloudflare:workers')return {env};if(name==='./api'||name==='@/lib/api')return api;if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(file),name+'.ts')));throw Error('Unexpected dependency '+name)},console,JSON,Map,Set,Promise,Date,Error,Boolean,crypto,Response},{filename:file});return module.exports;}
 function media(owner='alice',mime='image/png'){const id=crypto.randomUUID();sqlite.prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').run(id,owner,mime,12,++clock);return id;}
 function job(value,status='ready',mediaId=null,owner='alice'){const id=crypto.randomUUID(),now=++clock;sqlite.prepare('INSERT INTO reel_jobs(id,owner,status,payload,created,updated,media_id,provider_task,mime,credit_cost) VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,owner,status,JSON.stringify(value),now,now,mediaId,'PRIVATE_PROVIDER_TASK','image/png',1);return id;}
 return {sqlite,load,media,job,user:value=>user=value,get:id=>sqlite.prepare('SELECT * FROM reel_jobs WHERE id=?').get(id),library:()=>load('lib/creation-library.ts'),invite:(photos,styleId='watercolor')=>({templateId:'reference-shaadi-haveli',names:'Our celebration',photos,creation:{styleId,format:'film'}}),changes:()=>sqlite.prepare('SELECT total_changes() count').get().count};
}
