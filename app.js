import { sample } from './timeline.js';

const $ = id => document.getElementById(id);
const audio = $('audio');
const screen = $('screen');
let story, envelope, frame, subtitles = true, started = false, buffering = false;
let objectUrl;
$('start').disabled=true;
$('play').disabled=true;
$('start').querySelector('small').textContent='正在准备配音…';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const format = t => `00:${Math.floor(t).toString().padStart(2,'0')}`;
const report = message => { $('error').textContent = message; $('error').hidden = false; };

function refresh() {
  if (!story) return;
  const { time, index, line, progress } = sample(story, audio.currentTime);
  screen.dataset.shot = index;
  const shot = story.shots[index];
  const picture = $('picture');
  picture.style.backgroundPosition = shot.position;
  picture.setAttribute('aria-label', `${shot.description}，${shot.name}`);
  // Deterministic, audio-clock-driven camera: seeking restores the exact frame.
  const p = Math.max(0, Math.min(1, progress));
  const zoom = [1.025+p*.06, 1.07-p*.045, 1.025+p*.075, 1.025+p*.045][index];
  const dx = [p*-1.3, Math.sin(p*Math.PI)*.6, p*.8, p*-.5][index];
  const roll = index === 1 ? Math.sin(p*Math.PI*2)*.35 : index === 3 ? p*-.5 : 0;
  picture.style.transform = reduced ? 'scale(1.025)' : `translate(${dx}%,${Math.sin(time*1.3)*.12}%) scale(${zoom}) rotate(${roll}deg)`;
  const heart = index === 3 ? Math.sin(Math.min(1,p*2)*Math.PI)*.65 : 0;
  screen.style.setProperty('--heart', reduced ? 0 : heart);
  screen.style.setProperty('--heart-y', `${-p*55}px`);
  screen.style.setProperty('--heart-scale', 1+p*.45);
  const speaking = line && time < line.end && (envelope?.[Math.floor(time/.025)] ?? 0) > .06;
  $('speaker').textContent = subtitles && line ? line.name : '';
  $('speaker').style.opacity = speaking ? '1' : '.75';
  $('dialogue').textContent = subtitles && line ? line.text : '';
  $('subtitle').dataset.actor = line?.actor ?? '';
  $('shot-tag').textContent = shot.description;
  $('end-title').classList.toggle('show', time >= 19.0);
  $('progress').value = time;
  $('progress').style.setProperty('--progress',`${time/story.duration*100}%`);
  $('time').textContent = format(time);
  document.querySelectorAll('.chapter').forEach((el,i) => el.setAttribute('aria-current', String(i===index)));
  const playing = !audio.paused && !audio.ended;
  screen.classList.toggle('playing', playing && !buffering);
  $('play').innerHTML = playing ? 'Ⅱ <span>暂停播放</span>' : audio.ended || time>=20 ? '↺ <span>重新播放</span>' : '▶ <span>播放短剧</span>';
  $('play').setAttribute('aria-label',playing ? '暂停短剧' : '播放短剧');
  $('screen-toggle').setAttribute('aria-label',playing ? '暂停短剧' : '播放短剧');
  $('status').textContent = buffering ? '正在加载声音…' : audio.ended || time>=20 ? '故事落幕，心动继续' : playing ? shot.description : started ? '已暂停' : '准备开演';
}

function animate() { refresh(); if(!audio.paused && !audio.ended) frame=requestAnimationFrame(animate); }

async function play() {
  if(!story) return;
  $('error').hidden=true;
  if(audio.currentTime >= story.duration-.02 || audio.ended) audio.currentTime=0;
  try {
    await audio.play();
    started=true;
    $('start').hidden=true;
    $('screen-toggle').hidden=false;
    refresh();
  } catch(error) {
    report(error.name === 'NotAllowedError' ? '浏览器尚未允许声音播放，请再次点击播放按钮。' : '配音暂时无法加载，请检查网络后点击播放重试。');
    refresh();
  }
}

function toggle() { if(audio.paused) play(); else audio.pause(); }
function seek(seconds) {
  audio.currentTime=Math.max(0,Math.min(story.duration,seconds));
  started=true;
  $('start').hidden=true;
  $('screen-toggle').hidden=false;
  refresh();
}

$('start').addEventListener('click',play);
$('play').addEventListener('click',toggle);
$('screen-toggle').addEventListener('click',toggle);
$('replay').addEventListener('click',()=>{seek(0);play();});
$('progress').addEventListener('input',e=>seek(Number(e.target.value)));
$('mute').addEventListener('click',()=>{
  audio.muted=!audio.muted;
  $('mute').textContent=audio.muted?'声音关':'声音开';
  $('mute').setAttribute('aria-label',audio.muted?'开启声音':'静音');
});
$('captions').addEventListener('click',()=>{
  subtitles=!subtitles;
  $('captions').setAttribute('aria-pressed',String(subtitles));
  $('captions').setAttribute('aria-label',subtitles?'关闭字幕':'开启字幕');
  refresh();
});
$('fullscreen').addEventListener('click',async()=>{
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else if(document.querySelector('.cinema').requestFullscreen) await document.querySelector('.cinema').requestFullscreen();
    else report('当前浏览器不支持网页全屏，可以横屏观看。');
  } catch { report('全屏未能开启，可以继续在页面中播放。'); }
});
audio.addEventListener('play',()=>{cancelAnimationFrame(frame);animate();});
audio.addEventListener('pause',()=>{cancelAnimationFrame(frame);refresh();});
audio.addEventListener('ended',()=>{cancelAnimationFrame(frame);refresh();});
audio.addEventListener('timeupdate',refresh);
audio.addEventListener('seeked',refresh);
audio.addEventListener('waiting',()=>{buffering=true;refresh();});
audio.addEventListener('playing',()=>{buffering=false;refresh();});
audio.addEventListener('error',()=>{report('配音文件加载失败，请检查网络后刷新页面。');refresh();});
document.addEventListener('keydown',e=>{
  if(['INPUT','BUTTON','A','SUMMARY','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if(e.code==='Space'){e.preventDefault();toggle();}
  if(e.code==='ArrowRight'){e.preventDefault();seek(audio.currentTime+2);}
  if(e.code==='ArrowLeft'){e.preventDefault();seek(audio.currentTime-2);}
});

try {
  const responses=await Promise.all([fetch('story.json'),fetch('assets/voice-envelope.json'),fetch('assets/dialogue.mp3')]);
  if(responses.some(r=>!r.ok)) throw new Error('Missing story assets');
  [story,envelope]=await Promise.all(responses.slice(0,2).map(r=>r.json()));
  // Blob playback also supports seeking on static servers without byte-range support.
  objectUrl=URL.createObjectURL(await responses[2].blob());
  audio.src=objectUrl;
  await new Promise((resolve,reject)=>{
    audio.addEventListener('loadedmetadata',resolve,{once:true});
    audio.addEventListener('error',reject,{once:true});
    audio.load();
  });
  $('start').disabled=false;
  $('play').disabled=false;
  $('start').querySelector('small').textContent='点击播放 · 普通话配音';
  story.shots.forEach((shot,i)=>{
    const button=document.createElement('button');button.className='chapter';
    button.setAttribute('aria-label',`跳转到 ${shot.start} 秒：${shot.name}`);
    const thumb=document.createElement('span');thumb.className='thumbnail';thumb.style.backgroundPosition=shot.position;
    const time=document.createElement('time');time.textContent=`${format(shot.start)}–${format(shot.end)}`;
    thumb.append(time);
    const title=document.createElement('strong');title.textContent=shot.name;
    const detail=document.createElement('small');detail.textContent=shot.description;
    button.append(thumb,title,detail);button.addEventListener('click',()=>seek(shot.start));$('chapters').append(button);
  });
  story.lines.forEach(line=>{
    const button=document.createElement('button');button.className='script-line';
    const time=document.createElement('time');time.textContent=format(line.start);
    const name=document.createElement('b');name.textContent=line.name;
    const text=document.createElement('span');text.textContent=line.text;
    button.append(time,name,text);button.addEventListener('click',()=>seek(line.start));$('script-lines').append(button);
  });
  refresh();
  if(new URLSearchParams(location.search).has('capture')) window.__drama={seek, sample:()=>sample(story,audio.currentTime), audio, story};
} catch { report('短剧素材未能加载，请检查网络后刷新页面。');$('start').disabled=true;$('play').disabled=true; }
