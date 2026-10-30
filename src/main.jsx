import React, {useEffect,useRef,useState,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Bookmark,BookmarkCheck,Shuffle,Grid2X2,Maximize2,Minimize2,X,Info,LoaderCircle,ExternalLink,Share2,Sun,Moon,Volume2,VolumeX,SlidersHorizontal,Search} from 'lucide-react';
import './style.css';
const demo=[{id:'demo1',type:'Image',title:'The room between rooms',channel:'Spaces Between Things',image:'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200&q=85'},{id:'demo2',type:'Text',title:'A small thought',channel:'Unfinished Thoughts',text:'Perhaps getting lost is another way of arriving.'},{id:'demo3',type:'Image',title:'Quiet structures',channel:'Unintentional Monuments',image:'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200&q=85'},{id:'demo4',type:'Link',title:'A door to the internet',channel:'Strange Corners',text:'A link is a doorway. Sometimes the doorway is more interesting than the room.',source:'https://www.are.na'},{id:'demo5',type:'Image',title:'Green afternoon',channel:'Almost Familiar',image:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85'},{id:'demo6',type:'Text',title:'An observation',channel:'Things That Might Be True',text:'Everything you find was left somewhere by someone.'},{id:'demo7',type:'Image',title:'Soft distance',channel:'A Place to Disappear',image:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=85'}];
function getUrl(v){if(typeof v==='string')return v;if(!v||typeof v!=='object')return '';return v.url||v.src||v.display?.url||v.large?.url||v.original?.url||v.medium?.url||''}
function safeUrl(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}}
function mediaInfo(b){
 const source=safeUrl(b.source?.url||b.original_source_url||b.url||b.embed?.url||'');
 const embed=b.embed||{}, attachment=b.attachment||{};
 const html=String(embed.html||b.content?.html||b.embed_html||'');
 const embeddedSrc=(html.match(/<iframe[^>]+src=[\"']([^\"']+)/i)||[])[1]||'';
 const urls=[b.video?.url,b.video?.src,attachment.url,attachment.original?.url,b.content?.url,embed.url,embeddedSrc,source].map(safeUrl).filter(Boolean);
 const directVideo=urls.find(x=>/\.(mp4|webm|m4v)(?:[?#]|$)/i.test(x))||'';
 let embedUrl='';
 for(const candidate of [source,...urls]){
  try{const u=new URL(candidate),h=u.hostname.replace(/^www\./,'').toLowerCase();
   if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(h)){const id=u.searchParams.get('v')||(u.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)||[])[1];if(id&&/^[\w-]{11}$/.test(id)){embedUrl=`https://www.youtube-nocookie.com/embed/${id}`;break}}
   if(h==='youtu.be'){const id=u.pathname.slice(1).split('/')[0];if(/^[\w-]{11}$/.test(id)){embedUrl=`https://www.youtube-nocookie.com/embed/${id}`;break}}
   if(['vimeo.com','player.vimeo.com'].includes(h)){const id=(u.pathname.match(/(?:video\/)?(\d+)/)||[])[1];if(id){embedUrl=`https://player.vimeo.com/video/${id}`;break}}
  }catch{}
 }
 const type=String(b.type||b.class||b.block_type||'').toLowerCase();
 return {source,directVideo,embedUrl,isGif:/\.gif(?:[?#]|$)/i.test([b.image?.original?.url,b.attachment?.url,b.attachment?.original?.url,source].filter(Boolean).join(' '))||String(b.attachment?.content_type||b.content_type||b.attachment?.filename||'').toLowerCase().includes('gif'),isVideo:!!(directVideo||embedUrl||type.includes('video')),isArticle:!directVideo&&!embedUrl&&(type.includes('link')||type.includes('article'))};
}
function normalize(b){const kind=String(b.type||b.class||b.block_type||'Block').toLowerCase();const image=getUrl(b.image)||getUrl(b.cover)||getUrl(b.attachment?.thumb)||getUrl(b.attachment?.image)||getUrl(b.attachment)||getUrl(b.preview)||getUrl(b.content?.image);const content=b.content;const description=b.description;const text=typeof content==='string'?content:(content?.markdown||content?.plain||content?.text||description?.plain||(typeof description==='string'?description:'')||'');const membership=b.connections?.[0]?.channel||b.channels?.[0]||b.channel||null;const channel=membership?.title||'The collective archive';const media=mediaInfo(b);const contributor=b.user?.full_name||b.user?.name||b.user?.username||'';const creator=b.creator?.full_name||b.creator?.name||b.creator?.username||b.attribution?.name||'';const rawDate=b.created_at||b.createdAt||'';const sourceTitle=b.source?.title||'';const creditDescription=typeof description==='string'?description:(description?.plain||description?.markdown||'');return{contributor,creator,createdAt:rawDate,sourceTitle,creditDescription,id:String(b.id),type:kind.includes('image')?'Image':kind.includes('text')?'Text':kind.includes('link')?'Link':kind.includes('embed')?'Embed':'Attachment',title:b.title||b.generated_title||'Untitled encounter',channel,image,text,source:media.source||`https://www.are.na/block/${b.id}`,arena:`https://www.are.na/block/${b.id}`,directVideo:media.directVideo,embedUrl:media.embedUrl,isVideo:media.isVideo,isGif:media.isGif,isArticle:media.isArticle}}

// Discovery subjects are search prompts, not verified classifications.
const TOPIC_GROUPS=[
 {label:'Explore',topics:[['art','Art'],['design','Design'],['photography','Photography'],['fashion','Fashion'],['architecture','Architecture'],['technology','Technology'],['music','Music'],['animation','Animation'],['memes','Memes']]},
 {label:'Mature',topics:[['nsfw','NSFW'],['glamour','After Dark']]}
];
const MATURE_TOPICS=new Set(['nsfw','glamour']);
function readPrefs(){try{const p=JSON.parse(localStorage.getItem('wren-discovery-prefs-v1')||'{}');return {format:['all','images','gifs','videos','articles'].includes(p.format)?p.format:'all',topic:TOPIC_GROUPS.flatMap(g=>g.topics.map(x=>x[0])).includes(p.topic)?p.topic:'',search:typeof p.search==='string'?p.search.slice(0,100):'',mature:p.mature===true}}catch{return {format:'all',topic:'',search:'',mature:false}}}
function displayDate(value){if(!value)return '';const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function CreditLine({item}){if(!item)return null;const date=displayDate(item.createdAt);const summary=String(item.creditDescription||'').replace(/<[^>]*>/g,'').trim();return <div className="item-credits">{item.creator&&<span>created by {item.creator}</span>}{item.contributor&&<span>added by {item.contributor}</span>}{item.channel&&item.channel!=='The collective archive'&&<span>in {item.channel}</span>}{date&&<span>added {date}</span>}{item.sourceTitle&&<span>source: {item.sourceTitle}</span>}{summary&&<p className="credit-description">{summary.slice(0,240)}{summary.length>240?'…':''}</p>}</div>}
function ChannelProgress({hasStack,stack,stackIndex,message,immersive=false}){const count=stack?.blocks?.length||0;const end=hasStack&&stackIndex===count-1;return <div className={'channel-progress '+(immersive?'immersive-progress':'')} aria-label={hasStack?`Channel item ${stackIndex+1} of ${count}`:'Channel status'}>{hasStack?<><div className="channel-track" role="progressbar" aria-valuemin={1} aria-valuemax={count} aria-valuenow={stackIndex+1}><span style={{width:`${(stackIndex+1)/count*100}%`}}/></div><span className="channel-count">{end?'end of channel':`${stackIndex+1} / ${count}`}</span></>:message?<span className="channel-count">{message}</span>:null}</div>}
function shuffleDemo(){return [...demo].sort(()=>Math.random()-.5).map((x,i)=>({...x,id:x.id+'-'+Date.now()+'-'+i}))}
function readSaved(){try{const fresh=localStorage.getItem('wren-saves');return JSON.parse(fresh||localStorage.getItem('kismet-saves')||'[]')}catch{return []}}
function App(){
 const[items,setItems]=useState([]),[mode,setMode]=useState('demo'),[saved,setSaved]=useState(readSaved),[active,setActive]=useState(0),[view,setView]=useState(()=>(localStorage.getItem('wren-view')||localStorage.getItem('kismet-view'))==='immersive'?'immersive':'focused'),[panel,setPanel]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[controls,setControls]=useState(true);
 const [initialPrefs]=useState(readPrefs);
 const [format,setFormat]=useState(initialPrefs.format),[topic,setTopic]=useState(initialPrefs.mature?initialPrefs.topic:(MATURE_TOPICS.has(initialPrefs.topic)?'':initialPrefs.topic)),[searchTerm,setSearchTerm]=useState(initialPrefs.search),[draftSearch,setDraftSearch]=useState(initialPrefs.search),[mature,setMature]=useState(initialPrefs.mature);
 const filtersRef=useRef({format:initialPrefs.format,topic:initialPrefs.mature?initialPrefs.topic:(MATURE_TOPICS.has(initialPrefs.topic)?'':initialPrefs.topic),search:initialPrefs.search,mature:initialPrefs.mature});
 const[theme,setTheme]=useState(()=>{try{return (localStorage.getItem('wren-theme')||localStorage.getItem('kismet-theme'))==='light'?'light':'dark'}catch{return 'dark'}}),[stacks,setStacks]=useState({});
 const stacksRef=useRef({}),stackBusy=useRef(new Set()),stackPosition=useRef({});
 const abortRef=useRef(null),busy=useRef(false),seed=useRef(Math.floor(Math.random()*1e9)),page=useRef(1),generation=useRef(0),modeRef=useRef('demo'),itemsRef=useRef(items),activeRef=useRef(0),touch=useRef(null),hideTimer=useRef(null),lastGesture=useRef(0);
 useEffect(()=>{itemsRef.current=items;items.slice(Math.max(0,activeRef.current),activeRef.current+7).forEach(x=>{if(x.image){const img=new Image();img.src=x.image}})},[items,active]);useEffect(()=>{activeRef.current=active},[active]);useEffect(()=>{localStorage.setItem('wren-saves',JSON.stringify(saved))},[saved]);useEffect(()=>{localStorage.setItem('wren-view',view)},[view]);useEffect(()=>{localStorage.setItem('wren-theme',theme)},[theme]);useEffect(()=>{try{localStorage.setItem('wren-discovery-prefs-v1',JSON.stringify({format,topic,search:searchTerm,mature}))}catch{}},[format,topic,searchTerm,mature]);
 const load=useCallback(async(s,p,replace=false)=>{
  if(busy.current&&!replace)return;
  if(replace)abortRef.current?.abort();
  const controller=new AbortController();abortRef.current=controller;
  const gen=replace?++generation.current:generation.current;
  busy.current=true;setLoading(true);setError('');
  try{
   const selected=filtersRef.current.format;
   let next=[],lastPage=p-1;
   // A search page may contain zero recognized videos/GIFs. Keep looking before declaring failure.
   for(let offset=0;offset<3;offset++){
    if(gen!==generation.current)return;
    const current=p+offset;
    const r=await fetch(`/api/discover?seed=${s}&page=${current}&format=${encodeURIComponent(selected)}&topic=${encodeURIComponent(filtersRef.current.topic)}&search=${encodeURIComponent(filtersRef.current.search)}&mature=${filtersRef.current.mature?'1':'0'}`,{signal:controller.signal});
    const data=await r.json();
    if(!r.ok)throw Error(data.code==='NO_TOKEN'?'Add ARENA_API_TOKEN to enable live discoveries.':data.code==='PREMIUM_REQUIRED'?'Are.na requires Premium for randomized search.':data.error||'Could not load discoveries');
    lastPage=current;
    const batch=(data.data||[]).map(normalize).filter(x=>{
     if(!x.id||!(x.image||x.text||x.source||x.embedUrl||x.directVideo))return false;
     if(selected==='videos')return !!(x.directVideo||x.embedUrl||x.isVideo);
     if(selected==='gifs')return x.isGif||/\.gif(?:[?#]|$)/i.test(x.image||'');
     if(selected==='images')return !!x.image&&!x.isGif;
     if(selected==='articles')return x.type==='Link';
     return true;
    });
    next.push(...batch.filter(x=>!next.some(y=>y.id===x.id)));
    if(next.length>=6||!data.data?.length)break;
   }
   if(gen!==generation.current)return;
   page.current=lastPage;
   if(!next.length){
    if(replace)setItems([]);
    setError('No matching discoveries found after checking several pages. Try another search or format.');
    return;
   }
   setItems(old=>replace?next:[...old,...next.filter(x=>!old.some(y=>y.id===x.id))]);
   setMode('live');modeRef.current='live';
  }catch(e){if(gen!==generation.current||e.name==='AbortError')return;setError(e.message);if(replace)setItems([])}
  finally{if(gen===generation.current){busy.current=false;setLoading(false);if(abortRef.current===controller)abortRef.current=null}}
 },[]);
 useEffect(()=>{load(seed.current,1,true)},[load]);
 useEffect(()=>{if(mode==='live'&&active>=items.length-4&&!loading)load(seed.current,page.current+1)},[active,items.length,mode,loading,load]);
 function applyFilters(nextFormat=format,nextTopic=topic,nextSearch=draftSearch){
  const query=nextSearch.trim();if(!mature&&MATURE_TOPICS.has(nextTopic))nextTopic='';filtersRef.current={format:nextFormat,topic:nextTopic,search:query,mature};
  setFormat(nextFormat);setTopic(nextTopic);setSearchTerm(query);setDraftSearch(query);
  seed.current=Math.floor(Math.random()*1e9);page.current=1;setActive(0);activeRef.current=0;
  stacksRef.current={};stackPosition.current={};stackBusy.current.clear();setStacks({});setPanel('');
  load(seed.current,1,true);
 }
 function changeMature(enabled){setMature(enabled);const nextTopic=!enabled&&MATURE_TOPICS.has(topic)?'':topic;filtersRef.current={...filtersRef.current,topic:nextTopic,mature:enabled};setTopic(nextTopic);seed.current=Math.floor(Math.random()*1e9);page.current=1;setActive(0);activeRef.current=0;stacksRef.current={};stackPosition.current={};setStacks({});load(seed.current,1,true)}
 function newPath(){stacksRef.current={};stackPosition.current={};stackBusy.current.clear();setStacks({});seed.current=Math.floor(Math.random()*1e9);page.current=1;setActive(0);activeRef.current=0;setPanel('');setError('');if(modeRef.current==='live')load(seed.current,1,true);else{setItems([]);load(seed.current,1,true)}}
 const [artWidth,setArtWidth]=useState(null);
 const [muted,setMuted]=useState(true);
 const videoRef=useRef(null);
 const embedRef=useRef(null);
 const artRef=useRef(null);
 function measureArt(){const img=artRef.current;if(!img||!img.naturalWidth||!img.naturalHeight)return;const frame=img.closest('.art-button');if(!frame)return;const width=Math.min(frame.clientWidth,frame.clientHeight*(img.naturalWidth/img.naturalHeight));if(width>0)setArtWidth(Math.round(width))}
 useEffect(()=>{setArtWidth(null);const resize=()=>measureArt();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[active,view]);
  function navigate(delta){const next=Math.max(0,Math.min(itemsRef.current.length-1,activeRef.current+delta));activeRef.current=next;setActive(next);setControls(true)}
 function save(item){setSaved(old=>old.some(x=>x.id===item.id)?old.filter(x=>x.id!==item.id):[item,...old])}
 function reveal(){setControls(true);clearTimeout(hideTimer.current);if(view==='immersive'&&!panel)hideTimer.current=setTimeout(()=>setControls(false),4500)}
 useEffect(()=>{reveal();return()=>clearTimeout(hideTimer.current)},[active,view,panel]);
 useEffect(()=>{function key(e){if(panel){if(e.key==='Escape')setPanel('');return}if(e.key==='ArrowDown')navigate(1);if(e.key==='ArrowUp')navigate(-1);if(e.key==='ArrowRight')horizontal(1);if(e.key==='ArrowLeft')horizontal(-1);if(e.key==='Escape'&&view==='immersive')setView('focused')}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[panel,view]);
 const base=items[active]||null;
 const stack=base?stacks[base.id]:null;
 const stackIndex=base?(stackPosition.current[base.id]||0):0;
 const item=stack?.blocks?.[stackIndex]||base;
 const hasStack=!!(stack?.blocks?.length>1);
 const [stackMessage,setStackMessage]=useState('');
 // Channel metadata is requested only after the current random image has settled.
 useEffect(()=>{if(!base||!/^\d+$/.test(String(base.id)))return;const timer=setTimeout(()=>openStack(base,false),1100);return()=>clearTimeout(timer)},[base?.id]);
 async function openStack(baseItem,advance=false){
  if(!baseItem||stackBusy.current.has(baseItem.id))return;
  if(stacksRef.current[baseItem.id])return;
  if(!/^\d+$/.test(String(baseItem.id)))return;
  stackBusy.current.add(baseItem.id);setStackMessage('finding channel…');
  try{
   const response=await fetch(`/api/channel?block=${encodeURIComponent(baseItem.id)}`);
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Channel unavailable');
   const normalized=(result.data||[]).map(normalize).filter(x=>x.id&&(x.image||x.text||x.source));
   const unique=[baseItem,...normalized.filter(x=>x.id!==baseItem.id)];
   if(unique.length<2)throw Error('No other channel blocks available');
   const value={blocks:unique,channel:result.channel||baseItem.channel};
   stacksRef.current={...stacksRef.current,[baseItem.id]:value};setStacks(stacksRef.current);
   stackPosition.current[baseItem.id]=advance?1:0;
   if(unique[1]?.image){const img=new Image();img.src=unique[1].image}
   setStackMessage('');
  }catch(e){setStackMessage('channel unavailable');setTimeout(()=>setStackMessage(''),1800)}
  finally{stackBusy.current.delete(baseItem.id)}
 }
 function horizontal(direction){
  if(!base)return;
  const current=stacksRef.current[base.id];
  if(!current){if(direction>0)openStack(base,true);return}
  const next=Math.max(0,Math.min(current.blocks.length-1,(stackPosition.current[base.id]||0)+direction));
  stackPosition.current[base.id]=next;
  setStacks({...stacksRef.current});
  const upcoming=current.blocks[next+1];if(upcoming?.image){const img=new Image();img.src=upcoming.image}
 }
 useEffect(()=>{const v=videoRef.current;if(!v)return;v.muted=muted;v.play()?.catch?.(()=>{});return()=>v.pause()},[item?.id,view]);useEffect(()=>{if(videoRef.current)videoRef.current.muted=muted},[muted]);
 useEffect(()=>{
  const frame=embedRef.current;if(!frame||!item?.embedUrl)return;
  const yt=item.embedUrl.includes('youtube-nocookie.com');
  const message=yt?JSON.stringify({event:'command',func:muted?'mute':'unMute',args:[]}):{method:'setVolume',value:muted?0:1};
  try{frame.contentWindow?.postMessage(message,yt?'https://www.youtube-nocookie.com':'https://player.vimeo.com')}catch{}
 },[muted,item?.id]);

 const isSaved=!!item&&saved.some(x=>x.id===item.id);const source=item?.source||item?.arena;const arena=item?.arena||source;
 async function share(){if(!item)return;const url=source||arena;try{if(navigator.share)await navigator.share({title:item.title,url});else if(navigator.clipboard)await navigator.clipboard.writeText(url)}catch{}}
 // Native-feeling vertical wandering: flick up to see the next item, down to revisit.
 function onTouchStart(e){if(e.touches.length!==1||e.target.closest('button:not(.art-button),a,.path-strip,.drawer,.actions,.focus-footer,.site-header,.backline')){touch.current=null;return}touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}
 function onTouchMove(e){if(!touch.current||e.touches.length!==1)return;const dy=e.touches[0].clientY-touch.current.y,dx=e.touches[0].clientX-touch.current.x;if(Math.max(Math.abs(dy),Math.abs(dx))>8&&e.cancelable)e.preventDefault()}
 function onTouchEnd(e){if(!touch.current||panel)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dy)>24&&Math.abs(dy)>Math.abs(dx)*1.05){lastGesture.current=Date.now();navigate(dy<0?1:-1)}else if(Math.abs(dx)>24&&Math.abs(dx)>Math.abs(dy)*1.05){lastGesture.current=Date.now();horizontal(dx<0?1:-1)}}
 function onTouchCancel(){touch.current=null}
 function onWheel(e){if(panel||e.target.closest('.path-strip,.drawer'))return;if(Math.abs(e.deltaY)<8||Math.abs(e.deltaY)<Math.abs(e.deltaX))return;if(Date.now()-lastGesture.current<900)return;lastGesture.current=Date.now();navigate(e.deltaY>0?1:-1)}
 function media(x,full=false){
  if(!x)return <div className="text-art"><p>Finding a discovery…</p></div>;
  if(x.directVideo)return <div className="video-frame"><video key={x.id} ref={videoRef} className="art media-video" src={x.directVideo} poster={x.image||undefined} autoPlay muted={muted} loop playsInline preload="metadata" onClick={e=>e.stopPropagation()}/><button className="sound-toggle" onClick={e=>{e.stopPropagation();setMuted(m=>!m)}} aria-label={muted?'Turn sound on':'Mute video'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div>;
  if(x.embedUrl){const yt=x.embedUrl.includes('youtube-nocookie.com');const url=x.embedUrl+(x.embedUrl.includes('?')?'&':'?')+(yt?'autoplay=1&mute=1&playsinline=1&controls=1&enablejsapi=1':'autoplay=1&muted=1&playsinline=1&controls=1');return <div className="video-frame"><iframe key={x.id} ref={embedRef} className="media-embed" src={url} title={x.title} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" /><button className="sound-toggle" onClick={e=>{e.stopPropagation();setMuted(m=>!m)}} aria-label={muted?'Turn sound on':'Mute video'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div>}
  if(x.isArticle&&x.image)return <a className="article-art-link" href={x.source} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} aria-label={'Read original article: '+x.title}><img src={x.image} alt={x.title} draggable="false" className="art" ref={!full?artRef:undefined} onLoad={!full?measureArt:undefined}/><span className="article-cue">read article <ArrowUpRight size={13}/></span></a>;
  return x.image?<img src={x.image} alt={x.title} draggable="false" className="art" ref={!full?artRef:undefined} onLoad={!full?measureArt:undefined}/>:<div className={'text-art '+(full?'full-text':'')}><p>{x.text||x.title||'An unexpected encounter.'}</p>{x.isArticle&&<a href={x.source} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="article-text-link">read original article <ArrowUpRight size={14}/></a>}</div>
 } return <div className={'app '+view+' theme-'+theme} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel} onWheel={onWheel} onMouseMove={view==='immersive'?reveal:undefined}>
 {view==='focused'?<><header className="site-header"><button className="wordmark" onClick={()=>setPanel('about')}>wren<span>.</span></button><div className="header-tools"><button className="bare theme-toggle" title="Toggle light mode" aria-label="Toggle light mode" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="bare filter-trigger" title="Discovery filters" aria-label="Discovery filters" onClick={()=>setPanel('filters')}><SlidersHorizontal size={18}/></button><span className="counter">{`${String(items.length?active+1:0).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`}</span><button className="bare" title="Bookmarks" onClick={()=>setPanel('saved')}><Grid2X2 size={19}/></button></div></header><div className="backline"><button className="text-button" onClick={()=>setView('immersive')}><Maximize2 size={13}/> immersive view</button><span className="status">{searchTerm||topic||format!=='all'?[format!=='all'?format:'all',topic,searchTerm].filter(Boolean).join(' · '):mode==='live'?'live are.na':'connecting…'}</span></div><main className="focus-main"><div className="art-stage"><div className="art-button" onClick={()=>{if(!item?.isArticle&&!item?.isVideo)setView('immersive')}}>{media(item)}</div></div><ChannelProgress hasStack={hasStack} stack={stack} stackIndex={stackIndex} message={stackMessage}/><section className="details" style={artWidth?{maxWidth:`${artWidth}px`}:undefined}><div className="title-row"><div><h1>{item?.title}</h1><CreditLine item={item}/></div><button className="bare expand" onClick={()=>setView('immersive')} aria-label="Expand"><Maximize2 size={18}/></button></div><nav className="actions"><a href={source} target="_blank" rel="noopener noreferrer">visit source <ArrowUpRight size={13}/></a><button onClick={()=>save(item)}>{isSaved?'saved':'save'}</button><button onClick={share}>share</button><button onClick={()=>setPanel('about')}>···</button></nav><div className="related-head">your path <span>— your random discoveries</span></div><div className="path-strip">{items.slice(Math.max(0,active-2),active+8).map((x,i)=><button key={x.id} className={'thumb '+(x.id===item?.id?'selected':'')} onClick={()=>navigate(items.findIndex(y=>y.id===x.id)-activeRef.current)} aria-label={x.title}>{x.image?<img src={x.image} loading="lazy" alt=""/>:<span>{x.title}</span>}</button>)}</div></section></main><footer className="focus-footer"><button onClick={newPath} disabled={loading}><Shuffle size={14}/>{loading?'finding…':'new path'}</button><button onClick={()=>setPanel('saved')}><Bookmark size={14}/> saved ({saved.length})</button></footer></>:<main className={'immersive-main '+(controls?'show-controls':'hide-controls')} onClick={()=>setControls(x=>!x)}><div className="immersive-art">{media(item,true)}</div><ChannelProgress hasStack={hasStack} stack={stack} stackIndex={stackIndex} message={stackMessage} immersive/><div className="immersive-top" onClick={e=>e.stopPropagation()}><div><strong>wren.</strong><small>{`${String(items.length?active+1:0).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`}</small></div><div className="immersive-header-actions"><button className="bare" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} aria-label="Toggle light mode">{theme==='dark'?<Sun/>:<Moon/>}</button><button className="bare" onClick={()=>setView('focused')} aria-label="Close immersive"><X/></button></div></div><div className="immersive-bottom" onClick={e=>e.stopPropagation()}><div className="immersive-caption"><h2>{item?.title}</h2><CreditLine item={item}/></div><div className="immersive-actions"><a href={source} target="_blank" rel="noopener noreferrer" aria-label="Visit source"><ExternalLink/></a><button onClick={()=>save(item)} aria-label="Save">{isSaved?<BookmarkCheck/>:<Bookmark/>}</button><button onClick={share} aria-label="Share"><Share2/></button><button onClick={newPath} aria-label="New path"><Shuffle/></button></div></div></main>}
 {loading&&<div className="loading"><LoaderCircle className="spin" size={15}/> finding discoveries…</div>}{error&&<div className="notice">{error} {mode==='demo'?'Showing sample encounters.':''}<button onClick={()=>setError('')} aria-label="Dismiss"><X size={15}/></button></div>}
 {panel&&<div className="overlay" onClick={()=>setPanel('')}><section className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><strong>{panel==='saved'?'kept encounters.':panel==='filters'?'discover.':'wren.'}</strong><button className="bare" onClick={()=>setPanel('')} aria-label="Close"><X/></button></div>{panel==='filters'?<div className="filter-panel">
 <p>Choose what to stumble upon. Your channel swipes stay unrestricted.</p>
 <label>MEDIA TYPE</label><div className="filter-chips">{[['all','Everything'],['images','Images'],['gifs','GIFs'],['videos','Videos'],['articles','Articles']].map(([v,n])=><button key={v} className={format===v?'selected':''} onClick={()=>setFormat(v)}>{n}</button>)}</div>
 <label>EXPLORE</label><div className="filter-chips"><button className={topic===''?'selected':''} onClick={()=>setTopic('')}>Anything</button></div>{TOPIC_GROUPS.filter(group=>group.label!=='Mature'||mature).map(group=><div className="topic-group" key={group.label}><div className="topic-group-label">{group.label}</div><div className="filter-chips">{group.topics.map(([v,n])=><button key={v} className={topic===v?'selected':''} onClick={()=>setTopic(v)}>{n}</button>)}</div></div>)}
 <div className="mature-control"><span><strong>Mature content</strong><small>Off by default · may include nudity</small></span><button type="button" role="switch" aria-checked={mature} className={'mature-switch '+(mature?'enabled':'')} onClick={()=>changeMature(!mature)}>{mature?'on':'off'}</button></div>
 <label htmlFor="discovery-query">SEARCH</label><input id="discovery-query" className="filter-input" value={draftSearch} onChange={e=>setDraftSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')applyFilters()}} placeholder="abandoned websites, anime, typography…" maxLength={100}/>
 <button className="filter-apply" onClick={()=>applyFilters()}>explore <ArrowUpRight size={15}/></button>
 <button className="filter-clear" onClick={()=>applyFilters('all','','')}>clear filters</button>
 <p className="drawer-note">Topics guide Are.na keyword search; they are not guaranteed tags or content ratings. Choose one subject and optionally add your own words. Mature content is off by default. Are.na metadata filtering cannot guarantee that every unexpected nude image will be excluded.</p>
 </div>:panel==='saved'?<>{saved.length===0?<p>Nothing saved yet. Keep something unexpected.</p>:<div className="saved-grid">{saved.map(x=><div className="saved-card" key={x.id}><a href={x.source||x.arena} target="_blank" rel="noopener noreferrer">{x.image?<img src={x.image} alt={x.title}/>:<span>{x.title}</span>}</a><button onClick={()=>save(x)} title="Remove saved"><X size={14}/></button></div>)}</div>}<p className="drawer-note">Saved in this browser for now. Cloud libraries and private tester accounts are next.</p></>:<><p>A feed of chance encounters. Nothing is ranked for you. No recommendations. Just discoveries.</p><p>Scroll or swipe up to discover something new. Swipe down to revisit previous discoveries. Switch between focused and immersive viewing whenever you like.</p><p>Original sources open in a new tab when an external website cannot be displayed inside wren.</p><p className="drawer-note">{mode==='live'?'Connected to public Are.na discoveries.':'Showing sample content.'}</p></>}</section></div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
