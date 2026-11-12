export const dynamic='force-dynamic';
import {guarded,identity,json} from '@/lib/api';
import {listCreationLibrary} from '@/lib/creation-library';
export const GET=()=>guarded(async()=>{const u=await identity();return json(await listCreationLibrary(u.userId));});
