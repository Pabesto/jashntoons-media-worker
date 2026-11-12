export const dynamic='force-dynamic';
import {guarded,identity,json,originCheck} from '@/lib/api';
import {advanceVoice,ownedVoiceJob} from '@/lib/voice-studio';
import {balance} from '@/lib/credits';
export const POST=(req:Request,{params}:{params:Promise<{id:string}>})=>guarded(async()=>{originCheck(req);const u=await identity(),{id}=await params;return json({...await advanceVoice(await ownedVoiceJob(u.userId,id)),...await balance(u.userId)});});
