import {prepareVideo as encode} from './encode.mjs';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const origin=new URL(process.env.SITE_ORIGIN||'https://jashntoons.ai');
if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.username||origin.password)throw Error('SITE_ORIGIN must be an HTTPS origin.');
const secret=process.env.MEDIA_WORKER_SECRET;if(!secret||secret.length<32)throw Error('Configure the private MEDIA_WORKER_SECRET.');
let connected=false,stopping=false;process.on('SIGTERM',()=>{stopping=true});process.on('SIGINT',()=>{stopping=true});
async function api(path,init={}){const r=await fetch(new URL(path,origin),{...init,headers:{Authorization:'Bearer '+secret,...init.headers},signal:AbortSignal.timeout(180000)});if(!r.ok)throw Error('Site returned '+r.status);return r;}
async function work(job){if(!/^[a-f0-9-]{36}$/.test(job.id)||!/^[a-f0-9-]{36}$/.test(job.lease))throw Error('Invalid work item.');const path='/api/render-worker/'+job.id,headers={'x-render-lease':job.lease},directory=await mkdtemp(join(tmpdir(),'jashntoons-'));try{const r=await api(path,{headers});const bytes=await r.arrayBuffer();if(bytes.byteLength>80000000)throw Error('Input too large');const input=join(directory,'input'),output=join(directory,'output.mp4');await writeFile(input,new Uint8Array(bytes));await encode(input,output);const result=await readFile(output);if(result.length>80000000)throw Error('Output too large');await api(path,{method:'PUT',headers:{...headers,'Content-Type':'video/mp4'},body:result});console.log(JSON.stringify({event:'video-ready',job:job.id,bytes:result.length}));}catch(e){console.error(JSON.stringify({event:'video-failed',job:job.id,message:e.message}));await api(path,{method:'PATCH',headers:{...headers,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});}finally{await rm(directory,{recursive:true,force:true});}}
while(!stopping){try{const {job}=await (await api('/api/render-worker/lease',{method:'POST'})).json();if(!connected){console.log(JSON.stringify({event:'worker-connected',site:origin.origin}));connected=true;}if(job)await work(job);else await sleep(5000);}catch(e){connected=false;console.error(JSON.stringify({event:'worker-retry',message:e.message}));await sleep(15000);}}
