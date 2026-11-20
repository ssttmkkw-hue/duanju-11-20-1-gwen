import {mkdir,cp,rm,readFile} from 'node:fs/promises';
const story=JSON.parse(await readFile('story.json','utf8'));
if(story.duration!==20 || story.lines.length!==6) throw new Error('Incomplete story');
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const path of ['index.html','actor-lab.css','actor-lab.js','actor-rig.js','actor-motion.js','takes.json','comic.html','style.css','app.js','timeline.js','story.json','assets']) await cp(path,`dist/${path}`,{recursive:true});
console.log('Static build ready in dist/');
