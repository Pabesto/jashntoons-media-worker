import {Input,BlobSource,ALL_FORMATS,CanvasSink,Output,BufferTarget,Mp4OutputFormat,WebMOutputFormat,CanvasSource,AudioBufferSource,Quality,canEncodeVideo,canEncodeAudio} from 'mediabunny';
import type {Invite} from './templates';
import type {ReelAssets} from './reel-renderer';
import {introDuration,reelDuration} from './voice-contract';
import {fullFilmPosition,motionTime} from './full-film-renderer';
import {setVideoFrame} from './video-playback';

export const EXPORT_FPS=30;
export function exportFrameCount(duration:number){return Math.ceil(duration*EXPORT_FPS);}
export function exportFrameTime(index:number){return index/EXPORT_FPS;}
export function activeExportVideo(data:Invite,assets:ReelAssets,time:number){
 if(assets.talking&&time<introDuration(data))return {video:assets.talking,time:Math.min(time,Math.max(0,assets.talking.duration-.001))};
 time=Math.max(0,time-introDuration(data));
 if(assets.film){const pos=fullFilmPosition(data,time),video=assets.film.videos[pos.asset];if(video)return {video,time:motionTime(data,pos,video,time).target};}
 if(assets.video)return {video:assets.video,time:time%Math.max(.1,assets.video.duration)};
 return null;
}
type Renderer={loadAssets:(d:Invite)=>Promise<ReelAssets>;releaseAssets:(a:ReelAssets)=>void;drawReel:(c:HTMLCanvasElement,d:Invite,a:ReelAssets,t:number)=>void;soundtrack:(d:Invite)=>Promise<AudioBuffer>};
export async function exportFrames(data:Invite,progress:(p:number)=>void,signal:AbortSignal,renderer:Renderer){
 const width=data.quality||720,height=Math.round(width*16/9),quality=new Quality({bitrate:width>=1080?4500000:2400000}),sound=!!(data.directedReel?.hasSpeech||data.talkingClip||data.customAudio||data.music!=='none');
 const mp4=await canEncodeVideo('avc',{width,height,frameRate:EXPORT_FPS,quality})&&(!sound||await canEncodeAudio('aac',{numberOfChannels:2,sampleRate:44100}));
 if(!mp4&&(!await canEncodeVideo('vp8',{width,height,frameRate:EXPORT_FPS,quality})||sound&&!await canEncodeAudio('opus',{numberOfChannels:2,sampleRate:44100})))throw Error('This browser cannot make a smooth video. Open the studio in an updated Chrome or Edge browser. Your draft is saved.');
 signal.throwIfAborted();await document.fonts.ready;
 const assets=await renderer.loadAssets(data),inputs:Input[]=[],iterators=new Map<HTMLVideoElement,AsyncGenerator<any,void,unknown>>(),times=new Map<HTMLVideoElement,number[]>(),target=new BufferTarget();
 const output=new Output({format:mp4?new Mp4OutputFormat({fastStart:'in-memory'}):new WebMOutputFormat(),target});
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const source=new CanvasSource(canvas,{codec:mp4?'avc':'vp8',quality,keyFrameInterval:1,latencyMode:'quality'});output.addVideoTrack(source,{frameRate:EXPORT_FPS});
 const audio=sound?new AudioBufferSource({codec:mp4?'aac':'opus',quality:new Quality({bitrate:128000})}):null;if(audio)output.addAudioTrack(audio);
 const count=exportFrameCount(reelDuration(data));for(let i=0;i<count;i++){const active=activeExportVideo(data,assets,exportFrameTime(i));if(active){if(!times.has(active.video))times.set(active.video,[]);times.get(active.video)!.push(active.time);}}
 let audioError:unknown;const cancel=()=>{void output.cancel().catch(()=>{});};signal.addEventListener('abort',cancel,{once:true});
 try{
  signal.throwIfAborted();const buffer=sound?await renderer.soundtrack(data):null;await output.start();
  const audioTask=audio&&buffer?audio.add(buffer).then(()=>audio.close()).catch(e=>{audioError=e}):Promise.resolve();
  let last=-1;
  for(let i=0;i<count;i++){
   signal.throwIfAborted();if(audioError)throw audioError;const time=exportFrameTime(i),active=activeExportVideo(data,assets,time);
   if(active){let iterator=iterators.get(active.video);if(!iterator){const response=await fetch(active.video.currentSrc||active.video.src,{signal});if(!response.ok)throw Error('A saved video could not load for export. Retry; your AI result is already saved.');const blob=await response.blob();if(blob.size>80000000)throw Error('The source film is too large for this export.');const input=new Input({source:new BlobSource(blob),formats:ALL_FORMATS});inputs.push(input);const track=await input.getPrimaryVideoTrack();if(!track||!await track.canDecode())throw Error('This browser cannot decode your film. Try an updated Chrome or Edge browser.');const first=await track.getFirstTimestamp();iterator=new CanvasSink(track,{width,fit:'contain',poolSize:2}).canvasesAtTimestamps(times.get(active.video)!.map(t=>t+first));iterators.set(active.video,iterator);}const next=await iterator.next();if(!next.value)throw Error('A frame could not be decoded. Retry export; no new AI generation is needed.');setVideoFrame(active.video,next.value.canvas);}
   renderer.drawReel(canvas,data,assets,time);await source.add(time,1/EXPORT_FPS);const p=Math.min(97,Math.floor((i+1)/count*97));if(p!==last){progress(p);last=p;}if(i%12===0)await new Promise(resolve=>setTimeout(resolve,0));
  }
  source.close();await audioTask;if(audioError)throw audioError;signal.throwIfAborted();progress(98);await output.finalize();signal.throwIfAborted();progress(100);return {blob:new Blob([target.buffer!],{type:mp4?'video/mp4':'video/webm'}),extension:mp4?'mp4':'webm'};
 }catch(e){await output.cancel().catch(()=>{});throw e;}finally{signal.removeEventListener('abort',cancel);for(const [video,iterator] of iterators){setVideoFrame(video);await iterator.return().catch(()=>{});}inputs.forEach(input=>input.dispose());renderer.releaseAssets(assets);}
}
