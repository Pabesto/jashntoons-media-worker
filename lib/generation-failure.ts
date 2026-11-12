export type GenerationFailure={category:'moderation'|'input'|'unavailable'|'generation';message:string;retryable:boolean;code?:string};

/** Provider diagnostics are retained for support; only reviewed messages reach users. */
export function generationFailure(remote:{failureCode?:string;failure?:string},asset='video'):GenerationFailure{
 const code=remote.failureCode?.slice(0,160);
 if(code?.includes('SAFETY')||/content moderation/i.test(remote.failure??''))return {category:'moderation',code,retryable:false,message:`The AI ${asset} provider did not accept this request in its content review. It did not identify the exact photo or detail. This request will not be automatically submitted again.`};
 if(code?.startsWith('ASSET.INVALID'))return {category:'input',code,retryable:false,message:`The AI ${asset} provider could not read an attachment. Check the photo or recording before starting a new creation.`};
 if(code==='THIRD_PARTY.UNAVAILABLE')return {category:'unavailable',code,retryable:true,message:`The AI ${asset} service is temporarily unavailable. Your completed work is saved; try again later.`};
 return {category:'generation',code,retryable:true,message:`The AI ${asset} could not finish. Your completed work is saved and can be reused.`};
}
