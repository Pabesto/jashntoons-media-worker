// Runs inside the existing web service. No browser login or client credential storage.
let stopped=false,timer;
const stop=()=>{stopped=true;clearTimeout(timer)};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
const enabled=process.env.MARKETING_ENABLED==='1';
if(enabled){
 const missing=['MARKETING_AUTOMATION_SECRET','ANTHROPIC_API_KEY','CLAUDE_MARKETING_MODEL','HEYGEN_API_KEY','HEYGEN_AVATAR_ID','HEYGEN_VOICE_ID','INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_USER_ID','INSTAGRAM_GRAPH_VERSION'].filter(k=>!process.env[k]);
 if(missing.length){console.error('Marketing scheduler inactive; missing configuration: '+missing.join(', '));}
 else {
  const tick=async()=>{if(stopped)return;try{const r=await fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/marketing/tick',{method:'POST',headers:{Authorization:'Bearer '+process.env.MARKETING_AUTOMATION_SECRET},signal:AbortSignal.timeout(240000)});console.log('Marketing scheduler HTTP '+r.status);}catch{console.error('Marketing scheduler could not complete this tick.');}if(!stopped)timer=setTimeout(tick,60000);};
  timer=setTimeout(tick,30000);
 }
}
