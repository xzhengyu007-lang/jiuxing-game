/* 平衡性探测：node test/balance.js —— 模拟各阶段 vs 各区域敌人的数值检验 */
const fs=require('fs'),path=require('path');
const el=()=>({innerHTML:'',textContent:'',value:'',scrollTop:0,scrollHeight:0,style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},remove(){},select(){}});
const sandbox={
  console,Math,JSON,Date,isFinite,isNaN,parseInt,parseFloat,String,Number,Array,Object,
  setInterval:()=>0,clearInterval:()=>{},setTimeout:()=>0,
  document:{getElementById:()=>el(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({remove(){}}),addEventListener(){}},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  location:{reload(){}},window:{addEventListener(){}},
  innerWidth:1200,innerHeight:800,requestAnimationFrame:()=>0,
  btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),
  unescape,escape,confirm:()=>false,alert(){}
};
for(const k in sandbox)globalThis[k]=sandbox[k];
const code=['data','data2','social','game'].map(f=>fs.readFileSync(path.join(__dirname,'..','js',f+'.js'),'utf8')).join('\n')+'\n';
const probe=`
Math.random=()=>0.5; // 固定随机：词缀必不出现（0.5>0.16），掉落与伤害确定

function simFight(zid,ei){
  S.ap=999999;
  startBattle(zid,ei);
  let n=0;
  while(B&&!B.over&&n++<400)useSkill('bati');
  const win=B.ehp<=0;B=null;return{win:win,turns:n};
}
function stateAt(r,l,full){
  S=newState();
  S.g=r*13+l;S.bones=full?31:0;
  S.starsOpened=full?STARS.filter(s=>s.reqR<=r).map(s=>s.name):[];
  S.flags.sect=1;S.flags.sijie=full?0.24:0;S.flags.fireSeed=full?'雷':null;
  S.flags.mingxing=full&&r>=10?1:0;
  S.equips=full?{zhanxie:1,xueyin:1,heiguo:1,zixue:1}:{};
  S.wearing=full?{weapon:'xueyin',armor:'zixue',treasure:'heiguo',acc:null}:{weapon:null,armor:null,treasure:null,acc:null};
}
const bare=[
 [0,4,'fengming',2],[1,8,'heifeng',2],[2,6,'luoxia',2],[3,6,'luoxia',2],
 [4,6,'wangu',2],[5,6,'yunmeng',2],[6,6,'zixue',2],[7,6,'elong',2],
 [9,6,'xiezu',2],[11,6,'zhongzhou',2],[14,6,'xingkong',0],[19,0,'xingkong',2]
];
console.log('--- 同层裸装（无装备/星/骨，状态100） ---');
for(const c of bare){
  stateAt(c[0],c[1],false);
  const res=simFight(c[2],c[3]);
  const en=ZONES.find(z=>z.id===c[2]).enemies[c[3]];
  console.log((res.win?'胜':'败')+'  '+REALMS[c[0]].name+cnL(c[1])+'层 vs '+en.n+'（'+res.turns+'回合）');
}
const full=[
 [5,0,'yunmeng',0],[6,0,'zixue',0],[7,0,'elong',0],[9,0,'xiezu',0],
 [11,0,'zhongzhou',0],[14,0,'xingkong',0],[16,0,'xingkong',1],[19,0,'xingkong',2]
];
console.log('--- 满配（骨/星/装备/神火/四极） ---');
for(const c of full){
  stateAt(c[0],c[1],true);
  const res=simFight(c[2],c[3]);
  const en=ZONES.find(z=>z.id===c[2]).enemies[c[3]];
  console.log((res.win?'胜':'败')+'  '+REALMS[c[0]].name+'初期 vs '+en.n+'（'+res.turns+'回合）');
}
console.log('--- vs 每境生成图首领（每境2幅生成图） ---');
for(let r=0;r<REALMS.length;r++){
  const gz=ZONES.find(z=>/^z\\d+$/.test(z.id)&&z.reqR===r);
  if(!gz)continue;
  stateAt(r,6,true);
  const res=simFight(gz.id,2);
  const en=gz.enemies[2];
  console.log((res.win?'胜':'败')+'  '+REALMS[r].name+'七层满配 vs '+gz.name+'·'+en.n+'（'+res.turns+'回合）');
}

console.log('--- 九星塔（满配·各档层） ---');
function simTower(f){
  S.ap=999;S.towerBest=f-1;
  startTower();
  let n=0;
  while(B&&!B.over&&n++<400)useSkill('bati');
  const win=B.ehp<=0;B=null;return{win:win,turns:n};
}
for(const f of [5,10,20,30,50,80,120]){
  stateAt(Math.min(21,Math.floor((f-1)/5)),6,true);
  const res=simTower(f);
  console.log((res.win?'胜':'败')+'  满配 vs 塔第 '+f+' 层（'+res.turns+'回合）');
}
`;
fs.writeFileSync(path.join(__dirname,'balance_probe.js'),code+probe);
require('./balance_probe.js');
