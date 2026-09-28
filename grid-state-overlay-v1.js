(() => {
  const GRID_STRATEGIES = {
    eth: 'V44_ETH_VAULT_GRID',
    btc: 'V44_BTC_VAULT_GRID'
  };

  const fmtDate = value => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-PT');
  };

  function strategy(data, id) {
    return (data?.system?.strategies || []).find(s => s.id === id && (s.mode || 'demo') === 'demo');
  }

  function isDisabled(s) {
    return Boolean(s) && (!s.cron_enabled || s.health === 'disabled');
  }

  function forceDisabledCard(prefix, s, grid) {
    const status = document.getElementById(`${prefix}Status`);
    if (status) {
      status.textContent = 'DESATIVADO';
      status.className = 'status blocked';
      status.title = 'Estratégia desativada: cron OFF e sem novas execuções.';
    }

    const price = document.getElementById(`${prefix}Price`);
    const target = document.getElementById(`${prefix}Target`);
    const progress = document.getElementById(`${prefix}Progress`);
    const progressText = document.getElementById(`${prefix}ProgressText`);
    const distance = document.getElementById(`${prefix}Distance`);
    const details = document.getElementById(`${prefix}Details`);

    if (price) price.textContent = '—';
    if (target) target.textContent = '—';
    if (progress) progress.style.width = '0%';
    if (progressText) progressText.textContent = 'Grid desativado';
    if (distance) distance.textContent = 'sem execução';

    if (details) {
      const last = s?.last_update || grid?.source_ts;
      details.innerHTML = [
        ['Estado', 'DESATIVADO'],
        ['Cron', 'OFF'],
        ['Novas ordens', 'BLOQUEADAS'],
        ['Último snapshot', fmtDate(last)]
      ].map(([label, value]) => `<div class="detail"><span>${label}</span><strong>${value}</strong></div>`).join('');
    }
  }

  function updateHeading(allDisabled) {
    const section = document.getElementById('gridSection');
    if (!section) return;
    const heading = section.querySelector('.section-title h2');
    const note = section.querySelector('.section-note');
    if (heading) heading.textContent = 'Spot Grids';
    if (note) note.textContent = allDisabled
      ? 'Vault Grid desativado · snapshots anteriores são apenas históricos'
      : 'estado operacional e histórico';
  }

  function apply(data) {
    const states = Object.entries(GRID_STRATEGIES).map(([prefix, id]) => {
      const s = strategy(data, id);
      const grid = data?.grids?.[prefix === 'eth' ? 'ETHUSDT' : 'BTCUSDT'] || {};
      if (isDisabled(s)) forceDisabledCard(prefix, s, grid);
      return isDisabled(s);
    });
    updateHeading(states.length > 0 && states.every(Boolean));
  }

  async function sync() {
    try {
      const r = await fetch(`data/grid-status.json?gridstate=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return;
      apply(await r.json());
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sync, { once: true });
  } else {
    sync();
  }

  const section = document.getElementById('gridSection');
  if (section) {
    new MutationObserver(() => queueMicrotask(sync)).observe(section, { childList: true, subtree: true });
  }
  setInterval(sync, 5000);
})();
