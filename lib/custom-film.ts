import type {Invite} from './templates';
export const CUSTOM_FILM_CREDITS=5;
export const CUSTOM_FILM_SECONDS=10;
export const CUSTOM_FILM_ID='haveli-namaste';
export const customFilm=(data:Pick<Invite,'templateId'|'creationTier'|'aiMoment'|'creation'>)=>!data.creation&&(!!data.aiMoment||data.creationTier==='custom'||data.templateId===CUSTOM_FILM_ID);
export function customFilmDraft(data:Invite):Invite{return {...data,creationTier:'custom',duration:CUSTOM_FILM_SECONDS,generationMode:'scene',avatarMode:'scene',aiMotion:true,generatedArt:undefined,generatedVideo:undefined,generationJobId:undefined,pendingGenerationId:undefined,scenes:['opening','closing']};}
export function wavInfo(bytes:Uint8Array){
 const text=(at:number,n:number)=>String.fromCharCode(...bytes.subarray(at,at+n));
 if(bytes.length<44||text(0,4)!=='RIFF'||text(8,4)!=='WAVE')throw Error('Upload a valid WAV recording.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let format=0,channels=0,rate=0,bits=0,block=0,data=0;
 for(let at=12;at+8<=bytes.length;){const size=view.getUint32(at+4,true),end=at+8+size;if(end>bytes.length)throw Error('The recording is incomplete.');const name=text(at,4);if(name==='fmt '&&size>=16){format=view.getUint16(at+8,true);channels=view.getUint16(at+10,true);rate=view.getUint32(at+12,true);block=view.getUint16(at+20,true);bits=view.getUint16(at+22,true);}if(name==='data')data+=size;at=end+(size%2);}
 if(format!==1||![1,2].includes(channels)||bits!==16||rate<8000||rate>48000||block!==channels*2||!data||data%block)throw Error('Use a PCM WAV recording.');
 const duration=data/(rate*block);if(duration<.5||duration>60.1)throw Error('Choose audio between 0.5 and 60 seconds.');return {duration,mime:'audio/wav'};
}
