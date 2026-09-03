'use strict';
/* ============================================================
 * 九星霸体诀 · 修仙 —— 秘境玩法（mijing.js）
 *  每个大境界一处秘境：可遇珍宝，也会遇到他派修士杀人夺宝；
 *  动手夺宝积累该门派仇恨值（好坏门派分明），仇恨深了反遭追杀。
 *  依赖 data3.js 的 SECTS/SECRET_REALMS/MJ_ROGUE_NAMES 与 game.js 运行时函数。
 * ============================================================ */

/* ---------------- 仇恨值 ---------------- */
var HATRED_STAGES=['相安无事','心生敌意','悬赏追杀','不死不休'];
function mjNew(){if(!S.mj)S.mj={day:0,used:0,hatred:{},rep:{},enc:null,ambush:null};return S.mj;}
function hatredOf(id){return (S.mj&&S.mj.hatred[id])||0;}
function repOf(id){return (S.mj&&S.mj.rep[id])||0;}
function hatredStage(v){return v>=200?3:(v>=100?2:(v>=50?1:0));}
function addHatred(id,v){const m=mjNew();m.hatred[id]=Math.max(0,(m.hatred[id]||0)+v);}
function addRep(id,v){const m=mjNew();m.rep[id]=Math.max(0,(m.rep[id]||0)+v);}
function mjRealmName(){return SECRET_REALMS[Math.min(curR(),SECRET_REALMS.length-1)];}

/* ---------------- 探秘境（2 行动点 · 每日一次） ---------------- */
function enterMijing(){
  const m=mjNew();
  if(m.used>=1&&m.day===S.day){toast('今日已探过【'+mjRealmName()+'】——明日再探');return;}
  if(B&&!B.over){toast('战斗尚未结束');return;}
  if(!useAp(2,'探秘境'))return;
  m.day=S.day;m.used=1;
  const roll=Math.random();
  if(roll<0.42){mjTreasure(1);}
  else if(roll<0.77){ // 惊起守卫妖兽
    const z=ZONES.find(x=>x.reqR===curR()&&x.enemies[0].r===curR())||ZONES.find(x=>x.reqR<=curR());
    const beast=z?z.enemies[irnd(0,z.enemies.length-1)].n:'妖兽';
    const ed={n:mjRealmName()+'守卫 · '+beast,r:Math.min(21,curR()+1),m:1.6,boss:1,noAfx:1,mj:{type:'guard'}};
    log('story','【'+mjRealmName()+'】你刚踏入秘境深处，一声兽吼震得灵雾翻涌——守卫妖兽扑杀而来！');
    beginBattle('mijing',-1,ed,0);
  }
  else{mjEncounter();}
  renderAll();save();
}
/* 秘境珍宝：灵石 + 灵植 + 丹药/材料 + 偶得异火 */
function mjTreasure(mul){
  const r=curR();
  const stones=Math.floor(80*Math.pow(1.7,r)*rnd(0.8,1.5)*mul);
  S.stones+=stones;
  let txt=moneyName()+' '+fmtMoney(stones);
  const t=Math.max(1,Math.min(10,r+1));
  const pool=HERBS_BY_TIER[t]||[];
  if(pool.length){
    const n=irnd(3,6);
    const h=pool[Math.floor(Math.random()*pool.length)];
    S.herbs[h]=(S.herbs[h]||0)+n;
    txt+='，'+HERBS[h].n+' x'+n;
  }
  if(Math.random()<0.5){
    const mk=pick(Object.keys(MATS));
    S.mats[mk]=(S.mats[mk]||0)+1;
    txt+='，'+MATS[mk].n+' x1';
  }else{
    const tc=Object.keys(PILLS).filter(pid=>PILLS[pid].m!==undefined&&PILLS[pid].t&&PILLS[pid].t<=Math.min(10,r+1));
    if(tc.length){const p=pick(tc);S.pills[p]=(S.pills[p]||0)+1;txt+='，'+PILLS[p].n+' x1';}
  }
  if(Math.random()<0.15){
    grantFlame(r>=13?3:(r>=9?2:(r>=3?1:0)),1,60);
    txt+='，异火一缕！';
  }
  log('good','【'+mjRealmName()+'】深处寻得一处前人洞府——珍宝入手：'+txt+'。');
  toast('秘境珍宝！','good');
}

/* ---------------- 夺宝人遭遇（三择：出手夺宝 / 礼让 / 震慑） ---------------- */
function mjEncounter(){
  const m=mjNew();
  const st=pick(SECTS);
  const foe={n:st.n+' · '+pick(MJ_ROGUE_NAMES),r:Math.min(21,curR()+(Math.random()<0.3?1:0)),m:1.3,noAfx:1,
    mj:{type:'rob',sect:st.id}};
  m.enc={sect:st.id,foeN:foe.n,foeR:foe.r,foeM:foe.m};
  log('story','【'+mjRealmName()+'】雾气中迎面撞上一名'+st.n+'修士——对方目光一冷，掌中灵光已起，竟是要杀人夺宝！');
  toast(st.n+'修士拦路！','bad');
  renderAll();
}
function mjChoice(c){
  const m=mjNew();
  if(!m.enc)return;
  const st=SECTS_BY_ID[m.enc.sect];
  if(!st){m.enc=null;renderAll();return;}
  if(c==='yield'){ // 礼让：正道稍有好感；魔修却未必领情
    if(st.align){addRep(st.id,6);log('good','你抱拳一礼，退开让路。'+st.n+'修士眼中掠过一丝赞许，收起灵光扬长而去（'+st.n+'好感 +6）。');}
    else if(Math.random()<0.35){log('bad','你礼让三分，'+st.n+'修士却狞笑一声：「识相的，把命也留下！」——动手了！');mjStartFight();return;}
    else log('story','你抱拳礼让，退开一步。'+st.n+'修士冷哼一声，携宝而去。');
    m.enc=null;renderAll();save();return;
  }
  if(c==='awe'){ // 震慑：境界与魂势压人
    const p=clamp(0.35+0.08*soulRankIdx()+0.04*curR(),0,0.9);
    if(Math.random()<p){
      addHatred(st.id,10);
      log('good','你气势如渊，眸光似刀——'+st.n+'修士面色数变，竟不敢动手，弃宝而遁（'+st.n+'仇恨 +10）。');
      mjTreasure(0.8);
    }else{
      log('bad','对方不吃这一套，狞笑出剑——动手了！');
      mjStartFight();return;
    }
    m.enc=null;renderAll();save();return;
  }
  mjStartFight();
}
function mjStartFight(){
  const m=mjNew();
  if(!m.enc)return;
  const ed={n:m.enc.foeN,r:m.enc.foeR,m:m.enc.foeM,noAfx:1,mj:{type:'rob',sect:m.enc.sect}};
  log('story','【'+mjRealmName()+'】一场恶战难免——胜者才配携宝而归！');
  beginBattle('mijing',-1,ed,0);
}

/* ---------------- 秘境战结算（winBattle 分支调用） ---------------- */
function winMijingBattle(){
  const m=mjNew(),ed=B.e;
  const type=(ed.mj&&ed.mj.type)||'guard';
  if(type==='rob'){
    const st=SECTS_BY_ID[ed.mj.sect];
    addHatred(ed.mj.sect,25);
    if(!st.align){ // 诛除魔修，正道诸派口碑 +4
      SECTS.filter(x=>x.align).forEach(x=>addRep(x.id,4));
      log('good','魔修授首，大快人心——正道诸派听闻此事，对你刮目相看（正道好感 +4）。');
    }else{
      log('bad','你斩了'+st.n+'弟子，夺其宝而归——'+st.n+'与你结下血仇（仇恨 +25）！');
    }
    mjTreasure(1.2);
  }else if(type==='hunter'){ // 反杀追杀者：仇恨大减
    const st=SECTS_BY_ID[ed.mj.sect];
    addHatred(ed.mj.sect,-80);
    log('good','【'+st.n+'】追杀者授首！你名震秘境——'+st.n+'恨你入骨，却也暂时不敢再犯（仇恨 -80）。');
    mjTreasure(1.5);
  }else{
    log('good','守卫妖兽伏诛，秘境宝物任取！');
    mjTreasure(1.3);
  }
  m.enc=null;m.ambush=null;
}

/* ---------------- 仇家追杀（nextDay 结算） ---------------- */
function mjHunters(){
  const m=mjNew();
  Object.keys(m.hatred).forEach(function(id){
    const v=m.hatred[id],stg=hatredStage(v);
    if(stg<2)return;
    if(Math.random()>=(stg===2?0.25:0.5))return;
    const st=SECTS_BY_ID[id];
    if(!st)return;
    const lose=Math.floor(S.stones*0.05);
    S.stones=Math.max(0,S.stones-lose);
    m.ambush={sect:id};
    log('bad','【'+st.n+'】'+HATRED_STAGES[stg]+'——仇家寻至，半路截杀！仓促应战间被夺走'+moneyName()+' '+fmtMoney(lose)+'。可于「秘境」页反击雪仇。');
  });
}
function mjHunterFight(){
  const m=mjNew();
  if(!m.ambush){toast('暂无仇家截杀');return;}
  if(B&&!B.over){toast('战斗尚未结束');return;}
  const st=SECTS_BY_ID[m.ambush.sect];
  const ed={n:st.n+'追杀者',r:Math.min(21,curR()+1),m:1.8+(hatredOf(st.id)>=200?0.5:0),boss:1,noAfx:1,
    mj:{type:'hunter',sect:st.id}};
  log('story','【'+st.n+'】追杀者堵住去路：「夺我宗宝者，留下性命！」');
  beginBattle('mijing',-1,ed,0);
}

/* ---------------- 秘境页 ---------------- */
function renderMijing(){
  const m=mjNew(),r=curR();
  const nm=mjRealmName();
  const usedToday=m.used>=1&&m.day===S.day;
  let html='<div class="grid2"><div>';
  html+='<div class="panel"><h3>秘境 · '+nm+'<span class="tag">'+REALMS[r].name+'</span></h3>'+
   '<p class="small">每一个大境界都有一处秘境：灵雾深处既有前人洞府的<b class="gold">珍宝</b>，也有守卫妖兽，'+
   '更有各派修士<b class="blood">杀人夺宝</b>。出手夺宝会积累该门派仇恨——魔修当诛，正道宜敬。</p>'+
   '<div style="margin-top:8px"><button class="btn big" '+(usedToday?'disabled':'')+' onclick="enterMijing()">探入秘境（2 行动点'+(usedToday?' · 今日已探':'')+'）</button></div>'+
   (m.ambush?'<p class="small blood" style="margin-top:6px">⚠ 有仇家在野外包抄截杀——反击雪仇（2 行动点）。</p>'+
    '<button class="btn danger" onclick="mjHunterFight()">反击追杀者</button>':'')+
   '</div>';
  if(m.enc){
    const st=SECTS_BY_ID[m.enc.sect];
    html+='<div class="panel"><h3>遭遇 · '+m.enc.foeN+'<span class="tag '+(st.align?'rank':'no')+'">'+(st.align?'正道':'魔道')+'</span></h3>'+
     '<p class="small">'+st.d+'</p>'+
     '<p class="small blood">对方携宝而立，杀意毫不掩饰——如何处置？</p>'+
     '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'+
      '<button class="btn danger" onclick="mjChoice(\'fight\')">出手夺宝（恶战 · '+(st.align?'正道仇恨 +25':'魔道仇恨 +25')+'）</button>'+
      '<button class="btn" onclick="mjChoice(\'awe\')">气势震慑（魂势压人 · 成则得宝）</button>'+
      '<button class="btn ghost" onclick="mjChoice(\'yield\')">抱拳礼让（正道好感 +6 · 魔修或趁势来犯）</button>'+
     '</div></div>';
  }
  html+='</div><div>';
  html+='<div class="panel"><h3>门派恩怨录</h3>'+
   '<p class="small muted">仇恨四阶：0–49 相安无事 · 50–99 心生敌意 · 100–199 悬赏追杀 · 200+ 不死不休。'+
   '震慑 +10、出手夺宝 +25；反杀追杀者 -80。诛魔修则正道诸派皆有好感。</p>'+
   SECTS.map(function(st){
     const h=hatredOf(st.id),stg=hatredStage(h),rp=repOf(st.id);
     const cls=stg>=2?'blood':(stg===1?'gold':'jade');
     return '<div class="row-item"><div class="info"><div class="nm">'+st.n+
      '<span class="tag '+(st.align?'rank':'no')+'">'+(st.align?'正道':'魔道')+'</span>'+
      (stg>0?'<span class="tag '+cls+'">'+HATRED_STAGES[stg]+' '+h+'</span>':'<span class="tag">无怨 '+h+'</span>')+
      (st.align&&rp>0?'<span class="tag rank">好感 '+rp+'</span>':'')+'</div>'+
      '<div class="small muted">'+st.d+'</div></div></div>';
   }).join('')+'</div>';
  html+='</div></div>';
  $('main').innerHTML=html;
}
