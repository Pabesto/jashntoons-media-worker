import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {APIError} from './api';
const output=z.object({script:z.string().min(80).max(850),caption:z.string().min(40).max(1800)}).strict();
export async function writeMarketingCopy(brief:{title:string;description:string;script:string;caption:string}){
 const e=env as unknown as Record<string,string|undefined>;
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':e.ANTHROPIC_API_KEY!,'anthropic-version':'2023-06-01','Content-Type':'application/json'},redirect:'error',signal:AbortSignal.timeout(60000),body:JSON.stringify({model:e.CLAUDE_MARKETING_MODEL,max_tokens:1000,system:'You write factual Hinglish marketing for Jashntoons. Return only a JSON object with script and caption strings. A spoken script is 55-85 words, Roman Hindi plus English; no hashtags or stage directions in speech. Use only these facts: Jashntoons is an AI invitation studio for weddings, birthdays and other celebrations. Users can add photos, characters, event details, voice and music, preview and export. Each account has 2 free standard reel credits; custom creations may cost more. Photos and drafts are private by default; public sharing is optional. AI likeness varies. Never claim best, number one, unlimited free, guaranteed results, guaranteed rankings, awards, exact likeness or user counts. No competitor names. End speech with jashntoons dot ai. Caption ends with: AI-generated brand presenter. Include 3-5 relevant hashtags and jashntoons.ai. Never invent offers or features.',messages:[{role:'user',content:JSON.stringify(brief)}]})});
 if(!r.ok)throw new APIError(502,'Claude returned HTTP '+r.status+'. Check API access.');
 const j=await r.json() as {content?:{type:string;text?:string}[];stop_reason?:string};if(j.stop_reason==='max_tokens')throw new APIError(502,'Claude copy was incomplete.');
 const raw=j.content?.filter(x=>x.type==='text').map(x=>x.text).join('')||'';let parsed:unknown;try{parsed=JSON.parse(raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}catch{throw new APIError(502,'Claude returned invalid campaign copy.');}
 const result=output.safeParse(parsed);if(!result.success)throw new APIError(502,'Claude copy needs review.');
 const text=result.data.script+' '+result.data.caption;if(/unlimited|guaranteed|number\s*(?:one|1)|#1|100%\s*free|completely\s*free|best\s+(?:ai|invitation)|bilkul\s*free|sabse\s*(?:best|achha)/i.test(text))throw new APIError(502,'Claude copy contains an unsupported claim.');
 if(!/AI-generated brand presenter\./i.test(result.data.caption))result.data.caption+='\n\nAI-generated brand presenter.';
 return result.data;
}
