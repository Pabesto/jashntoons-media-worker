import {referenceFilms,referenceFile} from './reference-films';
import {invitationDirections,directionPoster,directionVideo} from './invitation-directions';
import {studioTemplates} from './studio-catalog';
import {photoReelFile} from './photo-scenes';

export type ReelFeedItem={id:string;templateId:string;name:string;seconds:number;tag:string;description:string;shots:string[];video:string;poster:string;kind:'film'|'template';note:string};
const filmNote='Sample people and details are shown. Personalise the complete original film with your saved avatar and invitation text. Its scenes and camera guide the edit; music only, and AI edits can vary.';
export const reelFeed:ReelFeedItem[]=[
 ...referenceFilms.map(f=>({...f,templateId:'reference-'+f.id,video:referenceFile(f.id),poster:referenceFile(f.id,'poster'),kind:'film' as const,note:filmNote})),
 ...invitationDirections.map(d=>({id:'invitation-'+d.id,templateId:'invitation-'+d.id,name:d.name,seconds:15,tag:d.category,description:d.description,shots:d.shots,video:directionVideo(d.id),poster:directionPoster(d.id),kind:'film' as const,note:filmNote})),
 ...studioTemplates.map(t=>({id:t.id,templateId:t.id,name:t.name,seconds:t.duration??30,tag:t.category,description:t.mood,shots:[],video:photoReelFile(t.id),poster:t.poster!,kind:'template' as const,note:'This sample uses the selected template animation. Your saved avatar replaces the sample people in the same scenes and layout, with editable details and music. No AI video charge.'})),
];
