const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts')):require(n),console,Error});return module.exports;}
const m=load('lib/ai-moments.ts'),t=load('lib/templates.ts');
test('Every occasion has ten unique body-action prompts and all styles fit the video API contract',()=>{
 assert.equal(m.momentCollections.length,14);assert.equal(m.momentPresets.length,140);assert.equal(m.momentStyles.length,10);assert.equal(new Set(m.momentPresets.map(x=>x.id)).size,140);assert.equal(new Set(m.momentPresets.map(x=>x.action)).size,140);
 for(const c of m.momentCollections){assert.equal(c.moments.length,10);assert.ok(t.templates.some(t=>t.studio&&t.category===c.name));for(const p of c.moments)for(const s of m.momentStyles){const prompts=m.momentPrompts({presetId:p.id,styleId:s.id,direction:'x'.repeat(120)});assert.ok(prompts.motion.length<=1000,p.id);assert.ok(prompts.image.includes(s.prompt));assert.ok(prompts.motion.includes(p.action));assert.match(prompts.image,/ONLY the people or characters/);assert.match(prompts.image,/BEFORE the action/);assert.match(prompts.motion,/Natural articulated body movement/);}}
});
test('Moment edits reset old media, preserve photos/details, and restored results keep the chosen action',()=>{
 const data={...t.defaultInvite(t.getTemplate('studio-birthday-01')),photos:['my-photo'],names:'My person',generatedArt:'old-art',generatedVideo:'old-video',generationJobId:'old-job'};
 const selection=m.defaultMoment('Birthday'),next=m.momentDraft(data,selection);assert.equal(next.duration,10);assert.equal(next.generatedVideo,undefined);assert.equal(next.generatedArt,undefined);assert.equal(next.generationJobId,undefined);assert.equal(next.photos[0],'my-photo');assert.equal(next.names,'My person');assert.equal(next.aiMotion,true);
 const result=load('lib/avatar-state.ts').applyAvatar(next,{id:'new-job',generatedArt:'new-art',generatedVideo:'new-video',avatarMode:'scene',templateId:data.templateId,aiMoment:selection});assert.equal(result.aiMoment.presetId,selection.presetId);assert.equal(result.generatedVideo,'new-video');assert.equal(load('lib/creator-flow.ts').firstCreatorTool(next),'Moments');assert.equal(load('lib/creator-flow.ts').firstCreatorTool(result),'Details');
});
test('Draft validation rejects unknown action/style and overlong prompts before billing',()=>{
 const schema=load('lib/validation.ts').draftInviteSchema,data=m.momentDraft(t.defaultInvite(t.getTemplate('studio-wedding-01')),m.defaultMoment('Wedding'));
 assert.ok(schema.safeParse(data).success);for(const patch of [{presetId:'unknown'},{styleId:'unknown'},{direction:'x'.repeat(121)},{motionPrompt:'x'.repeat(801)}])assert.equal(schema.safeParse({...data,aiMoment:{...data.aiMoment,...patch}}).success,false);
 const prompt=m.momentPrompts({...data.aiMoment,motionPrompt:'The people wave together, then lower their hands.'});assert.match(prompt.motion,/wave together/);assert.match(prompt.motion,/Preserve the exact identities/);
});
