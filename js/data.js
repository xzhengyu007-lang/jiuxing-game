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
 {name:'天枢',alias:'贪狼',reqR:1, qiMul:15,  stones:500},
 {name:'天璇',alias:'巨门',reqR:2, qiMul:20,  stones:2200},
 {name:'天玑',alias:'禄存',reqR:3, qiMul:30,  stones:7000},
 {name:'天权',alias:'文曲',reqR:4, qiMul:45,  stones:18000},
 {name:'玉衡',alias:'廉贞',reqR:5, qiMul:70,  stones:45000},
 {name:'开阳',alias:'武曲',reqR:6, qiMul:110, stones:12e4},
 {name:'摇光',alias:'破军',reqR:7, qiMul:170, stones:30e4},
 {name:'洞明',alias:'左辅',reqR:9, qiMul:260, stones:75e4},
 {name:'隐光',alias:'右弼',reqR:11,qiMul:400, stones:180e4},
];

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

/* ---------- 千种灵植：10 属性 × 10 品阶 × 10 变体（+10 奇珍 = 1010 种） ---------- */
const HERB_ATTRS=['金','木','水','火','土','风','雷','光','暗','魂'];
const HERB_VARS=['霜','月','幽','云','霞','古','龙','凤','神','圣'];
const HERB_BODIES=['草','参','芝','花','藤','果','莲','兰','葵','蕨'];
(function(){
  for(let b=0;b<10;b++)for(let v=0;v<10;v++)for(let a=0;a<10;a++){
    HERBS['x'+v+''+a+''+b]={n:HERB_VARS[v]+HERB_ATTRS[a]+HERB_BODIES[b],t:b+1,a:a};
  }
})();
const HERBS_BY_TIER=[null];
for(let t=1;t<=10;t++)HERBS_BY_TIER.push(Object.keys(HERBS).filter(function(id){return HERBS[id].t===t;}));

/* ---------- 丹药：12 系 × 10 品阶 × 3 品质 = 360 种（另有原版 9 种） ---------- */
const PILL_VARS=[{s:'',m:1},{s:'上品',m:1.8},{s:'极品',m:3.2}];
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
  for(let fi=0;fi<PILL_FAMS.length;fi++)for(let t=1;t<=10;t++)for(let v=0;v<3;v++){
    const F=PILL_FAMS[fi],V=PILL_VARS[v];
    PILLS['g'+fi+'_'+t+'_'+v]={n:V.s+F.base,f:F.f,t:t,m:V.m,d:F.d(t)};
  }
})();

/* ---------- 丹方（共 369 张：境界 + 位阶 双重解锁） ---------- */
(function(){
  for(let fi=0;fi<PILL_FAMS.length;fi++)for(let t=1;t<=10;t++)for(let v=0;v<3;v++){
    const pid='g'+fi+'_'+t+'_'+v;
    const matsGE=t>1?[{t:t-1,n:2+v},{t:t,n:1+v}]:[{t:1,n:3+v}];
    RECIPES.push({id:'r_'+pid,out:pid,
      rank:Math.min(9,Math.max(0,Math.floor((t-1)*1.05+v*0.5))),
      reqR:Math.max(0,(t-1)*2+v),
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
