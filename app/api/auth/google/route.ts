import {requestOrigin} from '@/lib/hosting-runtime';
export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {getAppUser} from '@/lib/app-auth';
import {googleReady,randomToken,tokenHash,privateCookie,STATE_COOKIE} from '@/lib/google-auth';
export async function GET(req:Request){
 if(!googleReady())return Response.redirect(new URL('/?auth_error=google_setup',req.url),303);
 const state=randomToken(),nonce=randomToken(),verifier=randomToken(),user=await getAppUser(),url=new URL(req.url);
 await env.DB!.prepare('DELETE FROM auth_states WHERE expires<?').bind(Date.now()).run();
 await env.DB!.prepare('INSERT INTO auth_states(id,nonce,verifier,link_owner,expires) VALUES(?,?,?,?,?)').bind(await tokenHash(state),nonce,verifier,user?.userId??null,Date.now()+600000).run();
 const auth=new URL('https://accounts.google.com/o/oauth2/v2/auth');auth.search=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID!,redirect_uri:requestOrigin(req)+'/api/auth/google/callback',response_type:'code',scope:'openid email profile',state,nonce,code_challenge:await tokenHash(verifier),code_challenge_method:'S256',prompt:'select_account'}).toString();
 return new Response(null,{status:303,headers:{Location:auth.toString(),'Set-Cookie':privateCookie(STATE_COOKIE,state,600),'Cache-Control':'no-store'}});
}
