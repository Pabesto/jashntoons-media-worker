import {syncVideo,videoFrame} from './video-playback';
import type {Invite} from './templates';
import {getTemplate,prettyDate} from './templates';
export function drawTalking(canvas:HTMLCanvasElement,data:Invite,video:HTMLVideoElement,seconds:number,playing:boolean){
 const c=canvas.getContext('2d')!,t=getTemplate(data.templateId),target=Math.max(0,Math.min(seconds,Math.max(0,video.duration-.05)));
 syncVideo(video,target,playing&&seconds<video.duration);
 c.save();c.setTransform(canvas.width/720,0,0,canvas.height/1280,0,0);c.globalAlpha=1;c.fillStyle=t.bg;c.fillRect(0,0,720,1280);
 c.strokeStyle=data.accent;c.lineWidth=2;c.strokeRect(24,24,672,1232);c.fillStyle=t.ink;c.textAlign='center';c.textBaseline='middle';
 c.font='500 17px "DM Sans", Arial';c.fillText('A LITTLE MESSAGE, IN MY VOICE',360,92,600);
 c.font='600 44px Fraunces, Georgia';c.fillText(data.names||'You are invited',360,160,610);
 const w=video.videoWidth||720,h=video.videoHeight||720,scale=Math.min(644/w,800/h),dw=w*scale,dh=h*scale;
 c.save();c.beginPath();c.roundRect((720-dw)/2,240+(800-dh)/2,dw,dh,24);c.clip();c.drawImage(videoFrame(video),(720-dw)/2,240+(800-dh)/2,dw,dh);c.restore();
 c.font='500 23px "DM Sans", Arial';c.fillText(data.headline||'Join us for our celebration',360,1100,620);c.font='500 21px "DM Sans", Arial';c.fillText(prettyDate(data.date),360,1150,600);
 c.globalAlpha=.65;c.font='400 14px "DM Sans", Arial';c.fillText('JASHNTOONS · AI VOICE & LIP-SYNC',360,1210,620);c.restore();
}
