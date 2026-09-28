(() => {
  const TARGET_ID = 'futuresStrategies';
  const FALLBACK_ID = 'xtraders-pc2m-context-v2-fallback';

  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[c]));

  function realXtradersPresent() {
    const data = window.lastData;
    const strategies = data?.system?.strategies || [];
    return strategies.some(s => /xtraders|pc2m/i.test(`${s.id || ''} ${s.label || ''}`));
  }

  function fallbackRow() {
    const row = document.createElement('div');
    row.className = 'strategy-row xtraders-research-row';
    row.id = FALLBACK_ID;
    row.dataset.catalogOnly = 'true';
    row.innerHTML = `
      <div class="strategy-main">
        <div class="strategy-name">XTRADERS PC2m — Context V2</div>
        <div class="strategy-meta">
          <span class="health-dot xtr-research" title="Pesquisa / monitor DEMO"></span>
          <span class="strategy-chip xtr-monitor">MONITOR</span>
          <span class="strategy-chip">XAU</span>
          <span class="strategy-chip">CL</span>
          <span class="strategy-chip">QQQ</span>
          <span class="strategy-chip xtr-context">CONTEXT V2</span>
          <span class="strategy-chip xtr-oos">OOS COLETANDO</span>
          <span class="strategy-chip">MGMT TELEMETRY</span>
        </div>
      </div>
      <div class="strategy-stat"><span>Ops</span><strong>—</strong></div>
      <div class="strategy-stat"><span>W / L</span><strong>—</strong></div>
      <div class="strategy-stat"><span>PnL</span><strong>—</strong></div>`;
    row.title = 'Fallback de catálogo: a estratégia XTRADERS está em pesquisa/DEMO, mas o publisher operacional ainda não a inclui no snapshot. Nenhum PnL ou health é inferido.';
    return row;
  }

  function ensureVisible() {
    const box = document.getElementById(TARGET_ID);
    if (!box) return;

    const current = document.getElementById(FALLBACK_ID);
    if (realXtradersPresent()) {
      if (current) current.remove();
      return;
    }

    if (!current) box.appendChild(fallbackRow());
  }

  function installObserver() {
    const box = document.getElementById(TARGET_ID);
    if (!box) return;
    const observer = new MutationObserver(() => {
      queueMicrotask(ensureVisible);
    });
    observer.observe(box, { childList: true });
    ensureVisible();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installObserver, { once: true });
  } else {
    installObserver();
  }

  setInterval(ensureVisible, 5000);
})();
