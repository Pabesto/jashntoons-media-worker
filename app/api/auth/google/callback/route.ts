import {requestOrigin} from '@/lib/hosting-runtime';
export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {googleReady,cookieValue,tokenHash,verifyGoogleToken,randomToken,privateCookie,STATE_COOKIE,SESSION_COOKIE} from '@/lib/google-auth';
export async function GET(req:Request){
 const url=new URL(req.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
 const responseHeaders=new Headers({'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});responseHeaders.append('Set-Cookie',privateCookie(STATE_COOKIE,'',0));
 try{
  if(!googleReady()||!state||!code||state!==cookieValue(req.headers.get('cookie'),STATE_COOKIE))throw new Error('Invalid login state');
  const saved=await env.DB!.prepare('DELETE FROM auth_states WHERE id=? AND expires>? RETURNING nonce,verifier,link_owner').bind(await tokenHash(state),Date.now()).first<{nonce:string;verifier:string;link_owner:string|null}>();if(!saved)throw new Error('Expired login');
  const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID!,client_secret:env.GOOGLE_CLIENT_SECRET!,code,code_verifier:saved.verifier,grant_type:'authorization_code',redirect_uri:requestOrigin(req)+'/api/auth/google/callback'}),signal:AbortSignal.timeout(15000)});
  if(!tokenResponse.ok)throw new Error('Google exchange failed');
  const token=await tokenResponse.json() as {id_token:string},claims=await verifyGoogleToken(token.id_token,saved.nonce),providerId='google:'+claims.sub;
  const existing=await env.DB!.prepare('SELECT owner FROM auth_accounts WHERE provider_id=?').bind(providerId).first<{owner:string}>();
  if(existing&&saved.link_owner&&existing.owner!==saved.link_owner)throw new Error('Account already linked');
  const owner=existing?.owner??saved.link_owner??providerId;
  await env.DB!.prepare('INSERT INTO auth_accounts(provider_id,owner) VALUES(?,?) ON CONFLICT(provider_id) DO NOTHING').bind(providerId,owner).run();
  const linked=await env.DB!.prepare('SELECT owner FROM auth_accounts WHERE provider_id=?').bind(providerId).first<{owner:string}>();if(linked?.owner!==owner)throw new Error('Account link changed');
  const session=randomToken();await env.DB!.prepare('DELETE FROM auth_sessions WHERE expires<?').bind(Date.now()).run();
  await env.DB!.prepare('INSERT INTO auth_sessions(id,owner,email,name,expires) VALUES(?,?,?,?,?)').bind(await tokenHash(session),owner,claims.email,claims.name||claims.email.split('@')[0],Date.now()+7*86400000).run();
  responseHeaders.append('Set-Cookie',privateCookie(SESSION_COOKIE,session,7*86400));responseHeaders.set('Location','/?studio=1');
 }catch{responseHeaders.set('Location','/?auth_error=google_login');}
 return new Response(null,{status:303,headers:responseHeaders});
}
