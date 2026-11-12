import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Original vector artwork. Each composition is assembled from deliberately
// drawn people, clothing, gestures and occasion props, rather than recoloured
// copies of a single silhouette. Run from the repository root to regenerate.
const output=resolve('public/studio/avatars');mkdirSync(output,{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const skins=['#e6ac7e','#ba7954','#8e563d','#d79970','#f0c49d','#714530','#ce9369'];
const hairs=['#30251f','#211f25','#513329','#745448','#242c2a','#a7a29b'];
const palettes=[['#a84753','#f5d28c'],['#226f68','#e5bf70'],['#634c8e','#e8bc8c'],['#d27c4b','#ffe2a2'],['#365d89','#e4bb72'],['#bb6689','#f7d6b3'],['#6d813d','#f4d28f'],['#674141','#dcc39b'],['#4b8f9f','#d9e8c7'],['#b08743','#ffebba']];
const flower=(x,y,r,color='#f0bd7d')=>`<g transform="translate(${x} ${y})">${Array.from({length:6},(_,i)=>`<ellipse cy="${-r*.7}" rx="${r*.4}" ry="${r*.72}" fill="${color}" transform="rotate(${i*60})"/>`).join('')}<circle r="${r*.3}" fill="#fff1bd"/></g>`;
const dots=(x,y,w,h,c='#edcc83',n=5)=>Array.from({length:n},(_,i)=>Array.from({length:4},(_,j)=>`<path d="M${x+i*w/(n-1)} ${y+j*h/3}l3 -5 3 5 -3 5Z" fill="${c}" opacity=".65"/>`).join('')).join('');
const seam=(d,color='#f2d492',width=3)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const chain=(y,w=36)=>`<path d="M${-w} ${y}Q0 ${y+40} ${w} ${y}" fill="none" stroke="#e9c16e" stroke-width="4"/><path d="M-8 ${y+20}l8 -7 8 7 -8 13Z" fill="#f6d47e" stroke="#b18445"/>`;

function head(p){
 const skin=skins[p.skin%skins.length],hair=p.elder?'#b5aaa0':hairs[p.hair%5],female=p.female;
 let back='';
 if(female){
  if(p.hair%4===0)back=`<path d="M-52 101Q-82 4 -5 13Q71 0 62 94L76 205Q18 240 -65 203Z" fill="${hair}"/>`;
  else if(p.hair%4===1)back=`<path d="M-51 99Q-64 28 -21 18Q36 -9 60 44L68 179Q28 211 -60 177Z" fill="${hair}"/><ellipse cx="58" cy="73" rx="29" ry="41" fill="${hair}"/>`;
  else if(p.hair%4===2)back=`<ellipse cy="72" rx="65" ry="66" fill="${hair}"/><circle cy="7" r="31" fill="${hair}"/>`;
  else back=`<path d="M-63 109Q-78 8 3 15Q83 10 63 123L40 165 -58 158Z" fill="${hair}"/>`;
 }else back=`<path d="M-50 76Q-67 4 -7 16Q48 -2 56 48L49 113 -48 109Z" fill="${hair}"/>`;
 const face=`<ellipse cx="-47" cy="91" rx="10" ry="16" fill="${skin}"/><ellipse cx="47" cy="91" rx="10" ry="16" fill="${skin}"/><path d="M-45 57Q0 32 46 58L43 111Q32 150 0 151Q-34 145 -44 110Z" fill="url(#skin${p.uid})"/><path d="M-39 100Q-25 110 -12 103M16 103Q29 109 40 100" stroke="#c77966" stroke-width="7" opacity=".19" stroke-linecap="round"/><path d="M-32 80Q-21 73 -10 79M12 79Q24 72 34 80" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/><path d="M-32 91Q-22 81 -11 91Q-21 99 -32 91M11 91Q22 82 33 91Q23 100 11 91" fill="#fff5e5"/><ellipse cx="-21" cy="91" rx="4.3" ry="6" fill="#302b2b"/><ellipse cx="22" cy="91" rx="4.3" ry="6" fill="#302b2b"/><circle cx="-19.5" cy="89" r="1.6" fill="#fff"/><circle cx="23.5" cy="89" r="1.6" fill="#fff"/><path d="M2 91l-5 17 8 2" fill="none" stroke="#955637" stroke-opacity=".55" stroke-width="2.1" stroke-linecap="round"/><path d="M-15 122Q0 135 17 120Q1 145 -15 122" fill="#883f3b"/><path d="M-11 123Q1 130 13 122" stroke="#fff4dc" stroke-width="3" fill="none"/>`;
 let fringe=female?`<path d="M-48 66Q-34 22 16 29Q-1 61 -47 77M13 28Q43 32 48 77Q20 65 13 28" fill="${hair}"/>`:`<path d="M-47 72L-52 43Q-23 8 21 21L49 41 48 76Q29 58 27 41Q-1 69 -47 72" fill="${hair}"/>`;
 if(p.hair%5===2&&!female)fringe+=Array.from({length:7},(_,i)=>`<circle cx="${-43+i*14}" cy="${40-Math.sin(i/6*Math.PI)*18}" r="17" fill="${hair}"/>`).join('');
 if(p.elder)fringe+=`<path d="M-37 107h-24M38 107h22M-34 114l-8 4M34 114l8 4" stroke="#8a604a" stroke-width="1.6" opacity=".6"/>`;
 if(!female&&!p.child&&p.hair%3===0)fringe+=`<path d="M-20 119Q-10 107 0 118Q11 107 22 119Q8 127 0 121Q-10 126 -20 119" fill="${hair}"/>`;
 if(p.glasses||p.elder)fringe+=`<g fill="none" stroke="#63504a" stroke-width="2.8"><rect x="-39" y="81" width="32" height="24" rx="9"/><rect x="8" y="81" width="32" height="24" rx="9"/><path d="M-7 89Q0 85 8 89M-40 88l-10 -3M40 88l10 -3"/></g>`;
 if(female){fringe+=`<circle cy="74" r="3" fill="#b84f58"/><path d="M-49 104l-8 12 9 13 7 -13ZM49 104l-7 12 8 13 8 -13Z" fill="#edc472" stroke="#b18246" stroke-width="1"/>`;if(p.hair%4===2)fringe+=flower(-19,9,14,'#f2d0a3');}
 if(p.turban)fringe+=`<path d="M-61 61Q-70 2 -10 2Q56 -10 65 44L47 65Q-5 41 -61 61" fill="${p.color}"/><path d="M-57 28Q-5 54 54 20M-51 13Q2 37 59 37M-56 47Q1 18 30 6" fill="none" stroke="${p.trim}" stroke-width="4"/><path d="M-34 4Q-59 -31 -49 -38Q-8 -12 -9 7" fill="${p.trim}"/><circle cx="12" cy="43" r="7" fill="#f3d891"/>`;
 if(p.graduate)fringe+=`<path d="M-52 27L-52 7Q0 -8 53 7L53 29Q0 12 -52 27" fill="#262e48"/><path d="M-88 8L0 -23 88 8 0 34Z" fill="#38465e" stroke="#192439" stroke-width="2"/><path d="M0 6L66 20 66 76" stroke="#e5bf63" stroke-width="3" fill="none"/><path d="M60 72h12l4 22H56Z" fill="#e5bf63"/>`;
 if(p.crown)fringe+=`<path d="M-46 27l-9 -31 25 15 20 -27 16 27 27 -24 9 31 21 -11 -10 28Z" fill="#eac36c" stroke="#b68d45" stroke-width="2"/><circle cy="11" r="6" fill="${p.color}"/>`;
 if(p.partyHat)fringe+=`<path d="M-38 24L0 -54 38 24Z" fill="${p.color}" stroke="${p.trim}" stroke-width="3"/><path d="M-23 -6l46 13M-12 -31l27 10" stroke="${p.trim}" stroke-width="7"/><circle cy="-54" r="10" fill="${p.trim}"/>`;
 if(p.headphones)fringe+=`<path d="M-56 90Q-79 4 0 2Q80 6 57 90" fill="none" stroke="#384754" stroke-width="13"/><rect x="-68" y="66" width="19" height="44" rx="9" fill="#e4b16a"/><rect x="50" y="66" width="19" height="44" rx="9" fill="#e4b16a"/>`;
 return back+`<path d="M-19 133v39Q0 192 20 169v-38" fill="${skin}"/>`+face+fringe;
}

function clothes(p){
 const c=p.color,g=p.trim,d=p.uid,female=p.female;
 const shoes=`<path d="M-66 621l47 -2 3 30Q-35 663 -83 653Q-90 639 -66 621M20 620l46 1Q90 638 84 650Q44 664 18 648Z" fill="${p.child?'#e8c788':'#533d36'}"/><path d="M-77 649l57 -4M23 646l54 4" stroke="${g}" stroke-width="3"/>`;
 let outfit='';
 if(['lehenga','gown','dress'].includes(p.outfit)){
  outfit=`<path d="M-62 169Q0 149 62 169L48 321 -47 321Z" fill="url(#cloth${d})"/><path d="M-46 309Q-83 417 -139 617Q0 668 138 617L47 309Z" fill="url(#skirt${d})"/>`;
  outfit+=Array.from({length:9},(_,i)=>{let x=-117+i*29;return `<path d="M${x*.36} 328Q${x*.66} 463 ${x} 617" stroke="${g}" stroke-opacity=".24" stroke-width="3" fill="none"/>`}).join('');
  outfit+=seam('M-128 596Q0 640 128 596',g,9)+seam('M-125 578Q0 620 125 578',g,2)+dots(-96,411,185,137,g,6)+`<path d="M-47 305h94v15h-94Z" fill="${g}"/>`;
  if(p.outfit==='lehenga')outfit+=`<path d="M-55 168Q-16 250 96 325L119 597 71 618Q50 403 -59 213Z" fill="${g}" fill-opacity=".38" stroke="${g}" stroke-width="3"/>`;
  if(p.outfit==='gown')outfit+=`<path d="M-51 166L0 222 51 166 30 265 -25 264Z" fill="${g}" fill-opacity=".25"/>`;
  if(p.outfit==='dress')outfit+=`<path d="M-21 314l-37 -21 -4 45 41 -16 24 42 14 -44 45 15 -6 -45 -39 23Z" fill="${g}"/>`;
 }else if(p.outfit==='sari'){
  outfit=`<path d="M-65 170Q0 152 66 171L50 311 75 631Q18 657 -67 634L-48 303Z" fill="url(#cloth${d})"/><path d="M-54 171Q39 243 62 291L-50 635 -88 623Q-45 430 -55 171Z" fill="${g}"/><path d="M-45 174Q26 227 48 279L-61 630" fill="none" stroke="${c}" stroke-width="10"/><path d="M-27 367L-9 633M-12 370L12 636M4 373L31 633" stroke="${g}" opacity=".55" stroke-width="3"/>`+dots(-30,428,66,140,g,3);
 }else{
  outfit=`<path d="M-69 357L-14 351 -12 625 -69 628 -85 465ZM14 352L70 357 86 465 69 628 12 625Z" fill="${p.outfit==='suit'?'#3a4656':p.outfit==='casual'?'#395a77':g}"/><path d="M-46 435l8 183M44 437l-7 183" fill="none" stroke="#292e3a" stroke-opacity=".15" stroke-width="3"/>`;
  if(p.outfit==='suit'||p.outfit==='blazer')outfit+=`<path d="M-69 167L-22 154 22 154 69 169 80 380Q45 405 0 377Q-45 405 -80 380Z" fill="url(#cloth${d})"/><path d="M-25 158L0 186 25 158 15 294 -13 294Z" fill="#fff0dc"/><path d="M-11 180L0 175 12 180 6 194 14 267 0 287 -13 267 -6 194Z" fill="${g}"/><path d="M-25 156L-51 187 -31 212 -48 229 0 312M25 156L51 187 31 212 48 229 0 312" stroke="${g}" stroke-width="2.4" fill="none"/><path d="M34 235h29v8H34Z" fill="${g}"/><circle cy="329" r="4" fill="${g}"/>`;
  else if(p.outfit==='robe')outfit+=`<path d="M-65 167L-21 156 21 156 65 167 101 558Q0 601 -101 558Z" fill="#344354"/><path d="M-21 157L0 205 21 157 34 510 14 526 0 311 -15 526 -35 509Z" fill="${c}" stroke="${g}" stroke-width="3"/>`;
  else if(p.outfit==='jumpsuit')outfit+=`<path d="M-62 169L-26 153 0 185 26 153 62 169 68 375 -68 375Z" fill="url(#cloth${d})"/><path d="M-68 353h136v17H-68Z" fill="${g}"/><circle cy="361" r="13" fill="none" stroke="#e9d190" stroke-width="5"/>`;
  else if(p.outfit==='casual')outfit+=`<path d="M-69 171L-26 157Q0 190 26 157L69 171 76 356Q0 377 -75 356Z" fill="url(#cloth${d})"/><path d="M-27 159Q0 196 28 159" fill="none" stroke="${g}" stroke-width="7"/><path d="M-18 227l18 -26 19 26 -7 29 -25 1Z" fill="${g}" opacity=".85"/>`;
  else outfit+=`<path d="M-67 167L-22 154 22 154 67 168 79 443Q0 474 -79 443Z" fill="url(#cloth${d})"/><path d="M-21 154L-15 181 16 181 22 154" fill="${g}"/><path d="M0 181v255" stroke="${g}" stroke-width="3"/>`+Array.from({length:6},(_,i)=>`<circle cx="8" cy="${208+i*33}" r="3.5" fill="${g}"/>`).join('')+seam('M-73 427Q0 452 73 427',g,7)+dots(-53,240,99,148,g,4);
 }
 if(female)outfit+=chain(174);
 if(p.outfit==='sherwani')outfit+=`<path d="M-55 175Q-96 287 -33 440L-59 450Q-131 300 -73 182Z" fill="${g}"/><path d="M-55 177Q-94 282 -34 439" fill="none" stroke="#fff1b7" stroke-width="4"/>`;
 return shoes+outfit;
}

function arms(p){
 const skin=skins[p.skin%skins.length],c=p.color,g=p.trim;
 let left=[-68,187,-101,264,-89,350],right=[68,187,100,267,88,350];
 if(p.gesture==='wave')right=[65,187,115,142,112,55];
 if(p.gesture==='dance'){left=[-65,189,-119,154,-149,83];right=[65,188,119,157,148,87];}
 if(p.gesture==='namaste'){left=[-67,185,-88,259,-9,237];right=[67,185,88,259,9,237];}
 if(['hold','dhol','cake','baby','bouquet','book','diploma','diya','dj','gift','camera'].includes(p.prop)||p.gesture==='hold'){left=[-65,186,-96,285,-33,322];right=[65,186,99,282,35,319];}
 if(p.prop==='balloons')right=[66,188,110,263,143,309];
 if(p.prop==='briefcase')right=[67,185,96,273,100,378];
 const arm=(a,side)=>{const [x1,y1,x2,y2,x3,y3]=a;return `<path d="M${x1} ${y1}Q${x2} ${y2} ${x3} ${y3}" fill="none" stroke="${c}" stroke-width="35" stroke-linecap="round"/><path d="M${x2+(x3-x2)*.54} ${y2+(y3-y2)*.54}L${x3} ${y3}" fill="none" stroke="${skin}" stroke-width="24" stroke-linecap="round"/><path d="M${x3-9} ${y3-16}l18 1" stroke="${g}" stroke-width="5"/><ellipse cx="${x3}" cy="${y3+4}" rx="12" ry="17" fill="${skin}" transform="rotate(${side==='l'?-20:20} ${x3} ${y3})"/>`};
 let extra='';if(p.gesture==='namaste')extra=`<path d="M-8 237L-7 208Q-3 198 0 208L0 241M8 237L7 208Q3 198 0 208L0 241" fill="${skin}" stroke="#a56c48" stroke-width="1.2"/>`;
 return arm(left,'l')+arm(right,'r')+extra;
}

function prop(p){
 const c=p.color,g=p.trim;
 switch(p.prop){
  case 'dhol':return `${p.standalone?'':'<path d="M-43 171L115 332" stroke="#e9c375" stroke-width="12"/>'}<g transform="translate(0 337) rotate(-9)"><path d="M-103 -48Q0 -77 103 -48L103 60Q0 83 -103 60Z" fill="#ba6a3b"/><path d="M-89 -48L-43 66 -3 -62 42 68 91 -46M-89 62L-45 -60 1 74 48 -60 91 62" fill="none" stroke="#f4d696" stroke-width="4"/><ellipse cx="-105" cy="6" rx="26" ry="62" fill="#fff0d2" stroke="#704531" stroke-width="7"/><ellipse cx="105" cy="6" rx="25" ry="62" fill="#ecd3aa" stroke="#704531" stroke-width="7"/><ellipse cx="105" cy="6" rx="16" ry="46" fill="none" stroke="#b79261" stroke-width="2"/><path d="M-110 -55V66M110 -54V66" stroke="#f1bb60" stroke-width="4"/></g><path d="M-34 314L-109 257M32 312L110 251Q120 237 125 243" fill="none" stroke="#6f4734" stroke-width="7" stroke-linecap="round"/>`;
  case 'cake':return `<g transform="translate(0 298)"><ellipse cy="68" rx="94" ry="12" fill="#f0d3a0"/><rect x="-66" y="0" width="132" height="65" rx="13" fill="#e5a0a2"/><ellipse rx="66" ry="16" fill="#fbe8c7"/><path d="M-65 7Q-52 31 -41 11Q-26 35 -13 12Q0 36 14 13Q29 35 40 12Q55 32 65 5" fill="#fbe8c7"/><path d="M-39 -4v-35M0 -8v-38M39 -4v-35" stroke="${c}" stroke-width="8"/><path d="M-39 -46q-12 -16 0 -25q12 14 0 25M0 -53q-12 -16 0 -25q12 14 0 25M39 -46q-12 -16 0 -25q12 14 0 25" fill="#f4bd51"/><circle cx="-30" cy="44" r="5" fill="#fff0cc"/><circle cy="49" r="5" fill="#fff0cc"/><circle cx="30" cy="44" r="5" fill="#fff0cc"/></g>`;
  case 'balloons':return `<g><path d="M143 315Q182 221 139 126M143 315Q97 202 90 101M143 315Q215 227 202 123" fill="none" stroke="#bb9a68" stroke-width="2"/><ellipse cx="140" cy="59" rx="43" ry="59" fill="${g}"/><ellipse cx="91" cy="47" rx="36" ry="51" fill="#e5a0ae"/><ellipse cx="201" cy="68" rx="39" ry="54" fill="${c}"/><path d="M140 117l-8 12h15ZM90 96l-7 12h14ZM200 121l-8 11h15Z" fill="#c18d68"/><path d="M124 23q-12 18 -8 36M78 14q-10 11 -9 28M186 37q-11 11 -10 29" stroke="#fff6de" stroke-opacity=".6" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
  case 'bouquet':return `<g transform="translate(0 300)"><path d="M-42 -11L-13 95 21 91 49 -13" fill="#81965d"/><path d="M-29 30l25 69M36 10l-33 88M4 6l2 88" stroke="#45684f" stroke-width="4"/>${[[-40,-13,24],[-8,-38,29],[29,-24,26],[43,7,22],[-15,7,25]].map(([x,y,r],i)=>flower(x,y,r,i%2?'#e1a5ac':g)).join('')}<path d="M-18 73l-26 -9 -1 24 26 -7 22 27 6 -27 27 13 -1 -30 -28 10Z" fill="${c}"/></g>`;
  case 'baby':return `<g transform="translate(0 301) rotate(-17)"><path d="M-48 -26Q0 -46 47 -22L66 66Q20 111 -41 78L-64 26Z" fill="#f1dab7" stroke="#c8ab85" stroke-width="2"/><ellipse cy="-23" rx="33" ry="38" fill="${skins[(p.skin+1)%skins.length]}"/><path d="M-28 -35Q-8 -61 26 -38" fill="none" stroke="#4d3930" stroke-width="9"/><path d="M-21 -18q8 7 15 0M9 -18q8 7 15 0" fill="none" stroke="#664331" stroke-width="2"/><path d="M-7 0q8 7 14 -1" fill="none" stroke="#a36459" stroke-width="2"/><path d="M-57 13L42 77M53 10L-30 69" stroke="#d4b987" stroke-width="3"/><path d="M-27 23l7 -9 7 9 -7 9ZM12 45l7 -9 7 9 -7 9Z" fill="${c}" opacity=".45"/></g>`;
  case 'book':return `<g transform="translate(0 312) rotate(-8)"><rect x="-64" y="-41" width="128" height="110" rx="5" fill="${g}"/><path d="M0 -35Q-32 -51 -57 -35V59Q-31 46 0 61Q34 46 58 60V-35Q32 -50 0 -35" fill="#fff2d5"/><path d="M0 -34V61M-44 -17h29M-44 -5h29M14 -17h29M14 -5h29" stroke="#ba9f72" stroke-width="2"/></g>`;
  case 'diploma':return `<g transform="translate(0 320) rotate(-16)"><rect x="-80" y="-21" width="160" height="44" rx="20" fill="#f6e8c7" stroke="#bd9d67" stroke-width="2"/><ellipse cx="76" cy="1" rx="10" ry="19" fill="#dbcba7"/><path d="M-7 -22h19v46H-7Z" fill="${c}"/><path d="M-5 9l-12 53 19 -10 14 9 -6 -52" fill="${c}"/><circle cx="3" cy="1" r="13" fill="#dab56e"/></g>`;
  case 'diya':return `<g transform="translate(0 325)"><ellipse cy="17" rx="79" ry="13" fill="#d5a45e"/><path d="M-48 -12Q0 63 48 -12Z" fill="#b76c45"/><ellipse cy="-12" rx="48" ry="10" fill="#f6cd75"/><path d="M0 -15Q-31 -50 0 -84Q29 -47 0 -15" fill="#edb84e"/><path d="M0 -19Q-15 -45 0 -61Q14 -39 0 -19" fill="#fff2ac"/></g>`;
  case 'dj':return `<g transform="translate(0 366)"><path d="M-155 -22H155L171 70H-171Z" fill="#273e49" stroke="#e1bf81" stroke-width="5"/><ellipse cx="-91" cy="18" rx="44" ry="28" fill="#18272e" stroke="#7c9ba2" stroke-width="3"/><ellipse cx="91" cy="18" rx="44" ry="28" fill="#18272e" stroke="#7c9ba2" stroke-width="3"/><ellipse cx="-91" cy="18" rx="15" ry="9" fill="${c}"/><ellipse cx="91" cy="18" rx="15" ry="9" fill="${g}"/>${Array.from({length:4},(_,i)=>`<path d="M${-29+i*19} -6v45" stroke="#769291" stroke-width="3"/><rect x="${-33+i*19}" y="${2+i*5}" width="8" height="6" fill="#eed09b"/>`).join('')}<path d="M-132 71l-16 159M132 71l16 159" stroke="#324c50" stroke-width="10"/></g>`;
  case 'gift':return `<g transform="translate(0 327)"><rect x="-64" y="-32" width="128" height="91" rx="6" fill="${g}"/><path d="M-66 -32H66v22H-66Z" fill="#f6deae"/><path d="M-10 -32h20v91h-20Z" fill="${c}"/><path d="M0 -34Q-64 -82 -43 -89Q-4 -95 0 -34Q8 -94 45 -86Q61 -70 0 -34" fill="none" stroke="${c}" stroke-width="11"/></g>`;
  case 'briefcase':return `<g transform="translate(103 427)"><rect x="-55" y="-31" width="110" height="90" rx="9" fill="#85583d" stroke="#5e3d31" stroke-width="3"/><path d="M-23 -32v-18h46v18" fill="none" stroke="#5e3d31" stroke-width="8"/><path d="M-54 -9Q0 13 54 -9" stroke="#c09b6b" stroke-width="3" fill="none"/><rect x="-7" y="-7" width="14" height="18" rx="3" fill="#dfbd78"/></g>`;
  case 'camera':return `<g transform="translate(0 320)"><rect x="-62" y="-27" width="124" height="76" rx="10" fill="#3b4f54"/><rect x="-40" y="-39" width="38" height="17" rx="5" fill="#3b4f54"/><circle cy="10" r="31" fill="#172f3b" stroke="#a4b9b8" stroke-width="7"/><circle cy="10" r="17" fill="#538b97"/><circle cx="8" cy="3" r="7" fill="#c6ded7" opacity=".6"/><rect x="38" y="-17" width="14" height="10" fill="#ead6a7"/></g>`;
  case 'cane':return `<path d="M100 354Q126 331 131 365L128 645" stroke="#826047" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M117 646h23" stroke="#4b4d45" stroke-width="8" stroke-linecap="round"/>`;
  case 'suitcase':return `<g transform="translate(130 508)"><path d="M-21 -68v-45h40v45" fill="none" stroke="#7c7369" stroke-width="7"/><rect x="-47" y="-64" width="96" height="146" rx="18" fill="${c}" stroke="${g}" stroke-width="4"/><path d="M-24 -43V60M0 -43V60M24 -43V60" stroke="${g}" stroke-width="3" opacity=".5"/><circle cx="-28" cy="86" r="10" fill="#4a4d48"/><circle cx="28" cy="86" r="10" fill="#4a4d48"/><path d="M-14 -1l28 -12 8 20 -27 11Z" fill="#f1dcab"/></g>`;
  case 'keys':return `<g transform="translate(96 371)"><circle r="19" fill="none" stroke="#e9bf66" stroke-width="6"/><path d="M-10 15l-13 62M10 15l14 60M-23 64l15 3M24 62l13 -4" stroke="#d1a453" stroke-width="8" stroke-linecap="round"/></g>`;
  case 'plant':return `<g transform="translate(0 343)"><path d="M-43 -14L-31 60H32L44 -14Z" fill="#ba7f60"/><path d="M0 -15v-80M0 -43l-31 -21M0 -63l31 -21" stroke="#527357" stroke-width="5"/><path d="M-2 -42Q-56 -82 -55 -34Q-30 -15 -2 -42M0 -63Q61 -111 58 -58Q28 -38 0 -63M0 -83Q-29 -132 -6 -137Q31 -117 0 -83" fill="#6f8e63"/><path d="M-43 -14H44V0H-43Z" fill="#e3ae80"/></g>`;
  default:return '';
 }
}

function person(options,uid){
 const p={female:false,outfit:'kurta',gesture:'relaxed',prop:'',skin:0,hair:0,color:'#a64953',trim:'#edca87',...options,uid};
 const defs=`<linearGradient id="skin${uid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${skins[p.skin%skins.length]}"/><stop offset="1" stop-color="${skins[p.skin%skins.length]}"/><stop offset="1" stop-color="#8a5038" stop-opacity=".15"/></linearGradient><linearGradient id="cloth${uid}" x1="0" y1="0" x2="1" y2=".3"><stop stop-color="${p.color}"/><stop offset=".52" stop-color="${p.color}"/><stop offset="1" stop-color="#352c36" stop-opacity=".88"/></linearGradient><linearGradient id="skirt${uid}" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${p.color}"/><stop offset=".55" stop-color="${p.color}"/><stop offset="1" stop-color="#382d36" stop-opacity=".88"/></linearGradient>`;
 const body=clothes(p)+arms(p)+prop(p);
 return `<defs>${defs}</defs>`+head(p)+(p.child?`<g transform="translate(0 34) scale(1 .78)">${body}</g>`:body);
}

const groupData=[
 ['wedding','Wedding',['The Rosewater Couple','Ivory Namaste','Emerald Vows','A Royal Welcome','Sunset Bride','Saffron Sherwani','The Garden Promise','Pearl & Pomegranate','The Wedding Family','Champagne Together']],
 ['baraat','Dhol & Baraat',['Dhol Da Jashn','The Bhangra Duo','Genda Phool Dholi','Baraati Besties','Punjab Da Swag','The Dancing Groom','Rhythm & Rang','Dholki Sisters','The Welcome Band','Baraat Afterglow']],
 ['birthday','Birthday',['Cake Day Kid','The Balloon Explorer','Confetti Birthday Girl','Little Crown Big Day','Birthday Best Friends','Sweet Sixteen','The Birthday Baker','Party Hat Hero','Birthday Together','Golden Birthday Queen']],
 ['party','Party',['Midnight DJ','Disco Dancing Duo','The Rooftop Host','All That Glitters','The Neon Besties','Camera Ready','House Party Hero','The Champagne Dancers','Music & Mischief','The Afterparty Crew']],
 ['baby-shower','Baby shower',['A Little Love','Parents in Bloom','The Sunshine Mama','Hello Little Wonder','A Gift for Baby','The Proud Grandparents','The New Chapter','Our Tiny Adventure','Balloons for Baby','Baby in Our Arms']],
 ['engagement','Engagement',['The Big Yes','Rings & Roses','Together in Emerald','The Modern Promise','Rose Gold Romance','A Blush Bride','A New Beginning','Engaged & Dancing','The Garden Sweethearts','With All Our Love']],
 ['anniversary','Anniversary',['Still Choosing You','Golden Years Together','The Candlelight Pair','Another Beautiful Year','Our Flower Story','The Silver Couple','Date Night Again','Always & Forever','A Family Milestone','The Anniversary Dance']],
 ['housewarming','Housewarming',['New Keys New Dreams','The Plant Parents','Welcome Home Family','Griha Pravesh Hosts','The First Doorway','A Little Green Corner','Keys to Our Forever','The Housewarming Gift','Neighbours & Friends','Our New Beginning']],
 ['festivals','Festivals',['Diwali Diya Couple','Eid Together','The Festival Dancers','Lights & Laughter','The Gift of Joy','A Festive Namaste','Rakhi Celebrations','Navratri Rang','Christmas Gift Day','The Family Jashn']],
 ['business','Business',['The Launch Founder','Creative Partners','The Studio Owner','The Grand Opening Host','The Photographer','The Team Celebration','A New Venture','The Boutique Founder','The Book Launch','The Office Party']],
 ['graduation','Graduation',['Caps Off Graduate','The Dream Achiever','Graduating Together','First Class Joy','The Proud Family','Next Chapter Scholar','Diploma Day','The Graduation Wave','The Celebration Duo','A Future in Bloom']],
 ['retirement','Retirement',['More Sunsets Together','The World Awaits','The Garden Chapter','The Grand Goodbye','A Well Earned Pause','Adventure Partners','The Story Collector','The Golden Wanderers','Happy New Freedom','The Retirement Party']],
 ['naming-ceremony','Naming ceremony',['Our Little Name','The Proud Parents','A Blessing in Arms','Little One Big Love','Grandparents Welcome','The Cradle Celebration','A Bouquet for Baby','Tiny Gift Day','Our New Family','The Balloon Blessing']],
 ['haldi-mehendi','Haldi & Mehendi',['Haldi Ki Rani','The Mehendi Couple','Yellow & Happy','The Sangeet Sisters','Genda Dholi','A Little Mehendi','The Haldi Dance','Emerald Bridesmaids','The Family Haldi','Mehendi Under Stars']],
];

function cast(key,i){
 const [color,trim]=palettes[i],base={skin:i%7,hair:i%5,color,trim},woman={...base,female:true,outfit:'lehenga'},man={...base,outfit:'sherwani'},casual={...base,outfit:'casual'},pair=(a=woman,b=man)=>[{...a,x:207,scale:.94},{...b,x:432,scale:.94}],solo=p=>[{...p,x:320,scale:1.04}],family=(baby=false)=>[{...woman,prop:baby?'baby':'',x:191,scale:.91},{...man,x:439,scale:.91},...(!baby?[{...casual,child:true,partyHat:true,x:326,scale:.55}]:[])];
 const gesture=['namaste','wave','relaxed','hold','dance'][i%5];
 switch(key){
  case 'wedding':return i===4?solo({...woman,prop:'bouquet'}):i===5?solo({...man,turban:true,gesture:'namaste'}):i===8?family():pair({...woman,gesture:i%3===0?'namaste':'relaxed',prop:i%3===1?'bouquet':''},{...man,turban:i%2===0,gesture:i%3===0?'namaste':'relaxed',skin:(i+3)%7,color:palettes[(i+3)%10][0]});
  case 'baraat':return i===1||i===3||i===6?pair({...woman,gesture:'dance',outfit:i===3?'sari':'lehenga'},{...man,gesture:'dance',turban:true,color:palettes[(i+2)%10][0]}):i===7?pair({...woman,prop:'dhol'},{...woman,gesture:'dance',skin:(i+2)%7,color:'#d39746'}):i===8?pair({...man,prop:'dhol',turban:true},{...man,prop:'dhol',skin:(i+4)%7,color:'#4b7884'}):solo({...man,prop:i===5?'':'dhol',gesture:i===5?'dance':'hold',turban:true});
  case 'birthday':return i===4?pair({...casual,child:true,partyHat:true,prop:'cake',scale:.84},{...woman,child:true,outfit:'dress',prop:'balloons',scale:.82}):i===8?pair({...woman,outfit:'dress',prop:'cake'},{...casual,partyHat:true,gesture:'wave'}):solo({...i%2||i===2?woman:casual,child:i<5,outfit:i%2||i===2?'dress':'casual',prop:i%3===0?'cake':i%3===1?'balloons':'gift',partyHat:i%3!==1,crown:i===3||i===9,gesture:i===7?'wave':'hold'});
  case 'party':return i===0||i===8?solo({...casual,headphones:true,prop:'dj',glasses:i===8}):i===1||i===4||i===7||i===9?pair({...woman,outfit:'gown',gesture:'dance'},{...man,outfit:'blazer',gesture:'dance',color:palettes[(i+2)%10][0]}):solo({...i%2?woman:casual,outfit:i%2?'jumpsuit':'blazer',prop:i===5?'camera':i===2?'gift':'',gesture:i===6?'wave':'dance',glasses:i===6});
  case 'baby-shower':return i===1||i===3||i===6||i===9?family(true):i===5?pair({...woman,elder:true,outfit:'sari',prop:'baby'},{...man,elder:true,gesture:'namaste'}):solo({...woman,outfit:'gown',prop:i===4?'gift':i===8?'balloons':'baby'});
  case 'engagement':return i===5?solo({...woman,outfit:'gown',prop:'bouquet'}):pair({...woman,outfit:i%2?'gown':'lehenga',prop:i%3===1?'bouquet':'',gesture:i===7?'dance':'relaxed'},{...man,outfit:i%2?'suit':'sherwani',skin:(i+2)%7,color:palettes[(i+4)%10][0],gesture:i===7?'dance':'relaxed'});
  case 'anniversary':return i===8?family():pair({...woman,elder:i===1||i===5,outfit:i%2?'sari':'gown',prop:i===4?'bouquet':'',gesture:i===9?'dance':'relaxed'},{...man,elder:i===1||i===5,outfit:i%2?'kurta':'suit',color:palettes[(i+5)%10][0],gesture:i===9?'dance':'relaxed'});
  case 'housewarming':return i===2?family():i===1||i===6||i===9?pair({...woman,outfit:'sari',prop:i===1?'plant':'keys'},{...man,outfit:'kurta',prop:i===9?'gift':'',color:palettes[(i+2)%10][0]}):solo({...i%2?woman:man,outfit:i%2?'sari':'kurta',prop:i===5?'plant':i===7?'gift':i===3?'diya':'keys',gesture:i===4?'wave':'hold'});
  case 'festivals':return i===0||i===1||i===2?pair({...woman,outfit:i===1?'gown':'lehenga',prop:i===0?'diya':'',gesture:i===2?'dance':'namaste'},{...man,turban:i===2,gesture:i===2?'dance':'namaste',color:palettes[(i+2)%10][0]}):i===9?family():solo({...i%2?woman:man,outfit:i%2?'lehenga':'kurta',prop:i===4||i===8?'gift':i===3?'diya':'',gesture:i===5?'namaste':i===7?'dance':'hold'});
  case 'business':return i===1||i===5?pair({...woman,outfit:'blazer',prop:i===1?'book':'gift'},{...man,outfit:'suit',prop:'briefcase',color:palettes[(i+4)%10][0]}):solo({...i%2?woman:man,outfit:i%2?'blazer':'suit',prop:i===4?'camera':i===8?'book':i===7?'plant':'briefcase',glasses:i%3===0,gesture:i===3?'wave':'relaxed'});
  case 'graduation':return i===2||i===8?pair({...woman,outfit:'robe',graduate:true,prop:'diploma'},{...man,outfit:'robe',graduate:true,gesture:'wave',color:palettes[(i+4)%10][0]}):i===4?[{...woman,outfit:'sari',x:145,scale:.85},{...man,outfit:'suit',x:500,scale:.85},{...casual,outfit:'robe',graduate:true,prop:'diploma',x:324,scale:.76}]:solo({...i%2?woman:man,outfit:'robe',graduate:true,prop:i===5?'book':i===9?'bouquet':'diploma',gesture:i===7?'wave':'hold',glasses:i%3===0});
  case 'retirement':return [0,5,7].includes(i)?pair({...woman,elder:true,outfit:'sari',prop:i===5?'camera':'bouquet'},{...man,elder:true,outfit:'kurta',prop:i===7?'suitcase':'cane',color:palettes[(i+4)%10][0]}):solo({...i%2?woman:man,elder:true,outfit:i%2?'sari':'kurta',prop:i===1?'suitcase':i===2?'plant':i===6?'book':i===9?'gift':'cane',gesture:i===8?'wave':'relaxed'});
  case 'naming-ceremony':return [1,3,8].includes(i)?family(true):i===4?pair({...woman,elder:true,outfit:'sari',prop:'baby'},{...man,elder:true,gesture:'namaste'}):solo({...woman,outfit:i%2?'sari':'lehenga',prop:i===6?'bouquet':i===7?'gift':i===9?'balloons':'baby'});
  case 'haldi-mehendi':return i===1||i===3||i===7?pair({...woman,color:i===7?'#39715d':'#d7a03c',gesture:'dance'},{...i===1?man:woman,color:i===1?'#d9b75b':'#b77e39',gesture:'dance',skin:(i+2)%7}):i===8?family():solo({...i===4?man:woman,color:i===5||i===9?'#417262':'#d19b3c',trim:'#f7df9d',prop:i===4?'dhol':i===0?'bouquet':'',gesture:i===6?'dance':i===9?'namaste':'wave',turban:i===4});
  default:return solo({...woman,gesture});
 }
}

const avatars=[];
for(const [key,category,names] of groupData){
 for(let i=0;i<10;i++){
  const id=`${key}-${String(i+1).padStart(2,'0')}`,people=cast(key,i),pose=['baraat','party','haldi-mehendi'].includes(key)?'dance':key==='birthday'?'bounce':['baby-shower','naming-ceremony'].includes(key)?'float':['business','graduation'].includes(key)?'still':'sway';
  const tags=[category,...new Set(people.flatMap(p=>[p.prop,p.outfit,p.gesture,p.elder?'elder':p.child?'child':'adult']).filter(Boolean))];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800" role="img" aria-labelledby="title"><title id="title">${esc(names[i])} — original illustrated celebration characters</title>${people.map((p,n)=>{const scale=p.child&&people.length===1?1.22:p.scale??1,x=p.prop==='balloons'&&p.x>400?408:p.x;return `<g transform="translate(${x} ${766-(p.child?550:660)*scale}) scale(${scale})">${person(p,`${i}-${n}`)}</g>`}).join('')}</svg>`;
  writeFileSync(resolve(output,id+'.svg'),svg);
  avatars.push({id,name:names[i],category,src:`/studio/avatars/${id}.svg`,pose,tags});
 }
}
const propDirectory=resolve('public/studio/props');mkdirSync(propDirectory,{recursive:true});
const propRows=[['dhol','Celebration dhol'],['cake','Birthday cake'],['balloons','Party balloons'],['disco','Disco mirrorball'],['marigold','Marigold garland'],['lantern','Celebration lantern'],['diya','Golden diya'],['confetti','Confetti burst'],['gift','Wrapped surprise'],['crown','Birthday crown'],['graduation','Graduation cap'],['camera','Memory maker']];
const props=propRows.map(([id,name])=>{
 let art='';const p={prop:id,color:'#a85066',trim:'#efcd84',skin:1,standalone:true};
 if(['dhol','cake','diya','gift','camera'].includes(id)){const [s,cy]=({dhol:[1.15,337],cake:[1.4,302],diya:[1.6,290],gift:[1.6,315],camera:[2,322]})[id];art=`<g transform="translate(160 ${160-cy*s}) scale(${s})">${prop(p)}</g>`;}
 else if(id==='balloons')art=`<g transform="translate(13 7) scale(.97)">${prop(p)}</g>`;
 else if(id==='disco')art=`<defs><radialGradient id="orb"><stop stop-color="#faf1d2"/><stop offset=".5" stop-color="#b9cbd4"/><stop offset="1" stop-color="#758495"/></radialGradient><clipPath id="clip"><circle cx="160" cy="160" r="105"/></clipPath></defs><path d="M160 8v49" stroke="#c2a76f" stroke-width="4"/><circle cx="160" cy="160" r="105" fill="url(#orb)"/><g clip-path="url(#clip)" stroke="#667f8d" stroke-width="2" fill="none">${Array.from({length:9},(_,i)=>`<ellipse cx="160" cy="160" rx="${12+i*12}" ry="105"/><path d="M53 ${64+i*24}H267"/>`).join('')}</g><path d="M57 52v29M43 67h29M268 238v35M250 255h36" stroke="#e0b965" stroke-width="4"/><path d="M236 37l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5Z" fill="#e8c982"/>`;
 else if(id==='marigold')art=`<path d="M31 37Q47 270 161 270Q276 271 289 37" fill="none" stroke="#547953" stroke-width="14"/>${Array.from({length:13},(_,i)=>{const a=Math.PI-i*Math.PI/12;return flower(160+122*Math.cos(a),40+230*Math.sin(a),18,i%2?'#e5a541':'#f4cc63')}).join('')}<path d="M31 28l-16 -13 3 36 18 11 15 -15ZM288 28l16 -13 -3 36 -18 11 -15 -15Z" fill="#71905b"/>`;
 else if(id==='lantern')art=`<defs><linearGradient id="glow"><stop stop-color="#ffe4a3"/><stop offset="1" stop-color="#d49b52"/></linearGradient></defs><path d="M160 5v45" stroke="#987040" stroke-width="4"/><path d="M115 73l20 -29h50l20 29 32 154 -31 38H114l-31 -38Z" fill="url(#glow)" stroke="#99764c" stroke-width="7"/><path d="M115 73h90M83 227h154M114 265h92M135 75l-16 150M185 75l16 150M160 77v147" stroke="#ac844a" stroke-width="5"/><path d="M135 123l25 -21 25 21 -25 22ZM132 185l28 -21 28 21 -28 22Z" fill="#fff1c6"/><path d="M141 268v36M160 268v43M179 268v36" stroke="#ca9851" stroke-width="5"/>`;
 else if(id==='confetti')art=`<path d="M49 274L89 151 169 230Z" fill="#b35c7d" stroke="#eacb88" stroke-width="5"/><path d="M70 213l58 40M81 184l67 43" stroke="#efd18c" stroke-width="13"/>${Array.from({length:27},(_,i)=>{const x=94+(i*67)%195,y=25+(i*43)%201;return i%3===0?`<path d="M${x} ${y}q-16 15 3 26t-2 25" fill="none" stroke="${['#d3a148','#aa668a','#6b9a8d'][i%3]}" stroke-width="5"/>`:`<rect x="${x}" y="${y}" width="${5+i%5}" height="${10+i%7}" rx="2" fill="${['#e6b65f','#bb6386','#6b9c91','#738aad'][i%4]}" transform="rotate(${i*37} ${x} ${y})"/>`}).join('')}`;
 else if(id==='crown')art=`<path d="M48 122l-17 -60 66 47 62 -79 62 79 67 -46 -18 168H50Z" fill="#e6bd64" stroke="#ac8343" stroke-width="6"/><path d="M50 207h220v37H50Z" fill="#f3dca0" stroke="#ac8343" stroke-width="5"/><path d="M159 91l24 37 -24 37 -24 -37Z" fill="#a85066"/><circle cx="82" cy="160" r="13" fill="#5d978e"/><circle cx="238" cy="160" r="13" fill="#5d978e"/><circle cx="30" cy="62" r="11" fill="#f4db97"/><circle cx="159" cy="28" r="11" fill="#f4db97"/><circle cx="289" cy="62" r="11" fill="#f4db97"/>`;
 else if(id==='graduation')art=`<path d="M80 144v79Q160 267 240 223v-79" fill="#354b63" stroke="#1e3549" stroke-width="4"/><path d="M13 129L160 68l147 61 -147 63Z" fill="#52687d" stroke="#243f54" stroke-width="4"/><path d="M160 128l100 24v99" stroke="#e8bf6a" stroke-width="5" fill="none"/><circle cx="160" cy="128" r="7" fill="#e8bf6a"/><path d="M251 240h18l8 44h-34Z" fill="#e8bf6a"/>`;
 writeFileSync(resolve(propDirectory,id+'.svg'),`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-labelledby="title"><title id="title">${esc(name)}</title>${art}</svg>`);
 return {id,name,src:`/studio/props/${id}.svg`};
});
writeFileSync(resolve('lib/studio-avatars.ts'),`// Generated by scripts/generate-studio-avatars.mjs. Original Jashntoons vector artwork.\nexport type StudioAvatar={id:string;name:string;category:string;src:string;pose:'dance'|'sway'|'bounce'|'float'|'still';tags:string[]};\nexport const studioAvatars:StudioAvatar[]=${JSON.stringify(avatars,null,2)};\nconst avatarIndex=new Map(studioAvatars.map(a=>[a.id,a]));\nexport function getStudioAvatar(id:string|undefined){return id?avatarIndex.get(id):undefined;}\nexport const studioProps:{id:string;name:string;src:string}[]=${JSON.stringify(props,null,2)};\n`);
console.log(`Generated ${avatars.length} original avatars across ${groupData.length} occasions and ${props.length} standalone props.`);
