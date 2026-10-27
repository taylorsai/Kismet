// Vercel serverless function. Set ARENA_API_TOKEN in your deployment environment.
const API='https://api.are.na/v3/search';
export default async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  const token=process.env.ARENA_API_TOKEN;
  if(!token) return res.status(503).json({error:'ARENA_API_TOKEN is not configured',code:'NO_TOKEN'});
  const seed=String(req.query.seed||'12345').replace(/[^0-9]/g,'').slice(0,10)||'12345';
  const page=Math.max(1,Math.min(1000,Number.parseInt(req.query.page,10)||1));
  const url=new URL(API);url.searchParams.set('query','*');url.searchParams.set('type','Block');url.searchParams.set('sort','random');url.searchParams.set('seed',seed);url.searchParams.set('per','12');url.searchParams.set('page',String(page));
  try{
    const upstream=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
    if(!upstream.ok){let msg='Are.na request failed';try{const d=await upstream.json();msg=d.message||d.error||msg}catch{};return res.status(upstream.status).json({error:msg,code:upstream.status===403?'PREMIUM_REQUIRED':'UPSTREAM_ERROR'});}
    const data=await upstream.json();res.setHeader('Cache-Control','private, max-age=60');return res.status(200).json({data:data.data||[],meta:data.meta||{}});
  }catch(e){return res.status(502).json({error:'Could not connect to Are.na',code:'NETWORK_ERROR'});}
}
