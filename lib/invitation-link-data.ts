import {z} from 'zod';

export const linkOccasions=['Wedding','Birthday','Engagement','Anniversary','Baby shower','Housewarming','Other'] as const;
const date=z.string().refine(v=>!v||(/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number(v.slice(0,4))>=1900&&Number(v.slice(0,4))<=2100&&!Number.isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v),'Choose a valid event date.');
export const invitationLinkSchema=z.object({
 names:z.string().trim().max(100),occasion:z.enum(linkOccasions),host:z.string().trim().max(100),message:z.string().trim().max(600),style:z.enum(['peach','royal','garden']),
 photoId:z.string().uuid().nullable(),reelId:z.string().uuid().nullable(),rsvpPhone:z.string().trim().refine(v=>!v||/^\+?[1-9]\d{7,14}$/.test(v),'Use a WhatsApp number with country code, for example +91 followed by the number.'),
 events:z.array(z.object({name:z.string().trim().max(60),date,time:z.string().regex(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/),venue:z.string().trim().max(140),address:z.string().trim().max(250)}).strict()).min(1).max(8),
}).strict();
export type InvitationLinkData=z.infer<typeof invitationLinkSchema>;
export type InvitationLinkView=Omit<InvitationLinkData,'photoId'|'reelId'> & {photo:string|null;reel:string|null};
export type SavedInvitationLink={id:string;slug:string;version:number;updated:number;published:boolean;hasUnpublishedChanges:boolean;data:InvitationLinkData;url:string};
export function blankInvitationLink():InvitationLinkData{return {names:'',occasion:'Wedding',host:'',message:'We would love to celebrate this beautiful moment with you.',style:'peach',photoId:null,reelId:null,rsvpPhone:'',events:[{name:'The celebration',date:'',time:'',venue:'',address:''}]}}
export function publishLinkProblem(data:InvitationLinkData){if(data.names.length<2)return 'Add the names or celebration title.';if(data.events.some(e=>e.name.length<2||!e.date||e.venue.length<2))return 'Add a name, date and venue for every function.';return null}
export function invitationDate(value:string){if(!value)return 'Your celebration date';return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'))}
export function invitationTime(value:string){if(!value)return '';const [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`}
