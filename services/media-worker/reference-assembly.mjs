import {spawn} from 'node:child_process';
import {mkdtemp,stat,writeFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

export const OUTPUT_FPS=30;
const MAX_SECONDS=90,MAX_CLIPS=4,TOLERANCE=2/OUTPUT_FPS+0.0001;

// No shell is involved. Paths are individual arguments and all filter values are server-owned.
export function runMediaTool(binary,args,{signal,timeout=240000}={}){
 return new Promise((accept,reject)=>{
  if(signal?.aborted){reject(signal.reason??new Error('Media processing cancelled.'));return;}
  const child=spawn(binary,args,{shell:false,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='',settled=false,stoppingError;
  const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):accept(stdout);};
  const abort=()=>{stoppingError=signal.reason??new Error('Media processing cancelled.');child.kill('SIGKILL');};
  const timer=setTimeout(()=>{stoppingError=new Error(binary+' exceeded its processing time limit.');child.kill('SIGKILL');},timeout);
  signal?.addEventListener('abort',abort,{once:true});
  child.stdout.on('data',b=>{stdout+=b;if(stdout.length>1000000){stoppingError=new Error(binary+' returned too much metadata.');child.kill('SIGKILL');}});
  child.stderr.on('data',b=>{stderr=(stderr+b).slice(-2000);});
  child.on('error',()=>finish(new Error(binary+' is not available.')));
  child.on('close',code=>finish(stoppingError??(code===0?null:new Error(binary+' failed ('+code+'). '+stderr.replace(/[\r\n]+/g,' ').slice(-400)))));
 });
}

export async function preflightMediaTools(){
 await runMediaTool('ffmpeg',['-version'],{timeout:15000});
 await runMediaTool('ffprobe',['-version'],{timeout:15000});
}

export function planClips(inputs){
 if(!Array.isArray(inputs)||inputs.length<1||inputs.length>MAX_CLIPS)throw new Error('Provide between one and four saved clips.');
 let seconds=0,frames=0;
 const parts=inputs.map(item=>{
  if(!item||typeof item.path!=='string'||!item.path||item.path.includes('\0')||!Number.isFinite(item.seconds)||item.seconds<=0||item.seconds>30)throw new Error('Invalid saved clip or duration.');
  seconds+=item.seconds;if(seconds>MAX_SECONDS+1e-8)throw new Error('A joined reel cannot exceed 90 seconds.');
  const next=Math.round(seconds*OUTPUT_FPS),count=next-frames;frames=next;
  if(count<1)throw new Error('A saved clip must contain at least one frame.');
  return {path:resolve(item.path),seconds:item.seconds,frames:count};
 });
 return {parts,seconds,frames};
}

function rate(value){const [n,d=1]=String(value??'0/1').split('/').map(Number);return d?n/d:0;}
export function videoMetadata(info){
 const video=info?.streams?.find(s=>s.codec_type==='video');
 if(!video)throw new Error('A saved clip has no video stream.');
 const duration=Number(video.duration)>0?Number(video.duration):Number(video.duration_ts)>0?Number(video.duration_ts)*rate(video.time_base):Number(info.format?.duration);
 if(!Number.isFinite(duration)||duration<=0)throw new Error('The saved clip duration could not be verified.');
 return {video,duration,frames:Number(video.nb_read_frames??video.nb_frames),fps:rate(video.avg_frame_rate)};
}
export function verifyDuration(info,expected){
 const result=videoMetadata(info);
 if(Math.abs(result.duration-expected)>TOLERANCE)throw new Error('An edited clip changed the original scene timing.');
 return result;
}
async function probe(path,{signal,countFrames=false}={}){
 const raw=await runMediaTool('ffprobe',['-v','error',...(countFrames?['-count_frames']:[]),'-show_streams','-show_format','-of','json',path],{signal,timeout:60000});
 try{return JSON.parse(raw);}catch{throw new Error('Video metadata could not be read.');}
}

export function normalizeArgs(input,output,frames){
 if(!Number.isInteger(frames)||frames<1||frames>MAX_SECONDS*OUTPUT_FPS)throw new Error('Invalid output frame count.');
 const filter='setpts=PTS-STARTPTS,fps=30:start_time=0:round=near,scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop=2,trim=end_frame='+frames;
 return ['-hide_banner','-loglevel','error','-nostdin','-y','-i',input,'-map','0:v:0','-an','-sn','-dn','-vf',filter,'-frames:v',String(frames),'-c:v','libx264','-threads','2','-preset','fast','-crf','21','-maxrate','4000k','-bufsize','8000k','-g','30','-video_track_timescale','15360','-map_metadata','-1','-movflags','+faststart',output];
}

export async function assembleClips(inputs,output,{signal}={}){
 const plan=planClips(inputs);
 if(typeof output!=='string'||!output||output.includes('\0'))throw new Error('Invalid output file.');
 output=resolve(output);
 if(plan.parts.some(p=>p.path===output))throw new Error('The output cannot overwrite a saved clip.');
 for(const part of plan.parts){const file=await stat(part.path);if(!file.isFile()||file.size<1||file.size>80000000)throw new Error('The saved clip is empty or too large.');verifyDuration(await probe(part.path,{signal}),part.seconds);}
 const directory=await mkdtemp(join(tmpdir(),'jashntoons-assembly-'));
 try{
  for(let i=0;i<plan.parts.length;i++){
   const part=plan.parts[i],path=join(directory,'part-'+i+'.mp4');
   await runMediaTool('ffmpeg',normalizeArgs(part.path,path,part.frames),{signal});
   const check=videoMetadata(await probe(path,{signal,countFrames:true}));
   if(check.frames!==part.frames||Math.abs(check.fps-OUTPUT_FPS)>.001||check.video.width!==720||check.video.height!==1280)throw new Error('A normalized clip failed frame validation.');
  }
  // The concat manifest contains only filenames we created, never user text or paths.
  const manifest=join(directory,'parts.txt'),joined=join(directory,'joined.mp4');
  await writeFile(manifest,plan.parts.map((_,i)=>"file 'part-"+i+".mp4'").join('\n')+'\n');
  await runMediaTool('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-y','-f','concat','-safe','1','-i',manifest,'-map','0:v:0','-an','-c:v','copy','-map_metadata','-1','-movflags','+faststart',joined],{signal});
  const info=await probe(joined,{signal,countFrames:true}),result=verifyDuration(info,plan.frames/OUTPUT_FPS);
  if(result.frames!==plan.frames||Math.abs(result.fps-OUTPUT_FPS)>.001||info.streams.some(s=>s.codec_type==='audio'))throw new Error('The joined reel failed its final timing check.');
  if((await stat(joined)).size>80000000)throw new Error('The joined reel is too large.');
  await copyFile(joined,output);
  return {frames:plan.frames,seconds:plan.frames/OUTPUT_FPS,width:720,height:1280};
 }finally{await rm(directory,{recursive:true,force:true});}
}
