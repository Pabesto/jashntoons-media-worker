import type {Invite} from './templates';
export const avatarAnimations=[{id:'sway',name:'Gentle sway'},{id:'dance',name:'Dhol groove'},{id:'bounce',name:'Birthday bounce'},{id:'float',name:'Dreamy float'},{id:'parade',name:'Baraat entrance'},{id:'reveal',name:'Cinematic reveal'},{id:'still',name:'Still portrait'}] as const;
export type AvatarAnimation=typeof avatarAnimations[number]['id'];
export const studioEffects=[{id:'none',name:'No overlay'},{id:'petals',name:'Rose petals'},{id:'confetti',name:'Confetti party'},{id:'sparkles',name:'Golden sparkle'},{id:'marigold',name:'Marigold shower'},{id:'fireworks',name:'Sky fireworks'},{id:'balloons',name:'Rising balloons'},{id:'bokeh',name:'Dreamy bokeh'},{id:'stars',name:'Shooting stars'},{id:'lasers',name:'Disco lights'},{id:'bubbles',name:'Floating bubbles'}] as const;
export type StudioEffect=typeof studioEffects[number]['id'];
export function animateAvatar(c:CanvasRenderingContext2D,mode:AvatarAnimation|undefined,seconds:number,local:number,x:number,y:number,h:number){
 const m=mode??'sway',beat=Math.sin(seconds*3.4);
 if(m==='still')return;
 if(m==='parade')c.translate(Math.sin(seconds*.7)*24+(1-Math.min(local*5,1))*-130,Math.sin(seconds*3)*5);
 if(m==='float')c.translate(Math.sin(seconds*.65)*10,Math.sin(seconds*1.2)*14);
 if(m==='bounce')c.translate(0,-Math.abs(Math.sin(seconds*2.5))*24);
 if(m==='reveal'){const z=.94+.06*Math.min(local*5,1);c.translate(x,y+h*.45);c.scale(z,z);c.translate(-x,-y-h*.45);}
 if(m==='dance'||m==='sway'){c.translate(x,y+h*.45);c.rotate(Math.sin(seconds*(m==='dance'?3.4:1.2))*(m==='dance'?.035:.012));c.translate(-x,-y-h*.45);if(m==='dance')c.translate(beat*9,-Math.abs(beat)*10);}
}
export function drawAtmosphere(c:CanvasRenderingContext2D,data:Invite,seconds:number,effect:StudioEffect,intensity:number){
 const amount=Math.round(intensity*.48),palette=['#f5cc77','#f9a9c1','#bfddcf','#b9a5f3','#fff6d9'];
 if(effect==='lasers'){
  c.save();c.globalCompositeOperation='screen';for(let i=0;i<5;i++){const origin=i%2?700:20,angle=Math.sin(seconds*.45+i)*.5;c.save();c.translate(origin,1220);c.rotate(angle);const g=c.createLinearGradient(0,0,0,-1300);g.addColorStop(0,palette[i]+'00');g.addColorStop(.6,palette[i]+'38');g.addColorStop(1,palette[i]+'00');c.globalAlpha=intensity/170;c.fillStyle=g;c.beginPath();c.moveTo(-6,0);c.lineTo(-160,-1300);c.lineTo(130,-1300);c.lineTo(6,0);c.fill();c.restore();}c.restore();return;
 }
 for(let i=0;i<amount;i++){
  const x=(i*173+Math.sin(seconds*.45+i)*30+800)%720,y=(i*277+seconds*(effect==='balloons'||effect==='bubbles'?-20:22+i%5*6)+26000)%1280,r=3+i%6;
  c.save();c.fillStyle=palette[i%5];c.strokeStyle=palette[i%5];c.globalAlpha=.35+(i%4)*.13;
  if(effect==='fireworks'){const phase=(seconds*.28+i*.37)%1,xx=70+(i*193)%580,yy=80+(i*157)%650;c.globalAlpha=(1-phase)*intensity/120;c.lineWidth=2;for(let j=0;j<10;j++){const a=j*Math.PI/5,rr=phase*(65+i%4*22);c.beginPath();c.moveTo(xx+Math.cos(a)*rr*.72,yy+Math.sin(a)*rr*.72+phase*25);c.lineTo(xx+Math.cos(a)*rr,yy+Math.sin(a)*rr+phase*25);c.stroke();}}
  else if(effect==='bokeh'){const rr=14+r*3,g=c.createRadialGradient(x,y,0,x,y,rr);g.addColorStop(0,palette[i%5]+'72');g.addColorStop(1,palette[i%5]+'00');c.fillStyle=g;c.beginPath();c.arc(x,y,rr,0,Math.PI*2);c.fill();}
  else if(effect==='balloons'){c.globalAlpha=.38;c.beginPath();c.ellipse(x,y,r*3,r*4,Math.sin(seconds+i)*.12,0,Math.PI*2);c.fill();c.lineWidth=1;c.beginPath();c.moveTo(x,y+r*4);c.quadraticCurveTo(x+12,y+60,x,y+100);c.stroke();}
  else if(effect==='bubbles'){c.globalAlpha=.35;c.lineWidth=1.3;c.beginPath();c.arc(x,y,r*3,0,Math.PI*2);c.stroke();c.beginPath();c.arc(x-r,y-r,r*.5,0,Math.PI*2);c.fill();}
  else if(effect==='stars'){c.translate(x,y);c.rotate(-.5);c.fillRect(-r*2,0,r*4,1.5);c.fillRect(0,-r*2,1.5,r*4);c.globalAlpha=.15;c.fillRect(r*2,0,r*9,1);}
  else if(effect==='marigold'){c.translate(x,y);c.rotate(seconds*.5+i);c.fillStyle=i%2?'#ed9a2f':'#f5c840';for(let j=0;j<6;j++){c.rotate(Math.PI/3);c.beginPath();c.ellipse(r*.6,0,r,r*.55,0,0,Math.PI*2);c.fill();}}
  c.restore();
 }
}
