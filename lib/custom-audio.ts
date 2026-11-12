import type {Invite} from './templates';
export async function prepareAudio(file:File){
 if(file.size>12000000)throw Error('Choose an audio file under 12 MB.');
 const ctx=new AudioContext();let decoded:AudioBuffer;
 try{decoded=await ctx.decodeAudioData(await file.arrayBuffer());}catch{throw Error('This audio could not be read. Try MP3, WAV or M4A.');}finally{await ctx.close();}
 if(decoded.duration<.5||decoded.duration>60)throw Error('Choose a voice recording or song clip between 0.5 and 60 seconds.');
 const rate=24000,offline=new OfflineAudioContext(1,Math.ceil(decoded.duration*rate),rate),source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start();const rendered=await offline.startRendering(),samples=rendered.getChannelData(0),bytes=new ArrayBuffer(44+samples.length*2),v=new DataView(bytes);
 const ascii=(at:number,s:string)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};ascii(0,'RIFF');v.setUint32(4,36+samples.length*2,true);ascii(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);ascii(36,'data');v.setUint32(40,samples.length*2,true);samples.forEach((n,i)=>v.setInt16(44+i*2,Math.max(-1,Math.min(1,n))*(n<0?32768:32767),true));return new File([bytes],'soundtrack.wav',{type:'audio/wav'});
}
export async function ownSoundtrack(data:Invite){
 if(!data.customAudio)throw Error('Choose your audio first.');const r=await fetch('/api/media?id='+encodeURIComponent(data.customAudio.id));if(!r.ok)throw Error('Your saved audio could not load. Please upload it again.');
 const offline=new OfflineAudioContext(2,Math.ceil(44100*data.duration),44100),buffer=await offline.decodeAudioData(await r.arrayBuffer()),source=offline.createBufferSource(),gain=offline.createGain();
 const start=Math.max(0,Math.min(data.customAudio.start,buffer.duration-.01)),play=Math.min(data.duration,buffer.duration-start);source.buffer=buffer;gain.gain.setValueAtTime(1,0);gain.gain.setValueAtTime(1,Math.max(0,play-.25));gain.gain.linearRampToValueAtTime(0,play);source.connect(gain).connect(offline.destination);source.start(0,start,play);return offline.startRendering();
}
