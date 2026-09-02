'use strict';
/* ============================================================
 * 九星霸体诀 · 修仙 —— 静态数据
 * 设定依据（网络公开资料整理，见 README.md 来源链接）：
 *  - 境界体系：后天（聚气/凝血/易筋/锻骨/通脉）→ 先天（先天/辟海/铸台/
 *    璇丹/化神/命星/通冥/融天）→ 仙道（蜕凡/神火/四极/神君/仙王/界王/
 *    神尊/不朽/圣境/人皇）
 *  - 九星霸体诀：不修丹田，而修人体内九个秘密宝藏（九星）
 *  - 锻骨境：以祭骨丹祭炼骨骼，四祭/八祭/十祭/十二祭/十六祭/全祭，拼资源
 *  - 九星传人每个大境界需突破十三层小境界（普通修士九层）
 *  - 丹修十阶：丹童 丹徒 丹士 丹师 丹王 丹皇 丹宗 丹尊 丹圣 丹帝
 *  - 璇丹境需“破仙台凝神丹”，且受天劫洗礼，失败仙台爆碎
 * ============================================================ */

/* ---------- 境界阶梯（22 个大境界） ---------- */
const REALMS=[
 {name:'聚气境',tier:'后天',who:'',intro:'以天地灵气灌输身体，存储天地能量为己用——修的是气。',
  desc:'以天地灵气灌输身体，存储天地能量为己用，修的是气。'},
 {name:'凝血境',tier:'后天',who:'',intro:'运转真气，凝练气血，由气化血——从此才算真正的武者。',
  desc:'凝练气血，净化提纯血液；气与血融合，是为“气血”。修的是力。'},
 {name:'易筋境',tier:'后天',who:'',intro:'力养筋，气养神，气与力完美契合——十加十，变作十乘十。',
  desc:'力养筋，气养神；凝血之力是相加，易筋之力是相乘。'},
 {name:'锻骨境',tier:'后天',who:'拼资源',special:'bone',intro:'以骨为基，以筋为络，以血为引，以气为辅——此境拼的不是天赋，是财力。',
  desc:'唯有锻骨不靠天赋而靠资源：以祭骨丹祭炼骨骼，四祭、八祭、十祭、十二祭、十六祭、直至全祭。每多祭炼一根骨头，力量便被动增加一分。'},
 {name:'通脉境',tier:'后天',who:'',intro:'舍弃原本经络，气血筋骨合力重塑一条新的灵气通道——踏入先天的基础。',
  desc:'通脉境需舍弃原来经络，重新塑造一条完整脉络，为存储先天之气做准备。聚气、凝血、易筋、锻骨四境，皆为通脉而准备。'},
 {name:'先天境',tier:'先天',who:'寿元千载',trib:0.75,intro:'引先天之力洗炼肉身，脱胎换骨——寿元千载，容颜不老。',
  desc:'捕捉隐藏于后天灵气中的先天之气，洗炼肉身，蜕尽后天之气。进阶先天，寿命延长十倍，有千年寿元。'},
 {name:'辟海境',tier:'先天',who:'符翼',intro:'开辟气海，符文化翼——自此真正掌控天地之力。',
  desc:'开辟气海，灵元容量暴涨百倍；培养本命符文，召出符翼，勾动天地之力。这是修行的分水岭。'},
 {name:'铸台境',tier:'先天',who:'宗主级',intro:'精气神凝为原始符文，聚沙成塔，铸就仙台。',
  desc:'在气海之上以精、气、神凝聚原始符文，九符化一，铸就仙台。仙古时期，仙台是成仙成神的基础。'},
 {name:'璇丹境',tier:'先天',who:'王级',special:'xuandan',trib:0.55,intro:'破仙台，凝神丹，天劫加身——此境只有一次机会，一鼓作气，不成功便成仁。',
  desc:'仙台爆碎，所有能量汇聚成丹，还要受天劫洗礼。失败率极高：凝丹不成，仙台也爆碎，修为就此断绝。'},
 {name:'化神境',tier:'先天',who:'院主',intro:'精气神三者合一，凝聚元神始符。',
  desc:'将肉身之精、灵元之气、神魂之神合二为一，凝聚元神始符。天赋越高，始符越多——记载中最少三百六十枚，最高九千九百九十九枚。'},
 {name:'命星境',tier:'先天',who:'玄主',special:'mingxing',intro:'以精气神孕育一颗属于自己的星辰，属于自己的世界——舍去过去，涅槃重生。',
  desc:'凝聚生命之星，孕育命星珠。真正的强者需舍弃代表过去的命星珠，重新凝聚代表现在的新珠，如涅槃重生。'},
 {name:'通冥境',tier:'先天',who:'',special:'tongming',intro:'元神极度触摸死亡，于生死一线参悟——不悟生死之道者，冲关即是自杀。',
  desc:'冲击通冥就是让元神极度触摸死亡，在死亡一瞬抓住生的契机，开启异度空间。未参悟生死之道而去冲关，那就真的死了。'},
 {name:'融天境',tier:'先天',who:'蜕凡之始',intro:'与天地相融，蜕尽凡俗之气——先天之路的尽头，仙道之门。',
  desc:'融天境即蜕凡之始，需在此境将下界凡俗之气蜕尽，方能凝聚神火之种，踏入仙道。'},
 {name:'蜕凡境',tier:'仙道',who:'',intro:'蜕尽凡俗之气，静待神火之种凝结成形。',
  desc:'即天武大陆的融天境，但要将自身凡俗之气彻底蜕尽，才能凝聚神火之种。'},
 {name:'神火境',tier:'仙道',who:'',special:'fire',intro:'点燃神火之种，择自身最强之属性——金木水火土，风雷光暗魂。',
  desc:'凝聚并点燃神火之种，决定未来发展方向：金、木、水、火、土、风、雷、光、暗、魂、血、骨……通常选择自己最强的属性。'},
 {name:'四极境',tier:'仙道',who:'',special:'sijie',intro:'天劫散去之前，一炷香内——自亿万符文中择出四道天道符文，顺序不能错。',
  desc:'择四种最强的力量发展。天道符文分赤、橙、黄、绿、青、蓝、紫七品，品阶越高越会隐藏躲避；一炷香内选不对，终身再无四极之机。'},
 {name:'神君境',tier:'仙道',who:'四极合一',intro:'四极合一，拧成一股绳——君临天下。',
  desc:'四种力量开辟到极致后合而为一，彼此呼应。踏入神君境，才算仙界真正的修士，有资格行走八方。'},
 {name:'仙王境',tier:'仙道',who:'灵根凝晶',intro:'灵根凝聚成晶——凡、灵、地、天四品，一定终身。',
  desc:'灵根凝结为仙王晶，分凡、灵、地、天四品。品阶决定上限：凡品止步初期，灵品止步中期，地品止步后期，唯天品可冲击界王。'},
 {name:'界王境',tier:'仙道',who:'掌一方世界',intro:'屹立众生之上的天神，挥手可覆灭乾坤。',
  desc:'仙王之上的境界，掌控一方世界之力，挥手覆灭乾坤。'},
 {name:'神尊境',tier:'仙道',who:'三花聚顶',intro:'人尊、地尊、天尊——灵血、灵根、灵骨三花合一，融通天地。',
  desc:'神尊分人尊、地尊、天尊。三花（精、气、神；灵血、灵根、灵骨）合而为一，头顶三色大道之花，方为真正的三花聚顶。'},
 {name:'不朽境',tier:'仙道',who:'肉身不朽',intro:'肉身与天道共鸣，天地不朽，肉身不灭。',
  desc:'不朽之境第一重肉身不朽；第二重点燃灵魂之火，是为圣者；第三重为圣王。其后再是人圣、地圣、天圣。'},
 {name:'人皇境',tier:'皇境',who:'皇境之下皆蝼蚁',intro:'九条天脉龙气九九归一，经人皇劫洗礼——皇境之下，皆蝼蚁。',
  desc:'天圣凝聚九条天脉龙气九九归一，以种族气运突破，经人皇劫洗礼方成人皇。无论妖、兽、魔、灵，皆需化人形冲击此境。'},
];
const LAYER_CNT=13; // 九星传人每个大境界需十三层小境界
const CN_NUM=['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三'];

/* ---------- 锻骨境：祭炼骨骼需求（累计根数，对应四祭→全祭） ---------- */
const BONES_REQ=[1,2,4,6,8,10,13,16,19,22,25,28,31];

/* ---------- 药材 ---------- */
const HERBS={
 lingcao:{n:'灵草',t:1},   xuecao:{n:'血参',t:2},    ziling:{n:'紫灵芝',t:3},
 mingcao:{n:'冥河草',t:4}, jiaoye:{n:'蛟血藤',t:5},  xuanye:{n:'玄阴花',t:6},
 longxue:{n:'龙血草',t:7}, mosui:{n:'魔髓晶',t:8},   shenying:{n:'神英花',t:9},
 huncao:{n:'魂息草',t:10},
};
const MATS={ shouhe:{n:'兽核'} };

/* ---------- 丹药 ---------- */
const PILLS={
 huiqi:  {n:'回气丹',      d:'恢复六成气血，战斗中亦可服用。'},
 juling: {n:'聚灵丹',      d:'服用后五分钟内修炼速度+60%。'},
 pojing: {n:'破境丹',      d:'冲击境界时自动服用，成功率+20%（一次性消耗）。'},
 xiusui: {n:'洗髓丹',      d:'永久+3%攻防气血，可无限叠加。脱胎换骨之效。'},
 jigu:   {n:'祭骨丹',      d:'祭炼骨骼所必需。锻骨境拼的不是天赋，是财力。'},
 huming: {n:'护命丹',      d:'随身携带，重伤之时自动保命，恢复五成气血。'},
 xuandan:{n:'破仙台凝神丹',d:'冲击璇丹境的必需丹药：仙台爆碎，所有能量汇聚成丹，一鼓作气。'},
 shengsi:{n:'生死轮回丹',  d:'助人参悟生死之道，冲击通冥境时自动服用，十拿九稳。'},
 shenhuo:{n:'神火引',      d:'凝聚神火之种的引子，点燃属于自己的神火。'},
};

/* ---------- 丹方（rank=所需丹修阶位 0丹童…9丹帝） ---------- */
const RECIPES=[
 {id:'huiqi',  rank:1, out:'huiqi',  mats:{lingcao:2},                 exp:6},
 {id:'juling', rank:2, out:'juling', mats:{lingcao:3,xuecao:1},        exp:9},
 {id:'pojing', rank:2, out:'pojing', mats:{xuecao:2,ziling:1},         exp:10},
 {id:'jigu',   rank:2, out:'jigu',   mats:{lingcao:4,shouhe:1},        exp:12},
 {id:'xiusui', rank:3, out:'xiusui', mats:{ziling:2,shouhe:2},         exp:14},
 {id:'huming', rank:5, out:'huming', mats:{mingcao:2,jiaoye:1},        exp:22},
 {id:'xuandan',rank:6, out:'xuandan',mats:{jiaoye:2,xuanye:2,shouhe:3},exp:30},
 {id:'shengsi',rank:7, out:'shengsi',mats:{xuanye:2,mosui:1},          exp:40},
 {id:'shenhuo',rank:8, out:'shenhuo',mats:{mosui:2,shenying:2},        exp:60},
];
const DAN_RANKS=['丹童','丹徒','丹士','丹师','丹王','丹皇','丹宗','丹尊','丹圣','丹帝'];
const DAN_EXP=[0,80,300,900,2500,6000,15000,40000,100000,250000];

/* ---------- 装备（slot: weapon/armor/treasure/acc） ---------- */
const EQ={
 zhanxie:  {n:'斩邪刀',  slot:'weapon', atk:1.6, d:'正气之刀，刀出斩邪。原著中龙尘第227章所得。'},
 xueyin:   {n:'血饮刀',  slot:'weapon', atk:2.0, d:'以血养刀，饮敌之血反哺己身，攻击附带10%吸血。原著第402章获得。'},
 heiguo:   {n:'黑锅',    slot:'treasure', atk:1.25, def:1.25, d:'四国遗迹中所得的神秘黑锅，来历成谜，攻防兼备。原著第1204章出现。'},
 zixue:    {n:'紫血战袍',slot:'armor', def:1.5, hp:1.3, d:'紫血宗制式战袍，浸透先辈血勇。'},
 julingzhui:{n:'聚灵坠', slot:'acc', qps:1.35, d:'温养灵气，修炼速度+35%。'},
};

/* ---------- 战技 ---------- */
const SKILLS=[
 {id:'bati',   name:'霸体拳',  qi:0,  mult:1.5, cd:0, d:'至刚至猛，肉身之力一往无前。'},
 {id:'zhanxie',name:'斩邪刀法',qi:12, mult:2.6, cd:0, effect:'bleed', req:{eq:'zhanxie'}, d:'刀出斩邪，正气凛然，令敌人血流不止。'},
 {id:'xueyin', name:'血饮狂刀',qi:18, mult:3.4, cd:2, effect:'steal',  req:{eq:'xueyin'},  d:'以血养刀，造成伤害并吸取其中三成化为自身气血。'},
 {id:'heiguo', name:'黑锅镇邪',qi:22, mult:2.2, cd:3, effect:'stun',   req:{eq:'heiguo'},  d:'黑锅一出，诸邪避退：无视防御，并震慑敌人一回合。'},
 {id:'lianzhu',name:'九星连珠',qi:30, mult:0,   cd:2, effect:'stars',  req:{stars:3},      d:'体内九星之力一线贯通，星辰轰然而落。星数越多威力越强。'},
 {id:'tianyun',name:'命星天陨',qi:45, mult:6.0, cd:3, req:{realm:10}, d:'引命星之力自九天陨落，命星境强者方可驾驭。'},
];

/* ---------- 历练区域与妖敌 ---------- */
const ZONES=[
 {id:'fengming',name:'凤鸣城郊',   reqR:0, herbs:['lingcao'],           d:'天武大陆东荒·凤鸣帝国城郊，野狼与山贼出没。', enemies:[
   {n:'野狼',r:0,m:0.8},{n:'山贼',r:0,m:1.0},{n:'山贼头目',r:0,m:1.7,boss:1}]},
 {id:'heifeng', name:'黑风林',     reqR:1, herbs:['lingcao','xuecao'],  d:'黑风阵阵，传说林深之处藏着一座古墓。', enemies:[
   {n:'黑风狼',r:1,m:0.9},{n:'铁背熊',r:1,m:1.3},{n:'黑风狼王',r:1,m:2.4,boss:1}]},
 {id:'luoxia',  name:'落霞山脉',   reqR:2, herbs:['xuecao','ziling'],   d:'霞光之下暗藏杀机，妖兽横行。', enemies:[
   {n:'赤炎虎',r:2,m:1.0},{n:'妖猿',r:3,m:1.2},{n:'赤炎虎王',r:3,m:2.4,boss:1}]},
 {id:'wangu',   name:'万骨原',     reqR:4, herbs:['ziling','mingcao'],  d:'白骨露于野，阴气冲天，传闻四国遗迹便埋于此。', enemies:[
   {n:'骨蜥',r:4,m:1.0},{n:'尸傀',r:4,m:1.4},{n:'白骨将',r:5,m:2.5,boss:1}]},
 {id:'yunmeng', name:'云梦泽',     reqR:5, herbs:['mingcao','jiaoye'],  d:'大泽千里，雾隐蛟藏。', enemies:[
   {n:'碧水蛟',r:5,m:1.0},{n:'雾隐妖蟒',r:6,m:1.2},{n:'碧水蛟王',r:6,m:2.5,boss:1}]},
 {id:'zixue',   name:'紫血宗·血狱秘境',reqR:6, sect:1, herbs:['jiaoye','xuanye'], d:'紫血宗重地，血狱之中代代先辈血勇不散。', enemies:[
   {n:'血影卫',r:6,m:1.1},{n:'血狱修罗',r:7,m:1.3},{n:'血狱护法',r:7,m:2.5,boss:1}]},
 {id:'elong',   name:'恶龙域·边缘',reqR:7, herbs:['xuanye','longxue'],  d:'恶龙域曾是恶龙族领地，数千种恶龙群龙割据，凶兽、妖兽、魔兽横行无忌。', enemies:[
   {n:'恶龙幼崽',r:8,m:1.1},{n:'双翼恶龙',r:8,m:1.4},{n:'三首恶龙',r:9,m:2.6,boss:1}]},
 {id:'xiezu',   name:'邪族裂隙',   reqR:9, herbs:['longxue','mosui'],   d:'空间裂隙之中，邪族修士与邪灵窥视人间。', enemies:[
   {n:'邪修',r:9,m:1.2},{n:'邪灵',r:10,m:1.4},{n:'邪将',r:10,m:2.7,boss:1}]},
 {id:'zhongzhou',name:'中州·神战废墟',reqR:11, herbs:['mosui','shenying'],d:'上古神战之地，断剑沉戈，邪气未消。', enemies:[
   {n:'堕落神侍',r:11,m:1.2},{n:'邪族领主',r:12,m:1.4},{n:'邪侯',r:12,m:2.8,boss:1}]},
 {id:'xingkong',name:'星空古路',   reqR:14, herbs:['shenying','huncao'], d:'横贯星空的古路，尽头处有邪皇的气息在涌动……', enemies:[
   {n:'星空邪灵',r:14,m:1.2},{n:'邪皇子',r:16,m:1.5},{n:'九天邪皇·分身',r:19,m:2.8,boss:1,final:1}]},
];

/* ---------- 九星（北斗九星之名，对应人体九大秘藏） ---------- */
const STARS=[
 {name:'风府星',alias:'灵窍初开',fx:'qps',  fxV:0.25,reqR:1, qiMul:15,  stones:500,
  d:'风府为九星之门户：开启后灵气出入如风，修炼速度 +25%。'},
 {name:'玉衡星',alias:'执掌天平',fx:'cap',  fxV:0.30,reqR:2, qiMul:20,  stones:2200,
  d:'玉衡主衡准：每日修为上限 +30%，一日可多得三成造化。'},
 {name:'司命星',alias:'生死簿',  fx:'ap',   fxV:4,   reqR:3, qiMul:30,  stones:7000,
  d:'司命掌寿数：每日行动点 +4，一日抵人两日。'},
 {name:'宫启星',alias:'开天门',  fx:'atk',  fxV:0.30,reqR:4, qiMul:45,  stones:18000,
  d:'宫启为战伐之门：攻击 +30%，一力破万法。'},
 {name:'神关星',alias:'天阙',    fx:'def',  fxV:0.30,reqR:5, qiMul:70,  stones:45000,
  d:'神关为守护之隘：防御与气血 +30%，不动如山。'},
 {name:'冥门星',alias:'幽都',    fx:'drop', fxV:0.50,reqR:6, qiMul:110, stones:12e4,
  d:'冥门通幽冥：妖兽精英与宝物现世之率大增，掉落 +50%。'},
 {name:'紫阙星',alias:'帝庭',    fx:'craft',fxV:0.15,reqR:7, qiMul:170, stones:30e4,
  d:'紫阙居帝庭：丹道通神，炼丹成功率 +15%。'},
 {name:'涅冲星',alias:'浴火',    fx:'gain', fxV:0.50,reqR:9, qiMul:260, stones:75e4,
  d:'涅冲主轮回：战斗与采药所得 +50%，置之死地而后生。'},
 {name:'镇道星',alias:'万古',    fx:'all',  fxV:0.50,reqR:11,qiMul:400, stones:180e4,
  d:'镇道为九星之首：全属性 +50%、修炼速度再 +25%，一星镇万道。'},
];

/* ---------- 凝星丹：九星各有专属丹药，六等品阶（普通/上品/特品/完美/神丹/巨丹） ---------- */
const STAR_PILL_Q=[ /* pw=丹力（1 丹力=1 枚普通星丹的凝聚之力） */
 {s:'普通',m:1,pw:1},{s:'上品',m:2,pw:4},{s:'特品',m:3.5,pw:16},{s:'完美',m:6,pw:64},{s:'神丹',m:10,pw:256},{s:'巨丹',m:18,pw:1024}
];
function pillPow(i,q){return Math.round(STAR_PILL_Q[q].pw*(1+i*0.5));} // 星阶越高，其星丹丹力越强
function starNeed(i,lv){ // 星 i 凝至第 lv+1 重所需丹力：星间 x3，每重 x1.5（海量丹药，成星为毕生之功）
  return Math.round(10*Math.pow(3,i)*Math.pow(1.5,lv));
}
/* ---------- 货币：凡界灵石 / 仙界仙石，皆分下、中、上、极品（相邻十倍） ---------- */
const GEM_Q=['下品','中品','上品','极品'];
const XIAN_R=13;              // 神火境起为仙界；融天境（12）为凡间之巅
const STONE_XRATE=10000;      // 1 仙石（下品）= 10000 灵石（下品）
/* 凝星十三重（九星共此进阶之路，每星各自凝炼） */
const STAR_STAGES=['星尘初聚','微芒始现','星火一点','星核初成','星环初绕','星纹天成','星魄内凝','星辉灌体','星海映身','星冕加顶','星劫淬真','星光通明','星汉圆满'];
(function(){
  for(let i=0;i<STARS.length;i++){
    const st=STARS[i];
    for(let q=0;q<STAR_PILL_Q.length;q++){
      const Q=STAR_PILL_Q[q];
      PILLS['star'+i+'_'+q]={n:(q?Q.s+'·':'')+st.name+'丹',f:'star',t:Math.min(10,st.reqR+1),m:Q.m,
        d:'凝星之丹（'+Q.s+'，丹力 '+pillPow(i,q)+'）：凝聚【'+st.name+'】（'+st.alias+'）——凝星每一重都需海量丹力，品阶越高丹力越强。请于九星页使用，不可直接服用。'};
    }
  }
})();
/* 凝星丹方：品阶随机，丹道越高越易出高品 */
(function(){
  for(let i=0;i<STARS.length;i++){
    const st=STARS[i],t1=Math.min(8,i)+1;
    RECIPES.push({id:'r_star'+i,out:'star'+i+'_0',starRoll:i,rank:Math.min(9,i),reqR:st.reqR,
      matsGE:[{t:t1,n:6+i},{t:Math.min(10,t1+1),n:3+i}],shouhe:2+i,exp:60+i*40});
  }
})();

/* ---------- 神火之种属性（原著：金木水火土风雷光暗魂……） ---------- */
const FIRE_SEEDS=['金','木','水','火','土','风','雷','光','暗','魂'];

/* ---------- 四极境：天道符文七品 ---------- */
const RUNE_COLORS=[
 {c:'赤',hex:'#e05555',g:1},{c:'橙',hex:'#e08a3c',g:2},{c:'黄',hex:'#f5d76e',g:3},
 {c:'绿',hex:'#7ec97e',g:4},{c:'青',hex:'#5fd0c0',g:5},{c:'蓝',hex:'#5a9be6',g:6},
 {c:'紫',hex:'#a78bfa',g:7},{c:'彩',hex:'#ffffff',g:10},
];

/* ============================================================
 * 日程 / 华云商行 / 混沌珠
 * ============================================================ */

/* ---------- 时间与行动点 ---------- */
const AP_BATTLE=2, AP_EXPLORE=1, AP_CRAFT=1, AP_REFINE=1, AP_PLANT=1, AP_WATER=1, AP_BREATHE=1;
function apMax(r){return 22+r*2;}          // 每日行动点（随境界略增，足够宽裕）
const COND_SLOW=8;                          // 神树全枯时每日状态回复（缓慢）
const COND_PER_TREE=5;                      // 每棵存活神树的每日额外回复
const TREE_DAILY_DECAY=25;                  // 神树每日茂盛度衰减
const TREE_WATER=25;                        // 浇灌一次回复的茂盛度（全体）
const TREE_MAX=9;                           // 混沌神树至多九株

/* ---------- 灵植种子（混沌珠种植）：tier=品阶 ---------- */
const SEEDS={
 lingcao:{reqR:0}, xuecao:{reqR:1}, ziling:{reqR:2}, mingcao:{reqR:4}, jiaoye:{reqR:5},
 xuanye:{reqR:6}, longxue:{reqR:7}, mosui:{reqR:9}, shenying:{reqR:11}, huncao:{reqR:14},
};
function seedCost(t){return Math.floor(30*Math.pow(1.6,t));} // 种子费（灵石）
function growDays(t){return t;}                              // 生长天数=品阶
function harvestYield(t){return 2+t;}                        // 收获株数
function herbPrice(t){return Math.floor(6*Math.pow(1.6,t));} // 商行收购价/株

/* ---------- 混沌神树 ---------- */
function saplingCost(r){return Math.floor(2000*Math.pow(1.5,r));} // 植树费用
function reviveCost(r){return Math.floor(1200*Math.pow(1.5,r));}  // 复苏枯树费用

/* ---------- 灵兽（混沌珠灵兽栏，无限空间） ---------- */
const BEASTS={
 fengqun:{n:'玉蜂群', out:'lingcao', qty:3,    cost:r=>Math.floor(300*Math.pow(1.5,r)), d:'每日产出灵草 x3，蜜香满园。'},
 langbei:{n:'灵狼崽', out:'shouhe',  qty:1,    cost:r=>Math.floor(500*Math.pow(1.5,r)), d:'每日产出兽核 x1，天生战意。'},
 niubei: {n:'灵牛崽', out:'stones',  qty:r=>Math.floor(40*Math.pow(1.5,r)), cost:r=>Math.floor(600*Math.pow(1.5,r)), d:'每日产出灵石，任劳任怨。'},
};

/* ---------- 华云商行：丹药收购价 ---------- */
const PILL_BASE_PRICE={huiqi:60,juling:100,pojing:150,xiusui:300,jigu:100,huming:400,xuandan:800,shengsi:1000,shenhuo:1500};
function pillPrice(pid,r){return Math.floor((PILL_BASE_PRICE[pid]||50)*Math.pow(1.4,r));}
function corePrice(r){return Math.floor(40*Math.pow(1.5,r));} // 兽核收购价

/* ============================================================
 * 大千世界（程序生成）：千种灵植 · 三百余丹药 · 诸境地图
 * ============================================================ */

/* ---------- 千种灵植：10 属性 × 10 品阶 × 20 变体（+10 奇珍 = 2010 种） ---------- */
const HERB_ATTRS=['金','木','水','火','土','风','雷','光','暗','魂'];
const HERB_VARS=['霜','月','幽','云','霞','古','龙','凤','神','圣',
 '御','魔','仙','冥','霄','罡','玄','荒','曜','墟'];
const HERB_BODIES=['草','参','芝','花','藤','果','莲','兰','葵','蕨'];
(function(){
  for(let b=0;b<10;b++)for(let v=0;v<HERB_VARS.length;v++)for(let a=0;a<10;a++){
    HERBS['x'+v+''+a+''+b]={n:HERB_VARS[v]+HERB_ATTRS[a]+HERB_BODIES[b],t:b+1,a:a};
  }
})();
const HERBS_BY_TIER=[null];
for(let t=1;t<=10;t++)HERBS_BY_TIER.push(Object.keys(HERBS).filter(function(id){return HERBS[id].t===t;}));

/* ---------- 丹药：12 系 × 10 品阶 × 5 品质 = 600 种（另有原版 9 种） ---------- */
const PILL_VARS=[{s:'',m:1},{s:'上品',m:1.8},{s:'极品',m:3.2},{s:'绝品',m:6},{s:'仙品',m:12}];
const PILL_FAMS=[
 {base:'回气丹',f:'heal', d:function(t){return '战斗中服用：恢复气血 '+Math.round(Math.min(95,40+6*t))+'%起（随品质提升）。';}},
 {base:'聚灵丹',f:'qpsb', d:function(t){return '服用后五分钟内修炼速度 +'+(15*t)+'%起（随品质提升）。';}},
 {base:'破境丹',f:'break', d:function(t){return '冲击境界时自动服用，成功率+'+Math.round(Math.min(35,10+2.5*t))+'%起。';}},
 {base:'洗髓丹',f:'perm', d:function(t){return '永久全属性 +'+(1.5+0.5*t).toFixed(1)+'%起，可无限叠加。';}},
 {base:'护命丹',f:'save', d:function(t){return '随身携带，重伤时自动保命，回复 '+Math.round(Math.min(95,45+4*t))+'% 气血。';}},
 {base:'清神丹',f:'cond', d:function(t){return '立时回复状态 +'+(8+3*t)+'，神清气爽。';}},
 {base:'蓄元丹',f:'qi', d:function(t){return '立时涌出大量灵气（约合当前层数进度的数成）。';}},
 {base:'启灵丹',f:'danxp', d:function(t){return '丹修阅历 +'+(15+25*t)+'，炼丹一途日进斗金。';}},
 {base:'行气丹',f:'ap', d:function(t){return '今日行动点 +'+Math.min(10,1+Math.ceil(t/2))+'（当日有效）。';}},
 {base:'锻体丹',f:'hp', d:function(t){return '永久气血 +'+(1+0.4*t).toFixed(1)+'%起。';}},
 {base:'罡气丹',f:'atk', d:function(t){return '永久攻击 +'+(1+0.4*t).toFixed(1)+'%起。';}},
 {base:'凝神丹',f:'def', d:function(t){return '永久防御 +'+(1+0.4*t).toFixed(1)+'%起。';}},
];
(function(){
  for(let fi=0;fi<PILL_FAMS.length;fi++)for(let t=1;t<=10;t++)for(let v=0;v<PILL_VARS.length;v++){
    const F=PILL_FAMS[fi],V=PILL_VARS[v];
    PILLS['g'+fi+'_'+t+'_'+v]={n:V.s+F.base,f:F.f,t:t,m:V.m,d:F.d(t)};
  }
})();

/* ---------- 丹方（共 609 张：境界 + 位阶 双重解锁） ---------- */
(function(){
  for(let fi=0;fi<PILL_FAMS.length;fi++)for(let t=1;t<=10;t++)for(let v=0;v<PILL_VARS.length;v++){
    const pid='g'+fi+'_'+t+'_'+v;
    const matsGE=t>1?[{t:t-1,n:2+v},{t:t,n:1+v}]:[{t:1,n:3+v}];
    RECIPES.push({id:'r_'+pid,out:pid,
      rank:Math.min(9,Math.max(0,Math.floor((t-1)*1.05+v*0.5))),
      reqR:Math.min(21,Math.max(0,(t-1)*2+v)),
      matsGE:matsGE,shouhe:t>1?Math.ceil(t/2)+v:0});
  }
})();

/* ---------- 诸境地图：为每个境界补足历练之地（共 34 幅） ---------- */
const ZN_PRE=['青云','赤炎','玄冰','落星','幽冥','万妖','流沙','碧波','焚天','镇魔','迷雾','雷泽','荒古','天罡','地煞','锁灵','寒渊','伏龙'];
const ZN_SUF=['山脉','秘境','深渊','古域','泽地','荒原','洞天','遗迹','禁地','断谷'];
const ZN_MOD=['赤鳞','玄甲','碧目','白骨','黑风','紫鬃','银角','血瞳','狂暴','远古','霜牙','雷翼'];
const ZN_BEAST=['狼','虎','蟒','鹰','猿','熊','蛟','蜥','蝎','蛛','鸦','狮','豹','龟','犀','鹿','狐'];
(function(){
  const cnt={};ZONES.forEach(function(z){ if(!z.sect)cnt[z.reqR]=(cnt[z.reqR]||0)+1; });
  let zi=0;
  for(let r=0;r<REALMS.length;r++){
    const add=Math.max(0,2-(cnt[r]||0));
    for(let k=0;k<add;k++){
      const en=[
        {n:ZN_MOD[(zi*5)%12]+ZN_BEAST[(zi*7)%17],r:Math.min(21,r),m:0.9},
        {n:ZN_MOD[(zi*5+3)%12]+ZN_BEAST[(zi*7+5)%17],r:Math.min(21,r+(k%2)),m:1.3},
        {n:ZN_MOD[(zi*5+6)%12]+ZN_BEAST[(zi*7+9)%17]+'王',r:Math.min(21,r+1),m:2.4,boss:1}
      ];
      ZONES.push({id:'z'+zi,name:ZN_PRE[zi%18]+ZN_SUF[(zi*3+1)%10],reqR:r,herbs:[],
        ht:[Math.max(1,Math.min(10,r)),Math.min(10,r+2)],
        d:REALMS[r].name+'修士常往之地，妖兽横行，灵物颇丰。',
        enemies:en});
      zi++;
    }
  }
})();

/* ---------- 生成丹药收购价 ---------- */
function pillPrice(pid,r){
  const p=PILLS[pid];
  if(p&&p.m!==undefined)return Math.floor(30*Math.pow(1.75,p.t)*p.m*Math.pow(1.35,r));
  return Math.floor((PILL_BASE_PRICE[pid]||50)*Math.pow(1.4,r));
}

/* ============================================================
 * 九星塔 · 功法 · 妖兽词缀 · 成就 · 每日悬赏
 * ============================================================ */

/* ---------- 功法（九星塔里程碑层掉落 + 传功阁 + 剧情传承；运功多槽见武功阁） ---------- */
const GONGFAS=[
 {id:'gf1', name:'长春功',   floor:5,  fx:{qps:0.10},          d:'生生不息：修炼速度 +10%。'},
 {id:'gf2', name:'玄元诀',   floor:10, fx:{cap:0.15},          d:'玄元聚气：每日修为上限 +15%。'},
 {id:'gf3', name:'磐石功',   floor:15, fx:{def:0.15,hp:0.15},  d:'不动如山：防御、气血 +15%。'},
 {id:'gf4', name:'裂石掌',   floor:20, fx:{atk:0.15},          d:'掌裂顽石：攻击 +15%。'},
 {id:'gf5', name:'聚灵功',   floor:30, fx:{qps:0.25,cap:0.10}, d:'聚灵成海：修炼速度 +25%、每日修为上限 +10%。'},
 {id:'gf6', name:'寻宝诀',   floor:40, fx:{drop:0.30},         d:'觅宝有术：战斗与采药掉落 +30%。'},
 {id:'gf7', name:'丹心诀',   floor:50, fx:{craft:0.10,gain:0.20}, d:'丹心通明：炼丹成功率 +10%、战斗采药所得 +20%。'},
 {id:'gf8', name:'周天功',   floor:60, fx:{ap:2,cap:0.20},     d:'周天运转：每日行动点 +2、每日修为上限 +20%。'},
 {id:'gf9', name:'霸体经',   floor:80, fx:{atk:0.30,def:0.30,hp:0.30}, d:'霸体初成：攻、防、气血 +30%。'},
 {id:'gf10',name:'九星真经', floor:100,fx:{all:0.25,qps:0.30}, d:'九星真传：全属性 +25%、修炼速度 +30%。'},
];

/* ---------- 九星塔 ---------- */
const AP_TOWER=2;          // 每次登塔消耗行动点
const TOWER_BOSS_EVERY=10; // 每 10 层一头守塔妖王
const TOWER_MUL=1.06;      // 每层强度系数

/* ---------- 妖兽词缀（精英化：更强、掉落更丰） ---------- */
const AFFIXES=[
 {id:'kuangbao',n:'狂暴',atk:1.4, d:'攻势狂暴：攻击 +40%。'},
 {id:'jianjia', n:'坚甲',def:1.8,hp:1.2, d:'甲坚难摧：防御 +80%、气血 +20%。'},
 {id:'shixue',  n:'嗜血',atk:1.15,hp:1.3,leech:0.3, d:'嗜饮精血：攻击吸血 30%。'},
 {id:'lingti',  n:'灵体',hp:1.8, d:'灵气凝体：气血 +80%。'},
 {id:'hudun',   n:'护盾',shield:0.5, d:'灵光护体：开场护盾（最大气血的 50%）。'},
 {id:'xunjie',  n:'迅捷',atk:1.2,dodge:0.15, d:'身形如电：闪避 +15%、攻击 +20%。'},
];

/* ---------- 成就（checkAch 按条件类型自动结算；领奖后记入 S.ach） ---------- */
const ACHS=[
 {id:'a_g1',   n:'踏入修行', kind:'g',   v:1,   rw:{stones:200},            d:'突破至第 1 层。'},
 {id:'a_g13',  n:'凝而为一', kind:'g',   v:13,  rw:{stones:800},            d:'修满第一个大境界。'},
 {id:'a_g65',  n:'脱胎换骨', kind:'g',   v:65,  rw:{stones:5000},           d:'踏入先天之境。'},
 {id:'a_g117', n:'神游物外', kind:'g',   v:117, rw:{stones:3e4},            d:'修至化神境。'},
 {id:'a_g156', n:'融天蜕凡', kind:'g',   v:156, rw:{stones:12e4},           d:'修至融天境。'},
 {id:'a_g208', n:'仙王临世', kind:'g',   v:208, rw:{stones:60e4},           d:'修至仙王境。'},
 {id:'a_g285', n:'九星霸体', kind:'g',   v:285, rw:{stones:300e4,ap:20},    d:'登临人皇之境。'},
 {id:'a_k100', n:'初露锋芒', kind:'kills',v:100, rw:{stones:600},            d:'累计击杀 100 名敌人。'},
 {id:'a_k1k',  n:'百战之士', kind:'kills',v:1000,rw:{stones:8000,pill:'g0_5_1'}, d:'累计击杀 1000 名敌人。'},
 {id:'a_k5k',  n:'杀伐果断', kind:'kills',v:5000,rw:{stones:4e4,pill:'g0_8_1'},  d:'累计击杀 5000 名敌人。'},
 {id:'a_boss50',n:'猎首者',  kind:'bosses',v:50, rw:{stones:1e4},            d:'累计击杀 50 名首领。'},
 {id:'a_boss300',n:'屠龙者', kind:'bosses',v:300,rw:{stones:8e4,pill:'g4_5_1'}, d:'累计击杀 300 名首领。'},
 {id:'a_c100', n:'丹道入门', kind:'crafts',v:100, rw:{stones:1500},           d:'累计炼丹 100 炉。'},
 {id:'a_c1k',  n:'丹道大宗师',kind:'crafts',v:1000,rw:{stones:2e4,pill:'g3_5_1'}, d:'累计炼丹 1000 炉。'},
 {id:'a_e200', n:'采药人',   kind:'explores',v:200,rw:{stones:1500},          d:'累计采药 200 次。'},
 {id:'a_e1k',  n:'尝遍百草', kind:'explores',v:1000,rw:{stones:2e4},           d:'累计采药 1000 次。'},
 {id:'a_eat100',n:'服食有道',kind:'eats', v:100, rw:{stones:3000},           d:'服食灵植 100 株。'},
 {id:'a_s3',   n:'星火初燃', kind:'stars',v:3,   rw:{stones:5000},           d:'开启三处星秘藏。'},
 {id:'a_s6',   n:'星河在体', kind:'stars',v:6,   rw:{stones:6e4},            d:'开启六处星秘藏。'},
 {id:'a_s9',   n:'九星归位', kind:'stars',v:9,   rw:{stones:100e4,ap:15},    d:'开启全部九处星秘藏。'},
 {id:'a_t10',  n:'登塔先锋', kind:'tower',v:10,  rw:{stones:2000},           d:'九星塔到达 10 层。'},
 {id:'a_t30',  n:'层层而上', kind:'tower',v:30,  rw:{stones:2e4},            d:'九星塔到达 30 层。'},
 {id:'a_t60',  n:'塔中称尊', kind:'tower',v:60,  rw:{stones:10e4},           d:'九星塔到达 60 层。'},
 {id:'a_t100', n:'九天之上', kind:'tower',v:100, rw:{stones:50e4,ap:10},     d:'九星塔到达 100 层。'},
 {id:'a_bone', n:'全祭之骨', kind:'bones',v:31,  rw:{stones:2e4},            d:'锻骨境祭炼至全祭 31 根。'},
 {id:'a_dan9', n:'丹帝之尊', kind:'danExp',v:250000,rw:{stones:20e4},         d:'丹修阅历达 25 万。'},
 {id:'a_day30',n:'修行一月', kind:'days', v:30,  rw:{stones:5000},           d:'度过 30 日。'},
 {id:'a_day100',n:'百日筑基', kind:'days',v:100, rw:{stones:3e4},            d:'度过 100 日。'},
 {id:'a_q1k',  n:'日进斗金', kind:'qiTotal',v:100000,rw:{stones:1e4},         d:'累计获得修为 10 万。'},
 {id:'a_q1m',  n:'修为等身', kind:'qiTotal',v:1e6, rw:{stones:10e4},           d:'累计获得修为 100 万。'},
 {id:'a_st9',  n:'凝星九重', kind:'stage', v:9,   rw:{stones:8e4},             d:'任一星秘藏凝至第九重。'},
 {id:'a_st13', n:'星汉圆满', kind:'stage', v:13,  rw:{stones:30e4,ap:10},      d:'任一星秘藏凝至十三重「星汉圆满」。'},
];

/* ---------- 每日悬赏（按天数确定性生成 3 条，次日刷新） ---------- */
const DAILY_TYPES=[
 {k:'kill',   n:'除魔', txt:function(v){return '击杀 '+v+' 名妖敌';}},
 {k:'boss',   n:'猎首', txt:function(v){return '击杀 '+v+' 名首领';}},
 {k:'explore',n:'采药', txt:function(v){return '采药 '+v+' 次';}},
 {k:'craft',  n:'炼丹', txt:function(v){return '炼丹 '+v+' 炉';}},
 {k:'eat',    n:'服食', txt:function(v){return '服食灵植 '+v+' 株';}},
 {k:'sell',   n:'售货', txt:function(v){return '向商行出售 '+v+' 次';}},
 {k:'tower',  n:'闯塔', txt:function(v){return '挑战九星塔 '+v+' 次';}},
];
function dailyCount(k,r){ // 悬赏目标数量（随境界微增）
  const base={kill:8,boss:2,explore:6,craft:5,eat:5,sell:4,tower:3}[k]||5;
  return base+Math.floor(r/2);
}
function dailyReward(k,r){ // 灵石奖励
  const mul={boss:1.6,tower:1.4}[k]||1;
  return Math.floor((200+r*260)*mul);
}

/* ============================================================
 * 武学宝库：开天七式 · 灭世火莲 · 数百战技功法
 * 名称致敬各家修仙/武侠经典，描述皆为原创改编。
 * ============================================================ */

/* ---------- 开天七式（剧情逐式传承，威力一式数倍） ---------- */
const KT_NAMES=['开天第一式·斧劈混沌','开天第二式·清浊两断','开天第三式·星河倒卷','开天第四式·日月同辉','开天第五式·万法皆空','开天第六式·天崩地裂','开天第七式·再造乾坤'];
KT_NAMES.forEach(function(nm,k){
  SKILLS.push({id:'kaitian'+(k+1),name:nm,tier:6+k,src:'quest',
   mult:Math.round(25*Math.pow(4.2,k)),qi:30+k*45,cd:2+Math.floor(k/2),req:{realm:4+k*2},
   d:'开天七式第'+CN_NUM[k+1]+'式——一式既出，威力较上一式暴涨数倍；练至第七式，可再造乾坤。'});
});
/* ---------- 灭世火莲（神火境绝世杀术） ---------- */
SKILLS.push({id:'miehuolian',name:'灭世火莲',tier:10,src:'quest',mult:200000,qi:400,cd:9,req:{realm:13},
 d:'以自身神火凝成一朵火莲，莲开之日，天地失色——仙界强者亦为之色变的绝世杀术。'});

/* ---------- 战技库（各家经典招式之名 + 词池生成，共两百余式） ---------- */
const SK_TIER=['黄阶','玄阶','地阶','天阶','圣阶','帝阶','仙阶','神阶','祖阶','道阶'];
const SK_DESC=['入门战技，聊胜于无，胜在灵力耗得少。','小成战技，江湖豪客的看家本领。','大成战技，一方宗门的镇山之学。','宗师战技，一击可裂金石。','王级战技，王侯将相亦要退避三舍。','帝级战技，一式出而风云变。','仙阶战技，仙人不传之秘，凡间罕睹。','神阶战技，古之神魔残篇所化，威力惊天。','祖阶战技，传说中开派祖师的压箱绝学。','道阶战技，近乎大道之显化，一击近道。'];
const SK_REAL=['独孤九剑','万剑归宗','天外飞仙','一剑开天门','剑二十三','三分归元气','六脉神剑','北冥神功','乾坤大挪移','斗转星移','凌波微步','九阳神功','大衍诀','青元剑诀','大荒芜经','焚诀','三千雷动','八极崩','太极玄清道','神剑御雷真诀','九转玄功','八九玄功','一气化三清','法天象地','天罡三十六法','地煞七十二变','临字诀','兵字诀','斗字诀','者字诀','皆字诀','阵字诀','列字诀','前字诀','行字诀','草字剑诀','柳神法','真龙之术','真凰之术','轮回宝术','上苍之手','流星幻剑','七曜星辰诀','大挪移术','天遁剑法','太上忘情录','长生诀','不死天功','化血魔功','天蚕功'];
const SK_PRE=['青玄','紫霄','太乙','大衍','周天','焚天','玄冰','九幽','万剑','御风','裂空','碎星','镇岳','赤炎','碧水','惊雷','噬魂','灭神','无量','太古','混元','无极','归一','天罡','地煞','星河','月华','日曜','麒麟','白虎','玄武','朱雀','青龙','雷霆','寒渊','赤霄','黄庭','斗转','北斗','流云'];
const SK_SUF=['拳','掌法','剑诀','刀法','指法','腿法','枪法','身法','爪法','戟法','鞭法','音杀'];
(function(){
  const used=new Set(SKILLS.map(function(s){return s.name;}));
  function put(nm,t,seed){
    if(used.has(nm)||!nm)return false;
    used.add(nm);
    SKILLS.push({id:'gs'+SKILLS.length,name:nm,tier:t,src:'ge',
     mult:Math.round(2.2*Math.pow(1.62,t-1)*(0.9+((seed*37)%21)/100)),
     qi:4+4*t+(seed%3)*2,cd:1+Math.floor(t/3),
     req:{realm:Math.min(21,Math.max(0,t*2-2+(seed%2)))},
     d:SK_DESC[t-1]});
    return true;
  }
  SK_REAL.forEach(function(nm,k){put(nm,6+(k%5),k*11+3);});
  for(let p=0;p<SK_PRE.length;p++)for(let s=0;s<SK_SUF.length;s++){
    if(SKILLS.length>=210)break;
    const idx=p*SK_SUF.length+s;
    put(SK_PRE[p]+SK_SUF[s],1+((p*7+s*3)%10),idx*13+5);
  }
})();

/* ---------- 功法库（大梵天经三卷 + 传功阁两百余部） ---------- */
GONGFAS.unshift(
 {id:'dafu3',name:'大梵天经·上卷',tier:10,src:'quest',fx:{qps:0.80,all:0.35,cap:0.30},
  d:'大梵天经上卷，佛门至高梵音妙法——梵音灌顶，修炼速度+80%、全属性+35%、每日修为上限+30%。'},
 {id:'dafu2',name:'大梵天经·中卷',tier:8,src:'quest',fx:{qps:0.55,all:0.20},
  d:'大梵天经中卷——梵音涤魂，修炼速度+55%、全属性+20%。'},
 {id:'dafu1',name:'大梵天经·下卷',tier:6,src:'quest',fx:{qps:0.35,hp:0.25},
  d:'大梵天经下卷——梵音护体，修炼速度+35%、气血+25%。'}
);
GONGFAS.forEach(function(g){if(g.tier===undefined)g.tier=Math.min(10,4+Math.floor((g.floor||5)/20));});
const GF_DESC=['入门功法，引气入体之基。','小成功法，一宗一派之传承。','大成功法，可练至通脉筑基。','宗师功法，先天高人争抢之物。','王级功法，一国王庭镇压气运之学。','帝级功法，帝经残篇，可遇不可求。','仙阶功法，仙府流出的长生妙谛。','神阶功法，神魔古卷，练之可通神。','祖阶功法，开天辟地者的传承碎片。','道阶功法，近乎大道本源的经文。'];
const GF_PRE=['太虚','玉清','上清','太清','紫阳','纯阳','玄天','皓月','吞天','噬灵','御灵','通神','伐天','镇狱','渡厄','慈航','寂灭','涅槃','不朽','永恒','太初','鸿蒙','混沌','造化','阴阳','五行','八卦','两仪','六合','八荒','九幽'];
const GF_SUF=['诀','经','功','典','真解','宝卷','心法','秘典','神篇','古卷'];
(function(){
  const used=new Set(GONGFAS.map(function(g){return g.name;}));
  const FXK=['qps','cap','atk','def','hp','drop','craft','gain'];
  for(let p=0;p<GF_PRE.length;p++)for(let s=0;s<GF_SUF.length;s++){
    if(GONGFAS.length>=212)break;
    const nm=GF_PRE[p]+GF_SUF[s];
    if(used.has(nm))continue;
    used.add(nm);
    const idx=p*GF_SUF.length+s,t=1+((p*3+s*7)%10);
    const fx={};
    const k1=FXK[idx%8];
    fx[k1]=Math.round((0.06+0.045*t+((idx%3)*0.02))*100)/100;
    if(idx%3===0)fx.hp=Math.round((0.05+0.04*t)*100)/100;
    if(idx%4===0)fx.qps=Math.round(((fx.qps||0)+0.04+0.03*t)*100)/100;
    if(idx%5===0)fx.cap=Math.round(((fx.cap||0)+0.05+0.03*t)*100)/100;
    if(t>=8&&idx%2===0)fx.all=Math.round((0.05+0.035*t)*100)/100;
    GONGFAS.push({id:'gg'+idx,name:nm,tier:t,fx:fx,src:'ge',
     price:Math.floor(1500*Math.pow(3.4,t-1)),reqR:Math.min(21,t*2),
     d:GF_DESC[t-1]});
  }
})();
/* ============================================================
 * 玄天道宗 · 一百零八分宗（门派系统）
 * 主角自最弱的第 108 分宗入册，以升位战逐名爬升，直至第一分宗。
 * ============================================================ */

/* ---------- 分宗职位（贡献累计晋升） ---------- */
const SECT_TITLES=[
 {n:'杂役弟子',need:0,    d:'分宗最底层，扫地挑水，亦能偷学几手。'},
 {n:'外门弟子',need:100,  d:'入外门，可入藏经阁一层。'},
 {n:'内门弟子',need:1200, d:'入内门，宗门气运加身。'},
 {n:'真传弟子',need:6000, d:'得真传，分宗倾力栽培。'},
 {n:'分宗首席',need:20000,d:'一宗之首，号令分宗。'},
];

/* ---------- 分宗守擂弟子 / 同门（名字与名次绑定，胜则名次互换） ---------- */
const SECT_SURN=['林','苏','叶','陆','秦','萧','楚','沈','顾','燕','裴','温'];
const SECT_GIVEN=['无涯','青临','惊鸿','九幽','断岳','流火','听雪','镇岳','寒山','拂衣','孤鸿','挽风','沉舟','裂云','踏月','问天','掣电','衔烛','负霜','擎苍'];
function sectDiscipleName(seed){return SECT_SURN[seed%12]+SECT_GIVEN[(seed*7)%20];}
const SECT_ALIAS_A=['青枫','落霞','寒山','听雨','望岳','流云','碎石','抱朴','栖霞','洗剑','归尘','藏锋'];
const SECT_ALIAS_B=['','峰','谷','斋','台','涧','崖','堂'];
function sectBranchAlias(k){const s=(k*31+7)%96;return SECT_ALIAS_A[s%12]+SECT_ALIAS_B[(s*3)%8];}
function sectEnemyR(rank){return Math.max(1,Math.min(21,Math.round(1+(108-rank)*20/107)));} // 第108分宗对手r1，第1分宗r21

/* ---------- 每日门派任务（与悬赏并存，奖贡献） ---------- */
const SECT_TASKS=[
 {k:'kill',   n:'斩妖', txt:function(v){return '击杀 '+v+' 名妖敌';}},
 {k:'explore',n:'采药', txt:function(v){return '采药 '+v+' 次';}},
 {k:'craft',  n:'炼丹', txt:function(v){return '炼丹 '+v+' 炉';}},
 {k:'tower',  n:'闯塔', txt:function(v){return '挑战九星塔 '+v+' 次';}},
 {k:'spar',   n:'切磋', txt:function(v){return '同门切磋 '+v+' 次';}},
];
function sectTaskCount(k,r){var base={kill:10,explore:8,craft:6,tower:3,spar:2}[k]||5;return base+Math.floor(r/2);}
function sectTaskReward(r){return 60+r*40;} // 贡献点

/* ---------- 贡献阁（贡献点兑换；部分需职位） ---------- */
const SECT_SHOP=[
 {id:'sq1',n:'回气丹 x5',    cost:60,  d:'分宗丹房常备，恢复气血。',give:function(S){S.pills.huiqi=(S.pills.huiqi||0)+5;}},
 {id:'sq2',n:'兽核 x10',     cost:120, d:'历练弟子缴获，炼丹淬体皆用。',give:function(S){S.mats.shouhe=(S.mats.shouhe||0)+10;}},
 {id:'sq3',n:'聚灵丹 x3',    cost:180, d:'五分钟内修炼速度大增。',give:function(S){S.pills.juling=(S.pills.juling||0)+3;}},
 {id:'sq4',n:'当品灵植 x10', cost:150, d:'药园当季所出，按你境界给阶。',give:function(S){var t=Math.max(1,Math.min(10,curR()+1));var arr=HERBS_BY_TIER[t];S.herbs[arr[(S.day+t)%arr.length]]=(S.herbs[arr[(S.day+t)%arr.length]]||0)+10;}},
 {id:'sq5',n:'破境丹 x1',    cost:600, reqTitle:1,d:'冲击境界时自动服用，成功率+20%。',give:function(S){S.pills.pojing=(S.pills.pojing||0)+1;}},
 {id:'sq6',n:'护命丹 x2',    cost:800, reqTitle:1,d:'重伤自动保命。',give:function(S){S.pills.huming=(S.pills.huming||0)+2;}},
 {id:'sq7',n:'玄天罡气诀',   cost:1500,reqTitle:2,gf:'sg1',d:'分宗贡献阁秘传功法：攻防气血大成。'},
 {id:'sq8',n:'玄天十三剑',   cost:2000,reqTitle:2,sk:'ss1',d:'分宗贡献阁秘传剑诀，一剑十三重浪。'},
 {id:'sq9',n:'玄天道经',     cost:9000,reqTitle:3,gf:'sg2',d:'玄天道宗镇宗道法残卷，天宗直授。'},
 {id:'sq10',n:'玄天镇狱拳',  cost:12000,reqTitle:3,sk:'ss2',d:'玄天镇狱堂不传之拳，一拳镇狱。'},
];

/* ---------- 分宗专属武学（贡献阁兑换，不入传功阁发售） ---------- */
SKILLS.push(
 {id:'ss1',name:'玄天十三剑',tier:7,src:'sect',mult:260,qi:36,cd:2,req:{realm:6},
  d:'玄天道宗分宗贡献阁秘传——一剑挥出，十三重剑浪层层相叠，同境鲜有敌手。'},
 {id:'ss2',name:'玄天镇狱拳',tier:9,src:'sect',mult:5200,qi:150,cd:4,req:{realm:12},
  d:'玄天镇狱堂不传之拳——拳出如狱门开阖，镇压之气自成领域。'}
);
GONGFAS.push(
 {id:'sg1',name:'玄天罡气诀',tier:7,src:'sect',fx:{atk:0.25,def:0.20,hp:0.20},
  d:'分宗贡献阁秘传——玄天罡气护体练力：攻击+25%、防御+20%、气血+20%。'},
 {id:'sg2',name:'玄天道经',tier:9,src:'sect',fx:{all:0.30,qps:0.45,cap:0.25},
  d:'玄天道宗镇宗道法残卷——全属性+30%、修炼速度+45%、每日修为上限+25%。'}
);

/* ---------- 分宗成就 ---------- */
ACHS.push(
 {id:'a_sc50',n:'百尺竿头',     kind:'sectprog', v:58, rw:{stones:2e4},  d:'带领分宗前进至前 50 名。'},
 {id:'a_sc10',n:'宗门新贵',     kind:'sectprog', v:98, rw:{stones:8e4},  d:'带领分宗前进至前 10 名。'},
 {id:'a_sc1', n:'第108分宗之光',kind:'sectprog', v:107,rw:{stones:30e4,ap:10},d:'带领第108分宗登顶第一分宗。'},
 {id:'a_sct', n:'真传弟子',     kind:'secttitle',v:3,  rw:{stones:5e4},  d:'晋升真传弟子。'}
);

