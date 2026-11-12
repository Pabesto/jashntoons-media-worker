import {spawn,execFile} from 'node:child_process';
import {readFile,copyFile} from 'node:fs/promises';
import {promisify} from 'node:util';
const probe=promisify(execFile);
// A compliant new export needs no second lossy encode or expensive render job.
export async function prepareVideo(input,output){
 const {stdout}=await probe('ffprobe',['-v','error','-show_streams','-show_format','-of','json',input],{timeout:15000,maxBuffer:1000000});
 const info=JSON.parse(stdout),v=info.streams.find(s=>s.codec_type==='video'),a=info.streams.find(s=>s.codec_type==='audio');
 const [n,d]=(v?.avg_frame_rate??'0/1').split('/').map(Number),bytes=await readFile(input),moov=bytes.indexOf(Buffer.from('moov')),mdat=bytes.indexOf(Buffer.from('mdat'));
 if(v?.codec_name==='h264'&&['yuv420p','yuvj420p'].includes(v.pix_fmt)&&Math.abs(n/d-30)<.01&&v.width<=1080&&v.height<=1920&&Number(info.format.bit_rate)<=4800000&&(!a||a.codec_name==='aac')&&moov>0&&mdat>moov){await copyFile(input,output);return 'reused';}
 await encode(input,output);return 'encoded';
}
export const ffmpegArgs=(input,output)=>['-hide_banner','-loglevel','error','-nostdin','-y','-i',input,'-map','0:v:0','-map','0:a:0?','-vf',"scale=w='min(1080,iw)':h=-2,fps=30,format=yuv420p",'-c:v','libx264','-preset','fast','-crf','22','-maxrate','4500k','-bufsize','9000k','-g','30','-c:a','aac','-b:a','128k','-ar','48000','-movflags','+faststart',output];
export async function encode(input,output){await new Promise((resolve,reject)=>{const child=spawn('ffmpeg',ffmpegArgs(input,output),{stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',b=>{error=(error+b).slice(-1500)});const timeout=setTimeout(()=>child.kill('SIGKILL'),240000);child.on('error',e=>{clearTimeout(timeout);reject(e)});child.on('exit',code=>{clearTimeout(timeout);code===0?resolve():reject(Error('FFmpeg failed with code '+code))});});}
