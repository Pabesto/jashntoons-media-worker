import {env} from 'cloudflare:workers';
import {APIError} from './api';
// Byte ranges let browsers find MP4 metadata and seek without downloading the whole file.
export async function privateFile(req:Request,key:string,mime:string,disposition?:string){
 const metadata=await env.BUCKET!.head(key);if(!metadata)throw new APIError(404,'This file is unavailable.');let offset=0,length=metadata.size,partial=false;const range=req.headers.get('range');
 const headers:Record<string,string>={'Content-Type':mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes',...(disposition?{'Content-Disposition':disposition}:{})};
 if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${metadata.size}`}});if(!match[1]){length=Math.min(metadata.size,Number(match[2]));offset=metadata.size-length;}else{offset=Number(match[1]);const end=match[2]?Math.min(metadata.size-1,Number(match[2])):metadata.size-1;length=end-offset+1;}if(offset<0||offset>=metadata.size||length<=0)return new Response(null,{status:416,headers:{...headers,'Content-Range':`bytes */${metadata.size}`}});partial=true;headers['Content-Range']=`bytes ${offset}-${offset+length-1}/${metadata.size}`;}
 const object=await env.BUCKET!.get(key,partial?{range:{offset,length}}:undefined);if(!object)throw new APIError(404,'This file is unavailable.');headers['Content-Length']=String(length);return new Response(object.body,{status:partial?206:200,headers});
}
