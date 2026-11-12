// Original synthesized rhythms. No external recordings or licensed songs.
export async function studioScore(duration:number,kind:'dhol'|'party'){
 const rate=44100,ctx=new OfflineAudioContext(2,rate*duration,rate),master=ctx.createGain();
 master.gain.setValueAtTime(.6,0);master.gain.setValueAtTime(.6,Math.max(0,duration-1.5));master.gain.linearRampToValueAtTime(0,duration);master.connect(ctx.destination);
 const step=60/(kind==='dhol'?104:116)/2;
 const drum=(at:number,low:boolean)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(low?145:380,at);o.frequency.exponentialRampToValueAtTime(low?48:150,at+.14);g.gain.setValueAtTime(low?.4:.18,at);g.gain.exponentialRampToValueAtTime(.001,at+(low?.27:.11));o.connect(g).connect(master);o.start(at);o.stop(Math.min(duration,at+.28));};
 const noise=ctx.createBuffer(1,rate*.08,rate),samples=noise.getChannelData(0);let seed=42;for(let i=0;i<samples.length;i++){seed=(seed*16807)%2147483647;samples[i]=(seed/2147483647*2-1)*(1-i/samples.length);}
 for(let i=0;i*step<duration-.3;i++){const at=i*step;drum(at,kind==='dhol'?[0,3,4,6].includes(i%8):i%2===0);const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=noise;filter.type='highpass';filter.frequency.value=kind==='dhol'?1400:5000;gain.gain.value=kind==='dhol'?.1:.06;source.connect(filter).connect(gain).connect(master);source.start(at+step*.5);
  if(i%4===0){const tone=ctx.createOscillator(),volume=ctx.createGain();tone.type='triangle';tone.frequency.value=[392,440,523.25,587.33][Math.floor(i/4)%4];volume.gain.setValueAtTime(.025,at);volume.gain.exponentialRampToValueAtTime(.001,Math.min(duration,at+.8));tone.connect(volume).connect(master);tone.start(at);tone.stop(Math.min(duration,at+.8));}
 }
 return ctx.startRendering();
}
