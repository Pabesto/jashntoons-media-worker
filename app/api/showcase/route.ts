import {showcaseReels} from '@/lib/showcase';
export const dynamic='force-dynamic';
export async function GET(){return Response.json({reels:(await showcaseReels()).slice(0,12)},{headers:{'Cache-Control':'public, max-age=30'}})}
