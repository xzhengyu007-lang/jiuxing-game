'use strict';
/* ============================================================
 * 九星霸体诀 · 修仙 —— 游戏逻辑
 * 放置修炼 + 境界突破 + 炼丹 + 历练战斗 + 九星秘藏 + 剧情
 * ============================================================ */

/* ---------------- 小工具 ---------------- */
const $=id=>document.getElementById(id);
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function rnd(a,b){return a+Math.random()*(b-a);}
function irnd(a,b){return Math.floor(rnd(a,b+1));}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function fmt(n){
  if(n===Infinity)return '∞';
  if(isNaN(n))return '0';
  if(n<0)return '-'+fmt(-n);
  if(n<1e4)return String(Math.floor(n));
  const units=[[1e44,'载'],[1e40,'正'],[1e36,'涧'],[1e32,'沟'],[1e28,'穰'],[1e24,'秭'],[1e20,'垓'],[1e16,'京'],[1e12,'兆'],[1e8,'亿'],[1e4,'万']];
  for(let i=0;i<units.length;i++){const v=units[i][0],u=units[i][1];
    if(n>=v){const x=n/v;return (x>=100?String(Math.floor(x)):(Math.floor(x*100)/100)+'')+u;}}
  return String(Math.floor(n));
}
function cnL(l){return CN_NUM[l+1];} // 1~13 层中文
function nearBottom(box){return box.scrollHeight-box.scrollTop-box.clientHeight<80;} // 用户没往上翻才自动滚底

/* ---------------- 存档与状态 ---------------- */
const SAVE_KEY='jsxing_batijue_save_v1';
let S=null, B=null, P=null, curTab='cult', autoBattle=false, sijieTimer=null, tickN=0, lastTouch=0;
const toastCd={};

function newState(){
  return {
    v:2, g:0, qi:0, stones:0,
    herbs:{}, pills:{}, mats:{shouhe:0},
    bones:0, starsOpened:[], danExp:0,
    equips:{}, wearing:{weapon:null,armor:null,treasure:null,acc:null},
    xiusui:0, perm:{hp:0,atk:0,def:0}, kills:{}, quests:{},
    flags:{intro:0,gumu:0,siguo:0,sect:0,pearl:0,fireSeed:null,sijie:0,mingxing:0,won:0},
    buffs:{julingUntil:0,qps:null},
    autobreak:0, usePojing:1, speed:1,
    day:1, ap:22, cond:100,
    pearl:{plants:[],trees:[],beasts:[]},
    expCd:{}, logs:[], lastTick:Date.now(),
    qiToday:0,
    daily:{day:0,qs:[],prog:[],done:[]},
    ach:{}, stat:{kills:0,bosses:0,crafts:0,explores:0,eats:0,sells:0,towers:0,qiTotal:0},
    seen:{h:{},p:{}},
    towerBest:0, gf:{own:{},on:null}, eqLv:0, starLv:{},
  };
}
function save(){ if(!S)return; S.lastTick=Date.now(); try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){} }
function load(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);
    if(!raw)return null;
    const s=JSON.parse(raw);
    if(!s||(s.v!==1&&s.v!==2))return null;
    const base=newState();
    for(const k in base){ if(s[k]===undefined)s[k]=base[k]; }
    s.v=2;
    return s;
  }catch(e){return null;}
}
function wipeSave(){ try{localStorage.removeItem(SAVE_KEY);}catch(e){} location.reload(); }

/* ---------------- 派生数值 ---------------- */
function curR(){return Math.floor(S.g/LAYER_CNT);}
function curL(){return S.g%LAYER_CNT;}
function MAXG(){return REALMS.length*LAYER_CNT-1;}
function realmTxt(){const r=curR(),l=curL();return REALMS[r].name+cnL(l)+'层';}
function starCnt(){return S.starsOpened.length;}
function buffMult(){
  let m=1;
  if(S.flags.sect)m*=1.5;
  if(S.wearing.acc==='julingzhui')m*=1.35;
  let qbuff=Date.now()<S.buffs.julingUntil?1.6:1;
  if(S.buffs.qps&&Date.now()<S.buffs.qps.until)qbuff=Math.max(qbuff,S.buffs.qps.m);
  m*=qbuff;
  m*=1+0.03*S.xiusui;
  m*=1+S.flags.sijie;
  m*=1+starFx('qps')+gfFx('qps');
  return m;
}
function qps(){ // 每秒灵气
  const starM=Math.pow(2.1,starCnt());
  return 2*Math.pow(1.36,S.g)*starM*buffMult()*condMult();
}
function layerCost(){
  return 20*Math.pow(1.36,S.g)*(curL()===LAYER_CNT-1?3:1);
}
function heroStats(){
  const r=curR(),l=curL();
  let hp=(80+20*l)*Math.pow(2.1,r);
  let atk=(10+3*l)*Math.pow(2.0,r);
  let def=(5+1.5*l)*Math.pow(2.0,r);
  const extra=(1+0.05*S.bones)*(1+0.18*starCnt())*(1+0.03*S.xiusui)*(1+S.flags.sijie)*(0.5+0.5*S.cond/100);
  hp*=extra;atk*=extra;def*=extra;
  hp*=(1+(S.perm.hp||0)/100);atk*=(1+(S.perm.atk||0)/100);def*=(1+(S.perm.def||0)/100);
  if(S.flags.mingxing){hp*=1.1;atk*=1.1;def*=1.1;}
  if(starCnt()>=9){hp*=2;atk*=2;def*=2;}
  for(const slot in S.wearing){
    const id=S.wearing[slot]; if(!id)continue;
    const e=EQ[id];
    atk*=e.atk||1;def*=e.def||1;hp*=e.hp||1;
  }
  if(S.flags.fireSeed)atk*=1.15;
  const sAll=1+starFx('all')+gfFx('all');
  atk*=sAll*(1+starFx('atk')+gfFx('atk'));
  def*=sAll*(1+starFx('def')+gfFx('def'));
  hp*=sAll*(1+starFx('hp')+gfFx('hp'));
  const eqm=1+0.08*(S.eqLv||0);
  atk*=eqm;def*=eqm;hp*=eqm;
  return {hp:hp,atk:atk,def:def};
}
/* ---------------- 九星专属加成 / 功法 / 每日修为上限 ---------------- */
function starLvOf(i){ // 凝星重数（旧档已开未凝者视为一重）
  const v=(S.starLv&&S.starLv[i])||0;
  return v||(i<S.starsOpened.length?1:0);
}
function starFx(k){ // 凝星十三重：第 n 重神通 = 基础 x(1+(n-1)/13)，大圆满翻倍
  if(!S||!S.starsOpened)return 0;
  let v=0;
  for(let i=0;i<S.starsOpened.length;i++){
    const st=STARS[i]; if(!st)continue;
    const mul=1+(starLvOf(i)-1)/(STAR_STAGES.length-1); // 一重为基础，十三重翻倍
    if(st.fx===k)v+=st.fxV*mul;
    if(k==='qps'&&st.fx==='all')v+=0.25*mul;
  }
  return v;
}
function gfFx(k){
  if(!S||!S.gf||!S.gf.on)return 0;
  const g=GONGFAS.find(x=>x.id===S.gf.on);
  return (g&&g.fx&&g.fx[k])||0;
}
function qiCap(){ // 每日修为上限：随境界、神树、聚灵坠、九星与功法提升
  return layerCost()*Math.max(1.1,4-0.25*curR())
    *(1+0.03*livingTrees())
    *(S.wearing.acc==='julingzhui'?1.15:1)
    *(1+starFx('cap'))*(1+gfFx('cap'));
}
function qiLeft(){return Math.max(0,qiCap()-S.qiToday);}
/* 统一灵气入口：修炼/打坐/战斗/炼丹/采药/服食/离线，皆经此并受每日上限约束 */
function addQi(n,src){
  if(!S||!(n>0))return 0;
  const got=Math.min(n,qiLeft());
  if(!(got>0))return 0;
  S.qi+=got;
  S.qiToday=(S.qiToday||0)+got;
  S.stat.qiTotal=(S.stat.qiTotal||0)+got;
  if(qiLeft()<=0&&!S.flags.qiCapped){
    S.flags.qiCapped=1;
    log('story','今日修为已臻圆满（上限 '+fmt(qiCap())+'）——气机圆满，再难纳新。点击「日落而息」进入次日，方可继续精进。');
  }
  return got;
}
/* 九星传人行动点：司命星与周天功可增 */
function apMax(r){return 22+r*2+starFx('ap')+gfFx('ap');}

function danRankIdx(){
  let idx=0;
  for(let i=0;i<DAN_EXP.length;i++){ if(S.danExp>=DAN_EXP[i])idx=i; }
  return idx;
}
/* ---------- 大千世界辅助：按品阶消耗 / 掉落 / 最强丹药 ---------- */
function herbsGE(t){ // 拥有的 ≥t 品灵植总数
  let c=0;
  for(const id in S.herbs){ const h=HERBS[id]; if(h&&h.t>=t)c+=S.herbs[id]; }
  return c;
}
function consumeHerbsGE(t,n){ // 从低品阶开始消耗 n 株 ≥t 品灵植
  const ids=Object.keys(S.herbs)
    .filter(id=>S.herbs[id]>0&&HERBS[id]&&HERBS[id].t>=t)
    .sort((a,b)=>HERBS[a].t-HERBS[b].t);
  for(const id of ids){
    if(n<=0)break;
    const take=Math.min(n,S.herbs[id]);
    S.herbs[id]-=take; n-=take;
  }
  return n<=0;
}
function randHerbTier(lo,hi){ // 掉落一株区间内随机灵植
  const a=Math.max(1,Math.min(10,lo)),b=Math.max(a,Math.min(10,hi));
  const t=irnd(a,b);
  const arr=HERBS_BY_TIER[t];
  return arr[irnd(0,arr.length-1)];
}
/* 地图灵植掉落：有名产地出固定名产，无名的荒野新图按品阶区间随机 */
function dropHerb(z){
  if(z.herbs&&z.herbs.length)return pick(z.herbs);
  return randHerbTier(z.ht?z.ht[0]:1,z.ht?z.ht[1]:3);
}
function bestPillOf(fam){ // 拥有的最强某系丹药 id
  let best=null,bb=-1;
  for(const pid in S.pills){
    const p=PILLS[pid];
    if((S.pills[pid]||0)>0&&p&&p.f===fam){ const sc=p.t*p.m; if(sc>bb){bb=sc;best=pid;} }
  }
  return best;
}
function breakBonus(p){ // 破境系加成
  if(!p)return 0;
  return (p.f==='break')?Math.min(0.35,0.10+0.025*p.t*p.m):0;
}
function savePct(p){ // 护命系回复比例
  if(!p)return 0.5;
  return Math.min(0.95,0.45+0.04*p.t);
}
function herbAttrsMatch(h){ return S.flags.fireSeed&&h.a!==undefined&&HERB_ATTRS[h.a]===S.flags.fireSeed; }
function recipeUnlocked(rc){ return danRankIdx()>=rc.rank&&(rc.reqR||0)<=curR(); }
/* ---------------- 日程 / 状态 / 行动点 ---------------- */
function useAp(n,label){
  if(S.ap<n){toast('「'+label+'」行动点不足（今日余 '+S.ap+' 点）——可回修炼页「日落而息」进入下一日');return false;}
  S.ap-=n;return true;
}
function condMult(){return 0.3+0.7*S.cond/100;}
function livingTrees(){return S.pearl.trees.filter(t=>!t.dead).length;}
function condRecoveryPerDay(){return COND_SLOW+COND_PER_TREE*livingTrees();}

/* ---------------- 日志 / 通知 ---------------- */
function log(type,txt){
  if(!S)return;
  S.logs.push({t:type,x:txt,d:Date.now()});
  if(S.logs.length>80)S.logs.shift();
  const box=$('log');
  if(box){const stick=nearBottom(box);box.innerHTML=S.logs.map(logLine).join('');if(stick)box.scrollTop=box.scrollHeight;}
}
function logLine(l){
  const t=new Date(l.d);
  const hh=('0'+t.getHours()).slice(-2),mm=('0'+t.getMinutes()).slice(-2);
  return '<p class="'+l.t+'"><span class="small muted">['+hh+':'+mm+'] </span>'+l.x+'</p>';
}
function toast(txt,cls){
  const now=Date.now();
  if(toastCd[txt]&&now-toastCd[txt]<1500)return;
  toastCd[txt]=now;
  const root=$('toast-root'); if(!root)return;
  const d=document.createElement('div');
  d.className='toast '+(cls||'');
  d.innerHTML=txt;
  root.appendChild(d);
  setTimeout(()=>{d.remove();},3200);
}

/* ---------------- 弹窗 ---------------- */
function openModal(html){
  $('modal-root').innerHTML='<div class="modal-back" onclick="if(event.target===this)closeModal();"><div class="modal">'+html+'</div></div>';
}
function closeModal(){ $('modal-root').innerHTML=''; if(sijieTimer){clearInterval(sijieTimer);sijieTimer=null;} }
function openAbout(){
  openModal('<h2>关于本作</h2>'+
   '<p>本作为粉丝向致敬之作，核心设定取自平凡魔术师所著玄幻小说<b class="gold">《九星霸体诀》</b>：'+
   '被盗走灵根、灵血、灵骨的“三无少年”龙尘，凭丹帝记忆中的炼丹神术，修行神秘功法九星霸体诀，开启人体九大秘藏，逆袭归来。</p>'+
   '<hr class="hr"><p class="small">境界体系（后天五境→先天八境→仙道诸境）、锻骨境祭炼骨骼、璇丹境“破仙台凝神丹”天劫、四极境一炷香择符、丹修十阶、'+
   '斩邪刀/血饮刀/黑锅、紫血宗、恶龙域、邪族等均源自原著或公开资料整理；九星以北斗九星为名属游戏化演绎。</p><hr class="hr">'+
   '<p class="small muted">资料来源：<br>· 百度百科“九星霸体诀”词条（baike.baidu.com）<br>· 知乎专栏《小说九星霸体决修行等级介绍》（zhuanlan.zhihu.com/p/716006589）<br>'+
   '· 九星霸体诀 Wiki（jiuxingbatijue.fandom.com）<br>· 起点中文网 / 17K小说网 作品页</p>'+
   '<div style="text-align:center;margin-top:14px"><button class="btn" onclick="closeModal()">知道了</button></div>');
}
function openIntro(){
  openModal('<h2>九星霸体诀</h2><p class="art">—— 三无少年修仙录 ——</p>'+
   '<p>是丹帝重生？是灵魂融合？<br>天武大陆东荒·凤鸣帝国，少年龙尘的灵根、灵血、灵骨被人盗走，丹田尽碎，沦为“三无少年”。</p>'+
   '<p>危难之际，前世丹帝记忆觉醒。丹田已破？无妨——<b class="gold">人体内有九个秘密宝藏，是为九星。</b>'+
   '修行《九星霸体诀》，不修丹田而修九星，开启九大秘藏，便有九个丹田般的灵力之源！</p>'+
   '<p class="small muted">玩法：打坐积攒灵气 → 冲击境界（后天五境 → 先天八境 → 仙道诸境）→ 炼丹辅助修行 → 历练斩妖夺宝 → 开启九星。'+
   '日子一天天过：每日行动点有限（出战2 · 采药1 · 炼丹1 · 种植1……），没事做了就「日落而息」进入下一日，状态恢复、灵植生长。'+
   '凝血境后可得至宝<b class="gold">混沌珠</b>：空间无边无际，可种丹药材料、植混沌神树（回复状态，枯萎则回复缓慢）、养灵兽。'+
   '多余物件皆可在<b class="gold">华云商行</b>买卖。锻骨境要拼财力祭炼骨骼，璇丹境天劫只有一次机会，四极境须在一炷香内抓取符文……手握乾坤，脚踏星辰，从今日始。</p>'+
   '<div style="text-align:center;margin-top:14px"><button class="btn big" onclick="startGame()">开始修行</button></div>');
}

/* ---------------- 境界突破 ---------------- */
function tryBreak(){
  if(!S)return;
  if(S.g>=MAXG()){toast('人皇境十三层圆满：皇境之下皆蝼蚁，天下再无敌手。','good');return;}
  const r=curR(),l=curL(),toR=r+1,cost=layerCost();
  if(S.qi<cost){toast('灵气不足，尚缺 '+fmt(cost-S.qi));return;}
  if(r===3&&S.bones<BONES_REQ[l]){
    toast('锻骨境：需累计祭炼 '+BONES_REQ[l]+' 根骨骼（当前 '+S.bones+'），吞服祭骨丹后点击「祭骨冲关」');return;
  }
  const realmCross=(l===LAYER_CNT-1);
  let p=0.92-r*0.012-l*0.008;
  if(realmCross){
    if(toR===8){ // 璇丹境：破仙台凝神丹 + 天劫（璇丹境=REALMS[8]）
      if((S.pills.xuandan||0)<1){toast('需一枚「破仙台凝神丹」，方敢破仙台、凝神丹！');return;}
      S.pills.xuandan--;p=REALMS[8].trib;
    }else if(toR===11){ // 通冥境：参悟生死
      p=0.55;
      if((S.pills.shengsi||0)>0){S.pills.shengsi--;p=1;log('good','生死轮回丹入腹，生死之道了然于心。');}
    }else if(toR===14){ // 神火境：凝神火之种
      if((S.pills.shenhuo||0)<1){toast('需一枚「神火引」凝聚神火之种。');return;}
      S.pills.shenhuo--;P={type:'fire',cost:cost};openFireModal();return;
    }else if(toR===15){ // 四极境：一炷香择符
      S.qi-=cost;P={type:'sijie',cost:cost};beginSijie();return;
    }else if(REALMS[toR].trib){p=REALMS[toR].trib;}
  }
  if(S.usePojing&&p<0.97){
    const bp=bestPillOf('break');
    if(bp){S.pills[bp]--;const bb=(bp==='pojing')?0.2:breakBonus(PILLS[bp]);p+=bb;}
  }
  p=clamp(p,0.2,0.99);
  if(Math.random()<p){
    doAdvance(cost);
    if(realmCross)log('good','轰——境界壁垒碎裂，你踏入了【'+REALMS[toR].name+'】！');
    else log('good','灵气冲开关窍，修为精进：'+REALMS[r].name+cnL(l+1)+'层');
  }else{
    S.qi=Math.max(0,S.qi-cost*0.5);
    if(toR===8&&realmCross){log('bad','仙台爆碎！万千能量溃散……幸得护体真气，未伤根本。重整旗鼓，再凝仙台！');}
    else{log('bad','心魔骤起，真气逆行——突破失败，损失五成灵气。');}
  }
  renderAll();
}
function doAdvance(cost){
  S.qi=Math.max(0,S.qi-cost);
  S.g++;
  if(S.g%LAYER_CNT===0){
    const r=curR();
    log('story','【'+REALMS[r].name+'】'+REALMS[r].intro);
    if(r===5)log('good','受天地本源之气滋养，脱胎换骨——寿元千载，容颜不老！');
    if(r===10&&!S.flags.mingxing){
      S.flags.mingxing=1;
      log('story','你舍去记录过去的旧命星珠，重新凝聚一颗新珠——过去的辉煌尽数放下，涅槃重生，心境大彻。');
    }
  }
  checkQuests();save();
}
/* 锻骨境：祭骨冲关（祭炼一根骨骼） */
function refineBone(){
  if(!S)return;
  if(curR()!==3){toast('唯有锻骨境，方能以祭骨丹祭炼骨骼。');return;}
  if(S.bones>=80){toast('肉身承受已至极限，无法再祭炼。');return;}
  if((S.pills.jigu||0)<1){toast('没有祭骨丹——可去炼丹或华云商行购买。');return;}
  if(!useAp(AP_REFINE,'祭骨'))return;
  S.pills.jigu--;S.bones++;
  log('good','祭骨丹药力入髓，一根骨骼祭炼完成（'+S.bones+' 根）——气血轰鸣，力量被动增长。');
  if(S.bones===BONES_REQ[curL()])toast('骨骼已足，可冲击锻骨'+cnL(curL())+'层！','good');
  checkQuests();renderAll();save();
}

/* ---------------- 神火之种 ---------------- */
function openFireModal(){
  const btns=FIRE_SEEDS.map(el=>'<button class="btn jade" style="margin:4px" onclick="chooseFireSeed(\''+el+'\')">'+el+'</button>').join('');
  openModal('<h2>点燃神火</h2><p>蜕凡圆满，你于识海之中凝结出一枚<b class="gold">神火之种</b>。'+
   '择自身最强之属性点燃——此后万力归流，一脉独尊。</p><p class="small muted">（原著：金、木、水、火、土、风、雷、光、暗、魂……择最强属性凝聚火种）</p>'+
   '<div style="text-align:center;margin:12px 0">'+btns+'</div>');
}
function chooseFireSeed(el){
  if(!P||P.type!=='fire')return;
  S.flags.fireSeed=el;
  doAdvance(P.cost);
  log('story','神火之种轰然点燃——'+el+'行神火焚天而起，你的力量自此一脉独尊（攻击+15%）。');
  toast('神火·'+el+'，点燃！','good');
  P=null;closeModal();renderAll();
}

/* ---------------- 四极境：一炷香择符 ---------------- */
function beginSijie(){
  const runes=RUNE_COLORS.slice(0,7).map(r=>({c:r.c,hex:r.hex,g:r.g}));
  if(Math.random()<0.15)runes[irnd(0,6)]={c:'彩',hex:'#ffffff',g:10};
  const order=runes.slice();
  for(let i=order.length-1;i>0;i--){const j=irnd(0,i);const t=order[i];order[i]=order[j];order[j]=t;}
  P.runes=order;P.picks=[];
  renderSijie();
  const t0=Date.now();
  sijieTimer=setInterval(()=>{
    const left=1-(Date.now()-t0)/10000;
    const bar=$('runeTimerBar');
    if(bar)bar.style.width=Math.max(0,left*100)+'%';
    if(left<=0)resolveSijie(null);
  },100);
}
function renderSijie(){
  const cells=P.runes.map((r,i)=>{
    const picked=P.picks.indexOf(i)>=0;
    return '<button class="rune'+(picked?' pick':'')+'" style="border-color:'+r.hex+'" onclick="pickRune('+i+')">'+
      '<b style="color:'+r.hex+'">'+r.c+'</b><span>'+r.g+'品</span></button>';
  }).join('');
  openModal('<h2>四极择符</h2>'+
   '<p>天劫当空，亿万符文纷飞。一炷香内，择出<b class="gold">四道</b>天道符文——品阶越高，福缘越厚；一炷香尽，再无机会。</p>'+
   '<div id="runeTimer"><i id="runeTimerBar" style="width:100%"></i></div>'+
   '<div class="runes">'+cells+'</div>'+
   '<p class="small muted" style="text-align:center">已择 '+P.picks.length+' / 4（择满四道自动收符）</p>');
}
function pickRune(i){
  if(!P||P.type!=='sijie'||P.picks.length>=4||P.picks.indexOf(i)>=0)return;
  P.picks.push(i);
  if(P.picks.length>=4)resolveSijie(P.picks);
  else renderSijie();
}
function resolveSijie(picks){
  if(sijieTimer){clearInterval(sijieTimer);sijieTimer=null;}
  let sum=0;
  if(picks&&picks.length){
    for(const i of picks.slice(0,4))sum+=P.runes[i].g;
  }else{
    sum=8; // 错失良机：只得四道二品符文
    log('bad','一炷香尽，天劫散去——你只仓促抓下四道二品符文。');
  }
  S.flags.sijie=0.04*sum;
  doAdvance(P.cost);
  log('good','四极择符已成（'+sum+'品）：天道符文融入四肢百骸，全属性 +'+Math.round(S.flags.sijie*100)+'%！');
  toast('四极择符：+'+Math.round(S.flags.sijie*100)+'% 全属性','good');
  P=null;closeModal();renderAll();
}

/* ---------------- 修炼 ---------------- */
function meditate(){
  if(!S)return;
  const gain=addQi(qps()*8,'med');
  if(!(gain>0))toast('今日修为已臻圆满——「日落而息」后才能继续纳气');
  const box=$('medGain');
  if(box){box.textContent='+'+fmt(gain);box.style.opacity=1;setTimeout(()=>{if(box)box.style.opacity=0;},350);}
  renderTop();
}
function toggleAuto(el){S.autobreak=el.checked?1:0;save();}
function togglePojing(el){S.usePojing=el.checked?1:0;save();}
function setSpeed(v){S.speed=v;save();renderAll();toast('游戏速度：'+v+'x');}

/* ---------------- 炼丹 ---------------- */
function craft(rid){
  const rc=RECIPES.find(r=>r.id===rid); if(!rc)return;
  const myRank=danRankIdx();
  if(myRank<rc.rank){toast('丹修位阶不足：需 '+DAN_RANKS[rc.rank]+'（当前 '+DAN_RANKS[myRank]+'）');return;}
  if((rc.reqR||0)>curR()){toast('修为不足：此丹方需 '+REALMS[rc.reqR].name+'方可参悟');return;}
  if(rc.matsGE){ // 新式丹方：按品阶取药（千种灵植皆可入药）
    for(const sp of rc.matsGE){
      if(herbsGE(sp.t)<sp.n){toast('材料不足：需 '+sp.n+' 株 '+sp.t+' 品及以上灵植（现有 '+herbsGE(sp.t)+'）');return;}
    }
    if(rc.shouhe&&(S.mats.shouhe||0)<rc.shouhe){toast('材料不足：兽核 x'+rc.shouhe);return;}
    if(!useAp(AP_CRAFT,'炼丹'))return;
    for(const sp of rc.matsGE)consumeHerbsGE(sp.t,sp.n);
    if(rc.shouhe)S.mats.shouhe-=rc.shouhe;
  }else{ // 旧式丹方：指定药材
    for(const m in rc.mats){
      const have=(S.herbs[m]||0)+(m==='shouhe'?(S.mats.shouhe||0):0);
      if(have<rc.mats[m]){toast('材料不足：'+(HERBS[m]?HERBS[m].n:MATS[m].n)+' x'+rc.mats[m]);return;}
    }
    if(!useAp(AP_CRAFT,'炼丹'))return;
    for(const m in rc.mats){
      if(m==='shouhe')S.mats.shouhe-=rc.mats[m];
      else S.herbs[m]-=rc.mats[m];
    }
  }
  const p=clamp(0.62+0.07*(myRank-rc.rank),0.15,0.95);
  if(Math.random()<p){
    let sq=0;
    const isStar=rc.starRoll!==undefined;
    const outId=isStar?('star'+rc.starRoll+'_'+(sq=rollStarQ(myRank))):rc.out;
    S.pills[outId]=(S.pills[outId]||0)+1;
    S.danExp+=(rc.exp||10);
    S.stat.crafts=(S.stat.crafts||0)+1;
    const cq=addQi(layerCost()*0.04,'craft');
    bumpDaily('craft',1);
    const qn=isStar?('｜品阶：'+STAR_PILL_Q[sq].s):'';
    log('good','丹成！【'+PILLS[outId].n+'】x1'+qn+'（丹修 '+DAN_RANKS[myRank]+' +'+(rc.exp||10)+' 阅历'+(cq>0?('，修为 +'+fmt(cq)):'')+'）');
  }else{
    if(rc.matsGE){
      for(const sp of rc.matsGE)consumeHerbsGE(sp.t,Math.floor(sp.n/2));
      if(rc.shouhe)S.mats.shouhe+=Math.floor(rc.shouhe/2);
    }else{
      for(const m in rc.mats){
        const back=Math.floor(rc.mats[m]/2);
        if(back<=0)continue;
        if(m==='shouhe')S.mats.shouhe+=back;else S.herbs[m]=(S.herbs[m]||0)+back;
      }
    }
    log('bad','炉火失控，炸炉了……抢回一半药材。');
  }
  renderAll();save();
}
function usePill(pid){
  if(!S)return;
  if((S.pills[pid]||0)<1)return;
  const p=PILLS[pid];
  if(pid==='huiqi'){
    if(B&&!B.over){
      S.pills.huiqi--;
      B.php=Math.min(B.pmax,B.php+B.pmax*0.6);
      battleLog('你吞下回气丹，气血恢复六成！','good');
      renderBattle();return;
    }else{toast('伤势全无，不必浪费丹药（战斗中自动可用）。');return;}
  }
  if(pid==='juling'){
    S.pills.juling--;S.buffs.julingUntil=Date.now()+300000;
    log('good','聚灵丹入腹，周身灵气如潮——五分钟内修炼速度+60%！');
    renderAll();save();return;
  }
  if(pid==='xiusui'){
    S.pills.xiusui--;S.xiusui++;
    log('good','洗髓易骨，脱胎换骨——永久属性+3%（叠加 '+Math.round(S.xiusui*10)/10+' 层）。');
    renderAll();save();return;
  }
  if(p&&p.f==='star'){toast(p.n+'乃凝星之丹——请于「九星」页凝聚星窍之用，不可直接服用。');return;}
  if(!p||p.m===undefined){toast(PILLS[pid].n+'为触发类丹药，会在相应时机自动使用。');return;}
  const t=p.t,m=p.m;
  switch(p.f){
    case 'heal':
      if(B&&!B.over){
        S.pills[pid]--;
        const pct=Math.min(0.95,(0.40+0.06*t)*Math.min(m,2));
        B.php=Math.min(B.pmax,B.php+B.pmax*pct);
        battleLog('你吞下'+p.n+'，气血恢复 '+Math.round(pct*100)+'%！','good');
        renderBattle();return;
      }
      toast('回气类丹药须在战斗中使用。');return;
    case 'qpsb':{
      const nm=1+0.15*t*m;
      S.pills[pid]--;
      if(!S.buffs.qps||Date.now()>=S.buffs.qps.until||nm>S.buffs.qps.m)S.buffs.qps={until:Date.now()+300000,m:nm};
      log('good',p.n+'入腹，灵气如潮——五分钟内修炼速度 +'+Math.round((nm-1)*100)+'%！');break;
    }
    case 'perm':{
      const v=(1.5+0.5*t)*m;
      S.pills[pid]--;S.xiusui+=v/3;
      log('good',p.n+'化开，脱胎换骨——永久全属性 +'+v.toFixed(1)+'%（叠加至 '+Math.round(S.xiusui*10)/10+' 层）。');break;
    }
    case 'cond':{
      const v=Math.min(100-S.cond,(8+3*t)*m);
      if(v<=0){toast('状态饱满，不必浪费丹药。');return;}
      S.pills[pid]--;S.cond+=v;
      log('good','服下'+p.n+'，神清气爽：状态 +'+Math.round(v)+'。');break;
    }
    case 'qi':{
      const g=layerCost()*(0.4+0.4*t)*Math.min(m,2);
      const got=addQi(g,'pill');
      if(!(got>0)){toast('今日修为已臻圆满，服之无用——明日再服。');return;}
      S.pills[pid]--;
      log('good',p.n+'化作磅礴灵气：修为 +'+fmt(got)+'。');break;
    }
    case 'danxp':{
      S.pills[pid]--;S.danExp+=(15+25*t)*m;
      log('good',p.n+'启灵开智：丹修阅历 +'+fmt((15+25*t)*m)+'。');break;
    }
    case 'ap':{
      const g=Math.min(10,Math.ceil((1+t/2)*Math.min(m,2)));
      S.pills[pid]--;S.ap+=g;
      log('good',p.n+'行气周天：今日行动点 +'+g+'。');break;
    }
    case 'hp':case 'atk':case 'def':{
      const v=Math.min(15,(1+0.4*t)*m/2);
      S.pills[pid]--;S.perm[p.f]=(S.perm[p.f]||0)+v;
      log('good',p.n+'淬炼肉身：永久'+({hp:'气血',atk:'攻击',def:'防御'})[p.f]+' +'+v.toFixed(1)+'%。');break;
    }
    default:
      toast(p.n+'为触发类丹药，会在相应时机自动使用。');return;
  }
  renderAll();save();
}

/* ---------------- 行囊 / 商店 ---------------- */
function equipItem(eid){
  const e=EQ[eid]; if(!e||!S.equips[eid])return;
  S.wearing[e.slot]=eid;
  log('good','你装备了【'+e.n+'】。');
  renderAll();save();
}
function sellHerb(hid,qty){
  const have=S.herbs[hid]||0;
  qty=Math.min(qty,have); if(qty<=0)return;
  const t=HERBS[hid].t;
  const price=Math.floor(6*Math.pow(1.6,t))*qty;
  S.herbs[hid]-=qty;S.stones+=price;
  S.stat.sells=(S.stat.sells||0)+1;bumpDaily('sell',1);
  toast('售出 '+HERBS[hid].n+' x'+qty+'，得灵石 '+fmt(price));
  renderAll();save();
}
/* 服食灵植：耗费 1 行动点，得灵气与状态（属性合神火则加成） */
function eatHerb(hid){
  const h=HERBS[hid]; if(!h||((S.herbs[hid]||0)<1))return;
  if(!useAp(AP_EXPLORE,'服食'))return;
  S.herbs[hid]--;
  const mult=herbAttrsMatch(h)?1.5:1;
  const cd=Math.min(100-S.cond,Math.ceil(h.t/2)*mult);
  const qi=addQi(layerCost()*0.12*h.t*mult,'eat');
  S.cond+=cd;
  S.stat.eats=(S.stat.eats||0)+1;bumpDaily('eat',1);
  log('good','服食【'+h.n+'】（'+h.t+'品'+(herbAttrsMatch(h)?' · 合神火属性':'')+'）：修为 +'+fmt(qi)+(cd>0?('，状态 +'+Math.ceil(cd)):'')+'。');
  renderAll();save();
}
/* 按品阶整批出售灵植 */
function sellHerbsTier(t,keep){
  let n=0,price=0;
  for(const id in S.herbs){
    const h=HERBS[id];
    if(h&&h.t===t&&S.herbs[id]>0){
      const take=keep?Math.max(0,S.herbs[id]-keep):S.herbs[id];
      if(take>0){n+=take;price+=herbPrice(t)*take;S.herbs[id]-=take;}
    }
  }
  if(n<=0){toast('没有 '+t+' 品灵植可售');return;}
  S.stones+=price;
  S.stat.sells=(S.stat.sells||0)+1;bumpDaily('sell',1);
  toast('售出 '+t+' 品灵植 x'+n+'，得灵石 '+fmt(price));
  renderAll();save();
}
function buy(item){
  const r=curR();
  const list={
    lingcao10:{cost:Math.floor(60*Math.pow(1.55,r)),give:()=>{S.herbs.lingcao=(S.herbs.lingcao||0)+10;},n:'灵草 x10'},
    shouhe:{cost:Math.floor(50*Math.pow(1.55,r)),give:()=>{S.mats.shouhe=(S.mats.shouhe||0)+1;},n:'兽核 x1'},
    jigu:{cost:Math.floor(120*Math.pow(1.5,r)),give:()=>{S.pills.jigu=(S.pills.jigu||0)+1;},n:'祭骨丹 x1'},
    huiqi:{cost:Math.floor(100*Math.pow(1.55,r)),give:()=>{S.pills.huiqi=(S.pills.huiqi||0)+1;},n:'回气丹 x1'},
    julingzhui:{cost:20000,give:()=>{S.equips.julingzhui=1;equipItem('julingzhui');},n:'聚灵坠'},
  };
  const it=list[item]; if(!it)return;
  if(item==='julingzhui'&&S.equips.julingzhui){toast('你已购得聚灵坠。');return;}
  if(S.stones<it.cost){toast('灵石不足');return;}
  S.stones-=it.cost;it.give();
  toast('购得 '+it.n,'good');
  renderAll();save();
}

/* ---------------- 历练与战斗 ---------------- */
function zoneUnlocked(z){
  if(curR()<z.reqR)return false;
  if(z.sect&&!S.flags.sect)return false;
  return true;
}
function startBattle(zid,idx,free){
  const z=ZONES.find(x=>x.id===zid); if(!z||!zoneUnlocked(z))return;
  const ed=z.enemies[idx]; if(!ed)return;
  if(!free&&!useAp(AP_BATTLE,'出战'))return;
  beginBattle(zid,idx,ed,0);
}
function rollAffix(ed){
  if(ed.noAfx)return null;
  const ch=0.16+0.1*(starFx('drop')+gfFx('drop'));
  if(ed.boss||Math.random()>=ch)return null;
  return AFFIXES[Math.floor(Math.random()*AFFIXES.length)];
}
function beginBattle(zid,idx,ed,tower){
  const st=heroStats();
  const afx=tower?null:rollAffix(ed);
  const hm=afx?(afx.hp||1):1,am=afx?(afx.atk||1):1,dm=afx?(afx.def||1):1;
  const ehp=Math.floor(55*Math.pow(2.05,ed.r)*ed.m*hm);
  const eatk=Math.floor(7*Math.pow(1.95,ed.r)*Math.pow(ed.m,0.6)*am);
  B={
    zid:zid,idx:idx,e:ed,tower:tower||0,afx:afx||null,
    ehp:ehp,emax:ehp,eatk:eatk,edef:Math.floor(eatk*0.35*dm),
    shield:(afx&&afx.shield)?Math.floor(ehp*afx.shield):0,
    dodge:(afx&&afx.dodge)||0,leech:(afx&&afx.leech)||0,
    php:st.hp,pmax:st.hp,patk:st.atk,pdef:st.def,
    mp:60+curR()*8,mpmax:60+curR()*8,
    stun:0,bleedT:0,bleedDmg:0,cds:{},turn:1,over:false,log:[]
  };
  if(afx)battleLog('此妖携异象而生——'+afx.n+'！'+afx.d,'bad');
  battleLog(ed.boss?'【'+ed.n+'】仰天长啸，杀气如潮——大战爆发！':'你与【'+ed.n+'】缠斗在一起！','');
  showTab('hunt');
}

function battleLog(txt,cls){
  if(!B)return;
  B.log.push({c:cls||'',x:txt});
  if(B.log.length>40)B.log.shift();
}
function skillOk(sk){
  if(!sk.req)return true;
  if(sk.req.eq){const e=EQ[sk.req.eq];if(S.wearing[e.slot]!==sk.req.eq)return false;}
  if(sk.req.stars&&starCnt()<sk.req.stars)return false;
  if(sk.req.realm&&curR()<sk.req.realm)return false;
  return true;
}
function useSkill(sid){
  if(!B||B.over)return;
  const sk=SKILLS.find(s=>s.id===sid); if(!sk||!skillOk(sk))return;
  if((B.cds[sid]||0)>0){toast('战技尚在冷却');return;}
  if(B.mp<sk.qi){toast('灵力不足');return;}
  B.mp-=sk.qi;
  if(sk.cd)B.cds[sid]=sk.cd+1;
  let mult=sk.mult;
  if(sk.effect==='stars')mult=2+0.9*starCnt();
  if(B.dodge&&Math.random()<B.dodge){
    battleLog('【'+B.e.n+'】身形一晃，竟避开了你的攻势！','bad');
    enemyTurn();renderBattle();return;
  }
  let dmg;
  if(sk.effect==='stun'){dmg=Math.max(B.patk*mult*rnd(0.9,1.15),B.patk*0.2);} // 黑锅：无视防御
  else dmg=Math.max(B.patk*mult*rnd(0.9,1.15)-B.edef*0.55,B.patk*0.12);
  dmg=Math.floor(dmg);
  if(B.shield>0&&dmg>0){
    const ab=Math.min(B.shield,dmg);B.shield-=ab;dmg-=ab;
    battleLog('【'+B.e.n+'】灵光护盾碎裂，抵消 '+fmt(ab)+' 伤害。','bad');
  }
  B.ehp-=dmg;
  let extra='';
  if(sk.effect==='bleed'){B.bleedT=3;B.bleedDmg=Math.floor(B.patk*0.35);extra='，敌人血流不止';}
  if(sk.effect==='steal'){
    const heal=Math.floor(dmg*0.3);B.php=Math.min(B.pmax,B.php+heal);extra='，饮血回复 '+fmt(heal);
  }
  if(sk.effect==='stun'){B.stun=1;extra='，诸邪避退，敌人被震慑一回合';}
  if(S.wearing.weapon==='xueyin'){B.php=Math.min(B.pmax,B.php+Math.floor(dmg*0.1));}
  battleLog('你使出【'+sk.name+'】，造成 '+fmt(dmg)+' 伤害'+extra,sk.effect?'good':'');
  if(B.ehp<=0){winBattle();return;}
  enemyTurn();
  renderBattle();
}
function basicAttack(){useSkillChecked('bati');}
function useSkillChecked(sid){useSkill(sid);}
function enemyTurn(){
  if(!B||B.over)return;
  if(B.bleedT>0){
    B.ehp-=B.bleedDmg;B.bleedT--;
    battleLog('【'+B.e.n+'】血流不止，损失 '+fmt(B.bleedDmg)+'。','good');
    if(B.ehp<=0){winBattle();return;}
  }
  if(B.stun>0){
    B.stun--;battleLog('【'+B.e.n+'】被震慑，无法动弹。','good');
  }else{
    const dmg=Math.max(Math.floor(B.eatk*rnd(0.85,1.15)-B.pdef*0.55),Math.floor(B.eatk*0.1));
    B.php-=dmg;
    if(B.leech&&dmg>0)B.ehp=Math.min(B.emax,B.ehp+Math.floor(dmg*B.leech));
    battleLog('【'+B.e.n+'】扑击而来，你受到 '+fmt(dmg)+' 伤害。','bad');
    if(B.php<=0){
      const sp=(S.pills.huming||0)>0?'huming':bestPillOf('save');
      if(sp){
        S.pills[sp]--;
        const pct=(sp==='huming')?0.5:savePct(PILLS[sp]);
        B.php=Math.max(1,Math.floor(B.pmax*pct));
        battleLog('危急关头，'+PILLS[sp].n+'自行碎裂——宝光护体，你从鬼门关前走了回来！','good');
      }else{
        B.over=true;
        const lost=Math.floor(S.qi*0.1);
        S.qi=Math.max(0,S.qi-lost);
        battleLog('你身负重伤，拼死突围而走……损失 '+fmt(lost)+' 灵气。','bad');
        log('bad','历练【'+B.e.n+'】不敌，身负重伤逃回。');
      }
    }
  }
  for(const k in B.cds){if(B.cds[k]>0)B.cds[k]--;}
  B.mp=Math.min(B.mpmax,B.mp+8);
  B.turn++;
}
function winBattle(){
  if(!B)return;
  B.over=true;
  const ed=B.e;
  const z=ZONES.find(x=>x.id===B.zid);
  const dropMul=1+(starFx('drop')+gfFx('drop'))+(B.afx?0.4:0);
  const gainMul=1+starFx('gain')+gfFx('gain');
  const stones=Math.floor(30*Math.pow(1.55,ed.r)*ed.m*rnd(0.8,1.3)*(ed.boss?3:1)*dropMul*(B.tower?1.5:1));
  S.stones+=stones;
  let drops='灵石 x'+fmt(stones);
  if(ed.r>=2&&Math.random()<Math.min(0.95,0.55*dropMul)){S.mats.shouhe=(S.mats.shouhe||0)+1;drops+='，兽核 x1';}
  if(Math.random()<Math.min(0.95,0.35*dropMul)){
    const h=z?dropHerb(z):randHerbTier(Math.max(1,ed.r-1),Math.min(10,ed.r+1));
    S.herbs[h]=(S.herbs[h]||0)+1;drops+='，'+HERBS[h].n+' x1';
  }
  const qiGain=addQi(layerCost()*(0.05+0.02*ed.m)*(ed.boss?2.5:1)*gainMul,'battle');
  S.stat.kills=(S.stat.kills||0)+1;
  if(ed.boss)S.stat.bosses=(S.stat.bosses||0)+1;
  bumpDaily('kill',1);
  battleLog('【'+ed.n+'】轰然倒下！获得 '+drops+(qiGain>0?('，战意化灵，修为+'+fmt(qiGain)):'')+'。','good');
  log('good','斩杀【'+ed.n+'】！'+drops);
  if(B.zid==='tower'){
    const f=B.tower;
    if(f>(S.towerBest||0)){
      S.towerBest=f;
      log('story','九星塔第 '+f+' 层已克——塔身轰鸣，星光如雨洒落。');
      const g=GONGFAS.find(x=>x.floor===f);
      if(g&&!S.gf.own[g.id]){
        S.gf.own[g.id]=1;
        if(!S.gf.on)S.gf.on=g.id;
        log('story','塔心石台之上，一部功法悬光而立——你参悟得【'+g.name+'】！'+g.d);
        toast('习得功法【'+g.name+'】！','good');
      }
    }
  }else{
    const key=B.zid+':'+B.idx;
    S.kills[key]=(S.kills[key]||0)+1;
  }
  if(ed.final){
    S.flags.won=1;
    log('story','九天邪皇的分身在你拳下崩解成漫天星尘……手握乾坤，脚踏星辰——这一方天地，再无人敢小觑人族！');
    checkQuests();save();
    setTimeout(showVictory,600);
  }
  checkQuests();save();
}

function flee(){
  if(!B||B.over)return;
  if(Math.random()<0.6){
    battleLog('你脚下一转，脱出战团。','');
    B.over=true;setTimeout(()=>{B=null;renderAll();},400);
  }else{
    battleLog('逃跑失败！','bad');
    enemyTurn();renderBattle();
  }
}
function endBattleView(){
  B=null;renderAll();
}
function toggleAutoBattle(el){
  autoBattle=el.checked;
}
function autoStep(){
  if(!autoBattle||!B||B.over)return;
  let best=null,bestScore=-1;
  for(const sk of SKILLS){
    if(!skillOk(sk))continue;
    if((B.cds[sk.id]||0)>0)continue;
    if(sk.qi>B.mp)continue;
    const m=sk.effect==='stars'?(2+0.9*starCnt()):sk.mult;
    if(m>bestScore){bestScore=m;best=sk;}
  }
  if(best)useSkill(best.id);
}

/* ---------------- 采药 / 奇遇 ---------------- */
function explore(zid){
  const z=ZONES.find(x=>x.id===zid); if(!z||!zoneUnlocked(z))return;
  const cdUntil=S.expCd[zid]||0;
  if(Date.now()<cdUntil)return;
  if(!useAp(AP_EXPLORE,'采药'))return;
  S.expCd[zid]=Date.now()+3000;
  const h=dropHerb(z);
  const n=irnd(2,5);
  S.herbs[h]=(S.herbs[h]||0)+n;
  const st=Math.floor(15*Math.pow(1.55,z.enemies[0].r)*rnd(0.8,1.3)*(1+starFx('drop')+gfFx('drop')));
  S.stones+=st;
  const eq=addQi(layerCost()*0.02,'explore');
  S.stat.explores=(S.stat.explores||0)+1;
  bumpDaily('explore',1);
  log('good','在【'+z.name+'】采到 '+HERBS[h].n+' x'+n+'，顺手得了些灵石（'+fmt(st)+'）'+(eq>0?('，气机微动，修为 +'+fmt(eq)):'')+'。');
  if(Math.random()<0.14)doEvent(z);
  renderAll();save();
}
function doEvent(z){
  // 特殊奇遇（剧情道具）
  if(z.id==='heifeng'&&!S.flags.gumu&&(S.kills['heifeng:2']||0)>0){
    S.flags.gumu=1;S.equips.zhanxie=1;equipItem('zhanxie');
    log('story','林深处的古墓轰然洞开，一柄正气凛然的长刀悬浮棺上——【斩邪刀】认主！刀出，邪祟辟易。');
    toast('获得神兵【斩邪刀】！','good');checkQuests();return;
  }
  if(z.id==='wangu'&&!S.flags.siguo&&curR()>=4){
    S.flags.siguo=1;S.equips.heiguo=1;equipItem('heiguo');
    log('story','白骨堆中一口黑锅静卧，古朴无华，锅底星纹流转——【黑锅】到手！黑锅一出，诸邪避退。');
    toast('获得神秘法宝【黑锅】！','good');checkQuests();return;
  }
  if(!S.flags.chuyao&&curR()>=5){
    S.flags.chuyao=1;
    S.pills.xiusui=(S.pills.xiusui||0)+1;S.pills.juling=(S.pills.juling||0)+2;
    log('story','云梦泽畔，一袭青衣的少女遥遥一礼：“凤鸣大比之约，我可等着你。”——未婚妻楚瑶赠丹而去。');
    toast('楚瑶赠丹：洗髓丹x1、聚灵丹x2','good');return;
  }
  const roll=Math.random();
  if(roll<0.4){
    const er=z.enemies[0].r;
    toast('遭遇伏击！','bad');
    startBattle(z.id,irnd(0,1),true);
  }else if(roll<0.65){
    const st=Math.floor(layerCost()*0.6);
    S.stones+=st;
    log('good','【奇遇】你发现一处灵石矿脉，挖出灵石 '+fmt(st)+'！');
  }else if(roll<0.82){
    const pool=['huiqi','juling','pojing'];
    const got=pick(pool);
    S.pills[got]=(S.pills[got]||0)+1;
    log('good','【奇遇】荒庙残炉之下，你寻到前人遗留的一枚【'+PILLS[got].n+'】！');
  }else{
    const st=Math.floor(layerCost()*0.25);
    S.stones+=st;
    log('story','【家书】妹妹龙小玉来信：“哥，娘的病好多了，就是你也要平安。”你握紧拳头，修炼愈发刻苦（灵石+'+fmt(st)+'）。');
  }
}

/* ---------------- 九星秘藏：凝星丹与凝星十三重 ---------------- */
function starPillId(i,q){return 'star'+i+'_'+q;}
function findStarPill(i,q){ // 自所需品阶向上寻囊中星丹（高品可代低品）
  for(let k=q;k<STAR_PILL_Q.length;k++)if((S.pills[starPillId(i,k)]||0)>0)return k;
  return -1;
}
function rollStarQ(rank){ // 凝星丹品阶随机：丹道越高、紫阙星/丹心诀加持，越易出高品
  const b=starFx('craft')+gfFx('craft');
  const r=Math.random();
  if(r<0.004+0.0004*rank)return 5;   // 巨丹
  if(r<0.015+0.0012*rank)return 4;   // 神丹
  if(r<0.05+0.004*rank+b)return 3;   // 完美
  if(r<0.14+0.008*rank+b)return 2;   // 特品
  if(r<0.34+0.012*rank+b)return 1;   // 上品
  return 0;                          // 普通
}
function starFxTxt(st,lv){
  const mul=1+(lv-1)/(STAR_STAGES.length-1),v=st.fxV*mul;
  const L={qps:'修炼速度',cap:'每日修为上限',ap:'每日行动点',atk:'攻击',def:'防御与气血',drop:'掉落',craft:'炼丹成功率',gain:'战斗采药所得',all:'全属性'}[st.fx]||st.fx;
  if(st.fx==='ap')return L+' +'+Math.round(v);
  if(st.fx==='all')return L+' +'+Math.round(v*100)+'%、修炼速度 +'+Math.round(v*50)+'%';
  return L+' +'+Math.round(v*100)+'%';
}
function condenseStar(i){
  if(!S)return;
  const st=STARS[i]; if(!st)return;
  const lv=starLvOf(i);
  if(lv>=13){toast(st.name+'已凝至「星汉圆满」，大圆满之境');return;}
  if(lv===0&&i!==starCnt()){toast('需依序凝聚九星秘藏');return;}
  if(curR()<st.reqR){toast('境界不足：需 '+REALMS[st.reqR].name);return;}
  const nq=STAR_STAGE_Q[lv];
  const pq=findStarPill(i,nq);
  const pillN=(nq?STAR_PILL_Q[nq].s+'·':'')+st.name+'丹';
  if(pq<0){toast('凝星需一枚【'+pillN+'】——炼丹页以「'+st.name+'丹」丹方炼制（品阶随机，高品可代）');return;}
  const prog=(lv+1)/STAR_STAGES.length;
  const qiCost=Math.floor(layerCost()*st.qiMul*(lv?0.35*prog:1));
  const stCost=Math.floor(st.stones*(lv?0.25*prog:1));
  if(S.qi<qiCost){toast('灵气不足：需 '+fmt(qiCost));return;}
  if(S.stones<stCost){toast('灵石不足：需 '+fmt(stCost));return;}
  S.qi-=qiCost;S.stones-=stCost;
  S.pills[starPillId(i,pq)]--;
  S.starLv[i]=lv+1;
  if(lv===0){
    S.starsOpened.push(st.name);
    log('story','星丹入体，轰！！体内第'+CN_NUM[i+1]+'重禁制应声而开——【'+st.name+'】（'+st.alias+'）秘藏凝聚成功，凝星一重「'+STAR_STAGES[0]+'」成！九星之数又添其一。');
    toast('凝聚九星秘藏【'+st.name+'】！','good');
    if(starCnt()>=9){
      log('story','九星连珠，霸体觉醒！九大秘藏一气贯通，你已是真正意义上的——九星霸体！');
      toast('九星归位 · 霸体觉醒！','good');
    }
  }else{
    log('good','【'+st.name+'】凝星第 '+cnL(lv)+' 重「'+STAR_STAGES[lv]+'」成！神通愈盛：'+starFxTxt(st,lv+1));
    if(lv+1>=13){
      log('story','星汉圆满！【'+st.name+'】十三重凝星功成，星辉如瀑灌体——此星神通已然翻倍。');
      toast('凝星大圆满：'+st.name,'good');
    }
  }
  renderAll();save();
}

/* ---------------- 剧情 ---------------- */
const QUESTS=[
 {id:'awaken',name:'觉醒 · 丹帝记忆',desc:'是丹帝重生？是灵魂融合？三无少年的逆袭，从凤鸣城郊开始。',cond:()=>S.flags.intro?true:false,
  reward:()=>{S.stones+=500;S.pills.huiqi=(S.pills.huiqi||0)+3;log('good','觉醒馈赠：灵石 x500、回气丹 x3');}},
 {id:'ningxue',name:'三无少年',desc:'丹田已碎？那便修九星！先踏入凝血境，做一名真正的武者。',cond:()=>curR()>=1,
  reward:()=>{S.pills.juling=(S.pills.juling||0)+2;log('good','奖励：聚灵丹 x2');}},
 {id:'hunzhu',name:'混沌赠珠',desc:'凝血境后，一位自称「混沌」的神秘前辈将造访你的识海。',cond:()=>curR()>=1,
  reward:()=>{S.flags.pearl=1;
    log('story','识海之中，一位自称「混沌」的苍老神念悠悠睁眼：“小娃娃，老夫观你根骨奇特……这颗混沌珠，暂寄你处。珠内自成小世界，空间无边无际——可种灵植、植神树、养灵兽。”'+
    '（混沌珠已开启：修炼页可种丹药材料；神树荫下吐纳回复状态；若神树尽枯，状态回复将十分缓慢！）');
    toast('获得至宝【混沌珠】！','good');}},
 {id:'xiaoyu',name:'妹妹的药',desc:'为妹妹龙小玉筹措 1000 灵石药费（灵石足够时自动完成）。',cond:()=>S.stones>=1000,
  reward:()=>{S.stones-=1000;S.pills.xiusui=(S.pills.xiusui||0)+1;
    log('story','药钱送到了镇远侯府。小玉拉着你的袖子：“哥，你也要平安。”——龙小玉病情好转，你获得【洗髓丹】x1。');}},
 {id:'langwang',name:'剿灭黑风狼王',desc:'黑风林匪患不断，斩杀黑风狼王，还地方安宁。',cond:()=>(S.kills['heifeng:2']||0)>0,
  reward:()=>{S.stones+=800;S.pills.pojing=(S.pills.pojing||0)+2;log('good','奖励：灵石 x800、破境丹 x2。古墓的传说，就在黑风林深处……');}},
 {id:'gumu',name:'古墓惊魂',desc:'在黑风林采药探寻古墓（剿灭狼王后）。',cond:()=>S.flags.gumu?true:false,reward:()=>{}},
 {id:'zixue',name:'拜入紫血宗',desc:'修为抵达通脉境，紫血宗来使相邀。',cond:()=>curR()>=4,
  reward:()=>{S.flags.sect=1;S.equips.zixue=1;equipItem('zixue');
    log('story','紫血宗长老亲临：“我观你骨骼清奇，是万中无一的九星之姿！”——你拜入紫血宗，获【紫血战袍】，修炼速度+50%（血狱秘境开启）。');}},
 {id:'xuedao',name:'白骨将之刃',desc:'万骨原的白骨将手中，藏着一把魔刀。',cond:()=>(S.kills['wangu:2']||0)>0,
  reward:()=>{S.equips.xueyin=1;equipItem('xueyin');
    log('story','白骨将崩碎，魔刀出土——【血饮刀】认主！以血养刀，饮敌之血反哺己身。');}},
 {id:'siguo',name:'四国遗迹',desc:'在万骨原采药，探寻四国遗迹（通脉境后）。',cond:()=>S.flags.siguo?true:false,reward:()=>{}},
 {id:'dabi',name:'凤鸣大比',desc:'踏入先天之境，于凤鸣大比技压群雄。',cond:()=>curR()>=5,
  reward:()=>{S.pills.xiusui=(S.pills.xiusui||0)+3;
    log('story','凤鸣大比，你一拳镇压群雄，夺得魁首！看台上青衣少女嫣然一笑——未婚妻楚瑶，记住了你的名字。（洗髓丹 x3）');}},
 {id:'xuandan',name:'璇丹天劫',desc:'破仙台，凝神丹，渡过天劫（需破仙台凝神丹）。',cond:()=>curR()>=9,
  reward:()=>{S.pills.huming=(S.pills.huming||0)+2;log('good','天劫洗礼，璇丹成！奖励：护命丹 x2');}},
 {id:'mingxing',name:'命星涅槃',desc:'凝聚属于自己的命星，舍去过去，涅槃重生。',cond:()=>curR()>=10,
  reward:()=>{S.pills.juling=(S.pills.juling||0)+5;log('good','命星珠成，全属性+10%！奖励：聚灵丹 x5');}},
 {id:'elong',name:'恶龙域扬名',desc:'深入恶龙域，斩杀三首恶龙。',cond:()=>(S.kills['elong:2']||0)>0,
  reward:()=>{const st=Math.floor(layerCost()*15);S.stones+=st;S.herbs.longxue=(S.herbs.longxue||0)+10;
    log('good','三首恶龙授首，恶龙域为之震动！奖励：灵石 x'+fmt(st)+'、龙血草 x10');}},
 {id:'xiezu',name:'邪族入侵',desc:'击杀邪族裂隙的邪将，查明清剿人族的幕后黑手。',cond:()=>(S.kills['xiezu:2']||0)>0,
  reward:()=>{log('story','邪将临死狂笑：“九星传人……邪皇大人早已等你多时！”——星空古路的尽头，那道目光缓缓睁开。');}},
 {id:'final',name:'手握乾坤 · 脚踏星辰',desc:'踏上星空古路，击败九天邪皇之分身，镇世人族！',cond:()=>(S.kills['xingkong:2']||0)>0,reward:()=>{}},
];
function checkQuests(){
  if(!S)return;
  for(const q of QUESTS){
    if(S.quests[q.id])continue;
    if(q.cond()){
      S.quests[q.id]=1;
      log('story','【剧情完成 · '+q.name+'】');
      q.reward();
      toast('剧情完成：'+q.name,'good');
    }
  }
  checkAch();
}
function undoneQuests(){
  return QUESTS.filter(q=>!S.quests[q.id]).slice(0,3);
}

/* ---------------- 胜利 ---------------- */
function showVictory(){
  openModal('<h2>九星归位 · 天下无双</h2>'+
   '<p style="text-align:center" class="gold">手握乾坤，脚踏星辰。</p>'+
   '<p>九天邪皇的分身崩解成漫天星尘，邪族裂隙缓缓闭合。凤鸣帝国的城墙下，妹妹龙小玉与楚瑶遥遥望着星空古路的方向。</p>'+
   '<p>从被盗走灵根、灵血、灵骨的三无少年，到九星连珠的霸体强者——这条逆袭之路，你走完了。</p>'+
   '<p class="small muted" style="text-align:center">感谢游玩！可继续修行，冲击人皇境十三层圆满。</p>'+
   '<div style="text-align:center;margin-top:12px"><button class="btn" onclick="closeModal()">继续修行</button></div>');
}

/* ---------------- 混沌珠：灵植 / 神树 / 灵兽 ---------------- */
function seedReqR(t){return Math.max(0,(t-1)*2);} // 种子随境界进货
function plantHerb(hid){
  if(!S.flags.pearl){toast('尚未获得混沌珠');return;}
  const h=HERBS[hid]; if(!h)return;
  if(curR()<seedReqR(h.t)){toast('坊市尚未进货此等灵植种子：需 '+REALMS[seedReqR(h.t)].name);return;}
  const cost=seedCost(h.t);
  if(S.stones<cost){toast('种子费不足：需 '+fmt(cost)+' 灵石');return;}
  if(!useAp(AP_PLANT,'种植'))return;
  S.stones-=cost;
  S.pearl.plants.push({h:hid,d:S.day});
  log('good','你在混沌珠灵植园中种下【'+HERBS[hid].n+'】——混沌沃土，'+growDays(HERBS[hid].t)+' 日可熟。');
  renderAll();save();
}
function harvestPlant(i){
  const p=S.pearl.plants[i]; if(!p)return;
  if(S.day-p.d<growDays(HERBS[p.h].t)){toast('尚未成熟，急不得');return;}
  const y=harvestYield(HERBS[p.h].t);
  S.herbs[p.h]=(S.herbs[p.h]||0)+y;
  log('good','混沌珠中【'+HERBS[p.h].n+'】成熟，收获 x'+y+'！');
  S.pearl.plants.splice(i,1);
  renderAll();save();
}
function plantTree(){
  if(!S.flags.pearl){toast('尚未获得混沌珠');return;}
  if(S.pearl.trees.length>=TREE_MAX){toast('九株神树已满——暗合九星之数');return;}
  const cost=saplingCost(curR());
  if(S.stones<cost){toast('树苗费不足：需 '+fmt(cost)+' 灵石');return;}
  if(!useAp(AP_PLANT,'植树'))return;
  S.stones-=cost;
  S.pearl.trees.push({vigor:60,dead:0});
  log('good','你于混沌珠中植下一株【混沌神树】——自此吐纳有荫，状态日盛。');
  renderAll();save();
}
function waterTrees(){
  if(!S.flags.pearl){toast('尚未获得混沌珠');return;}
  const alive=S.pearl.trees.filter(t=>!t.dead);
  if(!alive.length){toast('没有存活的混沌神树可浇灌');return;}
  if(!useAp(AP_WATER,'浇灌'))return;
  for(const t of alive)t.vigor=Math.min(100,t.vigor+TREE_WATER);
  log('good','引灵泉浇灌神树，枝叶重新舒展（全体茂盛度 +'+TREE_WATER+'）。');
  renderAll();save();
}
function reviveTree(i){
  const t=S.pearl.trees[i]; if(!t||!t.dead)return;
  const cost=reviveCost(curR());
  if(S.stones<cost){toast('复苏费不足：需 '+fmt(cost)+' 灵石');return;}
  S.stones-=cost;
  t.dead=0;t.vigor=50;
  log('good','以混沌灵液灌注枯木——神树复苏，新芽重生！');
  renderAll();save();
}
function breatheTrees(){
  if(!S.flags.pearl){toast('尚未获得混沌珠');return;}
  const living=livingTrees();
  if(!living){toast('神树尽枯，无荫可纳——先植树或复苏枯木吧');return;}
  if(!useAp(AP_BREATHE,'树下吐纳'))return;
  const gain=5*living;
  S.cond=Math.min(100,S.cond+gain);
  log('good','神树荫下吐纳一日之余，身心舒泰：状态 +'+gain+'。');
  renderAll();save();
}
/* 灵兽购买 */
function buyBeast(bid){
  const b=BEASTS[bid]; if(!b)return;
  if(!S.flags.pearl){toast('尚未获得混沌珠');return;}
  const cost=b.cost(curR());
  if(S.stones<cost){toast('灵石不足：需 '+fmt(cost));return;}
  S.stones-=cost;
  S.pearl.beasts.push({t:bid});
  log('good','混沌珠灵兽栏迎来新成员——【'+b.n+'】！'+b.d);
  renderAll();save();
}

/* ---------------- 每日悬赏 ---------------- */
function rngFor(seed){
  let x=seed%2147483647; if(x<=0)x+=2147483646;
  return function(){x=(x*48271)%2147483647;return x/2147483647;};
}
function ensureDaily(){
  if(!S)return;
  if(S.daily&&S.daily.day===S.day&&S.daily.qs&&S.daily.qs.length&&S.daily.cnt)return;
  const r=rngFor(S.day*7919+curR()*104729+13);
  const idxs=[];
  while(idxs.length<3){
    const k=Math.floor(r()*DAILY_TYPES.length)%DAILY_TYPES.length;
    if(idxs.indexOf(k)<0)idxs.push(k);
  }
  S.daily={day:S.day,qs:idxs,
    prog:idxs.map(()=>0),done:idxs.map(()=>0),
    cnt:idxs.map(i=>dailyCount(DAILY_TYPES[i].k,curR())),
    rw:idxs.map(i=>dailyReward(DAILY_TYPES[i].k,curR()))};
}
function bumpDaily(k,n){
  if(!S||!S.daily||!S.daily.qs)return;
  ensureDaily();
  for(let i=0;i<S.daily.qs.length;i++){
    if(DAILY_TYPES[S.daily.qs[i]].k!==k||S.daily.done[i])continue;
    S.daily.prog[i]=Math.min(S.daily.cnt[i],S.daily.prog[i]+(n||1));
    if(S.daily.prog[i]>=S.daily.cnt[i]){
      S.daily.done[i]=1;
      const t=DAILY_TYPES[S.daily.qs[i]];
      const got=S.daily.rw[i];
      S.stones+=got;
      const qg=addQi(layerCost()*(0.10+0.02*curR()),'daily');
      const tt=Math.max(1,Math.min(10,curR()+1));
      const cands=Object.keys(PILLS).filter(pid=>PILLS[pid].m!==undefined&&PILLS[pid].t<=tt&&['qi','cond','ap','danxp','heal','qpsb'].indexOf(PILLS[pid].f)>=0);
      const gp=cands.length?cands[Math.floor(Math.random()*cands.length)]:null;
      if(gp)S.pills[gp]=(S.pills[gp]||0)+1;
      log('good','【悬赏完成 · '+t.n+'】灵石 +'+fmt(got)+'，修为 +'+fmt(qg)+(gp?('，获赏【'+PILLS[gp].n+'】x1'):''));
      toast('悬赏完成：'+t.n,'good');
    }
  }
}

/* ---------------- 九星塔 ---------------- */
function towerFloorEnemy(f){
  const r=Math.min(21,Math.floor((f-1)/5));
  const boss=f%TOWER_BOSS_EVERY===0?1:0;
  const seed=f*7+3;
  const name=ZN_MOD[seed%12]+ZN_BEAST[(seed*3)%17]+(boss?'王':'');
  return {n:name,r:r,m:TOWER_MUL*f*(boss?1.6:1),boss:boss,noAfx:1};
}
function startTower(){
  if(!useAp(AP_TOWER,'闯塔'))return;
  S.stat.towers=(S.stat.towers||0)+1;
  bumpDaily('tower',1);
  const f=(S.towerBest||0)+1;
  const ed=towerFloorEnemy(f);
  beginBattle('tower',-1,ed,f);
  battleLog('九星塔第 '+f+' 层——【'+ed.n+'】当道，登塔！','');
}

/* ---------------- 装备强化 / 灵兽升级 / 功法装备 ---------------- */
function upEqCost(){return Math.floor(2000*Math.pow(2.1,S.eqLv||0));}
function upgradeEq(){
  const lv=S.eqLv||0;
  if(lv>=10){toast('神兵淬炼已至 +10 圆满');return;}
  const cost=upEqCost();
  if(S.stones<cost){toast('淬炼费用不足：需 '+fmt(cost)+' 灵石');return;}
  S.stones-=cost;S.eqLv=lv+1;
  log('good','以星辉砂淬炼随身神兵——装备强化 '+(lv+1)+' 级（攻防气血 +'+(8*(lv+1))+'%）。');
  renderAll();save();
}
function feedBeast(i,hid){
  const b=S.pearl.beasts[i]; if(!b)return;
  const lv=b.lv||1;
  if(lv>=10){toast('此兽已臻十阶圆满');return;}
  const h=HERBS[hid];
  if(!h||((S.herbs[hid]||0)<5)){toast('需同种灵植 x5 喂养');return;}
  if(h.t<lv){toast('需 '+lv+' 品及以上灵植（'+h.n+' 仅 '+h.t+' 品）');return;}
  S.herbs[hid]-=5;b.lv=lv+1;
  log('good','【'+BEASTS[b.t].n+'】吞食灵植，灵性大涨——升至 '+(lv+1)+' 阶（产出 ×'+(1+0.3*lv).toFixed(1)+'）。');
  closeModal();renderAll();save();
}
function openFeedBeast(i){
  const b=S.pearl.beasts[i];if(!b)return;
  const lv=b.lv||1;
  const ids=Object.keys(S.herbs).filter(id=>(S.herbs[id]||0)>=5&&HERBS[id]&&HERBS[id].t>=lv)
    .sort((x,y)=>HERBS[x].t-HERBS[y].t);
  if(!ids.length){toast('没有可喂的灵植（需 '+lv+' 品及以上 x5）');return;}
  const opts=ids.map(id=>'<option value="'+id+'">'+HERBS[id].n+' x'+S.herbs[id]+'（'+HERBS[id].t+'品）</option>').join('');
  openModal('<h2>喂养 · '+BEASTS[b.t].n+'（'+lv+' 阶）</h2>'+
   '<p class="small">以 5 株 '+lv+' 品及以上灵植喂养，灵性增长一阶（至多十阶），产出每阶 ×1.3。</p>'+
   '<select class="fin" id="feedPick">'+opts+'</select>'+
   '<div style="margin-top:10px"><button class="btn jade" onclick="feedBeast('+i+',document.getElementById(\'feedPick\').value)">喂食（5 株）</button></div>');
}
function equipGf(gid){
  if(!S.gf.own[gid]){toast('尚未习得此功法');return;}
  S.gf.on=(S.gf.on===gid)?null:gid;
  const g=GONGFAS.find(x=>x.id===gid);
  toast(S.gf.on?('运功【'+g.name+'】'):'收功');
  renderAll();save();
}

/* ---------------- 成就 / 图鉴收录 ---------------- */
function achVal(a){
  switch(a.kind){
    case 'g':return S.g;
    case 'stars':return starCnt();
    case 'stage':{let m=0;for(const k in (S.starLv||{}))m=Math.max(m,S.starLv[k]);return m;}
    case 'tower':return S.towerBest||0;
    case 'bones':return S.bones;
    case 'danExp':return S.danExp;
    case 'days':return S.day;
    default:return S.stat[a.kind]||0;
  }
}
function checkAch(){
  if(!S)return;
  for(const id in S.herbs)if((S.herbs[id]||0)>0)S.seen.h[id]=1;
  for(const id in S.pills)if((S.pills[id]||0)>0)S.seen.p[id]=1;
  for(const a of ACHS){
    if(S.ach[a.id])continue;
    if(achVal(a)>=a.v){
      S.ach[a.id]=1;
      const txt=[];
      if(a.rw.stones){S.stones+=a.rw.stones;txt.push('灵石 +'+fmt(a.rw.stones));}
      if(a.rw.pill){S.pills[a.rw.pill]=(S.pills[a.rw.pill]||0)+1;txt.push(PILLS[a.rw.pill].n+' x1');}
      if(a.rw.ap){S.ap+=a.rw.ap;txt.push('行动点 +'+a.rw.ap);}
      log('good','【成就达成 · '+a.n+'】'+(txt.length?('奖励：'+txt.join('、')):''));
      toast('成就达成：'+a.n,'good');
    }
  }
}

/* ---------------- 日落而息：进入下一日 ---------------- */
function nextDay(){
  S.day++;
  S.ap=apMax(curR());
  S.qiToday=0;S.flags.qiCapped=0;
  // 神树衰减
  let withered=0;
  for(const t of S.pearl.trees){
    if(t.dead)continue;
    t.vigor-=TREE_DAILY_DECAY;
    if(t.vigor<=0){t.dead=1;t.vigor=0;withered++;}
  }
  // 状态回复（神树尽枯则缓慢）
  const rec=COND_SLOW+COND_PER_TREE*livingTrees();
  S.cond=Math.min(100,S.cond+rec);
  // 灵兽产出
  let outTxt=[];
  for(const bd of S.pearl.beasts){
    const b=BEASTS[bd.t]; if(!b)continue;
    const om=1+0.3*(((bd.lv||1))-1);
    if(b.out==='stones'){const g=Math.floor(b.qty(curR())*om);S.stones+=g;outTxt.push('灵石 x'+fmt(g));}
    else if(b.out==='lingcao'){const g=Math.floor(b.qty*om);S.herbs.lingcao=(S.herbs.lingcao||0)+g;outTxt.push('灵草 x'+g);}
    else if(b.out==='shouhe'){const g=Math.floor(b.qty*om);S.mats.shouhe=(S.mats.shouhe||0)+g;outTxt.push('兽核 x'+g);}
  }
  // 灵植生长提示
  const ready=S.pearl.plants.filter(p=>S.day-p.d>=growDays(HERBS[p.h].t)).length;
  log('story','【第 '+S.day+' 日】晨光入珠。神树荫下吐纳，状态 +'+rec+'（存活神树 '+livingTrees()+' 株）'+
    (withered?('，<span class="bad">'+withered+' 株神树因久未浇灌而枯萎！</span>'):'')+
    (outTxt.length?('　灵兽产出：'+outTxt.join('、')):'')+
    (ready?('　有 '+ready+' 株灵植已然成熟。'):''));
  if(S.cond<40)log('bad','状态萎靡——修炼缓慢、战力打折。多植神树、及早浇灌，方能日日精进。');
  ensureDaily();
  checkQuests();renderAll();save();
}

/* ---------------- 华云商行：出售 ---------------- */
function sellCore(qty){
  const have=S.mats.shouhe||0;
  qty=Math.min(qty,have); if(qty<=0)return;
  const price=corePrice(curR())*qty;
  S.mats.shouhe-=qty;S.stones+=price;
  S.stat.sells=(S.stat.sells||0)+1;bumpDaily('sell',1);
  toast('售出 兽核 x'+qty+'，得灵石 '+fmt(price));
  renderAll();save();
}
function sellPill(pid,qty){
  const have=S.pills[pid]||0;
  qty=Math.min(qty,have); if(qty<=0)return;
  const price=pillPrice(pid,curR())*qty;
  S.pills[pid]-=qty;S.stones+=price;
  S.stat.sells=(S.stat.sells||0)+1;bumpDaily('sell',1);
  toast('售出 '+PILLS[pid].n+' x'+qty+'，得灵石 '+fmt(price));
  renderAll();save();
}

/* ---------------- 渲染 ---------------- */
const TABS=[
 {id:'cult',n:'修炼'},
 {id:'hunt',n:'历练'},
 {id:'alchemy',n:'炼丹'},
 {id:'market',n:'商行'},
 {id:'pearl',n:'珠内'},
 {id:'bag',n:'行囊'},
 {id:'tower',n:'九星塔'},
 {id:'codex',n:'图鉴'},
 {id:'stars',n:'九星'},
 {id:'realms',n:'境界'},
];
function showTab(t){curTab=t;renderAll();}
function renderTabs(){
  $('tabs').innerHTML=TABS.map(t=>{
    const dot=(t.id==='hunt'&&(!B))||(t.id==='cult'&&S.qi>=layerCost())?'<span class="dot"></span>':'';
    return '<button class="'+(curTab===t.id?'on':'')+'" onclick="showTab(\''+t.id+'\')">'+t.n+dot+'</button>';
  }).join('');
}
function renderTop(){
  const st=heroStats();
  const cost=layerCost();
  const pct=clamp(S.qi/cost*100,0,100);
  const buff=[];
  if(Date.now()<S.buffs.julingUntil)buff.push('<span class="jade">聚灵丹 '+Math.ceil((S.buffs.julingUntil-Date.now())/1000)+'s</span>');
  const condCls=S.cond<40?'blood':(S.cond<75?'gold':'jade');
  $('topbar').innerHTML=
   '<div><div class="tb-name">龙尘</div>'+
   '<div class="tb-realm">'+realmTxt()+' <span class="tb-sub">· '+REALMS[curR()].tier+(REALMS[curR()].who?' · '+REALMS[curR()].who:'')+'</span></div>'+
   '<div class="tb-sub">第 '+S.day+' 日 ｜ 战力 '+fmt(st.atk*10+st.hp/10+(S.bones*50))+' ｜ 祭骨 '+S.bones+' 根 ｜ 九星 '+starCnt()+'/9 ｜ 丹修 '+DAN_RANKS[danRankIdx()]+'</div></div>'+
   '<div class="res">'+
   '<div class="it"><span>灵气'+(buff.length?' '+buff.join(' '):'')+'</span><b>'+fmt(S.qi)+'</b></div>'+
   '<div class="it"><span>灵石</span><b>'+fmt(S.stones)+'</b></div>'+
   '<div class="it"><span>修炼速度</span><b>'+fmt(qps())+'/秒</b></div>'+
   '<div class="it"><span>今日修为'+(qiLeft()<=0?'<span class="blood">满</span>':'')+'</span><b>'+fmt(S.qiToday)+' / '+fmt(qiCap())+'</b></div>'+
   '<div class="it"><span>今日行动点</span><b>'+S.ap+' / '+apMax(curR())+'</b></div>'+
   '<div class="it"><span>状态</span><b class="'+condCls+'">'+Math.round(S.cond)+'%</b></div>'+
   '<div class="it"><span>气血</span><b>'+fmt(st.hp)+'</b></div>'+
   '<div class="it"><span>攻击 / 防御</span><b>'+fmt(st.atk)+' / '+fmt(st.def)+'</b></div>'+
   '<button class="btn" onclick="nextDay()">日落而息 ▸ 第'+(S.day+1)+'日</button>'+
   '</div>'+
   (curTab==='cult'?'':'<div style="flex-basis:100%"><div class="bar"><i style="width:'+pct+'%"></i><span>下一层：'+fmt(S.qi)+' / '+fmt(cost)+'</span></div></div>');
}
function starWheelSvg(){
  const cx=150,cy=150,R=108;
  let cells='';
  for(let i=0;i<9;i++){
    const ang=-Math.PI/2+i*Math.PI*2/9;
    const x=cx+Math.cos(ang)*R,y=cy+Math.sin(ang)*R;
    const lit=i<starCnt();
    const st=STARS[i];
    const lock=curR()<st.reqR;
    cells+='<circle class="star-cell'+(lit?' lit':'')+'" cx="'+x+'" cy="'+y+'" r="20"/>'+
      '<text class="star-txt'+(lit?' lit':'')+'" x="'+x+'" y="'+(y+4)+'">'+st.name+'</text>';
  }
  const core=starCnt()>=9?'#f5d76e':(starCnt()>0?'#d4af37':'rgba(255,255,255,.15)');
  return '<svg id="starwheel" width="300" height="300" viewBox="0 0 300 300">'+
   '<circle cx="150" cy="150" r="60" fill="rgba(212,175,55,.06)" stroke="'+core+'" stroke-width="2"/>'+
   '<text class="star-txt'+(starCnt()>0?' lit':'')+'" x="150" y="146" style="font-size:20px">九星</text>'+
   '<text class="star-txt" x="150" y="168" style="font-size:12px">霸体诀</text>'+
   cells+'</svg>';
}
function renderCult(){
  const r=curR(),l=curL(),cost=layerCost();
  const can=S.qi>=cost;
  let breakBtnTxt='冲击 · '+REALMS[r].name+cnL(l+1)+'层';
  if(S.g>=MAXG())breakBtnTxt='已至圆满';
  else if(l===LAYER_CNT-1)breakBtnTxt='冲关 · 【'+REALMS[r+1].name+'】';
  let boneHtml='';
  if(r===3){
    const need=BONES_REQ[l];
    boneHtml='<div class="panel"><h3>锻骨 · 祭炼骨骼（拼资源之境）</h3>'+
     '<p class="small">以祭骨丹祭炼骨骼：每根骨骼永久 +5% 攻防气血。本层需累计祭炼 <b class="gold">'+need+'</b> 根，当前 <b class="jade">'+S.bones+'</b> 根。</p>'+
     '<p class="small muted">原著：四祭、八祭、十祭、十二祭、十六祭、全祭——唯有锻骨不靠天赋而靠财力。</p>'+
     '<div style="margin-top:8px"><button class="btn jade" onclick="refineBone()">祭骨冲关（消耗祭骨丹 x1）</button> '+
     '<span class="small muted">祭骨丹：'+(S.pills.jigu||0)+' 枚</span></div></div>';
  }
  const qs=undoneQuests();
  $('main').innerHTML=
   '<div class="grid2">'+
   '<div>'+
     '<div class="panel"><h3>打坐修炼</h3>'+
     '<p class="small">九星霸体诀不修丹田，而修九星。灵气每秒 +'+fmt(qps())+'（当前速度 '+S.speed+'x）</p>'+
     '<div class="bar" style="margin:8px 0"><i style="width:'+clamp(S.qi/cost*100,0,100)+'%"></i><span>'+fmt(S.qi)+' / '+fmt(cost)+'</span></div>'+
     '<div class="bar slim" style="margin:0 0 8px"><i style="width:'+clamp(S.qiToday/qiCap()*100,0,100)+'%"></i><span>今日修为 '+fmt(S.qiToday)+' / '+fmt(qiCap())+(qiLeft()<=0?'（已满，日落而息后恢复）':'')+'</span></div>'+
     '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+
       '<button class="btn big" onclick="meditate()">运转周天</button><span id="medGain" class="gold" style="opacity:0;transition:opacity .3s"></span>'+
     '</div>'+
     '<p class="small muted">点击可瞬间获得 8 秒的灵气；灵气满层后点击下方冲击。</p><hr class="hr">'+
     '<div style="display:flex;gap:16px;flex-wrap:wrap" class="small">'+
       '<label><input type="checkbox" '+(S.autobreak?'checked':'')+' onchange="toggleAuto(this)"> 自动冲击（有把握时）</label>'+
       '<label><input type="checkbox" '+(S.usePojing?'checked':'')+' onchange="togglePojing(this)"> 自动用破境丹</label>'+
       '<label>速度 <select onchange="setSpeed(+this.value)"><option value="1"'+(S.speed===1?' selected':'')+'>1x</option><option value="3"'+(S.speed===3?' selected':'')+'>3x</option><option value="10"'+(S.speed===10?' selected':'')+'>10x</option></select></label>'+
     '</div></div>'+
     '<div class="panel"><h3>日程 · 日落而息</h3>'+
     '<p class="small">第 '+S.day+' 日 ｜ 今日行动点：<b class="gold">'+S.ap+' / '+apMax(curR())+'</b>（出战2 · 采药1 · 炼丹1 · 种植1 · 浇灌1 · 祭骨1 · 吐纳1）</p>'+
     '<div class="bar" style="margin:6px 0"><i style="width:'+clamp(S.cond,0,100)+'%"></i><span>状态 '+Math.round(S.cond)+'% —— 影响修炼速度与战斗属性</span></div>'+
     '<p class="small muted">每日回复 +'+condRecoveryPerDay()+'（混沌神树 '+livingTrees()+' 株存活'+(S.pearl.trees.length?'':'，尚未植树')+'；神树尽枯仅 +'+COND_SLOW+'，回复缓慢）。</p>'+
     '<div style="margin-top:8px"><button class="btn big" onclick="nextDay()">日落而息 · 进入第 '+(S.day+1)+' 日</button></div>'+
     '<p class="small muted">入夜后：行动点回满、状态回复、灵植生长、神树需浇灌、灵兽产出。没事做了就早点休息。</p>'+
     '</div>'+
     '<div class="panel"><h3>境界冲击</h3>'+
     '<p class="small">'+REALMS[r].desc+'</p>'+
     (REALMS[r].trib?'<p class="small blood">⚠ 此境有天劫加身，基础成功率 '+Math.round(REALMS[r].trib*100)+'%（破仙台凝神丹/天劫）</p>':'')+
     '<div style="margin-top:8px"><button class="btn big'+(can?'':' ghost')+'" '+(S.g>=MAXG()?'disabled':'')+' onclick="tryBreak()">'+breakBtnTxt+'</button></div>'+
     '<p class="small muted">成功率约 '+Math.round(clamp(0.92-r*0.012-l*0.008+(S.usePojing&&(S.pills.pojing||0)>0?0.2:0),0.2,0.99)*100)+'%（失败损失五成当层灵气）</p>'+
     '</div>'+
     boneHtml+
   '</div>'+
   '<div>'+
     '<div class="panel"><h3>九星图</h3>'+starWheelSvg()+
     '<p class="small muted" style="text-align:center">已开启 '+starCnt()+' / 9 —— 每星皆有专属神通，详见「九星」页</p></div>'+
     dailyPanelHtml()+
     '<div class="panel"><h3>剧情 · 待办</h3>'+
     (qs.length?qs.map(q=>'<div class="row-item"><div class="info"><div class="nm">'+q.name+'</div><div class="small muted">'+q.desc+'</div></div></div>').join(''):'<p class="small muted">诸事已了。</p>')+
     '</div>'+
     '<div class="panel"><h3>见闻录</h3><div id="log">'+S.logs.map(logLine).join('')+'</div></div>'+
   '</div>'+
   '</div>';
  const box=$('log');if(box&&nearBottom(box))box.scrollTop=box.scrollHeight;
}
function battlePillBtns(){
  // 战斗丹药栏：回气系丹药按强弱取前 3（回气丹恒在首位）
  let btns='';
  if((S.pills.huiqi||0)>0)btns+='<button class="btn jade" '+(B.over?'disabled':'')+' onclick="usePill(\'huiqi\')">回气丹<div class="small">x'+S.pills.huiqi+'</div></button>';
  const heals=Object.keys(S.pills).filter(pid=>(S.pills[pid]||0)>0&&PILLS[pid]&&PILLS[pid].f==='heal')
    .sort((a,b)=>PILLS[b].t*PILLS[b].m-PILLS[a].t*PILLS[a].m).slice(0,3);
  for(const pid of heals){
    const p=PILLS[pid];
    btns+='<button class="btn jade" '+(B.over?'disabled':'')+' onclick="usePill(\''+pid+'\')">'+p.n+'<div class="small">回'+Math.round(Math.min(0.95,(0.40+0.06*p.t)*Math.min(p.m,2))*100)+'% · x'+S.pills[pid]+'</div></button>';
  }
  return btns;
}
function renderHunt(){
  let html='';
  if(B){
    const sk=SKILLS.filter(skillOk).map(s=>{
      const cd=B.cds[s.id]||0;
      return '<button class="btn'+(cd||B.mp<s.qi?' ghost':'')+'" '+(B.over?'disabled':'')+' onclick="useSkill(\''+s.id+'\')">'+s.name+
        '<div class="small">威 x'+(s.effect==='stars'?(2+0.9*starCnt()).toFixed(1):s.mult)+'　灵力 '+s.qi+(cd?('　冷'+cd):'')+'</div></button>';
    }).join('');
    html='<div class="panel"><h3>战斗 · '+B.e.n+(B.afx?' <span class="afx">'+B.afx.n+'</span>':'')+(B.tower?' <span class="afx">塔'+B.tower+'层</span>':'')+(B.e.boss?' <span class="boss-tag" style="color:var(--blood);font-size:12px;border:1px solid var(--blood);border-radius:4px;padding:0 4px">首领</span>':'')+'</h3>'+
     '<div class="fighter"><div class="nm"><span class="jade">龙尘</span><span>'+fmt(Math.max(0,B.php))+' / '+fmt(B.pmax)+'</span></div>'+
     '<div class="bar hp"><i style="width:'+clamp(B.php/B.pmax*100,0,100)+'%"></i><span>气血</span></div>'+
     '<div class="bar mp" style="margin-top:3px"><i style="width:'+clamp(B.mp/B.mpmax*100,0,100)+'%"></i><span>灵力 '+Math.floor(B.mp)+'</span></div></div>'+
     '<div class="fighter"><div class="nm"><span class="'+(B.e.boss?'blood':'')+'">'+B.e.n+'</span><span>'+fmt(Math.max(0,B.ehp))+' / '+fmt(B.emax)+'</span></div>'+
     '<div class="bar ehp"><i style="width:'+clamp(B.ehp/B.emax*100,0,100)+'%"></i><span>气血</span></div></div>'+
     '<div class="skills">'+sk+battlePillBtns()+
     '</div>'+
     '<div class="battlelog">'+B.log.map(l=>'<p class="'+l.c+'">'+l.x+'</p>').join('')+'</div>'+
     '<div style="margin-top:8px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">'+
       '<label class="small"><input type="checkbox" '+(autoBattle?'checked':'')+' onchange="toggleAutoBattle(this)"> 自动战斗</label>'+
       (B.over?'<button class="btn" onclick="endBattleView()">离开战斗</button>':'<button class="btn danger" onclick="flee()">逃跑</button>')+
     '</div></div>';
  }
  html+=renderZoneGroups();
  $('main').innerHTML=html;
  const bl=document.querySelector('.battlelog');
  if(bl&&nearBottom(bl))bl.scrollTop=bl.scrollHeight;
}
function zoneCard(z){
  const cd=S.expCd[z.id]||0;
  const cdLeft=Math.max(0,Math.ceil((cd-Date.now())/1000));
  const ht0=(z.ht&&z.ht[0])||1, ht1=(z.ht&&z.ht[1])||Math.max(2,curR()+2);
  const herbTxt=z.herbs&&z.herbs.length
    ?(z.herbs.map(h=>HERBS[h].n).join('、')+'，另有'+ht0+'–'+ht1+'品灵植')
    :('可得 '+ht0+'–'+ht1+' 品灵植');
  return '<div class="zone"><h4>'+z.name+'</h4><p class="small muted">'+z.d+'</p>'+
   z.enemies.map((e,i)=>{
     const killed=S.kills[z.id+':'+i]||0;
     return '<div class="enemy"><span>'+e.n+'<span class="tag">'+REALMS[e.r].name+'</span>'+(e.boss?'<span class="boss-tag">首领</span>':'')+(killed?'<span class="tag rank">斩'+killed+'</span>':'')+'</span>'+
      '<button class="btn" onclick="startBattle(\''+z.id+'\','+i+')">出战</button></div>';
   }).join('')+
   '<div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;gap:8px">'+
     '<span class="small muted">采药：'+herbTxt+'</span>'+
     '<button class="btn jade" '+(cdLeft>0?'disabled':'')+' onclick="explore(\''+z.id+'\')">'+(cdLeft>0?('采药 '+cdLeft+'s'):'采药 · 寻宝')+'</button>'+
   '</div></div>';
}
function renderZoneGroups(){
  // 地图按境界分组：当前境界展开，往昔地界折叠，远处地界另列
  let html='';
  for(let r=0;r<=curR();r++){
    const zs=ZONES.filter(z=>zoneUnlocked(z)&&z.reqR===r);
    if(!zs.length)continue;
    const cards=zs.map(zoneCard).join('');
    if(r===curR())html+=cards;
    else html+='<details class="zgrp"><summary>往昔地界 · '+REALMS[r].name+'（'+zs.length+' 处地图）</summary>'+cards+'</details>';
  }
  const locked=ZONESLIST().filter(z=>z.reqR>curR());
  if(locked.length){
    let inner='';
    for(let r=curR()+1;r<REALMS.length;r++){
      const zs=locked.filter(z=>z.reqR===r&&!z.sect);
      if(zs.length)inner+='<div class="small muted" style="margin:2px 0">'+REALMS[r].name+'：'+zs.map(z=>z.name).join('、')+'</div>';
    }
    const sect=locked.filter(z=>z.sect);
    if(sect.length)inner+='<div class="small muted" style="margin:2px 0">紫血宗属地（拜入宗门后开启）：'+sect.map(z=>z.name).join('、')+'</div>';
    html+='<details class="zgrp"><summary>远处地界 · 尚未踏足（'+locked.length+' 处，随修为解锁）</summary>'+inner+'</details>';
  }
  return html;
}
function ZONESLIST(){return ZONES.filter(z=>!zoneUnlocked(z));}
function renderBattle(){ if(curTab==='hunt')renderHunt(); }
let alchTier=0,alchQ='',alchOnly=1,alchN=40;
let bagTier=0,bagAttr=-1,bagQ='',bagN=60;
let pearlTier=1;
function matsTxt(rc){
  if(rc.mats)return Object.keys(rc.mats).map(m=>{
    const need=rc.mats[m];
    const have=(m==='shouhe'?(S.mats.shouhe||0):(S.herbs[m]||0));
    return (HERBS[m]?HERBS[m].n:MATS[m].n)+' <span class="'+(have>=need?'jade':'blood')+'">'+have+'/'+need+'</span>';
  }).join('，');
  return (rc.matsGE||[]).map(sp=>{
    const have=herbsGE(sp.t);
    return sp.n+' 株'+sp.t+'品<span class="'+(have>=sp.n?'jade':'blood')+'">（有'+have+'）</span>';
  }).join('，')+(rc.shouhe?('，兽核 <span class="'+((S.mats.shouhe||0)>=rc.shouhe?'jade':'blood')+'">'+(S.mats.shouhe||0)+'/'+rc.shouhe+'</span>'):'');
}
function renderAlchList(){
  const rank=danRankIdx();
  let list=RECIPES.filter(rc=>{
    const out=PILLS[rc.out]; if(!out)return false;
    if(alchTier&&out.t!==alchTier)return false;
    if(alchQ&&out.n.indexOf(alchQ)<0)return false;
    if(alchOnly&&!recipeUnlocked(rc))return false;
    return true;
  });
  list.sort((a,b)=>(recipeUnlocked(b)-recipeUnlocked(a))||((a.reqR||0)-(b.reqR||0))||(a.rank-b.rank));
  const total=list.length;
  list=list.slice(0,alchN);
  const rows=list.map(rc=>{
    const out=PILLS[rc.out];
    const ok=recipeUnlocked(rc);
    const tags='<span class="tag rank">'+DAN_RANKS[rc.rank]+'</span>'+
      (out.t?'<span class="tag">'+out.t+'品</span>':'')+
      ((rc.reqR||0)>0?'<span class="tag">'+REALMS[rc.reqR].name+'</span>':'')+
      (ok?'':'<span class="tag no">未参悟</span>');
    return '<div class="row-item"><div class="info"><div class="nm">'+out.n+tags+'</div>'+
     '<div class="small muted">'+out.d+'</div><div class="small">材料：'+matsTxt(rc)+'</div></div>'+
     '<button class="btn" '+(ok?'':'disabled')+' onclick="craft(\''+rc.id+'\')">炼制</button></div>';
  }).join('');
  const box=document.getElementById('alchList');
  if(!box)return;
  box.innerHTML='<p class="small muted">共 '+total+' 张丹方符合筛选'+(total>alchN?('，显示前 '+alchN+' 张'):'')+'</p>'+rows+
   (total>alchN?'<div style="text-align:center;margin:8px"><button class="btn ghost" onclick="alchN+=60;renderAlchList()">显示更多</button></div>':'');
}
function renderAlchemy(){
  const rank=danRankIdx();
  const next=DAN_EXP[rank+1];
  const tierOpts=[0,1,2,3,4,5,6,7,8,9,10].map(t=>'<option value="'+t+'"'+(alchTier===t?' selected':'')+'>'+(t?('限 '+t+' 品'):'不限品阶')+'</option>').join('');
  $('main').innerHTML='<div class="grid2"><div>'+
   '<div class="panel"><h3>丹修 · '+DAN_RANKS[rank]+'</h3>'+
   '<p class="small">丹帝记忆觉醒，炼丹神术信手拈来。丹修位阶：丹童 → 丹徒 → 丹士 → 丹师 → 丹王 → 丹皇 → 丹宗 → 丹尊 → 丹圣 → 丹帝。共 '+RECIPES.length+' 张丹方，随「丹修位阶 + 修为境界」双重参悟解锁。</p>'+
   '<div class="bar" style="margin:8px 0"><i style="width:'+(next?clamp(S.danExp/next*100,0,100):100)+'%"></i><span>阅历 '+fmt(S.danExp)+(next?' / '+fmt(next):'（圆满）')+'</span></div>'+
   '<p class="small muted">位阶越高，炼丹成功率越高（+7%/阶）。新式丹方按「品阶」取药：库存千种灵植皆可入药，从低品阶开始消耗。</p></div>'+
   '<div class="panel"><h3>丹方库</h3>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">'+
    '<select class="fin" onchange="alchTier=+this.value;alchN=40;renderAlchList()">'+tierOpts+'</select>'+
    '<input class="fin" placeholder="搜丹名…" onchange="alchQ=this.value.trim();alchN=40;renderAlchList()" oninput="if(event.isComposing)return;alchQ=this.value.trim();renderAlchList()">'+
    '<label class="small"><input type="checkbox" '+(alchOnly?'checked':'')+' onchange="alchOnly=this.checked?1:0;alchN=40;renderAlchList()"> 只看已参悟</label>'+
   '</div><div id="alchList"></div></div>'+
   '</div><div>'+
   '<div class="panel"><h3>丹药仓库</h3><div id="pillStore"></div></div>'+
   '<p class="small muted">※ 祭骨丹、回气丹等耗材可在「商行」页采购；多余的丹药、药材可在商行卖出换灵石。</p>'+
   '</div></div>';
  renderAlchList();renderPillStore();
}
function renderPillStore(){
  const USABLE={qpsb:1,cond:1,qi:1,danxp:1,ap:1,perm:1,hp:1,atk:1,def:1};
  const owned=Object.keys(S.pills).filter(pid=>(S.pills[pid]||0)>0&&PILLS[pid])
    .sort((a,b)=>((PILLS[b].t||0)-(PILLS[a].t||0)));
  const box=document.getElementById('pillStore');
  if(!box)return;
  if(!owned.length){box.innerHTML='<p class="small muted">囊中无丹。先去采药、种药，再来开炉。</p>';return;}
  box.innerHTML=owned.map(pid=>{
    const p=PILLS[pid],n=S.pills[pid];
    const usable=USABLE[p.f]||pid==='xiusui'||pid==='juling';
    return '<div class="row-item"><div class="info"><div class="nm">'+p.n+' x'+n+(p.t?'<span class="tag">'+p.t+'品</span>':'')+'</div><div class="small muted">'+p.d+'</div></div>'+
     (usable?'<button class="btn jade" onclick="usePill(\''+pid+'\')">服用</button>':'')+'</div>';
  }).join('');
}
/* ---------------- 华云商行 ---------------- */
/* ---------------- 华云商行 ---------------- */
function renderMarket(){
  const r=curR();
  const pillsOwned=Object.keys(PILLS).filter(p=>(S.pills[p]||0)>0);
  const shopItems=[
    {k:'lingcao10',n:'灵草 x10',d:'最常见的炼丹辅材',cost:Math.floor(60*Math.pow(1.55,r))},
    {k:'shouhe',n:'兽核 x1',d:'炼丹材料，妖兽体内凝结',cost:Math.floor(50*Math.pow(1.55,r))},
    {k:'jigu',n:'祭骨丹 x1',d:'锻骨境硬通货——此境拼的就是财力',cost:Math.floor(120*Math.pow(1.5,r))},
    {k:'huiqi',n:'回气丹 x1',d:'战斗中恢复六成气血',cost:Math.floor(100*Math.pow(1.55,r))},
    {k:'julingzhui',n:'聚灵坠',d:'修炼速度+35%（'+(S.equips.julingzhui?'已购':'仅此一件')+'）',cost:20000,dis:S.equips.julingzhui},
  ];
  const tierRows=[1,2,3,4,5,6,7,8,9,10].map(t=>{
    let n=0;
    for(const id in S.herbs){const h=HERBS[id];if(h&&h.t===t)n+=S.herbs[id]||0;}
    if(!n)return '';
    return '<div class="row-item"><div class="info"><div class="nm">'+t+' 品灵植 x'+n+'</div><div class="small muted">收购价 '+fmt(herbPrice(t))+' 灵石/株 · 共值 '+fmt(herbPrice(t)*n)+'</div></div>'+
     '<span><button class="btn ghost" onclick="sellHerbsTier('+t+',10)">留10株</button> '+
     '<button class="btn" onclick="sellHerbsTier('+t+',0)">全售</button></span></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2"><div>'+
   '<div class="panel"><h3>华云商行 · 采购</h3>'+
   '<p class="small muted">华云商行，货通东荒。掌柜的满面堆笑：“客官里边请——今儿什么都有。”</p>'+
   shopItems.map(it=>'<div class="row-item"><div class="info"><div class="nm">'+it.n+'</div><div class="small muted">'+it.d+'</div></div>'+
     '<button class="btn" '+(it.dis?'disabled':'')+' onclick="buy(\''+it.k+'\')">'+fmt(it.cost)+' 灵石</button></div>').join('')+
   '</div></div><div>'+
   '<div class="panel"><h3>华云商行 · 出售</h3>'+
   '<p class="small muted">行商不问来路，收尽天下奇珍——千种灵植按品阶整批收购。神兵法宝认主，恕不收购。</p>'+
   (tierRows||'<p class="small muted">囊中无药材。</p>')+
   ((S.mats.shouhe||0)>0?'<div class="row-item"><div class="info"><div class="nm">兽核 x'+S.mats.shouhe+'</div><div class="small muted">收购价 '+fmt(corePrice(r))+' 灵石/枚</div></div>'+
     '<span><button class="btn ghost" onclick="sellCore(1)">售1</button> <button class="btn" onclick="sellCore('+S.mats.shouhe+')">全售</button></span></div>':'')+
   (pillsOwned.length?pillsOwned.map(pid=>
     '<div class="row-item"><div class="info"><div class="nm">'+PILLS[pid].n+' x'+S.pills[pid]+'</div><div class="small muted">收购价 '+fmt(pillPrice(pid,r))+' 灵石/枚</div></div>'+
     '<button class="btn ghost" onclick="sellPill(\''+pid+'\',1)">售1</button></div>').join(''):'')+
   '</div></div></div>';
}
/* ---------------- 混沌珠 ---------------- */
function renderPearlSeeds(){
  const r=curR();
  const tMax=Math.min(10,Math.floor(r/2)+1);
  if(pearlTier>tMax)pearlTier=tMax;
  const sel=document.getElementById('seedTier');
  const box=document.getElementById('seedList');
  if(!box)return;
  const t=pearlTier;
  const locked=curR()<seedReqR(t);
  const arr=HERBS_BY_TIER[t];
  const opts=arr.map(id=>'<option value="'+id+'">'+HERBS[id].n+(herbAttrsMatch(HERBS[id])?' ★':'')+'</option>').join('');
  box.innerHTML=(locked?'<p class="small blood">坊市尚未进货 '+t+' 品种子：需 '+REALMS[seedReqR(t)].name+'</p>':'')+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:4px 0">'+
   '<select class="fin" id="seedPick">'+opts+'</select>'+
   '<button class="btn" '+(locked?'disabled':'')+' onclick="plantHerb(document.getElementById(\'seedPick\').value)">种下（'+fmt(seedCost(t))+' 灵石 + 1 行动点）</button></div>'+
   '<p class="small muted">'+t+' 品：'+growDays(t)+' 日成熟 · 收 '+harvestYield(t)+' 株 · 商行收购 '+fmt(herbPrice(t))+' 灵石/株。带 ★ 者与你神火同属性，服食加成 1.5 倍。</p>';
  if(sel)sel.value=t;
}
function renderPearlTierSel(){
  const r=curR();
  const tMax=Math.min(10,Math.floor(r/2)+1);
  const sel=document.getElementById('seedTier');
  if(!sel)return;
  sel.innerHTML=[1,2,3,4,5,6,7,8,9,10].map(t=>'<option value="'+t+'"'+(t===pearlTier?' selected':'')+'>'+t+' 品种子'+(t>tMax?'（需 '+REALMS[seedReqR(t)].name+'）':'')+'</option>').join('');
}
function pearlSetTier(v){pearlTier=+v;renderPearlSeeds();renderPearlTierSel();}
function renderPearl(){
  if(!S.flags.pearl){
    $('main').innerHTML='<div class="panel" style="text-align:center;padding:50px 20px">'+
     '<h3>混沌珠 · 未得</h3><p class="small muted">传闻凝血之后，有自称「混沌」的神秘前辈会造访有缘人的识海……</p></div>';
    return;
  }
  const r=curR();
  const growing=S.pearl.plants.map((p,i)=>{
    const t=HERBS[p.h].t,left=Math.max(0,growDays(t)-(S.day-p.d));
    return '<div class="row-item"><div class="info"><div class="nm">🌱 '+HERBS[p.h].n+'</div>'+
     '<div class="small muted">'+(left>0?('还需 '+left+' 日成熟'):'<span class="jade">已成熟，待收获</span>')+'</div></div>'+
     (left>0?'<span class="small muted">第'+p.d+'日种</span>':'<button class="btn jade" onclick="harvestPlant('+i+')">收获 +'+harvestYield(t)+'</button>')+'</div>';
  }).join('');
  const tierSel='<select class="fin" id="seedTier" onchange="pearlSetTier(this.value)"></select>';
  const trees=S.pearl.trees.map((t,i)=>{
    if(t.dead)return '<div class="row-item"><div class="info"><div class="nm blood">🥀 枯萎的神树</div>'+
     '<div class="small muted">不再荫庇修行；复苏需 '+fmt(reviveCost(r))+' 灵石</div></div>'+
     '<button class="btn" onclick="reviveTree('+i+')">复苏</button></div>';
    const cls=t.vigor<40?'blood':(t.vigor<70?'gold':'jade');
    return '<div class="row-item"><div class="info"><div class="nm">🌳 混沌神树</div>'+
     '<div class="bar" style="height:10px;margin-top:3px"><i style="width:'+t.vigor+'%"></i><span style="line-height:10px;font-size:10px">茂盛 '+t.vigor+'</span></div></div>'+
     '<span class="small '+cls+'">每日 -'+TREE_DAILY_DECAY+'</span></div>';
  }).join('');
  const beasts=S.pearl.beasts.map((b,i)=>{
    const d=BEASTS[b.t]; if(!d)return '';
    const lv=b.lv||1,om=1+0.3*(lv-1);
    const out=d.out==='stones'?('灵石 x'+fmt(Math.floor(d.qty(r)*om))):(d.out==='lingcao'?('灵草 x'+Math.floor(d.qty*om)):('兽核 x'+Math.floor(d.qty*om)));
    return '<div class="row-item"><div class="info"><div class="nm">🐾 '+d.n+' <span class="tag">'+lv+'阶</span></div><div class="small muted">每日产出：'+out+'（每阶 ×1.3）</div></div>'+
     '<button class="btn ghost" onclick="openFeedBeast('+i+')">喂养</button></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2"><div>'+
   '<div class="panel"><h3>混沌珠 · 混沌小世界</h3>'+
   '<p class="small">混沌前辈所赠至宝，内藏一方小世界，<b class="gold">空间无边无际</b>：千种灵植随你种，神树灵兽随你养。</p>'+
   '<hr class="hr"><div class="small">现状：灵植 '+S.pearl.plants.length+' 株 ｜ 神树 '+livingTrees()+'/'+S.pearl.trees.length+' 株存活 ｜ 灵兽 '+S.pearl.beasts.length+' 只</div>'+
   '<div class="small muted">每日状态回复：+'+condRecoveryPerDay()+'（神树尽枯时仅 +'+COND_SLOW+'，回复缓慢）</div></div>'+
   '<div class="panel"><h3>灵植园（千种灵植）</h3>'+
   '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">种子品阶：'+tierSel+'</div>'+
   '<div id="seedList"></div>'+
   (S.pearl.plants.length?('<hr class="hr">'+growing):'<p class="small muted">园中空空——种下第一株吧。</p>')+
   '</div></div><div>'+
   '<div class="panel"><h3>混沌神树（回复状态）</h3>'+
   '<p class="small muted">每株存活神树：每日状态回复 +'+COND_PER_TREE+'；树下吐纳（1 行动点）可额外回复。神树每日茂盛度 -'+TREE_DAILY_DECAY+'，记得浇灌——枯萎则无荫可纳。</p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:6px 0">'+
     '<button class="btn" onclick="plantTree()">植树（'+fmt(saplingCost(r))+' 灵石 + 1 行动点）</button>'+
     '<button class="btn jade" onclick="waterTrees()">浇灌全部（1 行动点，茂盛 +'+TREE_WATER+'）</button>'+
     '<button class="btn jade" onclick="breatheTrees()">树下吐纳（1 行动点，状态 +'+5*livingTrees()+'）</button>'+
   '</div>'+
   (trees||'<p class="small muted">尚无神树——植下第一株吧。</p>')+
   '</div>'+
   '<div class="panel"><h3>灵兽栏（无限空间）</h3>'+
   Object.keys(BEASTS).map(bid=>{
     const b=BEASTS[bid];
     return '<div class="row-item"><div class="info"><div class="nm">'+b.n+'</div><div class="small muted">'+b.d+'</div></div>'+
      '<button class="btn" onclick="buyBeast(\''+bid+'\')">'+fmt(b.cost(r))+' 灵石</button></div>';
   }).join('')+
   (beasts?('<hr class="hr">'+beasts):'<p class="small muted">栏中空空。</p>')+
   '</div></div></div>';
  renderPearlTierSel();renderPearlSeeds();
}
function renderBag(){
  const eqs=Object.keys(EQ).filter(e=>S.equips[e]);
  const tierOpts=[0,1,2,3,4,5,6,7,8,9,10].map(t=>'<option value="'+t+'"'+(bagTier===t?' selected':'')+'>'+(t?('限 '+t+' 品'):'不限品阶')+'</option>').join('');
  const attrOpts=[-1,0,1,2,3,4,5,6,7,8,9].map(a=>'<option value="'+a+'"'+(bagAttr===a?' selected':'')+'>'+((a<0)?'不限属性':HERB_ATTRS[a]+'系')+'</option>').join('');
  $('main').innerHTML='<div class="grid2"><div>'+
   '<div class="panel"><h3>装备</h3>'+
   (eqs.length?eqs.map(eid=>{
     const e=EQ[eid];
     const on=S.wearing[e.slot]===eid;
     return '<div class="row-item"><div class="info"><div class="nm">'+e.n+'<span class="tag">'+({weapon:'兵器',armor:'护甲',treasure:'法宝',acc:'饰物'})[e.slot]+'</span></div>'+
      '<div class="small muted">'+e.d+'</div></div>'+
      (on?'<span class="jade small">穿戴中</span>':'<button class="btn" onclick="equipItem(\''+eid+'\')">穿戴</button>')+'</div>';
   }).join(''):'<p class="small muted">身无长物——去历练寻宝吧。</p>')+
   '<div style="margin-top:8px"><button class="btn jade" onclick="upgradeEq()">淬炼全身（+'+(S.eqLv||0)+' → +'+Math.min(10,(S.eqLv||0)+1)+'，'+fmt(upEqCost())+' 灵石）</button>'+
   '<span class="small muted">　每级攻防气血 +8%，至多 +10</span></div>'+
   '<hr class="hr"><div class="small muted">已穿戴：'+
     (['weapon','armor','treasure','acc'].map(s=>S.wearing[s]?EQ[S.wearing[s]].n:'——').join(' ｜ '))+'</div>'+
   '<hr class="hr"><div class="small">兽核 x'+(S.mats.shouhe||0)+'<span class="muted">（炼丹材料）</span></div></div>'+
   '</div><div>'+
   '<div class="panel"><h3>药材库（千种灵植）</h3>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px">'+
    '<select class="fin" onchange="bagTier=+this.value;bagN=60;renderBagList()">'+tierOpts+'</select>'+
    '<select class="fin" onchange="bagAttr=+this.value;bagN=60;renderBagList()">'+attrOpts+'</select>'+
    '<input class="fin" placeholder="搜药材名…" onchange="bagQ=this.value.trim();bagN=60;renderBagList()">'+
   '</div><div id="bagList"></div></div>'+
   '</div></div>';
  renderBagList();
}
function renderBagList(){
  let ids=Object.keys(S.herbs).filter(id=>(S.herbs[id]||0)>0&&HERBS[id]);
  if(bagTier)ids=ids.filter(id=>HERBS[id].t===bagTier);
  if(bagAttr>=0)ids=ids.filter(id=>HERBS[id].a===bagAttr);
  if(bagQ)ids=ids.filter(id=>HERBS[id].n.indexOf(bagQ)>=0);
  ids.sort((a,b)=>HERBS[a].t-HERBS[b].t||HERBS[a].n.localeCompare(HERBS[b].n,'zh'));
  const total=ids.length;
  ids=ids.slice(0,bagN);
  const box=document.getElementById('bagList');
  if(!box)return;
  box.innerHTML='<p class="small muted">共 '+total+' 种持有</p>'+
   (ids.map(id=>{
     const h=HERBS[id];
     const star=herbAttrsMatch(h)?' ★':'';
     return '<div class="row-item"><div class="info"><div class="nm">'+h.n+star+' x'+S.herbs[id]+'<span class="tag">'+h.t+'品</span><span class="tag">'+HERB_ATTRS[h.a]+'系</span></div>'+
      '<div class="small muted">服食得灵气与状态；商行收购 '+fmt(herbPrice(h.t))+' 灵石/株</div></div>'+
      '<span><button class="btn jade" onclick="eatHerb(\''+id+'\')">服食(1行动)</button> '+
      '<button class="btn ghost" onclick="sellHerb(\''+id+'\',10)">售10</button></span></div>';
   }).join('')||'<p class="small muted">囊中空空。</p>')+
   (total>bagN?'<div style="text-align:center;margin:8px"><button class="btn ghost" onclick="bagN+=60;renderBagList()">显示更多</button></div>':'');
}
function renderStars(){
  const stageRows=STAR_STAGES.map((nm,k)=>{
    const q=STAR_STAGE_Q[k],Q=STAR_PILL_Q[q];
    return '<div class="row-item"><div class="info"><div class="nm">第 '+cnL(k)+' 重 · '+nm+'</div>'+
     '<div class="small muted">凝星所需：'+(q?Q.s+'·':'')+'【星丹】（品阶随重递升）</div></div></div>';
  }).join('');
  const rows=STARS.map((st,i)=>{
    const lv=starLvOf(i),full=lv>=13,opened=lv>0,isNext=i===starCnt();
    const nq=full?0:STAR_STAGE_Q[lv];
    const pillN=(nq?STAR_PILL_Q[nq].s+'·':'')+st.name+'丹';
    const pq=full?-1:findStarPill(i,nq);
    const qiCost=full?0:Math.floor(layerCost()*st.qiMul*(lv?0.35*(lv+1)/STAR_STAGES.length:1));
    const stCost=full?0:Math.floor(st.stones*(lv?0.25*(lv+1)/STAR_STAGES.length:1));
    const realmOk=curR()>=st.reqR,orderOk=lv>0||isNext;
    const can=!full&&realmOk&&orderOk&&pq>=0&&S.qi>=qiCost&&S.stones>=stCost;
    const pillTag=pq>=0?'<span class="tag">囊中 x'+(S.pills[starPillId(i,pq)]||0)+'</span>':'<span class="tag no">缺丹</span>';
    return '<div class="row-item"><div class="info"><div class="nm">'+st.name+' · '+st.alias+
     (full?'<span class="tag rank">大圆满</span>':(opened?'<span class="tag rank">第 '+cnL(lv)+' 重·'+STAR_STAGES[lv]+'</span>':(isNext?'<span class="tag">下一星</span>':'<span class="tag no">待前置</span>')))+
     '</div>'+
     '<div class="small muted">'+(st.d||'')+'</div>'+
     (opened?'<div class="small">神通当前：<b class="gold">'+starFxTxt(st,lv)+'</b>'+(full?'':'（圆满可翻倍）')+'</div>':'')+
     (full?'<div class="small muted">十三重凝星功成，星汉长明。</div>':
       '<div class="small muted">凝星所需：【'+pillN+'】'+pillTag+' ｜ 灵气 '+fmt(qiCost)+' ｜ 灵石 '+fmt(stCost)+'</div>'+condstarHint(st,realmOk))+
     '</div>'+
     (full?'<span class="jade small">✦</span>':
       ((realmOk&&orderOk)?'<button class="btn" '+(can?'':'disabled')+' onclick="condenseStar('+i+')">'+(opened?'凝星进阶':'凝聚星窍')+'</button>':'<span class="small muted">待前置</span>'))+
     '</div>';
  }).join('');
  $('main').innerHTML='<div class="grid2"><div class="panel" style="text-align:center">'+
   '<h3>九星秘藏 · 凝星</h3>'+starWheelSvg()+
   '<p class="small muted">九星皆需以专属「星丹」凝聚：炼丹页参悟九张凝星丹方，丹成品阶随机<br>（普通/上品/特品/完美/神丹/巨丹）——丹道越高，紫阙星与丹心诀加持，越易出高品。</p>'+
   '<hr class="hr"><h3 class="small">凝星十三重</h3>'+stageRows+'</div>'+
   '<div class="panel"><h3>凝星之路</h3>'+rows+
   '<hr class="hr"><p class="small">每星凝至十三重「星汉圆满」，该星神通翻倍。九星归位：霸体觉醒。</p>'+
   '</div></div>';
}
function condstarHint(st,realmOk){
  if(!realmOk)return '<div class="small muted">需 '+REALMS[st.reqR].name+'</div>';
  return '<div class="small muted">丹方「'+st.name+'丹」：炼丹页参悟炼制</div>';
}
/* ---------------- 每日悬赏面板 / 九星塔页 / 图鉴页 ---------------- */
function dailyPanelHtml(){
  ensureDaily();
  const D=S.daily;
  const rows=D.qs.map((qi,i)=>{
    const t=DAILY_TYPES[qi],p=D.prog[i],n=D.cnt[i];
    return '<div class="row-item"><div class="info"><div class="nm">'+t.n+' <span class="small muted">'+t.txt(n)+'</span></div>'+
     '<div class="bar slim" style="margin-top:3px"><i style="width:'+clamp(p/n*100,0,100)+'%"></i><span>'+p+' / '+n+(D.done[i]?' ✓':'')+'</span></div>'+
     '<div class="small muted">赏：灵石 '+fmt(D.rw[i])+' + 修为与随机丹药</div></div></div>';
  }).join('');
  return '<div class="panel"><h3>每日悬赏（第 '+D.day+' 日）</h3>'+
   '<p class="small muted">凤鸣城悬赏榜每日张榜三条，日落而息后换榜。</p>'+rows+'</div>';
}
function renderTower(){
  const f=(S.towerBest||0)+1;
  const ed=towerFloorEnemy(f);
  const done=GONGFAS.filter(g=>S.gf.own[g.id]).length;
  $('main').innerHTML='<div class="grid2"><div>'+
   '<div class="panel"><h3>九星塔</h3>'+
   '<p class="small muted">凤鸣城外一座无名高塔，塔身暗合九星之数。塔中妖魔层层而强，每十层一头守塔妖王；里程碑层藏有上古功法遗篇。</p>'+
   '<p class="small">当前：<b class="gold">第 '+f+' 层</b> ｜ 最佳：<b>'+S.towerBest+'</b> 层 ｜ 功法 <b>'+done+'/'+GONGFAS.length+'</b> 部</p>'+
   '<p class="small">镇守妖兽：【'+ed.n+'】'+(ed.boss?'<span class="boss-tag">妖王</span>':'')+' <span class="tag">'+REALMS[ed.r].name+'</span>（强度 x'+ed.m.toFixed(2)+'）</p>'+
   '<div style="margin-top:8px"><button class="btn big" onclick="startTower()">挑战此层（'+AP_TOWER+' 行动点）</button></div>'+
   '<p class="small muted">胜则上一层，得灵石与修为；败则原地歇息，再战不迟。</p></div>'+
   '</div><div>'+
   '<div class="panel"><h3>功法（同时运功一部）</h3>'+
   GONGFAS.map(g=>{
     const own=!!S.gf.own[g.id],on=S.gf.on===g.id;
     return '<div class="row-item"><div class="info"><div class="nm">'+g.name+
      (own?'<span class="tag rank">已习</span>':'<span class="tag no">第 '+g.floor+' 层</span>')+(on?'<span class="tag">运功中</span>':'')+'</div>'+
      '<div class="small muted">'+g.d+'</div></div>'+
      (own?'<button class="btn'+(on?' ghost':'')+'" onclick="equipGf(\''+g.id+'\')">'+(on?'收功':'运功')+'</button>':'')+'</div>';
   }).join('')+
   '</div></div></div>';
}

let dexTab='h',dexTier=0,dexN=120;
function renderCodex(){
  const hAll=Object.keys(HERBS).length,pAll=Object.keys(PILLS).length;
  const hs=Object.keys(S.seen.h||{}).filter(id=>HERBS[id]).sort((a,b)=>HERBS[a].t-HERBS[b].t||HERBS[a].n.localeCompare(HERBS[b].n,'zh'));
  const ps=Object.keys(S.seen.p||{}).filter(id=>PILLS[id]).sort((a,b)=>(PILLS[a].t||0)-(PILLS[b].t||0));
  const src=dexTab==='h'?hs:ps;
  const list=src.filter(id=>!dexTier||(dexTab==='h'?HERBS[id].t:(PILLS[id].t||0))===dexTier);
  const total=list.length;
  const shown=list.slice(0,dexN);
  const tierOpts=[0,1,2,3,4,5,6,7,8,9,10].map(t=>'<option value="'+t+'"'+(dexTier===t?' selected':'')+'>'+(t?('限 '+t+' 品'):'不限品阶')+'</option>').join('');
  const rows=shown.map(id=>{
    const it=dexTab==='h'?HERBS[id]:PILLS[id];
    return '<div class="row-item"><div class="info"><div class="nm">'+it.n+'<span class="tag">'+(it.t||1)+'品</span>'+
     (dexTab==='h'?('<span class="tag">'+HERB_ATTRS[it.a]+'系</span>'):'')+'</div>'+
     '<div class="small muted">'+(it.d||'服食可得灵气与状态；亦可入药、出售。')+'</div></div></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2"><div class="panel">'+
   '<h3>大千图鉴</h3>'+
   '<p class="small">灵植 <b class="gold">'+hs.length+' / '+hAll+'</b> ｜ 丹药 <b class="gold">'+ps.length+' / '+pAll+'</b><span class="small muted">（收录你获得过的品类）</span></p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:6px 0">'+
    '<button class="btn'+(dexTab==='h'?'':' ghost')+'" onclick="dexTab=\'h\';dexN=120;renderCodex()">灵植谱</button>'+
    '<button class="btn'+(dexTab==='p'?'':' ghost')+'" onclick="dexTab=\'p\';dexN=120;renderCodex()">丹药谱</button>'+
    '<select class="fin" onchange="dexTier=+this.value;dexN=120;renderCodex()">'+tierOpts+'</select>'+
   '</div>'+
   '<p class="small muted">共 '+total+' 条符合筛选，显示前 '+Math.min(dexN,total)+' 条。</p>'+
   (rows||'<p class="small muted">尚未见录——去采药、炼丹吧。</p>')+
   (total>dexN?'<div style="text-align:center;margin:8px"><button class="btn ghost" onclick="dexN+=120;renderCodex()">显示更多</button></div>':'')+
   '</div></div>';
}

function renderRealms(){
  const r=curR();
  $('main').innerHTML='<div class="grid2"><div class="panel"><h3>境界阶梯（九星传人 · 每境十三层）</h3><div class="ladder">'+
   REALMS.map((rm,i)=>{
     const cls=i<r?'done':(i===r?'cur':'');
     return '<div class="step '+cls+'"><span class="who">'+(rm.who||rm.tier)+'</span><div class="nm">'+rm.name+'</div>'+
      '<div class="small muted">'+rm.desc+'</div></div>';
   }).join('')+'</div></div>'+
   '<div><div class="panel"><h3>当前境界</h3><p class="gold" style="font-size:18px">'+realmTxt()+'</p>'+
   '<p class="small">'+REALMS[r].desc+'</p></div>'+
   '<div class="panel"><h3>战技</h3>'+
   SKILLS.map(sk=>{
     const ok=skillOk(sk);
     return '<div class="row-item"><div class="info"><div class="nm">'+sk.name+(ok?'':'<span class="tag no">未解锁</span>')+'</div>'+
      '<div class="small muted">'+sk.d+'</div></div></div>';
   }).join('')+'</div>'+
   '<div class="panel"><h3>设置</h3>'+
   '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn ghost" onclick="openAbout()">关于 / 资料来源</button>'+
   '<button class="btn ghost" onclick="openSettings()">存档管理</button>'+
   '<button class="btn danger" onclick="if(confirm(\'确定重置全部进度？\'))wipeSave()">重置存档</button></div></div></div></div>';
}
function openSettings(){
  const data=btoa(unescape(encodeURIComponent(JSON.stringify(S))));
  openModal('<h2>存档管理</h2><p class="small">存档自动保存在浏览器 localStorage（每 10 秒）。</p>'+
   '<textarea id="saveArea" style="width:100%;height:120px;background:rgba(0,0,0,.4);color:var(--ink);border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:8px;font-size:11px">'+data+'</textarea>'+
   '<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">'+
   '<button class="btn" onclick="copySave()">复制存档码</button>'+
   '<button class="btn jade" onclick="importSave()">导入存档码</button></div>'+
   '<div id="saveMsg" class="small jade" style="margin-top:6px"></div>');
}
function copySave(){
  const ta=$('saveArea');if(!ta)return;
  ta.select();
  try{document.execCommand('copy');$('saveMsg').textContent='已复制到剪贴板。';}catch(e){$('saveMsg').textContent='请手动全选复制。';}
}
function importSave(){
  const ta=$('saveArea');if(!ta)return;
  try{
    const s=JSON.parse(decodeURIComponent(escape(atob(ta.value.trim()))));
    if(!s||s.v!==1)throw 0;
    localStorage.setItem(SAVE_KEY,JSON.stringify(s));
    location.reload();
  }catch(e){$('saveMsg').textContent='存档码无效。';$('saveMsg').className='small blood';}
}
function renderAll(){
  renderTabs();renderTop();
  if(curTab==='cult')renderCult();
  else if(curTab==='hunt')renderHunt();
  else if(curTab==='alchemy')renderAlchemy();
  else if(curTab==='market')renderMarket();
  else if(curTab==='pearl')renderPearl();
  else if(curTab==='bag')renderBag();
  else if(curTab==='tower')renderTower();
  else if(curTab==='codex')renderCodex();
  else if(curTab==='stars')renderStars();
  else if(curTab==='realms')renderRealms();
}

/* ---------------- 主循环 ---------------- */
let lastLoop=Date.now();
function loop(){
  const now=Date.now();
  const dt=Math.min((now-lastLoop)/1000,5);
  lastLoop=now;tickN++;
  if(!S)return;
  addQi(qps()*dt*S.speed,'loop');
  // 自动冲击（跳过特殊境界，避免误触天劫/材料关卡）
  if(S.autobreak&&!B&&!P){
    const r=curR(),l=curL(),toR=r+1;
    const special=(l===LAYER_CNT-1&&(toR===8||toR===11||toR===14||toR===15));
    if(!special&&!(r===3&&S.bones<BONES_REQ[l])&&S.qi>=layerCost())tryBreak();
  }
  if(tickN%40===0)save();
  if(tickN%20===0)checkQuests();
  if(tickN%2===0&&Date.now()-lastTouch>400)renderAll(); // 刚触屏的瞬间不重建 DOM，避免手机点按落空
  if(tickN%3===0)autoStep();
}
function startGame(){
  if(S)S.flags.intro=1;
  closeModal();
  checkQuests();
  renderAll();
  save();
}

/* ---------------- 星空背景 ---------------- */
function initSky(){
  const cv=$('sky');if(!cv)return;
  const ctx=cv.getContext('2d');
  let stars=[];
  function resize(){
    cv.width=innerWidth;cv.height=innerHeight;
    stars=[];
    for(let i=0;i<150;i++)stars.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.4+0.3,p:Math.random()*Math.PI*2,s:0.4+Math.random()*1.6});
  }
  resize();
  window.addEventListener('resize',resize);
  (function draw(t){
    ctx.clearRect(0,0,cv.width,cv.height);
    const g=ctx.createLinearGradient(0,0,0,cv.height);
    g.addColorStop(0,'#0a0f22');g.addColorStop(0.55,'#070a14');g.addColorStop(1,'#0b0812');
    ctx.fillStyle=g;ctx.fillRect(0,0,cv.width,cv.height);
    for(const s of stars){
      const a=0.25+0.75*Math.abs(Math.sin(t/1400*s+s.p));
      ctx.globalAlpha=a;
      ctx.fillStyle=s.s>1.6?'#f5d76e':'#cfd6e4';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    requestAnimationFrame(draw);
  })(0);
}

/* ---------------- 启动 ---------------- */
function init(){
  initSky();
  document.addEventListener('touchstart',function(){lastTouch=Date.now();},{passive:true});
  S=load();
  if(!S)S=newState();
  // 离线收益
  const away=Math.min((Date.now()-S.lastTick)/1000,8*3600);
  if(away>60){
    const rawGain=qps()*away*0.5*S.speed;
    const gain=addQi(rawGain,'offline');
    setTimeout(()=>toast('闭关归来：离关 '+Math.floor(away/60)+' 分钟，修为 +'+fmt(gain)+(gain<rawGain?'（受每日上限所限）':''),'good'),600);
  }
  renderAll();
  if(!S.flags.intro)openIntro();
  setInterval(loop,250);
  setInterval(save,10000);
}
document.addEventListener('DOMContentLoaded',init);
