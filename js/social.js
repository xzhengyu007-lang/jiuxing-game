/* ============================================================
 * social.js —— 红尘人物系统：偶遇结识 · 好感五阶 · 赠礼交谈 · 挚友交易 · 道侣双修
 * 依赖 data.js / data2.js（在其后加载）；game.js 最后
 * ============================================================ */

/* ---------- 名册池 ---------- */
const SOC_SUR=['林','苏','叶','陆','秦','萧','楚','沈','顾','燕','裴','温','云','洛','姬','姜','慕','凌','白','花','柳','唐','许','程','方','姚','宋','阮','简','卓'];
const SOC_F=['无涯','青临','惊鸿','听雪','拂衣','挽风','凝霜','疏影','暗香','流萤','初雪','映月','若诗','清岚','语嫣','紫烟','檀儿','灵犀','雨薇','霜华','梦璃','芷若','怜星','念卿','如烟','婉儿','静姝','妍儿','彩衣','沐晴','星眠','灼华','菱歌','琼华','绛雪','青黛','蝉衣','月奴','云鬓','黛眉'];
const SOC_M=['长风','惊蛰','断岳','寒山','孤鸿','沉舟','裂云','踏月','问天','擎苍','衔烛','负霜','照野','既白','观澜','听涛','凌虚','抱朴','归远','崇光','霁云','镇川','砺锋','南山','北辰','亦寒','之涣','怀瑾','澈','晏清'];
const SOC_ID=[
 {n:'散修游侠',like:'wine'},{n:'世家小姐',like:'orn'},{n:'宗门内门弟子',like:'pill'},
 {n:'药谷传人',like:'herb'},{n:'剑修',like:'blade'},{n:'云游乐师',like:'art'},
 {n:'商会千金',like:'rare'},{n:'书院才女',like:'art'},{n:'丹道世家嫡子',like:'pill'},
 {n:'隐世老人',like:'tea'},{n:'妖族少女',like:'rare'},{n:'镖师之女',like:'wine'},
 {n:'皇朝郡主',like:'orn'},{n:'魔道弃徒',like:'rare'},{n:'采药人',like:'herb'},
 {n:'酿酒师傅',like:'wine'},{n:'琴师',like:'art'},{n:'画师',like:'art'},
 {n:'刀客',like:'blade'},{n:'丹童',like:'pill'},{n:'灵植园管事',like:'herb'},
 {n:'炼器师',like:'blade'},{n:'茶商',like:'tea'},{n:'游方郎中',like:'herb'}
];
const SOC_TEMP=['清冷','活泼','温婉','高傲','豪爽','神秘','天真','坚韧'];
const SOC_LIKE_TXT={herb:'灵植',pill:'丹药',mat:'妖核骨皮',orn:'首饰妆奁',art:'琴棋书画',wine:'灵酒',tea:'灵茶',rare:'奇珍异物',blade:'兵刃利器'};
const SOC_LIKE_POOL=['herb','pill','mat','orn','art','wine','tea','rare','blade'];
/* 兵刃类赠礼：以材料妖骨/龙鳞代之（闻其声而喜） */
function socMeetText(src){
  const B_T=[
   '你循打斗声赶到，只见一名{g}被数头妖兽围困，你拳出如风荡开兽群。{g}敛衽一礼：「阁下援手之德，铭记于心。」',
   '激战方歇，一名{g}从乱石后转出——原来在旁观战多时：「好俊的拳法！小女子/在下受教了。」',
   '妖兽授首，你却在兽尸堆旁发现一名昏死的{g}，喂下丹药救醒。{g}醒来自陈遭邪修追杀，谢你不杀救命之恩。',
   '你斩了拦路的凶兽，一名{g}拍手而出：「这头畜生追了我三十里，总算有人替我出了气！」'
  ];
  const E_T=[
   '悬崖幽谷之间，一名{g}正在采一株将谢的灵植，见你也识货，笑道：「有缘同好，分你一半。」',
   '你溯溪寻药，撞见一名{g}失足卡在石缝，救出后{g}以随身灵物相谢，就此结识。',
   '古洞避雨，与一名{g}不期而遇。雨夜清谈修行之道，天明各自赶路，却已互道名姓。',
   '你在药田边练拳，一名{g}驻足良久：「这拳法……有点意思。交个朋友？」'
  ];
  const pool=src==='battle'?B_T:E_T;
  return pool[Math.floor(Math.random()*pool.length)];
}

/* ---------- 生成 / 档案 ---------- */
function npcName(seed,g){const s=SOC_SUR[seed%30];return s+(g==='f'?SOC_F[(seed*7+3)%40]:SOC_M[(seed*11+5)%30]);}
function npcOf(n){ // 由 seed 确定性还原身份/性情/喜好
  const idt=SOC_ID[(n.seed*13+7)%24],temp=SOC_TEMP[(n.seed*17+2)%8];
  const like=n.seed%3===0?idt.like:SOC_LIKE_POOL[(n.seed*19+1)%9];
  return {name:npcName(n.seed,n.g),idt:idt.n,temp,like:like,r:n.r||1,g:n.g};
}
function socInit(){
  if(!S.soc)S.soc={roster:[],made:0};
  if(!S.gifts)S.gifts={};
  return S.soc;
}
function socStage(n){ // 0一面之缘 1相熟 2知己/挚友 3倾心 4道侣
  if(n.dao)return 4;
  if(n.g==='m')return n.friend?2:(n.aff>=100?1:0);
  return n.aff>=700?3:(n.aff>=300?2:(n.aff>=100?1:0));
}
const SOC_STAGE_F=['一面之缘','相熟','知己','倾心','道侣'];
const SOC_STAGE_M=['一面之缘','相熟','挚友','知交','生死之交'];
function socCap(){return 14+curR();}
function daoMax(){return Math.min(4,1+Math.floor(curR()/6));}
function daoCnt(){return socInit().roster.filter(function(n){return n.dao;}).length;}
function npcFx(k){
  if(!S||!S.soc)return 0;
  let v=0;
  for(const n of S.soc.roster){
    if(!n.dao)continue;
    if(k==='all')v+=Math.min(0.10,0.02+n.aff*0.00008);
    else if(k==='qps')v+=Math.min(0.08,0.02+n.aff*0.00006);
    else if(k==='drop')v+=Math.min(0.06,0.015+n.aff*0.00005);
    else if(k==='gain')v+=Math.min(0.06,0.015+n.aff*0.00005);
  }
  return v;
}

/* ---------- 偶遇结识 ---------- */
function meetNpc(g,src,zname){
  const soc=socInit();
  if(soc.roster.length>=socCap()){
    log('story','途中虽有几面之缘，但你人行囊未整、居所有限，只能记下姓名，来日再会。');
    return null;
  }
  let seed=1+Math.floor(Math.random()*8999999);
  while(socInit().roster.some(function(x){return x.seed===seed;}))seed=seed%8999999+1; // seed 唯一，名册不撞脸
  const r=Math.max(1,Math.min(21,curR()-1+Math.floor(Math.random()*3)));
  const n={seed:seed,g:g,aff:src==='battle'?20:12,dao:0,friend:0,talk:0,dual:0,trade:0,buy:0,r:r};
  soc.roster.push(n);
  const o=npcOf(n);
  const txt=socMeetText(src).split('{g}').join(g==='f'?'女子':'男子');
  log('story','【红尘偶遇'+(zname?(' · '+zname):'')+'】'+txt+'——【'+o.name+'】（'+o.idt+'，'+REALMS[Math.min(20,o.r)].name+'），自此列入你的红尘名册。');
  toast('结识：'+o.name,'good');
  return n;
}
function maybeMeet(src,zname){
  const soc=socInit();
  if(soc.roster.length>=socCap())return;
  const ch=src==='battle'?0.10:0.12;
  if(Math.random()>=ch)return;
  meetNpc(Math.random()<0.7?'f':'m',src,zname);
}

/* ---------- 交谈 / 赠礼 / 好感 ---------- */
function socFind(seed){return socInit().roster.find(function(n){return n.seed===seed;});}
function socTalk(seed){
  const n=socFind(seed);if(!n)return;
  const o=npcOf(n);
  if(n.talk===S.day){toast('今日已与'+o.name+'叙过话了。');return;}
  n.talk=S.day;
  const d=6+Math.floor(Math.random()*5);
  n.aff+=d;
  const T=['“修行之路漫漫，与君一席话，胜读十年书。”','“近日丹田气机有些滞涩，听君一言，豁然开朗。”','“你那套拳法，越看越有味道。”','“改日再来找我，我温一壶灵酒等你。”'];
  log('good','与【'+o.name+'】清谈半日，相谈甚欢：好感 +'+d+'。「'+T[Math.floor(Math.random()*T.length)]+'」');
  renderAll();save();
}
function socAffVal(pid){
  const p=PILLS[pid];
  if(p&&p.t!==undefined)return Math.max(6,Math.min(40,Math.round(pillPrice(pid,curR())*0.02)));
  return 8;
}
function socBestOf(cat){ // 挑出包里该类中最拿得出手的一份
  if(cat==='herb'){
    let bt=0,bid=null;
    for(const id in S.herbs){const h=HERBS[id];if((S.herbs[id]||0)>0&&h&&h.t>bt){bt=h.t;bid=id;}}
    return bid?{kind:'herb',id:bid,n:HERBS[bid].n+' x1',v:4+2*HERBS[bid].t}:{kind:'herb',id:'lingcao',n:'灵草 x1',v:6};
  }
  if(cat==='pill'){
    let bv=0,bid=null;
    for(const id in S.pills){if((S.pills[id]||0)>0&&PILLS[id]&&PILLS[id].f!=='star'){const v=socAffVal(id);if(v>bv){bv=v;bid=id;}}}
    return bid?{kind:'pill',id:bid,n:PILLS[bid].n+' x1',v:bv}:null;
  }
  if(cat==='mat'){
    let bv=0,bid=null;
    for(const id in S.mats){if((S.mats[id]||0)>0&&MATS[id]){const v=6+3*MATS[id].t;if(v>bv){bv=v;bid=id;}}}
    return bid?{kind:'mat',id:bid,n:MATS[bid].n+' x1',v:bv}:null;
  }
  const g=GIFT_DEFS[cat];
  if(g&&(S.gifts[cat]||0)>0)return {kind:'gift',id:cat,n:g.n+' x1',v:g.aff};
  return null;
}
const SOC_CATS=[['herb','赠灵植'],['pill','赠丹药'],['mat','赠妖骨奇材'],['tea','赠灵茶'],['orn','赠首饰妆奁'],['art','赠琴画剑穗'],['wine','赠灵酒'],['rare','赠奇珍']];
function socGift(seed,cat){
  const n=socFind(seed);if(!n)return;
  const o=npcOf(n);
  const it=socBestOf(cat);
  if(!it){toast('囊中无此物。');return;}
  if(it.kind==='herb')S.herbs[it.id]--;
  else if(it.kind==='pill')S.pills[it.id]--;
  else if(it.kind==='mat')S.mats[it.id]--;
  else S.gifts[it.id]--;
  const mul=o.like===cat?2:1;
  const d=Math.round(it.v*mul);
  n.aff+=d;
  log(mul>1?'good':'','赠【'+o.name+'】'+it.n+(mul>1?'——正投其所好！':'')+'：好感 +'+d+'。');
  if(mul>1)toast(o.name+'眼中一亮：正合心意！','good');
  renderAll();save();
}

/* ---------- 挚友交易 ---------- */
function socTradeSell(seed,kind){
  const n=socFind(seed);if(!n)return;
  const o=npcOf(n);
  if(n.trade===S.day){toast('今日已与'+o.name+'交易过了。');return;}
  const rate=1.3*(1+n.aff/2000);
  let got=0,desc='';
  if(kind==='herb'){
    let bt=0,bid=null;
    for(const id in S.herbs){const h=HERBS[id];if((S.herbs[id]||0)>0&&h&&h.t>bt){bt=h.t;bid=id;}}
    if(!bid){toast('囊中无灵植。');return;}
    const cnt=Math.min(20,S.herbs[bid]);
    got=Math.floor(herbPrice(bt)*rate)*cnt;
    S.herbs[bid]-=cnt;desc=HERBS[bid].n+' x'+cnt;
  }else{
    let any=false;
    for(const id in S.mats){
      if((S.mats[id]||0)>0){any=true;const cnt=Math.min(5,S.mats[id]);
        got+=Math.floor(matPrice(id,curR())*rate)*cnt;S.mats[id]-=cnt;desc+=(desc?'、':'')+MATS[id].n+' x'+cnt;}
    }
    if(!any){toast('囊中无材料。');return;}
  }
  n.trade=S.day;n.aff+=2;
  got=Math.floor(got);
  S.stones+=got;
  log('good','与【'+o.name+'】交易：出让 '+desc+'，得 '+moneyName()+' '+fmtMoney(got)+'。江湖买卖，两不相欠。');
  renderAll();save();
}
function socTradeBuy(seed){
  const n=socFind(seed);if(!n)return;
  const o=npcOf(n);
  if(n.buy===S.day){toast(o.name+'今日的珍藏已出手，明日再来。');return;}
  const roll=(n.seed+S.day*97)%5;
  let item=null,cost=0;
  if(roll===0){const t=Math.min(12,o.r+1);const pool=HERBS_BY_TIER[t]||HERBS_BY_TIER[10];const id=pool[(n.seed+o.r)%pool.length];
    item={txt:HERBS[id].n+' x3',give:function(){S.herbs[id]=(S.herbs[id]||0)+3;}};cost=Math.floor(herbPrice(t)*3*1.1);}
  else if(roll===1){const id=['longli','tiangan','manxue','tianren'][(n.seed+o.r)%4];
    item={txt:PILLS[id].n+' x1',give:function(){S.pills[id]=(S.pills[id]||0)+1;}};cost=Math.floor(pillPrice(id,curR())*1.5);}
  else if(roll===2){const ids=Object.keys(GIFT_DEFS);const id=ids[(n.seed*3+S.day)%ids.length];
    item={txt:GIFT_DEFS[id].n+' x1',give:function(){S.gifts[id]=(S.gifts[id]||0)+1;}};cost=Math.floor(GIFT_DEFS[id].aff*40*(1+0.1*curR()));}
  else if(roll===3){const ids=['yaodan','yaogu','neidan','xiejing'];const id=ids[(n.seed+o.r)%4];
    item={txt:MATS[id].n+' x5',give:function(){S.mats[id]=(S.mats[id]||0)+5;}};cost=Math.floor(matPrice(id,curR())*5*1.1);}
  else{const t=Math.min(12,Math.max(1,o.r));const pool=HERBS_BY_TIER[t]||HERBS_BY_TIER[1];const id=pool[(n.seed*7+o.r)%pool.length];
    item={txt:HERBS[id].n+' x5',give:function(){S.herbs[id]=(S.herbs[id]||0)+5;}};cost=Math.floor(herbPrice(t)*5*1.1);}
  if(S.stones<cost){toast(moneyName()+'不足：需 '+fmtMoney(cost));return;}
  S.stones-=cost;item.give();
  n.buy=S.day;n.aff+=2;
  log('good','从【'+o.name+'】处购得其珍藏：'+item.txt+'（'+moneyName()+' '+fmtMoney(cost)+'）。');
  renderAll();save();
}

/* ---------- 结义 / 道侣 / 双修 ---------- */
function socFriend(seed){
  const n=socFind(seed);if(!n)return;
  const o=npcOf(n);
  if(n.g==='m'){
    if(n.friend){toast('你们早已是过命之交。');return;}
    if(n.aff<300){toast('还需多相处：好感 '+n.aff+' / 300。');return;}
    n.friend=1;
    log('story','【结义】与【'+o.name+'】把酒论道，意气相投——歃血为盟，结为生死之交！自此你们的商路互通，两不相欺。');
    toast('结为挚友：'+o.name,'good');
  }
  renderAll();save();
}
function socDao(seed){
  const n=socFind(seed);if(!n||n.g!=='f')return;
  const o=npcOf(n);
  if(n.dao){toast(o.name+'已是你道侣。');return;}
  if(n.aff<700){toast('还需水到渠成：好感 '+n.aff+' / 700。');return;}
  if(daoCnt()>=daoMax()){toast('道侣之位已满（'+daoCnt()+'/'+daoMax()+'）——随境界提升可增。');return;}
  n.dao=1;n.aff+=100;
  log('story','【结为道侣】月下盟誓，三生为证——你与【'+o.name+'】结为道侣！自此道途同修，阴阳互济：全属性与修炼速度随之精进（红尘页可查）。');
  toast('道侣：'+o.name,'good');
  checkQuests();
}
function socDual(seed){
  const n=socFind(seed);if(!n)return;
  const o=npcOf(n);
  if(!n.dao){toast('唯有道侣可双修。');return;}
  if(n.dual===S.day){toast('今日已与'+o.name+'互济过了——道贵有度。');return;}
  if(!useAp(1,'双修'))return;
  n.dual=S.day;
  const boost=(S.soc.dualBoost===S.day)?1.5:1;
  const g=layerCost()*(0.08+0.02*(n.aff>=700?2:1))*(1+n.aff/900)*boost;
  const got=addQi(g,'dual');
  S.cond=Math.min(100,S.cond+8);
  n.aff+=3;
  log('good','【双修 · '+o.name+'】阴阳互济，灵气交融——修为 +'+fmt(got)+'，状态 +8，好感 +3。');
  renderAll();save();
}

/* ---------- 商行分阶货架（红尘商路） ---------- */
function shop2Html(){
  const r=curR();
  let html='<div class="panel"><h3>华云商行 · 分阶奇货</h3><p class="small muted">境界越高，柜台越深——商行后堂的奇货随修为逐阶解锁。</p>';
  SHOP2.forEach(function(tier){
    const lock=r<tier.reqR;
    html+='<div class="small gold" style="margin:6px 0 2px">'+REALMS[tier.reqR].name+'柜台'+(lock?'<span class="tag no">需 '+REALMS[tier.reqR].name+'</span>':'')+'</div>';
    html+=tier.items.map(function(it){
      const def=GIFT_DEFS[it.k]||null;
      const nm=it.n||def.n;
      const d=def?(def.d+'（赠礼 · 好感 +'+def.aff+'）'):'奇货 · 修炼资粮';
      const cost=it.costFn?it.costFn(r):it.cost(r);
      return '<div class="row-item"><div class="info"><div class="nm">'+nm+'</div><div class="small muted">'+(def?def.d:'修炼奇货，丹道资粮')+'</div></div>'+
       (lock?'<span class="tag no">未解锁</span>':'<button class="btn" onclick="buy2(\''+it.k+'\')">'+fmtMoney(cost)+' '+moneyName()+'</button>')+'</div>';
    }).join('');
  });
  return html+'</div>';
}
function buy2(k){
  const r=curR();
  for(const tier of SHOP2){
    if(r<tier.reqR)continue;
    const it=tier.items.find(function(x){return x.k===k;});
    if(!it)continue;
    const cost=it.costFn?it.costFn(r):it.cost(r);
    if(S.stones<cost){toast(moneyName()+'不足：需 '+fmtMoney(cost));return;}
    S.stones-=cost;
    if(it.give)it.give(S);
    else{const g=GIFT_DEFS[k];S.gifts[k]=(S.gifts[k]||0)+1;}
    log('good','购得【'+(it.n||GIFT_DEFS[k].n)+'】。');
    renderAll();save();return;
  }
}
function sellMatRows(){
  const r=curR();
  const rows=Object.keys(MATS).map(function(id){
    const c=S.mats[id]||0;
    if(!c)return '';
    return '<div class="row-item"><div class="info"><div class="nm">'+MATS[id].n+' x'+c+'</div><div class="small muted">收购价 '+fmtMoney(matPrice(id,r))+' '+moneyName()+'/份 · 买回 '+fmtMoney(matPrice(id,r)*2)+'/份（两倍）</div></div>'+
     '<span><button class="btn ghost" onclick="buyMat(\''+id+'\',1)">购1</button> '+
     '<button class="btn ghost" onclick="sellMat(\''+id+'\',1)">售1</button> <button class="btn" onclick="sellMat(\''+id+'\','+c+')">全售</button></span></div>';
  }).join('');
  return rows;
}
function sellMat(id,n){
  const c=S.mats[id]||0;if(!c)return;
  n=Math.min(n,c);
  const got=Math.floor(matPrice(id,curR()))*n;
  S.mats[id]-=n;S.stones+=got;
  log('good','售出 '+MATS[id].n+' x'+n+'，得 '+moneyName()+' '+fmtMoney(got)+'。');
  renderAll();save();
}

/* ---------- 战斗材料掉落（按境界取档） ---------- */
function dropLoot(ed,mul){
  const r=ed.r||1;
  const tier=Math.max(1,Math.min(7,Math.ceil(r/2)));
  const pool=Object.keys(MATS).filter(function(id){return MATS[id].t===tier;});
  let s='';
  const ch=(ed.boss?0.55:0.26)*Math.min(2.2,mul);
  if(pool.length&&Math.random()<Math.min(0.9,ch)){
    const id=pool[Math.floor(Math.random()*pool.length)];
    const cnt=ed.boss?(1+Math.floor(Math.random()*2)):1;
    S.mats[id]=(S.mats[id]||0)+cnt;
    s='，'+MATS[id].n+' x'+cnt;
  }
  return s;
}

/* ---------- 红尘页 ---------- */
function socNpcCard(n){
  const o=npcOf(n);
  const st=socStage(n),stn=(n.g==='f'?SOC_STAGE_F:SOC_STAGE_M)[st];
  const TH=[0,100,300,700],nxt=[100,300,700,1500][st];
  const lo=TH[Math.min(st,3)];
  const bar=(st>=4||(n.g==='m'&&n.friend))?'':'<div class="bar slim"><i style="width:'+Math.min(100,Math.round((n.aff-lo)/(nxt-lo)*100))+'%"></i><span>好感 '+n.aff+' / '+nxt+'</span></div>';
  const likeTxt=SOC_LIKE_TXT[o.like]||'—';
  let btns='';
  if(n.talk!==S.day)btns+='<button class="btn ghost" onclick="socTalk('+n.seed+')">交谈</button>';
  btns+=SOC_CATS.filter(function(c){return socBestOf(c[0]);}).slice(0,4).map(function(c){
    return '<button class="btn ghost" onclick="socGift('+n.seed+',\''+c[0]+'\')">'+c[1]+'</button>';
  }).join(' ');
  if(n.g==='m'&&!n.friend)btns+='<button class="btn" onclick="socFriend('+n.seed+')">结为挚友'+(n.aff>=300?'':'（需好感300）')+'</button>';
  if(n.g==='f'&&!n.dao)btns+='<button class="btn" onclick="socDao('+n.seed+')">结为道侣'+(n.aff>=700?'':'（需好感700）')+'</button>';
  if(n.dao)btns+='<button class="btn big" onclick="socDual('+n.seed+')">'+(n.dual===S.day?'今日已双修':'双修（1行动点）')+'</button>';
  if((n.dao||((n.g==='m')&&n.friend))){
    btns+='<button class="btn ghost" onclick="socTradeSell('+n.seed+',\'herb\')">售灵植</button>'+
          '<button class="btn ghost" onclick="socTradeSell('+n.seed+',\'mat\')">售材料</button>'+
          '<button class="btn" onclick="socTradeBuy('+n.seed+')">'+(n.buy===S.day?'珍藏已售':'购其珍藏')+'</button>';
  }
  return '<div class="row-item"><div class="info">'+
   '<div class="nm"><span class="ava">'+o.name[0]+'</span>'+o.name+'<span class="tag">'+stn+'</span>'+(n.dao?'<span class="tag rank">道侣</span>':'')+'</div>'+
   '<div class="small muted">'+o.idt+' · '+SOC_TEMP[(n.seed*17+2)%8]+' · '+REALMS[Math.min(20,o.r)].name+' · 喜好：<b class="gold">'+likeTxt+'</b></div>'+
   bar+
   '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">'+btns+'</div>'+
   '</div></div>';
}
function renderSoc(){
  const soc=socInit();
  const daos=soc.roster.filter(function(n){return n.dao;});
  const friends=soc.roster.filter(function(n){return n.g==='m'&&n.friend;});
  const fx='道侣加成：全属性 +'+Math.round(npcFx('all')*100)+'% · 修炼 +'+Math.round(npcFx('qps')*100)+'% · 掉落/所得 +'+Math.round(npcFx('drop')*100)+'%';
  const roster=soc.roster.slice().sort(function(a,b){return (b.dao-a.dao)||(b.aff-a.aff);}).map(socNpcCard).join('');
  $('main').innerHTML='<div class="grid2">'+
   '<div class="panel"><h3>红尘名册</h3>'+
   '<p class="small muted">打怪救人、游历山水，皆可邂逅有缘人。交谈、赠礼增进好感：女子可结为<b class="gold">道侣</b>，挚友可互通<b class="gold">商路</b>。'+fx+'。</p>'+
   '<div class="small">结识 '+soc.roster.length+' / '+socCap()+' ｜ 道侣 '+daos.length+' / '+daoMax()+' 位 ｜ 挚友 '+friends.length+' 位</div>'+
   '<hr class="hr">'+(roster||'<p class="small muted">名册空空。历练与采药途中，或有一面之缘。</p>')+'</div>'+
   '<div class="panel"><h3>双修之道</h3>'+
   '<p class="small muted">结为道侣后，每日可双修一次（1 行动点）：阴阳互济，灵气交融——按好感深浅获得大量修为，兼复状态。服食「合欢露」可令次日双修之效大增。</p>'+
   '<div class="small">今日双修加成：'+((S.soc.dualBoost===S.day)?'<b class="gold">合欢露之效 · 1.5 倍</b>':'无')+'</div>'+
   '<hr class="hr"><h3 class="small">好感五阶</h3>'+
   '<p class="small muted">一面之缘 → 相熟（100）→ 知己/挚友（300）→ 倾心（700）→ 道侣。投其所好，好感加倍。境界每六重增一道侣之位。</p>'+
   '</div></div>';
}
