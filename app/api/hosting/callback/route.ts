import {env} from 'cloudflare:workers';
import {isRender} from '@/lib/hosting-runtime';
import {cookieValue,privateCookie,randomToken,tokenHash,SESSION_COOKIE} from '@/lib/google-auth';
export const dynamic='force-dynamic';
const TRANSFER_COOKIE='__Host-jashntoons-transfer';
export async function GET(req:Request) {
  if (!isRender()) return new Response('Not found.',{status:404});
  const h=new Headers({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
  h.append('Set-Cookie',privateCookie(TRANSFER_COOKIE,'',0));
  try {
    const url=new URL(req.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
    if (!state || !code || !/^[A-Za-z0-9_-]{43}$/.test(state) || !/^[A-Za-z0-9_-]{43}$/.test(code) || state!==cookieValue(req.headers.get('cookie'),TRANSFER_COOKIE)) throw Error('Invalid state.');
    const saved=await env.DB!.prepare('DELETE FROM auth_states WHERE id=? AND nonce=? AND expires>? RETURNING verifier,link_owner')
      .bind('render:'+await tokenHash(code),await tokenHash(state),Date.now()).first<{verifier:string;link_owner:string|null}>();
    if (!saved?.link_owner) throw Error('Sign-in expired.');
    const user=JSON.parse(saved.verifier) as {email:string;name:string};
    if (typeof user.email!=='string' || !user.email.includes('@') || typeof user.name!=='string') throw Error('Invalid account.');
    const session='siwc.'+randomToken();
    await env.DB!.prepare('INSERT INTO auth_sessions(id,owner,email,name,expires) VALUES(?,?,?,?,?)')
      .bind(await tokenHash(session),saved.link_owner,user.email,user.name,Date.now()+7*86400000).run();
    h.append('Set-Cookie',privateCookie(SESSION_COOKIE,session,7*86400));
    h.set('Location','/?studio=1');
  } catch { h.set('Location','/?auth_error=google_login'); }
  return new Response(null,{status:303,headers:h});
}
