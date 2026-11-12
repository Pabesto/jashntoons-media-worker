import {env} from 'cloudflare:workers';
import {guarded,json} from '@/lib/api';
import {workerAuth} from '@/lib/media-worker';
import {advanceCreation} from '@/lib/creation-jobs';
import type {ReelJob} from '@/lib/credits';
export const dynamic='force-dynamic';
export const POST=(req:Request)=>guarded(async()=>{workerAuth(req);const jobs=await env.DB!.prepare("SELECT * FROM reel_jobs WHERE status IN ('generating','processing') AND json_extract(CASE WHEN json_valid(payload) THEN payload ELSE '{}' END,'$.kind')='directed-reel' ORDER BY updated LIMIT 3").bind().all<ReelJob>();for(const job of jobs.results){try{await advanceCreation(job);}catch{/* Persisted job and provider IDs are checked again, never blindly resubmitted. */}}return json({checked:jobs.results.length});});
