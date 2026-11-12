'use client';
import {useState} from 'react';
import {ArrowRight,Check,Lightbulb,ScanLine,Play,CircleHelp,Keyboard} from 'lucide-react';
import {type Invite} from '@/lib/templates';

export const toolDescriptions:Record<string,string>={
 Moments:'Choose an action, add reference photos and review the credit total before creating a new AI film.',
 Details:'Names, dates and venue appear in the preview. Editing text does not change recorded speech.',
 Templates:'Explore the visual style. Your photos and event details stay saved.',
 Avatar:'Use an existing character or create an illustrated avatar from clear reference photos.',
 Backgrounds:'Change the surrounding setting. Replacing scenery inside a generated video needs a new creation.',
 Scenes:'Select a scene in the timeline to adjust its words and timing.',
 Effects:'Add petals, adjust the colour grade or soften the edges. Check the result in Preview.',
 Audio:'Choose a soundtrack and balance its volume. Generated speech stays with the film.',
 Export:'Check your details, choose a video size, then save a private video or prepare it for publishing.',
 Guide:'Your workspace, from the first edit to the finished video.',
};
export function ToolHint({tool}:{tool:string}){return <div className="tool-hint"><Lightbulb size={16}/><p>{toolDescriptions[tool]??'Select a tool. Your changes appear in the preview and save to your draft.'}</p></div>}
export function EditorSteps({data,tab,onChoose,disabled}:{data:Invite;tab:string;onChoose:(tab:string)=>void;disabled:boolean}){
 const items=[{tab:'Templates',title:'Style selected',sub:'Your style is selected',done:true},{tab:data.aiMoment?'Moments':'Avatar',title:data.aiMoment?'AI film':'Your people',sub:data.aiMoment?'Direct the action':'Your saved character',done:data.aiMoment?!!data.generatedVideo:!!data.generatedArt},{tab:'Details',title:'Edit & finish',sub:'Preview, edit and download',done:false}];
 return <nav className="editor-steps" aria-label="Invitation creation steps">{items.map((item,i)=><button key={item.tab} disabled={disabled} onClick={()=>onChoose(item.tab)} aria-current={(tab===item.tab||(item.tab==='Details'&&!['Templates','Avatar','Moments'].includes(tab)))?'step':undefined}><span className={'step-number'+(item.done?' done':'')}>{item.done?<Check size={14}/>:String(i+1).padStart(2,'0')}</span><span><strong>{item.title}</strong><small>{item.sub}</small></span><ArrowRight size={13}/></button>)}</nav>;
}
export function EditorGuide({onChoose,directed=false,onBrief}:{onChoose:(tab:string)=>void;directed?:boolean;onBrief?:()=>void}){
 const [language,setLanguage]=useState<'en'|'hi'>('hi'),hi=language==='hi';
 const steps=hi?[
  ['Details','Pehle details check karo','Names, date aur venue add karo. Har change Preview mein dikhega. Timeline se kisi bhi scene par ja sakte ho.'],
  ['Templates','Apna look set karo','Style aur Backgrounds mein frame aur setting chuno. Saved photos aur event details aapke saath rehte hain.'],
  ['Effects','Motion aur finishing do','Petals, colour grade aur vignette try karo. Audio mein music aur volume set karo. Preview chala kar poori reel dekho.'],
  ['Export','Finish karo, phir share karo','Finish reel mein spelling, date aur venue check karo. Private video save karo, ya Publish my reel se sharing review kholo. Final confirmation ke baad hi reel public hogi.'],
 ]:[
  ['Details','Make the details yours','Add names, date and venue. See every edit in Preview, and select any scene in the timeline.'],
  ['Templates','Set the look','Choose a frame and visual setting in Style and Backgrounds. Your saved photos and event details stay with you.'],
  ['Effects','Add the finishing touches','Try petals, a colour grade or a soft vignette. Choose music and volume in Audio, then play the full reel.'],
  ['Export','Finish, then share','Open Finish reel to check the details. Save a private video, or use Publish my reel to review sharing. Nothing becomes public until you confirm.'],
 ];
 return <div className="editor-guide">
  <div className="guide-language" role="group" aria-label="Guide language"><button aria-pressed={hi} onClick={()=>setLanguage('hi')}>Hinglish</button><button aria-pressed={!hi} onClick={()=>setLanguage('en')}>English</button></div>
  <div className="guide-welcome"><ScanLine size={23}/><h3>{hi?'Ek screen. Puri reel.':'One screen. Your whole reel.'}</h3><p>{hi?'Tools, preview aur timeline ek hi workspace mein. Sirf controls ka panel scroll hota hai.':'Tools, preview and timeline stay in one workspace. Only the controls panel scrolls.'}</p></div>
  <div className="guide-step-list">{steps.map(([tab,title,body],i)=><button key={tab} onClick={()=>onChoose(tab)}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{title}</strong><p>{body}</p><small>{hi?'Tool kholo':'Open this tool'} <ArrowRight size={12}/></small></div></button>)}</div>
  <div className="guide-notes"><h3><CircleHelp size={16}/>{hi?'Kaam ki baatein':'A few useful details'}</h3>
   <details><summary>{hi?'Mobile par preview kaise dekhein?':'How does the mobile workspace work?'}</summary><p>{hi?'Upar tool chuno, phir Preview tab se badi reel dekho. Controls tab par wapas aakar edit karo. Neeche timeline ko side mein swipe karo; scene chunte hi uska preview khul jayega.':'Choose a tool, then use the Preview tab to see the large reel. Return to Controls to edit. Swipe the pinned timeline sideways; selecting a scene opens its preview.'}</p></details>
   <details><summary>{hi?'Guides kya karte hain?':'What do the preview guides do?'}</summary><p>{hi?'Preview ke upar Guides dabao. Dashed box text aur faces ko edges se door rakhne mein help karta hai. Guides sirf editor mein dikhte hain, download mein nahi.':'Turn on Guides above the preview. The dashed safe-area box helps keep faces and text clear of the edges. Guides appear only in the editor and are never included in the download.'}</p></details>
   <details><summary>{hi?'Naye characters ya spoken words kaise badlein?':'How do I change people or spoken words?'}</summary><p>{hi?(directed?'Photos, voice & new creation se apni brief par wapas jao. Saved characters aur voice reuse hote hain; nayi AI creation se pehle credit total check karo. Details mein text badalne se recorded dialogue nahi badalta.':'Avatar mein reference photos se character banao. Audio mein apni permission wali recording aur voice settings use karo. Nayi AI generation se pehle displayed credit total check karo. Text editing recorded dialogue ko nahi badalti.'):(directed?'Return to Photos, voice & new creation. Saved characters and voices can be reused; review the total before a new AI creation. Editing the visible text does not change recorded dialogue.':'Create a character from reference photos in Avatar. Use a recording you have permission to use in Audio. Review the displayed credit total for new AI generation. Text edits do not alter recorded speech.')}</p>{onBrief&&<button className="text-link" onClick={onBrief}>{hi?'Creation brief kholo':'Open creation brief'} <ArrowRight size={12}/></button>}</details>
   <details><summary>{hi?'Kya AI video ka har background live badlega?':'Can I replace every AI video background live?'}</summary><p>{hi?'Frame, surrounding background, text aur effects live edit hote hain. Film ke andar ke log, unka action aur actual scenery badalne ke liye naya AI version banana padta hai. Pehle wali reel saved rehti hai.':'Frames, surrounding backgrounds, text and effects can change live. People, their actions and the scenery within a generated film need a new AI version. Your previous reel stays saved.'}</p></details>
   <details><summary>{hi?'Save aur credits kaise kaam karte hain?':'How do saving and credits work?'}</summary><p>{hi?'Photos aur draft account mein save hote hain. Header mein save status dekho; error aaye to Retry save dabao. Sirf editing se AI dobara nahi chalta. Naya avatar, dialogue ya film generate karne ka credit total creation ke waqt dikhta hai.':'Photos and the draft save to your account. Check the header status and use Retry save if syncing fails. Editing alone does not rerun AI. New avatars, dialogue or films show their credit total during creation.'}</p></details>
   <details><summary>{hi?'Kaunsi video quality choose karun?':'Which video size should I choose?'}</summary><p>{hi?'1080p Full HD output ke liye, 720p chhoti file ke liye. Source artwork ki quality final clarity par asar karti hai. Browser support ke hisaab se MP4 ya WebM milega. Export complete hone tak tab khula rakho.':'Choose 1080p for Full HD output or 720p for a smaller file. Final clarity also depends on the source artwork. Downloads use MP4 or WebM according to browser support. Keep the tab open until export finishes.'}</p></details>
  </div>
  <div className="workbench-shortcuts"><h3><Keyboard size={15}/> Desktop shortcuts</h3><dl><dt>{hi?'Draft save':'Save draft'}</dt><dd><kbd>Ctrl / Cmd</kbd><kbd>S</kbd></dd><dt>Undo</dt><dd><kbd>Ctrl / Cmd</kbd><kbd>Z</kbd></dd><dt>Redo</dt><dd><kbd>Shift</kbd><kbd>Ctrl / Cmd</kbd><kbd>Z</kbd></dd><dt>{hi?'Focus preview':'Focus preview'}</dt><dd><kbd>F</kbd></dd><dt>{hi?'Preview guides':'Preview guides'}</dt><dd><kbd>G</kbd></dd></dl><p>{hi?'Shortcuts tab kaam karte hain jab aap kisi text field mein type nahi kar rahe.':'Shortcuts work when you are not typing in a form field.'}</p></div>
  <div className="guide-preview-tip"><Play size={16}/>{hi?'Final save se pehle poori reel ek baar zaroor dekho.':'Watch the complete reel once before the final save.'}</div>
 </div>;
}
