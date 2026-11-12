import {templates} from './templates';
import {reelSource} from './reel-experience';
export type ReelFeedItem={id:string;templateId:string;name:string;seconds:number;tag:string;description:string;shots:string[];video:string;poster:string;kind:'film'|'template';note:string};
export const reelFeed:ReelFeedItem[]=templates.flatMap(t=>{const source=reelSource(t);return source?[{id:t.referenceFilm??t.id,templateId:t.id,name:t.name,seconds:source.seconds,tag:t.category,description:t.mood,shots:[],video:source.url,poster:source.poster,kind:t.studio?'template' as const:'film' as const,note:'This is the actual reference used for your new reel. Add your photos, outfits, decoration choices and complete event details in one brief. The AI edits this video with your people; exact motion and likeness can vary. Review the credit total before creating.'}]:[];});

// Feature complete original motion before the wider portrait-animation library.
const featured=['reference-vintage-date','invitation-sunehri-darwaze','reference-shaadi-haveli','haldi-courtyard','jungle-birthday','lotus-engagement','candy-carnival','neon-sangeet','balloon-sky','garden-bloom','marigold-home','disco-birthday'];
reelFeed.sort((a,b)=>{const priority=(r:ReelFeedItem)=>featured.includes(r.templateId)?featured.indexOf(r.templateId):getPriority(r);return priority(a)-priority(b)});
function getPriority(r:ReelFeedItem){return r.kind==='template'?100:20;}
