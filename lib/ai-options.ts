// Safe to import in the browser: capabilities only, never credentials.
export type ImageProvider='runway'|'openai'|'google';
export type MotionProvider='none'|'runway'|'google';
export type ProviderStatus=Record<ImageProvider,boolean>;
export const emptyProviders:ProviderStatus={runway:false,openai:false,google:false};
export const imageProviders=[
 {id:'openai',name:'OpenAI',detail:'Illustrated characters & transparent cutouts',cutout:true},
 {id:'google',name:'Google Nano Banana',detail:'Personalised, complete illustrated scenes',cutout:false},
 {id:'runway',name:'Runway',detail:'Illustrated characters & transparent cutouts',cutout:true},
] as const;
export function selectedImageProvider(choice:ImageProvider|'auto'|undefined,status:ProviderStatus):ImageProvider|undefined{
 if(choice&&choice!=='auto')return choice;
 return imageProviders.find(p=>status[p.id])?.id;
}
export const providerName=(id:ImageProvider)=>imageProviders.find(p=>p.id===id)!.name;
