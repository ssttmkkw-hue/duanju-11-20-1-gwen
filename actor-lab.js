import { GwenRig } from './actor-rig.js';
import { samplePose, blinkAt, gestureAt } from './actor-motion.js';

const $=id=>document.getElementById(id);
const audio=$('voice');
const media=matchMedia('(prefers-reduced-motion: reduce)');
const state={index:0,mode:'directed',ready:false,started:false,subtitles:true,exploded:false,joints:false,manual:{},epoch:0,buffering:false,frozen:null};
let data,rig,clips=[],envelopes=[],urls=[],lastFrame=-Infinity;
const clock=t=>`00:${Math.floor(t).toString().padStart(2,'0')}`;
const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
const report=text=>{$('error').textContent=text;$('error').hidden=false;};
const checked=async path=>{const r=await fetch(path);if(!r.ok)throw new Error(`Missing asset: ${path}`);return r;};

function paint(now=performance.now()) {
  if(!state.ready)return;
  const take=data.takes[state.index];
  const time=state.frozen??Math.min(data.duration,audio.currentTime);
  const idle=!state.started;
  const local=idle?now/1000:time;
  const actingTake=state.mode==='voice'?{...take,actions:[]}:take;
  const pose=samplePose(actingTake,local,envelopes[state.index],{reduced:media.matches,idle});
  if(idle){pose.open=0;pose.round=0;pose.wide=0;pose.head=0;pose.raise=0;}
  // Direct manipulation remains available even when reduced-motion is requested.
  for(const [type,action]of Object.entries(state.manual)) {
    const t=now/1000-action.started;
    if(type==='blink')pose.blink=Math.max(pose.blink,blinkAt(t,0));
    if(type==='tilt')pose.head+=gestureAt(t,{start:0,hold:1.7,end:3,amount:10});
    if(type==='raise')pose.raise=Math.max(pose.raise,gestureAt(t,{start:0,hold:2.2,end:3.4,amount:1}));
    if(t>(type==='blink'?.34:3.5))delete state.manual[type];
  }
  rig.render(pose,state);
  const speech=time>=take.speech[0]&&time<take.speech[1]&&state.started;
  setText($('caption-text'),state.subtitles&&speech?take.text:'');
  setText($('clock'),`${clock(time)} / ${clock(data.duration)}`);
  $('scrub').value=time;
  $('scrub').style.setProperty('--progress',`${time/data.duration*100}%`);
  const playing=!audio.paused&&!audio.ended;
  $('play-take').innerHTML=playing?'Ⅱ <span>暂停演出</span>':audio.ended?'↺ <span>再演一次</span>':'▶ <span>演出这段</span>';
  $('play-take').setAttribute('aria-label',playing?'暂停演出':'演出所选台词');
  const names=[];
  if(pose.open>.05)names.push('说话');
  if(pose.blink>.1)names.push('眨眼');
  if(Math.abs(pose.head)>1)names.push('歪头');
  if(pose.raise>.1)names.push('抬剪刀');
  document.querySelectorAll('[data-action]').forEach(el=>{
    const active={speak:pose.open>.05,blink:pose.blink>.1,tilt:Math.abs(pose.head)>1,raise:pose.raise>.1}[el.dataset.action];
    el.classList.toggle('active',active);
  });
  setText($('stage-status'),state.buffering?'正在加载配音…':state.exploded?'部件展开 · 可以继续试演':names.length?names.join(' · '):playing?'演出中':audio.ended?'演出完成':'演员已就位');
  setText($('mode-label'),state.mode==='voice'?'声音与动作自由组合':'自动演出');
}

function loop(now){if(now-lastFrame>=1000/30){paint(now);lastFrame=now;}requestAnimationFrame(loop);}

async function selectTake(index) {
  if(!data.takes[index])return;
  audio.pause();state.index=index;state.started=false;state.manual={};state.frozen=null;state.mode='directed';
  const epoch=++state.epoch;
  audio.src=clips[index];
  state.ready=false;
  const loaded=new Promise((resolve,reject)=>{
    audio.addEventListener('loadedmetadata',resolve,{once:true});
    audio.addEventListener('error',reject,{once:true});
  });
  audio.load();await loaded;
  if(epoch!==state.epoch)return;
  state.ready=true;
  document.querySelectorAll('.take').forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));
  $('error').hidden=true;paint();
}

async function play(mode='directed') {
  if(!state.ready)return;
  state.mode=mode;state.frozen=null;
  if(audio.ended||audio.currentTime>=data.duration-.02)audio.currentTime=0;
  try{await audio.play();state.started=true;$('error').hidden=true;paint();}
  catch(e){if(e.name!=='AbortError')report('声音未能开始播放，请再次点击「演出这段」。');}
}

function seek(time) {
  if(!state.ready)return;
  state.started=true;state.frozen=null;
  audio.currentTime=Math.max(0,Math.min(data.duration,time));paint();
}

function trigger(type) {
  if(!state.ready)return;
  if(type==='speak'){audio.currentTime=0;play('voice');}
  else state.manual[type]={started:performance.now()/1000};
  const hints={speak:'正在说话，可以再点歪头或抬剪刀。',blink:'只替换眼睛层，头部和身体保持独立。',tilt:'头部绕颈部转动，双马尾跟随。',raise:'肩、肘与握持点联动，剪刀跟随手。'};
  setText($('action-hint'),hints[type]??'');paint();
}

$('play-take').addEventListener('click',()=>audio.paused?play():audio.pause());
$('replay').addEventListener('click',()=>{seek(0);state.manual={};play();});
$('scrub').addEventListener('input',e=>seek(Number(e.target.value)));
document.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>trigger(el.dataset.action)));
$('joints').addEventListener('change',e=>{state.joints=e.target.checked;paint();});
$('exploded').addEventListener('change',e=>{state.exploded=e.target.checked;$('actor-stage').classList.toggle('is-exploded',state.exploded);paint();});
$('mute').addEventListener('click',()=>{audio.muted=!audio.muted;setText($('mute'),audio.muted?'声音关':'声音开');$('mute').setAttribute('aria-label',audio.muted?'开启声音':'静音');});
$('captions').addEventListener('click',()=>{state.subtitles=!state.subtitles;$('captions').setAttribute('aria-pressed',String(state.subtitles));$('captions').setAttribute('aria-label',state.subtitles?'关闭字幕':'开启字幕');paint();});
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.querySelector('.stage-panel').requestFullscreen)await document.querySelector('.stage-panel').requestFullscreen();else report('当前浏览器不支持网页全屏，可以继续在页面中观看。');}
  catch{report('全屏未能开启，可以继续在页面中观看。');}
});
audio.addEventListener('waiting',()=>state.buffering=true);
audio.addEventListener('playing',()=>state.buffering=false);
audio.addEventListener('ended',()=>{state.buffering=false;paint();});
audio.addEventListener('error',()=>{if(data)report('配音加载失败，请刷新后重试。');});
document.addEventListener('keydown',e=>{
  if(['INPUT','BUTTON','A','TEXTAREA'].includes(document.activeElement.tagName))return;
  if(e.code==='Space'){e.preventDefault();audio.paused?play():audio.pause();}
  if(e.code==='ArrowRight'){e.preventDefault();seek(audio.currentTime+.5);}
  if(e.code==='ArrowLeft'){e.preventDefault();seek(audio.currentTime-.5);}
});

try {
  const [takeResponse,rigResponse]=await Promise.all([checked('takes.json'),checked('assets/gwen/rig.json')]);
  const [takeData,rigData]=await Promise.all([takeResponse.json(),rigResponse.json()]);
  data=takeData;
  const images=['assets/gwen/atlas.png','assets/gwen/lounge.png'].map(src=>{const image=new Image();image.src=src;return image.decode();});
  const assets=await Promise.all(data.takes.map(async take=>{
    const [a,e]=await Promise.all([checked(take.audio),checked(take.envelope)]);
    return [URL.createObjectURL(await a.blob()),await e.json()];
  }));
  urls=assets.map(a=>a[0]);clips=urls;envelopes=assets.map(a=>a[1]);
  await Promise.all(images);
  rig=new GwenRig($('actor-mount'),rigData);
  data.takes.forEach((take,i)=>{
    const button=document.createElement('button');button.className='take';button.setAttribute('aria-pressed',String(i===0));
    const label=document.createElement('small');label.textContent=`TAKE ${i===0?'A':'B'}`;
    const text=document.createElement('strong');text.textContent=`“${take.text}”`;
    const direction=document.createElement('span');direction.textContent=take.direction;
    button.append(label,text,direction);button.addEventListener('click',()=>selectTake(i).catch(()=>report('配音切换失败，请刷新后重试。')));$('takes').append(button);
  });
  await selectTake(0);
  $('loading').hidden=true;
  [$('play-take'),$('replay'),$('scrub'),...document.querySelectorAll('[data-action]')].forEach(el=>el.disabled=false);
  requestAnimationFrame(loop);
  if(new URLSearchParams(location.search).has('capture'))window.__gwen={
    audio,rig,data,state,selectTake,seek,trigger,
    freeze(time){audio.pause();state.started=true;state.manual={};state.frozen=time;paint();},
    poseAt(time){return samplePose(data.takes[state.index],time,envelopes[state.index]);},
    assets:()=>({atlas:rigData.atlas,parts:Object.keys(rigData.parts),clips:urls.length}),
  };
} catch(e){$('loading').hidden=true;report('演员或配音素材未能加载，请检查网络后刷新页面。');console.error(e);}

window.addEventListener('pagehide',e=>{if(!e.persisted)urls.forEach(url=>URL.revokeObjectURL(url));});
