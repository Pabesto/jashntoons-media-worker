import streams from './reel-streams.json';
type Stream={video:string;bytes:number;sourceBytes:number};
export const reelPlaybackSource=(source:string)=>(streams as Record<string,Stream>)[source]?.video??source;
export function reelWindow(index:number,count:number){const start=Math.max(0,index-1),end=Math.min(count,index+2);return {start,end};}
export function reelIndexAt(scrollTop:number,height:number,count:number){return height>0?Math.max(0,Math.min(count-1,Math.round(scrollTop/height))):0;}
