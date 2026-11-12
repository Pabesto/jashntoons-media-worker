export const dynamic='force-dynamic';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {guarded,identity,json,originCheck,APIError,smallJson} from '@/lib/api';
import {priceCart} from '@/lib/plans';
export const GET=()=>guarded(async()=>{const u=await identity();const row=await env.DB!.prepare('SELECT items FROM carts WHERE owner=?').bind(u.userId).first<{items:string}>();return json({items:row?JSON.parse(row.items):[],checkoutReady:false});});
export const PUT=(req:Request)=>guarded(async()=>{originCheck(req);const u=await identity();const body=z.object({items:z.array(z.object({planId:z.string(),quantity:z.number().int().min(1).max(5)})).max(4)}).safeParse(await smallJson(req));if(!body.success)throw new APIError(400,'Please check your cart.');let total={amount:0,credits:0,currency:'INR'};try{if(body.data.items.length)total=priceCart(body.data.items)}catch{throw new APIError(400,'This pack is not available.');}await env.DB!.prepare('INSERT INTO carts(owner,items,updated) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET items=excluded.items,updated=excluded.updated').bind(u.userId,JSON.stringify(body.data.items),Date.now()).run();return json({...total,items:body.data.items,checkoutReady:false});});
