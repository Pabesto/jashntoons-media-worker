import {headers} from 'next/headers';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {cookieValue,SESSION_COOKIE,tokenHash} from './google-auth';
export async function getAppUser(){
 const h=await headers(),token=cookieValue(h.get('cookie'),SESSION_COOKIE);
 if(token&&token.length<100){const session=await env.DB!.prepare('SELECT owner,email,name FROM auth_sessions WHERE id=? AND expires>?').bind(await tokenHash(token),Date.now()).first<{owner:string;email:string;name:string}>();if(session)return {userId:session.owner,email:session.email,displayName:session.name,fullName:session.name,provider:token.startsWith('siwc.')?'chatgpt':'google'};}
 const user=await getChatGPTUser();return user?{...user,provider:'chatgpt'}:null;
}
