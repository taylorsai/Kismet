// Server-only Sightengine visual moderation. Do not expose API credentials in VITE_ variables.
// Unchecked media are NOT considered safe. A classification applies to the preview only.
const cache = new Map();
const TTL = 12 * 60 * 60 * 1000;
const MAX_CACHE = 1200;
const CONCURRENCY = 8;

function imageUrl(b){
 const choices=[b.image?.display?.url,b.image?.large?.url,b.image?.original?.url,b.image?.url,b.image?.src,b.cover?.url,b.attachment?.thumb?.url,b.attachment?.image?.url,b.attachment?.url,b.preview?.url,b.content?.image?.url];
 return choices.find(u=>{try{const x=new URL(u);return ['https:','http:'].includes(x.protocol)&&!['localhost','127.0.0.1'].includes(x.hostname)}catch{return false}})||'';
}
function isVisual(b){const kind=String(b.class||b.type||'').toLowerCase();return !!imageUrl(b)||/image|video|embed|attachment/.test(kind)}
export async function moderateBlock(b){
 if(!isVisual(b))return {...b,wrenModeration:'safe'};
 const url=imageUrl(b);

 // Without a preview there is no way to verify a video. Block until a real video-frame service is connected.
 if(!url)return {...b,wrenModeration:'unverified'};
 const key=String(b.id||'')+'|'+url;
 const prior=cache.get(key);if(prior&&Date.now()-prior.at<TTL)return {...b,wrenModeration:prior.status};
 const id=process.env.SIGHTENGINE_API_USER,secret=process.env.SIGHTENGINE_API_SECRET;
 if(!id||!secret)return {...b,wrenModeration:'unverified'};
 let status='unverified';
 try{
  const params=new URLSearchParams({url,models:'nudity-2.1',api_user:id,api_secret:secret});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);
  let response;try{response=await fetch('https://api.sightengine.com/1.0/check.json?'+params.toString(),{signal:controller.signal})}finally{clearTimeout(timer)}
  if(response.ok){const data=await response.json();const n=data.nudity;
   if(data.status==='success'&&n&&['sexual_activity','sexual_display','erotica'].every(k=>typeof n[k]==='number')){
    status=(n.sexual_activity>=0.65||n.sexual_display>=0.65||n.erotica>=0.80)?'explicit':'safe';
   }
  }
 }catch{}
 // Metadata can only make the classification more cautious, not certify media safe.

 if(cache.size>=MAX_CACHE)cache.delete(cache.keys().next().value);
 cache.set(key,{status,at:Date.now()});
 return {...b,wrenModeration:status};
 } 
export async function moderateBatch(blocks,{mature=false}={}){
 const out=[];
 // Bounded concurrency to avoid spikes in paid moderation calls.
 for(let i=0;i<blocks.length;i+=CONCURRENCY){const group=await Promise.all(blocks.slice(i,i+CONCURRENCY).map(moderateBlock));out.push(...group)}
 return mature?out:out.filter(b=>b.wrenModeration!=='explicit');
}
