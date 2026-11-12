import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,stat,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {planClips,verifyDuration,normalizeArgs,runMediaTool} from '../services/media-worker/reference-assembly.mjs';
import {localOrigin,validateLease,downloadPart,runCreationScheduler} from '../services/render-web/creation-scheduler.mjs';

const info=(duration,extra={})=>({streams:[{codec_type:'video',duration:String(duration),avg_frame_rate:'30/1',...extra}],format:{duration:'999'}});
test('clip plan preserves order and cumulative frames, rejecting oversized or invalid jobs',()=>{
 const p=planClips([{path:'first',seconds:25.133},{path:'second',seconds:26.867}]);
 assert.equal(p.frames,1560);assert.equal(p.seconds,52);assert.equal(p.parts[0].frames,754);assert.equal(p.parts[1].frames,806);
 assert.equal(p.parts[0].path,resolve('first'));assert.equal(p.parts[1].path,resolve('second'));
 for(const parts of [[],Array(5).fill({path:'a',seconds:1}),Array(4).fill({path:'a',seconds:30}),[{path:'a',seconds:NaN}],[{path:'a',seconds:31}],[{path:'a',seconds:-1}]])assert.throws(()=>planClips(parts));
});
test('input timing validates video duration rather than a longer soundtrack and never accepts retimed clips',()=>{
 assert.equal(verifyDuration(info(12),12).duration,12);
 verifyDuration(info(12+2/30),12);verifyDuration(info(12-2/30),12);
 assert.throws(()=>verifyDuration(info(12.08),12),/timing/);
 assert.throws(()=>verifyDuration(info(11.9),12),/timing/);
 assert.throws(()=>verifyDuration({streams:[]},12),/no video/);
 verifyDuration(info(undefined,{duration_ts:360000,time_base:'1/30000'}),12);
});
test('normalization keeps timestamps at their original speed and passes filenames as individual arguments',()=>{
 const source=resolve('a; touch secret.mp4'),output=resolve('finished.mp4'),args=normalizeArgs(source,output,90),filter=args[args.indexOf('-vf')+1];
 assert.equal(args[args.indexOf('-i')+1],source);assert.equal(args.at(-1),output);assert.ok(args.includes('-an'));
 assert.match(filter,/setpts=PTS-STARTPTS,fps=30/);assert.doesNotMatch(filter.split(',')[0],/[*/]/);
 assert.match(filter,/scale=720:1280/);assert.match(filter,/trim=end_frame=90/);assert.match(filter,/tpad=stop_mode=clone:stop=2/);
 assert.equal(args[args.indexOf('-frames:v')+1],'90');assert.throws(()=>normalizeArgs(source,output,NaN));
});
test('local scheduler cannot point its secret at another host and validates complete leases',()=>{
 assert.equal(localOrigin('10000'),'http://127.0.0.1:10000');
 for(const port of ['https://other.example','3000/path',0,65536])assert.throws(()=>localOrigin(port));
 const job={id:'12345678-1234-1234-1234-123456789012',lease:'87654321-1234-1234-1234-123456789012',parts:2,seconds:[26,26]};
 assert.equal(validateLease(job),job);assert.throws(()=>validateLease({...job,parts:3}));assert.throws(()=>validateLease({...job,id:'../outside'}));
});
test('streaming downloads stop at the byte limit even without content-length',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'jashntoons-test-'));
 try{
  const ok=join(dir,'ok');assert.equal(await downloadPart(new Response(new Uint8Array(10)),ok,10),10);assert.equal((await stat(ok)).size,10);
  await assert.rejects(downloadPart(new Response(new Uint8Array(11)),join(dir,'large'),10),/download limit/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('scheduler ticks creation, downloads ordered parts, uploads with the lease, then removes temporary files',async()=>{
 const controller=new AbortController(),calls=[],job={id:'12345678-1234-1234-1234-123456789012',lease:'87654321-1234-1234-1234-123456789012',parts:2,seconds:[26,26]};let output;
 const fetcher=async(url,init)=>{
  calls.push({url,method:init.method??'GET',headers:init.headers});assert.match(url,/^http:\/\/127\.0\.0\.1:4321\/api\/reference-worker/);assert.equal(init.headers.Authorization,'Bearer '+ 'x'.repeat(32));
  if(url.endsWith('/tick'))return Response.json({checked:1});
  if(url.endsWith('/lease'))return Response.json({job});
  assert.equal(init.headers['x-render-lease'],job.lease);
  if(init.method==='PUT'){assert.equal(init.headers['Content-Type'],'video/mp4');assert.equal(init.headers['Content-Length'],'128');for await(const chunk of init.body)assert.equal(chunk.length,128);controller.abort();return Response.json({ready:true});}
  return new Response(new Uint8Array(128));
 };
 await runCreationScheduler({secret:'x'.repeat(32),port:'4321',signal:controller.signal,fetcher,preflight:async()=>{},assemble:async(inputs,path)=>{
  assert.deepEqual(inputs.map(p=>p.seconds),[26,26]);assert.match(inputs[0].path,/source-0\.mp4$/);assert.match(inputs[1].path,/source-1\.mp4$/);output=path;await writeFile(path,new Uint8Array(128));return {seconds:52,frames:1560};
 }});
 assert.deepEqual(calls.map(c=>c.method),['POST','POST','GET','GET','PUT']);assert.ok(calls[2].url.endsWith('?part=0'));assert.ok(calls[3].url.endsWith('?part=1'));await assert.rejects(access(output));
});
test('scheduler reports assembly failure without resubmitting generation or uploading a partial video',async()=>{
 const controller=new AbortController(),methods=[],job={id:'12345678-1234-1234-1234-123456789012',lease:'87654321-1234-1234-1234-123456789012',parts:1,seconds:[3]};
 await runCreationScheduler({secret:'x'.repeat(32),signal:controller.signal,preflight:async()=>{},assemble:async()=>{throw new Error('timing mismatch');},fetcher:async(url,init)=>{
  methods.push(init.method??'GET');if(url.endsWith('/tick'))return Response.json({});if(url.endsWith('/lease'))return Response.json({job});if(init.method==='PATCH'){controller.abort();return Response.json({saved:true});}return new Response(new Uint8Array(128));
 }});
 assert.deepEqual(methods,['POST','POST','GET','PATCH']);
});
test('real FFmpeg normalizes and joins tiny clips in order with exact frames and no audio',async t=>{
 let binary=process.env.FFMPEG_PATH||'ffmpeg';
 try{await runMediaTool(binary,['-version'],{timeout:10000});}catch{
  binary=resolve('../Jashntoons/outputs/tools/ffmpeg.exe');
  try{await runMediaTool(binary,['-version'],{timeout:10000});}catch{t.skip('FFmpeg is not installed; runtime preflight checks the deployed environment.');return;}
 }
 const dir=await mkdtemp(join(tmpdir(),'jashntoons-encode-test-'));
 try{
  for(const [i,color,frames] of [[0,'red',6],[1,'blue',9]]){
   const input=join(dir,'source-'+i+'.mp4'),output=join(dir,'part-'+i+'.mp4');
   await runMediaTool(binary,['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c='+color+':s=64x96:r=30','-f','lavfi','-i','sine=frequency=400:sample_rate=48000','-frames:v',String(frames),'-shortest','-c:v','libx264','-c:a','aac',input]);
   await runMediaTool(binary,normalizeArgs(input,output,frames));
  }
  const manifest=join(dir,'parts.txt'),output=join(dir,'joined.mp4');await writeFile(manifest,"file 'part-0.mp4'\nfile 'part-1.mp4'\n");
  await runMediaTool(binary,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','1','-i',manifest,'-map','0:v:0','-an','-c','copy',output]);
  const hashes=await runMediaTool(binary,['-v','error','-i',output,'-f','framemd5','-']);
  assert.match(hashes,/#dimensions 0: 720x1280/);const frames=hashes.split('\n').filter(l=>/^0,/.test(l));assert.equal(frames.length,15);
  const first=frames[0].split(',').at(-1).trim(),last=frames[6].split(',').at(-1).trim();assert.notEqual(first,last);assert.ok(frames.slice(0,6).every(l=>l.endsWith(first)));assert.ok(frames.slice(6).every(l=>l.endsWith(last)));
  await assert.rejects(runMediaTool(binary,['-v','error','-i',output,'-map','0:a','-f','null','-']),/failed/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
