// ─── init ─────────────────────────────────────────────────────────────────────────────────────
buildHeader();
parent.postMessage({ pluginMessage: { type: 'load-styles' } }, '*');
