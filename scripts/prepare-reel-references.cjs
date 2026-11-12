// Build the <=60s reference editions and immutable provider parts. The source
// library and old paid projects are left untouched. Upload parts separately.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),vm=require('vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),ffmpeg=path.join(root,'outputs/tools/ffmpeg.exe'),cache=new Map();
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require(name){return name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name)},console,URL,crypto,Uint8Array,TextEncoder,TextDecoder},{filename:file});return module.exports;}
const {templates}=load('lib/templates.ts'),{reelSource,REEL_EXPERIENCE}=load('lib/reel-experience.ts'),{referenceEditSource,referenceAssetKey,referenceAssetName}=load('lib/reference-edit-contract.ts');
const manifest=[];fs.mkdirSync(path.join(root,'public/reel-references'),{recursive:true});fs.mkdirSync(path.join(root,'outputs/reel-reference-parts'),{recursive:true});
function run(args){const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{windowsHide:true,encoding:'utf8',maxBuffer:1000000});if(r.status!==0)throw Error(r.stderr);}
for(const t of templates){const reel=reelSource(t);if(!reel)continue;const input=path.join(root,'public',reel.url);
 if(t.referenceFilm&&reel.prepared&&reel.seconds===60&&!fs.existsSync(input)){const source=load('lib/reference-films.ts').referenceFilm(t.referenceFilm),seconds=t.referenceFilm==='wedding-street'?2249/30:source.seconds;run(['-i',path.join(root,'public/reference-films',source.id+'.mp4'),'-an','-vf',`setpts=${60/seconds}*PTS,scale=720:1280,fps=30`,'-t','60','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',input]);console.log('Prepared 60s edition: '+t.id);}
 const source=referenceEditSource({templateId:t.id,creation:{experience:REEL_EXPERIENCE,format:'film',voice:'none',consent:false,language:'hinglish'}});
 if(!source||source.direct||source.assetSourceId!==source.id)continue;
 for(const segment of source.segments){const name=source.id+'-'+referenceAssetName(segment.index),file=path.join(root,'outputs/reel-reference-parts',name);if(!fs.existsSync(file))run(['-ss',String(segment.start),'-i',input,'-t',String(segment.seconds),'-an','-vf','scale=720:1280,fps=30','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',file]);manifest.push({key:referenceAssetKey(source.id,referenceAssetName(segment.index)),file,seconds:segment.seconds,size:fs.statSync(file).size});}
 console.log('Prepared exact source parts: '+t.id);
}
fs.writeFileSync(path.join(root,'outputs/reel-reference-parts.json'),JSON.stringify(manifest,null,2));console.log('Provider parts: '+manifest.length);
