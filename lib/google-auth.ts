import {env} from 'cloudflare:workers';
export const googleReady=()=>!!(env.GOOGLE_CLIENT_ID?.trim()&&env.GOOGLE_CLIENT_SECRET?.trim());
export const SESSION_COOKIE='__Host-jashntoons-session',STATE_COOKIE='__Host-jashntoons-oauth';
export const encode64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export const randomToken=()=>encode64(crypto.getRandomValues(new Uint8Array(32)));
export const tokenHash=async(value:string)=>encode64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
export function cookieValue(header:string|null,name:string){return header?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)??'';}
export const privateCookie=(name:string,value:string,age:number)=>`${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
function decode64(value:string){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
type GoogleClaims={sub:string;aud:string;iss:string;exp:number;iat:number;nonce:string;email:string;email_verified:boolean;name?:string;azp?:string};
let certificates:{expires:number;keys:(JsonWebKey&{kid:string})[]}|null=null;
export async function verifyGoogleToken(token:string,nonce:string):Promise<GoogleClaims>{
 const parts=token.split('.');if(parts.length!==3)throw new Error('Invalid Google identity');
 const header=JSON.parse(new TextDecoder().decode(decode64(parts[0]))),claims=JSON.parse(new TextDecoder().decode(decode64(parts[1]))) as GoogleClaims;
 if(header.alg!=='RS256'||typeof header.kid!=='string')throw new Error('Invalid Google signature');
 if(!certificates||certificates.expires<Date.now()||!certificates.keys.some(k=>k.kid===header.kid)){
  const response=await fetch('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Google verification unavailable');
  const result=await response.json() as {keys:(JsonWebKey&{kid:string})[]};certificates={keys:result.keys,expires:Date.now()+3600000};
 }
 const jwk=certificates.keys.find(k=>k.kid===header.kid);if(!jwk)throw new Error('Unknown Google signature');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw new Error('Invalid Google signature');
 const now=Date.now()/1000;
 if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss)||claims.aud!==env.GOOGLE_CLIENT_ID||claims.azp&&claims.azp!==env.GOOGLE_CLIENT_ID||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||claims.nonce!==nonce||claims.email_verified!==true||typeof claims.email!=='string'||!claims.email.includes('@')||typeof claims.sub!=='string'||!claims.sub)throw new Error('Invalid Google identity');
 return claims;
}
