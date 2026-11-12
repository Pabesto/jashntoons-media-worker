import {getTemplate,type Invite} from './templates';
import {referenceFilm,referenceFile} from './reference-films';
import {invitationDirection,directionVideo} from './invitation-directions';

export const REFERENCE_SOURCE_VERSION='v1';
// Measured video frames (audio-container duration is slightly longer for these two films).
const sourceFrames:Record<string,number>={'vintage-date':430,'wedding-street':2249};
export type ReferenceSegment={index:number;start:number;seconds:number};
export type ReferenceSource={id:string;name:string;url:string;seconds:number;segments:ReferenceSegment[]};
// Divide on frame boundaries. Every source frame is used once, in order.
export function sourceSegments(seconds:number):ReferenceSegment[]{
 const frames=Math.round(seconds*30),count=Math.ceil(frames/(28*30));
 return Array.from({length:count},(_,index)=>{const start=Math.round(index*frames/count),end=Math.round((index+1)*frames/count);return {index,start:start/30,seconds:(end-start)/30};});
}
export function referenceEditSource(data:Pick<Invite,'templateId'>):ReferenceSource|null{
 const t=getTemplate(data.templateId),film=referenceFilm(t.referenceFilm),direction=invitationDirection(t.invitationDirection);
 const source=film?{id:film.id,name:film.name,url:referenceFile(film.id),seconds:(sourceFrames[film.id]??Math.round(film.seconds*30))/30}:direction?{id:direction.id,name:direction.name,url:directionVideo(direction.id),seconds:15}:null;
 return source?{...source,segments:sourceSegments(source.seconds)}:null;
}
export const isReferenceEdit=(data:Invite)=>!['image','card'].includes(data.creation?.format??'film')&&!!referenceEditSource(data);
export const referenceEditDuration=(data:Invite)=>referenceEditSource(data)?.seconds??30;
export const referenceAssetName=(segment:number)=>`part-${segment}.mp4`;
export const referenceAssetKey=(id:string,name:string)=>`reference-source/${REFERENCE_SOURCE_VERSION}/${id}/${name}`;
export const referenceAssetURL=(id:string,name:string)=>`https://jashntoons.ai/api/reference-source/${id}/${name}`;
// Full-video editing uses a different model from a newly generated short film.
// Quote the entire source duration once, before any provider work is submitted.
export const referenceEditCredits=(seconds:number)=>Math.ceil(seconds*.3);
export function referenceVideoPrompt(){return 'Edit the supplied video itself. The attached image is the ONLY identity reference for the customer\'s illustrated people. Replace the original main bride/groom or invitation protagonists wherever they appear with the corresponding people in that image, retaining their original screen position, scale, pose, gesture, movement path and occlusion. Preserve their identity and clothing from the image across every shot. Preserve the original camera movement, scene order, cuts, transitions, timing, duration, architecture, props, lighting, illustration texture and background performers. Where there are no main protagonists, do not add any. Remove all old invitation lettering, names, dates, venue names, telephone numbers and logos from every frame, reconstructing the underlying scroll, paper or wall surface. Accurate editable event text will be composited separately. Do not add new lettering or speech. Do not invent new scenes, change the style, repeat frames or create a slideshow. Only perform this replacement edit on the input footage.';}
export function referenceEditRequest(source:ReferenceSource,segment:ReferenceSegment,castUri:string){return {model:'kling_4',videoUri:referenceAssetURL(source.id,referenceAssetName(segment.index)),references:[{uri:castUri}],promptText:referenceVideoPrompt(),ratio:'auto_720p'};}
