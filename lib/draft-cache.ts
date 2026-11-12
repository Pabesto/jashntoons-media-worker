import {type Invite} from './templates';
export type CachedDraft={id:string;data:Invite;updated:number};
export const draftCacheKey=(account:string)=>'jashntoons-draft:'+account.toLowerCase();
export function cachedDraft(account:string):CachedDraft|null{try{const value=JSON.parse(localStorage.getItem(draftCacheKey(account))??'null');return value?.id&&value?.data&&value?.updated?value:null;}catch{return null;}}
export function cacheDraft(account:string,draft:CachedDraft){try{localStorage.setItem(draftCacheKey(account),JSON.stringify(draft));}catch{}}
