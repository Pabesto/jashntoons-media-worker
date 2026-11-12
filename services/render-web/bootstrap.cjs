// Render's build command runs this against an immutable private source release.
// The existing worker repository is only the build trigger; it is never modified.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createHash}=require('node:crypto'),{spawnSync}=require('node:child_process');
async function build() {
  if(process.platform!=='linux')throw Error('This bootstrap runs only in the Render Linux builder.');
  const origin=new URL(process.env.STORAGE_ORIGIN),secret=process.env.STORAGE_BRIDGE_SECRET;
  const manifestKey=process.env.APP_RELEASE_MANIFEST,expected=process.env.APP_RELEASE_SHA256;
  if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.username||origin.password||origin.search||origin.hash||!secret||secret.length<32)throw Error('Missing private storage configuration.');
  if(!/^releases\/[a-f0-9]{40}\/manifest\.json$/.test(manifestKey||'')||!/^[a-f0-9]{64}$/.test(expected||''))throw Error('Invalid immutable release.');
  async function get(key){const u=new URL('/api/hosting/storage',origin);u.searchParams.set('action','get');u.searchParams.set('key',key);const r=await fetch(u,{headers:{Authorization:'Bearer '+secret},redirect:'error',signal:AbortSignal.timeout(180000)});if(!r.ok)throw Error('Private source download failed: '+r.status);return r;}
  const manifestText=await(await get(manifestKey)).text();if(manifestText.length>64000)throw Error('Invalid manifest size.');
  const manifest=JSON.parse(manifestText),prefix=manifestKey.slice(0,manifestKey.lastIndexOf('/')+1);
  if(manifest.sha256!==expected||!Array.isArray(manifest.chunks)||!manifest.chunks.length||manifest.chunks.length>20)throw Error('Invalid manifest.');
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'jashntoons-build-')),archive=path.join(directory,'source.tar.gz');
  const hash=createHash('sha256');let size=0;
  try {
    for(let i=0;i<manifest.chunks.length;i++){
      const part=manifest.chunks[i];
      if(part.key!==prefix+'part-'+i||!/^[a-f0-9]{64}$/.test(part.sha256)||!Number.isSafeInteger(part.size)||part.size<1||part.size>64000000)throw Error('Invalid release chunk.');
      const bytes=Buffer.from(await(await get(part.key)).arrayBuffer());
      if(bytes.length!==part.size||createHash('sha256').update(bytes).digest('hex')!==part.sha256)throw Error('Release chunk verification failed.');
      size+=bytes.length;hash.update(bytes);fs.appendFileSync(archive,bytes);
    }
    if(size!==manifest.size||hash.digest('hex')!==expected)throw Error('Source release verification failed.');
    const work=path.resolve('.render-release-app');
    if(path.dirname(work)!==process.cwd()||path.basename(work)!=='.render-release-app')throw Error('Invalid build directory.');
    fs.rmSync(work,{recursive:true,force:true});fs.mkdirSync(work);
    const result=spawnSync('tar',['-xzf',archive,'-C',work],{stdio:'inherit'});if(result.status!==0)throw Error('Source extraction failed.');
    console.log('Verified Jashntoons release '+manifestKey.split('/')[1]);
  } finally { fs.rmSync(directory,{recursive:true,force:true}); }
}
build().catch(()=>{console.error('Private Jashntoons source preparation failed. Check release metadata and runtime settings.');process.exitCode=1;});
