export const dynamic = 'force-dynamic';
import { env } from 'cloudflare:workers';
import { getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath } from '@/app/chatgpt-auth';
import {studioCapabilities} from '@/lib/studio-automation';
import {providerStatus} from '@/lib/ai-providers';
import {getAppUser} from '@/lib/app-auth';
import {googleReady} from '@/lib/google-auth';
import { json } from '@/lib/api';
export async function GET(){const user=await getAppUser();return json({user:user?{name:user.displayName,email:user.email,provider:user.provider}:null,signin:chatGPTSignInPath('/?studio=1'),signout:'/api/auth/signout',googleReady:googleReady(),aiReady:!!env.OPENAI_API_KEY,generationReady:Object.values(providerStatus()).some(Boolean),studio:studioCapabilities(providerStatus()),checkoutReady:false});}
