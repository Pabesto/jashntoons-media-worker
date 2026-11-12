const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const m={exports:{}};cache.set(file,m.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require(name){return name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name)}});return m.exports;}

test('Every published reference has a poster and real video matching its quoted frame duration',async()=>{
 const {Input,BufferSource,ALL_FORMATS}=await import('mediabunny');
 for(const reel of load('lib/reel-feed.ts').reelFeed){
  assert.ok(fs.statSync(path.join(root,'public',reel.poster)).size>0,reel.id+' poster');
  const input=new Input({source:new BufferSource(fs.readFileSync(path.join(root,'public',reel.video))),formats:ALL_FORMATS});
  // Old 24fps previews can retain a <0.1s trailing hold. The prepared 30fps
  // provider parts are checked separately against the stricter assembly limit.
  try{const track=await input.getPrimaryVideoTrack();assert.ok(track,reel.id+' video');const duration=await input.computeDuration([track]);assert.ok(duration<=60,reel.id+' exceeds one minute');assert.ok(Math.abs(duration-reel.seconds)<=.1,`${reel.id}: quoted ${reel.seconds}, actual ${duration}`);}
  finally{input.dispose();}
 }
});
