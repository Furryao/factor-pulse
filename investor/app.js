'use strict';
const topics = [
  {id:'reversal_5d',name:'跌后修复',title:'跌多了，等一等反弹',short:'近期跌得更多的股票',low:'近期跌得较少或涨得更多',tag:'短期反转',icon:'M3 5l6 8 5 3 7-9M16 7h5v5',description:'跌得更多的股票，之后是否比另一组表现更好？',scene:'看到一只股票连续下跌，你会想：是不是卖过头了，接下来有机会反弹？',logic:'如果下跌包含集中卖出带来的短期压力，卖压减轻后可能出现修复。这只是可能机制，不代表每次下跌都是错杀。',measure:'按过去 5 个交易日的涨跌幅排序，把跌得更多的一组，与跌得较少或涨得更多的一组比较后续表现。',trap:'业绩变差也会导致下跌。这个指标无法单独区分短期情绪与公司经营问题。',use:'当你看到下跌想等反弹，可以先观察：近期类似股票是否普遍出现相对修复。再结合具体公司的情况理解，而不是只凭跌幅下结论。',formula:'5 日反转 = −（当前复权收盘价 ÷ 5 个交易日前复权收盘价 − 1）'},
  {id:'momentum_20d',name:'顺势跟随',title:'涨起来了，想跟上去',short:'过去 20 日涨幅较高',low:'过去 20 日涨幅较低',tag:'价格趋势',icon:'M3 18l6-6 4 3 8-11M15 4h6v6',description:'之前涨得更多，是否意味着之后也更强？',scene:'一只股票涨了一段时间，你担心错过行情，也想知道这段上涨能否继续。',logic:'消息可能被逐步理解，交易也可能分批发生，让价格变化延续。但只看价格，不能证明延续是由哪一种行为造成的。',measure:'按过去 20 个交易日的累计涨跌幅排序，比较此前涨幅较高与较低两组之后的表现。',trap:'之前涨得好，不代表买入后还会涨。交易过于拥挤或消息变化，都可能使趋势反转。',use:'当你想追随近期强势股，可以先看看：这段时间强势是否经常延续，还是反而容易回落。这提供市场背景，不给出具体买点。',formula:'20 日动量 = 当前复权收盘价 ÷ 20 个交易日前复权收盘价 − 1'},
  {id:'exposure_size_log_total_mv',name:'小公司风格',title:'小公司，会不会更有弹性',short:'总市值较小的股票',low:'总市值较大的股票',tag:'公司规模',icon:'M4 20V11h6v9M14 20V4h6v16M2 20h20',description:'比较公司大小，看看近期哪一组相对占优。',scene:'你可能听过“小盘更活跃，大盘更稳”，想看看近期市场究竟偏向哪一边。',logic:'不同规模公司的流动性、关注度和风险特征可能不同。投资者的偏好变化，可能伴随大小市值股票的表现差异。',measure:'按总市值排序，比较市值较小与较大两组之后的表现。这里的“大小”指股票总市值，不是单股价格。',trap:'小市值不等于公司被低估，也不等于一定更有成长性。公司规模只是一个特征。',use:'如果你关注的股票多数属于小市值，可以借此理解其表现是否与整体小公司风格相似，避免把所有涨跌都归于个股判断。',formula:'小市值得分 = −log（总市值）'},
  {id:'value_ep_ttm',name:'盈利估值',title:'同样的盈利，想买得便宜',short:'每元股价对应盈利较多',low:'每元股价对应盈利较少',tag:'价格与盈利',icon:'M5 6h14v14H5zM8 3v6M16 3v6M8 13h8M8 16h5',description:'花同样的钱，买到更多盈利，近期占优吗？',scene:'面对两家有盈利的公司，你会比较：每投入一元，分别对应多少公司的历史盈利？',logic:'价格相对盈利较低，可能来自市场低估，也可能是在补偿经营风险。若预期修复，价格可能重新调整。',measure:'只看市盈率为正的股票，按盈利收益率排序，比较每元价格对应历史盈利较多与较少两组的后续表现。',trap:'历史盈利可能下滑，也可能包含一次性收益。“便宜”未必意味着划算。',use:'当你被低市盈率吸引时，先把它理解为价格与历史盈利的关系，再查看盈利是否可持续。这个指标不评价公司未来盈利质量。',formula:'盈利收益率 = 1 ÷ 滚动市盈率（仅市盈率 > 0）'},
  {id:'lowvol_20d',name:'平稳波动',title:'不想每天跟着大起大落',short:'过去 20 日波动较小',low:'过去 20 日波动较大',tag:'价格波动',icon:'M2 12h4l3-4 4 8 4-6 3 2h2',description:'过去更平稳的股票，之后表现如何？',scene:'面对每天大幅涨跌的股票，你会感到难以承受，想知道价格相对平稳的股票表现怎样。',logic:'不同投资者对波动的承受能力不同，也可能偏好高弹性股票。波动大小可以帮助描述风格差异，不能直接推断谁更安全。',measure:'计算过去 20 个交易日每日收益的波动程度，比较波动较小与较大两组的后续表现。',trap:'过去波动小，未来也可能突然下跌。短期平稳不等于本金安全。',use:'当你希望减少持有过程中的起伏，可以先区分股票过去的波动特征，再结合实际持仓风险理解。这里并未衡量你的组合风险。',formula:'低波动得分 = −标准差（过去 20 个交易日收益）'},
  {id:'volume_momentum_5_20',name:'交易升温',title:'成交突然热闹，想凑近看看',short:'成交量升温更明显',low:'成交量升温较少或降温',tag:'交易活跃变化',icon:'M3 20V14h4v6M10 20V9h4v11M17 20V3h4v17',description:'参与交易变得活跃，后面的价格也更强吗？',scene:'一只股票突然成交活跃，你开始关注它：是不是有新的变化正在发生？',logic:'成交变化可能伴随关注度上升、消息冲击或分歧加大。它说明交易活跃度变化，不能识别是谁在买卖。',measure:'比较最近 5 日与最近 20 日的日均成交量，按变化比例分组，观察升温更明显的一组之后是否相对占优。',trap:'放量不等于主力买入。每笔成交都有买卖双方，价格方向还需要另外观察。',use:'当你看到放量时，可以把“更热闹”和“后续涨得更多”分开判断。这张卡帮你检查两者在最近的数据里是否一致。',formula:'成交量变化 = 最近 5 日日均成交量 ÷ 最近 20 日日均成交量 − 1'}
];
const $ = s => document.querySelector(s);
let data, mode='weekly', selected='reversal_5d', months=3, onlySaved=false, saved=[], toastTimer;
try { const stored=JSON.parse(localStorage.getItem('factor-pulse-investor-saved')||'[]'); if(Array.isArray(stored)) saved=stored.filter(id=>topics.some(t=>t.id===id)); } catch {}
const md=()=>data.modes[mode];
const getTopic=()=>topics.find(t=>t.id===selected);
const valueText=v=>Math.abs(v)<0.00005?'约 0.00':`${v>0?'+':'−'}${Math.abs(v*100).toFixed(2)}`;
const tone=v=>Math.abs(v)<0.0001?'neutral-text':v>0?'positive-text':'negative-text';
const verdict=v=>Math.abs(v)<0.0001?'近期接近持平':v>0?'近期相对领先':'近期相对落后';
const icon=t=>`<span class="card-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${t.icon}"/></svg></span>`;
const dateLabel=s=>s.replaceAll('-','.');
const windowLabel=()=>`最近 ${md().window} 次${mode==='weekly'?'每周':'每月'}观察`;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2400);}
function renderOverview(){
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 $('#window-caption').textContent=`${windowLabel()} · 观察起点截至 ${dateLabel(md().end)}`;
 const sorted=[...topics].sort((a,b)=>md().factors[b.id].mean-md().factors[a.id].mean), best=sorted[0], weak=sorted.at(-1), max=Math.max(...sorted.map(t=>Math.abs(md().factors[t.id].mean)));
 const evidence=t=>{const v=md().factors[t.id].mean;return `<div class="evidence-row ${v<0?'negative':''}"><div class="evidence-row-head"><span>${t.name}</span><strong>${valueText(v)}<small>个百分点</small></strong></div><div class="evidence-track"><div class="evidence-fill" style="width:${Math.abs(v)/max*100}%"></div></div></div>`;};
 $('#overview-card').innerHTML=`<div class="overview-copy"><span class="overview-eyebrow">这份快照里的一个发现</span><h2>${best.name}相对占优，<br>${weak.name}暂未占优。</h2><p>在本页精选的 6 种观察中，${best.short}的一组平均表现更强；${weak.short}的一组则相对落后。它描述的是过去这段时间。</p><button class="overview-link" data-select="${best.id}">看看背后的逻辑 <span>↗</span></button></div><div class="overview-evidence"><span class="evidence-label">两组后续表现差异 · ${windowLabel()}</span>${evidence(best)}${evidence(weak)}<p class="evidence-foot">每期收益差的平均值，已扣估算成本。不是持有收益。</p></div>`;
}
function renderCards(){
 $('#saved-count').textContent=saved.length;
 $('#show-saved').setAttribute('aria-pressed',String(onlySaved));
 const list=topics.filter(t=>!onlySaved||saved.includes(t.id));
 $('#behavior-grid').innerHTML=list.length?list.map(t=>{const f=md().factors[t.id],isSaved=saved.includes(t.id);return `<article class="behavior-card ${selected===t.id?'selected':''}"><div class="card-head">${icon(t)}<span class="card-family">${t.name}</span><button class="save" data-save="${t.id}" aria-pressed="${isSaved}" aria-label="${isSaved?'取消关注':'关注'}${t.name}">${isSaved?'★':'☆'}</button></div><button class="card-title" data-select="${t.id}">${t.title}</button><p class="card-description">${t.description}</p><div class="card-result"><div><strong class="${tone(f.mean)}">${verdict(f.mean)}</strong><span>平均差异 ${valueText(f.mean)} 个百分点</span></div><div><div class="mini-dots" aria-hidden="true">${f.periods.slice(-md().window).map(r=>`<span class="${r.spread>0?'pos':'neg'}"></span>`).join('')}</div><span>${md().window} 次里 ${f.positive} 次领先</span></div></div><button class="card-open" data-select="${t.id}">理解这种行为 <span>↗</span></button></article>`;}).join(''):'<div class="empty-state">还没有关注的行为。点击「我的关注」返回全部，再点卡片上的 ☆ 收藏。</div>';
}
function rangeStart(count){
 const end=new Date(md().factors[selected].periods.at(-1).date+'T00:00:00Z'),day=end.getUTCDate();
 end.setUTCDate(1);end.setUTCMonth(end.getUTCMonth()-count);
 const lastDay=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()+1,0)).getUTCDate();
 end.setUTCDate(Math.min(day,lastDay));return end.toISOString().slice(0,10);
}
function visiblePeriods(count=months){return md().factors[selected].periods.filter(r=>r.date>=rangeStart(count));}
function rangeAvailable(count){return count===3||visiblePeriods(count).length>visiblePeriods(count===6?3:6).length;}
function renderRangeControls(){
 document.querySelectorAll('[data-months]').forEach(b=>{
  const count=Number(b.dataset.months),available=rangeAvailable(count),label=count===12?'近一年':count+'个月';
  b.disabled=!available;b.setAttribute('aria-pressed',String(count===months));
  b.textContent=label+(available?'':' · 历史不足');
  b.title=available?'查看'+label+'内的已核验观察':'现有历史无法比更短区间多显示观察';
 });
}
function renderStory(){const t=getTopic(),f=md().factors[selected];
 if(!rangeAvailable(months))months=3;
 $('#story-content').innerHTML=`<div class="story-top"><div><span class="eyebrow">02 / 把直觉拆开看</span><h2 id="story-title">${t.title}</h2><p>${t.description}</p></div><span class="story-tag">正在解读 · ${t.name}</span></div><div class="story-layout"><div><ol class="steps"><li><span class="step-number">1</span><h3>你熟悉的场景</h3><p>${t.scene}</p></li><li><span class="step-number">2</span><h3>背后可能的逻辑</h3><p>${t.logic}</p></li><li><span class="step-number">3</span><h3>我们怎样观察</h3><p>${t.measure}</p></li></ol><div class="trap"><span>↳</span><div><strong>容易想错的一步</strong><p>${t.trap}</p></div></div></div><div class="detail-evidence"><div class="detail-topline"><h3>把这个想法，放进数据里看看</h3><span class="subtle-chip">历史比较</span></div><div class="comparison"><span>${t.short}</span><b>对比</b><span>${t.low}</span></div><div class="stat-row"><div><small>${windowLabel()} · 平均差异</small><strong class="stat-main ${tone(f.mean)}">${valueText(f.mean)}<em>个百分点</em></strong><p>上方前一组减后一组，已扣估算成本</p></div><div><small>这些观察里，前一组领先了</small><strong class="count">${f.positive} <em style="font:12px system-ui;color:#859477">/ ${md().window} 期</em></strong><p>领先次数不代表下次成功概率</p></div></div><div class="chart-controls"><span>查看历史表现</span><div class="chart-range" aria-label="历史范围">${[3,6,12].map(m=>`<button data-months="${m}" aria-pressed="${months===m}">${m===12?'近一年':m+'个月'}</button>`).join('')}</div></div><div id="history-chart"></div><div class="utility"><h4>这对我有什么用？</h4><p>${t.use}</p></div><details class="formula"><summary>对应的专业指标：${t.tag}</summary><p>${t.formula}</p><p>指标编号：${t.id}</p></details></div></div>`;
 renderChart();
}
function renderChart(){renderRangeControls();const rows=visiblePeriods(),all=md().factors[selected].periods,limited=all[0].date>rangeStart(months),max=Math.max(...rows.map(r=>Math.abs(r.spread)),0.001);$('#history-chart').innerHTML=`<p class="history-coverage" role="status">${limited?'历史不足所选范围 · ':''}实际显示 ${dateLabel(rows[0].date)} — ${dateLabel(rows.at(-1).date)} · ${rows.length} 期${!rangeAvailable(6)?'<span>当前已提供的历史已全部显示，6 个月和近一年暂无更多数据。</span>':limited?'<span>仅显示已核验的完整观察，较早数据尚未提供。</span>':''}</p><div class="bar-chart" aria-label="${getTopic().name}历史分组收益差"><div class="zero-line"></div>${rows.map((r,i)=>`<button class="chart-bar ${r.spread<0?'negative':''}" data-bar="${i}" aria-label="观察起点 ${r.date}，后续收益差 ${valueText(r.spread)} 个百分点"><i style="height:${Math.abs(r.spread)/max*44}%"></i></button>`).join('')}</div><div class="chart-axis"><span>${dateLabel(rows[0].date)}</span><span>↑ 领先 · 0 · 落后 ↓</span><span>${dateLabel(rows.at(-1).date)}</span></div><p class="chart-readout" id="chart-readout">点击或聚焦柱形，查看那一期的具体差异。</p><p class="chart-caption">横轴为观察起点；柱形表示之后一段持有期的两组表现差异。绿色领先，棕色落后。区间切换仅改变历史图，上方近期比较窗口保持一致。${rows.length} 次完整观察；可用历史从 ${dateLabel(md().factors[selected].periods[0].date)} 开始。</p>`;}
function renderFreshness(){
 $('#data-as-of').textContent=dateLabel(data.asOf);
 const weekly=data.modes.weekly,monthly=data.modes.monthly;
 $('#data-freshness').textContent=`行情数据截至 ${dateLabel(data.asOf)}。周度比较最新一期从 ${dateLabel(weekly.end)} 开始，后续表现已观察至 ${dateLabel(weekly.settledThrough||data.asOf)}；月度比较最新一期从 ${dateLabel(monthly.end)} 开始，已观察至 ${dateLabel(monthly.settledThrough||data.asOf)}。更新行情后，仍须等一整期观察结束，才能加入这里的比较。`;
 const checked=data.updatedAt?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(data.updatedAt)):'';
 $('#refresh-policy').textContent=`${data.refreshPolicy||'校验通过后更新'}。节假日或数据未齐时保留上次完整结果。${checked?'最近核验：'+checked+'（北京时间）。':''}`;
}
function render(){renderFreshness();renderOverview();renderCards();renderStory();}
function selectTopic(id){if(!topics.some(t=>t.id===id))return;selected=id;renderCards();renderStory();$('#story').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('#story').focus({preventScroll:true});}
function readBar(button){const r=visiblePeriods()[Number(button.dataset.bar)];if(!r)return;document.querySelectorAll('.chart-bar').forEach(b=>b.classList.toggle('current',b===button));$('#chart-readout').textContent=`观察起点 ${dateLabel(r.date)} · 后续完整一期 ${r.spread>=0?'领先':'落后'} ${Math.abs(r.spread*100).toFixed(2)} 个百分点（扣估算成本后）。`;}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled||!data)return;
 if(b.dataset.mode){mode=b.dataset.mode;render();}
 else if(b.dataset.select)selectTopic(b.dataset.select);
 else if(b.dataset.save){const id=b.dataset.save;saved=saved.includes(id)?saved.filter(v=>v!==id):[...saved,id];let persisted=true;try{localStorage.setItem('factor-pulse-investor-saved',JSON.stringify(saved));}catch{persisted=false;}renderCards();toast(persisted?(saved.includes(id)?'已加入关注，下次可从「我的关注」找到':'已取消关注'):'当前浏览器无法保存，关注仅在本次页面有效');}
 else if(b.id==='show-saved'){onlySaved=!onlySaved;renderCards();}
 else if(b.dataset.months){const count=Number(b.dataset.months);if(rangeAvailable(count)){months=count;renderChart();}}
 else if(b.dataset.bar!==undefined)readBar(b);
 else if(b.id==='data-note'){$('#method').open=true;$('#method').scrollIntoView({behavior:'smooth',block:'center'});}
});
document.addEventListener('focusin',e=>{if(e.target.matches('[data-bar]'))readBar(e.target);});
document.addEventListener('pointerover',e=>{const b=e.target.closest('[data-bar]');if(b)readBar(b);});
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));});},{rootMargin:'-15% 0px -65% 0px'});['overview','explore','reading'].forEach(id=>observer.observe(document.getElementById(id)));
fetch('./data.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('load');return r.json();}).then(d=>{data=d;render();}).catch(()=>{$('#overview-card').innerHTML='<div class="overview-copy"><h2>这次没有读到数据</h2><p>请刷新页面再试。历史结果暂时不可用。</p></div>';$('#window-caption').textContent='数据加载失败';});
