// Export each player with its own artwork, sound and scripts embedded.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dataUrl=async(path,type)=>`data:${type};base64,${(await readFile(path)).toString('base64')}`;
await mkdir('dist',{recursive:true});

let comic=await readFile('comic.html','utf8');
let comicCss=await readFile('style.css','utf8');
comicCss=`:root{--storyboard:url('${await dataUrl('assets/storyboard.png','image/png')}')}\n`+comicCss.replaceAll("url('assets/storyboard.png')",'var(--storyboard)');
let comicJs=(await readFile('timeline.js','utf8')).replace('export function','function')+'\n'+(await readFile('app.js','utf8')).replace("import { sample } from './timeline.js';",'');
for(const [path,type] of [['story.json','application/json'],['assets/voice-envelope.json','application/json'],['assets/dialogue.mp3','audio/mpeg']]) comicJs=comicJs.replace(`fetch('${path}')`,`fetch('${await dataUrl(path,type)}')`);
comic=comic.replace('<link rel="stylesheet" href="style.css">',()=>`<style>${comicCss}</style>`).replace('<script type="module" src="app.js"></script>',()=>`<script type="module">${comicJs}</script>`);
await writeFile('dist/gwen-short.html',comic);

const paths=[['takes.json','application/json'],['assets/gwen/rig.json','application/json'],['assets/gwen/atlas.png','image/png'],['assets/gwen/lounge.png','image/png'],['assets/gwen/take-a.mp3','audio/mpeg'],['assets/gwen/take-b.mp3','audio/mpeg'],['assets/gwen/envelope-a.json','application/json'],['assets/gwen/envelope-b.json','application/json']];
const assets=Object.fromEntries(await Promise.all(paths.map(async([path,type])=>[path,await dataUrl(path,type)])));
const source=await Promise.all(['actor-motion.js','actor-rig.js','actor-lab.js'].map(path=>readFile(path,'utf8')));
let actorJs=source.join('\n').replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
actorJs=actorJs.replace("const ATLAS_URL = 'assets/gwen/atlas.png';","const ATLAS_URL = __GWEN_ASSETS['assets/gwen/atlas.png'];");
actorJs=actorJs.replace('fetch(path)','fetch(__GWEN_ASSETS[path]??path)').replace('image.src=src','image.src=__GWEN_ASSETS[src]??src');
actorJs=`const __GWEN_ASSETS=${JSON.stringify(assets)};\n`+
  `document.documentElement.style.setProperty('--gwen-scene','url("'+__GWEN_ASSETS['assets/gwen/lounge.png']+'")');\n`+
  `const partsLink=document.querySelector('.reuse-note a');partsLink.href=__GWEN_ASSETS['assets/gwen/atlas.png'];partsLink.download='gwen-parts.png';\n`+actorJs;
let actorCss=(await readFile('actor-lab.css','utf8')).replace("url('assets/gwen/lounge.png')",'var(--gwen-scene)');
let actor=await readFile('index.html','utf8');
actor=actor.replace('<link rel="stylesheet" href="actor-lab.css">',()=>`<style>${actorCss}</style>`).replace('<script type="module" src="actor-lab.js"></script>',()=>`<script type="module">${actorJs}</script>`);
actor=actor.replace('<a href="comic.html">查看分镜初版</a>','').replace('href="assets/gwen/atlas.png"','href="#gwen-parts"');
await writeFile('dist/gwen-actor.html',actor);
console.log('Offline players: dist/gwen-actor.html, dist/gwen-short.html');
