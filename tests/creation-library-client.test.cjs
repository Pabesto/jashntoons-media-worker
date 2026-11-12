const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map();
function load(file){file=path.resolve(root,file);if(cache.has(file))return cache.get(file);const module={exports:{}};cache.set(file,module.exports);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require(name){return name.startsWith('.')?load(path.relative(root,path.resolve(path.dirname(file),name+'.ts'))):require(name)},console},{filename:file});return module.exports;}
const {getTemplate,defaultInvite}=load('lib/templates.ts'),{selectLibraryAvatar,replaceCreationPhotos,creationPreviewKind,creationForReview}=load('lib/creation-library-client.ts');
const cast={id:'saved-cast-job',artId:'saved-cutout',sourcePhotos:['owned-reference-a','owned-reference-b'],created:1,styleId:'watercolor',label:'Our people'};
const source=()=>({...defaultInvite(getTemplate('reference-shaadi-haveli')),names:'Mira & Dev',venue:'Our garden',date:'2027-04-18',creation:{format:'film',voice:'none',consent:false,language:'english'}});

test('Choosing an older avatar preserves exact source template, event details and footage duration',()=>{
 const before={...source(),duration:52,photos:['other-person'],generatedArt:'old-art',generatedVideo:'old-movie',pendingCreationId:'old-pending',pendingGenerationId:'old-legacy',generationJobId:'old-legacy',directedReel:{jobId:'old-job',artId:'old-art',videoId:'old-movie',duration:30,hasSpeech:false},talkingClip:{videoId:'old-speaking'}};
 const next=selectLibraryAvatar(before,cast);
 assert.equal(next.templateId,before.templateId);assert.equal(next.duration,52);assert.equal(next.names,before.names);assert.equal(next.venue,before.venue);assert.equal(next.date,before.date);
 assert.equal(next.creation.selectedAvatarId,cast.id);assert.equal(next.creation.styleId,cast.styleId);assert.equal(next.generatedArt,cast.artId);assert.deepEqual([...next.photos],cast.sourcePhotos);
 for(const key of ['generatedVideo','pendingCreationId','pendingGenerationId','generationJobId','directedReel','talkingClip'])assert.equal(next[key],undefined,key+' belongs to the previous result');
 assert.equal(before.generatedVideo,'old-movie');assert.equal(before.photos[0],'other-person');assert.notEqual(next.photos,cast.sourcePhotos);
});

test('Missing original attribution cannot invent replacement reference photos',()=>{
 assert.throws(()=>selectLibraryAvatar(source(),{...cast,sourcePhotos:[]}),/original photos.*unavailable/);
});

test('Adding or removing a photo clears saved-cast selection before a new quote',()=>{
 const chosen=selectLibraryAvatar(source(),cast),next=replaceCreationPhotos(chosen,['new-person']);
 assert.equal(next.creation.selectedAvatarId,undefined);assert.equal(next.generatedArt,undefined);assert.equal(next.templateId,chosen.templateId);assert.deepEqual([...next.photos],['new-person']);
 assert.equal(chosen.creation.selectedAvatarId,cast.id);assert.equal(chosen.generatedArt,cast.artId);
});

test('Changing references keeps a completed previous take available without reusing its selected avatar',()=>{
 const chosen=selectLibraryAvatar(source(),cast),result={jobId:'complete',artId:cast.artId,videoId:'complete-video',duration:52,hasSpeech:false,sourcePhotos:cast.sourcePhotos};
 const before={...chosen,directedReel:result,generatedVideo:result.videoId},next=replaceCreationPhotos(before,['new-person']);
 assert.equal(next.creation.selectedAvatarId,undefined);assert.equal(next.directedReel,result);assert.equal(next.generatedVideo,result.videoId);assert.deepEqual([...next.photos],['new-person']);
});

test('A saved avatar or failed edit never masquerades as a completed source film',()=>{
 const chosen=selectLibraryAvatar(source(),cast);
 assert.equal(creationPreviewKind(chosen),'reference');
 assert.equal(creationPreviewKind({...source(),pendingCreationId:'processing'},'partially-created-art'),'reference');
 assert.equal(creationPreviewKind({...chosen,creation:{...chosen.creation,format:'template'},directedReel:{jobId:'fallback',artId:cast.artId,duration:52,hasSpeech:false}}),'reference');
 assert.equal(creationPreviewKind({...chosen,generatedVideo:'edited-video',directedReel:{jobId:'ready',artId:cast.artId,videoId:'edited-video',duration:52,hasSpeech:false,referenceEdit:true,sourceReferenceId:'shaadi-haveli',sourcePhotos:cast.sourcePhotos}}),'reel');
});

test('An old 30-second adaptation or unrelated completed source cannot impersonate the selected full film',()=>{
 const chosen=selectLibraryAvatar(source(),cast),old={...chosen,generatedVideo:'old-30s',directedReel:{jobId:'old',artId:cast.artId,videoId:'old-30s',duration:30,hasSpeech:false,sourceTemplateId:chosen.templateId,sourcePhotos:cast.sourcePhotos}};
 assert.equal(creationPreviewKind(old),'reference');
 const current={...old,generatedVideo:'full-edit',directedReel:{...old.directedReel,videoId:'full-edit',duration:52,referenceEdit:true,sourceReferenceId:'shaadi-haveli'}};
 assert.equal(creationPreviewKind(current),'reel');
 assert.equal(creationPreviewKind({...current,templateId:'reference-royal-doors'}),'reference');
 assert.equal(creationPreviewKind({...current,photos:['different-person']}),'reference');
 assert.equal(creationPreviewKind({...current,directedReel:{...current.directedReel,sourcePhotos:undefined}}),'reference');
 assert.equal(creationPreviewKind({...current,generatedVideo:'different-file'}),'reference');
 assert.equal(old.generatedVideo,'old-30s','the earlier file remains saved');
});

test('Legacy source-template drafts request the full-film quote only on explicit review and preserve earlier assets',()=>{
 const old={...source(),creation:{...source().creation,format:'template'},generatedArt:'saved-art',generatedVideo:'previous-adaptation'};
 const next=creationForReview(old);
 assert.equal(next.creation.format,'film');assert.equal(next.templateId,old.templateId);assert.equal(next.generatedArt,'saved-art');assert.equal(next.generatedVideo,'previous-adaptation');
 assert.equal(old.creation.format,'template');assert.equal(creationPreviewKind(next),'reference');
 const pending={...old,pendingCreationId:'in-flight'};assert.equal(creationForReview(pending),pending);
 const card={...old,creation:{...old.creation,format:'card'}};assert.equal(creationForReview(card),card);
 const avatar={...old,creation:{...old.creation,format:'image'}};assert.equal(creationForReview(avatar),avatar);
 const original={...old,templateId:'jungle-birthday'};assert.equal(creationForReview(original),original);
});

test('Original invitation-direction films keep their source preview as well',()=>{
 const chosen=selectLibraryAvatar({...source(),templateId:'invitation-sunehri-darwaze'},cast);
 assert.equal(creationPreviewKind(chosen),'reference');
});

test('Avatar-only and card outputs remain honest standalone previews',()=>{
 const chosen=selectLibraryAvatar(source(),cast);
 assert.equal(creationPreviewKind({...chosen,creation:{...chosen.creation,format:'image'}}),'portrait');
 assert.equal(creationPreviewKind({...chosen,creation:{...chosen.creation,format:'card'}}),'card');
 assert.equal(creationPreviewKind({...source(),creation:{...source().creation,format:'image'}}),'style');
});

test('Studio templates use their saved artwork result in the original renderer, not an older AI movie',()=>{
 const draft={...defaultInvite(getTemplate('studio-wedding-01')),photos:cast.sourcePhotos,generatedArt:cast.artId,creation:{...source().creation,format:'template'}};
 assert.equal(creationPreviewKind(draft),'reference');
 const result={jobId:'render-ready',artId:cast.artId,duration:draft.duration,hasSpeech:false,sourcePhotos:cast.sourcePhotos,sourceTemplateId:draft.templateId};
 assert.equal(creationPreviewKind({...draft,directedReel:result}),'reel');
 assert.equal(creationPreviewKind({...draft,directedReel:{...result,videoId:'old-adaptation'},generatedVideo:'old-adaptation'}),'reference');
 assert.equal(creationPreviewKind({...draft,directedReel:result,photos:['different-person']}),'reference');
 assert.equal(creationPreviewKind({...draft,directedReel:result,templateId:'studio-birthday-01'}),'reference');
});

test('Review preserves explicit movement or avatar-template choice and never silently downgrades movement',()=>{
 const template=getTemplate('studio-wedding-01'),defaults=defaultInvite(template),old={...defaults,creation:{...source().creation,format:'film'},scenes:['opening','events','closing'],photos:cast.sourcePhotos,generatedArt:cast.artId,generatedVideo:'old-adaptation'};
 const next=creationForReview(old);assert.equal(next,old);assert.equal(next.creation.format,'film');assert.deepEqual([...next.scenes],['opening','events','closing']);assert.equal(next.generatedArt,cast.artId);assert.equal(next.generatedVideo,'old-adaptation');assert.equal(creationPreviewKind(next),'portrait');
 const advanced={...old,creation:{...old.creation,regenerationId:'explicit-new-scene'}};
 assert.equal(creationForReview(advanced),advanced);assert.equal(creationPreviewKind(advanced),'portrait');
 const avatarTemplate={...old,creation:{...old.creation,format:'template'}};assert.equal(creationForReview(avatarTemplate),avatarTemplate);
});
