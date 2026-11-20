export const clamp = (n, min=0, max=1) => Math.max(min, Math.min(max, n));
const smooth = n => { const t=clamp(n);return t*t*(3-2*t); };

export function blinkAt(time, start) {
  const t=time-start;
  return t<0 || t>.32 ? 0 : t<.1 ? smooth(t/.1) : t<.16 ? 1 : 1-smooth((t-.16)/.16);
}

export function gestureAt(time, action) {
  if(time<action.start || time>=action.end) return 0;
  const attack=Math.min(.85,(action.hold-action.start)*.6);
  return smooth((time-action.start)/attack)*(1-smooth((time-action.hold)/(action.end-action.hold)))*(action.amount??1);
}

export function sampleMouth(take, time, envelope=[]) {
  const [start,end]=take.speech;
  if(time<start || time>=end) return {open:0,round:0,wide:0};
  const e=time/.025,i=Math.floor(e),mix=e-i;
  const energy=(envelope[i]??0)*(1-mix)+(envelope[i+1]??0)*mix;
  const words=take.syllables.split(' ');
  const phase=(time-start)/(end-start)*words.length;
  const word=words[Math.min(words.length-1,Math.floor(phase))];
  const local=phase%1;
  const seal=/^[bmp]/.test(word)?1-smooth((local-.06)/.22):0;
  const open=smooth(energy/.18)*(1-seal)*(.36+.64*Math.sin(local*Math.PI));
  return {open,round:/u|o|lv/.test(word)?open*.8:0,wide:/i|e|ai/.test(word)?open*.65:0};
}

export function samplePose(take, time, envelope=[], {reduced=false, idle=false}={}) {
  const pose={head:0,raise:0,blink:0,breath:reduced?0:Math.sin(time*1.8)*1.4,hair:reduced?0:Math.sin(time*1.4)*1.2,...sampleMouth(take,time,envelope)};
  if(!reduced) for(const action of take.actions) {
    if(action.type==='blink') pose.blink=Math.max(pose.blink,blinkAt(time,action.start));
    if(action.type==='tilt') pose.head+=gestureAt(time,action);
    if(action.type==='raise') pose.raise=Math.max(pose.raise,gestureAt(time,action));
  }
  if(idle && !reduced) pose.blink=Math.max(pose.blink,blinkAt(time%4.6,3.8));
  return pose;
}
