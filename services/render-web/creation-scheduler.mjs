import {mkdtemp,rm,stat} from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {setTimeout as sleep} from 'node:timers/promises';
import {assembleClips,preflightMediaTools,planClips} from '../media-worker/reference-assembly.mjs';

const MAX_PART_BYTES=80000000,MAX_JOB_BYTES=160000000;
export function localOrigin(port=process.env.PORT||'3000'){
 if(!/^\d+$/.test(String(port))||Number(port)<1||Number(port)>65535)throw new Error('Invalid local Render port.');
 return 'http://127.0.0.1:'+Number(port);
}
export function validateLease(job){
 if(!job||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(job.id)||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(job.lease)||!Number.isInteger(job.parts)||!Array.isArray(job.seconds)||job.parts!==job.seconds.length)throw new Error('Invalid reference assembly lease.');
 planClips(job.seconds.map((seconds,i)=>({path:'part-'+i,seconds})));
 return job;
}
export async function downloadPart(response,path,limit=MAX_PART_BYTES,signal){
 const size=Number(response.headers.get('content-length'));
 if(!response.body||size>limit){await response.body?.cancel();throw new Error('The edited scene exceeds the download limit.');}
 let bytes=0;
 const bounded=new Transform({transform(chunk,encoding,done){bytes+=chunk.length;done(bytes>limit?new Error('The edited scene exceeds the download limit.'):null,chunk);}});
 await pipeline(Readable.fromWeb(response.body),bounded,createWriteStream(path,{flags:'wx'}),{signal});
 if(!bytes)throw new Error('The saved edited scene is empty.');
 return bytes;
}

export async function runCreationScheduler({secret=process.env.MEDIA_WORKER_SECRET,port=process.env.PORT||'3000',signal,fetcher=fetch,preflight=preflightMediaTools,assemble=assembleClips,interval=5000}={}){
 if(!secret||secret.length<32)throw new Error('Configure MEDIA_WORKER_SECRET before enabling media processing.');
 const origin=localOrigin(port);
 await preflight();
 const api=async(path,init={},requestSignal=signal)=>{
  const response=await fetcher(origin+path,{...init,redirect:'error',headers:{Authorization:'Bearer '+secret,...init.headers},signal:requestSignal?AbortSignal.any([requestSignal,AbortSignal.timeout(240000)]):AbortSignal.timeout(240000)});
  if(!response.ok){await response.body?.cancel();throw new Error('Reference worker HTTP '+response.status);}
  return response;
 };
 let connected=false;
 while(!signal?.aborted){
  try{
   const tick=await api('/api/reference-worker/tick',{method:'POST'});await tick.arrayBuffer();
   const {job}=await (await api('/api/reference-worker/lease',{method:'POST'})).json();
   if(!connected){console.log(JSON.stringify({event:'reference-worker-connected'}));connected=true;}
   if(job){
    validateLease(job);
    const path='/api/reference-worker/'+job.id,headers={'x-render-lease':job.lease},directory=await mkdtemp(join(tmpdir(),'jashntoons-reference-'));
    const jobSignal=signal?AbortSignal.any([signal,AbortSignal.timeout(540000)]):AbortSignal.timeout(540000);
    try{
     let bytes=0;const inputs=[];
     for(let i=0;i<job.parts;i++){
      const file=join(directory,'source-'+i+'.mp4'),response=await api(path+'?part='+i,{headers},jobSignal);
      bytes+=await downloadPart(response,file,Math.min(MAX_PART_BYTES,MAX_JOB_BYTES-bytes),jobSignal);
      inputs.push({path:file,seconds:job.seconds[i]});
     }
     const output=join(directory,'complete.mp4'),result=await assemble(inputs,output,{signal:jobSignal}),size=(await stat(output)).size;
     if(size<100||size>MAX_PART_BYTES)throw new Error('The assembled MP4 has an invalid size.');
     const response=await api(path,{method:'PUT',headers:{...headers,'Content-Type':'video/mp4','Content-Length':String(size)},body:createReadStream(output),duplex:'half'},jobSignal);await response.arrayBuffer();
     console.log(JSON.stringify({event:'reference-film-ready',job:job.id,frames:result.frames,seconds:result.seconds,bytes:size}));
    }catch(error){
     console.error(JSON.stringify({event:'reference-film-failed',job:job.id,message:error.message}));
     // A process shutdown leaves the lease recoverable. Other failures retain all saved provider clips.
     if(!signal?.aborted){const failed=await api(path,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:'{}'}).catch(()=>null);await failed?.arrayBuffer().catch(()=>{});}
    }finally{await rm(directory,{recursive:true,force:true});}
   }
  }catch(error){if(!signal?.aborted){connected=false;console.error(JSON.stringify({event:'reference-worker-retry',message:error.message}));}}
  if(!signal?.aborted)await sleep(interval,undefined,{signal}).catch(()=>{});
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const controller=new AbortController();
 for(const name of ['SIGINT','SIGTERM'])process.on(name,()=>controller.abort(new Error('Reference worker stopping.')));
 runCreationScheduler({signal:controller.signal}).catch(error=>{console.error(JSON.stringify({event:'reference-worker-unavailable',message:error.message}));process.exitCode=1;});
}
