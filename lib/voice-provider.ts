import {env} from 'cloudflare:workers';
import {APIError} from './api';
export type VoiceRemote={id:string;status?:string;output?:string[];failureCode?:string;failure?:string};
export function voiceConfigured(){const e=env as unknown as Record<string,string>;return !!(e.RUNWAY_API_KEY||e.RUNWAYML_API_SECRET);}
export async function voiceRequest(path:string,body?:unknown):Promise<VoiceRemote>{
 const e=env as unknown as Record<string,string>,key=e.RUNWAY_API_KEY||e.RUNWAYML_API_SECRET;
 if(!key)throw new APIError(503,'The creation service is not connected yet. Your saved work is safe.');
 let r:Response;try{r=await fetch('https://api.dev.runwayml.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'X-Runway-Version':'2024-11-06','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});}catch{throw new APIError(body?502:503,body?'The creation service did not confirm this request. Check this saved creation before trying again.':'The creation status could not be checked. Your existing request is saved and will be checked again.');}
 if(!body&&r.status>=500)throw new APIError(503,'The creation status is temporarily unavailable. Your existing request is saved and will be checked again.');
 if(!r.ok){console.error('creation_request_rejected',{endpoint:path.split('/')[0],status:r.status});throw new APIError(r.status===429?429:502,r.status===402?'The studio AI balance needs a top-up. Please contact support.':r.status===400?'The creation service could not accept these inputs. Your saved work is safe; contact support before retrying.':r.status===429?'The creation service is busy. Check again shortly.':'Creation is temporarily unavailable. Your inputs are saved.');}
 const result=await r.json() as VoiceRemote;if(!result.id)throw new APIError(502,'The voice service returned an incomplete result.');return result;
}
export function remoteState(status?:string){const s=(status??'').toUpperCase();return s==='READY'||s==='SUCCEEDED'||s==='AVATARREADY'?'ready':s.includes('FAIL')||s==='CANCELLED'?'failed':'pending';}
