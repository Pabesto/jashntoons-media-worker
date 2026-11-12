import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const [command,...args]=process.argv.slice(2);
if (!['build','dev','start'].includes(command)) throw Error('Expected build, dev or start.');
const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),command,...(command==='build'?['--webpack']:[]),...args],{
  stdio:'inherit',env:{...process.env,JASHNTOONS_RUNTIME:'render',NEXT_TELEMETRY_DISABLED:'1'},windowsHide:true,
});
const scheduler=command==='start'&&process.env.MARKETING_ENABLED==='1'?spawn(process.execPath,[fileURLToPath(new URL('../services/render-web/marketing-scheduler.mjs',import.meta.url))],{stdio:'inherit',env:process.env,windowsHide:true}):null;
const creationScheduler=command==='start'&&process.env.MEDIA_WORKER_ENABLED==='1'?spawn(process.execPath,[fileURLToPath(new URL('../services/render-web/creation-scheduler.mjs',import.meta.url))],{stdio:'inherit',env:process.env,windowsHide:true}):null;
creationScheduler?.on('error',()=>console.error('Could not start the reference video scheduler.'));
creationScheduler?.on('exit',code=>{if(code)console.error('Reference video scheduler stopped with code '+code);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{scheduler?.kill(signal);creationScheduler?.kill(signal);child.kill(signal)});
child.on('error',()=>{console.error('Could not start the Render runtime.');process.exitCode=1;});
child.on('exit',code=>{scheduler?.kill();creationScheduler?.kill();process.exitCode=code??1;});
