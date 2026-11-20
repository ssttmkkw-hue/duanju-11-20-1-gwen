import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sample} from '../timeline.js';
const story=JSON.parse(await readFile(new URL('../story.json',import.meta.url)));
test('director cuts land exactly at 5, 12, 17 seconds',()=>{
  for(const [time,index] of [[0,0],[4.999,0],[5,1],[11.999,1],[12,2],[17,3],[20,3]]) assert.equal(sample(story,time).index,index);
});
test('dialogue is silent during gaps and at the final card',()=>{
  for(const line of story.lines){assert.equal(sample(story,line.start).line,line);assert.notEqual(sample(story,line.end).line,line);}
  assert.equal(sample(story,0).line,null);assert.equal(sample(story,19.7).line,null);
});
test('seeking backwards selects the correct speaker and clamps out of range',()=>{
  assert.equal(sample(story,15.6).line.name,'Bin');assert.equal(sample(story,12.5).line.name,'格温');
  assert.equal(sample(story,-2).time,0);assert.equal(sample(story,99).time,20);assert.equal(sample(story,NaN).time,0);
});
