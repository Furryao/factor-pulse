'use strict';
const topics = [
  {id:'reversal_5d',name:'跌后修复',title:'跌多了，等一等反弹',short:'近期跌得更多的股票',low:'近期跌得较少或涨得更多',tag:'短期反转',icon:'M3 5l6 8 5 3 7-9M16 7h5v5',description:'跌得更多的股票，之后是否比另一组表现更好？',scene:'看到一只股票连续下跌，你会想：是不是卖过头了，接下来有机会反弹？',logic:'如果下跌包含集中卖出带来的短期压力，卖压减轻后可能出现修复。这只是可能机制，不代表每次下跌都是错杀。',measure:'按过去 5 个交易日的涨跌幅排序，把跌得更多的一组，与跌得较少或涨得更多的一组比较后续表现。',trap:'业绩变差也会导致下跌。这个指标无法单独区分短期情绪与公司经营问题。',use:'当你看到下跌想等反弹，可以先观察：近期类似股票是否普遍出现相对修复。再结合具体公司的情况理解，而不是只凭跌幅下结论。',formula:'5 日反转 = −（当前复权收盘价 ÷ 5 个交易日前复权收盘价 − 1）'},
  {id:'momentum_20d',name:'顺势跟随',title:'涨起来了，想跟上去',short:'过去 20 日涨幅较高',low:'过去 20 日涨幅较低',tag:'价格趋势',icon:'M3 18l6-6 4 3 8-11M15 4h6v6',description:'之前涨得更多，是否意味着之后也更强？',scene:'一只股票涨了一段时间，你担心错过行情，也想知道这段上涨能否继续。',logic:'消息可能被逐步理解，交易也可能分批发生，让价格变化延续。但只看价格，不能证明延续是由哪一种行为造成的。',measure:'按过去 20 个交易日的累计涨跌幅排序，比较此前涨幅较高与较低两组之后的表现。',trap:'之前涨得好，不代表买入后还会涨。交易过于拥挤或消息变化，都可能使趋势反转。',use:'当你想追随近期强势股，可以先看看：这段时间强势是否经常延续，还是反而容易回落。这提供市场背景，不给出具体买点。',formula:'20 日动量 = 当前复权收盘价 ÷ 20 个交易日前复权收盘价 − 1'},
  {id:'exposure_size_log_total_mv',name:'小公司风格',title:'小公司，会不会更有弹性',short:'总市值较小的股票',low:'总市值较大的股票',tag:'公司规模',icon:'M4 20V11h6v9M14 20V4h6v16M2 20h20',description:'比较公司大小，看看近期哪一组相对占优。',scene:'你可能听过“小盘更活跃，大盘更稳”，想看看近期市场究竟偏向哪一边。',logic:'不同规模公司的流动性、关注度和风险特征可能不同。投资者的偏好变化，可能伴随大小市值股票的表现差异。',measure:'按总市值排序，比较市值较小与较大两组之后的表现。这里的“大小”指股票总市值，不是单股价格。',trap:'小市值不等于公司被低估，也不等于一定更有成长性。公司规模只是一个特征。',use:'如果你关注的股票多数属于小市值，可以借此理解其表现是否与整体小公司风格相似，避免把所有涨跌都归于个股判断。',formula:'小市值得分 = −log（总市值）'},
  {id:'value_ep_ttm',name:'盈利估值',title:'同样的盈利，想买得便宜',short:'每元股价对应盈利较多',low:'每元股价对应盈利较少',tag:'价格与盈利',icon:'M5 6h14v14H5zM8 3v6M16 3v6M8 13h8M8 16h5',description:'花同样的钱，买到更多盈利，近期占优吗？',scene:'面对两家有盈利的公司，你会比较：每投入一元，分别对应多少公司的历史盈利？',logic:'价格相对盈利较低，可能来自市场低估，也可能是在补偿经营风险。若预期修复，价格可能重新调整。',measure:'只看市盈率为正的股票，按盈利收益率排序，比较每元价格对应历史盈利较多与较少两组的后续表现。',trap:'历史盈利可能下滑，也可能包含一次性收益。“便宜”未必意味着划算。',use:'当你被低市盈率吸引时，先把它理解为价格与历史盈利的关系，再查看盈利是否可持续。这个指标不评价公司未来盈利质量。',formula:'盈利收益率 = 1 ÷ 滚动市盈率（仅市盈率 > 0）'},
  {id:'lowvol_20d',name:'平稳波动',title:'不想每天跟着大起大落',short:'过去 20 日波动较小',low:'过去 20 日波动较大',tag:'价格波动',icon:'M2 12h4l3-4 4 8 4-6 3 2h2',description:'过去更平稳的股票，之后表现如何？',scene:'面对每天大幅涨跌的股票，你会感到难以承受，想知道价格相对平稳的股票表现怎样。',logic:'不同投资者对波动的承受能力不同，也可能偏好高弹性股票。波动大小可以帮助描述风格差异，不能直接推断谁更安全。',measure:'计算过去 20 个交易日每日收益的波动程度，比较波动较小与较大两组的后续表现。',trap:'过去波动小，未来也可能突然下跌。短期平稳不等于本金安全。',use:'当你希望减少持有过程中的起伏，可以先区分股票过去的波动特征，再结合实际持仓风险理解。这里并未衡量你的组合风险。',formula:'低波动得分 = −标准差（过去 20 个交易日收益）'},
  {id:'volume_momentum_5_20',name:'交易升温',title:'成交突然热闹，想凑近看看',short:'成交量升温更明显',low:'成交量升温较少或降温',tag:'交易活跃变化',icon:'M3 20V14h4v6M10 20V9h4v11M17 20V3h4v17',description:'参与交易变得活跃，后面的价格也更强吗？',scene:'一只股票突然成交活跃，你开始关注它：是不是有新的变化正在发生？',logic:'成交变化可能伴随关注度上升、消息冲击或分歧加大。它说明交易活跃度变化，不能识别是谁在买卖。',measure:'比较最近 5 日与最近 20 日的日均成交量，按变化比例分组，观察升温更明显的一组之后是否相对占优。',trap:'放量不等于主力买入。每笔成交都有买卖双方，价格方向还需要另外观察。',use:'当你看到放量时，可以把“更热闹”和“后续涨得更多”分开判断。这张卡帮你检查两者在最近的数据里是否一致。',formula:'成交量变化 = 最近 5 日日均成交量 ÷ 最近 20 日日均成交量 − 1'}
];

// Educational topics are deliberately separate from audited performance data.
const learningTopics = [
 {id:'value_dividend_ttm',name:'分红回报',category:'value',title:'不只等涨价，也想收点分红',short:'过去分红相对股价较多',low:'过去分红相对股价较少',tag:'股息率',icon:'M4 7h16v13H4zM8 7V4h8v3M8 12h8M12 10v6',description:'分红看着不少，是持续回报，还是股价跌出来的高比例？',scene:'你想持有一家公司久一点，不只靠卖出时的差价，也希望经营成果能通过现金分红回到手里。',logic:'把过去的现金分红与当前股价放在一起看，可以比较分红相对买入价格的大小。但这个比例升高，也可能只是因为股价下跌。',measure:'股息率描述过去分红与股价的关系。要判断是否可持续，还需要查看历年分红记录、经营现金流和已公告的分红方案。',trap:'过去分得多，不代表下一年照样分。分红还伴随除息价格调整，不能把现金到账直接当成额外赚到的钱。',use:'当你因为高分红而关注一只股票，可以先区分：是分红增加了，还是股价下降了；再看公司的现金是否支持继续分红。',formula:'对应指标：过去 12 个月股息率（dv_ttm，单位 %），按数据源的分红统计口径。它不是未来承诺的分红率。',source:'https://tushare.pro/document/2?doc_id=32',checks:[['分红能持续吗？','对照历年现金分红，分清常规分红与偶发的大额分红。'],['钱从哪里来？','结合经营现金流，看看日常经营是否支持现金支出。'],['比例为什么变高？','分别看每股分红和股价的变化，避免只盯着一个高百分比。']],related:'value_ep_ttm',relatedLabel:'再看看：价格与盈利的关系'},
 {id:'quality_roe',name:'盈利能力',category:'business',title:'买公司，也想看赚钱本事',short:'每份股东资本创造利润较多',low:'每份股东资本创造利润较少',tag:'净资产收益率',icon:'M4 20V10h5v10M9 20V6h5v14M14 20V3h5v17M2 20h20',description:'投入同样的股东资本，哪家公司能创造更多利润？',scene:'两家公司都赚了钱，但体量差很多。你想知道：谁利用股东投入的资本更有效，而不只是比较利润总额。',logic:'净资产收益率把利润与股东资本联系起来，帮助理解盈利效率。不过，较高的数字也可能来自较多负债或较小的净资产基数。',measure:'使用已公开财报中的净资产收益率，结合相同报告期间和相近行业比较；再看多年变化，避免把某一年的特殊收益当成常态。',trap:'高净资产收益率不等于股价便宜。一次性收益、负债和净资产变化，都可能影响这个数字。',use:'把“公司会赚钱”和“买入价格合适”分开判断。先了解盈利是否稳定，再结合估值与负债理解。',formula:'净资产收益率（ROE）衡量净利润相对股东权益的水平；平均、加权、年化等口径不能混用。本条对应注册指标 roe。',source:'https://tushare.pro/document/2?doc_id=79',checks:[['利润是经常赚到的吗？','看看是否依赖出售资产等一次性收益。'],['和谁比较才合适？','尽量比较同一行业、同一报告期及一致口径的公司。'],['高数字背后靠什么？','把盈利、负债和净资产基数一起看。']],related:'value_ep_ttm',relatedLabel:'再看看：赚钱能力之外的买入价格'},
 {id:'quality_ocf_sales',name:'经营现金流',category:'business',title:'账面有收入，现金跟得上吗',short:'经营净现金流相对收入较多',low:'经营净现金流相对收入较少',tag:'经营现金流收入比',icon:'M3 7h15l-3-3M21 17H6l3 3M18 7l-3 3M6 17l3-3',description:'生意做了不少，日常经营最后留下多少现金？',scene:'公司营业收入增长了，你还想知道：这些生意有没有转化为现金，还是大量资金留在应收款和库存里。',logic:'收入确认与收付款的时间并不相同。经营现金流反映经营活动的现金流入和流出，能从另一个角度帮助理解生意的资金状况。',measure:'对应指标是单季度经营活动现金流量净额除以营业收入。它反映经营净现金与收入的关系，不等于销售收款率，也不等于利润转成现金的比例。',trap:'某个季度现金流偏低，可能与季节性、备货或付款节奏有关；偏高也可能有预收款等暂时因素，不能只看一期。',use:'当你看到收入增长时，再看现金流、应收款和库存是否出现明显变化。先理解差异的原因，再判断增长的质量。',formula:'经营现金流收入比 = 单季度经营活动产生的现金流量净额 ÷ 单季度营业收入（q_ocf_to_sales）。',source:'https://tushare.pro/document/2?doc_id=79',checks:[['现金与收入一起增长吗？','观察同一期间的现金流与收入，不混用季度和全年数字。'],['差异发生在哪里？','结合应收款、库存以及收付款节奏寻找原因。'],['是不是季节性现象？','对照往年同一季度及较长时间，避免只看一个季度。']],related:'quality_roe',relatedLabel:'一起理解：利润与现金是两回事'},
 {id:'quality_low_leverage',name:'负债负担',category:'risk',title:'负担少一点，心里更踏实',short:'资产中负债占比较低',low:'资产中负债占比较高',tag:'资产负债率',icon:'M12 3l8 4v6c0 4-8 8-8 8s-8-4-8-8V7zM8 12l3 3 5-6',description:'公司的资产里，有多少对应着需要承担的负债？',scene:'你担心公司平时看着不错，一遇到资金紧张就难以周转，想先了解它背着多大的负担。',logic:'资产负债率描述总资产中负债的占比。判断资金压力，还要看负债种类、到期时间，以及现金和经营带来的现金流。',measure:'对应指标按资产负债率从低到高比较。总负债不仅包括借款，也包括应付账款等；不同生意模式和行业的正常水平可能不同。',trap:'负债少不代表一定安全，也不代表经营效率高。只看总比例，会忽略短期集中到期、资产难以变现等问题。',use:'当你担心公司“扛不住”时，把负债比例、近期要还的钱和可用现金放在一起看，而不是只凭一个低负债数字下结论。',formula:'资产负债率 = 总负债 ÷ 总资产；注册指标以 −debt_to_assets 表示，分数越高代表该比例越低。',source:'https://tushare.pro/document/2?doc_id=79',checks:[['最近要还多少？','区分短期与长期负债，留意是否集中到期。'],['手里的钱够灵活吗？','结合可用现金、经营现金流和资产的变现情况。'],['这类公司通常怎样？','结合行业和商业模式比较，避免跨行业套同一个标准。']],related:'lowvol_20d',relatedLabel:'再区分：公司负债与股价波动'}
];
topics.push(...learningTopics);
const categories=[{id:'all',label:'全部'},{id:'value',label:'找便宜与分红'},{id:'business',label:'看经营'},{id:'market',label:'看走势与风格'},{id:'risk',label:'看风险'}];
const topicCategories={reversal_5d:'market',momentum_20d:'market',exposure_size_log_total_mv:'market',value_ep_ttm:'value',lowvol_20d:'risk',volume_momentum_5_20:'market'};
const categoryOf=t=>t.category||topicCategories[t.id];
const hasEvidence=t=>Boolean(data?.modes?.[mode]?.factors?.[t.id]?.periods?.length);
const filteredTopics=()=>topics.filter(t=>(category==='all'||categoryOf(t)===category)&&(!onlySaved||saved.includes(t.id)));

const $ = s => document.querySelector(s);
let data, mode='weekly', selected='reversal_5d', months=3, category='all', onlySaved=false, saved=[], toastTimer;
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
 const sorted=topics.filter(hasEvidence).sort((a,b)=>md().factors[b.id].mean-md().factors[a.id].mean), best=sorted[0], weak=sorted.at(-1), max=Math.max(...sorted.map(t=>Math.abs(md().factors[t.id].mean)));
 const evidence=t=>{const v=md().factors[t.id].mean;return `<div class="evidence-row ${v<0?'negative':''}"><div class="evidence-row-head"><span>${t.name}</span><strong>${valueText(v)}<small>个百分点</small></strong></div><div class="evidence-track"><div class="evidence-fill" style="width:${Math.abs(v)/max*100}%"></div></div></div>`;};
 $('#overview-card').innerHTML=`<div class="overview-copy"><span class="overview-eyebrow">这份快照里的一个发现</span><h2>${best.name}相对占优，<br>${weak.name}暂未占优。</h2><p>在本页已有历史比较的 ${sorted.length} 种观察中，${best.short}的一组平均表现更强；${weak.short}的一组则相对落后。它描述的是过去这段时间。</p><button class="overview-link" data-select="${best.id}">看看背后的逻辑 <span>↗</span></button></div><div class="overview-evidence"><span class="evidence-label">两组后续表现差异 · ${windowLabel()}</span>${evidence(best)}${evidence(weak)}<p class="evidence-foot">每期收益差的平均值，已扣估算成本。不是持有收益。</p></div>`;
}
function renderCards(){
 // Older cached HTML can coexist with fresh JS while the site cache expires.
 if(!$('#topic-categories'))$('#behavior-grid').insertAdjacentHTML('beforebegin','<div class="explore-toolbar"><div id="topic-categories" class="topic-categories" role="group" aria-label="按投资想法分类"></div><span id="topic-count" role="status"></span></div>');
 $('#explore .section-header p').textContent='10 种投资想法，从看价格到看公司。新增分红、盈利能力、现金流与负债解读。';
 $('.selection-note').textContent='6 项已有历史比较 · 4 项新增逻辑解读，暂无历史比较 · 关注仅保存在当前浏览器';
 $('#saved-count').textContent=saved.length;
 $('#show-saved').setAttribute('aria-pressed',String(onlySaved));
 $('#topic-categories').innerHTML=categories.map(c=>`<button data-category="${c.id}" aria-pressed="${category===c.id}">${c.label}<span>${topics.filter(t=>(c.id==='all'||categoryOf(t)===c.id)&&(!onlySaved||saved.includes(t.id))).length}</span></button>`).join('');
 const list=filteredTopics();
 $('#topic-count').textContent=`显示 ${list.length} 种想法`;
 $('#behavior-grid').innerHTML=list.length?list.map(t=>{
 const f=hasEvidence(t)?md().factors[t.id]:null,isSaved=saved.includes(t.id);
 const result=f?`<div class="card-result"><div><strong class="${tone(f.mean)}">${verdict(f.mean)}</strong><span>平均差异 ${valueText(f.mean)} 个百分点</span></div><div><div class="mini-dots" aria-hidden="true">${f.periods.slice(-md().window).map(r=>`<span class="${r.spread>0?'pos':'neg'}"></span>`).join('')}</div><span>${md().window} 次里 ${f.positive} 次领先</span></div></div>`:`<div class="card-result learning-result"><div><strong>先理解逻辑</strong><span>暂无历史比较</span></div><span class="learning-count">3 个观察问题</span></div>`;
 return `<article class="behavior-card ${selected===t.id?'selected':''}"><div class="card-head">${icon(t)}<span class="card-family">${t.name}</span>${t.checks?'<span class="new-topic">新增</span>':''}<button class="save" data-save="${t.id}" aria-pressed="${isSaved}" aria-label="${isSaved?'取消关注':'关注'}${t.name}">${isSaved?'★':'☆'}</button></div><button class="card-title" data-select="${t.id}">${t.title}</button><p class="card-description">${t.description}</p>${result}<button class="card-open" data-select="${t.id}">${f?'理解这种行为':'看看怎样理解'} <span>↗</span></button></article>`;
 }).join(''):'<div class="empty-state">这个分类下暂无关注的想法。<button id="reset-topics">查看全部想法</button></div>';
}
function storyIntro(t){return `<div class="story-top"><div><span class="eyebrow">02 / 把直觉拆开看</span><h2 id="story-title">${t.title}</h2><p>${t.description}</p></div><span class="story-tag">正在解读 · ${t.name}</span></div>`;}
function storySteps(t){return `<div><ol class="steps"><li><span class="step-number">1</span><h3>你熟悉的场景</h3><p>${t.scene}</p></li><li><span class="step-number">2</span><h3>背后可能的逻辑</h3><p>${t.logic}</p></li><li><span class="step-number">3</span><h3>怎样把这个想法看具体</h3><p>${t.measure}</p></li></ol><div class="trap"><span>↳</span><div><strong>容易想错的一步</strong><p>${t.trap}</p></div></div></div>`;}
function renderLearningStory(t){
 $('#story-content').innerHTML=`${storyIntro(t)}<div class="story-layout">${storySteps(t)}<div class="detail-evidence learning-evidence"><div class="detail-topline"><h3>带着这三个问题，再看公司</h3><span class="subtle-chip">逻辑解读</span></div><ol class="reading-questions">${t.checks.map(([question,detail],i)=>`<li><span>0${i+1}</span><div><h4>${question}</h4><p>${detail}</p></div></li>`).join('')}</ol><div class="evidence-status"><strong>这项暂未展示历史比较</strong><p>这里帮助理解指标，尚不能判断它近期是否占优。历史数据和比较口径核验完成后，才会显示结果。</p></div><div class="utility"><h4>这对我有什么用？</h4><p>${t.use}</p></div><button class="related-topic" data-select="${t.related}">${t.relatedLabel}<span>↗</span></button><details class="formula"><summary>对应的专业指标：${t.tag}</summary><p>${t.formula}</p><p>指标编号：${t.id}</p><a href="${t.source}" target="_blank" rel="noopener">查看数据源的指标定义 ↗</a></details></div></div>`;
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
function renderStory(){const t=getTopic();
 if(!hasEvidence(t)){renderLearningStory(t);return;}
 const f=md().factors[selected];
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
 else if(b.dataset.category){category=b.dataset.category;renderCards();const list=filteredTopics();if(list.length&&!list.some(t=>t.id===selected)){selected=list[0].id;renderCards();renderStory();}}
 else if(b.id==='reset-topics'){category='all';onlySaved=false;renderCards();}
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
