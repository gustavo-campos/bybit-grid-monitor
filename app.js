const $ = id => document.getElementById(id);
const nf = new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 4 });
const money = v => Number.isFinite(Number(v)) ? nf.format(Number(v)) : '—';
const pct = v => Number.isFinite(Number(v)) ? `${nf.format(Number(v) * 100)}%` : '—';
const cls = v => Number(v) > 0 ? 'pos' : Number(v) < 0 ? 'neg' : '';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function statusInfo(code) {
  const map = {
    OPEN: ['ABERTO', 'open'], READY: ['PRONTO', 'ready'],
    WAITING_REGIME: ['AGUARDANDO REGIME', 'waiting'],
    BLOCKED_CLUSTER: ['AGUARDANDO CAPITAL', 'blocked'],
    NO_DATA: ['SEM DADOS', 'waiting']
  };
  return map[code] || [String(code || '—'), 'waiting'];
}

function detail(label, value, extraClass = '') {
  return `<div class="detail"><span>${label}</span><strong class="${extraClass}">${value}</strong></div>`;
}

function renderGrid(prefix, d) {
  const [label, klass] = statusInfo(d.status);
  const status = $(`${prefix}Status`);
  status.textContent = label; status.className = `status ${klass}`;
  $(`${prefix}Price`).textContent = money(d.price);
  const leg = d.legs?.[0] || null;
  $(`${prefix}Target`).textContent = leg ? money(leg.target) : '—';
  let progress = 0, distance = '—', progressText = 'Sem perna aberta';
  if (leg && Number.isFinite(d.price) && Number.isFinite(leg.entry) && Number.isFinite(leg.target) && leg.target !== leg.entry) {
    progress = clamp((d.price - leg.entry) / (leg.target - leg.entry), 0, 1);
    const dist = (leg.target - d.price) / d.price;
    distance = `${dist > 0 ? 'Falta ' : 'Alvo cruzado '}${pct(Math.abs(dist))}`;
    progressText = `${nf.format(progress * 100)}% do caminho`;
  }
  $(`${prefix}Progress`).style.width = `${progress * 100}%`;
  $(`${prefix}ProgressText`).textContent = progressText;
  $(`${prefix}Distance`).textContent = distance;

  const r = d.regime || {}, g = d.grid || {};
  const pnlClass = cls(d.unrealized_pnl_usdt);
  const owner = d.cluster_owner ? d.cluster_owner : 'livre';
  let html = '';
  html += detail('Pernas abertas', String(d.open_legs ?? 0));
  html += detail('PnL flutuante', `${money(d.unrealized_pnl_usdt)} USDT`, pnlClass);
  html += detail('PnL realizado', `${money(d.realized_pnl_usdt)} USDT`, cls(d.realized_pnl_usdt));
  html += detail('Exposição', `${money(d.inventory_usdt)} USDT`);
  html += detail('ADX 4h', money(r.adx4h));
  html += detail('Filtro ADX', r.adx_limit != null ? `< ${money(r.adx_limit)}` : '—');
  html += detail('Grid mínimo', money(g.low));
  html += detail('Grid máximo', money(g.high));
  html += detail('Passo do grid', pct(g.step_pct));
  html += detail('Cluster rápido', owner);
  if (leg) {
    html += detail('Entrada', money(leg.entry));
    html += detail('Capital da perna', `${money(leg.cost_usdt)} USDT`);
  }
  $(`${prefix}Details`).innerHTML = html;
}

function renderHistory(rows) {
  const body = $('historyBody');
  $('historyCount').textContent = `${rows.length} ciclo${rows.length === 1 ? '' : 's'}`;
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5" class="empty">Nenhum ciclo fechado ainda.</td></tr>';
    return;
  }
  body.innerHTML = rows.map(x => {
    const when = x.exit_time ? new Date(x.exit_time).toLocaleString('pt-PT') : '—';
    return `<tr><td>${x.symbol}</td><td>${money(x.entry)}</td><td>${money(x.exit)}</td><td class="${cls(x.pnl_usdt)}">${money(x.pnl_usdt)} USDT</td><td>${when}</td></tr>`;
  }).join('');
}
function render(data) {
  $('equity').textContent = money(data.account?.equity_usdt);
  $('realized').textContent = money(data.account?.realized_grid_pnl_usdt);
  $('unrealized').textContent = money(data.account?.unrealized_grid_pnl_usdt);
  $('exposure').textContent = money(data.account?.spot_inventory_usdt);
  $('realized').className = cls(data.account?.realized_grid_pnl_usdt);
  $('unrealized').className = cls(data.account?.unrealized_grid_pnl_usdt);
  renderGrid('eth', data.grids?.ETHUSDT || {});
  renderGrid('btc', data.grids?.BTCUSDT || {});
  renderHistory(data.history || []);

  const ts = data.updated_at ? new Date(data.updated_at) : null;
  $('updatedAt').textContent = ts && !Number.isNaN(ts.getTime()) ? ts.toLocaleString('pt-PT') : '—';
  const ageMin = ts ? (Date.now() - ts.getTime()) / 60000 : Infinity;
  const h = $('health');
  if (ageMin <= 20) { h.textContent = '● Dados recentes'; h.className = 'health good'; }
  else if (ageMin <= 45) { h.textContent = `● ${Math.round(ageMin)} min sem atualização`; h.className = 'health warn'; }
  else { h.textContent = '● Dados desatualizados'; h.className = 'health bad'; }
}

async function refresh() {
  try {
    const r = await fetch(`data/grid-status.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    render(data); $('errorBox').hidden = true;
  } catch (e) {
    $('errorBox').textContent = `Não foi possível carregar o snapshot: ${e.message}`;
    $('errorBox').hidden = false;
  }
}

refresh();
setInterval(refresh, 30000);
