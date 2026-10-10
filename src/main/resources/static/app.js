const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n||0));
const palette = ['#8b74e7','#f28bb5','#70b8f4','#ffc66d','#6bcbb4','#b8a0ef','#c5d9fb'];
let categoryChart, trendChart, allTransactions = [];
const categoryEmoji = {Food:'🍜',Shopping:'🛍️',Travel:'🚌',Bills:'🧾',Education:'📚',Entertainment:'🎧',Health:'🌿',Salary:'💼',Other:'💜'};
async function api(url, options={}) {
  const response = await fetch(url,{headers:{'Content-Type':'application/json'},...options});
  if (!response.ok) { let msg = 'Something went wrong'; try { const data=await response.json(); msg=data.message||data.error||msg; } catch{} throw new Error(msg); }
  if (response.status===204) return null;
  return response.json();
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function loadDashboard(){
  try {
    const d=await api('/api/dashboard');
    $('balance').textContent=money(d.balance);$('income').textContent=money(d.income);$('expenses').textContent=money(d.expenses);$('savings').textContent=money(d.savings);
    const rate=Number(d.income)>0?Math.round(Number(d.savings)/Number(d.income)*100):0;
    $('savingsRate').textContent=`↗ ${rate}% savings rate`;
    $('personality').textContent=d.moneyPersonality;
    $('personalityText').textContent=d.moneyPersonality==='The Balanced Dreamer'?'You’re making room for both today and tomorrow. Keep your spending intentional and your goals close.':'You deserve fun, too! Try a small spending pause this week and send a little more money toward your future.';
    renderCategoryChart(d.categories||{});renderTrendChart(d.monthlyTrend||[]);renderInsights(d);
    $('budgetInput').value=d.monthlyLimit;
    const pct=Math.min(100,Number(d.budgetUsedPercent)||0);$('budgetProgress').style.width=pct+'%';
    $('budgetText').textContent=`${money(d.expenses)} spent out of ${money(d.monthlyLimit)} (${d.budgetUsedPercent}% of your limit).`+(pct>100?' Budget exceeded — take a gentle pause.':pct>=80?' Getting close to your limit.':' You’re within your budget. 💜');
    $('budgetProgress').style.background=pct>=100?'#e7799f':'linear-gradient(90deg,#ad99f8,#7259d8)';
  } catch(e){toast('Could not load dashboard: '+e.message)}
}
function renderCategoryChart(categories){
  const entries=Object.entries(categories).filter(([,v])=>Number(v)>0).sort((a,b)=>b[1]-a[1]);
  const ctx=$('categoryChart');
  if(categoryChart)categoryChart.destroy();
  categoryChart=new Chart(ctx,{type:'doughnut',data:{labels:entries.map(x=>x[0]),datasets:[{data:entries.map(x=>x[1]),backgroundColor:palette,borderWidth:3,borderColor:'#fff',hoverOffset:5}]},options:{cutout:'70%',plugins:{legend:{display:false}},maintainAspectRatio:true}});
  $('categoryLegend').innerHTML=entries.length?entries.map(([name,val],i)=>`<div class="legend-row"><span class="legend-dot" style="background:${palette[i%palette.length]}"></span><span>${escapeHtml(name)}</span><b>${money(val)}</b></div>`).join(''):'No expenses yet';
}
function renderTrendChart(months){
  if(trendChart)trendChart.destroy();
  trendChart=new Chart($('trendChart'),{type:'line',data:{labels:months.map(m=>m.month),datasets:[{label:'Income',data:months.map(m=>m.income),borderColor:'#53b99a',backgroundColor:'#53b99a20',tension:.35,fill:true},{label:'Expense',data:months.map(m=>m.expense),borderColor:'#9179e8',backgroundColor:'#9179e820',tension:.35,fill:true}]},options:{plugins:{legend:{labels:{usePointStyle:true,boxWidth:7,font:{size:10}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{callback:v=>'₹'+Number(v).toLocaleString('en-IN')}}}}});
}
async function loadTransactions(){
  const params=new URLSearchParams();if($('typeFilter').value)params.set('type',$('typeFilter').value);if($('globalSearch').value.trim())params.set('search',$('globalSearch').value.trim());
  try{allTransactions=await api('/api/transactions?'+params.toString());renderTransactions(allTransactions)}catch(e){toast('Could not load transactions: '+e.message)}
}
function renderTransactions(items){
  $('transactionRows').innerHTML=items.map(t=>`<tr><td>${new Date(t.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td><td><strong>${escapeHtml(t.description)}</strong>${t.notes?`<div class="muted">${escapeHtml(t.notes)}</div>`:''}</td><td><span class="category-chip"><span class="category-emoji">${categoryEmoji[t.category]||'💜'}</span>${escapeHtml(t.category)}</span></td><td class="${t.type==='INCOME'?'income-text':'expense-text'}">${t.type==='INCOME'?'Income':'Expense'}</td><td class="${t.type==='INCOME'?'income-text':'expense-text'}">${t.type==='INCOME'?'+ ':'− '}${money(t.amount)}</td><td><button class="icon-btn" title="Edit" onclick="editTransaction(${t.id})">✎</button><button class="icon-btn" title="Delete" onclick="deleteTransaction(${t.id})">⌫</button></td></tr>`).join('');
  $('emptyState').hidden=items.length>0;
}
function openTransaction(t=null){
  $('transactionForm').reset();$('transactionId').value=t?.id||'';$('dialogTitle').textContent=t?'Edit transaction':'Add transaction';$('formError').textContent='';
  $('transactionType').value=t?.type||'EXPENSE';$('description').value=t?.description||'';$('category').value=t?.category||'Food';$('amount').value=t?.amount||'';$('date').value=t?.date||new Date().toISOString().slice(0,10);$('notes').value=t?.notes||'';
  $('transactionDialog').showModal();
}
window.editTransaction=id=>{const t=allTransactions.find(x=>x.id===id);if(t)openTransaction(t)};
window.deleteTransaction=async id=>{if(!confirm('Delete this transaction?'))return;try{await api('/api/transactions/'+id,{method:'DELETE'});toast('Transaction deleted');await refreshAll()}catch(e){toast(e.message)}};
async function refreshAll(){await Promise.all([loadDashboard(),loadTransactions(),loadGoals()])}
$('addTransactionBtn').addEventListener('click',()=>openTransaction());
$('closeDialog').addEventListener('click',()=>$('transactionDialog').close());
$('transactionForm').addEventListener('submit',async e=>{
 e.preventDefault();const id=$('transactionId').value;
 const body={description:$('description').value.trim(),type:$('transactionType').value,category:$('category').value,amount:Number($('amount').value),date:$('date').value,notes:$('notes').value.trim()};
 try{await api('/api/transactions'+(id?'/'+id:''),{method:id?'PUT':'POST',body:JSON.stringify(body)});$('transactionDialog').close();toast(id?'Transaction updated ✨':'Transaction added 💜');await refreshAll()}
 catch(err){$('formError').textContent=err.message}
});
$('typeFilter').addEventListener('change',loadTransactions);
let searchTimer;$('globalSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(loadTransactions,220)});
$('saveBudget').addEventListener('click',async()=>{try{await api('/api/budget',{method:'PUT',body:JSON.stringify({monthlyLimit:Number($('budgetInput').value)})});toast('Budget saved 💜');await loadDashboard()}catch(e){toast(e.message)}});
async function loadGoals(){
 try{const goals=await api('/api/goals');$('goalList').innerHTML=goals.map(g=>{const p=Math.min(100,Math.round(Number(g.savedAmount)/Number(g.targetAmount)*100));return `<div class="goal-item"><div class="goal-emoji">${escapeHtml(g.emoji||'💜')}</div><div><div class="goal-name">${escapeHtml(g.name)}</div><div class="goal-amount">${money(g.savedAmount)} / ${money(g.targetAmount)}</div></div><div class="goal-percent">${p}% <button class="icon-btn" title="Delete goal" onclick="deleteGoal(${g.id})">⌫</button></div><div class="goal-progress"><span style="width:${p}%"></span></div></div>`}).join('')||'<p class="muted">Add a goal to give your savings a purpose.</p>'}
 catch(e){toast('Could not load goals: '+e.message)}
}
window.deleteGoal=async id=>{if(!confirm('Delete this goal?'))return;try{await api('/api/goals/'+id,{method:'DELETE'});await loadGoals();toast('Goal removed')}catch(e){toast(e.message)}};
$('addGoalBtn').addEventListener('click',()=>{$('goalForm').reset();$('goalSaved').value=0;$('goalError').textContent='';$('goalDialog').showModal()});
$('closeGoalDialog').addEventListener('click',()=>$('goalDialog').close());
$('goalForm').addEventListener('submit',async e=>{e.preventDefault();const body={name:$('goalName').value.trim(),targetAmount:Number($('goalTarget').value),savedAmount:Number($('goalSaved').value),emoji:$('goalEmoji').value};try{await api('/api/goals',{method:'POST',body:JSON.stringify(body)});$('goalDialog').close();toast('Goal created — you’ve got this! ✨');await loadGoals()}catch(err){$('goalError').textContent=err.message}});

function renderInsights(d) {
  const savingsRate = Number(d.income) > 0
    ? Math.round((Number(d.savings) / Number(d.income)) * 100)
    : 0;

  const items = [];

  if (topItems.length > 0) {
    items.push(
      `🛍️ <strong>${escapeHtml(topItems[0])}</strong> is your highest spending category (${money(topItems[1])} total).`
    );
  }

  if (savingsRate >= 20) {
    items.push(
      `🌱 Your savings rate is <strong>${savingsRate}%</strong>. Look at you, planning ahead!`
    );
  } else {
    items.push(
      `💜 Try moving even 5% of each income into a savings goal.`
    );
  }

  if (Number(d.expenses) > Number(d.monthlyLimit)) {
    items.push(
      `⚠️ You're over your monthly budget; review non-essential purchases first.`
    );
  } else {
    items.push(
      `✨ You have ${money(Math.max(0, Number(d.monthlyLimit) - Number(d.expenses)))} of your budget left.`
    );
  }

  $('#insightList').innerHTML = items
    .map(i => `<li>${i}</li>`)
    .join('');
}
$('insightBtn').addEventListener('click',()=>document.querySelector('#insights').scrollIntoView({behavior:'smooth'}));
let wishes=JSON.parse(localStorage.getItem('paisapal-wishlist')||'[]');
function renderWishes(){$('wishList').innerHTML=wishes.map((w,i)=>`<li class="wish-row"><span>🎧 ${escapeHtml(w.name)}<br><strong>${money(w.price)}</strong></span><button class="icon-btn" onclick="removeWish(${i})">✕</button></li>`).join('')||'<li class="muted">Your next little dream goes here ✨</li>'}
$('wishlistForm').addEventListener('submit',e=>{e.preventDefault();wishes.push({name:$('wishName').value.trim(),price:Number($('wishPrice').value)});localStorage.setItem('paisapal-wishlist',JSON.stringify(wishes));$('wishlistForm').reset();renderWishes();toast('Added to your wishlist 💜')});
window.removeWish=i=>{wishes.splice(i,1);localStorage.setItem('paisapal-wishlist',JSON.stringify(wishes));renderWishes()};

/* ===== Single-screen sidebar navigation ===== */

const screenElements = {
  dashboard: [
    document.querySelector('.summary-grid'),
    document.querySelector('.middle-grid')
  ],
  transactions: [
    document.querySelector('#transactions')
  ],
  budget: [
    document.querySelector('#budget')
  ],
  goals: [
    document.querySelector('#goals')
  ],
  streak: [
    document.querySelector('#streak')
  ],
  insights: [
    document.querySelector('#insights'),
    document.querySelector('#insights')
      ?.parentElement?.querySelector('canvas#trendChart')
      ?.closest('.panel')
  ],
  wishlist: [
    document.querySelector('#wishlist')
  ]
};

/* Mark each screen element */
Object.entries(screenElements).forEach(([screen, elements]) => {
  elements.forEach(element => {
    if (element) element.dataset.screen = screen;
  });
});

/* Switch between screens without reloading the app */
function navigateTo(screen) {
  if (!screenElements[screen]) return;

  document.querySelectorAll('[data-screen]').forEach(element => {
    element.hidden = element.dataset.screen !== screen;
  });

  /* Hide grid wrappers when none of their cards are visible */
  document.querySelectorAll('.lower-grid').forEach(grid => {
    const cards = [...grid.children].filter(card =>
      card.hasAttribute('data-screen')
    );

    grid.hidden = cards.length > 0 &&
      !cards.some(card => !card.hidden);
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    const isActive = link.getAttribute('href') === `#${screen}`;
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  /* Keep the URL in sync with the selected screen */
  if (location.hash !== `#${screen}`) {
    history.replaceState(null, '', `#${screen}`);
  }

  /* Resize charts when their screen becomes visible */
  requestAnimationFrame(() => {
    if (categoryChart) categoryChart.resize();
    if (trendChart) trendChart.resize();
  });

  document.querySelector('.main').scrollTop = 0;
}

/* Sidebar click handling */
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const screen = link.getAttribute('href').slice(1);
    navigateTo(screen);
  });
});

/* Open Insights from the money-personality card */
$('insightBtn').addEventListener('click', () => {
  navigateTo('insights');
});

/* Support browser back/forward hash navigation */
window.addEventListener('hashchange', () => {
  const requestedScreen = location.hash.slice(1);
  navigateTo(screenElements[requestedScreen] ? requestedScreen : 'dashboard');
});

/* Start the app */
renderWishes();
navigateTo(
  screenElements[location.hash.slice(1)]
    ? location.hash.slice(1)
    : 'dashboard'
);
refreshAll();