const ATLAS_URL = 'assets/gwen/atlas.png';
const num = n => Number(n.toFixed(3));

export class GwenRig {
  constructor(root, rig) {
    this.rig=rig;
    const sprite = name => {
      const {box:[x,y,w,h],anchor:[ax,ay],scale:s}=rig.parts[name];
      return `<svg x="${num((x-ax)*s)}" y="${num((y-ay)*s)}" width="${num(w*s)}" height="${num(h*s)}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><use href="#gwen-art"/></svg>`;
    };
    const joint=(x=0,y=0)=>`<g class="joint"><circle cx="${x}" cy="${y}" r="5"/><circle cx="${x}" cy="${y}" r="12"/></g>`;
    root.innerHTML=`<svg class="gwen-rig" viewBox="0 0 1200 900" role="img" aria-label="由独立头部、头发、躯干、手臂和剪刀组成的格温演员">
      <defs>
        <image id="gwen-art" width="1254" height="1254" href="${ATLAS_URL}"/>
        <radialGradient id="mouth-skin"><stop offset=".65" stop-color="#f0cbbd"/><stop offset="1" stop-color="#f0cbbd" stop-opacity="0"/></radialGradient>
        <radialGradient id="lip-cavity"><stop stop-color="#a85567"/><stop offset="1" stop-color="#4f293c"/></radialGradient>
        <radialGradient id="elbow-skin"><stop offset=".78" stop-color="#edc5b7"/><stop offset="1" stop-color="#edc5b7" stop-opacity="0"/></radialGradient>
        <linearGradient id="lip-light" x2="0" y2="1"><stop stop-color="#e2929d"/><stop offset="1" stop-color="#f6c2c1"/></linearGradient>
        <clipPath id="eyes-clip"><ellipse cx="-33" cy="-78" rx="32" ry="21"/><ellipse cx="49" cy="-79" rx="32" ry="21"/></clipPath>
        <clipPath id="mouth-clip"><path id="mouth-clip-path"/></clipPath>
      </defs>
      <g id="gwen-root" transform="translate(100 0)">
        <g data-part="hair"><g id="hair-left">${sprite('hairLeft')}</g><g id="hair-right">${sprite('hairRight')}</g></g>
        <g data-part="upperLeft">${sprite('upperLeft')}${joint()}</g>
        <g data-part="upperRight">${sprite('upperRight')}${joint()}</g>
        <g data-part="body">${sprite('body')}</g>
        <g data-part="forearmLeft"><g id="elbow-left">${sprite('forearmLeft')}<ellipse cy="1" rx="16" ry="18" fill="url(#elbow-skin)"/>${joint()}</g></g>
        <g data-part="head">${sprite('head')}<g id="blink-eyes" clip-path="url(#eyes-clip)" opacity="0">${sprite('closedEyes')}</g>
          <g id="mouth" transform="translate(8.6 -25.8)" opacity="0">
            <ellipse cy="-1" rx="28" ry="14" fill="url(#mouth-skin)"/>
            <path id="mouth-cavity" fill="url(#lip-cavity)" stroke="#a96973" stroke-width="1"/>
            <g clip-path="url(#mouth-clip)"><path id="mouth-teeth" fill="#ffe9dc"/><ellipse id="mouth-tongue" fill="#b76a7a"/></g>
            <path id="lower-lip" fill="none" stroke="url(#lip-light)" stroke-width="2.2" stroke-linecap="round"/>
          </g>${joint()}
        </g>
        <g data-part="forearmRight"><g id="elbow-right"><g id="scissor-grip" data-part="scissors">${sprite('scissors')}${joint()}</g>${sprite('forearmRight')}<ellipse cy="1" rx="16" ry="18" fill="url(#elbow-skin)"/>${joint()}</g></g>
        <g class="part-labels" aria-hidden="true"><text x="500" y="52">头部 / 眼睛 / 嘴型</text><text x="500" y="800">身体与服装</text><text x="179" y="292">左侧头发</text><text x="833" y="292">右侧头发</text><text x="180" y="433">肩 · 上臂</text><text x="828" y="433">肩 · 上臂</text><text x="160" y="705">肘 · 前臂 · 手</text><text x="810" y="705">肘 · 前臂 · 手</text><text x="935" y="588">独立剪刀</text></g>
      </g>
    </svg>`;
    this.root=root;this.svg=root.querySelector('svg');
    this.parts=Object.fromEntries([...root.querySelectorAll('[data-part]')].map(el=>[el.dataset.part,el]));
    this.nodes=Object.fromEntries(['hair-left','hair-right','elbow-left','elbow-right','scissor-grip','blink-eyes','mouth','mouth-cavity','mouth-clip-path','mouth-teeth','mouth-tongue','lower-lip'].map(id=>[id,root.querySelector(`#${id}`)]));
  }

  render(pose,{exploded=false,joints=false}={}) {
    const {parts:p,nodes:n}=this;
    const e=exploded?1:0,b=pose.breath,raise=pose.raise;
    const neck=[500,326+b-30*e];
    const head=`translate(${neck.join(' ')}) rotate(${num(pose.head)})`;
    p.head.setAttribute('transform',head);p.hair.setAttribute('transform',head);
    n['hair-left'].setAttribute('transform',`translate(${-123-e*115} -142) rotate(${num(-pose.hair)})`);
    n['hair-right'].setAttribute('transform',`translate(${130+e*115} -142) rotate(${num(pose.hair)})`);
    p.body.setAttribute('transform',`translate(500 ${320+b})`);
    const leftShoulder=`translate(${350-e*135} ${376+b+e*35}) rotate(5)`;
    const upperRight=5-raise*37;
    const lowerRight=-5+raise*115;
    const rightShoulder=`translate(${650+e*135} ${376+b+e*35}) rotate(${num(upperRight)})`;
    p.upperLeft.setAttribute('transform',leftShoulder);p.forearmLeft.setAttribute('transform',leftShoulder);
    p.upperRight.setAttribute('transform',rightShoulder);p.forearmRight.setAttribute('transform',rightShoulder);
    n['elbow-left'].setAttribute('transform',`translate(-9 ${196.8+e*32}) rotate(-5)`);
    n['elbow-right'].setAttribute('transform',`translate(12.6 ${197.4+e*32}) rotate(${num(lowerRight)})`);
    // Scissors live under the elbow chain at the hand grip; the wrist counter-rotates
    // so the blade remains upright while the forearm folds towards the torso.
    n['scissor-grip'].setAttribute('transform',`translate(${4.32+e*90} 149.28) rotate(${num(-(upperRight+lowerRight))})`);
    n['blink-eyes'].setAttribute('opacity',pose.blink>.005?num(pose.blink):0);
    const open=Math.max(0,pose.open),wide=pose.wide??0,round=pose.round??0;
    const w=15+wide*4-round*4,h=1+open*9;
    const mouth=`M${-w} -1 Q0 ${-2-h*.75} ${w} -1 Q${w*.7} ${h} 0 ${h+1} Q${-w*.7} ${h} ${-w} -1Z`;
    n.mouth.setAttribute('opacity',open>.035?1:0);
    n['mouth-cavity'].setAttribute('d',mouth);n['mouth-clip-path'].setAttribute('d',mouth);
    n['mouth-teeth'].setAttribute('d',`M${-w+2} -8H${w-2}L${w*.65} 1Q0 4 ${-w*.65} 1Z`);
    n['mouth-tongue'].setAttribute('cx',0);n['mouth-tongue'].setAttribute('cy',h+2);
    n['mouth-tongue'].setAttribute('rx',w*.68);n['mouth-tongue'].setAttribute('ry',h*.5);
    n['lower-lip'].setAttribute('d',`M${-w*.6} ${h+3}Q0 ${h+5} ${w*.6} ${h+3}`);
    this.svg.classList.toggle('show-joints',joints);
    this.svg.classList.toggle('exploded',exploded);
    this.svg.setAttribute('viewBox',exploded?'0 0 1200 900':'200 40 800 600');
    this.pose={...pose};
  }
}
