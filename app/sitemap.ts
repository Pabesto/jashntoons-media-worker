import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
import {invitationGuides} from '@/lib/invitation-guides';
import {showcaseReels} from '@/lib/showcase';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{return [
 ...['','/reels',...invitationGuides.map(g=>'/'+g.slug),'/privacy','/terms'].map(path=>({url:siteOrigin+path,changeFrequency:'weekly' as const,priority:path?0.7:1})),
 ...(await showcaseReels()).map(r=>({url:siteOrigin+'/reels/'+r.slug,lastModified:r.created,videos:[{title:r.title,description:r.description,thumbnail_loc:siteOrigin+r.poster,content_loc:siteOrigin+r.video}]}))
];}
