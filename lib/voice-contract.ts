import type {Invite} from './templates';
export const VOICE_CREDITS=1;
export const TALKING_CREDITS=5;
export type TalkingClip={jobId:string;videoId:string;audioId:string;referenceId:string;voiceId:string;script:string;duration:number};
export type VoiceDraft={voiceId?:string;referenceId?:string;script:string};
export type VoiceJobView={id:string;kind:'voice-profile'|'talking-reel';name?:string;status:string;phase?:string;error?:string;sampleId?:string;audioId?:string;videoId?:string;referenceId?:string;voiceId?:string;script?:string};
export function introDuration(data:Invite){return data.directedReel?0:data.talkingClip?.duration??0;}
export function reelDuration(data:Invite){return data.duration+introDuration(data);}
