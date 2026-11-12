import {invitationDirection,directionPoster} from './invitation-directions';
import {studioBackgrounds,getStudioBackground} from './studio-backgrounds';
import {customFilm} from './custom-film';
import {getTemplate,type Invite,type SceneKind} from './templates';
const worlds:Record<string,string[]>={
 Wedding:['marigold-home','blush-engagement','haldi-courtyard','mehendi-mandap','lotus-engagement','diwali-courtyard'],
 Birthday:['jungle-birthday','candy-carnival','disco-birthday'],
 'Baby shower':['balloon-sky','storybook-cradle','cradle-lotus'],
 Engagement:['blush-engagement','lotus-engagement','candle-anniversary','mehendi-mandap'],
 Anniversary:['candle-anniversary','golden-anniversary','blush-engagement','lotus-engagement'],
 Housewarming:['marigold-home','modern-villa','diwali-courtyard'],
 Festivals:['diwali-courtyard','marigold-home','lotus-engagement'],
 Business:['launch-stage','boutique-opening','modern-villa'],
 Graduation:['laurel-library','campus-celebration','launch-stage'],
 Retirement:['travel-garden','golden-anniversary','candle-anniversary'],
 'Naming ceremony':['cradle-lotus','storybook-cradle','balloon-sky'],
 'Haldi & Mehendi':['haldi-courtyard','mehendi-mandap','marigold-home','lotus-engagement'],
};
export function layeredStory(data:Invite){return !customFilm(data)&&!!(getTemplate(data.templateId).catalog||data.stockAvatarId||data.backgroundId||data.generatedArt||data.generatedVideo||data.photos.length);}
export function sceneDesign(data:Invite,kind:SceneKind){
 const t=getTemplate(data.templateId);let pool=worlds[t.category]??worlds.Wedding;
 if(t.id==='eid-moon')pool=['eid-moon','lotus-engagement','modern-villa'];
 const studioPool=studioBackgrounds.filter(b=>b.category===t.category).map(b=>b.id);
 const ids=t.invitationDirection?[t.id]:t.studio?[t.defaultBackgroundId!,...(data.creation?studioPool.filter(id=>id!==t.defaultBackgroundId):[])]:t.catalog?[t.id,...pool.filter(id=>id!==t.id)]:pool;
 const index=Math.max(0,data.scenes.indexOf(kind));
 const layout=({opening:{x:50,y:73,h:660,textY:19},family:{x:50,y:74,h:630,textY:18},couple:{x:50,y:67,h:790,textY:13},events:{x:73,y:84,h:300,textY:14},venue:{x:68,y:78,h:470,textY:15},photos:{x:80,y:82,h:270,textY:12},closing:{x:50,y:62,h:560,textY:14}} as const)[kind];
 return {background:data.editor?.sceneEdits[kind]?.background??data.backgroundId??ids[index%ids.length],...layout,index};
}

export function backgroundSrc(id:string){const d=invitationDirection(id.replace(/^invitation-/,''));return d?directionPoster(d.id):getStudioBackground(id)?.src??'/catalog/'+id+'.webp';}
