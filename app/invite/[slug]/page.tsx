import {notFound} from 'next/navigation';
import {publishedInvitation,publicInvitationLink} from '@/lib/invitation-links';
import {siteOrigin} from '@/lib/seo';
import {InvitationLinkPage} from '../../components/InvitationLinkPage';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params,row=await publishedInvitation(slug);if(!row)return {title:'Invitation unavailable | Jashntoons',robots:{index:false,follow:false}};const data=publicInvitationLink(row),title=data.names+' — You’re invited',description=data.message||'Join us for our celebration.';return {title,description,robots:{index:false,follow:false},openGraph:{title,description,url:siteOrigin+'/invite/'+slug,type:'website',...(data.photo?{images:[{url:siteOrigin+data.photo,alt:data.names}]}:{})}}}
export default async function Invitation({params}:{params:Promise<{slug:string}>}){const {slug}=await params,row=await publishedInvitation(slug);if(!row)notFound();return <main className="guest-page"><InvitationLinkPage data={publicInvitationLink(row)}/></main>}
