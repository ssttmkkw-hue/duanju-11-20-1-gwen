import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {samplePose,sampleMouth,blinkAt,gestureAt} from '../actor-motion.js';
const {takes}=JSON.parse(await readFile(new URL('../takes.json',import.meta.url)));
const energy=Array(260).fill(.4);
test('both voice envelopes cover the full 6.2-second action timeline',async()=>{
  for(const take of takes){
    const envelope=JSON.parse(await readFile(new URL('../'+take.envelope,import.meta.url)));
    assert.equal(envelope.length,Math.ceil(6.2/.025));
  }
});
test('one motion vocabulary can run two independently authored performances',()=>{
  assert.equal(samplePose(takes[0],0,energy).raise,0);
  assert.equal(samplePose(takes[0],4,energy).head,9);
  assert.equal(samplePose(takes[1],2,energy).raise,1);
  assert.equal(samplePose(takes[1],6.2,energy).raise,0);
  assert.equal(samplePose(takes[0],6.2,energy).head,0);
});
test('voice is silent outside its cue and when the audio envelope is silent',()=>{
  for(const take of takes){
    assert.equal(sampleMouth(take,0,energy).open,0);
    assert.equal(sampleMouth(take,take.speech[1],energy).open,0);
    assert.equal(sampleMouth(take,take.speech[0]+.5,[]).open,0);
    assert.ok(sampleMouth(take,take.speech[0]+.55,energy).open>0);
  }
});
test('blink has a short closed hold and releases fully',()=>{
  assert.equal(blinkAt(.99,1),0);assert.equal(blinkAt(1.13,1),1);assert.equal(blinkAt(1.33,1),0);
});
test('gestures return to rest so a reused actor does not inherit the previous take',()=>{
  const action={start:.2,hold:2,end:3,amount:10};
  assert.equal(gestureAt(0,action),0);assert.equal(gestureAt(1.5,action),10);assert.equal(gestureAt(3,action),0);
});
test('reduced motion suppresses automatic body actions while preserving speech',()=>{
  const pose=samplePose(takes[1],2,energy,{reduced:true});
  assert.equal(pose.head,0);assert.equal(pose.raise,0);assert.equal(pose.hair,0);assert.equal(pose.breath,0);
  assert.ok(pose.open>0);
});
