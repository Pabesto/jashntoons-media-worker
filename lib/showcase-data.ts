export type ShowcaseReel={id:string;slug:string;title:string;description:string;video:string;poster:string;created:string;duration:number;kind:'demo'|'brand';instagram?:string};
// Existing studio samples, clearly labelled as demos. Never private customer uploads.
export const demoReels:ShowcaseReel[]=[
 {id:'demo-haveli',slug:'shaadi-ka-ghar',title:'Shaadi Ka Ghar',description:'A wedding invitation demo with a haveli welcome, family blessings and celebration details.',video:'/full-films/haveli-celebration/full-reel.mp4',poster:'/full-films/haveli-celebration/arrival.webp',created:'2026-11-12T00:00:00+05:30',duration:52,kind:'demo'},
 {id:'demo-garden',slug:'the-royal-door',title:'The Royal Door',description:'A royal garden wedding invitation demo with opening doors, name cards and a wedding itinerary.',video:'/full-films/royal-garden/full-reel.mp4',poster:'/full-films/royal-garden/doors.webp',created:'2026-11-12T00:00:00+05:30',duration:40,kind:'demo'},
 {id:'demo-rajasthan',slug:'padharo-sa',title:'Padharo, Sa!',description:'A Rajasthan wedding invitation demo with a moving rickshaw, invitation scroll and golden forts.',video:'/full-films/rajasthan-journey/full-reel.mp4',poster:'/full-films/rajasthan-journey/scroll.webp',created:'2026-11-12T00:00:00+05:30',duration:45,kind:'demo'}
];
