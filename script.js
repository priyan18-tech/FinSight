// ─── DATA ───────────────────────────────────────────────
const CAT_COLORS = {
  Food: '#f472b6', Transport: '#60a5fa', Shopping: '#a78bfa',
  Entertainment: '#fb923c', Health: '#34d399', Utilities: '#fbbf24',
  Income: '#4ade80', Other: '#94a3b8'
};
const CAT_EMOJIS = {
  Food:'🍔', Transport:'🚗', Shopping:'🛍️', Entertainment:'🎬',
  Health:'💊', Utilities:'💡', Income:'💰', Other:'📦'
};
const BUDGETS = { Food:8000, Transport:4000, Shopping:6000, Entertainment:3000, Health:2000, Utilities:3000, Other:2000 };

let transactions = []; // Starts empty

let spendingChart, catChart, savingsChart, forecastChart;
let currentPage = 'dashboard';
let nextId = 1;

// ─── UTILS ──────────────────────────────────────────────
const fmt = n => '₹' + Math.abs(n).toLocaleString('en-IN');
const getExpenses = () => transactions.filter(t=>t.type==='expense');
const getIncome   = () => transactions.filter(t=>t.type==='income');
const totalAmt    = arr => arr.reduce((s,t)=>s+t.amt,0);
const byCategory  = arr => {
  const m={};
  arr.forEach(t=>{m[t.cat]=(m[t.cat]||0)+t.amt;});
  return m;
};

function showPage(p){
  ['dashboard','transactions','budget','insights'].forEach(id=>{
    document.getElementById('page-'+id).style.display = id===p?'':'none';
  });
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.classList.toggle('active', el.textContent.toLowerCase().includes(
      p==='dashboard'?'dashboard':p==='transactions'?'trans':p==='budget'?'budget':'insight'));
  });
  currentPage = p;
  if(p==='transactions') renderTxPage();
  if(p==='budget') renderBudgetPage();
  if(p==='insights') renderInsightsPage();
}

function openModal(){
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal').classList.add('open');
}
function closeModal(){ document.getElementById('modal').classList.remove('open'); }

function addTransaction(){
  const desc=document.getElementById('f-desc').value.trim();
  const amt=parseFloat(document.getElementById('f-amt').value);
  const cat=document.getElementById('f-cat').value;
  const date=document.getElementById('f-date').value;
  const type=document.getElementById('f-type').value;
  if(!desc||!amt||!date){alert('Please fill all fields');return;}
  transactions.unshift({id:nextId++,desc,cat,amt,type,date});
  closeModal();
  refreshAll();
  document.getElementById('f-desc').value='';
  document.getElementById('f-amt').value='';
}

// ─── RENDER ─────────────────────────────────────────────
function refreshAll(){
  renderStats();
  renderRecentTx();
  renderSpendingChart();
  renderCatChart();
  renderBudgetMini();
  renderQuickInsight();
}

function renderStats(){
  const expenses = totalAmt(getExpenses());
  const income   = totalAmt(getIncome());
  const balance  = income - expenses;
  const savRate  = income>0 ? Math.round((balance/income)*100) : 0;
  document.getElementById('stats-row').innerHTML = `
    <div class="card-sm">
      <div class="stat-label">Total Balance</div>
      <div class="stat-val" style="color:${balance>=0?'var(--green)':'var(--red)'}">${fmt(balance)}</div>
      <div class="stat-badge badge-nu">This month</div>
    </div>
    <div class="card-sm">
      <div class="stat-label">Total Income</div>
      <div class="stat-val" style="color:var(--green)">${fmt(income)}</div>
      <div class="stat-badge badge-up">↑ Credited</div>
    </div>
    <div class="card-sm">
      <div class="stat-label">Total Spent</div>
      <div class="stat-val" style="color:var(--red)">${fmt(expenses)}</div>
      <div class="stat-badge badge-dn">↓ This month</div>
    </div>
    <div class="card-sm">
      <div class="stat-label">Savings Rate</div>
      <div class="stat-val" style="color:var(--accent2)">${savRate}%</div>
      <div class="stat-badge ${savRate>=20?'badge-up':'badge-dn'}">${savRate>=20?'↑ On track':'↓ Low'}</div>
    </div>`;
}

// FIXED: Added dedicated Date column
function txRow(t, showDel=false){
  const isInc = t.type==='income';
  const col = CAT_COLORS[t.cat]||'#7c82a0';
  return `<tr>
    <td style="width:44px"><div class="tx-icon" style="background:${col}22;">${CAT_EMOJIS[t.cat]||'📦'}</div></td>
    <td><div class="tx-name">${t.desc}</div></td>
    <td><span class="cat-pill" style="background:${col}22;color:${col}">${t.cat}</span></td>
    <td style="color:var(--muted);font-size:12px">${t.date}</td>
    <td style="text-align:right"><span class="tx-amt ${isInc?'pos':'neg'}">${isInc?'+':'−'}${fmt(t.amt)}</span></td>
    ${showDel?`<td style="text-align:right"><button onclick="deleteTx(${t.id})" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px">✕</button></td>`:''}
  </tr>`;
}

function deleteTx(id){
  transactions = transactions.filter(t=>t.id!==id);
  refreshAll();
  if(currentPage==='transactions') renderTxPage();
}

// FIXED: Added Date header to match the row columns
function renderRecentTx(){
  const el = document.getElementById('recent-tx');
  if(!el) return;
  if(transactions.length === 0){
    el.innerHTML = '<tbody><tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">No transactions yet</td></tr></tbody>';
    return;
  }
  const rows = transactions.slice(0,6).map(t=>txRow(t)).join('');
  el.innerHTML = `<thead><tr><th></th><th>Description</th><th>Category</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody>`;
}

function renderTxPage(){
  const search = document.getElementById('search-tx')?.value.toLowerCase()||'';
  const catF   = document.getElementById('filter-cat')?.value||'';
  const typeF  = document.getElementById('filter-type')?.value||'';
  const cats = [...new Set(transactions.map(t=>t.cat))];
  const catSel = document.getElementById('filter-cat');
  if(catSel && catSel.options.length<=1) cats.forEach(c=>{ const o=new Option(c,c); catSel.add(o); });
  let data = transactions;
  if(search) data = data.filter(t=>t.desc.toLowerCase().includes(search)||t.cat.toLowerCase().includes(search));
  if(catF)  data = data.filter(t=>t.cat===catF);
  if(typeF) data = data.filter(t=>t.type===typeF);
  const el = document.getElementById('full-tx-table');
  if(!el) return;
  if(data.length === 0){
    el.innerHTML = '<tbody><tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px">No transactions found</td></tr></tbody>';
    return;
  }
  el.innerHTML = `<thead><tr><th></th><th>Description</th><th>Category</th><th>Date</th><th style="text-align:right">Amount</th><th></th></tr></thead><tbody>${data.map(t=>txRow(t,true)).join('')}</tbody>`;
}

function renderSpendingChart(mode='monthly'){
  const ctx = document.getElementById('spending-chart');
  if(!ctx) return;
  if(spendingChart) spendingChart.destroy();
  let labels, income, expense;
  if(mode==='monthly'){
    labels = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    income  = [0,0,0,0,0, totalAmt(getIncome())];
    expense = [0,0,0,0,0, totalAmt(getExpenses())];
  } else {
    labels = ['W1','W2','W3','W4'];
    expense = [0,0,0,totalAmt(getExpenses())];
    income  = [0,0,0,0];
  }
  spendingChart = new Chart(ctx, {
    type:'bar',
    data:{ labels, datasets:[
      {label:'Income', data:income, backgroundColor:'rgba(52,211,153,0.25)', borderColor:'#34d399', borderWidth:1.5, borderRadius:6},
      {label:'Expense', data:expense, backgroundColor:'rgba(248,113,113,0.25)', borderColor:'#f87171', borderWidth:1.5, borderRadius:6},
    ]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
      scales:{ x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#7c82a0',font:{size:11}}},
               y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#7c82a0',font:{size:11},callback:v=>'₹'+(v/1000)+'k'}} }}
  });
}

function renderCatChart(){
  const ctx = document.getElementById('cat-chart');
  if(!ctx) return;
  if(catChart) catChart.destroy();
  const data = byCategory(getExpenses());
  const labels = Object.keys(data);
  const vals = Object.values(data);
  const colors = labels.map(l=>CAT_COLORS[l]||'#7c82a0');
  
  if(vals.length === 0){
    if(catChart) catChart.destroy();
    return;
  }
  
  catChart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels, datasets:[{ data:vals, backgroundColor:colors.map(c=>c+'44'), borderColor:colors, borderWidth:2 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'70%',
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>`${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`}} } }
  });
  const leg = document.getElementById('cat-legend');
  leg.innerHTML = labels.map((l,i)=>
    `<span style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:2px;background:${colors[i]};flex-shrink:0"></span><span style="color:var(--muted)">${l}</span></span>`
  ).join('');
}

function renderBudgetMini(){
  const data = byCategory(getExpenses());
  const el = document.getElementById('budget-mini');
  if(!el) return;
  const cats = Object.keys(BUDGETS).filter(c=>c!=='Income').slice(0,4);
  el.innerHTML = cats.map(cat=>{
    const spent=data[cat]||0, budget=BUDGETS[cat], pct=Math.min(100,Math.round(spent/budget*100));
    const col = pct>90?'var(--red)':pct>70?'var(--amber)':'var(--green)';
    return `<div class="budget-item">
      <div class="budget-row"><span style="font-size:12px">${CAT_EMOJIS[cat]} ${cat}</span><span style="font-size:12px;color:${col}">${pct}%</span></div>
      <div class="budget-bar-bg"><div class="budget-bar" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }).join('');
}

function renderQuickInsight(){
  const el = document.getElementById('quick-insight');
  if(!el) return;
  const expenses = totalAmt(getExpenses());
  const income   = totalAmt(getIncome());
  if(transactions.length === 0){
    el.innerHTML = "Add your first transaction to get started!";
    return;
  }
  const catData  = byCategory(getExpenses());
  const topCat   = Object.entries(catData).sort((a,b)=>b[1]-a[1])[0];
  const savPct   = income>0?Math.round((income-expenses)/income*100):0;
  const overBudget = Object.entries(BUDGETS).filter(([c,b])=>(catData[c]||0)>b*0.9).map(([c])=>c);
  let msg = `Your savings rate is <strong>${savPct}%</strong> this month. `;
  if(topCat) msg += `Highest spend: <strong>${topCat[0]}</strong> at ${fmt(topCat[1])}. `;
  if(overBudget.length) msg += `⚠️ <strong>${overBudget.join(', ')}</strong> near budget limit.`;
  else msg += `✅ All categories within budget.`;
  el.innerHTML = msg;
}

// ─── BUDGET PAGE ─────────────────────────────────────────
function renderBudgetPage(){
  const catData = byCategory(getExpenses());
  const income  = totalAmt(getIncome());
  const expenses= totalAmt(getExpenses());
  const savPct  = income>0?Math.round((income-expenses)/income*100):0;
  document.getElementById('savings-pct').textContent = savPct+'%';

  const alertEl = document.getElementById('alert-zone');
  const alerts = [];
  Object.entries(BUDGETS).forEach(([cat,budget])=>{
    const spent=catData[cat]||0;
    const pct=Math.round(spent/budget*100);
    if(pct>=100) alerts.push({type:'bad',msg:`🔴 <strong>${cat}</strong> budget exceeded! Spent ${fmt(spent)} of ${fmt(budget)} limit.`});
    else if(pct>=80) alerts.push({type:'warn',msg:`⚠️ <strong>${cat}</strong> at ${pct}% of budget (${fmt(spent)} / ${fmt(budget)})`});
  });
  alertEl.innerHTML = alerts.map(a=>`<div class="alert alert-${a.type}">${a.msg}</div>`).join('');

  const barsEl = document.getElementById('budget-bars');
  barsEl.innerHTML = Object.entries(BUDGETS).filter(([c])=>c!=='Income').map(([cat,budget])=>{
    const spent=catData[cat]||0, pct=Math.min(100,Math.round(spent/budget*100));
    const col=pct>90?'var(--red)':pct>70?'var(--amber)':'var(--green)';
    return `<div class="budget-item">
      <div class="budget-row">
        <span style="font-size:13px">${CAT_EMOJIS[cat]} ${cat}</span>
        <span style="font-size:12px;color:var(--muted)">${fmt(spent)} / ${fmt(budget)}</span>
        <span style="font-size:12px;color:${col};font-weight:600">${pct}%</span>
      </div>
      <div class="budget-bar-bg"><div class="budget-bar" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }).join('');

  const ctx = document.getElementById('savings-chart');
  if(savingsChart) savingsChart.destroy();
  savingsChart = new Chart(ctx, {
    type:'line',
    data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets:[{data:[0,0,0,0,0,savPct], borderColor:'#34d399', backgroundColor:'rgba(52,211,153,0.1)', tension:0.4, fill:true, pointRadius:3, pointBackgroundColor:'#34d399'}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{display:false},ticks:{color:'#7c82a0',font:{size:10}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#7c82a0',font:{size:10},callback:v=>v+'%'}}}}
  });

  const dayTotals = {};
  getExpenses().forEach(t=>{ dayTotals[t.date]=(dayTotals[t.date]||0)+t.amt; });
  const topDays = Object.entries(dayTotals).sort((a,b)=>b[1]-a[1]).slice(0,4);
  document.getElementById('top-days').innerHTML = topDays.map(([date,amt])=>
    `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px">
      <span style="color:var(--muted)">${date}</span>
      <span style="color:var(--red);font-weight:600">−${fmt(amt)}</span>
    </div>`).join('');
}

// ─── INSIGHTS PAGE ────────────────────────────────────────
function renderInsightsPage(){
  renderSmartAlerts();
  renderForecastChart();
}

function renderSmartAlerts(){
  const catData = byCategory(getExpenses());
  const income  = totalAmt(getIncome());
  const expenses= totalAmt(getExpenses());
  const alerts  = [];
  if(expenses > income*0.8 && income > 0) alerts.push({icon:'🔴', text:`You've spent <strong>${Math.round(expenses/income*100)}%</strong> of your income. High risk of deficit.`, type:'bad'});
  const foodSpend = catData['Food']||0;
  if(foodSpend > 5000) alerts.push({icon:'🍔', text:`Food spending is ₹${foodSpend.toLocaleString('en-IN')} this month. Consider meal prepping to save up to 30%.`, type:'warn'});
  const shopSpend = catData['Shopping']||0;
  if(shopSpend > 4000) alerts.push({icon:'🛍️', text:`Shopping spend (${fmt(shopSpend)}) is above average. Review cart before checkout!`, type:'warn'});
  alerts.push({icon:'💡', text:`Setting up auto-savings of ₹5,000/month could build a ₹60,000 emergency fund in a year.`, type:'info'});
  const el = document.getElementById('smart-alerts');
  el.innerHTML = alerts.map(a=>`<div class="insight-item"><span class="insight-icon">${a.icon}</span><span>${a.text}</span></div>`).join('');
}

function renderForecastChart(){
  const ctx = document.getElementById('forecast-chart');
  if(forecastChart) forecastChart.destroy();
  const actual   = [0,0,0,0,0,totalAmt(getExpenses())];
  const forecast = [null,null,null,null,null,totalAmt(getExpenses()), totalAmt(getExpenses())*1.05, totalAmt(getExpenses())*1.03];
  forecastChart = new Chart(ctx, {
    type:'line',
    data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'],
      datasets:[
        {label:'Actual',data:actual,borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,0.1)',tension:0.4,fill:true,pointRadius:3,pointBackgroundColor:'#a78bfa'},
        {label:'Forecast',data:forecast,borderColor:'#60a5fa',borderDash:[5,5],tension:0.4,pointRadius:3,pointBackgroundColor:'#60a5fa',fill:false},
      ]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#7c82a0',font:{size:10}}},
              y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#7c82a0',font:{size:10},callback:v=>'₹'+(v/1000).toFixed(0)+'k'}}}}
  });
}

async function generateFullInsights(){
  const loader = document.getElementById('ai-loader');
  const el = document.getElementById('full-insight');
  loader.innerHTML = '<div class="loader"></div>';
  el.innerHTML = 'Analyzing your finances…';

  const catData = byCategory(getExpenses());
  const income  = totalAmt(getIncome());
  const expenses= totalAmt(getExpenses());
  const savPct  = income>0?Math.round((income-expenses)/income*100):0;

  setTimeout(() => {
     let text = "";
     if(transactions.length === 0) {
        text = "You haven't added any transactions yet. Add your income and expenses to get personalized insights.";
     } else {
        text = `• Your savings rate is <strong>${savPct}%</strong>. ${savPct < 20 ? 'Try to increase it to at least 20%.' : 'Great job keeping your savings healthy!'}<br>`;
        text += `• Total spending this month is <strong>${fmt(expenses)}</strong>.<br>`;
        text += `• Top spending category: <strong>${Object.entries(catData).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}</strong>.`;
     }
     el.innerHTML = text;
     loader.innerHTML='';
  }, 1000);
}

let chatHistory=[];
async function askAI(){
  const input = document.getElementById('ai-question');
  const q = input.value.trim();
  if(!q) return;
  input.value='';
  const histEl = document.getElementById('chat-history');
  histEl.innerHTML += `<div style="margin-bottom:10px"><div style="color:var(--accent2);font-weight:600;margin-bottom:4px">You</div><div>${q}</div></div>`;
  histEl.innerHTML += `<div id="ai-resp-latest" style="margin-bottom:10px"><div style="color:var(--muted);font-weight:600;margin-bottom:4px">FinSight AI</div><div class="loader"></div></div>`;
  histEl.scrollTop = histEl.scrollHeight;

  setTimeout(() => {
     let reply = "I recommend tracking your daily expenses to get a better overview.";
     if(q.includes('save')) reply = "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.";
     if(q.includes('food')) reply = "Cooking at home can save you up to 40% compared to dining out frequently.";
     
     document.getElementById('ai-resp-latest').innerHTML=`<div style="color:var(--muted);font-weight:600;margin-bottom:4px">FinSight AI</div><div style="line-height:1.6">${reply}</div>`;
     histEl.scrollTop = histEl.scrollHeight;
  }, 800);
}

function switchChart(mode,btn){
  document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  renderSpendingChart(mode);
}

// ─── INIT ────────────────────────────────────────────────
document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
refreshAll();