const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,imports={},globals={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>imports[n]??require(n),console,performance,Map,WeakMap,Number,Math,Blob,AbortController,setTimeout,clearTimeout,...globals});return module.exports;}
test('Small playback drift does not repeatedly seek; large drift is corrected with a cooldown',()=>{
 let now=0,seeks=0,time=0;const p=load('lib/video-playback.ts',{}, {performance:{now:()=>now}}),v={get currentTime(){return time},set currentTime(t){time=t;seeks++},paused:false,readyState:4,playbackRate:1,pause(){this.paused=true},play:async()=>{}};
 for(let i=0;i<90;i++){now=i*33;p.syncVideo(v,.4,true)}assert.equal(seeks,0);
 p.syncVideo(v,4,true);assert.equal(seeks,1);p.syncVideo(v,9,true);assert.equal(seeks,1);now+=1900;p.syncVideo(v,9,true);assert.equal(seeks,2);
 p.syncVideo(v,9,false);assert.equal(v.paused,true);const frame={width:720,height:1280};p.setVideoFrame(v,frame);assert.equal(p.videoFrame(v),frame);p.setVideoFrame(v);assert.equal(p.videoFrame(v),v);
});
test('Export uses exact 30 fps even when rendering is slow, includes audio, and releases decoded frames',async()=>{
 const stamps=[],draws=[],decoded=[],progress=[];let released=0,disposed=0,finalized=0,audioAdded=0;const video={src:'/saved.mp4',duration:2},assets={video};const playback=load('lib/video-playback.ts');
 class Output{constructor(o){this.target=o.target}addVideoTrack(){}addAudioTrack(){}async start(){}async finalize(){this.target.buffer=new Uint8Array([1,2,3]).buffer;finalized++}async cancel(){}}
 class CanvasSource{async add(t,d){await new Promise(r=>setTimeout(r,2));stamps.push([t,d])}close(){}}
 class AudioBufferSource{async add(b){assert.equal(b,'audio');audioAdded++}close(){}}
 class Input{async getPrimaryVideoTrack(){return {canDecode:async()=>true,getFirstTimestamp:async()=>0}}dispose(){disposed++}}
 class CanvasSink{async *canvasesAtTimestamps(times){for(const t of times){const canvas={time:t};decoded.push(canvas);yield {canvas}}}}
 const bunny={Output,CanvasSource,AudioBufferSource,Input,CanvasSink,BufferTarget:class{},Mp4OutputFormat:class{},WebMOutputFormat:class{},BlobSource:class{},Quality:class{},ALL_FORMATS:[],canEncodeVideo:async()=>true,canEncodeAudio:async()=>true};
 const module=load('lib/offline-export.ts',{'mediabunny':bunny,'./voice-contract':{introDuration:()=>0,reelDuration:()=>1},'./full-film-renderer':{},'./video-playback':playback},{document:{fonts:{ready:Promise.resolve()},createElement:()=>({})},fetch:async()=>({ok:true,blob:async()=>new Blob(['source'])})});
 const result=await module.exportFrames({quality:720,music:'festive'},p=>progress.push(p),new AbortController().signal,{loadAssets:async()=>assets,releaseAssets:()=>released++,soundtrack:async()=>'audio',drawReel:(c,d,a,t)=>{draws.push(t);assert.equal(playback.videoFrame(video).time,t)}});
 assert.equal(stamps.length,30);for(let i=0;i<30;i++)assert.deepEqual(stamps[i],[i/30,1/30]);assert.equal(draws.length,30);assert.equal(decoded.length,30);assert.equal(audioAdded,1);assert.equal(finalized,1);assert.equal(released,1);assert.equal(disposed,1);assert.equal(playback.videoFrame(video),video);assert.equal(result.extension,'mp4');assert.equal(progress.at(-1),100);
});
