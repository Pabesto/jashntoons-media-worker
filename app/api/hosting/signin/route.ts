import {env} from 'cloudflare:workers';
import {getAppUser} from '@/lib/app-auth';
import {hostingOrigin,isRender} from '@/lib/hosting-runtime';
import {privateCookie,randomToken,tokenHash} from '@/lib/google-auth';
export const dynamic='force-dynamic';
const TRANSFER_COOKIE='__Host-jashntoons-transfer';
const redirect=(url:string, cookie?:string)=>new Response(null,{status:303,headers:{Location:url,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer',...(cookie?{'Set-Cookie':cookie}:{})}});

export async function GET(req:Request) {
  try {
    if (isRender()) {
      const state=randomToken(),target=new URL('/api/hosting/signin',hostingOrigin('STORAGE_ORIGIN'));
      target.searchParams.set('state',state);
      return redirect(target.toString(),privateCookie(TRANSFER_COOKIE,state,600));
    }
    const state=new URL(req.url).searchParams.get('state');
    if (!state || !/^[A-Za-z0-9_-]{43}$/.test(state)) return new Response('Invalid sign-in request.',{status:400});
    const target=new URL('/api/hosting/callback',hostingOrigin('RENDER_SITE_ORIGIN'));
    const user=await getAppUser();
    if (!user) {
      const path='/api/hosting/signin?state='+encodeURIComponent(state);
      return redirect('/signin-with-chatgpt?return_to='+encodeURIComponent(path));
    }
    const code=randomToken();
    // auth_states already holds short-lived OAuth exchanges. This distinct ID
    // namespace and one-use DELETE preserve the original owner, including credits.
    await env.DB!.prepare('DELETE FROM auth_states WHERE expires<?').bind(Date.now()).run();
    await env.DB!.prepare('INSERT INTO auth_states(id,nonce,verifier,link_owner,expires) VALUES(?,?,?,?,?)')
      .bind('render:'+await tokenHash(code),await tokenHash(state),JSON.stringify({email:user.email,name:user.displayName}),user.userId,Date.now()+60000).run();
    target.searchParams.set('code',code);target.searchParams.set('state',state);
    return redirect(target.toString());
  } catch { return new Response('Sign-in transfer is temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}}); }
}
