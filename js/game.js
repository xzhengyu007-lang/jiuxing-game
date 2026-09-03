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
    flags:{intro:0,gumu:0,siguo:0,sect:0,pearl:0,fireSeed:null,sijie:0,mingxing:0,won:0,ascend:0},
    buffs:{julingUntil:0,qps:null},
    autobreak:0, usePojing:1, speed:1,
    day:1, ap:22, cond:100, cnd:{r:-1,l:-1,n:0},
    pearl:{plants:[],trees:[],beasts:[]},
    expCd:{}, logs:[], lastTick:Date.now(),
    qiToday:0,
    daily:{day:0,qs:[],prog:[],done:[]},
    ach:{}, stat:{kills:0,bosses:0,crafts:0,explores:0,eats:0,sells:0,towers:0,qiTotal:0},
    seen:{h:{},p:{}},
    towerBest:0, gf:{own:{},on:[]}, eqLv:0, starLv:{}, starPow:{}, starUsed:{},
    sk:{own:{},load:['bati']},
    sect:{rank:108,contrib:0,title:0,wins:0,spars:0,day:0,qs:[],prog:[],done:[],cnt:[],rw:[]},
    body:{li:0,lv:[0,0,0,0,0,0,0,0,0]},
    soc:{roster:[],dualBoost:0}, gifts:{},
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
    /* 旧档迁移 */
    if(Math.floor((s.g||0)/LAYER_CNT)>=XIAN_R&&!s.flags.ascend){s.flags.ascend=1;s.stones=Math.floor(s.stones/STONE_XRATE);}
    if(typeof s.gf.on==='string')s.gf.on=s.gf.on?[s.gf.on]:[];
    if(!Array.isArray(s.sk.load)||!s.sk.load.length)s.sk.load=['bati'];
    for(const k in (s.starLv||{})){
      const i=+k;
      if(s.starLv[i]>0&&!s.starPow[i]){let p=0;for(let t=0;t<s.starLv[i];t++)p+=starNeed(i,t);s.starPow[i]=p;s.starUsed[i]=p;}
    }
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
/* ---------------- 货币：凡界灵石 / 仙界仙石（下中上极品，十倍进制） ---------------- */
function isXian(){return curR()>=XIAN_R;}
function moneyName(){return isXian()?'仙石':'灵石';}
function moneyPrice(n){return isXian()?Math.max(1,Math.round(n/STONE_XRATE)):Math.floor(n);}
function fmtQ2(x){x=Math.floor(x*100)/100;return String(x);}
function fmtMoney(v){
  if(v>=1e9)return fmtQ2(v/1e9)+'极品'+moneyName();
  if(v>=1e6)return fmtQ2(v/1e6)+'上品'+moneyName();
  if(v>=1e3)return fmtQ2(v/1e3)+'中品'+moneyName();
  return fmt(v)+moneyName();
}
function ascendNow(){ // 融天境圆满·飞升仙界：货币由灵石换作仙石（1万灵石=1仙石）
  if(S.flags.ascend)return;
  S.flags.ascend=1;
  S.stones=Math.floor(S.stones/STONE_XRATE);
  log('story','神火燃起，仙光洗身——你踏足仙界！凡界家当尽数换作仙石：'+fmt(S.stones)+' 仙石（下品）。今后以仙石通行：1极品=10上品=100中品=1000下品仙石。');
  toast('飞升仙界 · 货币换作仙石！','good');
  renderAll();save();
}
/* ---------------- 武学：战技栏 / 功法多槽 / 授予与购买 ---------------- */
function gfSlots(){return 1+Math.floor(curR()/4);}
function grantSkill(id){
  const sk=SKILLS.find(s=>s.id===id);if(!sk)return;
  S.sk.own[id]=1;
  let inBar=S.sk.load.includes(id);
  if(S.sk.load.length<6&&!inBar){S.sk.load.push(id);inBar=true;}
  log('good','习得战技【'+sk.name+'】（'+(SK_TIER[sk.tier-1]||'')+'）'+(inBar?'，已入战技栏':'，可于武功页装配'));
}
function grantGf(id){
  const g=GONGFAS.find(x=>x.id===id);if(!g)return;
  S.gf.own[id]=1;
  if(S.gf.on.length<gfSlots()&&!S.gf.on.includes(id)){S.gf.on.push(id);log('good','修成功法【'+g.name+'】，自动运功（槽 '+S.gf.on.length+'/'+gfSlots()+'）。');}
  else log('good','修成功法【'+g.name+'】。');
}
/* 战技栏装配开关 */
function toggleSkl(id){
  const at=S.sk.load.indexOf(id);
  if(at>=0)S.sk.load.splice(at,1);
  else if(S.sk.load.length>=6){toast('战技栏已满（6 槽）——先卸下一式');return;}
  else S.sk.load.push(id);
  renderAll();save();
}
function skillPrice(sk){return Math.floor(800*Math.pow(3.2,sk.tier-1));}
function buySkill(id){
  const sk=SKILLS.find(s=>s.id===id);if(!sk||S.sk.own[id])return;
  if(curR()<sk.req.realm){toast('境界不足：需 '+REALMS[sk.req.realm].name);return;}
  const c=moneyPrice(skillPrice(sk));
  if(S.stones<c){toast(moneyName()+'不足：需 '+fmt(c)+' '+moneyName());return;}
  S.stones-=c;S.sk.own[id]=1;
  if(S.sk.load.length<6)S.sk.load.push(id);
  log('good','购得战技【'+sk.name+'】！');renderAll();save();
}
function buyGf(id){
  const g=GONGFAS.find(x=>x.id===id);if(!g||S.gf.own[id])return;
  if((g.reqR||0)>curR()){toast('境界不足：需 '+REALMS[g.reqR].name);return;}
  const c=moneyPrice(g.price||0);
  if(S.stones<c){toast(moneyName()+'不足：需 '+fmt(c)+' '+moneyName());return;}
  S.stones-=c;S.gf.own[id]=1;
  if(S.gf.on.length<gfSlots())S.gf.on.push(id);
  log('good','购得功法【'+g.name+'】！');renderAll();save();
}
function gfFxTxt(fx){
  const L={qps:'修炼',cap:'上限',ap:'行动',atk:'攻',def:'防',hp:'气血',drop:'掉落',craft:'丹成',gain:'所得',all:'全属性',crit:'暴击',cdmg:'暴伤',dodge:'闪避',leech:'吸血',spd:'速度',pen:'穿透',regen:'再生',thorns:'反震'};
  return Object.keys(fx||{}).map(k=>'+'+Math.round(fx[k]*100)+'% '+L[k]).join(' · ');
}
function buffMult(){
  let m=1;
  if(S.flags.sect)m*=1.5;
  if(S.wearing.acc==='julingzhui')m*=1.35;
  let qbuff=Date.now()<S.buffs.julingUntil?1.6:1;
  if(S.buffs.qps&&Date.now()<S.buffs.qps.until)qbuff=Math.max(qbuff,S.buffs.qps.m);
  m*=qbuff;
  m*=1+0.03*S.xiusui;
  m*=1+S.flags.sijie;
  m*=1+starFx('qps')+gfFx('qps')+sectFx('qps')+sectTitleFx('qps')+npcFx('qps');
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
  const sAll=1+starFx('all')+gfFx('all')+sectFx('all')+npcFx('all');
  atk*=sAll*(1+starFx('atk')+gfFx('atk'))*(1+bodyFx('atk'));
  def*=sAll*(1+starFx('def')+gfFx('def'))*(1+bodyFx('def'));
  hp*=sAll*(1+starFx('hp')+gfFx('hp'))*(1+bodyFx('hp'));
  const eqm=1+0.08*(S.eqLv||0);
  atk*=eqm;def*=eqm;hp*=eqm;
  const sec={ // 八维战体系：暴击/暴伤/闪避/吸血/速度/穿透/再生/反震
    crit:Math.min(0.6,bodyFx('crit')+gfFx('crit')),
    cdmg:1.6+0.06*((S.body&&S.body.lv[5])||0)+gfFx('cdmg'),
    dodge:Math.min(0.4,bodyFx('dodge')+gfFx('dodge')),
    leech:Math.min(0.4,bodyFx('leech')+gfFx('leech')),
    spd:Math.min(10,bodyFx('spd')+gfFx('spd')),
    pen:Math.min(0.6,bodyFx('pen')+gfFx('pen')),
    regen:Math.min(0.08,bodyFx('regen')+gfFx('regen')),
    thorns:Math.min(1,bodyFx('thorns')+gfFx('thorns'))
  };
  return {hp:hp,atk:atk,def:def,sec:sec};
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
  const on=Array.isArray(S.gf.on)?S.gf.on:[S.gf.on];
  let v=0;
  for(const gid of on){const g=GONGFAS.find(x=>x.id===gid);v+=(g&&g.fx&&g.fx[k])||0;}
  return v;
}
function qiCap(){ // 每日修为上限：随境界、神树、聚灵坠、九星与功法提升
  return layerCost()*Math.max(1.1,4-0.25*curR())
    *(1+0.03*livingTrees())
    *(S.wearing.acc==='julingzhui'?1.15:1)
    *(1+starFx('cap'))*(1+gfFx('cap'))*(1+sectFx('cap'));
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
   '多余物件皆可在<b class="gold">华云商行</b>买卖。锻骨境要拼财力祭炼骨骼，璇丹境天劫只有一次机会，四极境须在一炷香内抓取符文，而每一境更有关窍凝聚之苦功（聚气凝气旋、辟海辟海眼、命星摘星辉……）……手握乾坤，脚踏星辰，从今日始。</p>'+
   '<div style="text-align:center;margin-top:14px"><button class="btn big" onclick="startGame()">开始修行</button></div>');
}

/* ---------------- 关窍凝聚（每境每层额外修炼） ----------------
 * 各境专属凝聚物：每层须先凝聚足数方可冲击；已有专属机制的境界不设（锻骨祭骨/璇丹凝神丹/通冥生死/神火神火引/四极择符）。 */
const CONDENSE={
  0:{u:'气旋',n:13,d:'凝气成旋'},
  1:{u:'血纹',n:11,d:'凝血成纹'},
  2:{u:'筋缕',n:11,d:'抽筋续缕'},
  4:{u:'窍穴',n:13,d:'开辟窍穴'},
  5:{u:'道基',n:11,d:'夯筑道基'},
  6:{u:'海眼',n:11,d:'辟海成眼'},
  7:{u:'台基',n:13,d:'铸台筑基'},
  9:{u:'神念',n:11,d:'分化神念'},
  10:{u:'星辉',n:13,d:'摘星铸辉'},
  12:{u:'天力',n:11,d:'承接天力'},
  13:{u:'凡蜕',n:11,d:'蜕尽凡尘'},
  16:{u:'君威',n:11,d:'凝聚君威'},
  17:{u:'王座',n:13,d:'铸就王座'},
  18:{u:'界纹',n:13,d:'刻画界纹'},
  19:{u:'尊印',n:11,d:'铸造尊印'},
  20:{u:'不朽痕',n:13,d:'铭刻不朽'},
  21:{u:'皇玺',n:13,d:'铸造皇玺'}
};
function cnd(){const r=curR(),l=curL();if(!S.cnd||S.cnd.r!==r||S.cnd.l!==l)S.cnd={r:r,l:l,n:0};return S.cnd;}
function condCost(){return Math.ceil(layerCost()*0.32);}
function condense(n){
  const def=CONDENSE[curR()];
  if(!def)return;
  const c=cnd(),unit=condCost();
  const want=(n==='all')?(def.n-c.n):Math.min(n||1,def.n-c.n);
  let done=0;
  while(done<want&&S.qi>=unit){S.qi-=unit;c.n++;done++;}
  if(done>=1)toast('凝聚成功：'+def.u+' '+c.n+' / '+def.n+(c.n>=def.n?'（圆满，可冲击了）':''),'good');
  else toast(S.qi<unit?'灵气不足，凝聚一道'+def.u+'需 '+fmt(unit):'本层'+def.u+'已圆满');
  renderAll();
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
  const cdef=CONDENSE[r];
  if(cdef&&cnd().n<cdef.n){
    toast(REALMS[r].name+cnL(l+1)+'层：需先'+cdef.d+'——凝聚'+cdef.u+' '+cnd().n+' / '+cdef.n+'，足数方可冲击');return;
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
function craft(rid,n){ // 炼丹：n=连炼炉数（1/10/100）——材料一次校验、行动点一批一次、逐炉判定
  const rc=RECIPES.find(r=>r.id===rid); if(!rc)return;
  n=Math.max(1,Math.min(100,parseInt(n,10)||1));
  const myRank=danRankIdx();
  if(myRank<rc.rank){toast('丹修位阶不足：需 '+DAN_RANKS[rc.rank]+'（当前 '+DAN_RANKS[myRank]+'）');return;}
  if((rc.reqR||0)>curR()){toast('修为不足：此丹方需 '+REALMS[rc.reqR].name+'方可参悟');return;}
  const need={h:{},c:0}; // n 炉材料总账（'geT' 键表示 ≥T 品灵植）
  if(rc.matsGE){for(const sp of rc.matsGE)need.h['ge'+sp.t]=(need.h['ge'+sp.t]||0)+sp.n*n;need.c=(rc.shouhe||0)*n;}
  else for(const m in rc.mats){if(m==='shouhe')need.c+=rc.mats[m]*n;else need.h[m]=(need.h[m]||0)+rc.mats[m]*n;}
  for(const k in need.h){
    if(k.slice(0,2)==='ge'){const t=+k.slice(2);if(herbsGE(t)<need.h[k]){toast('材料不足：需 '+need.h[k]+' 株 '+t+' 品及以上灵植（现有 '+herbsGE(t)+'）');return;}}
    else{const have=(S.herbs[k]||0)+(k==='shouhe'?(S.mats.shouhe||0):0);if(have<need.h[k]){toast('材料不足：'+(HERBS[k]?HERBS[k].n:MATS[k].n)+' x'+need.h[k]);return;}}
  }
  if(need.c&&(S.mats.shouhe||0)<need.c){toast('材料不足：兽核 x'+need.c);return;}
  if(!useAp(AP_CRAFT,'炼丹'))return;
  for(const k in need.h){
    if(k.slice(0,2)==='ge')consumeHerbsGE(+k.slice(2),need.h[k]);
    else if(k==='shouhe')S.mats.shouhe-=need.h[k];
    else S.herbs[k]-=need.h[k];
  }
  if(need.c)S.mats.shouhe-=need.c;
  const p=clamp(0.62+0.07*(myRank-rc.rank),0.15,0.95);
  let made=0;const got={};
  for(let i=0;i<n;i++){
    if(Math.random()<p){
      made++;
      const outId=rc.starRoll!==undefined?('star'+rc.starRoll+'_'+rollStarQ(myRank)):rc.out;
      S.pills[outId]=(S.pills[outId]||0)+1;
      got[outId]=(got[outId]||0)+1;
    }else{ // 炸炉：抢回这一炉的一半药材
      if(rc.matsGE){for(const sp of rc.matsGE)refundHerbsGE(sp.t,Math.floor(sp.n/2));}
      else for(const m in rc.mats){
        const back=Math.floor(rc.mats[m]/2);
        if(back<=0)continue;
        if(m==='shouhe')S.mats.shouhe+=back;else S.herbs[m]=(S.herbs[m]||0)+back;
      }
      if(rc.shouhe)S.mats.shouhe+=Math.floor(rc.shouhe/2);
    }
  }
  S.danExp+=(rc.exp||10)*made;
  S.stat.crafts=(S.stat.crafts||0)+made;
  const cq=addQi(layerCost()*0.04*made,'craft');
  bumpDaily('craft',made);bumpSect('craft',made);
  if(made>0){
    const parts=Object.keys(got).map(id=>PILLS[id].n+'x'+got[id]).join('、');
    const qn=rc.starRoll!==undefined?'（星丹品阶随机，丹道越高越易出高品）':'';
    log('good','丹成 '+made+'/'+n+' 炉：'+parts+qn+'（丹修 '+DAN_RANKS[myRank]+' +'+((rc.exp||10)*made)+' 阅历'+(cq>0?('，修为 +'+fmt(cq)):'')+'）');
  }else log('bad','连炼 '+n+' 炉尽数炸炉……抢回部分药材，丹道一途急不得。');
  renderAll();save();
}
function refundHerbsGE(t,n){ // 炸炉退料：按所需品阶退还灵植（并入该品阶最低一档）
  const tier=Math.max(1,Math.min(10,t|0));
  const arr=HERBS_BY_TIER[tier];
  if(arr&&arr.length)S.herbs[arr[0]]=(S.herbs[arr[0]]||0)+Math.max(0,n);
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
    case 'dual':{
      S.pills[pid]--;S.soc.dualBoost=S.day+1;
      log('good',p.n+'化开，周身如沐春风——明日双修之效大增（1.5 倍）。');break;
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
  toast('售出 '+HERBS[hid].n+' x'+qty+'，得'+moneyName()+' '+fmt(price));
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
  toast('售出 '+t+' 品灵植 x'+n+'，得'+moneyName()+' '+fmt(price));
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
  if(S.stones<it.cost){toast(moneyName()+'不足');return;}
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
  const ch=0.16+0.1*(starFx('drop')+gfFx('drop')+sectFx('drop')+sectTitleFx('drop')+npcFx('drop'));
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
    stun:0,bleedT:0,bleedDmg:0,cds:{},turn:1,over:false,log:[],
    sec:st.sec||null
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
  const pen=(B.sec&&B.sec.pen)||0;
  let dmg;
  if(sk.effect==='stun'){dmg=Math.max(B.patk*mult*rnd(0.9,1.15),B.patk*0.2);} // 黑锅：无视防御
  else dmg=Math.max(B.patk*mult*rnd(0.9,1.15)-B.edef*0.55*(1-pen),B.patk*0.12);
  dmg=Math.floor(dmg);
  let crit=false;
  if(B.sec&&(B.sec.crit||0)>0&&Math.random()<B.sec.crit){dmg=Math.floor(dmg*(B.sec.cdmg||1.6));crit=true;}
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
  if(B.sec&&(B.sec.leech||0)>0&&dmg>0){const hl=Math.floor(dmg*B.sec.leech);B.php=Math.min(B.pmax,B.php+hl);extra+='，饮血回复 '+fmt(hl);}
  battleLog('你使出【'+sk.name+'】，'+(crit?'暴击！':'')+'造成 '+fmt(dmg)+' 伤害'+extra,(sk.effect||crit)?'good':'');
  if(B.ehp<=0){winBattle();return;}
  if(B.sec&&(B.sec.spd||0)>0&&Math.random()<Math.min(0.25,B.sec.spd*0.025)){
    const d2=Math.max(Math.floor(dmg*0.5),1);B.ehp-=d2;
    battleLog('你身法快到极致，追击一记——再造成 '+fmt(d2)+' 伤害！','good');
    if(B.ehp<=0){winBattle();return;}
  }
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
  }else if(B.sec&&(B.sec.dodge||0)>0&&Math.random()<B.sec.dodge){
    battleLog('你身形微晃，堪堪避开了【'+B.e.n+'】的扑击！','good');
  }else{
    const dmg=Math.max(Math.floor(B.eatk*rnd(0.85,1.15)-B.pdef*0.55),Math.floor(B.eatk*0.1));
    B.php-=dmg;
    if(B.leech&&dmg>0)B.ehp=Math.min(B.emax,B.ehp+Math.floor(dmg*B.leech));
    battleLog('【'+B.e.n+'】扑击而来，你受到 '+fmt(dmg)+' 伤害。','bad');
    if(B.sec&&(B.sec.thorns||0)>0&&dmg>0){
      const t=Math.floor(dmg*B.sec.thorns);B.ehp-=t;
      battleLog('罡气反震，【'+B.e.n+'】受 '+fmt(t)+' 反噬伤害。','good');
      if(B.ehp<=0){winBattle();return;}
    }
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
  if(B.sec&&(B.sec.regen||0)>0&&B.php<B.pmax&&!B.over){
    const hl=Math.floor(B.pmax*B.sec.regen);
    B.php=Math.min(B.pmax,B.php+hl);
    battleLog('气血自生，你回复了 '+fmt(hl)+' 点气血。','good');
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
  const dropMul=1+(starFx('drop')+gfFx('drop')+sectFx('drop')+sectTitleFx('drop')+npcFx('drop'))+(B.afx?0.4:0);
  const gainMul=1+starFx('gain')+gfFx('gain')+sectFx('gain')+npcFx('gain');
  const stones=Math.floor(30*Math.pow(1.55,ed.r)*ed.m*rnd(0.8,1.3)*(ed.boss?3:1)*dropMul*(B.tower?1.5:1));
  S.stones+=stones;
  let drops=moneyName()+' x'+fmtMoney(stones);
  if(ed.r>=2&&Math.random()<Math.min(0.95,0.55*dropMul)){S.mats.shouhe=(S.mats.shouhe||0)+1;drops+='，兽核 x1';}
  drops+=dropLoot(ed,dropMul);
  if(Math.random()<Math.min(0.95,0.35*dropMul)){
    const h=z?dropHerb(z):randHerbTier(Math.max(1,ed.r-1),Math.min(12,ed.r+1));
    S.herbs[h]=(S.herbs[h]||0)+1;drops+='，'+HERBS[h].n+' x1';
  }
  const qiGain=addQi(layerCost()*(0.05+0.02*ed.m)*(ed.boss?2.5:1)*gainMul,'battle');
  S.stat.kills=(S.stat.kills||0)+1;
  if(ed.boss)S.stat.bosses=(S.stat.bosses||0)+1;
  bumpDaily('kill',1);bumpSect('kill',1);
  battleLog('【'+ed.n+'】轰然倒下！获得 '+drops+(qiGain>0?('，战意化灵，修为+'+fmt(qiGain)):'')+'。','good');
  log('good','斩杀【'+ed.n+'】！'+drops);
  if(B.zid==='sect'){
    winSectBattle();
  }else if(B.zid==='tower'){
    const f=B.tower;
    if(f>(S.towerBest||0)){
      S.towerBest=f;
      log('story','九星塔第 '+f+' 层已克——塔身轰鸣，星光如雨洒落。');
      const g=GONGFAS.find(x=>x.floor===f);
      if(g&&!S.gf.own[g.id]){
        S.gf.own[g.id]=1;
        if(S.gf.on.length<gfSlots()&&!S.gf.on.includes(g.id))S.gf.on.push(g.id);
        log('story','塔心石台之上，一部功法悬光而立——你参悟得【'+g.name+'】！'+g.d);
        toast('习得功法【'+g.name+'】！','good');
      }
    }
  }else{
    const key=B.zid+':'+B.idx;
    S.kills[key]=(S.kills[key]||0)+1;
    maybeMeet('battle',ZONES.find(function(x){return x.id===B.zid;})?ZONES.find(function(x){return x.id===B.zid;}).name:'');
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
  const loadout=S.sk.load.map(sid=>SKILLS.find(s=>s.id===sid)).filter(s=>s&&skillOk(s));
  for(const sk of loadout){
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
  bumpDaily('explore',1);bumpSect('explore',1);
  log('good','在【'+z.name+'】采到 '+HERBS[h].n+' x'+n+'，顺手得了些灵石（'+fmt(st)+'）'+(eq>0?('，气机微动，修为 +'+fmt(eq)):'')+'。');
  if(Math.random()<0.14)doEvent(z);
  maybeMeet('explore',z.name);
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
    log('good','【奇遇】你发现一处'+moneyName()+'矿脉，挖出'+moneyName()+' '+fmt(st)+'！');
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
function condenseStar(i,q,silent){ // 凝星：星丹化丹力，每重海量丹药跨重，每重神通递增
  q|=0;
  if(!S)return false;
  const st=STARS[i]; if(!st)return false;
  const lv=starLvOf(i);
  if(lv>=13){if(!silent)toast(st.name+'已凝至「星汉圆满」，大圆满之境');return false;}
  if(lv===0&&i!==starCnt()){if(!silent)toast('需依序凝聚九星秘藏');return false;}
  if(curR()<st.reqR){if(!silent)toast('境界不足：需 '+REALMS[st.reqR].name);return false;}
  const Q=STAR_PILL_Q[q];
  if(!Q)return false;
  if((S.pills[starPillId(i,q)]||0)<1){if(!silent)toast('囊中无【'+(q?Q.s+'·':'')+st.name+'丹】——炼丹页可炼制，品阶随机');return false;}
  if(S.starLv[i]===undefined)S.starLv[i]=0;
  const was0=lv===0,l0=lv;
  S.pills[starPillId(i,q)]--;
  S.starPow[i]=(S.starPow[i]||0)+pillPow(i,q);
  let ups=0;
  while(S.starLv[i]<STAR_STAGES.length&&(S.starPow[i]-(S.starUsed[i]||0))>=starNeed(i,S.starLv[i])){
    S.starUsed[i]=(S.starUsed[i]||0)+starNeed(i,S.starLv[i]);
    S.starLv[i]++;
    ups++;
    const qiCost=Math.floor(layerCost()*st.qiMul*S.starLv[i]/STAR_STAGES.length);
    const stCost=Math.floor(st.stones*S.starLv[i]/STAR_STAGES.length);
    S.qi=Math.max(0,S.qi-qiCost);S.stones=Math.max(0,S.stones-stCost);
  }
  const nl=S.starLv[i];
  if(was0&&ups>0){
    S.starsOpened.push(st.name);
    if(!silent){
      log('story','星丹入体，轰！！体内第'+CN_NUM[i+1]+'重禁制应声而开——【'+st.name+'】（'+st.alias+'）秘藏凝聚成功，凝星第 '+cnL(nl-1)+' 重「'+STAR_STAGES[nl-1]+'」成！九星之数又添其一。');
      toast('凝聚九星秘藏【'+st.name+'】！','good');
    }
    if(starCnt()>=9&&!silent){
      log('story','九星连珠，霸体觉醒！九大秘藏一气贯通，你已是真正意义上的——九星霸体！');
      toast('九星归位 · 霸体觉醒！','good');
    }
  }else if(ups>0&&!silent){
    log('good','【'+(q?Q.s+'·':'')+st.name+'丹】化入星窍——【'+st.name+'】凝至第 '+cnL(nl-1)+' 重「'+STAR_STAGES[nl-1]+'」（'+starFxTxt(st,nl)+'）！');
  }else if(ups===0&&!silent){
    toast('星丹化入星窍，丹力 +'+pillPow(i,q)+'——此重尚需 '+fmt(starNeed(i,nl)-(S.starPow[i]-(S.starUsed[i]||0)))+' 丹力');
  }
  if(nl>=STAR_STAGES.length&&l0<STAR_STAGES.length&&!silent){
    log('story','星汉圆满！【'+st.name+'】十三重凝星功成，星辉如瀑灌体——此星神通已然翻倍。');
    toast('凝星大圆满：'+st.name,'good');
  }
  if(!silent){renderAll();save();}
  return true;
}
function autoCondense(i){ // 一键凝聚：从低品到高品逐枚吞丹，直至升不动为止
  if(!S)return;
  const st=STARS[i];if(!st)return;
  const l0=starLvOf(i);
  let fed=0,guard=0;
  while(starLvOf(i)<STAR_STAGES.length&&guard++<9999){
    let q=-1;
    for(let k=0;k<STAR_PILL_Q.length;k++)if((S.pills[starPillId(i,k)]||0)>0){q=k;break;}
    if(q<0)break;
    condenseStar(i,q,true);
    fed++;
  }
  if(fed){
    const gain=starLvOf(i)-l0;
    if(starLvOf(i)>=STAR_STAGES.length&&l0<STAR_STAGES.length){
      log('story','星汉圆满！【'+st.name+'】十三重凝星功成——此星神通已然翻倍。');
      toast('凝星大圆满：'+st.name,'good');
    }else log('good','一键凝聚 '+fed+' 枚星丹：'+(gain>0?('凝至第 '+cnL(starLvOf(i)-1)+' 重「'+STAR_STAGES[starLvOf(i)-1]+'」'):'丹力累积中（尚不足一重）'));
    renderAll();save();
  }else toast('囊中并无此星星丹——炼丹页可炼制');
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
 {id:'tianzong',name:'拜入玄天道宗',desc:'踏入凝血之境，赴玄天道宗入册——被点去第36分宗辖下最末的第108分宗。',cond:()=>curR()>=1,
  reward:()=>{S.flags.tianzong=1;
    if(!S.sect)S.sect={rank:108,contrib:0,title:0,wins:0,spars:0,day:0,qs:[],prog:[],done:[],cnt:[],rw:[]};
    log('story','玄天道宗，东荒第一大宗，下辖三十六分宗。近年香火不济，第36分宗再一分为一百零八，皆是垫底的弱旅。你入册那日，执事翻遍名册，指给你最末一行：「第108分宗，主事久悬——你去。」自此执掌第一百零八分宗：门派任务、同门切磋、分宗升位战，皆于宗门页行事。从最末爬到第一——而第一之上，还有总宗。');}},
/* —— 凝星 · 武学 · 飞升（凡界之巅与仙界之途） —— */
 {id:'ningxing0',name:'凝星之引',desc:'炼制一枚【风府星丹】，于九星页凝聚第一处星窍（凝血境可炼）。',cond:()=>starCnt()>0,
  reward:()=>{S.stones+=1000;log('good','星窍初开，禁制松动——奖励：灵石 x1000。九星之路，始于足下。');}},
 {id:'kaitian1',name:'开天第一式 · 斧劈混沌',desc:'修至易筋境，梦中古神授你开天第一式。',cond:()=>curR()>=2,
  reward:()=>{grantSkill('kaitian1');log('story','梦中有巨神执斧，劈开混沌——清气上升，浊气下沉。你醒来时掌心犹有斧意：习得【开天第一式·斧劈混沌】！');}},
 {id:'kaitian2',name:'开天第二式 · 清浊两断',desc:'修至锻骨境，古神斧意更深一层。',cond:()=>curR()>=3,
  reward:()=>{grantSkill('kaitian2');log('story','斧意入骨，清浊两断——习得【开天第二式·清浊两断】！');}},
 {id:'dafu1',name:'大梵天经 · 下卷',desc:'修至辟海境，古寺残僧授你梵音护体之法。',cond:()=>curR()>=6,
  reward:()=>{grantGf('dafu1');log('story','古寺钟声里，残僧合十：“梵音护体，百邪不侵。”——习得【大梵天经·下卷】！');}},
 {id:'kaitian3',name:'开天第三式 · 星河倒卷',desc:'修至璇丹境，引星河之力倒卷而出。',cond:()=>curR()>=8,
  reward:()=>{grantSkill('kaitian3');log('story','仙台之上仰观星河，斧意与星光共鸣——习得【开天第三式·星河倒卷】！');}},
 {id:'kaitian4',name:'开天第四式 · 日月同辉',desc:'修至化神境，日月精华汇于一斧。',cond:()=>curR()>=10,
  reward:()=>{grantSkill('kaitian4');log('story','元神始符映照日月，双辉同悬——习得【开天第四式·日月同辉】！');}},
 {id:'dafu2',name:'大梵天经 · 中卷',desc:'修至命星境，梵音与命星共鸣。',cond:()=>curR()>=11,
  reward:()=>{grantGf('dafu2');log('story','命星悬空，梵音自星海传来——习得【大梵天经·中卷】！');}},
 {id:'kaitian5',name:'开天第五式 · 万法皆空',desc:'修至融天境，一斧落处万法俱寂。',cond:()=>curR()>=12,
  reward:()=>{grantSkill('kaitian5');log('story','融天之下，万法如尘——习得【开天第五式·万法皆空】！');}},
 {id:'feisheng',name:'飞升 · 蜕凡入仙',desc:'融天境蜕尽凡俗之气，仙门自开——飞升仙界（货币换作仙石，1 万灵石折 1 仙石）。',cond:()=>curR()>=13&&!S.flags.ascend,
  reward:()=>{ascendNow();log('story','天门洞开，仙光垂落！你蜕尽最后一缕凡俗之气，踏入仙界——自此以仙石计资，仙道之途徐徐展开。');}},
 {id:'kaitian6',name:'开天第六式 · 天崩地裂',desc:'入仙界后于蜕凡境重悟斧意，天崩地裂。',cond:()=>S.flags.ascend&&curR()>=14,
  reward:()=>{grantSkill('kaitian6');log('story','仙界天地更广，斧意亦随之而涨——习得【开天第六式·天崩地裂】！');}},
 {id:'miehuolian',name:'灭世火莲',desc:'点燃神火之后，以神火凝莲；炼丹百炉，方悟火候。',cond:()=>curR()>=14&&(S.stat.crafts||0)>=100,
  reward:()=>{grantSkill('miehuolian');log('story','炉火千锤百炼，神火凝成一朵火莲——莲开之日，天地失色！习得【灭世火莲】！');}},
 {id:'dafu3',name:'大梵天经 · 上卷',desc:'修至神君境，佛光自九天而来。',cond:()=>curR()>=16,
  reward:()=>{grantGf('dafu3');log('story','九天梵音灌顶，三花未聚而佛光先至——习得【大梵天经·上卷】！');}},
 {id:'kaitian7',name:'开天第七式 · 再造乾坤',desc:'修至仙王境，开天七式至此圆满——一斧可再造乾坤。',cond:()=>curR()>=17,
  reward:()=>{grantSkill('kaitian7');log('story','第七斧落下，旧乾坤碎、新乾坤生——开天七式圆满！习得【开天第七式·再造乾坤】！');}},
 {id:'xianli',name:'仙界扬名',desc:'在仙界斩敌一千，扬名人族之名。',cond:()=>S.flags.ascend&&(S.stat.kills||0)>=1000,
  reward:()=>{S.stones+=moneyPrice(50000);log('good','仙界诸强侧目——奖励：仙石一袋。人族有龙尘，仙界不再平静。');}},
 {id:'xingman',name:'星汉圆满之路',desc:'将任意一星凝至十三重「星汉圆满」。',cond:()=>STARS.some((st,i)=>starLvOf(i)>=13),
  reward:()=>{S.stones+=moneyPrice(200000);log('good','星汉长明，神通翻倍——奖励：厚礼一箱。九星之路，已见通途。');}},
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
  if(S.stones<cost){toast(moneyName()+'不足：需 '+fmtMoney(cost)+' '+moneyName());return;}
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
  if(S.stones<cost){toast(moneyName()+'不足：需 '+fmtMoney(cost));return;}
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
  bumpDaily('tower',1);bumpSect('tower',1);
  const f=(S.towerBest||0)+1;
  const ed=towerFloorEnemy(f);
  beginBattle('tower',-1,ed,f);
  battleLog('九星塔第 '+f+' 层——【'+ed.n+'】当道，登塔！','');
}

/* ---------------- 玄天道宗 · 一百零八分宗（门派系统） ---------------- */
function sectOpened(){return !!(S&&S.flags.tianzong);}
function sectProg(){ // 前进度：0（第108名）… 107（第1名）
  return sectOpened()?Math.max(0,108-(S.sect.rank||108)):0;
}
function sectFx(k){ // 宗门气运：名次越靠前，气运越盛（第1分宗满额）
  if(!sectOpened())return 0;
  const p=sectProg()/107;
  if(k==='qps')return 0.50*p;
  if(k==='all')return 0.25*p;
  if(k==='cap')return 0.30*p;
  if(k==='drop')return 0.30*p;
  if(k==='gain')return 0.30*p;
  return 0;
}
function sectTitleFx(k){ // 职位加成：每级 +4% 修炼 / +3% 掉落
  const t=sectOpened()?((S.sect.title||0)):0;
  if(k==='qps')return 0.04*t;
  if(k==='drop')return 0.03*t;
  return 0;
}
function ensureSectDaily(){
  if(!S||!S.sect)return;
  if(S.sect.day===S.day&&S.sect.qs&&S.sect.qs.length)return;
  const r=rngFor(S.day*104729+7);
  const idxs=[];
  while(idxs.length<3){
    const k=Math.floor(r()*SECT_TASKS.length)%SECT_TASKS.length;
    if(idxs.indexOf(k)<0)idxs.push(k);
  }
  S.sect.day=S.day;S.sect.qs=idxs;
  S.sect.prog=idxs.map(()=>0);S.sect.done=idxs.map(()=>0);
  S.sect.cnt=idxs.map(i=>sectTaskCount(SECT_TASKS[i].k,curR()));
  S.sect.rw=idxs.map(i=>sectTaskReward(curR()));
}
function bumpSect(k,n){
  if(!sectOpened()||!S.sect.qs)return;
  ensureSectDaily();
  for(let i=0;i<S.sect.qs.length;i++){
    if(SECT_TASKS[S.sect.qs[i]].k!==k||S.sect.done[i])continue;
    S.sect.prog[i]=Math.min(S.sect.cnt[i],S.sect.prog[i]+(n||1));
    if(S.sect.prog[i]>=S.sect.cnt[i]){
      S.sect.done[i]=1;
      const t=SECT_TASKS[S.sect.qs[i]],c=S.sect.rw[i];
      S.sect.contrib+=c;
      const st=Math.floor(40*Math.pow(1.5,curR()));
      S.stones+=st;
      log('good','【门派任务 · '+t.n+'】贡献 +'+c+'，'+moneyName()+' +'+fmtMoney(st)+'。');
      toast('门派任务完成：'+t.n,'good');
    }
  }
}
function startSectPromo(){ // 升位战：挑战上一名分宗守擂弟子，胜则互换名次
  if(!sectOpened())return;
  if(S.sect.rank<=1){toast('已是玄天道宗第一分宗！');return;}
  if(!useAp(AP_BATTLE,'升位战'))return;
  const rank=S.sect.rank,r=sectEnemyR(rank-1);
  const ed={n:sectDiscipleName(rank*13+5)+'（第'+(rank-1)+'分宗·守擂）',r:r,m:1.6+(108-rank)*0.022,boss:1};
  beginBattle('sect',-1,ed,0);
  B.sectMode='promo';B.sectRank=rank;
  battleLog('【分宗升位战】执事高唱：第'+rank+'分宗龙尘，挑战第'+(rank-1)+'分宗守擂弟子——胜则互换名次！','');
}
function startSectSpar(){ // 同门切磋：胜得贡献，败无损失
  if(!sectOpened())return;
  if(!useAp(1,'同门切磋'))return;
  const r=Math.max(1,Math.min(21,sectEnemyR(S.sect.rank)+(Math.random()<0.5?0:1)-1));
  const ed={n:sectDiscipleName(S.day*17+3)+'（同门弟子）',r:r,m:1.2+0.015*(108-S.sect.rank),noAfx:1};
  beginBattle('sect',-1,ed,0);
  B.sectMode='spar';B.sectRank=S.sect.rank;
  battleLog('同门切磋——【'+ed.n+'】抱拳邀战：「点到为止，请！」','');
}
function winSectBattle(){
  const rank=B.sectRank,mode=B.sectMode,ed=B.e,r=ed.r;
  if(mode==='promo'){
    S.sect.rank=Math.max(1,rank-1);S.sect.wins++;
    const c=40+r*15,st=Math.floor(80*Math.pow(1.5,r));
    S.sect.contrib+=c;S.stones+=st;
    log('story','【升位战胜】你击败第'+rank+'分宗守擂弟子——玄天道宗敕令：第'+rank+'分宗与第'+S.sect.rank+'分宗互换名次！如今你执掌第'+S.sect.rank+'分宗「'+sectBranchAlias(S.sect.rank)+'」（贡献 +'+c+'，'+moneyName()+' +'+fmtMoney(st)+'）。宗门气运渐盛。');
    toast('升位成功：第 '+S.sect.rank+' 分宗！','good');
    if(S.sect.rank===1){
      S.flags.sectTop=1;
      log('story','一百零七战，从垫底到登顶——第108分宗的旗帜升起在第一百零八分宗的最高处！第36分宗上下哗然：这一脉垫底的弱旅，竟先登了顶。总宗来使恰在此时下山，宣读法旨：「第108分宗主事龙尘，入总宗听旨。」——分宗之路至此走完，总宗的大门，为你而开。');
      toast('第一分宗 · 登顶！','good');
    }else if((108-S.sect.rank)%10===0){
      S.sect.contrib+=100;S.stones+=Math.floor(500*Math.pow(1.5,curR()));
      log('story','【十名之约】每进十名，天宗必有嘉奖——贡献 +100，赏赐另附。分宗上下与有荣焉。');
    }
  }else{
    S.sect.spars++;
    const c=12+r*6,st=Math.floor(30*Math.pow(1.5,r));
    S.sect.contrib+=c;S.stones+=st;
    log('good','【切磋胜】你与同门【'+ed.n+'】切磋获胜：贡献 +'+c+'，'+moneyName()+' +'+fmtMoney(st)+'。');
    bumpSect('spar',1);
  }
}
function buySectItem(id){
  if(!sectOpened())return;
  const it=SECT_SHOP.find(x=>x.id===id);if(!it)return;
  if(S.sect.contrib<it.cost){toast('贡献不足：需 '+it.cost+'（现有 '+S.sect.contrib+'）');return;}
  if(it.reqTitle&&(S.sect.title||0)<it.reqTitle){toast('职位不足：需 '+SECT_TITLES[it.reqTitle].n);return;}
  S.sect.contrib-=it.cost;
  if(it.give)it.give(S);
  if(it.gf)grantGf(it.gf);
  if(it.sk)grantSkill(it.sk);
  log('good','【贡献阁】兑得【'+it.n+'】。');
  toast('兑换成功：'+it.n,'good');
  renderAll();save();
}
function promoteTitle(){
  if(!sectOpened())return;
  const t=S.sect.title||0,nx=SECT_TITLES[t+1];
  if(!nx){toast('你已是分宗首席');return;}
  if(S.sect.contrib<nx.need){toast('贡献不足：需累计 '+nx.need+'（现有 '+S.sect.contrib+'）');return;}
  S.sect.title=t+1;
  const st=Math.floor(500*Math.pow(2.5,t)),c=50*(t+1);
  S.stones+=st;S.sect.contrib+=c;
  log('story','【晋升】玄天道宗敕令：擢升你为第'+S.sect.rank+'分宗「'+nx.n+'」！'+nx.d+'（奖励：'+moneyName()+' '+fmtMoney(st)+'、贡献 +'+c+'）');
  toast('晋升：'+nx.n,'good');
  checkAch();renderAll();save();
}

/* ---------------- 练体 · 肉身九秘 ---------------- */
function bodyFx(k){
  if(!S||!S.body)return 0;
  let v=0;
  for(let i=0;i<BODY_STAGES.length;i++){if(BODY_STAGES[i].fx===k)v+=BODY_STAGES[i].v*(S.body.lv[i]||0);}
  return v;
}
function bodyTotal(){
  if(!S||!S.body)return 0;
  let t=0;for(let i=0;i<S.body.lv.length;i++)t+=S.body.lv[i]||0;
  return t;
}
function bodyCur(){ // 当前淬炼中的秘藏与重数
  if(!S.body)S.body={li:0,lv:[0,0,0,0,0,0,0,0,0]};
  if(S.body.li>=BODY_STAGES.length)return null;
  return {i:S.body.li,lv:S.body.lv[S.body.li]||0};
}
function bodyCostNow(){
  const c=bodyCur();
  if(!c)return null;
  return bodyCost(c.i,c.lv,curR());
}
function temperBody(){ // 淬炼一层：耗灵气/灵石（四秘之后另耗兽核），不耗行动点
  const c=bodyCur();
  if(!c){toast('九秘俱通，肉身已臻大成——罡气离体，金身不坏');return;}
  const cost=bodyCostNow();
  if(S.qi<cost.qi){toast('灵气不足：需 '+fmt(cost.qi));return;}
  if(S.stones<cost.st){toast(moneyName()+'不足：需 '+fmtMoney(cost.st));return;}
  if(cost.sh&&(S.mats.shouhe||0)<cost.sh){toast('兽核不足：需 '+cost.sh+' 枚');return;}
  S.qi-=cost.qi;S.stones-=cost.st;if(cost.sh)S.mats.shouhe-=cost.sh;
  S.body.lv[c.i]++;
  const st=BODY_STAGES[c.i];
  if(S.body.lv[c.i]>=BODY_MAX_LV){
    S.body.li++;
    log('good','【练体 · '+st.n+'】十重功成——'+st.st+'之秘圆满！'+(bodyCur()?'下一秘：【'+BODY_STAGES[S.body.li].n+'】。':'肉身九秘，俱通大成！'));
  }else{
    log('good','【练体 · '+st.n+'】第 '+cnL(S.body.lv[c.i])+' 重淬成——'+st.d);
  }
  checkAch();renderAll();save();
}

/* ---------------- 装备强化 / 灵兽升级 / 功法装备 ---------------- */
function upEqCost(){return Math.floor(2000*Math.pow(2.1,S.eqLv||0));}
function upgradeEq(){
  const lv=S.eqLv||0;
  if(lv>=10){toast('神兵淬炼已至 +10 圆满');return;}
  const cost=upEqCost();
  if(S.stones<cost){toast(moneyName()+'不足：需 '+fmtMoney(cost)+' '+moneyName());return;}
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
  if(!Array.isArray(S.gf.on))S.gf.on=[];
  const at=S.gf.on.indexOf(gid);
  if(at>=0)S.gf.on.splice(at,1);
  else if(S.gf.on.length>=gfSlots()){toast('运功槽已满（'+gfSlots()+' 槽——境界每进四重多一槽）');return;}
  else S.gf.on.push(gid);
  const g=GONGFAS.find(x=>x.id===gid);
  toast(at>=0?('收功【'+g.name+'】'):('运功【'+g.name+'】（'+S.gf.on.length+'/'+gfSlots()+' 槽）'));
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
    case 'sectprog':return sectProg();
    case 'secttitle':return (S.sect&&S.sect.title)||0;
    case 'bodylv':return bodyTotal();
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
      if(a.rw.stones){S.stones+=a.rw.stones;txt.push(moneyName()+' +'+fmtMoney(a.rw.stones));}
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
    if(b.out==='stones'){const g=Math.floor(b.qty(curR())*om);S.stones+=g;outTxt.push(moneyName()+' x'+fmtMoney(g));}
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
  toast('售出 兽核 x'+qty+'，得'+moneyName()+' '+fmt(price));
  renderAll();save();
}
function sellPill(pid,qty){
  const have=S.pills[pid]||0;
  qty=Math.min(qty,have); if(qty<=0)return;
  const price=pillPrice(pid,curR())*qty;
  S.pills[pid]-=qty;S.stones+=price;
  S.stat.sells=(S.stat.sells||0)+1;bumpDaily('sell',1);
  toast('售出 '+PILLS[pid].n+' x'+qty+'，得'+moneyName()+' '+fmt(price));
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
 {id:'wugong',n:'武功'},
 {id:'sect',n:'宗门'},
 {id:'body',n:'练体'},
 {id:'soc',n:'红尘'},
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
   '<div class="tb-sub">第 '+S.day+' 日 ｜ 战力 '+fmt(st.atk*10+st.hp/10+(S.bones*50)+bodyTotal()*30)+' ｜ 祭骨 '+S.bones+' 根 ｜ 练体 '+bodyTotal()+'/90 重 ｜ 九星 '+starCnt()+'/9 ｜ 丹修 '+DAN_RANKS[danRankIdx()]+'</div></div>'+
   '<div class="res">'+
   '<div class="it"><span>灵气'+(buff.length?' '+buff.join(' '):'')+'</span><b>'+fmt(S.qi)+'</b></div>'+
   '<div class="it"><span>'+moneyName()+'</span><b>'+fmtMoney(S.stones)+'</b></div>'+
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
  const cdef=CONDENSE[r],cndOk=!cdef||cnd().n>=cdef.n;
  const can=S.qi>=cost&&cndOk;
  let breakBtnTxt='冲击 · '+REALMS[r].name+cnL(l+1)+'层';
  if(S.g>=MAXG())breakBtnTxt='已至圆满';
  else if(l===LAYER_CNT-1)breakBtnTxt='冲关 · 【'+REALMS[r+1].name+'】';
  else if(!cndOk)breakBtnTxt='先凝聚'+cdef.u+'（'+cnd().n+' / '+cdef.n+'）';
  let boneHtml='';
  if(r===3){
    const need=BONES_REQ[l];
    boneHtml='<div class="panel"><h3>锻骨 · 祭炼骨骼（拼资源之境）</h3>'+
     '<p class="small">以祭骨丹祭炼骨骼：每根骨骼永久 +5% 攻防气血。本层需累计祭炼 <b class="gold">'+need+'</b> 根，当前 <b class="jade">'+S.bones+'</b> 根。</p>'+
     '<p class="small muted">原著：四祭、八祭、十祭、十二祭、十六祭、全祭——唯有锻骨不靠天赋而靠财力。</p>'+
     '<div style="margin-top:8px"><button class="btn jade" onclick="refineBone()">祭骨冲关（消耗祭骨丹 x1）</button> '+
     '<span class="small muted">祭骨丹：'+(S.pills.jigu||0)+' 枚</span></div></div>';
  }
  let cndHtml='';
  if(cdef){
    const c=cnd(),unit=condCost(),full=c.n>=cdef.n;
    cndHtml='<div class="panel"><h3>'+cdef.d+' · '+cdef.u+'（'+REALMS[r].name+'每层必修）</h3>'+
     '<p class="small">本境每一层，须先以灵气凝聚 <b class="gold">'+cdef.n+'</b> 道<b class="jade">'+cdef.u+'</b>，足数方可冲击关隘；每道耗灵气 '+fmt(unit)+'。</p>'+
     '<div class="bar" style="margin:8px 0"><i style="width:'+clamp(c.n/cdef.n*100,0,100)+'%"></i><span>'+cdef.u+' '+c.n+' / '+cdef.n+(full?' · 圆满，可冲击':'')+'</span></div>'+
     '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn jade" onclick="condense(1)">凝聚一道（'+fmt(unit)+' 灵气）</button>'+
     '<button class="btn" '+(full?'disabled':'')+' onclick="condense(99)">一键凝聚余下</button></div>'+
     '<p class="small muted">「自动冲击」开启时也会自动凝聚。凝聚之属随层精进，破层后重新凝聚。</p></div>';
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
     cndHtml+boneHtml+
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
    const loadout=S.sk.load.map(sid=>SKILLS.find(s=>s.id===sid)).filter(s=>s&&skillOk(s));
    const sk=loadout.map(s=>{
      const cd=B.cds[s.id]||0;
      return '<button class="btn'+(cd||B.mp<s.qi?' ghost':'')+'" '+(B.over?'disabled':'')+' onclick="useSkill(\''+s.id+'\')">'+s.name+
        '<div class="small">威 x'+(s.effect==='stars'?(2+0.9*starCnt()).toFixed(1):s.mult)+'　灵力 '+s.qi+(cd?('　冷'+cd):'')+'</div></button>';
    }).join('');
    html='<div class="panel"><h3>战斗 · '+B.e.n+(B.afx?' <span class="afx">'+B.afx.n+'</span>':'')+(B.tower?' <span class="afx">塔'+B.tower+'层</span>':'')+(B.zid==='sect'?' <span class="afx">'+(B.sectMode==='promo'?'升位战':'同门切磋')+'</span>':'')+(B.e.boss?' <span class="boss-tag" style="color:var(--blood);font-size:12px;border:1px solid var(--blood);border-radius:4px;padding:0 4px">首领</span>':'')+'</h3>'+
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
  // DOM read before rebuild - safer than ontoggle timing
  document.querySelectorAll('details.zgrp[data-k]').forEach(function(d){if(d.open)ZGRP_OPEN[d.getAttribute('data-k')]=true;});
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
var ZGRP_OPEN={}; // 往昔/远处地界折叠组的展开状态（页面每 0.5s 重建 DOM，需记住 open）
function renderZoneGroups(){
  // 地图按境界分组：当前境界展开，往昔地界折叠，远处地界另列
  let html='';
  for(let r=0;r<=curR();r++){
    const zs=ZONES.filter(z=>zoneUnlocked(z)&&z.reqR===r);
    if(!zs.length)continue;
    const cards=zs.map(zoneCard).join('');
    if(r===curR())html+=cards;
    else html+='<details class="zgrp" data-k="past'+r+'"'+(ZGRP_OPEN['past'+r]?' open':'')+' ontoggle="ZGRP_OPEN.past'+r+'=this.open"><summary>往昔地界 · '+REALMS[r].name+'（'+zs.length+' 处地图）</summary>'+cards+'</details>';
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
    html+='<details class="zgrp" data-k="locked"'+(ZGRP_OPEN.locked?' open':'')+' ontoggle="ZGRP_OPEN.locked=this.open"><summary>远处地界 · 尚未踏足（'+locked.length+' 处，随修为解锁）</summary>'+inner+'</details>';
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
     '<div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn" '+(ok?'':'disabled')+' onclick="craft(\''+rc.id+'\',1)">炼制</button>'+
     (ok?'<button class="btn ghost" onclick="craft(\''+rc.id+'\',10)">x10</button><button class="btn ghost" onclick="craft(\''+rc.id+'\',100)">x100</button>':'')+'</div></div>';
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
   '<p class="small muted">※ 祭骨丹、回气丹等耗材可在「商行」页采购；多余的丹药、药材可在商行卖出换'+moneyName()+'。</p>'+
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
    return '<div class="row-item"><div class="info"><div class="nm">'+t+' 品灵植 x'+n+'</div><div class="small muted">收购价 '+fmtMoney(herbPrice(t))+' '+moneyName()+'/株 · 共值 '+fmtMoney(herbPrice(t)*n)+'</div></div>'+
     '<span><button class="btn ghost" onclick="sellHerbsTier('+t+',10)">留10株</button> '+
     '<button class="btn" onclick="sellHerbsTier('+t+',0)">全售</button></span></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2"><div>'+
   shop2Html()+
   '<div class="panel"><h3>华云商行 · 采购</h3>'+
   '<p class="small muted">华云商行，货通东荒。掌柜的满面堆笑：“客官里边请——今儿什么都有。”</p>'+
   shopItems.map(it=>'<div class="row-item"><div class="info"><div class="nm">'+it.n+'</div><div class="small muted">'+it.d+'</div></div>'+
     '<button class="btn" '+(it.dis?'disabled':'')+' onclick="buy(\''+it.k+'\')">'+fmtMoney(it.cost)+' '+moneyName()+'</button></div>').join('')+
   '</div></div><div>'+
   '<div class="panel"><h3>华云商行 · 出售</h3>'+
   '<p class="small muted">行商不问来路，收尽天下奇珍——千种灵植按品阶整批收购。神兵法宝认主，恕不收购。</p>'+
   (tierRows||'<p class="small muted">囊中无药材。</p>')+
   ((S.mats.shouhe||0)>0?'<div class="row-item"><div class="info"><div class="nm">兽核 x'+S.mats.shouhe+'</div><div class="small muted">收购价 '+fmtMoney(corePrice(r))+' '+moneyName()+'/枚</div></div>'+
     '<span><button class="btn ghost" onclick="sellCore(1)">售1</button> <button class="btn" onclick="sellCore('+S.mats.shouhe+')">全售</button></span></div>':'')+
   sellMatRows()+
   (pillsOwned.length?pillsOwned.map(pid=>
     '<div class="row-item"><div class="info"><div class="nm">'+PILLS[pid].n+' x'+S.pills[pid]+'</div><div class="small muted">收购价 '+fmtMoney(pillPrice(pid,r))+' '+moneyName()+'/枚</div></div>'+
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
   '<button class="btn" '+(locked?'disabled':'')+' onclick="plantHerb(document.getElementById(\'seedPick\').value)">种下（'+fmtMoney(seedCost(t))+' '+moneyName()+' + 1 行动点）</button></div>'+
   '<p class="small muted">'+t+' 品：'+growDays(t)+' 日成熟 · 收 '+harvestYield(t)+' 株 · 商行收购 '+fmtMoney(herbPrice(t))+' '+moneyName()+'/株。带 ★ 者与你神火同属性，服食加成 1.5 倍。</p>';
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
     '<div class="small muted">不再荫庇修行；复苏需 '+fmtMoney(reviveCost(r))+' '+moneyName()+'</div></div>'+
     '<button class="btn" onclick="reviveTree('+i+')">复苏</button></div>';
    const cls=t.vigor<40?'blood':(t.vigor<70?'gold':'jade');
    return '<div class="row-item"><div class="info"><div class="nm">🌳 混沌神树</div>'+
     '<div class="bar" style="height:10px;margin-top:3px"><i style="width:'+t.vigor+'%"></i><span style="line-height:10px;font-size:10px">茂盛 '+t.vigor+'</span></div></div>'+
     '<span class="small '+cls+'">每日 -'+TREE_DAILY_DECAY+'</span></div>';
  }).join('');
  const beasts=S.pearl.beasts.map((b,i)=>{
    const d=BEASTS[b.t]; if(!d)return '';
    const lv=b.lv||1,om=1+0.3*(lv-1);
    const out=d.out==='stones'?(moneyName()+' x'+fmtMoney(Math.floor(d.qty(r)*om))):(d.out==='lingcao'?('灵草 x'+Math.floor(d.qty*om)):('兽核 x'+Math.floor(d.qty*om)));
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
     '<button class="btn" onclick="plantTree()">植树（'+fmtMoney(saplingCost(r))+' '+moneyName()+' + 1 行动点）</button>'+
     '<button class="btn jade" onclick="waterTrees()">浇灌全部（1 行动点，茂盛 +'+TREE_WATER+'）</button>'+
     '<button class="btn jade" onclick="breatheTrees()">树下吐纳（1 行动点，状态 +'+5*livingTrees()+'）</button>'+
   '</div>'+
   (trees||'<p class="small muted">尚无神树——植下第一株吧。</p>')+
   '</div>'+
   '<div class="panel"><h3>灵兽栏（无限空间）</h3>'+
   Object.keys(BEASTS).map(bid=>{
     const b=BEASTS[bid];
     return '<div class="row-item"><div class="info"><div class="nm">'+b.n+'</div><div class="small muted">'+b.d+'</div></div>'+
      '<button class="btn" onclick="buyBeast(\''+bid+'\')">'+fmtMoney(b.cost(r))+' '+moneyName()+'</button></div>';
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
   '<div style="margin-top:8px"><button class="btn jade" onclick="upgradeEq()">淬炼全身（+'+(S.eqLv||0)+' → +'+Math.min(10,(S.eqLv||0)+1)+'，'+fmtMoney(upEqCost())+' '+moneyName()+'）</button>'+
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
      '<div class="small muted">服食得灵气与状态；商行收购 '+fmtMoney(herbPrice(h.t))+' '+moneyName()+'/株</div></div>'+
      '<span><button class="btn jade" onclick="eatHerb(\''+id+'\')">服食(1行动)</button> '+
      '<button class="btn ghost" onclick="sellHerb(\''+id+'\',10)">售10</button></span></div>';
   }).join('')||'<p class="small muted">囊中空空。</p>')+
   (total>bagN?'<div style="text-align:center;margin:8px"><button class="btn ghost" onclick="bagN+=60;renderBagList()">显示更多</button></div>':'');
}
function renderStars(){
  const chips=STAR_STAGES.map((nm,k)=>'<span class="tag'+(starLvOf(starIdxAt(k))>k?' rank':'')+'">'+cnL(k)+'重·'+nm+'</span>').join(' ');
  const rows=STARS.map((st,i)=>{
    const fn=STAR_STAGES.length,lv=starLvOf(i),full=lv>=fn,opened=lv>0,isNext=i===starCnt();
    const realmOk=curR()>=st.reqR,orderOk=lv>0||isNext;
    const canFeed=!full&&realmOk&&orderOk;
    const have=S.starPow[i]||0,used=S.starUsed[i]||0,cur=have-used;
    const need=starNeed(i,Math.min(lv,fn-1));
    const qiPer=Math.floor(layerCost()*st.qiMul*Math.min(lv+1,fn)/fn);
    const stPer=Math.floor(st.stones*Math.min(lv+1,fn)/fn);
    const anyPill=STAR_PILL_Q.some((Q,q)=>(S.pills[starPillId(i,q)]||0)>0);
    const autoOk=canFeed&&anyPill;
    const btns=full?'':STAR_PILL_Q.map((Q,q)=>{
      const h=S.pills[starPillId(i,q)]||0;
      return '<button class="btn ghost" '+(canFeed&&h>0?'':'disabled')+' onclick="condenseStar('+i+','+q+')">'+(q?Q.s:'普通')+'·'+st.name+'丹 x'+h+'<span class="small muted">（丹力 '+pillPow(i,q)+'）</span></button>';
    }).join(' ');
    let body='';
    if(full){
      body='<div class="small muted">十三重凝星功成，星汉长明——此星神通已然翻倍。</div>';
    }else{
      body='<div class="bar slim" style="margin-top:4px"><i style="width:'+clamp(cur/need*100,0,100)+'%"></i><span>'+fmt(cur)+' / '+fmt(need)+' 丹力</span></div>'+
       '<div class="small muted">本重需求 '+fmt(need)+' 丹力（尚缺 '+fmt(Math.max(0,need-cur))+'）｜ 每跨一重：灵气 '+fmt(qiPer)+' ｜ '+moneyName()+' '+fmtMoney(stPer)+'（随重数渐增）'+(!realmOk?' ｜ 需 '+REALMS[st.reqR].name:'')+'</div>'+
       '<div class="small muted">星丹丹力：'+STAR_PILL_Q.map((Q,q)=>(q?Q.s:'普通')+' '+pillPow(i,q)).join(' · ')+'——品阶越高，丹力十倍而涨。</div>'+condstarHint(st,realmOk)+
       '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">'+btns+
       (autoOk?'<button class="btn big" onclick="autoCondense('+i+')">一键凝聚</button>':'')+'</div>';
    }
    return '<div class="row-item"><div class="info"><div class="nm">'+st.name+' · '+st.alias+
     (full?'<span class="tag rank">大圆满</span>':(opened?'<span class="tag rank">第 '+cnL(lv-1)+' 重·'+STAR_STAGES[lv-1]+'</span>':(isNext?'<span class="tag">下一星</span>':'<span class="tag no">待前置</span>')))+
     '</div>'+
     '<div class="small muted">'+(st.d||'')+'</div>'+
     (opened?'<div class="small">神通当前：<b class="gold">'+starFxTxt(st,lv)+'</b>'+(full?'':'（每重递增，大圆满翻倍）')+'</div>':'')+body+
     '</div></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2"><div class="panel" style="text-align:center">'+
   '<h3>九星秘藏 · 凝星</h3>'+starWheelSvg()+
   '<p class="small muted">九星皆需以专属「星丹」凝聚：炼丹页参悟九张凝星丹方，丹成品阶随机。<br>星丹化丹力灌入星窍：每一重都需海量丹力——星与星之间十倍而涨，重与重之间一倍半而涨。<br>成星乃毕生之功：普通 1 · 上品 4 · 特品 16 · 完美 64 · 神丹 256 · 巨丹 1024 丹力。</p>'+
   '<hr class="hr"><h3 class="small">凝星十三重</h3><div style="line-height:2">'+chips+'</div></div>'+
   '<div class="panel"><h3>凝星之路</h3>'+rows+
   '<hr class="hr"><p class="small">每星凝至十三重「星汉圆满」，该星神通翻倍；每凝一重，神通即时递增。九星归位：霸体觉醒。</p>'+
   '</div></div>';
}
function starIdxAt(k){ // 第 k 重进度对应的「最高的已达星」索引（用于十三重题头点亮）
  for(let i=STARS.length-1;i>=0;i--)if(starLvOf(i)>k)return i;
  return -1;
}
function condstarHint(st,realmOk){
  if(!realmOk)return '<div class="small muted">需 '+REALMS[st.reqR].name+'</div>';
  return '<div class="small muted">丹方「'+st.name+'丹」：炼丹页参悟炼制</div>';
}
/* ---------------- 武功阁：战技 + 功法（购买 / 装配 / 运功） ---------------- */
let wgsTier=0,wgsN=40,wgfTier=0,wgfN=40;
function wgsFilter(t){wgsTier=t;wgsN=40;renderWugong();}
function wgfFilter(t){wgfTier=t;wgfN=40;renderWugong();}
function renderWugong(){
  const tiers=[0,1,2,3,4,5,6,7,8,9,10];
  const chips=(cur,fn)=>'<div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0">'+tiers.map(t=>'<button class="btn'+(cur===t?'':' ghost')+'" onclick="'+fn+'('+t+')">'+(t?(SK_TIER[t-1]||t):'全部')+'</button>').join('')+'</div>';
  const skList=SKILLS.filter(s=>(!wgsTier||s.tier===wgsTier)).sort((a,b)=>a.tier-b.tier||b.mult-a.mult);
  const skRows=skList.slice(0,wgsN).map(sk=>{
    const own=!!S.sk.own[sk.id],inBar=S.sk.load.includes(sk.id);
    const req=sk.req&&sk.req.realm?REALMS[sk.req.realm].name:'';
    const locked=!own&&!skillOk(sk);
    let act='';
    if(own)act='<button class="btn'+(inBar?' ghost':'')+'" onclick="toggleSkl(\''+sk.id+'\')">'+(inBar?'卸下':'装配')+'</button>';
    else if(sk.src==='quest')act='<span class="tag rank">剧情传承</span>';
    else if(sk.src==='sect')act='<span class="tag rank">贡献阁兑换</span>';
    else act='<button class="btn'+(locked?' ghost':'')+'" '+(locked?'disabled':'')+' onclick="buySkill(\''+sk.id+'\')">'+fmtMoney(skillPrice(sk))+' '+moneyName()+'</button>';
    return '<div class="row-item"><div class="info"><div class="nm">'+sk.name+'<span class="tag">'+(SK_TIER[sk.tier-1]||'')+'</span>'+(own?'<span class="tag rank">已习</span>':'')+(inBar?'<span class="tag">栏中</span>':'')+(locked&&!own?'<span class="tag no">'+req+'</span>':'')+'</div>'+
     '<div class="small muted">'+sk.d+'</div>'+
     '<div class="small">威 x'+(sk.effect==='stars'?(2+0.9*starCnt()).toFixed(1):sk.mult)+' ｜ 灵力 '+sk.qi+' ｜ 冷却 '+sk.cd+'</div></div>'+
     '<div>'+act+'</div></div>';
  }).join('');
  const gfList=GONGFAS.filter(g=>(!wgfTier||g.tier===wgfTier)).sort((a,b)=>a.tier-b.tier||((a.floor||999)-(b.floor||999)));
  const gfRows=gfList.slice(0,wgfN).map(g=>{
    const own=!!S.gf.own[g.id],on=S.gf.on.indexOf(g.id)>=0;
    const locked=!own&&(g.reqR||0)>curR();
    let act='';
    if(own)act='<button class="btn'+(on?' ghost':'')+'" onclick="equipGf(\''+g.id+'\')">'+(on?'收功':'运功')+'</button>';
    else if(g.src==='quest')act='<span class="tag rank">剧情传承</span>';
    else if(g.src==='sect')act='<span class="tag rank">贡献阁兑换</span>';
    else if(g.floor)act='<span class="tag no">九星塔 · 第 '+g.floor+' 层</span>';
    else act='<button class="btn'+(locked?' ghost':'')+'" '+(locked?'disabled':'')+' onclick="buyGf(\''+g.id+'\')">'+fmtMoney(g.price||0)+' '+moneyName()+'</button>';
    return '<div class="row-item"><div class="info"><div class="nm">'+g.name+'<span class="tag">'+(SK_TIER[g.tier-1]||'')+'</span>'+(g.kind==='body'?'<span class="tag rank">练体</span>':'')+(own?'<span class="tag rank">已修</span>':'')+(on?'<span class="tag">运功中</span>':'')+(locked&&!own?'<span class="tag no">需 '+REALMS[g.reqR].name+'</span>':'')+'</div>'+
     '<div class="small muted">'+g.d+'</div>'+
     '<div class="small">加成：'+gfFxTxt(g.fx)+'</div></div>'+
     '<div>'+act+'</div></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2">'+
   '<div class="panel"><h3>战技（栏位 '+S.sk.load.length+'/6）</h3>'+
   '<p class="small muted">装配入栏方可于战斗中施展，自动战斗亦只用栏中战技；开天七式随剧情与境界逐式传承，灭世火莲藏于仙界机缘。</p>'+chips(wgsTier,'wgsFilter')+skRows+
   (skList.length>wgsN?'<div style="text-align:center;margin:8px"><button class="btn ghost" onclick="wgsN+=40;renderWugong()">显示更多（余 '+(skList.length-wgsN)+' 式）</button></div>':'')+
   '</div>'+
   '<div class="panel"><h3>功法（运功 '+S.gf.on.length+'/'+gfSlots()+' 槽）</h3>'+
   '<p class="small muted">境界每进四重多一运功槽，多部功法可同修并济；九星塔里程碑与剧情所授者，传功阁中不售。</p>'+chips(wgfTier,'wgfFilter')+gfRows+
   (gfList.length>wgfN?'<div style="text-align:center;margin:8px"><button class="btn ghost" onclick="wgfN+=40;renderWugong()">显示更多（余 '+(gfList.length-wgfN)+' 部）</button></div>':'')+
   '</div></div>';
}
/* ---------------- 宗门页：一百零八分宗 ---------------- */
function renderSect(){
  ensureSectDaily();
  if(!sectOpened()){
    $('main').innerHTML='<div class="panel"><h3>玄天道宗 · 第108分宗</h3><p class="small muted">尚无宗门在册。踏入凝血之境（'+REALMS[1].name+'），剧情「拜入玄天道宗」开启后，你将入册执掌第36分宗辖下最末的第108分宗——这一百零八分宗是天宗最弱的一脉，第1分宗也不过辟海境。</p></div>';
    return;
  }
  const rank=S.sect.rank,prog=sectProg(),pct=Math.round(prog/107*100);
  const ti=SECT_TITLES[S.sect.title||0],nx=SECT_TITLES[(S.sect.title||0)+1];
  const fxD=['修炼 +'+Math.round((sectFx('qps')+sectTitleFx('qps'))*100)+'%','全属性 +'+Math.round(sectFx('all')*100)+'%','灵气上限 +'+Math.round(sectFx('cap')*100)+'%','掉落 +'+Math.round((sectFx('drop')+sectTitleFx('drop'))*100)+'%','所得 +'+Math.round(sectFx('gain')*100)+'%'];
  const qs=S.sect.qs.map((qi,i)=>{
    const t=SECT_TASKS[qi],done=S.sect.done[i];
    return '<div class="row-item"><div class="info"><div class="nm">'+t.n+'<span class="tag">'+(done?'已完成':S.sect.prog[i]+' / '+S.sect.cnt[i])+'</span></div>'+
     '<div class="small muted">'+t.txt(S.sect.cnt[i])+' ｜ 奖：贡献 +'+S.sect.rw[i]+'、'+moneyName()+'若干</div></div>'+
     '<div>'+(done?'<span class="tag rank">已领赏</span>':'<span class="tag no">进行中</span>')+'</div></div>';
  }).join('');
  const shop=SECT_SHOP.map(it=>{
    const ok=S.sect.contrib>=it.cost&&(!it.reqTitle||(S.sect.title||0)>=it.reqTitle);
    return '<div class="row-item"><div class="info"><div class="nm">'+it.n+(it.reqTitle?'<span class="tag no">需 '+SECT_TITLES[it.reqTitle].n+'</span>':'')+'</div>'+
     '<div class="small muted">'+it.d+'</div></div>'+
     '<div><button class="btn'+(ok?'':' ghost')+'" '+(ok?'':'disabled')+' onclick="buySectItem(\''+it.id+'\')">贡献 '+it.cost+'</button></div></div>';
  }).join('');
  $('main').innerHTML='<div class="grid2">'+
   '<div class="panel"><h3>玄天道宗 · 第'+rank+'分宗「'+sectBranchAlias(rank)+'」'+(rank===1?'<span class="tag rank">天下第一分宗</span>':'')+'</h3>'+
   '<div class="bar slim"><i style="width:'+pct+'%"></i><span>爬升进度 '+prog+' / 107（第108 → 第1）</span></div>'+
   '<div class="small muted">职位：<b class="gold">'+ti.n+'</b>（'+ti.d+'）｜ 生涯：升位 '+S.sect.wins+' 胜 · 切磋 '+S.sect.spars+' 场</div>'+
   '<div class="small">宗门气运：'+fxD.map(x=>'<span class="tag">'+x+'</span>').join(' ')+'</div>'+
   '<hr class="hr"><h4 class="small">升位战 <span class="small muted">（耗 2 行动点 · 挑战上一名分宗守擂弟子，胜则互换名次）</span></h4>'+
   (rank<=1?'<p class="small gold">一百零七战功成——第108分宗已是天宗第一分宗，总宗来使已至：「入总宗听旨。」（总宗篇章 · 后续开启）</p>':
    '<button class="btn big" onclick="startSectPromo()">挑战第'+(rank-1)+'分宗（守擂弟子 · '+REALMS[sectEnemyR(rank-1)].name+'）</button>')+
   '<h4 class="small" style="margin-top:8px">同门切磋 <span class="small muted">（耗 1 行动点 · 胜得贡献，败无损失）</span></h4>'+
   '<button class="btn" onclick="startSectSpar()">切磋一场</button>'+
   '<hr class="hr"><h4 class="small">职位晋升</h4>'+
   (nx?'<div class="row-item"><div class="info"><div class="nm">'+nx.n+'</div><div class="small muted">'+nx.d+' ｜ 需累计贡献 '+nx.need+'（现有 '+S.sect.contrib+'）</div></div>'+
    '<div><button class="btn'+(S.sect.contrib>=nx.need?'':' ghost')+'" '+(S.sect.contrib>=nx.need?'':'disabled')+' onclick="promoteTitle()">晋升</button></div></div>'
   :'<p class="small gold">分宗首席——一人之下的位置，其实早已一人之上。</p>')+
   '</div>'+
   '<div class="panel"><h3>门派任务 <span class="small muted">（每日刷新 · 与悬赏并行）</span></h3>'+qs+
   '<hr class="hr"><h3>贡献阁 <span class="small muted">（贡献 '+S.sect.contrib+'）</span></h3>'+shop+
   '<p class="small muted">分宗藏经独一份：玄天罡气诀、玄天十三剑、玄天道经、玄天镇狱拳——皆以贡献兑换，他处无售。</p>'+
   '</div></div>';
}
/* ---------------- 练体页：肉身九秘 + 人物属性 ---------------- */
function renderBody(){
  const st=heroStats(),sec=st.sec;
  const cur=bodyCur();
  const rows=BODY_STAGES.map((sg,i)=>{
    const lv=(S.body.lv[i]||0),done=lv>=BODY_MAX_LV,active=cur&&cur.i===i;
    let inner='';
    if(active){
      const cost=bodyCostNow();
      inner='<div class="small muted">下一重需：灵气 '+fmt(cost.qi)+' ｜ '+moneyName()+' '+fmtMoney(cost.st)+(cost.sh?' ｜ 兽核 '+cost.sh+' 枚':'')+'（不耗行动点）</div>'+
       '<button class="btn big" onclick="temperBody()">'+sg.n+' · 淬炼第 '+cnL(lv+1)+' 重</button>';
    }
    return '<div class="row-item"><div class="info"><div class="nm">'+sg.st+' · '+sg.n+
     (done?'<span class="tag rank">十重圆满</span>':(active?'<span class="tag">淬炼中 · 第 '+cnL(lv)+' 重</span>':'<span class="tag no">待前置</span>'))+'</div>'+
     '<div class="small muted">'+sg.d+'</div>'+(active?inner:'')+'</div></div>';
  }).join('');
  const btRows=GONGFAS.filter(g=>g.kind==='body').sort((a,b)=>a.tier-b.tier).map(g=>{
    const own=!!S.gf.own[g.id],on=S.gf.on.indexOf(g.id)>=0;
    const locked=!own&&(g.reqR||0)>curR();
    let act='';
    if(own)act='<button class="btn'+(on?' ghost':'')+'" onclick="equipGf(\''+g.id+'\')">'+(on?'收功':'运功')+'</button>';
    else if(g.src==='sect')act='<span class="tag rank">贡献阁兑换</span>';
    else act='<button class="btn'+(locked?' ghost':'')+'" '+(locked?'disabled':'')+' onclick="buyGf(\''+g.id+'\')">'+fmtMoney(g.price||0)+' '+moneyName()+'</button>';
    return '<div class="row-item"><div class="info"><div class="nm">'+g.name+'<span class="tag">'+(SK_TIER[g.tier-1]||'')+'</span>'+(own?'<span class="tag rank">已修</span>':'')+(on?'<span class="tag">运功中</span>':'')+(locked&&!own?'<span class="tag no">需 '+REALMS[g.reqR].name+'</span>':'')+'</div>'+
     '<div class="small muted">'+g.d+'</div><div class="small">加成：'+gfFxTxt(g.fx)+'</div></div>'+
     '<div>'+act+'</div></div>';
  }).join('');
  const spdPct=Math.min(25,sec.spd*2.5);
  const statIt=(k,v,d)=>'<div class="row-item"><div class="info"><div class="nm">'+k+'</div><div class="small muted">'+d+'</div></div><div><b class="gold">'+v+'</b></div></div>';
  const statPanel='<div class="panel"><h3>人物属性 · 八维战体系</h3>'+
   statIt('攻击 / 防御 / 气血',fmt(st.atk)+' / '+fmt(st.def)+' / '+fmt(st.hp),'根基三围：受攻击、防御、气血全加成放大')+
   statIt('暴击 / 暴伤',Math.round(sec.crit*100)+'% / x'+sec.cdmg.toFixed(2),'通髓所开：暴击时伤害成倍迸发')+
   statIt('闪避',Math.round(sec.dodge*100)+'%','开窍所化：身形难测，避开敌方扑击')+
   statIt('吸血',Math.round(sec.leech*100)+'%','沸血所养：伤敌一分，自愈一分')+
   statIt('速度',sec.spd.toFixed(0)+'（追击 '+spdPct+'%）','伸筋所伸：身法快到极致可追击一记')+
   statIt('穿透',Math.round(sec.pen*100)+'%','罡气所至：无视敌方部分防御')+
   statIt('再生',Math.round(sec.regen*100)+'% / 回合','洗脏所得：五脏如鼎，气血自生')+
   statIt('反震',Math.round(sec.thorns*100)+'%','罡气所震：受击反噬敌人')+
   '</div>';
  $('main').innerHTML='<div class="grid2">'+
   statPanel+
   '<div><div class="panel"><h3>肉身九秘 · 淬体（'+bodyTotal()+' / 90 重）</h3>'+
   '<p class="small muted">外炼筋骨皮，内炼脏髓血窍罡——九秘依序而开，每秘十重。淬体耗灵气与'+moneyName()+'（四秘「脏」之后另耗兽核），不耗行动点；练体所得的攻防气血与八维属性，永久生效。</p>'+
   rows+'</div>'+
   '<div class="panel"><h3>练体功法（外炼之学 · 可与内功同修）</h3>'+btRows+
   '<p class="small muted">练体功法入运功槽即生效，与内功并用；玄罡不坏体为玄天道宗秘藏，分宗贡献阁有售。</p></div></div>'+
   '</div>';
}
/* ---------------- 每日悬赏面板 / 九星塔页 / 图鉴页 ---------------- */
function dailyPanelHtml(){
  ensureDaily();
  const D=S.daily;
  const rows=D.qs.map((qi,i)=>{
    const t=DAILY_TYPES[qi],p=D.prog[i],n=D.cnt[i];
    return '<div class="row-item"><div class="info"><div class="nm">'+t.n+' <span class="small muted">'+t.txt(n)+'</span></div>'+
     '<div class="bar slim" style="margin-top:3px"><i style="width:'+clamp(p/n*100,0,100)+'%"></i><span>'+p+' / '+n+(D.done[i]?' ✓':'')+'</span></div>'+
     '<div class="small muted">赏：'+moneyName()+' '+fmtMoney(D.rw[i])+' + 修为与随机丹药</div></div></div>';
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
   '<p class="small muted">胜则上一层，得'+moneyName()+'与修为；败则原地歇息，再战不迟。</p></div>'+
   '</div><div>'+
   '<div class="panel"><h3>功法（运功 '+S.gf.on.length+'/'+gfSlots()+' 槽 · 全录见武功阁）</h3>'+
   GONGFAS.map(g=>{
     const own=!!S.gf.own[g.id],on=S.gf.on.indexOf(g.id)>=0;
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
   '<div class="panel"><h3>战技 · 功法</h3>'+
   '<p class="small">已习战技 <b class="gold">'+Object.keys(S.sk.own).length+'</b> / '+SKILLS.length+' 式 ｜ 战技栏 <b>'+S.sk.load.length+'/6</b> ｜ 已修功法 <b class="gold">'+Object.keys(S.gf.own).length+'</b> / '+GONGFAS.length+' 部 ｜ 运功 <b>'+S.gf.on.length+'/'+gfSlots()+'</b> 槽</p>'+
   '<p class="small muted">武学宝库浩如烟海：开天七式随境界逐式传承，大梵天经三卷与灭世火莲藏于秘缘；传功阁中更有两百余式战技、两百余部功法，以'+moneyName()+'购求。</p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" onclick="showTab(\'wugong\')">进入武功阁</button></div></div>'+
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
  else if(curTab==='wugong')renderWugong();
  else if(curTab==='sect')renderSect();
  else if(curTab==='body')renderBody();
  else if(curTab==='soc')renderSoc();
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
    if(!special&&!(r===3&&S.bones<BONES_REQ[l])){
      const cdef=CONDENSE[r];
      if(cdef&&cnd().n<cdef.n){if(S.qi>=condCost()){S.qi-=condCost();cnd().n++;}}
      else if(S.qi>=layerCost())tryBreak();
    }
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
