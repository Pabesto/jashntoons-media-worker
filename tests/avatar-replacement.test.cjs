const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');

test('Live AI frames draw the new background and preserve the original moving video without reloading it',async()=>{
 const h=harness(),t=h.load('lib/templates.ts'),style=h.load('lib/live-style.ts'),r=h.load('lib/reel-renderer.ts'),background=h.load('lib/studio-backgrounds.ts').studioBackgrounds[0];
 const data={...t.defaultInvite(t.getTemplate('studio-wedding-01')),names:'Mira & Dev',date:'2027-02-14',venue:'Garden',generatedArt:'my-art',generatedVideo:'my-video',avatarMode:'scene',creation:{format:'film',voice:'none',consent:false,language:'english'},directedReel:{jobId:'my-job',artId:'my-art',videoId:'my-video',hasSpeech:false,duration:30}};
 const original=await r.loadAssets(data),changed=style.withLiveBackground(data,background.id),framed=await r.loadAssets(changed,original);
 assert.equal(framed.video,original.video);assert.equal(h.videos.length,1);assert.equal(changed.directedReel,data.directedReel);assert.equal(changed.editor.videoLayout,'arch');
 original.video.paused=false;r.releaseAssets(original,framed);assert.equal(framed.video.paused,false);
 r.drawReel(h.canvas,changed,framed,2,true);assert.ok(h.draws.some(x=>x[0].src===background.src));assert.ok(h.draws.some(x=>x[0]===original.video&&x[3]<720&&x[4]<1280));
 const swapped=style.liveTemplate(changed,t.getTemplate('studio-birthday-01'));assert.equal(swapped.generatedVideo,data.generatedVideo);assert.equal(swapped.templateId,data.templateId);assert.equal(swapped.editor.videoTemplateId,'studio-birthday-01');
 h.draws.length=0;r.drawReel(h.canvas,{...swapped,editor:{...swapped.editor,videoLayout:'full'}},framed,2);assert.ok(h.draws.some(x=>x[0]===original.video&&x[3]===720&&x[4]===1280));
});

test('A live layered-template switch keeps the paid personal character and renders the new design',async()=>{
 const h=harness(),t=h.load('lib/templates.ts'),r=h.load('lib/reel-renderer.ts'),style=h.load('lib/live-style.ts');
 const data={...t.defaultInvite(t.getTemplate('studio-wedding-01')),names:'My story',generatedArt:'personal-cutout',avatarMode:'cutout',generationJobId:'paid-job',duration:40,photos:['original-reference']};
 const next=style.liveTemplate(data,t.getTemplate('studio-birthday-01'));assert.equal(next.templateId,'studio-birthday-01');assert.equal(next.generatedArt,'personal-cutout');assert.equal(next.generationJobId,'paid-job');assert.equal(next.names,data.names);assert.equal(next.duration,40);assert.equal(next.photos,data.photos);
 const assets=await r.loadAssets(next);r.drawReel(h.canvas,next,assets,2);assert.ok(h.draws.some(x=>x[0].src==='/api/media?id=personal-cutout'));assert.ok(h.draws.some(x=>x[0].src.includes('birthday')));
});
function harness(){
 const loaded=[],videos=[],cache=new Map();
 class Image{width=720;height=1280;set src(v){this._src=v;loaded.push(v);queueMicrotask(()=>this.onload());}get src(){return this._src;}}
 const document={createElement(tag){assert.equal(tag,'video');const v={readyState:2,videoWidth:720,videoHeight:1280,duration:10,currentTime:0,paused:true,seeking:false,
  set src(s){this._src=s;loaded.push(s);queueMicrotask(()=>this.onloadeddata());},get src(){return this._src;},
  async play(){this.paused=false;},pause(){this.paused=true;},removeAttribute(){},load(){}};videos.push(v);return v;}};
 function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require(name){if(name.startsWith('.'))return load(path.relative(root,path.resolve(path.dirname(file),name+'.ts')));return require(name);},Image,document,setTimeout,clearTimeout,console,performance},{filename:file});return module.exports;
 }
 const draws=[],texts=[],gradient={addColorStop(){}};
 const context=new Proxy({fillText:(text)=>texts.push(text),drawImage:(...args)=>draws.push(args),measureText:s=>({width:s.length*12}),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get(o,k){return k in o?o[k]:()=>{};}});
 return {load,loaded,videos,draws,texts,canvas:{width:720,height:1280,getContext:()=>context}};
}

test('Replacing references does not reuse the original people, including a single new photo',()=>{
 const h=harness(),{defaultInvite,getTemplate}=h.load('lib/templates.ts'),{avatarPhotos}=h.load('lib/avatar-state.ts');
 const d={...defaultInvite(getTemplate('jungle-birthday')),photos:['old-person-1','old-person-2','gallery']};
 assert.deepEqual([...avatarPhotos(d,['new-person'],true).photos],['new-person']);
 assert.deepEqual([...avatarPhotos(d,['new-person-1','new-person-2'],true).photos],['new-person-1','new-person-2']);
 assert.deepEqual([...avatarPhotos(d,['gallery-2'],false).photos],[...d.photos,'gallery-2']);
 assert.equal(d.photos.length,3);
});

test('Applying a saved avatar makes it visible and removes the previous video while keeping scene edits',()=>{
 const h=harness(),t=h.load('lib/templates.ts'),{applyAvatar}=h.load('lib/avatar-state.ts');
 const d=t.defaultInvite(t.getTemplate('haveli-celebration'));
 d.generatedVideo='old-video';d.pendingGenerationId='old-job';d.editor={...d.editor,avatarVisible:false,avatarScale:.3,avatarX:0,avatarY:20,filter:'warm',sceneEdits:{opening:{title:'Our own title'}}};
 const next=applyAvatar(d,{id:'new-job',generatedArt:'new-avatar',avatarMode:'cutout'});
 assert.equal(next.generatedArt,'new-avatar');assert.equal(next.generatedVideo,undefined);assert.equal(next.pendingGenerationId,undefined);
 assert.equal(next.editor.avatarVisible,true);assert.equal(next.editor.avatarScale,1);assert.equal(next.editor.avatarX,50);
 assert.equal(next.editor.filter,'warm');assert.equal(next.editor.sceneEdits.opening.title,'Our own title');
});

test('Every template replaces stock characters in every scene in the shared preview/export renderer',async()=>{
 const h=harness(),t=h.load('lib/templates.ts'),r=h.load('lib/reel-renderer.ts'),{filmTimeline}=h.load('lib/full-films.ts');
 for(const template of t.templates){
  for(const mode of ['cutout','scene']){
   h.loaded.length=0;const data={...t.defaultInvite(template),generatedArt:'replacement-'+template.id+'-'+mode,avatarMode:mode};
   const assets=await r.loadAssets(data);
   assert.equal(assets.film,undefined,template.id);assert.equal(assets.cinema,undefined,template.id);
   assert.ok(h.loaded.every(src=>!/^\/(full-films|worlds|cinema|art)\//.test(src)),template.id+' requested a stock character asset');
   for(const scene of filmTimeline(data)){
    h.draws.length=0;r.drawReel(h.canvas,data,assets,scene.start+scene.duration*.5,true);
    const own=h.draws.filter(d=>d[0].src==='/api/media?id='+data.generatedArt);
    assert.ok(own.length,template.id+'/'+mode+'/'+scene.kind+' omitted the replacement');
    if(mode==='scene'){assert.ok(h.draws.every(d=>d[0].src==='/api/media?id='+data.generatedArt||d[0].src.startsWith('/studio/props/')));assert.ok(own[0][3]>=720&&own[0][4]>=1280,'A generated scene must fill the frame, not a portrait window');}
   }
  }
 }
});

test('Personal video plays across scenes; changing to a cutout cannot load the old video',async()=>{
 const h=harness(),t=h.load('lib/templates.ts'),r=h.load('lib/reel-renderer.ts');
 const data={...t.defaultInvite(t.getTemplate('royal-garden')),generatedArt:'my-scene',generatedVideo:'my-video',avatarMode:'scene'};
 const a=await r.loadAssets(data);r.drawReel(h.canvas,data,a,12,true);
 assert.equal(a.video.paused,false);assert.equal(a.video.currentTime,2);assert.ok(h.draws.some(d=>d[0]===a.video&&d[3]>=720&&d[4]>=1280));
 r.drawReel(h.canvas,data,a,12,false);assert.equal(a.video.paused,true);
 const count=h.videos.length,b=await r.loadAssets({...data,avatarMode:'cutout'});
 assert.equal(b.video,undefined);assert.equal(h.videos.length,count);
});

test('Unpersonalised demo films keep their original scenes',async()=>{
 const h=harness(),t=h.load('lib/templates.ts'),r=h.load('lib/reel-renderer.ts');
 const a=await r.loadAssets(t.defaultInvite(t.getTemplate('haveli-celebration')));
 assert.ok(a.film);assert.equal(a.catalog,false);assert.ok(h.loaded.some(s=>s.endsWith('/arrival.mp4')));
});


test('Simple creator starts with photos and resumes a completed avatar at the reel details',()=>{
 const h=harness(),t=h.load('lib/templates.ts'),f=h.load('lib/creator-flow.ts');
 const d=t.defaultInvite(t.getTemplate('studio-wedding-01'));
 assert.equal(f.firstCreatorTool(d),'Avatar');
 assert.equal(f.firstCreatorTool({...d,generatedArt:'saved-avatar'}),'Details');
 assert.equal(f.firstCreatorTool({...d,generatedArt:'old-avatar',pendingGenerationId:'in-flight'}),'Avatar');
 const custom=t.defaultInvite(t.getTemplate('haveli-namaste'));
 assert.equal(f.personalReelReady({...custom,generatedArt:'image-only'}),false);
 assert.equal(f.personalReelReady({...custom,generatedVideo:'finished-video'}),true);
});

test('Live preview reuses loaded media for edits and reloads changed characters, props and scene backgrounds',()=>{
 const h=harness(),t=h.load('lib/templates.ts'),f=h.load('lib/creator-flow.ts');
 const d=t.defaultInvite(t.getTemplate('studio-wedding-01')),key=f.previewAssetKey(d);
 assert.equal(f.previewAssetKey({...d,names:'Riya',accent:'#ff0000',editor:{...d.editor,filter:'warm',avatarX:30}}),key);
 for(const patch of [{generatedArt:'new-avatar'},{propId:'new-prop'},{backgroundId:'new-background'},{editor:{...d.editor,sceneEdits:{opening:{background:'different-scene'}}}}])assert.notEqual(f.previewAssetKey({...d,...patch}),key);
 for(const field of ['names','date','time','venue','headline','family','message','rsvp'])assert.ok(d.scenes.includes(f.detailScene(d,field)));
});

test('Name and scene text edits redraw on the same personal avatar without another media load',async()=>{
 const h=harness(),t=h.load('lib/templates.ts'),r=h.load('lib/reel-renderer.ts'),{filmTimeline}=h.load('lib/full-films.ts');
 const d={...t.defaultInvite(t.getTemplate('studio-wedding-01')),names:'Riya',generatedArt:'saved-avatar',avatarMode:'cutout'};
 const assets=await r.loadAssets(d),requests=h.loaded.length,opening=filmTimeline(d)[0];
 r.drawReel(h.canvas,d,assets,opening.start+opening.duration*.5);
 assert.ok(h.texts.some(text=>text.includes('Riya')));
 h.texts.length=0;
 const edited={...d,editor:{...d.editor,sceneEdits:{[opening.kind]:{title:'Our celebration',subtitle:'Join us'}}}};
 r.drawReel(h.canvas,edited,assets,opening.start+opening.duration*.5);
 assert.ok(h.texts.some(text=>text.includes('Our celebration')));
 assert.ok(h.texts.some(text=>text.includes('Join us')));
 assert.equal(h.loaded.length,requests);
});
