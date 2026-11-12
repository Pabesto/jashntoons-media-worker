import type {Metadata} from 'next';

export const siteOrigin='https://jashntoons.ai';
export const tagline='Your people. Your story. Your invitation.';
export const siteDescription='Create AI wedding invitations, birthday videos and digital cards with your photos, characters and voice. Start with 2 free standard reel credits on Jashntoons.';
export function pageMetadata(title:string,description:string,path:string,image='/brand/jashntoons-social.png'):Metadata {
 return {title,description,alternates:{canonical:siteOrigin+path},openGraph:{type:'website',siteName:'Jashntoons',locale:'en_IN',url:siteOrigin+path,title,description,images:[{url:siteOrigin+image,width:1200,height:630,alt:'Jashntoons — '+tagline}]},twitter:{card:'summary_large_image',title,description,images:[siteOrigin+image]}};
}
export const jsonLd=(data:unknown)=>JSON.stringify(data).replace(/</g,'\\u003c');
export const brandSchema={'@context':'https://schema.org','@graph':[
 {'@type':'Organization','@id':siteOrigin+'/#organization',name:'Jashntoons',url:siteOrigin,logo:siteOrigin+'/brand/jashntoons-logo.svg',slogan:tagline},
 {'@type':'WebSite','@id':siteOrigin+'/#website',name:'Jashntoons',url:siteOrigin,inLanguage:['en','hi'],publisher:{'@id':siteOrigin+'/#organization'}},
 {'@type':'WebApplication',name:'Jashntoons AI Invitation Studio',url:siteOrigin,applicationCategory:'DesignApplication',operatingSystem:'Web browser',description:siteDescription,offers:{'@type':'Offer',price:'0',priceCurrency:'INR',description:'2 free standard reel credits per account. Additional creations and custom design may cost extra.'},featureList:['AI video invitations','Personal photo characters','Wedding and birthday templates','Voice and music','Matching digital invitation cards']}
]};
