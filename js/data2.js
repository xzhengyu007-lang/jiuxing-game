/* ============================================================
 * data2.js —— 大扩充：新药材 / 新材料 / 新丹药丹方 / 妖兽大图鉴 / 商行分阶货架
 * 依赖 data.js（在其后加载）；social.js 与 game.js 在其后
 * ============================================================ */

/* ---------- 新药材（含仙界 11/12 品） ---------- */
Object.assign(HERBS,{
 dihuang:{n:'地黄精',t:1},   ninglu:{n:'凝露草',t:2},   yuejian:{n:'月见兰',t:3},
 chisui:{n:'赤髓藤',t:3},    bingxin:{n:'冰心莲',t:4},  jinxian:{n:'金线血芝',t:5},
 ziyao:{n:'紫曜花',t:6},     bihun:{n:'碧魂竹米',t:6},  jiuye:{n:'九叶龙芝',t:7},
 taiyin:{n:'太阴玄晶草',t:8},hunyuan:{n:'混元青莲籽',t:9},wanhun:{n:'万魂兰',t:10},
 xianling:{n:'仙灵草',t:11}, jiutian:{n:'九天仙莲',t:12},
});
HERBS_BY_TIER[11]=Object.keys(HERBS).filter(function(id){return HERBS[id].t===11;});
HERBS_BY_TIER[12]=Object.keys(HERBS).filter(function(id){return HERBS[id].t===12;});

/* ---------- 新材料（妖兽掉落：丹道、赠礼、商行通货） ---------- */
Object.assign(MATS,{
 yaodan:{n:'妖丹',t:1},    shoupi:{n:'妖皮革',t:1},  yaogu:{n:'妖骨',t:2},
 lingyu:{n:'灵羽',t:2},    neidan:{n:'内丹',t:3},    yusu:{n:'玉髓',t:3},
 xiejing:{n:'邪晶',t:4},   longlin:{n:'龙鳞',t:5},   shenxue:{n:'神血晶',t:6},
 daowen:{n:'道纹石',t:7},
});
function matPrice(id,r){
  const t=(MATS[id]&&MATS[id].t)||1;
  return Math.floor(40*Math.pow(1.9,t)*Math.pow(1.3,r));
}

/* ---------- 新丹药（含全新「合欢露」双修之引） ---------- */
Object.assign(PILLS,{
 longli:{n:'龙力丹',f:'atk',t:4,m:1.6,d:'以赤髓藤合妖丹炼制：永久攻击大幅增益。'},
 tiangan:{n:'铁骨丹',f:'def',t:4,m:1.6,d:'冰心莲合妖骨炼制：永久防御大幅增益。'},
 manxue:{n:'蛮血丹',f:'hp',t:4,m:1.6,d:'金线血芝合妖皮革炼制：永久气血大幅增益。'},
 hehuan:{n:'合欢露',f:'dual',t:5,m:1.5,d:'凝露草月见兰合玉髓酿成：服下后次日「双修」之效大增。'},
 tianren:{n:'天人丹',f:'perm',t:6,m:2,d:'紫曜花、碧魂竹米合内丹炼制：永久全属性大增。'},
 qingpo:{n:'清魄返神丹',f:'danxp',t:5,m:2,d:'碧魂竹米合邪晶炼制：丹修阅历大补，启灵开智。'},
 jiuzhuan:{n:'九转金丹',f:'atk',t:9,m:3,d:'太阴玄晶草、龙鳞、道纹石九转而成：攻击暴增，仙家手笔。'},
 xuanyang:{n:'玄阳固本丹',f:'hp',t:9,m:3,d:'太阴玄晶草合神血晶固本培元：气血暴增。'},
 puti:{n:'菩提玉髓丹',f:'perm',t:8,m:2.5,d:'混元青莲籽、神血晶、道纹石炼制：脱胎换骨，全属性暴涨。'},
});

/* ---------- 新丹方（rank=所需丹修阶位） ---------- */
RECIPES.push(
 {id:'r_longli', rank:3,out:'longli', mats:{chisui:2,yaodan:1,lingcao:2},       exp:20},
 {id:'r_tiangan',rank:3,out:'tiangan',mats:{bingxin:2,yaogu:1,lingcao:2},       exp:20},
 {id:'r_manxue', rank:3,out:'manxue', mats:{jinxian:2,shoupi:2,xuecao:1},       exp:20},
 {id:'r_hehuan', rank:4,out:'hehuan', mats:{ninglu:3,yuejian:2,yusu:1},         exp:26},
 {id:'r_tianren',rank:5,out:'tianren',mats:{ziyao:2,bihun:1,neidan:1},          exp:34},
 {id:'r_qingpo', rank:5,out:'qingpo', mats:{bihun:2,xiejing:1},                 exp:30},
 {id:'r_jiuzhuan',rank:7,out:'jiuzhuan',mats:{taiyin:2,longlin:1,daowen:1},     exp:60},
 {id:'r_xuanyang',rank:7,out:'xuanyang',mats:{taiyin:2,shenxue:2},              exp:56},
 {id:'r_puti',   rank:8,out:'puti',   mats:{hunyuan:1,shenxue:1,daowen:1,jiuye:2},exp:80}
);

/* ---------- 妖兽大图鉴：新词缀池 + 各图新怪 + 新小王 ---------- */
const EN_PRE2=['墨鳞','裂风','赤目','幽泉','碎星','寒潭','金鬃','噬魂','焚翼','苍岚','灰烬','月轮','狂澜','蚀骨','紫电','翠羽','玄脊','血鬃','银霜','怒涛','青冥','燎原','坠日','惊鸿'];
const EN_BEAST2=['蜈','蝎','雕','蟒','狼','猿','龟','蛟','狮','鸦','虎','蛛','豹','犀','鹤','貂','蝠','蜥','鳄','鹿','狐','熊','鲨','鲲','猊','魈','鹏','兕','狻','螭'];
(function(){
  let k=0;
  ZONES.forEach(function(z){
    const base=z.enemies[0].r||z.reqR||1;
    z.enemies.push(
      {n:EN_PRE2[k%24]+EN_BEAST2[(k*7+3)%30],r:Math.min(21,base),m:1.05},
      {n:EN_PRE2[(k*3+5)%24]+EN_BEAST2[(k*11+7)%30],r:Math.min(21,base+1),m:1.5}
    );
    if(!z.enemies.some(function(e){return e.boss&&e.m>=2.5;})){
      z.enemies.push({n:EN_PRE2[(k*5+11)%24]+EN_BEAST2[(k*13+17)%30]+'王',r:Math.min(21,base+1),m:2.55,boss:1});
    }
    k++;
  });
  // 手工名图各添一头守护妖王（生成图 id 形如 z0/z1…）
  const GUARD=['青风隼王','裂石魔猿王','蚀骨阴蟒王','怒涛蛟皇','血狱修罗王','焚天炎麟王','噬魂邪君','碎星古神兽','坠日天鹏王'];
  let gi=0;
  ZONES.forEach(function(z){
    if(/^z\d+$/.test(z.id||''))return; // 生成图跳过
    if(gi<GUARD.length){
      const base=z.enemies[0].r||z.reqR||1;
      z.enemies.push({n:GUARD[gi],r:Math.min(21,base+2),m:3.0,boss:1});
      gi++;
    }
  });
})();

/* ---------- 赠礼（红尘赠佳人，好感之资） ---------- */
const GIFT_DEFS={
 lingcha:{n:'灵茶',cat:'tea', aff:12,d:'云雾灵茶，知己对饮。'},
 xiangnang:{n:'绣香囊',cat:'orn', aff:16,d:'亲手绣的香囊，暗香浮动。'},
 lingjiu:{n:'百年灵酒',cat:'wine',aff:20,d:'酒香醉人，豪爽之人最喜。'},
 yanzhi:{n:'紫玉胭脂',cat:'orn', aff:24,d:'紫玉为底的胭脂，佳人妆奁之物。'},
 jiansui:{n:'剑穗',cat:'art', aff:30,d:'以剑穗相赠，江湖之意。'},
 huace:{n:'山河画册',cat:'art', aff:32,d:'丹青高手所绘山河万里。'},
 yuzhuo:{n:'暖玉镯',cat:'orn', aff:40,d:'暖玉琢成的镯子，莹润生光。'},
 qin:{n:'焦尾古琴',cat:'art', aff:55,d:'桐木焦尾，七弦通灵。'},
 jinxiu:{n:'云锦天衣',cat:'rare',aff:60,d:'云锦织就的衣料，一寸锦绣一寸金。'},
 longxiang:{n:'龙涎香',cat:'rare',aff:80,d:'龙涎凝香，一炉可清神百日。'},
};


/* ---------- 商行分阶货架（随境界解锁更多商品） ---------- */
const SHOP2=[
 {reqR:0,items:[
  {k:'lingcha', costFn:function(r){return Math.floor(250*(1+0.15*r));}},
  {k:'lingcao10b',n:'灵草 x20',cost:function(r){return Math.floor(110*Math.pow(1.5,r));},give:function(S){S.herbs.lingcao=(S.herbs.lingcao||0)+20;}},
  {k:'yaodan10',n:'妖丹 x10',cost:function(r){return Math.floor(220*Math.pow(1.5,r));},give:function(S){S.mats.yaodan=(S.mats.yaodan||0)+10;}},
  {k:'shoupi10',n:'妖皮革 x10',cost:function(r){return Math.floor(200*Math.pow(1.5,r));},give:function(S){S.mats.shoupi=(S.mats.shoupi||0)+10;}},
 ]},
 {reqR:2,items:[
  {k:'lingjiu',costFn:function(r){return Math.floor(500*(1+0.15*r));}},
  {k:'yanzhi', costFn:function(r){return Math.floor(1200*(1+0.15*r));}},
  {k:'yaogu10',n:'妖骨 x10',cost:function(r){return Math.floor(420*Math.pow(1.5,r));},give:function(S){S.mats.yaogu=(S.mats.yaogu||0)+10;}},
  {k:'longli',n:'龙力丹 x1',cost:function(r){return Math.floor(pillPrice('longli',r)*2.2);},give:function(S){S.pills.longli=(S.pills.longli||0)+1;}},
 ]},
 {reqR:4,items:[
  {k:'jiansui',costFn:function(r){return Math.floor(2500*(1+0.15*r));}},
  {k:'huace',  costFn:function(r){return Math.floor(4000*(1+0.15*r));}},
  {k:'hehuan',n:'合欢露 x1',cost:function(r){return Math.floor(pillPrice('hehuan',r)*2.2);},give:function(S){S.pills.hehuan=(S.pills.hehuan||0)+1;}},
  {k:'neidan1',n:'内丹 x1',cost:function(r){return Math.floor(2600*Math.pow(1.5,r));},give:function(S){S.mats.neidan=(S.mats.neidan||0)+1;}},
 ]},
 {reqR:6,items:[
  {k:'yuzhuo',costFn:function(r){return Math.floor(6000*(1+0.15*r));}},
  {k:'qin',   costFn:function(r){return Math.floor(15000*(1+0.15*r));}},
  {k:'tianren',n:'天人丹 x1',cost:function(r){return Math.floor(pillPrice('tianren',r)*2.2);},give:function(S){S.pills.tianren=(S.pills.tianren||0)+1;}},
  {k:'longlin1',n:'龙鳞 x1',cost:function(r){return Math.floor(9000*Math.pow(1.5,r));},give:function(S){S.mats.longlin=(S.mats.longlin||0)+1;}},
 ]},
 {reqR:9,items:[
  {k:'jinxiu',costFn:function(r){return Math.floor(22000*(1+0.15*r));}},
  {k:'shenxue1',n:'神血晶 x1',cost:function(r){return Math.floor(26000*Math.pow(1.5,r));},give:function(S){S.mats.shenxue=(S.mats.shenxue||0)+1;}},
  {k:'jiuzhuan',n:'九转金丹 x1',cost:function(r){return Math.floor(pillPrice('jiuzhuan',r)*2.2);},give:function(S){S.pills.jiuzhuan=(S.pills.jiuzhuan||0)+1;}},
 ]},
 {reqR:12,items:[
  {k:'longxiang',costFn:function(r){return Math.floor(60000*(1+0.15*r));}},
  {k:'daowen1',n:'道纹石 x1',cost:function(r){return Math.floor(60000*Math.pow(1.5,r));},give:function(S){S.mats.daowen=(S.mats.daowen||0)+1;}},
  {k:'puti',n:'菩提玉髓丹 x1',cost:function(r){return Math.floor(pillPrice('puti',r)*2.2);},give:function(S){S.pills.puti=(S.pills.puti||0)+1;}},
 ]},
 {reqR:13,items:[
  {k:'xianling5',n:'仙灵草 x5',cost:function(r){return Math.floor(8000*Math.pow(1.5,r));},give:function(S){S.herbs.xianling=(S.herbs.xianling||0)+5;}},
  {k:'wanhun3',n:'万魂兰 x3',cost:function(r){return Math.floor(5000*Math.pow(1.5,r));},give:function(S){S.herbs.wanhun=(S.herbs.wanhun||0)+3;}},
 ]},
 {reqR:14,items:[
  {k:'jiutian2',n:'九天仙莲 x2',cost:function(r){return Math.floor(30000*Math.pow(1.5,r));},give:function(S){S.herbs.jiutian=(S.herbs.jiutian||0)+2;}},
  {k:'qingpo',n:'清魄返神丹 x1',cost:function(r){return Math.floor(pillPrice('qingpo',r)*2.2);},give:function(S){S.pills.qingpo=(S.pills.qingpo||0)+1;}},
 ]},
];
