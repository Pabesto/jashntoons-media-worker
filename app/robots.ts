import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:['/','/api/showcase/'],disallow:['/api/','/signin-with-chatgpt','/signout-with-chatgpt','/*?studio=','/*?my-reels=','/*?project=']},sitemap:siteOrigin+'/sitemap.xml',host:siteOrigin};}
