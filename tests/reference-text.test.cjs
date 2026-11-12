const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),code=ts.transpileModule(fs.readFileSync(path.join(root,'lib/reference-text.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const moduleObject={exports:{}};vm.runInNewContext(code,{module:moduleObject,exports:moduleObject.exports,require(name){if(name==='./reference-timeline'){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/reference-timeline.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports});return m.exports;}if(name==='./templates')return {prettyDate:value=>value};if(name==='./editor-settings')return {settings:data=>({videoLayout:'full',...data.editor,sceneEdits:data.editor?.sceneEdits??{}})};throw Error(name);}});
const {usesReferenceText,referenceTextPlan,drawReferenceText}=moduleObject.exports;
const data={names:'Mira & Dev',headline:'Our wedding story',family:'The Sharma & Kapoor families',date:'2027-02-14',time:'6:00 PM',venue:'Rosewood Garden, Jaipur',message:'Come celebrate with us',rsvp:'RSVP: Mira — 9876500000',font:'classic',directedReel:{referenceEdit:true,sourceReferenceId:'shaadi-haveli',duration:52},events:Array.from({length:6},(_,i)=>({title:'Event '+(i+1),detail:'Venue '+(i+1)+' · 4:00 PM'}))};
const texts=plan=>plan.panels.flatMap(panel=>panel.blocks.map(block=>block.text));

test('Only the measured Shaadi reference edit in full layout activates source text',()=>{
 assert.equal(usesReferenceText(data),true);
 for(const changed of [{...data,directedReel:undefined},{...data,directedReel:{...data.directedReel,referenceEdit:false}},{...data,directedReel:{...data.directedReel,sourceReferenceId:'royal-door'}},...['arch','card','cinema'].map(videoLayout=>({...data,editor:{videoLayout}}))]){assert.equal(usesReferenceText(changed),false);assert.equal(referenceTextPlan(changed,20),null);}
});
test('Source timing is stable even when generic scene durations are edited',()=>{
 const expected=[[0,'opening'],[3.49,'opening'],[3.5,'camera'],[13.99,'camera'],[14,'courtyard'],[23.99,'courtyard'],[24,'scroll'],[39.99,'scroll'],[40,'venue'],[47.99,'venue'],[48,'closing'],[51.99,'closing']];
 for(const [seconds,stage]of expected){assert.equal(referenceTextPlan(data,seconds).stage,stage);assert.equal(referenceTextPlan({...data,editor:{sceneEdits:{opening:{seconds:60},events:{seconds:2}}}},seconds).stage,stage);}
});
test('Courtyard replaces names, family and date above the live character heads',()=>{
 const plan=referenceTextPlan(data,20),p=plan.panels[0];assert.equal(p.x,116);assert.equal(p.y,318);assert.ok(p.y+p.height<=570);assert.ok(texts(plan).includes(data.names));assert.ok(texts(plan).includes(data.family));assert.ok(texts(plan).some(text=>text.includes(data.date)));
});
test('Events paginate every user event without retaining reference names or event defaults',()=>{
 const first=texts(referenceTextPlan(data,25)),last=texts(referenceTextPlan(data,39));assert.ok(first.includes('Event 1'));assert.ok(first.includes('Event 3'));assert.ok(!first.includes('Event 4'));assert.ok(last.includes('Event 4'));assert.ok(last.includes('Event 6'));assert.ok(!last.includes('Event 1'));
 for(const value of [...first,...last])assert.doesNotMatch(value,/Nancy|Naitik|Royal Maple|9891282517|Bhaat|Doli/);
});
test('The first scroll title is hidden before the 26-second join and the later floral border stays visible',()=>{
 const early=referenceTextPlan(data,25).panels[0],later=referenceTextPlan(data,26).panels[0];assert.ok(early.x<=210&&early.x+early.width>=590);assert.ok(early.y<=240);assert.ok(early.y+early.height>=285);assert.ok(later.x>=170);assert.ok(later.x+later.width<=550);assert.ok(later.y>=280);assert.ok(later.y+later.height<=1045);
});
test('Venue and closing hide both upper lettering and lower date/phone locations',()=>{
 const venue=referenceTextPlan(data,43),closing=referenceTextPlan(data,50);assert.equal(venue.panels.length,2);assert.ok(texts(venue).includes(data.venue));assert.ok(texts(closing).includes(data.rsvp));assert.ok(closing.panels[0].y<=310);assert.ok(closing.panels[0].y+closing.panels[0].height<=440);assert.ok(closing.panels[1].y>=1110);assert.ok(closing.panels[1].y<=1120);assert.ok(closing.panels[1].y+closing.panels[1].height>=1200);
});
test('Current scene text styles and edits apply while masks stay on the original lettering',()=>{
 const editor={sceneEdits:{couple:{title:'Our new names',textSize:38,textColor:'#603a70'},family:{title:'With our families',subtitle:'The new date',textY:100},events:{title:'Updated programme'},venue:{title:'Updated venue'},closing:{subtitle:'New RSVP'}}};
 const changed={...data,editor},courtyard=referenceTextPlan(changed,20);assert.ok(texts(courtyard).includes('Our new names'));assert.ok(texts(courtyard).includes('The new date'));const names=courtyard.panels[0].blocks.find(b=>b.text==='Our new names');assert.equal(names.size,38);assert.equal(names.color,'#603a70');assert.equal(courtyard.panels[0].y,318);assert.ok(texts(referenceTextPlan(changed,25)).includes('Updated programme'));assert.ok(texts(referenceTextPlan(changed,43)).includes('Updated venue'));assert.ok(texts(referenceTextPlan(changed,50)).includes('New RSVP'));
});
test('Every mask and edited text box remains inside its measured safe area',()=>{
 const changed={...data,editor:{sceneEdits:{family:{textY:-100},events:{textY:100,textSize:500},venue:{textY:100},closing:{textY:100}}}};
 for(let t=0;t<52;t+=.25)for(const panel of referenceTextPlan(changed,t).panels){assert.ok(panel.x>=0&&panel.x+panel.width<=720);assert.ok(panel.y>=0&&panel.y+panel.height<=1280);for(const block of panel.blocks){assert.ok(block.y>=15);assert.ok(block.y+block.height<=panel.height-15);assert.ok(block.size<=58);}}
});
test('Canvas plates stay fully opaque, contain long text, and restore drawing state',()=>{
 const calls=[],stops=[];let saved=0;
 const context=new Proxy({globalAlpha:.2,save(){saved++;},restore(){saved--;},fillRect(...args){calls.push(['plate',this.globalAlpha,...args]);},fillText(...args){calls.push(['text',...args]);},createLinearGradient(){return {addColorStop(position,color){stops.push(color);}};},measureText(text){const size=Number(this.font?.match(/([\d.]+)px/)?.[1]??20);return {width:text.length*size*.55};}},{get(target,key){return key in target?target[key]:()=>{};}});
 assert.equal(drawReferenceText(context,{...data,names:'ExtraordinarilyLongUnbrokenName'.repeat(20)},20),true);assert.equal(saved,0);assert.ok(calls.some(call=>call[0]==='text'));assert.ok(calls.filter(call=>call[0]==='plate').every(call=>call[1]===1));assert.ok(stops.every(color=>/^#[0-9a-f]{6}$/i.test(color)));assert.equal(drawReferenceText(context,{...data,directedReel:undefined},20),false);
});

 test('Editor chapter seeking follows the original source despite legacy scene overrides',()=>{const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'lib/reference-timeline.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module:m,exports:m.exports});const chapters=m.exports.referenceTimeline({...data,scenes:['photos'],duration:30,editor:{sceneEdits:{events:{seconds:100}}}});assert.deepEqual(JSON.parse(JSON.stringify(chapters.map(s=>[s.kind,s.start,s.duration]))),[['opening',0,14],['couple',14,10],['events',24,16],['venue',40,8],['closing',48,4]]);assert.equal(m.exports.referenceTimeline({...data,directedReel:undefined}),null);});
