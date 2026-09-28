(() => {
  const TARGET_ID = 'futuresStrategies';
  const FALLBACK_ID = 'xtraders-pc2m-context-v2-fallback';

  function installStyle() {
    if (document.getElementById('xtraders-overlay-style')) return;
    const style = document.createElement('style');
    style.id = 'xtraders-overlay-style';
    style.textContent = `
      .xtraders-research-row{border-color:rgba(138,164,255,.18);background:linear-gradient(135deg,rgba(77,99,190,.12),rgba(4,8,14,.22))}
      .health-dot.xtr-research{background:#8aa4ff;color:#8aa4ff}
      .strategy-chip.xtr-monitor{color:#c9d5ff;border-color:rgba(138,164,255,.28);background:rgba(77,99,190,.18)}
      .strategy-chip.xtr-context{color:#c4b5fd;border-color:rgba(167,139,250,.25);background:rgba(76,29,149,.16)}
      .strategy-chip.xtr-oos{color:#fde68a;border-color:rgba(251,191,36,.22);background:rgba(92,68,12,.20)}
    `;
    document.head.appendChild(style);
  }

  function snapshotHasRealXtraders() {
    const labels = Array.from(document.querySelectorAll(`#${TARGET_ID} .strategy-name`));
    return labels.some(el => /xtraders|pc2m/i.test(el.textContent || '') && el.closest('.strategy-row')?.id !== FALLBACK_ID);
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
    row.title = 'Fallback visual: XTRADERS está em pesquisa/DEMO, mas o publisher operacional ainda não envia esta estratégia no snapshot. Nenhum PnL, operação ou health é inferido.';
    return row;
  }

  function ensureVisible() {
    const box = document.getElementById(TARGET_ID);
    if (!box) return;
    const current = document.getElementById(FALLBACK_ID);

    if (snapshotHasRealXtraders()) {
      if (current) current.remove();
      return;
    }
    if (!current) box.appendChild(fallbackRow());
  }

  function installObserver() {
    installStyle();
    const box = document.getElementById(TARGET_ID);
    if (!box) return;
    const observer = new MutationObserver(() => queueMicrotask(ensureVisible));
    observer.observe(box, {childList:true});
    ensureVisible();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installObserver, {once:true});
  else installObserver();

  setInterval(ensureVisible, 5000);
})();
