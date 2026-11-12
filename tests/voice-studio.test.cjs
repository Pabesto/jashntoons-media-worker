const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
function harness(){
 const sqlite=new DatabaseSync(':memory:');for(const f of fs.readdirSync(path.join(root,'drizzle')).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync(path.join(root,'drizzle',f),'utf8'));
 const objects=new Map(),calls=[],globals={};let user='alice',failAt='',outcome='SUCCEEDED';
 const env={RUNWAY_API_KEY:'test-only',DB:{prepare(sql){return {bind(...args){return {first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}})}}}}},BUCKET:{put:async(id,bytes)=>objects.set(id,bytes),get:async(id)=>objects.has(id)?{arrayBuffer:async()=>objects.get(id).buffer}:null,delete:async(id)=>objects.delete(id)}};
 class APIError extends Error{constructor(status,message){super(message);this.status=status}}
 const api={APIError,identity:async()=>{if(!user)throw new APIError(401,'Sign in');return {userId:user}},originCheck:r=>{if(r.headers.get('origin')!=='https://jashntoons.test')throw new APIError(403,'Origin')},json:(v,status=200)=>Response.json(v,{status}),smallJson:r=>r.json(),boundedBytes:async(r,max)=>{const b=new Uint8Array(await r.arrayBuffer());if(b.length>max)throw new APIError(413,'Too large');return b},guarded:async fn=>{try{return await fn()}catch(e){if(e instanceof APIError)return Response.json({error:e.message},{status:e.status});throw e}}};
 const fetch=async(url,options={})=>{const body=options.body?JSON.parse(options.body):undefined;calls.push({url,body,headers:options.headers});if(failAt&&url.includes(failAt))return new Response('{}',{status:400});
  if(url.endsWith('/voices')&&body)return Response.json({id:'voice-remote',status:'PROCESSING'});
  if(url.includes('/voices/'))return Response.json({id:'voice-remote',status:'READY'});
  if(url.endsWith('/text_to_speech'))return Response.json({id:'speech-task'});
  if(url.endsWith('/avatars')&&body)return Response.json({id:'avatar-remote',status:'AvatarProcessing'});
  if(url.includes('/avatars/'))return Response.json({id:'avatar-remote',status:'AvatarReady'});
  if(url.endsWith('/avatar_videos'))return Response.json({id:'video-task'});
  if(url.includes('/tasks/'))return Response.json({id:'task',status:outcome,output:[url.endsWith('speech-task')?'https://output.test/voice.mp3':'https://output.test/talking.mp4']});
  if(url.startsWith('/api/media'))return new Response(new Uint8Array([1,2,3]));
  if(url.endsWith('.mp3'))return new Response(new Uint8Array([73,68,51]),{headers:{'content-type':'audio/mpeg'}});
  if(url.endsWith('.mp4'))return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'video/mp4'}});
  throw Error('Unexpected fetch '+url);
 };
 const cache=new Map();function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(compiled,{module,exports:module.exports,require(name){if(name==='./studio-score')return {studioScore:async duration=>({duration})};if(name==='cloudflare:workers')return {env};if(name.endsWith('/api')||name==='./api')return api;if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(file),name+'.ts')));return require(name)},console,crypto,URL,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,DataView,Response,Request,Headers,File,FormData,AbortSignal,Date,Math,Set,Number,JSON,Error,btoa,atob,fetch,setTimeout,clearTimeout,...globals},{filename:file});return module.exports}
 const job=id=>sqlite.prepare('SELECT * FROM reel_jobs WHERE id=?').get(id),voice=()=>load('lib/voice-studio.ts'),advance=id=>voice().advanceVoice(job(id));
 function fund(){sqlite.prepare('INSERT INTO credit_grants VALUES(?,?,?,?)').run(crypto.randomUUID(),'alice',20,Date.now())}
 function photo(){const id=crypto.randomUUID();objects.set(id,new Uint8Array([137,80,78,71]));sqlite.prepare('INSERT INTO media(id,owner,mime,size,created) VALUES(?,?,?,?,?)').run(id,'alice','image/png',4,Date.now());return id}
 function project(){const id=crypto.randomUUID();sqlite.prepare('INSERT INTO projects VALUES(?,?,?,?,?)').run(id,'alice','Invite','{}',Date.now());return id}
 const sample={name:'My voice',bytes:new Uint8Array([1,2,3]),consent:true,approveCredits:1};
 async function readyVoice(){const v=await voice().createVoice('alice',sample);await advance(v.id);return v.id}
 return {globals,env,sqlite,objects,calls,load,job,advance,fund,photo,project,sample,readyVoice,setUser:v=>user=v,fail:v=>failAt=v,outcome:v=>outcome=v};
}
test('Voice clone requires consent and explicit cost; identical samples are private and reused',async()=>{
 const h=harness(),s=h.load('lib/voice-studio.ts');await assert.rejects(s.createVoice('alice',{...h.sample,consent:false}),e=>e.status===400);await assert.rejects(s.createVoice('alice',{...h.sample,approveCredits:0}),e=>e.status===400);assert.equal(h.calls.length,0);
 const [a,b]=await Promise.all([s.createVoice('alice',h.sample),s.createVoice('alice',h.sample)]);assert.equal(a.id,b.id);assert.equal(h.calls.filter(c=>c.url.endsWith('/voices')).length,1);assert.equal((await h.advance(a.id)).status,'ready');assert.equal((await s.createVoice('alice',h.sample)).id,a.id);assert.equal((await h.load('lib/credits.ts').balance('alice')).used,1);await assert.rejects(s.ownedVoiceJob('bob',a.id),e=>e.status===404);assert.ok(h.objects.size);assert.equal(JSON.stringify(a).includes('voice-remote'),false);
});
test('Cloned speech drives the selected character, persists both outputs, resumes and avoids repeat charges',async()=>{
 const h=harness();h.fund();const s=h.load('lib/voice-studio.ts'),voiceId=await h.readyVoice(),referenceId=h.photo(),projectId=h.project(),input={voiceId,referenceId,projectId,script:'Namaste, welcome to our celebration!',approveCredits:5};
 const [a,b]=await Promise.all([s.createTalking('alice',input),s.createTalking('alice',input)]);assert.equal(a.id,b.id);assert.equal(h.calls.filter(c=>c.url.endsWith('/text_to_speech')).length,1);
 assert.equal((await h.advance(a.id)).phase,'avatar');assert.equal((await h.advance(a.id)).phase,'video');const [one,two]=await Promise.all([h.advance(a.id),h.advance(a.id)]);const ready=await h.advance(a.id);assert.equal(ready.status,'ready');assert.ok(ready.videoId&&ready.audioId);assert.equal((await s.createTalking('alice',input)).id,a.id);assert.equal((await h.load('lib/credits.ts').balance('alice')).used,6);
 const speech=h.calls.find(c=>c.url.endsWith('/text_to_speech')).body,avatar=h.calls.find(c=>c.url.endsWith('/avatars')).body,video=h.calls.find(c=>c.url.endsWith('/avatar_videos')).body;
 assert.equal(speech.voice.type,'custom');assert.equal(speech.voice.id,'voice-remote');assert.match(avatar.referenceImage,/^data:image\/png;base64,/);assert.equal(video.avatar.avatarId,'avatar-remote');assert.equal(video.speech.type,'audio');assert.match(video.speech.audio,/^data:audio\/mpeg;base64,/);assert.equal(h.calls.filter(c=>c.url.endsWith('/avatar_videos')).length,1);
 assert.ok(h.calls.filter(c=>c.url.startsWith('https://output.test')).every(c=>!c.headers));
 const changed=await s.createTalking('alice',{...input,script:'A second invitation'});await h.advance(changed.id);assert.equal(h.calls.filter(c=>c.url.endsWith('/avatars')).length,1,'saved portrait avatar reused for new words');
 const clip={jobId:ready.id,videoId:ready.videoId,audioId:ready.audioId,voiceId,referenceId,script:input.script,duration:8};await s.validateVoiceDraft('alice',{talkingClip:clip});await assert.rejects(s.validateVoiceDraft('alice',{talkingClip:{...clip,audioId:crypto.randomUUID()}}),e=>e.status===403);await assert.rejects(s.validateVoiceDraft('bob',{talkingClip:clip}),e=>e.status===404);
});
test('Provider failures refund credits; lost submissions are never automatically sent again',async()=>{
 const h=harness();h.fail('/voices');const a=await h.load('lib/voice-studio.ts').createVoice('alice',h.sample);assert.equal(a.status,'failed');assert.equal((await h.load('lib/credits.ts').balance('alice')).used,0);h.fail('');h.fund();const voiceId=await h.readyVoice(),input={voiceId,referenceId:h.photo(),projectId:h.project(),script:'A warm welcome to you all.',approveCredits:5};const b=await h.load('lib/voice-studio.ts').createTalking('alice',input);h.outcome('FAILED');assert.equal((await h.advance(b.id)).status,'failed');assert.equal((await h.load('lib/credits.ts').balance('alice')).used,1);
 const c=await h.load('lib/voice-studio.ts').createTalking('alice',input);h.sqlite.prepare("UPDATE reel_jobs SET status='processing',updated=? WHERE id=?").run(Date.now()-200000,c.id);const count=h.calls.length;assert.equal((await h.advance(c.id)).status,'failed');assert.equal(h.calls.length,count);
});
test('Free balance cannot start a five-credit clip, and another account cannot use a voice or portrait',async()=>{
 const h=harness(),s=h.load('lib/voice-studio.ts'),voiceId=await h.readyVoice(),input={voiceId,referenceId:h.photo(),projectId:h.project(),script:'Welcome to our special day',approveCredits:5};const count=h.calls.length;await assert.rejects(s.createTalking('alice',input),e=>e.status===402);assert.equal(h.calls.length,count);await assert.rejects(s.createTalking('bob',input),e=>e.status===404);h.fund();h.sqlite.prepare('UPDATE media SET owner=? WHERE id=?').run('bob',input.referenceId);await assert.rejects(s.createTalking('alice',input),e=>e.status===403);
});
test('Voice API requires sign-in and same-origin writes, and rejects invalid samples without provider calls',async()=>{
 const h=harness(),r=h.load('app/api/voice/route.ts');h.setUser(null);assert.equal((await r.GET()).status,401);h.setUser('alice');assert.equal((await r.POST(new Request('https://jashntoons.test/api/voice',{method:'POST',body:'{}'}))).status,403);
 const form=new FormData();form.append('name','Voice');form.append('file',new File(['not an audio'],'fake.wav',{type:'audio/wav'}));const response=await r.POST(new Request('https://jashntoons.test/api/voice',{method:'POST',headers:{Origin:'https://jashntoons.test'},body:form}));assert.equal(response.status,400);assert.equal(h.calls.length,0);
 const id=await h.readyVoice();h.setUser('bob');const poll=h.load('app/api/voice/[id]/route.ts');assert.equal((await poll.POST(new Request('https://jashntoons.test/api/voice/'+id,{method:'POST',headers:{Origin:'https://jashntoons.test'}}),{params:Promise.resolve({id})})).status,404);
});
test('Speaking intro extends the film instead of truncating or looping its speech',()=>{
 const h=harness(),c=h.load('lib/voice-contract.ts'),t=h.load('lib/templates.ts'),v=h.load('lib/validation.ts'),d=t.defaultInvite(t.getTemplate('haveli-celebration')),ids=Array.from({length:5},()=>crypto.randomUUID()),clip={jobId:ids[0],videoId:ids[1],audioId:ids[2],referenceId:ids[3],voiceId:ids[4],script:'Welcome!',duration:8.6};
 assert.equal(c.reelDuration({...d,duration:30,talkingClip:clip}),38.6);assert.equal(c.introDuration(d),0);assert.equal(v.draftInviteSchema.safeParse({...d,talkingClip:clip,voiceDraft:{voiceId:ids[4],script:'Welcome!'},pendingTalkingId:ids[0]}).success,true);assert.equal(v.draftInviteSchema.safeParse({...d,talkingClip:{...clip,duration:900}}).success,false);
});
test('Speech is audible with music muted and music ducks without turning the voice down',async()=>{
 const h=harness(),contexts=[];class Offline{constructor(channels,length,rate){this.duration=length/rate;this.sources=[];this.gains=[];this.destination={};contexts.push(this)}createBufferSource(){const source={connect(){return this},start(...at){this.at=at},stop(){}};this.sources.push(source);return source}createGain(){const points=[],gain={gain:{setValueAtTime:(...p)=>points.push(p),linearRampToValueAtTime:(...p)=>points.push(p)},points,connect(){return this}};this.gains.push(gain);return gain}async decodeAudioData(){return {duration:8}}async startRendering(){return {duration:this.duration}}}h.globals.OfflineAudioContext=Offline;
 const r=h.load('lib/reel-renderer.ts'),t=h.load('lib/templates.ts'),data={...t.defaultInvite(t.getTemplate('haveli-celebration')),duration:30,music:'none',talkingClip:{audioId:'saved-speech',duration:8.2},editor:{...h.load('lib/editor-settings.ts').editorDefaults,musicVolume:0}};
 const buffer=await r.soundtrack(data);assert.ok(Math.abs(buffer.duration-38.2)<1/44100);assert.equal(contexts[0].sources.length,1);assert.equal(contexts[0].gains.length,0);assert.equal(contexts[0].sources[0].at[0],0);
 await r.soundtrack({...data,music:'party',editor:{...data.editor,musicVolume:50}});const mix=contexts[1];assert.equal(mix.sources.length,2);assert.equal(mix.gains.length,1);assert.equal(mix.gains[0].points[0][0],.06);assert.equal(mix.gains[0].points.at(-1)[0],.5);assert.equal(mix.sources[1].at[0],0);
});
