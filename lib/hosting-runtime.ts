import {env} from 'cloudflare:workers';
export const isRender = () => (typeof process !== 'undefined' && process.env.JASHNTOONS_RUNTIME === 'render');
export function hostingOrigin(key:'PUBLIC_SITE_ORIGIN'|'STORAGE_ORIGIN'|'RENDER_SITE_ORIGIN') {
  const value=(env as unknown as Record<string,string | undefined>)[key];
  if (!value) throw Error('Hosting origin is not configured.');
  const url=new URL(value);
  const local=process.env.NODE_ENV!=='production' && ['localhost','127.0.0.1'].includes(url.hostname);
  if ((!local && url.protocol!=='https:') || url.username || url.password || url.pathname!=='/' || url.search || url.hash) throw Error('Invalid hosting origin.');
  return url.origin;
}
export const requestOrigin=(req:Request)=>isRender()?hostingOrigin('PUBLIC_SITE_ORIGIN'):new URL(req.url).origin;
