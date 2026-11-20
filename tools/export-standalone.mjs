// A self-contained, offline-playable copy, with no server or network required.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const dataUrl=async(path,type)=>`data:${type};base64,${(await readFile(path)).toString('base64')}`;
let html=await readFile('index.html','utf8');
let css=await readFile('style.css','utf8');
css=`:root{--storyboard:url('${await dataUrl('assets/storyboard.png','image/png')}')}\n`+css.replaceAll("url('assets/storyboard.png')",'var(--storyboard)');
let js=(await readFile('timeline.js','utf8')).replace('export function','function')+'\n'+(await readFile('app.js','utf8')).replace("import { sample } from './timeline.js';",'');
for(const [path,type] of [['story.json','application/json'],['assets/voice-envelope.json','application/json'],['assets/dialogue.mp3','audio/mpeg']]) js=js.replace(`fetch('${path}')`,`fetch('${await dataUrl(path,type)}')`);
html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`).replace('<script type="module" src="app.js"></script>',`<script type="module">${js}</script>`);
await mkdir('dist',{recursive:true});await writeFile('dist/gwen-short.html',html);
console.log('Offline player: dist/gwen-short.html');
