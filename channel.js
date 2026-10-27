// Server-side Are.na channel discovery. Keep ARENA_API_TOKEN in Vercel environment variables.
const BASE='https://api.are.na/v2';
async function arena(path){const token=process.env.ARENA_API_TOKEN;const r=await fetch(BASE+path,{headers:token?{Authorization:`Bearer ${token}`}:{}});if(!r.ok)throw new Error(`Are.na returned ${r.status}`);return r.json()}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 try{
  const {block,slug}=req.query||{};
  let chosen=slug;let title='Are.na channel';
  if(!chosen){if(!/^\d+$/.test(String(block||'')))return res.status(400).json({error:'Invalid block ID'});
   const detail=await arena(`/blocks/${block}`);
   const channels=detail.connections||detail.channels||[];
   const first=channels.find(x=>x?.slug||x?.channel?.slug);
   chosen=first?.slug||first?.channel?.slug;
   title=first?.title||first?.channel?.title||title;
  }
  if(!chosen||!/^[a-zA-Z0-9_-]+$/.test(String(chosen)))return res.status(404).json({error:'This discovery has no accessible Are.na channel.'});
  const page=Math.max(1,Math.min(100,parseInt(req.query.page,10)||1));
  const data=await arena(`/channels/${encodeURIComponent(chosen)}/contents?page=${page}&per=40`);
  const blocks=Array.isArray(data)?data:(data.contents||data.blocks||[]);
  res.status(200).json({data:blocks,slug:chosen,channel:data.title||title,hasMore:blocks.length>=40});
 }catch(e){res.status(502).json({error:e.message||'Could not open channel'})}
}
