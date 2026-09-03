/* 无头冒烟测试：node test/smoke.js */
const fs=require('fs');
const path=require('path');
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
const data=fs.readFileSync(path.join(__dirname,'..','js','data.js'),'utf8');
const data2=fs.readFileSync(path.join(__dirname,'..','js','data2.js'),'utf8');
const social=fs.readFileSync(path.join(__dirname,'..','js','social.js'),'utf8');
const game=fs.readFileSync(path.join(__dirname,'..','js','game.js'),'utf8');
const test=`
function assert(c,msg){ if(!c) throw new Error('断言失败: '+msg); }

/* ========== 阶段一：全境界流程 ========== */
S=newState();
S.ap=999999;
assert(REALMS.length===22,'应有22个大境界');
assert(MAXG()===285,'总层数应为285');
const realRandom=Math.random;
Math.random=()=>0.01;
let guard=0;
while(S.g<MAXG() && guard++<100000){
  const r=curR(), l=curL();
  if(r===3 && S.bones<BONES_REQ[l]){ S.pills.jigu=1; refineBone(); continue; }
  if(l===12){
    if(r+1===8) S.pills.xuandan=1;
    if(r+1===11) S.pills.shengsi=1;
    if(r+1===14) S.pills.shenhuo=1;
  }
  const b=S.g;
  S.qi=layerCost()*10;
  tryBreak();
  if(S.g===b){
    if(P&&P.type==='fire'){ S.pills.shenhuo=1; chooseFireSeed('雷'); continue; }
    if(P&&P.type==='sijie'){ resolveSijie([0,1,2,3]); continue; }
    throw new Error('tryBreak 未推进: g='+S.g+' r='+r+' l='+l);
  }
}
assert(S.g===MAXG(),'应修至285层, 实际 '+S.g);
assert(S.flags.fireSeed,'神火之种应已点燃');
assert(S.flags.sijie>0,'四极择符应已完成');
assert(S.bones>=31,'锻骨应祭炼31根以上, 实际 '+S.bones);
assert(S.flags.mingxing,'命星境应已触发');
assert(S.flags.pearl===1,'凝血境后混沌珠应已获得');
Math.random=realRandom;

/* —— 全区域战斗 —— */
S.flags.sect=1;S.ap=999999;
for(const z of ZONES){
  if(z.sect)S.flags.sect=1;
  assert(zoneUnlocked(z),'区域应解锁: '+z.name);
  for(let i=0;i<z.enemies.length;i++){
    startBattle(z.id,i);
    assert(B!==null,'战斗应已开始: '+z.id+' #'+i);
    let n=0;
    while(B&&!B.over&&n++<500)useSkill('bati');
    assert(B.over===true,'战斗应结束: '+z.id+' #'+i);
    assert((S.kills[z.id+':'+i]||0)>0,'击杀应被记录: '+z.id+' #'+i);
    B=null;
  }
}
assert((S.kills['xingkong:2']||0)>0,'终局首领应被击杀');
assert(S.flags.won===1,'应达成通关标记');

/* —— 炼丹 / 开星 —— */
S.herbs.lingcao=100;S.herbs.xuecao=100;S.herbs.ziling=100;S.mats.shouhe=100;S.danExp=300;
Math.random=()=>0.01;
const exp0=S.danExp;
for(let i=0;i<30;i++)craft('huiqi');
assert(S.danExp>exp0,'炼丹应获得阅历');
assert((S.pills.huiqi||0)>0,'应有丹药产出');
S.stones=1e12;S.qi=1e60;
for(let i=0;i<9;i++){S.pills['star'+i+'_5']=15;autoCondense(i);}
assert(starCnt()===9,'九星应全部开启, 实际 '+starCnt());
Math.random=realRandom;

/* —— 采药 —— */
S.expCd={};S.ap=999;
const h0=S.herbs.lingcao||0;
explore('fengming');
assert((S.herbs.lingcao||0)>h0,'采药应获得灵草');

/* ========== 阶段二：日程 / 混沌珠 / 华云商行 ========== */
S=newState();
S.stones=1e12;
S.flags.pearl=1;S.flags.sect=1;

/* —— 日程 —— */
assert(S.day===1,'初始第1日');
assert(S.ap===apMax(0),'初始行动点应为22');
const ap0=S.ap;
explore('fengming');
assert(S.ap===ap0-1,'采药应消耗1行动点');
S.expCd={};
startBattle('fengming',0);
assert(S.ap===ap0-3,'出战应消耗2行动点');
B=null;
S.expCd={};
const apNow=S.ap;
craft('huiqi');
assert(S.ap===apNow,'材料不足时不应扣行动点');
S.herbs.lingcao=100;S.danExp=300;
craft('huiqi');
assert(S.ap===apNow-1,'炼丹应消耗1行动点');

/* —— 状态与行动点恢复 —— */
S.cond=40;nextDay();
assert(S.day===2,'应进入第2日');
assert(S.ap===apMax(curR()),'行动点应回满');
assert(S.cond===48,'无树时状态应+8, 实际 '+S.cond);

/* —— 混沌珠：灵植 —— */
const hbase=S.herbs.lingcao||0;
plantHerb('lingcao');
assert(S.pearl.plants.length===1,'种植后应有1株灵植');
nextDay();
harvestPlant(0);
assert((S.herbs.lingcao||0)===hbase+3,'灵草1日熟收3株, 实际 '+(S.herbs.lingcao-hbase));

/* —— 混沌神树 —— */
S.pearl.trees=[];
plantTree();plantTree();
assert(livingTrees()===2,'植树后应2株存活');
S.pearl.trees[0].vigor=30;
waterTrees();
assert(S.pearl.trees[0].vigor===55,'浇灌应+25茂盛');
S.pearl.trees[1].vigor=24;
nextDay();
assert(S.pearl.trees[1].dead===1,'茂盛耗尽应枯萎');
assert(livingTrees()===1,'枯萎后应剩1株存活');
const c0=S.cond;
nextDay();
assert(S.cond>c0,'有树时过夜应回复状态');
S.pearl.trees.forEach(t=>{t.dead=1;});
const c1=S.cond;
nextDay();
assert(S.cond===Math.min(100,c1+8),'神树尽枯时每日仅+8（缓慢回复）, 实际 '+(S.cond-c1));
breatheTrees();
assert(S.cond===Math.min(100,c1+8),'无活树时吐纳应无效');
S.stones=1e12;
reviveTree(0);
assert(S.pearl.trees[0].dead===0,'复苏应救回枯树');

/* —— 灵兽产出 —— */
S.pearl.beasts=[{t:'langbei'},{t:'niubei'},{t:'fengqun'}];
const s0=S.stones,l0=S.herbs.lingcao||0,core0=S.mats.shouhe||0;
nextDay();
assert(S.stones>s0,'灵牛崽应产灵石');
assert((S.herbs.lingcao||0)>l0,'玉蜂群应产灵草');
assert(S.mats.shouhe>core0,'灵狼崽应产兽核');

/* —— 华云商行 —— */
S.herbs.lingcao=50;S.mats.shouhe=20;S.pills.huiqi=5;
const s1=S.stones;
sellHerb('lingcao',10);
assert(S.stones>s1,'售药材应得灵石');
const s2=S.stones;
sellCore(5);
assert(S.stones>s2,'售兽核应得灵石');
const s3=S.stones;
sellPill('huiqi',2);
assert(S.stones>s3,'售丹药应得灵石');
buy('jigu');
assert((S.pills.jigu||0)>0,'商行应可购买祭骨丹');
buyBeast('fengqun');
assert(S.pearl.beasts.length===4,'应可购买灵兽');

/* —— 状态联动 —— */
S.cond=100;
const q100=qps(),a100=heroStats().atk;
S.cond=20;
const q20=qps(),a20=heroStats().atk;
assert(q20<q100&&a20<a100,'低状态应削弱修炼与战斗');

/* —— 渲染冒烟（珠内 / 商行等页面） —— */
curTab='pearl';renderAll();
curTab='market';renderAll();
curTab='bag';renderAll();
curTab='realms';renderAll();
curTab='cult';renderAll();

/* —— 存档往返（v1 旧档升级 v2） —— */
save();
S.v=1;const dump=JSON.stringify(S);
localStorage.getItem=k=>dump;
S=load();
assert(S&&S.v===2,'旧档应升级为 v2, 实际 '+(S&&S.v));
assert(S.pearl&&typeof S.pearl.trees==='object','旧档迁移应有混沌珠默认结构');
assert(S.day>=1,'旧档迁移应保留天数');

/* ========== 阶段三：大千世界（千种灵植 / 300+ 丹方 / 45 地图） ========== */
Math.random=()=>0.01; // 固定随机：成功率判定必成
assert(Object.keys(HERBS).length>=1000,'灵植应≥1000种, 实际 '+Object.keys(HERBS).length);
assert(Object.keys(PILLS).length>=300,'丹药应≥300种, 实际 '+Object.keys(PILLS).length);
assert(RECIPES.length>=300,'丹方应≥300张, 实际 '+RECIPES.length);
assert(ZONES.length>=40,'地图应≥40张, 实际 '+ZONES.length);
for(let r=0;r<REALMS.length;r++){
  const n=ZONES.filter(z=>z.reqR===r&&!z.sect).length;
  assert(n===2,'每境界应恰有2幅可选地图: r='+r+' 实际 '+n);
}
assert(new Set(Object.keys(HERBS)).size===Object.keys(HERBS).length,'灵植 id 应无重复');
for(const rc of RECIPES){
  assert(DAN_RANKS[rc.rank]!==undefined,'丹方位阶应合法: '+rc.id);
  assert((rc.reqR||0)<=21,'丹方境界需求应合法: '+rc.id);
  if(rc.matsGE)for(const sp of rc.matsGE)
    assert(HERBS_BY_TIER[sp.t]&&HERBS_BY_TIER[sp.t].length,'丹方 '+rc.id+' 需 '+sp.t+' 品灵植，药池应覆盖');
}
/* —— 新式丹方炼制（按品阶取药，低阶先耗） —— */
S=newState();
const genId=HERBS_BY_TIER[2][0];
S.herbs[genId]=50;S.danExp=1e9;S.ap=99;
assert(danRankIdx()===9,'阅历百万应至丹帝');
const rc2=RECIPES.find(r=>r.matsGE&&(r.reqR||0)===0&&r.rank===0);
assert(rc2,'应存在入门新式丹方');
craft(rc2.id);
assert((S.pills[rc2.out]||0)===1,'新式丹方应炼成: '+rc2.id);
assert(S.herbs[genId]===47,'应消耗3株灵植, 实余 '+S.herbs[genId]);
/* —— 丹方双重解锁（位阶 + 修为境界） —— */
const rcHi=RECIPES.find(r=>(r.reqR||0)>=5);
assert(rcHi,'应存在高境界丹方');
S.danExp=1e9;
assert(danRankIdx()>=rcHi.rank&&curR()<rcHi.reqR&&!recipeUnlocked(rcHi),'境界不足时丹方应未解锁');
S.g=rcHi.reqR*LAYER_CNT;
assert(recipeUnlocked(rcHi),'修为到位后丹方应解锁');
/* —— 丹药各家族服用生效 —— */
S=newState();S.ap=99;S.cond=50;
const famRead={qpsb:()=>(S.buffs.qps&&S.buffs.qps.m)||0,cond:()=>S.cond,qi:()=>S.qi,danxp:()=>S.danExp,ap:()=>S.ap,perm:()=>S.xiusui,hp:()=>S.perm.hp,atk:()=>S.perm.atk,def:()=>S.perm.def};
for(const f in famRead){
  const pid=Object.keys(PILLS).find(k=>PILLS[k].f===f&&PILLS[k].m!==undefined);
  assert(pid,'应存在「'+f+'」家族丹药');
  S.pills[pid]=3;
  if(f==='qi')S.qi=0;
  const before=famRead[f]();
  usePill(pid);
  assert(famRead[f]()>before,'服用'+PILLS[pid].n+'应提升 '+f);
}
/* —— 回气系：战斗中服用 —— */
const hpid=Object.keys(PILLS).find(k=>PILLS[k].f==='heal');
S.pills[hpid]=2;
startBattle(ZONES[0].id,0);
B.php=Math.floor(B.pmax*0.2);
const hpB=B.php;
usePill(hpid);
assert(B.php>hpB,'回气系丹药战斗中应恢复气血');
/* —— 护命系：重伤自动保命 —— */
const spid=Object.keys(PILLS).find(k=>PILLS[k].f==='save');
assert(spid,'应存在护命系丹药');
S.pills[spid]=1;
B.php=1;
enemyTurn();
assert(!B.over&&B.php>=1,'重伤时应自动服用护命丹');
B=null;
/* —— 破境系：bestPillOf 选取 —— */
const bpid=Object.keys(PILLS).find(k=>PILLS[k].f==='break');
S.pills[bpid]=1;
assert(bestPillOf('break')===bpid,'bestPillOf 应选中破境系丹药');
/* —— 服食灵植 —— */
S=newState();
const eid=HERBS_BY_TIER[3][0];
S.herbs[eid]=5;S.ap=10;S.cond=50;S.qi=0;
eatHerb(eid);
assert(S.herbs[eid]===4,'服食应消耗1株');
assert(S.qi>0&&S.ap===9,'服食应得灵气并耗1行动点, 实际 ap='+S.ap);
/* —— 按品阶整批出售 —— */
const t3id=HERBS_BY_TIER[3][1];
S.herbs[t3id]=20;
const st0=S.stones;
sellHerbsTier(3,5);
assert(S.stones>st0,'整批出售应得灵石');
assert(S.herbs[t3id]===5,'留5株应各留5株, 实余 '+S.herbs[t3id]);
/* —— 生成地图：采药品阶区间 + 战斗 —— */
S.ap=999;S.expCd={};
const gz=ZONES.find(z=>/^z\\d+$/.test(z.id)&&z.reqR===0);
explore(gz.id);
assert(Object.keys(S.herbs).some(id=>HERBS[id].t>=gz.ht[0]&&HERBS[id].t<=gz.ht[1]),'生成地图采药应得品阶区间内灵植');
startBattle(gz.id,0);
let gn=0;
while(B&&!B.over&&gn++<500)useSkill('bati');
assert(B.over,'生成地图小怪战应可完成');
S.g=12; // 凝血十二层挑战首领
startBattle(gz.id,2);
let bn=0;
while(B&&!B.over&&bn++<500)useSkill('bati');
assert(B.over&&B.php>0,'凝血十二层应可胜生成地图首领');
B=null;
/* —— 渲染冒烟：新页面 —— */
curTab='hunt';renderAll();
curTab='alchemy';renderAll();
curTab='pearl';renderAll();
curTab='bag';renderAll();
renderAlchList();renderBagList();

/* ========== 阶段四：每日修为上限 / 九星塔 / 功法 / 词缀 / 成就 / 悬赏 ========== */
S=newState();
/* —— 每日修为上限 —— */
const cap0=qiCap();
assert(cap0>0,'每日修为上限应为正: '+cap0);
const mq0=S.qi;
addQi(cap0*10,'test');
assert(S.qi-mq0===cap0,'超限时只应获得上限值');
assert(S.qiToday===cap0,'今日修为应等于上限');
assert(addQi(100,'test')===0,'满上限后不应再增长');
assert(qiLeft()===0,'余量应为0');
S.qiToday=0;S.flags.qiCapped=0;
/* —— 九星塔 / 功法 —— */
S.ap=999;
const tb0=S.towerBest||0;
for(let f=tb0+1;f<=6;f++){
  startTower();
  assert(B&&B.tower===f,'塔层应递进到 '+f);
  assert(B.e.noAfx,'塔怪不携带词缀');
  B.ehp=1;useSkill('bati');
  assert(B.over,'塔战应结束');
}
assert(S.towerBest===6,'应登至第6层');
assert(S.gf.own.gf1===1,'第5层应掉落长春功');
assert(S.gf.on.indexOf('gf1')>=0,'通关里程碑应自动运功');
const qpsOn=qps();
S.gf.on=[];
assert(qps()<qpsOn,'收功后修炼速度应下降');
equipGf('gf1');
assert(S.gf.on.indexOf('gf1')>=0,'应可重新运功');
assert(gfSlots()===1+Math.floor(curR()/4),'运功槽数应随境界增长');

/* —— 妖兽词缀 —— */
const rr=Math.random;Math.random=()=>0.01; // 必出词缀且恒为狂暴
startBattle('fengming',0,true);
assert(B.afx&&B.afx.id==='kuangbao','固定随机应出狂暴词缀');
B.ehp=1;useSkill('bati');
assert(B.over,'词缀怪应可正常击杀');
Math.random=rr;
/* —— 每日悬赏 —— */
ensureDaily();
assert(S.daily.qs.length===3,'应生成3条悬赏');
assert(S.daily.day===S.day,'悬赏日期应吻合');
const qsA=S.daily.qs.slice();
S.daily={day:0,qs:[],prog:[],done:[]};
ensureDaily();
assert(JSON.stringify(qsA)===JSON.stringify(S.daily.qs),'同日悬赏应确定不变');
if(S.daily.qs.map(q=>DAILY_TYPES[q].k).indexOf('kill')<0){
  S.daily.qs[0]=0;S.daily.prog[0]=0;S.daily.done[0]=0;
  S.daily.cnt[0]=dailyCount('kill',curR());S.daily.rw[0]=dailyReward('kill',curR());
}
const sd0=S.stones;
bumpDaily('kill',dailyCount('kill',curR()));
assert(S.stones>sd0,'完成悬赏应得灵石');
/* —— 成就 —— */
S.stat.kills=100;
checkAch();
assert(S.ach.a_k100===1,'击杀100成就应达成');
assert(S.stat.qiTotal>0,'累计修为应已统计');
assert(ACHS.length>=25,'成就应至少25条');

/* —— 装备强化 / 灵兽升级 / 图鉴 —— */
S.stones=1e9;
upgradeEq();
assert(S.eqLv===1,'强化应至+1');
assert(upEqCost()===4200,'强化费用应递增');
S.pearl.beasts=[{t:'fengqun',lv:1}];
const fid=HERBS_BY_TIER[1][0];
S.herbs[fid]=10;
feedBeast(0,fid);
assert(S.pearl.beasts[0].lv===2,'喂养应升到2阶');
assert(Object.keys(S.seen.h).length>0,'图鉴应有灵植收录');
/* —— 渲染冒烟：新页签 —— */
curTab='tower';renderAll();
curTab='codex';renderAll();
curTab='cult';renderAll();
curTab='bag';renderAll();
/* —— 次日重置 —— */
const yd=S.day;
nextDay();
assert(S.day===yd+1,'应进入次日');
assert(S.qiToday===0,'次日今日修为应清零');
assert(S.daily.day===S.day,'次日悬赏应换榜');
assert(S.ap===apMax(curR()),'次日行动点应回满');
assert(qiCap()>0,'次日上限应恢复可用');
/* ========== 阶段五：凝星丹力模型 / 货币与飞升 / 武功阁 ========== */
assert(Object.keys(PILLS).filter(k=>PILLS[k].f==='star').length===54,'凝星丹应有54枚');
assert(STAR_STAGES.length===13,'凝星应十三重');
assert(STAR_PILL_Q.length===6,'星丹应六等品阶');
assert(STAR_PILL_Q[5].pw===1024,'巨丹丹力应为1024');
assert(pillPow(0,0)===1&&pillPow(8,5)===5120,'星丹丹力应随星阶增强');
assert(starNeed(0,0)===10,'星0一重需10丹力');
assert(starNeed(8,0)>starNeed(0,0)*100,'星间需求应数千倍拉开');
assert(starNeed(0,12)>starNeed(0,0)*100,'每重需求应递增');
assert(SKILLS.length>=210,'战技应至少210式, 实际 '+SKILLS.length);
assert(GONGFAS.length>=212,'功法应至少212部, 实际 '+GONGFAS.length);
assert(SKILLS.filter(s=>s.src==='quest').length===8,'剧情战技应8式（开天七式+灭世火莲）');
assert(GONGFAS.filter(g=>g.src==='quest').length===3,'大梵天经应三卷');
assert(RECIPES.length===627,'丹方应627张, 实际 '+RECIPES.length);
/* —— 批量炼丹 —— */
S=newState();
S.herbs.lingcao=3000;S.danExp=1e9;S.ap=50;
craft('huiqi',100);
assert((S.pills.huiqi||0)>=1,'批量炼丹应有产出');
assert(S.ap===49,'一批炼丹只应耗1行动点, 实际 '+S.ap);
assert(S.stat.crafts>=100,'批量炼丹应按炉计数');
/* —— 凝星：星丹化丹力，海量丹药跨重 —— */
S=newState();
S.g=LAYER_CNT; // 凝血一层，风府星可凝
S.stones=1e12;S.qi=1e60;S.ap=999;S.danExp=1e9;
S.herbs[HERBS_BY_TIER[1][0]]=9999;S.herbs[HERBS_BY_TIER[2][0]]=9999;S.mats.shouhe=9999;
const rrr=Math.random;Math.random=()=>0.001; // 必成丹且必出巨丹
craft('r_star0');
assert((S.pills.star0_5||0)===1,'固定随机应出巨丹');
usePill('star0_5');
assert((S.pills.star0_5||0)===1,'凝星丹不可直接服用');
condenseStar(0,5);
assert(starLvOf(0)===9,'一枚巨丹应凭丹力凝至9重, 实际 '+starLvOf(0));
assert(starCnt()===1,'凝星应开星');
assert((S.starPow[0]-(S.starUsed[0]||0))>0,'丹力应有结转');
condenseStar(1,0);
assert(!S.starLv[1],'未依序凝聚应被拒');
S.pills.star0_5=2;
condenseStar(0,5);condenseStar(0,5); // 每次喂一枚，两枚巨丹跨三重
assert(starLvOf(0)===12,'应凝至12重, 实际 '+starLvOf(0));
S.pills.star0_5=3;
condenseStar(0,5);
assert(starLvOf(0)===13,'应凝至13重星汉圆满, 实际 '+starLvOf(0));
assert(Math.abs(starFx('qps')-0.5)<1e-9,'十三重神通应翻倍');
S.g=2*LAYER_CNT; // 玉衡星需辟海境
S.pills.star1_5=10;
autoCondense(1);
assert(starLvOf(1)===13,'一键凝聚应至星汉圆满, 实际 '+starLvOf(1));
Math.random=rrr;
S.g=11*LAYER_CNT;S.ap=999;
for(let i=2;i<9;i++){S.pills['star'+i+'_5']=15;autoCondense(i);}
assert(starCnt()===9,'九星应全部凝聚, 实际 '+starCnt());
checkAch();
assert(S.ach.a_st13===1,'星汉圆满成就应达成');
assert(S.ach.a_st9===1,'凝星九重成就应达成');
/* —— 货币与飞升 —— */
S.stones=5e7;
assert(moneyName()==='灵石','凡界应以灵石通行');
assert(fmtMoney(5e7).indexOf('上品')>=0,'大额灵石应显示上品');
assert(fmtMoney(500)==='500灵石','小额灵石应显示下品');
S.g=13*LAYER_CNT; // 蜕凡入仙
ascendNow();
assert(S.flags.ascend===1,'飞升标记应置位');
assert(S.stones===5000,'飞升应万灵石折一仙石, 实际 '+S.stones);
assert(isXian()&&moneyName()==='仙石','入仙界后应以仙石通行');
assert(fmtMoney(50000)==='50中品仙石','仙石亦分下中上极品');
/* —— 武功阁：战技栏 / 功法多槽 / 购买 —— */
S.stones=1e12;
grantSkill('kaitian1');
assert(S.sk.own.kaitian1===1&&S.sk.load.indexOf('kaitian1')>=0,'剧情战技应入栏');
grantGf('dafu1');
assert(S.gf.own.dafu1===1&&S.gf.on.indexOf('dafu1')>=0,'大梵天经应自动运功');
assert(gfFx('qps')>0,'功法加成应生效');
equipGf('dafu1');
assert(S.gf.on.indexOf('dafu1')<0,'应可收功');
equipGf('dafu1');
assert(S.gf.on.indexOf('dafu1')>=0,'应可重新运功');
const skBuy=SKILLS.filter(s=>s.src==='ge'&&s.req.realm<=curR()).sort((a,b)=>skillPrice(a)-skillPrice(b))[0];
buySkill(skBuy.id);
assert(S.sk.own[skBuy.id]===1,'应可购得传功阁战技: '+skBuy.id);
const gfBuy=GONGFAS.filter(g=>g.price&&g.reqR<=curR()).sort((a,b)=>a.price-b.price)[0];
buyGf(gfBuy.id);
assert(S.gf.own[gfBuy.id]===1,'应可购得传功阁功法: '+gfBuy.id);
checkQuests();
assert(S.quests.kaitian1===1&&S.quests.dafu1===1,'剧情任务应结算');
assert(QUESTS.length>=28,'剧情应至少28段, 实际 '+QUESTS.length);
startBattle('fengming',0);
let kn=0;
while(B&&!B.over&&kn++<500)useSkill('kaitian1');
assert(B&&B.over,'开天第一式应可胜野怪');
B=null;
curTab='wugong';renderAll();
curTab='stars';renderAll();
curTab='alchemy';renderAll();
curTab='codex';renderAll();
curTab='realms';renderAll();
/* ========== 阶段六：玄天道宗 · 一百零八分宗 ========== */
assert(SECT_TITLES.length===5,'职位应五级');
assert(SECT_SHOP.length===11,'贡献阁应十一项');
assert(SKILLS.filter(s=>s.src==='sect').length===2,'宗门战技应2式');
assert(GONGFAS.filter(g=>g.src==='sect').length===3,'宗门功法应3部');
assert(sectEnemyR(108)===1&&sectEnemyR(1)===6,'守擂弟子境界应凝血升至辟海封顶');
assert(sectEnemyR(58)===3,'守擂境界应中段取整');
assert(QUESTS.some(q=>q.id==='tianzong'),'应有拜入玄天道宗剧情');
S.flags.tianzong=1;
assert(sectOpened()&&sectProg()===0,'入册应自第108分宗起');
ensureSectDaily();
assert(S.sect.qs.length===3&&S.sect.cnt.length===3,'每日应有3条门派任务');
curTab='sect';renderAll(); // 未入册前预览
S.sect.day=S.day;S.sect.qs=[0,1,4];S.sect.prog=[0,0,0];S.sect.done=[0,0,0];
S.sect.cnt=[1,1,1];S.sect.rw=[60,60,60];
bumpSect('kill',1);bumpSect('explore',1);
assert(S.sect.done[0]===1&&S.sect.done[1]===1,'门派任务应完成领赏');
assert(S.sect.contrib===120,'任务贡献应到账, 实际 '+S.sect.contrib);
S.ap=99;
startSectSpar();
assert(B&&B.zid==='sect'&&B.sectMode==='spar','切磋应入战斗');
let g1=0;while(B&&!B.over&&g1++<900)basicAttack();
assert(B&&B.over&&S.sect.spars===1,'切磋胜应计数, spars='+S.sect.spars);
B=null;
const pr0=S.sect.rank;
startSectPromo();
assert(B&&B.sectMode==='promo'&&B.sectRank===pr0,'升位战应入战斗');
let g2=0;while(B&&!B.over&&g2++<900)basicAttack();
assert(B&&B.over&&S.sect.rank===pr0-1,'升位胜应前进一名, rank='+S.sect.rank);
B=null;
S.sect.contrib=200;const hp0=S.pills.huiqi||0;
buySectItem('sq1');
assert(S.sect.contrib===140&&(S.pills.huiqi||0)===hp0+5,'贡献阁应扣贡献发货');
S.sect.contrib=SECT_TITLES[1].need;
promoteTitle();
assert(S.sect.title===1,'应晋升外门弟子');
assert(sectTitleFx('qps')===0.04,'职位应有修炼加成');
S.sect.contrib=99999;S.sect.title=3;
buySectItem('sq8');buySectItem('sq10');
assert(S.sk.own.ss1===1&&S.sk.own.ss2===1,'宗门战技应可兑换');
buySectItem('sq7');buySectItem('sq9');
assert(S.gf.own.sg1===1&&S.gf.own.sg2===1,'宗门功法应可兑换');
S.sect.rank=1;
assert(sectProg()===107,'登顶进度应满107');
assert(sectFx('qps')===0.5&&sectFx('all')===0.25,'第一分宗气运应满额');
checkAch();
assert(S.ach.a_sc1===1&&S.ach.a_sc10===1&&S.ach.a_sc50===1,'爬升成就应达成');
assert(S.ach.a_sct===1,'真传成就应达成');
curTab='sect';renderAll();
/* ========== 阶段七：练体 · 肉身九秘 / 八维属性 / 练体功法 ========== */
assert(BODY_STAGES.length===9,'应有九秘');
assert(BODY_STAGES.map(s=>s.st).join('')==='皮肉筋骨脏髓血窍罡','九秘顺序应为皮肉筋骨脏髓血窍罡');
assert(GONGFAS.filter(g=>g.kind==='body').length===8,'练体功法应有8部');
assert(bodyFx('atk')===0&&bodyFx('crit')===0,'未练体时副属性应为0');
S.stones=1e9;S.qi=1e30;
temperBody();
assert((S.body.lv[0])===1,'淬皮第一重应成');
assert(Math.abs(bodyFx('def')-0.02)<1e-9,'淬皮应给防御2%');
for(let k=0;k<9;k++)temperBody();
assert(S.body.lv[0]===10&&S.body.li===1,'淬皮十重后应进锻肉');
assert(Math.abs(bodyFx('def')-0.2)<1e-9,'十重淬皮应防御+20%');
S.body.lv=[10,10,10,10,10,10,10,10,10];S.body.li=9;
assert(bodyTotal()===90,'九秘俱通应90重');
assert(Math.abs(bodyFx('crit')-0.2)<1e-9,'通髓应暴击20%');
assert(Math.abs(bodyFx('spd')-10)<1e-9,'伸筋应速度10');
const bst0=heroStats();
assert(bst0.sec&&bst0.sec.cdmg>1.6,'通髓十重应抬暴伤倍率, 实际 '+bst0.sec.cdmg);
assert(Math.abs(bst0.sec.spd-10)<1e-6,'速度应10');
// 练体功法：拥有/运功/属性生效
while(S.gf.on.length)equipGf(S.gf.on[0]); // 收功归零，回归裸体基准
const bbase=heroStats();
grantGf('bt1');
assert(S.gf.on.indexOf('bt1')>=0,'铁皮功应自动运功');
assert(gfFx('dodge')>0&&gfFx('def')>0,'铁皮功应给闪避与防御');
const bdef1=heroStats().def;
assert(bdef1>bbase.def*1.1,'练体功法应放大防御, '+bdef1+' vs '+bbase.def);
grantGf('bt5');
assert(S.gf.on.indexOf('bt5')>=0,'通髓贯神篇应自动运功');
assert(gfFx('cdmg')>0&&gfFx('crit')>0,'通髓贯神篇应给暴击暴伤');
assert(Math.abs(heroStats().sec.crit-Math.min(0.6,0.2+0.08))<1e-9,'暴击应叠至28%');
// 战斗内：八维生效
S.ap=99;
startBattle('fengming',0);
assert(B&&B.sec&&B.sec.spd===10,'战斗应携带速度10');
let btn7=0;while(B&&!B.over&&btn7++<900)basicAttack();
assert(B&&B.over,'战斗应结束');
B=null;
// 登顶成就 + 页面冒烟
checkAch();
assert(S.ach.a_body===1,'肉身九秘成就应达成');
curTab='body';renderAll();
curTab='wugong';renderAll();
/* ========== 阶段八：红尘人物 / 双修 / 商行奇货 / 妖兽材料 ========== */
assert(Object.keys(HERBS).length===2024,'应有2024种药材, 实际 '+Object.keys(HERBS).length);
assert(HERBS_BY_TIER[11].length===1&&HERBS_BY_TIER[12].length===1,'应有11/12品仙界灵植');
assert(Object.keys(MATS).length===11,'应有11种材料');
assert(Object.keys(GIFT_DEFS).length===10,'应有10种赠礼');
assert(SHOP2.length===8,'商行应8档柜台');
assert(RECIPES.length===627,'应有627张丹方, 实际 '+RECIPES.length);
assert(ZONES.every(z=>z.enemies.length>=5),'每图应至少5种妖兽');
assert(ZONES.some(z=>z.enemies.some(e=>e.m>=3.0)),'名图应有守护妖王');
/* 材料掉落 */
S.mats={};
for(let i=0;i<60;i++)dropLoot({r:6,boss:1},2);
assert(Object.keys(S.mats).length>0,'战斗应掉落新材料');
assert(MATS[Object.keys(S.mats)[0]].t<=7,'材料品档应合理');
/* 偶遇与好感 */
maybeMeet=function(src,z){return meetNpc('f',src,z);}; // 测试直接命中
const rc0=S.soc.roster.length;
maybeMeet('battle','黑风林');
assert(S.soc.roster.length===rc0+1,'偶遇应结识1人');
const npc=S.soc.roster[S.soc.roster.length-1],no=npcOf(npc);
assert(!!no.name&&!!no.idt&&!!SOC_LIKE_TXT[no.like],'NPC档案应完整: '+no.name);
const af0=npc.aff;
socTalk(npc.seed);
assert(npc.aff>af0,'交谈应加好感');
const a1=npc.aff;socTalk(npc.seed);
assert(npc.aff===a1,'每日交谈应仅一次');
S.herbs.jiuye=(S.herbs.jiuye||0)+3;
socGift(npc.seed,'herb');
assert(S.herbs.jiuye===2&&npc.aff>a1,'赠礼应扣灵植加好感');
/* 挚友交易（男） */
meetNpc('m','explore');
const bro=S.soc.roster[S.soc.roster.length-1];bro.aff=300;
socFriend(bro.seed);
assert(bro.friend===1,'应结为挚友');
const st0b=S.stones;S.herbs.xianling=10;
socTradeSell(bro.seed,'herb');
assert(S.stones>st0b&&S.herbs.xianling<10,'挚友交易应得灵石');
socTradeBuy(bro.seed);
const stAfter=S.stones;socTradeBuy(bro.seed);
assert(S.stones===stAfter,'珍藏每日仅一件');
/* 道侣与双修 */
assert(daoMax()===3,'仙界应3道侣位');
npc.aff=700;
socDao(npc.seed);
assert(npc.dao===1,'应结为道侣');
assert(npcFx('all')>0&&npcFx('qps')>0,'道侣应有随行加成');
S.ap=9;const q0b=S.qi;
socDual(npc.seed);
assert(S.qi>q0b,'双修应得修为');
assert(npc.dual===S.day,'双修应记次数');
const q2b=S.qi;socDual(npc.seed);
assert(S.qi===q2b,'每日双修应仅一次');
/* 合欢露 */
S.pills.hehuan=1;S.soc.dualBoost=0;
usePill('hehuan');
assert(S.soc.dualBoost===S.day+1&&S.pills.hehuan===0,'合欢露应设次日双修加成');
/* 商行 */
curTab='soc';renderAll();
curTab='market';renderAll();
const g0b=S.gifts.lingcha||0;const gb0=S.stones;
buy2('lingcha');
assert((S.gifts.lingcha||0)===g0b+1&&S.stones<gb0,'应购得赠礼');
S.mats.yaodan=5;const sm0=S.stones;
sellMat('yaodan',5);
assert(S.stones>sm0,'应可售材料');
curTab='soc';renderAll();
console.log('✅ 冒烟测试全部通过：全流程 / 45地图 / 2024灵植 / 627丹方·672丹药 / 每日修为上限 / 凝星丹力模型·一键凝聚 / 货币与飞升 / 210战技·222功法(含练体8部)·武功阁·宗门爬榜·肉身九秘·八维属性 / 九星塔 / 词缀 / 成就 / 每日悬赏 / 装备强化·灵兽升级 / 日程 / 混沌珠 / 存档迁移');
`;
eval(sandboxWrap());
function sandboxWrap(){
  for(const k in sandbox)globalThis[k]=sandbox[k];
  fs.writeFileSync(path.join(__dirname,'combined.js'),data+'\n'+data2+'\n'+social+'\n'+game+'\n'+test);
  require('./combined.js');
}
