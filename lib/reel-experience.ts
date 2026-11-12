import type {Invite,Template} from './templates';
import {referenceFilm,referenceFile} from './reference-films';
import {invitationDirection,directionVideo,directionPoster} from './invitation-directions';
import {photoReelFile} from './photo-scenes';

// New briefs use a versioned source. Existing paid projects retain their original
// timing and source IDs; selecting a new reel never rewrites an old generation.
export const REEL_EXPERIENCE='reference-v2' as const;
export const isReelBrief=(data:Pick<Invite,'creation'>)=>data.creation?.experience===REEL_EXPERIENCE;
export type ReelSource={id:string;url:string;poster:string;seconds:number;prepared:boolean;multiFunction:boolean};
// Royal Garden has 955 source frames at 24fps, mapped to 1194 frames at 30fps.
const fullLengths:Record<string,number>={'haveli-celebration':52,'royal-garden':1194/30,'rajasthan-journey':45};
export function reelSource(t:Template):ReelSource|null{
 if(t.archived)return null;
 const film=referenceFilm(t.referenceFilm),direction=invitationDirection(t.invitationDirection);
 let url='',poster=t.poster??'',seconds=30,prepared=false;
 if(film){seconds=film.id==='vintage-date'?430/30:film.id==='wedding-street'?2249/30:film.seconds;url=referenceFile(film.id);poster=referenceFile(film.id,'poster');if(seconds>60){seconds=60;prepared=true;url='/reel-references/'+t.id+'.mp4';}if(film.id==='vintage-date'){seconds=14;prepared=true;url='/reel-references/'+t.id+'.mp4';poster='/reel-references/'+t.id+'.webp';}}
 else if(direction){url=directionVideo(direction.id);poster=directionPoster(direction.id);seconds=15;}
 else if(t.studio){url=photoReelFile(t.id);seconds=t.duration??30;}
 else if(t.fullFilm){url='/full-films/'+t.id+'/full-reel.mp4';poster='/full-films/'+t.id+'/'+({'haveli-celebration':'arrival','royal-garden':'doors','rajasthan-journey':'scroll'}[t.id]??'arrival')+'.webp';seconds=fullLengths[t.id];}
 else if(t.world){url='/worlds/'+t.world+'.mp4';poster=['cosmic-birthday','garden-bloom','little-cloud','neon-sangeet'].includes(t.world)?'/reel-references/'+t.world+'.webp':'/worlds/'+t.world+'.webp';seconds=10;}
 else if(t.customFilm){url='/custom-films/'+t.id+'.mp4';seconds=10;}
 else if(t.catalog){url='/reel-references/'+t.id+'.mp4';poster='/reel-references/'+t.id+'.webp';seconds=10;prepared=true;}
 if(!url)return null;
 return {id:'reel2-'+t.id+(t.id==='royal-garden'?'-1194f':''),url,poster,seconds,prepared,multiFunction:seconds>=40};
}
export const functionCapacity=(seconds:number)=>Math.max(0,Math.min(8,Math.floor((seconds-12)/4)));
export function reelBriefError(data:Invite,seconds:number){
 if(!isReelBrief(data))return '';
 if(seconds>60)return 'Choose a reel of 60 seconds or less.';
 if(data.events.length>functionCapacity(seconds))return `This ${Math.round(seconds)}s reel has room for ${functionCapacity(seconds)} functions. Choose an All functions reel for a longer celebration.`;
 if(data.events.some(e=>!e.title.trim()||!(e.detail.trim()||e.date&&e.time&&e.venue?.trim())))return 'Complete the name, date, time and venue for every function, or remove the empty function.';
 if(data.creation?.wardrobe==='custom'&&!data.creation.outfit?.trim())return 'Describe the outfits you would like your people to wear.';
 return '';
}
export function eventDetails(event:Invite['events'][number]){return [event.date,event.time,event.venue,event.detail].filter(Boolean).join(' · ');}
export function castWardrobe(data:Invite){
 if(!isReelBrief(data))return '';
 const b=data.creation!;
 return b.wardrobe==='photo'?'Keep the clothing and accessories from the uploaded photos.':b.wardrobe==='custom'?`Dress each person in the requested clothing: ${b.outfit}. Preserve facial identity, age and body proportions; tailor clothing naturally to each person.`:'Analyse the people in every photo: resolve repeated views, preserve each distinct face, age, skin tone and hairstyle. Automatically fit occasion-appropriate clothing matching the selected reel protagonists and celebration. Preserve each person’s identity, not the source actor’s face. Keep children in age-appropriate clothing. Correct garment fit, fabric drape, hands and proportions without changing the person.';
}
