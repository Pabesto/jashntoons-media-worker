import type {Category} from './templates';

export const photoScenes:{key:string;name:string;category:Category;tone:'dark'|'light';palette:string[]}[]=[
 {key:'wedding',name:'The Bougainvillea Haveli',category:'Wedding',tone:'light',palette:['#efe0cf','#647b68','#c7a16d']},
 {key:'baraat',name:'The Palace Procession',category:'Dhol & Baraat',tone:'light',palette:['#efcb91','#9e5d36','#d8ad63']},
 {key:'birthday',name:'The Balloon Ballroom',category:'Birthday',tone:'light',palette:['#f7dfd2','#b86f7a','#d8b27b']},
 {key:'party',name:'Midnight, Under the Mirrorball',category:'Party',tone:'dark',palette:['#241c43','#bd8ab0','#e6c9ae']},
 {key:'baby-shower',name:'A Garden for Little Dreams',category:'Baby shower',tone:'light',palette:['#e7e9d7','#799b8a','#c5aa81']},
 {key:'engagement',name:'The Candlelit Garden',category:'Engagement',tone:'dark',palette:['#384c40','#b79085','#e2c18a']},
 {key:'anniversary',name:'A Table for Forever',category:'Anniversary',tone:'dark',palette:['#58443b','#d2a69a','#e6c59b']},
 {key:'housewarming',name:'The Marigold Doorstep',category:'Housewarming',tone:'light',palette:['#ebd6b4','#758269','#d2a44c']},
 {key:'festivals',name:'The Lantern Courtyard',category:'Festivals',tone:'dark',palette:['#344443','#b7773d','#f0c879']},
 {key:'business',name:'The Signature Launch',category:'Business',tone:'dark',palette:['#252f38','#7d9297','#d2c4a1']},
 {key:'graduation',name:'The Next Chapter Stage',category:'Graduation',tone:'dark',palette:['#2c3d53','#a5b3ba','#d8be83']},
 {key:'retirement',name:'The Sunlit Garden',category:'Retirement',tone:'light',palette:['#eadfc7','#758f6e','#ceb47b']},
 {key:'naming-ceremony',name:'The Little Cradle Garden',category:'Naming ceremony',tone:'light',palette:['#f0e0d0','#c69d94','#c5ae80']},
 {key:'haldi-mehendi',name:'The Marigold Mehfil',category:'Haldi & Mehendi',tone:'light',palette:['#edce81','#64856a','#d29d37']},
];
export const photoBackgrounds=photoScenes.map(({key,...scene})=>({...scene,id:'photo-'+key,src:'/studio/scenes-photo/'+key+'.webp'}));
export const photoSceneKey=(id:string)=>id.replace(/^studio-/,'').replace(/-\d{2}$/,'');
export const photoReelFile=(id:string)=>'/studio/reels/'+id.replace(/^studio-/,'')+'.mp4';
export const photoReelPoster=(id:string)=>'/studio/posters/'+id.replace(/^studio-/,'')+'.webp';
