const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),manifest=require('../lib/reel-streams.json');
const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/reel-playback.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports:m.exports,require:()=>manifest});
const {reelPlaybackSource,reelWindow,reelIndexAt}=m.exports;
test('Playback stays bounded while scrolling through the complete catalog',()=>{
 for(let i=0;i<187;i++){const w=reelWindow(i,187);assert.ok(w.start<=i&&w.end>i);assert.ok(w.end-w.start<=3);assert.ok(w.start>=0&&w.end<=187);assert.equal(reelIndexAt(i*852,852,187),i);}
 assert.equal(reelIndexAt(-200,852,187),0);assert.equal(reelIndexAt(999999,852,187),186);assert.equal(reelIndexAt(200,0,187),0);
 assert.equal(reelPlaybackSource('/unmapped.mp4'),'/unmapped.mp4');
});
test('Browsing copies are smaller, fast-start, and preserve original video and audio durations',async()=>{
 const {Input,BufferSource,ALL_FORMATS}=await import('mediabunny');
 for(const [source,entry] of Object.entries(manifest)){
  assert.equal(reelPlaybackSource(source),entry.video);assert.ok(entry.video.startsWith('/reel-streams/'));
  const original=fs.readFileSync(path.join(root,'public',source)),preview=fs.readFileSync(path.join(root,'public',entry.video));
  assert.equal(preview.length,entry.bytes);assert.equal(original.length,entry.sourceBytes);assert.ok(preview.length<original.length*.9);
  let offset=0,moov=-1,mdat=-1;while(offset+8<=preview.length){const size=preview.readUInt32BE(offset),type=preview.toString('ascii',offset+4,offset+8);if(type==='moov')moov=offset;if(type==='mdat')mdat=offset;assert.ok(size>=8);offset+=size;}assert.ok(moov>=0&&moov<mdat,source+' fast start');
  const a=new Input({source:new BufferSource(original),formats:ALL_FORMATS}),b=new Input({source:new BufferSource(preview),formats:ALL_FORMATS});
  try{const av=await a.getPrimaryVideoTrack(),bv=await b.getPrimaryVideoTrack();assert.ok(av&&bv);assert.equal(bv.displayWidth,540);assert.equal(bv.displayHeight,960);assert.ok(Math.abs(await a.computeDuration([av])-await b.computeDuration([bv]))<.1,source+' duration');assert.equal(!!await a.getPrimaryAudioTrack(),!!await b.getPrimaryAudioTrack(),source+' sound');}finally{a.dispose();b.dispose();}
 }
});
