import React, {useEffect,useRef,useState,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight,Bookmark,BookmarkCheck,Shuffle,Grid2X2,Maximize2,Minimize2,X,Info,LoaderCircle,ExternalLink,Share2,Sun,Moon,Volume2,VolumeX,SlidersHorizontal,Search} from 'lucide-react';
import './style.css';
const demo=[{id:'demo1',type:'Image',title:'The room between rooms',channel:'Spaces Between Things',image:'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=1200&q=85'},{id:'demo2',type:'Text',title:'A small thought',channel:'Unfinished Thoughts',text:'Perhaps getting lost is another way of arriving.'},{id:'demo3',type:'Image',title:'Quiet structures',channel:'Unintentional Monuments',image:'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200&q=85'},{id:'demo4',type:'Link',title:'A door to the internet',channel:'Strange Corners',text:'A link is a doorway. Sometimes the doorway is more interesting than the room.',source:'https://www.are.na'},{id:'demo5',type:'Image',title:'Green afternoon',channel:'Almost Familiar',image:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=85'},{id:'demo6',type:'Text',title:'An observation',channel:'Things That Might Be True',text:'Everything you find was left somewhere by someone.'},{id:'demo7',type:'Image',title:'Soft distance',channel:'A Place to Disappear',image:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=85'}];
function getUrl(v){if(typeof v==='string')return v;if(!v||typeof v!=='object')return '';return v.url||v.src||v.display?.url||v.large?.url||v.original?.url||v.medium?.url||''}
function safeUrl(v){try{const u=new URL(v);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}}
function mediaInfo(b){
 const source=safeUrl(b.source?.url||b.original_source_url||b.url||'');
 const embed=b.embed||{}, attachment=b.attachment||{};
 const urls=[b.video?.url,b.video?.src,attachment.url,attachment.original?.url,b.content?.url,embed.url,source].map(safeUrl).filter(Boolean);
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
 return {source,directVideo,embedUrl,isVideo:!!(directVideo||embedUrl||type.includes('video')),isArticle:!directVideo&&!embedUrl&&(type.includes('link')||type.includes('article'))};
}
function normalize(b){const kind=String(b.type||b.class||b.block_type||'Block').toLowerCase();const image=getUrl(b.image)||getUrl(b.cover)||getUrl(b.attachment?.thumb)||getUrl(b.attachment?.image)||getUrl(b.attachment)||getUrl(b.preview)||getUrl(b.content?.image);const content=b.content;const description=b.description;const text=typeof content==='string'?content:(content?.markdown||content?.plain||content?.text||description?.plain||(typeof description==='string'?description:'')||'');const membership=b.connections?.[0]?.channel||b.channels?.[0]||b.channel||null;const channel=membership?.title||'The collective archive';const media=mediaInfo(b);return{id:String(b.id),type:kind.includes('image')?'Image':kind.includes('text')?'Text':kind.includes('link')?'Link':kind.includes('embed')?'Embed':'Attachment',title:b.title||b.generated_title||'Untitled encounter',channel,image,text,source:media.source||`https://www.are.na/block/${b.id}`,arena:`https://www.are.na/block/${b.id}`,directVideo:media.directVideo,embedUrl:media.embedUrl,isVideo:media.isVideo,isArticle:media.isArticle}}

function shuffleDemo(){return [...demo].sort(()=>Math.random()-.5).map((x,i)=>({...x,id:x.id+'-'+Date.now()+'-'+i}))}
function readSaved(){try{return JSON.parse(localStorage.getItem('kismet-saves')||'[]')}catch{return []}}
function App(){
 const[items,setItems]=useState([]),[mode,setMode]=useState('demo'),[saved,setSaved]=useState(readSaved),[active,setActive]=useState(0),[view,setView]=useState(()=>localStorage.getItem('kismet-view')==='immersive'?'immersive':'focused'),[panel,setPanel]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[controls,setControls]=useState(true);
 const [format,setFormat]=useState('all'),[topic,setTopic]=useState(''),[searchTerm,setSearchTerm]=useState(''),[draftSearch,setDraftSearch]=useState('');
 const filtersRef=useRef({format:'all',topic:'',search:''});
 const[theme,setTheme]=useState(()=>{try{return localStorage.getItem('kismet-theme')==='light'?'light':'dark'}catch{return 'dark'}}),[stacks,setStacks]=useState({});
 const stacksRef=useRef({}),stackBusy=useRef(new Set()),stackPosition=useRef({});
 const busy=useRef(false),seed=useRef(Math.floor(Math.random()*1e9)),page=useRef(1),generation=useRef(0),modeRef=useRef('demo'),itemsRef=useRef(items),activeRef=useRef(0),touch=useRef(null),hideTimer=useRef(null),lastGesture=useRef(0);
 useEffect(()=>{itemsRef.current=items;items.slice(Math.max(0,activeRef.current),activeRef.current+7).forEach(x=>{if(x.image){const img=new Image();img.src=x.image}})},[items,active]);useEffect(()=>{activeRef.current=active},[active]);useEffect(()=>{localStorage.setItem('kismet-saves',JSON.stringify(saved))},[saved]);useEffect(()=>{localStorage.setItem('kismet-view',view)},[view]);useEffect(()=>{localStorage.setItem('kismet-theme',theme)},[theme]);
 const load=useCallback(async(s,p,replace=false)=>{if(busy.current&&!replace)return;const gen=replace?++generation.current:generation.current;busy.current=true;setLoading(true);setError('');try{const r=await fetch(`/api/discover?seed=${s}&page=${p}&format=${encodeURIComponent(filtersRef.current.format)}&topic=${encodeURIComponent(filtersRef.current.topic)}&search=${encodeURIComponent(filtersRef.current.search)}`);const data=await r.json();if(!r.ok)throw Error(data.code==='NO_TOKEN'?'Add ARENA_API_TOKEN to enable live discoveries.':data.code==='PREMIUM_REQUIRED'?'Are.na requires Premium for randomized search.':data.error||'Could not load discoveries');const selected=filtersRef.current.format;
 const next=(data.data||[]).map(normalize).filter(x=>{
  if(!x.id||!(x.image||x.text||x.source))return false;
  if(selected==='videos')return !!(x.directVideo||x.embedUrl||x.isVideo);
  if(selected==='gifs')return /\.gif(?:[?#]|$)/i.test(x.image||'')||/\.gif(?:[?#]|$)/i.test(x.source||'');
  if(selected==='images')return !!x.image&&!/\.gif(?:[?#]|$)/i.test(x.image);
  if(selected==='articles')return x.type==='Link';
  return true;
 });if(!next.length)throw Error('No matches on this page. Try another topic or format.');if(gen!==generation.current)return;setItems(old=>replace?next:[...old,...next.filter(x=>!old.some(y=>y.id===x.id))]);page.current=p;setMode('live');modeRef.current='live'}catch(e){if(gen!==generation.current)return;setError(e.message);if(replace){setItems([]);setMode('demo');modeRef.current='demo'}}finally{if(gen===generation.current){busy.current=false;setLoading(false)}}},[]);
 useEffect(()=>{load(seed.current,1,true)},[load]);
 useEffect(()=>{if(mode==='live'&&active>=items.length-4&&!loading)load(seed.current,page.current+1)},[active,items.length,mode,loading,load]);
 function applyFilters(nextFormat=format,nextTopic=topic,nextSearch=draftSearch){
  const query=nextSearch.trim();filtersRef.current={format:nextFormat,topic:nextTopic,search:query};
  setFormat(nextFormat);setTopic(nextTopic);setSearchTerm(query);setDraftSearch(query);
  seed.current=Math.floor(Math.random()*1e9);page.current=1;setActive(0);activeRef.current=0;
  stacksRef.current={};stackPosition.current={};stackBusy.current.clear();setStacks({});setPanel('');
  load(seed.current,1,true);
 }
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
 useEffect(()=>{const v=videoRef.current;if(!v)return;v.muted=muted;const promise=v.play();promise?.catch?.(()=>{});return()=>v.pause()},[item?.id,view,muted]);
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
  if(x.embedUrl){const yt=x.embedUrl.includes('youtube-nocookie.com');const url=x.embedUrl+(x.embedUrl.includes('?')?'&':'?')+(yt?'autoplay=1&mute=1&playsinline=1&controls=0&enablejsapi=1':'autoplay=1&muted=1&playsinline=1&controls=0');return <div className="video-frame"><iframe key={x.id} ref={embedRef} className="media-embed" src={url} title={x.title} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" tabIndex={-1}/><button className="sound-toggle" onClick={e=>{e.stopPropagation();setMuted(m=>!m)}} aria-label={muted?'Turn sound on':'Mute video'}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button></div>}
  if(x.isArticle&&x.image)return <a className="article-art-link" href={x.source} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} aria-label={'Read original article: '+x.title}><img src={x.image} alt={x.title} draggable="false" className="art" ref={!full?artRef:undefined} onLoad={!full?measureArt:undefined}/><span className="article-cue">read article <ArrowUpRight size={13}/></span></a>;
  return x.image?<img src={x.image} alt={x.title} draggable="false" className="art" ref={!full?artRef:undefined} onLoad={!full?measureArt:undefined}/>:<div className={'text-art '+(full?'full-text':'')}><p>{x.text||x.title||'An unexpected encounter.'}</p>{x.isArticle&&<a href={x.source} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} className="article-text-link">read original article <ArrowUpRight size={14}/></a>}</div>
 } return <div className={'app '+view+' theme-'+theme} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel} onWheel={onWheel} onMouseMove={view==='immersive'?reveal:undefined}>
 {view==='focused'?<><header className="site-header"><button className="wordmark" onClick={()=>setPanel('about')}>kismet<span>.</span></button><div className="header-tools"><button className="bare theme-toggle" title="Toggle light mode" aria-label="Toggle light mode" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="bare filter-trigger" title="Discovery filters" aria-label="Discovery filters" onClick={()=>setPanel('filters')}><SlidersHorizontal size={18}/></button><span className="counter">{`${String(active+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`}</span><button className="bare" title="Bookmarks" onClick={()=>setPanel('saved')}><Grid2X2 size={19}/></button></div></header><div className="backline"><button className="text-button" onClick={()=>setView('immersive')}><Maximize2 size={13}/> immersive view</button><span className="status">{searchTerm||topic||format!=='all'?[format!=='all'?format:'all',topic,searchTerm].filter(Boolean).join(' · '):mode==='live'?'live are.na':'connecting…'}</span></div><main className="focus-main"><div className="art-stage"><div className="art-button" onClick={()=>{if(!item?.isArticle&&!item?.isVideo)setView('immersive')}}>{media(item)}</div></div><div className="stack-dots" aria-label="Channel carousel">{hasStack?<><i className={stackIndex===0?'on':''}/><i className={stackIndex>0&&stackIndex<stack.blocks.length-1?'on':''}/><i className={stackIndex===stack.blocks.length-1?'on':''}/></>:stackMessage?<span>{stackMessage}</span>:null}</div><section className="details" style={artWidth?{maxWidth:`${artWidth}px`}:undefined}><div className="title-row"><div><h1>{item?.title}</h1><p>from <span>{item?.channel}</span></p></div><button className="bare expand" onClick={()=>setView('immersive')} aria-label="Expand"><Maximize2 size={18}/></button></div><nav className="actions"><a href={source} target="_blank" rel="noopener noreferrer">visit source <ArrowUpRight size={13}/></a><button onClick={()=>save(item)}>{isSaved?'saved':'save'}</button><button onClick={share}>share</button><button onClick={()=>setPanel('about')}>···</button></nav><div className="related-head">your path <span>— your random discoveries</span></div><div className="path-strip">{items.slice(Math.max(0,active-2),active+8).map((x,i)=><button key={x.id} className={'thumb '+(x.id===item?.id?'selected':'')} onClick={()=>navigate(items.findIndex(y=>y.id===x.id)-activeRef.current)} aria-label={x.title}>{x.image?<img src={x.image} loading="lazy" alt=""/>:<span>{x.title}</span>}</button>)}</div></section></main><footer className="focus-footer"><button onClick={newPath} disabled={loading}><Shuffle size={14}/>{loading?'finding…':'new path'}</button><button onClick={()=>setPanel('saved')}><Bookmark size={14}/> saved ({saved.length})</button></footer></>:<main className={'immersive-main '+(controls?'show-controls':'hide-controls')} onClick={()=>setControls(x=>!x)}><div className="immersive-art">{media(item,true)}</div><div className="stack-dots immersive-dots">{hasStack?<><i className={stackIndex===0?'on':''}/><i className={stackIndex>0&&stackIndex<stack.blocks.length-1?'on':''}/><i className={stackIndex===stack.blocks.length-1?'on':''}/></>:stackMessage?<span>{stackMessage}</span>:null}</div><div className="immersive-top" onClick={e=>e.stopPropagation()}><div><strong>kismet.</strong><small>{`${String(active+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`}</small></div><div className="immersive-header-actions"><button className="bare" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} aria-label="Toggle light mode">{theme==='dark'?<Sun/>:<Moon/>}</button><button className="bare" onClick={()=>setView('focused')} aria-label="Close immersive"><X/></button></div></div><div className="immersive-bottom" onClick={e=>e.stopPropagation()}><div className="immersive-caption"><h2>{item?.title}</h2><p>from {item?.channel}</p></div><div className="immersive-actions"><a href={source} target="_blank" rel="noopener noreferrer" aria-label="Visit source"><ExternalLink/></a><button onClick={()=>save(item)} aria-label="Save">{isSaved?<BookmarkCheck/>:<Bookmark/>}</button><button onClick={share} aria-label="Share"><Share2/></button><button onClick={newPath} aria-label="New path"><Shuffle/></button></div></div></main>}
 {loading&&<div className="loading"><LoaderCircle className="spin" size={15}/> finding discoveries…</div>}{error&&<div className="notice">{error} {mode==='demo'?'Showing sample encounters.':''}<button onClick={()=>setError('')} aria-label="Dismiss"><X size={15}/></button></div>}
 {panel&&<div className="overlay" onClick={()=>setPanel('')}><section className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><strong>{panel==='saved'?'kept encounters.':panel==='filters'?'discover.':'kismet.'}</strong><button className="bare" onClick={()=>setPanel('')} aria-label="Close"><X/></button></div>{panel==='filters'?<div className="filter-panel">
 <p>Choose what to stumble upon. Your channel swipes stay unrestricted.</p>
 <label>MEDIA TYPE</label><div className="filter-chips">{[['all','Everything'],['images','Images'],['gifs','GIFs'],['videos','Videos'],['articles','Articles']].map(([v,n])=><button key={v} className={format===v?'selected':''} onClick={()=>setFormat(v)}>{n}</button>)}</div>
 <label>EXPLORE</label><div className="filter-chips">{[['','Anything'],['design','Design'],['art','Art'],['memes','Memes'],['engineering','Engineering'],['architecture','Architecture'],['fashion','Fashion'],['technology','Technology'],['music','Music'],['animation','Animation'],['photography','Photography'],['nsfw','NSFW']].map(([v,n])=><button key={v} className={topic===v?'selected':''} onClick={()=>setTopic(v)}>{n}</button>)}</div>
 <label htmlFor="discovery-query">SEARCH</label><input id="discovery-query" className="filter-input" value={draftSearch} onChange={e=>setDraftSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')applyFilters()}} placeholder="abandoned websites, anime, typography…" maxLength={100}/>
 <button className="filter-apply" onClick={()=>applyFilters()}>explore <ArrowUpRight size={15}/></button>
 <button className="filter-clear" onClick={()=>applyFilters('all','','')}>clear filters</button>
 <p className="drawer-note">Results come from Are.na search. Some media types and topics may have fewer matches; NSFW is a search term, not a verified content classification.</p>
 </div>:panel==='saved'?<>{saved.length===0?<p>Nothing saved yet. Keep something unexpected.</p>:<div className="saved-grid">{saved.map(x=><div className="saved-card" key={x.id}><a href={x.source||x.arena} target="_blank" rel="noopener noreferrer">{x.image?<img src={x.image} alt={x.title}/>:<span>{x.title}</span>}</a><button onClick={()=>save(x)} title="Remove saved"><X size={14}/></button></div>)}</div>}<p className="drawer-note">Saved on this device. Collections are coming later.</p></>:<><p>A feed of chance encounters. Nothing is ranked for you. No recommendations. Just discoveries.</p><p>Scroll or swipe up to discover something new. Swipe down to revisit previous discoveries. Switch between focused and immersive viewing whenever you like.</p><p>Original sources open in a new tab when an external website cannot be displayed inside Kismet.</p><p className="drawer-note">{mode==='live'?'Connected to public Are.na discoveries.':'Showing sample content.'}</p></>}</section></div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
