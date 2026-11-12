import {referenceFilms} from '@/lib/reference-films';
import {invitationDirections} from '@/lib/invitation-directions';
import {referenceAssetKey,referenceAssetName,referenceEditSource} from '@/lib/reference-edit-contract';
import {guarded,APIError} from '@/lib/api';
import {privateFile} from '@/lib/private-file';
export const dynamic='force-dynamic';
export const GET=(req:Request,c:{params:Promise<{source:string;asset:string}>})=>guarded(async()=>{
 const {source,asset}=await c.params;
 const templateId=referenceFilms.some(f=>f.id===source)?'reference-'+source:invitationDirections.some(d=>d.id===source)?'invitation-'+source:'';
 const selected=templateId?referenceEditSource({templateId}):null;
 if(!selected||!selected.segments.some(s=>asset===referenceAssetName(s.index)))throw new APIError(404,'This reference is unavailable.');
 const response=await privateFile(req,referenceAssetKey(source,asset),'video/mp4');response.headers.set('Cache-Control','public, max-age=86400, immutable');return response;
});
