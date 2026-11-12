import {isRender} from '@/lib/hosting-runtime';
export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {cookieValue,SESSION_COOKIE,privateCookie,tokenHash} from '@/lib/google-auth';
export async function GET(req:Request){const token=cookieValue(req.headers.get('cookie'),SESSION_COOKIE);if(token)await env.DB!.prepare('DELETE FROM auth_sessions WHERE id=?').bind(await tokenHash(token)).run();return new Response(null,{status:303,headers:{Location:isRender()?'/':'/signout-with-chatgpt?return_to=%2F','Set-Cookie':privateCookie(SESSION_COOKIE,'',0),'Cache-Control':'no-store'}});}
