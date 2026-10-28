// Kismet 0.6 — filtered random discovery. ARENA_API_TOKEN stays server-side.
const API='https://api.are.na/v3/search';
const FORMATS=new Set(['all','images','gifs','videos','articles']);
const TOPICS=new Set(['','design','art','memes','engineering','architecture','fashion','technology','music','animation','photography','nsfw']);
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const token=process.env.ARENA_API_TOKEN;
 if(!token)return res.status(503).json({error:'ARENA_API_TOKEN is not configured',code:'NO_TOKEN'});
 const seed=String(req.query.seed||'12345').replace(/[^0-9]/g,'').slice(0,10)||'12345';
 const page=Math.max(1,Math.min(1000,parseInt(req.query.page,10)||1));
 const format=FORMATS.has(req.query.format)?req.query.format:'all';
 const topic=TOPICS.has(req.query.topic)?req.query.topic:'';
 const search=String(req.query.search||'').trim().slice(0,100).replace(/[\x00-\x1F]/g,' ');
 const terms=[topic,search].filter(Boolean).join(' ');
 const url=new URL(API);
 url.searchParams.set('query',terms||'*');
 url.searchParams.set('sort','random');url.searchParams.set('seed',seed);
 url.searchParams.set('page',String(page));url.searchParams.set('per','24');
 if(format==='images')url.searchParams.set('type','Image');
 else if(format==='gifs'){url.searchParams.set('type','Image,Attachment');url.searchParams.set('ext','gif')}
 else if(format==='videos')url.searchParams.set('type','Embed,Attachment');
 else if(format==='articles')url.searchParams.set('type','Link');
 else url.searchParams.set('type','Block');
 try{
  const upstream=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
  if(!upstream.ok){let message='Are.na search failed';try{const d=await upstream.json();message=d.details?.message||d.message||d.error||message}catch{}return res.status(upstream.status).json({error:message,code:upstream.status===403?'PREMIUM_REQUIRED':'UPSTREAM_ERROR'})}
  const data=await upstream.json();res.setHeader('Cache-Control','private, max-age=30');
  return res.status(200).json({data:data.data||[],meta:data.meta||{},format,topic,search});
 }catch{return res.status(502).json({error:'Could not connect to Are.na',code:'NETWORK_ERROR'})}
}
