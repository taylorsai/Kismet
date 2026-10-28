// wren 0.7 — filtered random discovery. ARENA_API_TOKEN stays server-side.
const API='https://api.are.na/v3/search';
const FORMATS=new Set(['all','images','gifs','videos','articles']);
const TOPICS=new Set(['','art','design','illustration','typography','graphic-design','photography','animation','music','fashion','film','anime','memes','internet-culture','architecture','interiors','nature','objects','engineering','technology','surreal','experimental','nostalgia','web-art','archives','oddities','nsfw']);
const NSFW_TERMS=['artistic nudity','female form','figure photography','fine art nude','life drawing','figure study','editorial portraiture','body studies','intimate portrait photography'];
const TOPIC_TERMS={'graphic-design':'graphic design','internet-culture':'internet culture','web-art':'web art',nsfw:'erotic art'};
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const token=process.env.ARENA_API_TOKEN;
 if(!token)return res.status(503).json({error:'ARENA_API_TOKEN is not configured',code:'NO_TOKEN'});
 const seed=String(req.query.seed||'12345').replace(/[^0-9]/g,'').slice(0,10)||'12345';
 const page=Math.max(1,Math.min(1000,parseInt(req.query.page,10)||1));
 const format=FORMATS.has(req.query.format)?req.query.format:'all';
 const topic=TOPICS.has(req.query.topic)?req.query.topic:'';
 const search=String(req.query.search||'').trim().slice(0,100).replace(/[\x00-\x1F]/g,' ');
 const terms=[TOPIC_TERMS[topic]||topic,search].filter(Boolean).join(' ');
 const url=new URL(API);
 url.searchParams.set('query',terms||'*');
 url.searchParams.set('sort','random');url.searchParams.set('seed',seed);
 url.searchParams.set('page',String(page));url.searchParams.set('per','24');
 if(format==='images')url.searchParams.set('type','Image');
 else if(format==='gifs')url.searchParams.set('type','Block')
 else if(format==='videos')url.searchParams.set('type','Block');
 else if(format==='articles')url.searchParams.set('type','Link');
 else url.searchParams.set('type','Block');
 try{
  // The single NSFW button samples multiple descriptive queries behind the scenes.
  // Search is metadata-based: Are.na does not guarantee explicit results or age classification.
  if(topic==='nsfw'){
   const base=Number(seed)%NSFW_TERMS.length;
   const selected=[0,1,2,3].map(i=>NSFW_TERMS[(base+(page-1)*4+i)%NSFW_TERMS.length]);
   const results=await Promise.all(selected.map(async(term,i)=>{
    const u=new URL(API);
    u.searchParams.set('query',[term,search].filter(Boolean).join(' '));
    u.searchParams.set('sort','random');
    u.searchParams.set('seed',String((Number(seed)+i*7919+page*97)%2147483647));
    u.searchParams.set('page',String(1+Math.floor((page-1)/3)%5));
    u.searchParams.set('per','24');
    u.searchParams.set('type',format==='images'?'Image':format==='articles'?'Link':'Block');
    const r=await fetch(u,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
    if(!r.ok){let message='Are.na search failed';try{const d=await r.json();message=d.details?.message||d.message||d.error||message}catch{}throw Object.assign(new Error(message),{status:r.status})}
    const d=await r.json();return d.data||[];
   }));
   const seen=new Set();const combined=[];
   for(const list of results)for(const item of list){const key=String(item.id||item.slug||JSON.stringify(item).slice(0,150));if(!seen.has(key)){seen.add(key);combined.push(item)}}
   // Seeded shuffle so paging remains varied without exposing separate subcategories.
   let state=(Number(seed)+page*2654435761)>>>0;
   for(let i=combined.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[combined[i],combined[j]]=[combined[j],combined[i]]}
   res.setHeader('Cache-Control','private, max-age=30');
   return res.status(200).json({data:combined,meta:{},format,topic,search});
  }
  const upstream=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
  if(!upstream.ok){let message='Are.na search failed';try{const d=await upstream.json();message=d.details?.message||d.message||d.error||message}catch{}return res.status(upstream.status).json({error:message,code:upstream.status===403?'PREMIUM_REQUIRED':'UPSTREAM_ERROR'})}
  const data=await upstream.json();res.setHeader('Cache-Control','private, max-age=30');
  return res.status(200).json({data:data.data||[],meta:data.meta||{},format,topic,search});
 }catch(e){return res.status(e.status||502).json({error:e.status?e.message:'Could not connect to Are.na',code:e.status===403?'PREMIUM_REQUIRED':e.status?'UPSTREAM_ERROR':'NETWORK_ERROR'})}
}
