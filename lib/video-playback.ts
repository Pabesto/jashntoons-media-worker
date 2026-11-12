// Decoded export frames use the same composition as the live editor.
const frames=new WeakMap<HTMLVideoElement,CanvasImageSource>();
export const videoFrame=(video:HTMLVideoElement):CanvasImageSource=>frames.get(video)??video;
export function setVideoFrame(video:HTMLVideoElement,frame?:CanvasImageSource){if(frame)frames.set(video,frame);else frames.delete(video);}
const corrections=new WeakMap<HTMLVideoElement,number>();
export function syncVideo(video:HTMLVideoElement,target:number,playing:boolean,rate=1){
 if(!playing){if(!video.paused)video.pause();return;}
 if(!Number.isFinite(target)||video.seeking)return;
 const now=performance.now(),drift=Math.abs(video.currentTime-target);
 // Small clock drift must not trigger a new network seek on every frame.
 if(drift>1.25&&now-(corrections.get(video)??-Infinity)>1800){video.currentTime=target;corrections.set(video,now);}
 if(Math.abs(video.playbackRate-rate)>.01)video.playbackRate=rate;
 if(video.paused&&video.readyState>=2)void video.play().catch(()=>{});
}
