'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Download} from 'lucide-react';
import {offers,priceCart,type CartItem} from '@/lib/plans';
export async function request<T=any>(path:string,options?:RequestInit):Promise<T>{const res=await fetch(path,options);const data=await res.json() as T & {error?:string};if(!res.ok)throw Object.assign(new Error(data.error||'Please try again.'),{status:res.status});return data;}
export function useCommerce(signedIn:boolean,notify:(s:string)=>void){
 const [credits,setCredits]=useState<{remaining:number;used:number;total:number}|null>(null),[items,setItems]=useState<CartItem[]>([]),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
 const refresh=async()=>{if(signedIn)try{setCredits(await request('/api/credits'))}catch{}};
 useEffect(()=>{let active=true;setLoaded(false);refresh();(async()=>{try{const local=JSON.parse(localStorage.getItem('jashntoons-cart')||'[]') as CartItem[];const valid=local.length?(priceCart(local),local):[];let next=valid;if(signedIn){const remote=await request<{items:CartItem[]}>('/api/cart');next=valid.length?valid:remote.items;if(valid.length)await request('/api/cart',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:next})});}if(active)setItems(next);}catch{if(active)setItems([])}finally{if(active)setLoaded(true)}})();return()=>{active=false}},[signedIn]);
 async function update(next:CartItem[]){if(busy||!loaded)return;setBusy(true);try{if(next.length)priceCart(next);if(signedIn)await request('/api/cart',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:next})});setItems(next);localStorage.setItem('jashntoons-cart',JSON.stringify(next));}catch(e){notify((e as Error).message)}finally{setBusy(false)}}
 async function add(planId:string){const old=items.find(i=>i.planId===planId);await update(old?items.map(i=>i.planId===planId?{...i,quantity:Math.min(offers.find(p=>p.id===planId)?.maxQuantity??1,i.quantity+1)}:i):[...items,{planId,quantity:1}]);setOpen(true)}
 return {credits,items,open,setOpen,busy:busy||!loaded,refresh,update,add};
}
export type Commerce=ReturnType<typeof useCommerce>;
export function CreditBar({commerce:c,onUpgrade}:{commerce:Commerce;onUpgrade?:()=>void}){return <div className="credit-bar"><span><b>{c.credits?.remaining??2}</b> {c.credits?'credits remaining':'free reels with your account'}</span><button onClick={onUpgrade??(()=>c.setOpen(true))}>Reel packs <ArrowUpRight size={14}/></button></div>}
export {Pricing} from './Pricing';
export {Cart} from './Cart';
export {CompletedReels} from './CreatorReels';
