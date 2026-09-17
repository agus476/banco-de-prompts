function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

const icons = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2V5Zm0 12h15M8 7l3 3-3 3m5 0h3"/>',
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16"/>',
  chat: '<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V11a8 8 0 1 1 18 0Z"/><path d="M8 10h8m-8 4h5"/>',
  cursor: '<path d="m5 3 14 9-7 2-3 7L5 3Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
function icon(name: keyof typeof icons): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

export function renderSidebar(resources: { css: string; js: string; nonce: string; cspSource: string }): string {
  const { css, js, nonce, cspSource } = resources;
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${escapeAttribute(cspSource)}; script-src 'nonce-${escapeAttribute(nonce)}';">
<link rel="stylesheet" href="${escapeAttribute(css)}"><title>Banco de prompts</title></head>
<body><main>
  <header class="brand"><span class="brand-mark">${icon("book")}</span><div><span class="brand-name">Banco de prompts</span><span class="brand-caption">TU ESPACIO DE TRABAJO CON IA</span></div></header>
  <section class="intro" aria-labelledby="welcome-title"><span class="eyebrow">DEL CHAT A TU BITÁCORA</span><h1 id="welcome-title">Las ideas pasan.<br><span>Tu proceso queda.</span></h1><p>Guardá tus conversaciones con IA y construí una bitácora de lo que hiciste.</p></section>
  <section class="connection" aria-labelledby="connection-heading">
    <div class="section-row"><h2 id="connection-heading">Tu conexión</h2><span class="status" id="status" data-status="idle"><span class="status-dot"></span><span id="status-label">Sin comprobar</span></span></div>
    <p class="endpoint" id="endpoint">Cargando configuración…</p>
    <p class="connection-detail" id="connection-detail" role="status" aria-live="polite">Conectá tu espacio para empezar.</p>
    <div class="connection-actions"><button class="button secondary" data-command="banco.configureToken" id="token-button">Configurar token</button><button class="text-button" data-command="banco.checkConnection" id="check-button">Comprobar ${icon("arrow")}</button></div>
  </section>
  <section class="import-section" aria-labelledby="import-heading"><div class="section-row"><h2 id="import-heading">Traé tu conversación</h2><span class="section-note">ELEGÍ EL ORIGEN</span></div>
    <div class="sources">
      <button class="source-card" data-command="banco.importFromCodex" data-import><span class="source-icon mint">${icon("code")}</span><span class="source-copy"><strong>Codex</strong><span>Sesiones de tu equipo</span></span><span class="source-arrow">${icon("arrow")}</span></button>
      <button class="source-card" data-command="banco.importFromVSCode" data-import><span class="source-icon blue">${icon("chat")}</span><span class="source-copy"><strong>GitHub Copilot</strong><span>Conversaciones de VS Code</span></span><span class="source-arrow">${icon("arrow")}</span></button>
      <button class="source-card" data-command="banco.importFromCursor" data-import><span class="source-icon neutral">${icon("cursor")}</span><span class="source-copy"><strong>Cursor</strong><span>Transcripciones del agente</span></span><span class="source-arrow">${icon("arrow")}</span></button>
    </div>
    <button class="button manual" data-command="banco.saveInteraction" data-import>${icon("plus")} Guardar una interacción manual</button>
    <p class="hint" id="import-hint">Vos elegís el chat, los turnos y el proyecto.</p>
  </section>
  <section class="recent-section" aria-labelledby="recent-heading"><div class="section-row"><h2 id="recent-heading">Últimas importaciones</h2><button class="text-button muted" data-command="banco.clearHistory" id="clear-history" hidden>Limpiar</button></div>
    <div class="empty-state" id="empty-history"><span class="empty-icon">${icon("clock")}</span><strong>El comienzo de tu registro</strong><p>Tus próximas importaciones aparecerán acá, listas para volver a ellas.</p></div><ul id="recent-list" class="recent-list" aria-label="Importaciones recientes"></ul>
  </section>
  <footer><button class="button primary" data-command="banco.openApp">Abrir mi biblioteca ${icon("arrow")}</button><div class="footer-row"><span>${icon("shield")} Sin envíos automáticos</span><button class="text-button muted" data-command="banco.openSettings">Configuración</button></div></footer>
</main><script nonce="${escapeAttribute(nonce)}" src="${escapeAttribute(js)}"></script></body></html>`;
}
