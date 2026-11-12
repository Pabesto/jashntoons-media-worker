import {env} from 'cloudflare:workers';
import {APIError} from './api';
import {type ImageProvider,type MotionProvider,providerName,selectedImageProvider} from './ai-options';

export const providerStatus=()=>({openai:!!env.OPENAI_API_KEY?.trim(),runway:!!(env.RUNWAY_API_KEY||env.RUNWAYML_API_SECRET)?.trim(),google:!!(env.GEMINI_API_KEY||env.GOOGLE_API_KEY)?.trim()});
export function resolveProvider(choice:ImageProvider|'auto'|undefined){const selected=selectedImageProvider(choice,providerStatus());if(!selected)throw new APIError(503,'AI creation is not connected yet. Your photos are saved. Choose a provider after the studio owner connects it.');requireProvider(selected);return selected;}
export function requireProvider(provider:ImageProvider){if(!providerStatus()[provider])throw new APIError(503,'Illustration creation is temporarily unavailable. Your photos are saved; please try again later.');}
type Block={type?:string;data?:string;uri?:string;mime_type?:string};
type Remote={id:string;status?:string;output?:{type?:string;result?:string}[]|string[];steps?:{type:string;content?:Block[]}[];output_image?:Block;output_video?:Block};
export type AIOutput={url?:string;b64?:string;mime?:string;googleFile?:string};
export type AITask={id:string;status:'pending'|'succeeded'|'failed';output?:AIOutput};
const googleKey=()=>env.GEMINI_API_KEY||env.GOOGLE_API_KEY!;
async function call(provider:ImageProvider,path:string,body?:unknown):Promise<Remote>{
 requireProvider(provider);
 const root=provider==='runway'?'https://api.dev.runwayml.com/v1/':provider==='openai'?'https://api.openai.com/v1/':'https://generativelanguage.googleapis.com/v1beta/';
 const headers:Record<string,string>={'Content-Type':'application/json'};
 if(provider==='google'){headers['x-goog-api-key']=googleKey();headers['Api-Revision']='2026-05-20';}
 else headers.Authorization='Bearer '+(provider==='openai'?env.OPENAI_API_KEY:(env.RUNWAY_API_KEY||env.RUNWAYML_API_SECRET));
 if(provider==='runway')headers['X-Runway-Version']='2024-11-06';
 let res:Response;try{res=await fetch(root+path,{method:body?'POST':'GET',headers,...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(60000)});}catch{throw new APIError(502,'The illustration studio did not respond. Your photos are saved; try again shortly.');}
 if(!res.ok){throw new APIError(res.status===429?429:502,res.status===429?'The illustration studio is busy. Please try again shortly.':[401,403].includes(res.status)?'Illustration creation is temporarily unavailable. Your photos are saved; please try again later.':'We could not create this illustration. Try a clearer photo or simpler creative direction.');}
 return res.json();
}
function normalize(provider:ImageProvider,r:Remote,video=false):AITask{
 if(!r.id)throw new APIError(502,'The AI provider did not return a generation ID.');
 const state=(r.status||'').toLowerCase();
 if(['failed','canceled','cancelled','incomplete','requires_action'].includes(state))return {id:r.id,status:'failed'};
 if(!['succeeded','completed'].includes(state))return {id:r.id,status:'pending'};
 let output:AIOutput|undefined;
 if(provider==='runway'){const url=r.output?.[0];if(typeof url==='string')output={url};}
 if(provider==='openai'){const block=(r.output as {type?:string;result?:string}[])?.find(x=>x.type==='image_generation_call'&&x.result);if(block?.result)output={b64:block.result,mime:'image/png'};}
 if(provider==='google'){
  const kind=video?'video':'image';const blocks=r.steps?.filter(s=>s.type==='model_output').flatMap(s=>s.content??[])??[];
  const b=blocks.find(b=>b.type===kind&&(b.data||b.uri))??(video?r.output_video:r.output_image);
  if(b?.data)output={b64:b.data,mime:b.mime_type||(video?'video/mp4':'image/png')};
  else if(b?.uri){const m=b.uri.match(/^(?:https:\/\/generativelanguage\.googleapis\.com\/v1beta\/)?files\/([a-zA-Z0-9_-]+)$/);if(m)output={googleFile:m[1]};else throw new APIError(502,'Google returned an unsupported output location.');}
 }
 return {id:r.id,status:output?'succeeded':'failed',output};
}
export async function runway(path:string,body?:unknown){return call('runway',path,body);}
export async function startImage(provider:ImageProvider,request:{promptText:string;referenceImages?:{uri:string}[];background?:string},owner:string,requestId:string){
 if(provider==='runway')return normalize(provider,await call(provider,'text_to_image',request));
 if(provider==='openai'){
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner));const safety=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  return normalize(provider,await call(provider,'responses',{model:'gpt-5.4-mini',background:true,store:true,safety_identifier:safety,metadata:{jashntoons_job:requestId},input:[{role:'user',content:[{type:'input_text',text:request.promptText},...(request.referenceImages??[]).map(r=>({type:'input_image',image_url:r.uri}))]}],tools:[{type:'image_generation',model:'gpt-image-2.5-flare',quality:'medium',size:'1024x1536',output_format:'png',background:request.background==='transparent'?'transparent':'opaque'}],tool_choice:{type:'image_generation'}}));
 }
 return normalize(provider,await call(provider,'interactions',{model:'gemini-nano-banana-2.1',background:true,store:true,input:[{type:'text',text:request.promptText},...(request.referenceImages??[]).map(r=>{const [header,data]=r.uri.split(',');return {type:'image',mime_type:header.slice(5).split(';')[0],data};})],response_format:{type:'image',mime_type:'image/png',aspect_ratio:'9:16',image_size:'1K'}}));
}
const motionPrompt='In a single continuous shot, create a graceful cinematic invitation scene. Small natural welcoming gestures, relaxed smiles, gentle fabric and flowers moving, a subtle camera push in. Preserve the exact faces, outfits and setting. No text, no cuts, no extra people, no dialogue.';
export async function startMotion(provider:Exclude<MotionProvider,'none'>,uri:string,prompt=motionPrompt){
 if(provider==='runway')return normalize(provider,await call(provider,'image_to_video',{model:'gen4_turbo',promptImage:uri,ratio:'720:1280',duration:10,promptText:prompt}),true);
 const [header,data]=uri.split(',');
 return normalize(provider,await call(provider,'interactions',{model:'gemini-omni-1.2-flash',background:true,store:true,input:[{type:'image',mime_type:header.slice(5).split(';')[0],data},{type:'text',text:prompt}],response_format:{type:'video',duration:'10s',aspect_ratio:'9:16',resolution:'720p',delivery:'uri'}}),true);
}
export async function pollProvider(provider:ImageProvider,id:string,video=false){return normalize(provider,await call(provider,(provider==='runway'?'tasks/':provider==='openai'?'responses/':'interactions/')+encodeURIComponent(id)),video);}
export async function googleOutput(file:string){
 requireProvider('google');if(!/^[a-zA-Z0-9_-]+$/.test(file))throw new APIError(502,'Invalid AI output.');
 const root='https://generativelanguage.googleapis.com/v1beta/files/'+file;
 const headers={'x-goog-api-key':googleKey()};
 const check=await fetch(root,{headers,signal:AbortSignal.timeout(30000)});if(!check.ok)throw new APIError(502,'Could not retrieve the generated Google file.');
 const meta=await check.json() as {state:string};if(meta.state==='FAILED')throw new APIError(502,'Google could not process the generated video.');if(meta.state!=='ACTIVE')return null;
 const download=await fetch(root+':download?alt=media',{headers,redirect:'manual',signal:AbortSignal.timeout(60000)});
 if([301,302,303,307,308].includes(download.status)){
  const location=download.headers.get('location');if(!location)throw new APIError(502,'Google output download is unavailable.');const url=new URL(location,root);
  // A Google signed storage URL needs no API key. Never forward the key on redirects.
  if(url.protocol!=='https:'||!(url.hostname==='storage.googleapis.com'||url.hostname.endsWith('.googleusercontent.com')))throw new APIError(502,'Google returned an unsupported download location.');
  return fetch(url.toString(),{redirect:'error',signal:AbortSignal.timeout(60000)});
 }
 return download;
}
