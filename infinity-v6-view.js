// Autonomous BTC V6-inspired research monitor. Historical TV CSV != venue PnL.
(()=>{
 const root=document.getElementById('v6AutonomousPanel');if(!root)return;
 const byId=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dec=(n,p=2)=>n==null||!Number.isFinite(Number(n))?'—':new Intl.NumberFormat('pt-PT',{minimumFractionDigits:0,maximumFractionDigits:p}).format(Number(n));
 const money=n=>(n>0?'+':'')+dec(n)+' USDT';
 function render(data){
  const x=data?.research?.infinity_v6;
  if(!x||x.status!=='ok'){byId('v6Status').textContent='SEM DADOS';byId('v6Note').textContent='Modelo próprio sem snapshot válido. Nenhuma ordem é autorizada.';return;}
  const h=x.original_csv||{},m=x.model||{},s=x.scanner||{},held=m.holdout_match||{},simulation=m.holdout_147||{};
  byId('v6Status').textContent=x.activation_gate?.status==='BLOCKED'?'VALIDAÇÃO REPROVADA · SEM ORDENS':'PESQUISA · SEM ORDENS';
  byId('v6HistoricalCount').textContent=dec(h.completed_trades,0);
  const hist=h.months||[];
  const wins=hist.reduce((sum,v)=>sum+Number(v.wins||0),0);
  byId('v6HistoricalWR').textContent=h.completed_trades?dec(wins/h.completed_trades*100)+'%':'—';
  byId('v6HistoricalProfit').textContent=money(hist.reduce((sum,v)=>sum+Number(v.net_usdt||0),0));
  byId('v6HoldoutMatch').textContent=dec(held.precision_pct)+'%';
  byId('v6IndependentPF').textContent=dec(simulation.profit_factor,3);
  byId('v6IndependentPnL').textContent=money(simulation.net_usdt);
  const updated=new Date(s.updated_utc||'');
  const valid=!Number.isNaN(updated.valueOf())&&Date.now()-updated.getTime()<40*60*1000;
  byId('v6LiveSignal').textContent=!valid?'Dados do scanner desatualizados':s.candidate_passed?'HIPÓTESE '+(s.candidate_side||'')+' · NÃO OPERAR':'Sem hipótese válida no último candle';
  byId('v6ScannerTime').textContent=valid?updated.toLocaleString('pt-PT',{timeZone:'Europe/Lisbon',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
  byId('v6Note').textContent='Modelo próprio, independente do TradingView e sem ordens DEMO/LIVE. Validação: '+(held.matched_direction_within_15m??0)+' coincidências de '+(held.predicted_signals??0)+' sinais. '+(x.activation_gate?.status==='BLOCKED'?'Entrada DEMO BLOQUEADA: '+(x.activation_gate?.blockers||[]).slice(0,3).join(' · '):'Em avaliação.');
  byId('v6Monthly').innerHTML=hist.map(z=>'<tr><td>'+esc(z.month)+'</td><td>'+dec(z.trades,0)+'</td><td>'+dec(z.win_rate_pct)+'%</td><td style="text-align:right">'+money(z.net_usdt)+'</td></tr>').join('');
 }
 async function refresh(){
  try{const r=await fetch('./data/grid-status.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('snapshot');render(await r.json());}
  catch{byId('v6Status').textContent='SEM DADOS';byId('v6Note').textContent='Falha ao obter dados; nenhuma ordem está autorizada.';}
 }
 refresh();setInterval(refresh,30000);
})();