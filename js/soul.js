'use strict';
/* ============================================================
 * 九星霸体诀 · 修仙 —— 灵魂之力 · 魂修 · 丹火 · 丹炉 · 珠内炼丹（soul.js）
 *  依赖 data3.js 的数据与 game.js 的运行时函数（调用期才引用，载入顺序无碍）
 * ============================================================ */

/* ---------------- 灵魂之力 · 魂阶 ---------------- */
function soulRankIdx(){
  let i=0;const ex=(S.soul&&S.soul.exp)||0;
  for(let k=0;k<SOUL_RANKS.length;k++){if(ex>=SOUL_RANKS[k].exp)i=k;}
  return i;
}
function soulRankName(){return SOUL_RANKS[soulRankIdx()].n;}
function soulGfFx(k){
  let v=0;const own=(S.soul&&S.soul.gfs)||{};
  for(const id in own){
    if(!own[id])continue;
    const g=SOUL_GFS.find(x=>x.id===id);
    if(g&&g.fx)v+=g.fx[k]||0;
  }
  return v;
}
function soulRaiseCost(){return Math.ceil(layerCost()*0.22);}
function soulRaise(){ // 运功养魂：耗灵气，得灵魂之力（不耗行动点）
  const c=soulRaiseCost();
  if(S.qi<c){toast('灵气不足：养魂一次需 '+fmt(c)+' 灵气');return;}
  S.qi-=c;
  const gain=Math.round((5+3*soulRankIdx())*(1+soulGfFx('soulexp')));
  const before=soulRankIdx();
  S.soul.exp+=gain;
  const after=soulRankIdx();
  toast('养魂功成：灵魂之力 +'+fmt(gain)+'（'+soulRankName()+' '+fmt(S.soul.exp)+'）','good');
  if(after>before){log('good','神魂轰鸣——你的魂修踏入【'+SOUL_RANKS[after].n+'】！'+SOUL_RANKS[after].d);S.soul.flash=1;}
  renderAll();save();
}
function soulAtkFx(){return soulRankIdx()*0.12+soulGfFx('soulatk');} // 魂技加成
function buySoulGf(id){
  const g=SOUL_GFS.find(x=>x.id===id);if(!g||S.soul.gfs[id])return;
  if(soulRankIdx()<g.req){toast('魂阶不足：需 '+SOUL_RANKS[g.req].n+'（当前 '+soulRankName()+'）');return;}
  const c=moneyPrice(g.cost);
  if(S.stones<c){toast(moneyName()+'不足：需 '+fmt(c)+' '+moneyName());return;}
  S.stones-=c;S.soul.gfs[id]=1;
  log('good','修成魂修功法【'+g.n+'】！'+g.d);
  renderAll();save();
}

/* ---------------- 火焰系统 ---------------- */
function natalPow(){return S.natal?S.natal.pow:0;}
function fireBonus(){ // 丹火加持：提升成功率与星丹品质
  return (natalPow()/5000+(FURNACES[S.furnace||0]||FURNACES[0]).pow/1000)*(1+soulGfFx('fire'));
}
function igniteNatal(){ // 点燃本命之火：以最弱兽火为种，神魂温养
  if(S.natal){toast('本命之火已燃：【'+S.natal.n+'】');return;}
  if(S.soul.exp<300){toast('灵魂之力不足 300——先养魂，方能以神魂温养火种');return;}
  const f=FLAMES_BY_CLS[0][FLAMES_BY_CLS[0].length-1]; // 兽火榜第100名（最弱）
  S.natal={cls:0,rank:100,n:f.n,pow:Math.round(f.pow*1.2)};
  log('story','你以神魂为引，燃起本命之火【'+f.n+'之种】——自此以魂养火、以火炼魂，吞噬异火可令其生生壮大。');
  renderAll();save();
}
function devourFlame(k){ // 吞噬异火：本命之火大涨，灵魂之力暴增
  const f=FLAMES_BY_KEY[k];
  if(!f||!S.flames[k])return;
  const need=Math.round(f.pow*0.8);
  if(S.soul.exp<need){toast('灵魂之力不足（需 '+fmt(need)+'）——神魂太弱，驾驭不住【'+f.n+'】');return;}
  if(!S.natal){
    S.natal={cls:f.cls,rank:f.rank,n:f.n,pow:f.pow};
    log('story','你直接以【'+f.n+'】为种，点燃本命之火！');
  }else{
    S.natal.pow=Math.max(S.natal.pow,f.pow)+Math.round(f.pow*0.12);
    if(f.cls>S.natal.cls||(f.cls===S.natal.cls&&f.rank<S.natal.rank)){S.natal.cls=f.cls;S.natal.rank=f.rank;S.natal.n=f.n;}
    log('good','你张开神魂，将【'+f.n+'】（'+FLAME_CLASSES[f.cls].n+'榜第'+f.rank+'名）吞入本命之火——火势暴涨，声威更盛！');
  }
  delete S.flames[k];
  const se=Math.round(f.pow*1.5);
  S.soul.exp+=se;
  toast('吞噬成功：本命火力 '+fmt(S.natal.pow)+'，灵魂之力 +'+fmt(se),'good');
  renderAll();save();
}
function grantFlame(cls,rmin,rmax){ // 得火；已有则化感悟
  const pool=FLAMES_BY_CLS[cls].filter(f=>f.rank>=rmin&&f.rank<=rmax);
  const f=pool[Math.floor(Math.random()*pool.length)];
  if(S.flames[f.k]){
    const se=Math.round(f.pow*0.3);
    S.soul.exp+=se;
    toast('又得【'+f.n+'】——已有此火，化为感悟：灵魂之力 +'+fmt(se));
  }else{
    S.flames[f.k]=1;
    toast('得火！【'+f.n+'】（'+FLAME_CLASSES[cls].n+'榜第'+f.rank+'名，火力 '+f.pow+'）','good');
    log('good','你收取了【'+f.n+'】——'+FLAME_CLASSES[cls].n+'榜第'+f.rank+'名，火力 '+f.pow+'。');
  }
}
function maybeFlameDrop(er){ // 首领战后概率吐火（品阶随敌人境界）
  if(Math.random()>0.07)return;
  let cls=0;const roll=Math.random();
  if(er>=13)cls=roll<0.25?3:2;
  else if(er>=9)cls=roll<0.7?2:1;
  else if(er>=3)cls=roll<0.7?1:0;
  grantFlame(cls,1,60);
  renderAll();
}
function huntFlame(cls){ // 猎火：1 行动点 + 灵石，得该类火焰（30-100名）
  const cl=FLAME_CLASSES[cls];
  if(curR()<cl.minR){toast('修为不足：需 '+REALMS[cl.minR].name+' 方可猎取'+cl.n);return;}
  if(!useAp(1,'猎火'))return;
  const cost=moneyPrice(cl.hunt);
  if(S.stones<cost){toast(moneyName()+'不足：需 '+fmt(cost)+' '+moneyName());return;}
  S.stones-=cost;
  grantFlame(cls,30,100);
  renderAll();save();
}

/* ---------------- 丹炉系统 ---------------- */
function buyFurnace(){
  const nx=FURNACES[(S.furnace||0)+1];
  if(!nx){toast('混沌鼎已是丹炉之巅');return;}
  const c=moneyPrice(nx.cost);
  if(S.stones<c){toast(moneyName()+'不足：需 '+fmt(c)+' '+moneyName());return;}
  S.stones-=c;S.furnace=(S.furnace||0)+1;
  log('good','购得【'+nx.n+'】！炉力 '+nx.pow+'——炼丹更稳，丹火更炽。');
  renderAll();save();
}
function fireGate(rid){ // 丹炉与丹火门槛：位阶≥4 的丹方须炉火皆足，否则炼不成
  const rc=RECIPES.find(r=>r.id===rid);
  if(!rc||(rc.rank||0)<4)return '';
  const needF=Math.min(FURNACES.length-1,rc.rank-3);
  if((S.furnace||0)<needF)return '丹炉不足：炼此丹需【'+FURNACES[needF].n+'】（当前 '+(FURNACES[S.furnace||0]||FURNACES[0]).n+'）';
  const need=160*Math.pow(2.2,rc.rank-4); // 丹火只认本命之火——炉力再高也代劳不得
  if(natalPow()<need)return '丹火不足：此丹需本命火力 '+Math.round(need)+'（当前 '+natalPow()+'，吞噬异火可壮本命之火）';
  return '';
}

/* ---------------- 珠内炼丹（混沌珠器灵代劳，每日限次） ---------------- */
function pearlCap(rid){ // 每日次数：丹修越高、炉火越旺、丹方越低阶，次数越多
  const rc=RECIPES.find(r=>r.id===rid);
  if(!rc)return 0;
  const base=1.2+0.55*danRankIdx();
  const fire=natalPow()/2500+(FURNACES[S.furnace||0]||FURNACES[0]).pow/900;
  return Math.max(1,Math.floor((base+fire)/(0.6+0.28*(rc.rank||0))));
}
function setPearlAlch(rid){S.pearlAlch.rid=rid;renderAll();}
function togglePearlAuto(el){S.pearlAlch.auto=el.checked?1:0;save();}
function pearlNewDay(){if(S.pearlAlch.day!==S.day){S.pearlAlch.day=S.day;S.pearlAlch.used=0;}}
function pearlDoCraft(rid){ // 校验+消耗+成丹判定；返回是否开炉
  const rc=RECIPES.find(r=>r.id===rid);
  if(!rc)return false;
  const myRank=danRankIdx();
  if(myRank<rc.rank){toast('丹修位阶不足：需 '+DAN_RANKS[rc.rank]);return false;}
  if((rc.reqR||0)>curR()){toast('修为不足：需 '+REALMS[rc.reqR].name);return false;}
  const fg=fireGate(rid);
  if(fg){toast(fg);return false;}
  const need={h:{},c:0};
  if(rc.matsGE){for(const sp of rc.matsGE)need.h['ge'+sp.t]=(need.h['ge'+sp.t]||0)+sp.n;need.c=rc.shouhe||0;}
  else for(const m in rc.mats){if(m==='shouhe')need.c+=rc.mats[m];else need.h[m]=(need.h[m]||0)+rc.mats[m];}
  for(const k in need.h){
    if(k.slice(0,2)==='ge'){const t=+k.slice(2);if(herbsGE(t)<need.h[k]){toast('药材不足：需 '+t+' 品及以上灵植 x'+need.h[k]);return false;}}
    else if((S.herbs[k]||0)<need.h[k]){toast('药材不足：'+(HERBS[k]?HERBS[k].n:k)+' x'+need.h[k]);return false;}
  }
  if(need.c&&(S.mats.shouhe||0)<need.c){toast('兽核不足 x'+need.c);return false;}
  for(const k in need.h){
    if(k.slice(0,2)==='ge')consumeHerbsGE(+k.slice(2),need.h[k]);
    else S.herbs[k]-=need.h[k];
  }
  if(need.c)S.mats.shouhe-=need.c;
  const p=clamp(0.62+0.07*(myRank-rc.rank)+Math.min(0.1,fireBonus()*0.02),0.15,0.95);
  if(Math.random()<p){
    S.pills[rc.out]=(S.pills[rc.out]||0)+1;
    S.danExp+=(rc.exp||10);
    S.stat.crafts=(S.stat.crafts||0)+1;
    addQi(layerCost()*0.04,'craft');
    log('good','【混沌珠】器灵炼成一炉【'+(PILLS[rc.out]?PILLS[rc.out].n:rc.out)+'】。');
    return true;
  }
  if(rc.matsGE){for(const sp of rc.matsGE)refundHerbsGE(sp.t,Math.floor(sp.n/2));}
  else for(const m in rc.mats){const back=Math.floor(rc.mats[m]/2);if(back>0)S.herbs[m]=(S.herbs[m]||0)+back;}
  if(rc.shouhe)S.mats.shouhe+=Math.floor(rc.shouhe/2);
  log('bad','【混沌珠】一炉炸裂……器灵抢回部分药材。');
  return true; // 开了炉就算次数
}
function pearlCraftOnce(){
  const rid=S.pearlAlch.rid;
  if(!rid){toast('先选一个丹方');return;}
  pearlNewDay();
  const cap=pearlCap(rid);
  if(S.pearlAlch.used>=cap){toast('今日珠内炼丹已尽（'+cap+' 炉/日）——丹修越高、炉火越旺、丹方越低阶，可炼越多');return;}
  if(pearlDoCraft(rid)){S.pearlAlch.used++;renderAll();save();}
}
function pearlDaily(){ // nextDay 调用：重置次数 + 执行挂机炼丹
  pearlNewDay();
  const rid=S.pearlAlch.rid;
  if(!rid||!S.pearlAlch.auto)return;
  const cap=pearlCap(rid);
  let made=0;
  while(S.pearlAlch.used<cap&&pearlDoCraft(rid)){S.pearlAlch.used++;made++;}
  if(made>0)log('story','混沌珠器灵一夜炼丹 '+made+' 炉（今日可炼 '+cap+' 炉）。');
}

/* ---------------- 魂火页 ---------------- */
function renderSoulfire(){
  if(!S)return;
  const ri=soulRankIdx(),nr=SOUL_RANKS[ri+1];
  const ex=S.soul.exp;
  /* 灵魂之力 */
  let html='<div class="panel"><h3>灵魂之力 · 魂修（'+SOUL_RANKS[ri].n+'）</h3>'+
   '<p class="small">灵魂之力 <b class="gold">'+fmt(ex)+'</b>——魂修之根本。魂阶越高，魂技越强、可驭之火越烈；'+
   '亦以神魂加持肉身（全属性 +'+Math.round((0.04*ri+soulGfFx('all'))*100)+'%）。</p>'+
   '<div class="bar" style="margin:8px 0"><i style="width:'+(nr?clamp((ex-SOUL_RANKS[ri].exp)/(nr.exp-SOUL_RANKS[ri].exp)*100,0,100):100)+'%"></i><span>'+
   (nr?(fmt(ex-SOUL_RANKS[ri].exp)+' / '+fmt(nr.exp-SOUL_RANKS[ri].exp)+' → '+nr.n):'神魂化神，万火归一')+'</span></div>'+
   '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn jade" onclick="soulRaise()">运功养魂（耗 '+fmt(soulRaiseCost())+' 灵气）</button>'+
   '<span class="small muted">养魂所得 ×'+(1+soulGfFx('soulexp')).toFixed(2)+'（魂修功法加持）</span></div></div>';
  /* 魂修功法 */
  html+='<div class="panel"><h3>魂修功法</h3>'+
   SOUL_GFS.map(function(g){
     const own=S.soul.gfs[g.id];
     const lockRi=ri<g.req;
     return '<div class="enemy"><span>'+g.n+'<span class="tag">'+(own?'已修成':'需 '+SOUL_RANKS[g.req].n)+'</span>'+
      '<span class="small muted">'+g.d+'</span></span>'+
      (own?'':('<button class="btn" '+(lockRi?'disabled':'')+' onclick="buySoulGf(\''+g.id+'\')">'+moneyName()+' '+fmt(moneyPrice(g.cost))+'</button>'))+
      '</div>';
   }).join('')+'</div>';
  /* 本命之火 */
  html+='<div class="panel"><h3>本命之火</h3>';
  if(S.natal){
    const cl=FLAME_CLASSES[S.natal.cls];
    html+='<p class="small">【'+S.natal.n+'】（源出'+cl.n+'榜第'+S.natal.rank+'名）　火力 <b class="gold">'+fmt(S.natal.pow)+'</b>'+
     '　丹火加持 +'+Math.round(fireBonus()*100)/100+'</p>'+
     '<p class="small muted">吞噬异火可壮本命之火；火力与丹炉决定高阶丹能否炼成。</p>';
  }else{
    html+='<p class="small">尚未点燃。养魂至灵魂之力 300，便可凝出火种；或直接吞噬一缕异火为种。</p>'+
     '<button class="btn jade" onclick="igniteNatal()">点燃本命之火（灵魂之力 ≥300）</button>';
  }
  html+='</div>';
  /* 猎火 · 火焰收藏 */
  const owned=Object.keys(S.flames).length;
  html+='<div class="panel"><h3>异火 · 收藏 '+owned+' 缕</h3>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">'+
   FLAME_CLASSES.map(function(cl,ci){
     const lock=curR()<cl.minR;
     return '<button class="btn" '+(lock?'disabled':'')+' onclick="huntFlame('+ci+')">猎'+cl.n+'（1行动点·'+fmt(moneyPrice(cl.hunt))+moneyName()+'）</button>';
   }).join('')+'</div>'+
   '<p class="small muted">兽火凡界皆有；地火需凝血境、天火需化神境、神火需蜕凡飞升。首领战后亦可能迸出异火。'+
   '同名之火再得即化为感悟（灵魂之力 +火力的三成）。</p>'+
   (owned?Object.keys(S.flames).map(function(k){
     const f=FLAMES_BY_KEY[k];
     if(!f)return '';
     const need=Math.round(f.pow*0.8);
     const can=ex>=need;
     return '<div class="enemy"><span>'+f.n+'<span class="tag">'+FLAME_CLASSES[f.cls].n+'榜第'+f.rank+'名</span>'+
      '<span class="small muted">火力 '+fmt(f.pow)+'</span></span>'+
      '<button class="btn'+(can?' danger':'')+'" '+(can?'':'disabled')+' onclick="devourFlame(\''+k+'\')">'+
      (can?'吞噬':'魂力 '+fmt(need))+'</button></div>';
   }).join(''):'<p class="small muted">尚无异火。出去走走——妖兽王、地脉、雷海之中皆有火种。</p>')+
   '</div>';
  /* 丹炉 */
  const curF=FURNACES[S.furnace||0],nxF=FURNACES[(S.furnace||0)+1];
  html+='<div class="panel"><h3>丹炉 · '+curF.n+'（炉力 '+curF.pow+'）</h3>'+
   '<p class="small">'+curF.d+'</p>'+
   (nxF?('<div style="margin-top:6px"><button class="btn jade" onclick="buyFurnace()">购【'+nxF.n+'】（炉力 '+nxF.pow+'·'+fmt(moneyPrice(nxF.cost))+' '+moneyName()+'）</button></div>')
       :'<p class="small gold">丹炉之巅，万象可炼。</p>')+
   '<p class="small muted">位阶 ≥4 的丹方，丹炉与丹火不足则<b class="blood">炼不成</b>；炉火越好，成丹率与星丹品质越高。</p></div>';
  /* 珠内炼丹 */
  const myRank=danRankIdx();
  const elig=RECIPES.filter(r=>(r.rank||0)<=myRank&&(r.reqR||0)<=curR()&&r.out);
  const cap=S.pearlAlch.rid?pearlCap(S.pearlAlch.rid):0;
  html+='<div class="panel"><h3>珠内炼丹 · 器灵代劳（每日限次）</h3>'+
   '<p class="small">选好丹方，器灵便在混沌珠中日日开炉（不耗行动点）。今日可炼次数 = 丹修位阶 × 炉火加持 ÷ 丹方位阶——'+
   '<b class="gold">'+(S.pearlAlch.rid?('当前 '+S.pearlAlch.used+' / '+cap+' 炉'):'未选丹方')+'</b></p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px">'+
   '<select onchange="setPearlAlch(this.value)" style="max-width:280px"><option value="">— 选丹方 —</option>'+
   elig.slice(0,400).map(function(r){return '<option value="'+r.id+'"'+(S.pearlAlch.rid===r.id?' selected':'')+'>'+r.id+'（'+DAN_RANKS[r.rank||0]+'）</option>';}).join('')+
   '</select>'+
   '<button class="btn jade" onclick="pearlCraftOnce()">炼一炉</button>'+
   '<label class="small"><input type="checkbox" '+(S.pearlAlch.auto?'checked':'')+' onchange="togglePearlAuto(this)"> 每日自动炼</label>'+
   '</div></div>';
  $('main').innerHTML=html;
}
