// Prepare a reviewable GitHub code snapshot from an exact committed release.
// No credentials are read or written. Binary assets remain in its private archive.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {isUtf8} from 'node:buffer';

const output=path.resolve('outputs/github-source-snapshot.json');
if(process.argv[2]==='--emit'){
 const offset=Number(process.argv[3]);
 if(!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid offset');
 process.stdout.write(fs.readFileSync(output,'utf8').slice(offset,offset+80000));
}else{
 const git=(args,options={})=>execFileSync('git',args,{maxBuffer:32*1024*1024,...options});
 const commit=git(['rev-parse','HEAD']).toString().trim();
 if(git(['status','--porcelain']).toString().trim())throw Error('Commit all source changes before snapshotting.');
 const release=JSON.parse(fs.readFileSync('outputs/render-release-manifest.json','utf8'));
 if(release.commit!==commit||release.key!==`releases/${commit}/manifest.json`||!/^[a-f0-9]{64}$/.test(release.sha256))throw Error('Upload the matching committed release first.');
 const files=git(['ls-tree','-rlz',commit]).toString().split('\0').filter(Boolean).map(line=>{
  const [header,file]=line.split('\t'),[mode,type,sha,size]=header.trim().split(/\s+/);
  if(type!=='blob'||!['100644','100755'].includes(mode)||!file||file.startsWith('/')||file.split('/').includes('..'))throw Error('Unsupported Git entry');
  if(/(^|\/)(\.env(?:\..*)?|\.dev\.vars.*|node_modules|outputs|\.wrangler|\.sites-runtime)(\/|$)|\.(pem|key)$/i.test(file))throw Error('Unexpected private/generated tracked path');
  return {path:file,mode,sha,size:Number(size)};
 });
 const textExtensions=new Set(['.ts','.tsx','.js','.jsx','.cjs','.mjs','.json','.css','.html','.md','.yaml','.yml','.sql','.svg','.txt','.toml','.sh','.ps1']);
 const code=files.filter(f=>textExtensions.has(path.extname(f.path))||['.gitignore','.npmrc','.gitattributes'].includes(path.basename(f.path)));
 const raw=git(['cat-file','--batch'],{input:code.map(f=>f.sha).join('\n')+'\n'}),tree=[];let offset=0;
 for(const file of code){
  const end=raw.indexOf(10,offset),header=raw.subarray(offset,end).toString().split(' ');offset=end+1;
  if(header[0]!==file.sha||header[1]!=='blob'||Number(header[2])!==file.size)throw Error('Git blob mismatch');
  const content=raw.subarray(offset,offset+file.size);offset+=file.size+1;
  if(!isUtf8(content)||content.includes(0))throw Error('Non-text file in code snapshot: '+file.path);
  tree.push({path:file.path,mode:file.mode,type:'blob',content:content.toString('utf8')});
 }
 const codePaths=new Set(code.map(f=>f.path));
 const metadata={format:1,applicationCommit:commit,repository:'Pabesto/jashntoons-media-worker',branch:'jashntoons-web-source',archive:{storageOrigin:'https://jashntoons.jocoseavocet1.chatgpt.site',...release},binaryAssets:files.filter(f=>!codePaths.has(f.path)),restore:'The private archive contains every tracked file. See docs/source-sync.md; never commit a storage credential.'};
 tree.push({path:'.release/source-release.json',mode:'100644',type:'blob',content:JSON.stringify(metadata,null,2)+'\n'});
 const serialized=JSON.stringify({commit,tree_elements:tree});fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,serialized);
 console.log(JSON.stringify({commit,codeFiles:code.length,binaryAssets:metadata.binaryAssets.length,characters:serialized.length,chunkCharacters:80000}));
}
