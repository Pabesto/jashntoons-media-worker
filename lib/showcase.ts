import {env} from 'cloudflare:workers';
import {demoReels,type ShowcaseReel} from './showcase-data';
type PublicRow={id:string;slug:string;title:string;description:string;duration:number;published_at:number;instagram_url:string|null};
export async function showcaseReels():Promise<ShowcaseReel[]> {
 try {
  const rows=await env.DB!.prepare('SELECT id,slug,title,description,duration,published_at,instagram_url FROM marketing_reels WHERE published=1 ORDER BY published_at DESC').all<PublicRow>();
  return [...rows.results.map(row=>({id:row.id,slug:row.slug,title:row.title,description:row.description,duration:row.duration,created:new Date(row.published_at).toISOString(),video:`/api/showcase/${row.id}/media`,poster:`/api/showcase/${row.id}/media?kind=poster`,kind:'brand' as const,...(row.instagram_url?{instagram:row.instagram_url}:{})})),...demoReels];
 } catch {console.warn('Public marketing feed unavailable; showing studio demos.');return demoReels;}
}
