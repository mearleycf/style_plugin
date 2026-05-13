// @ts-nocheck
import './bulk-editor';
import './variable-picker';
import { buildHeader } from './app';

// ─── init ─────────────────────────────────────────────────────────────────────────────────────
buildHeader();
parent.postMessage({ pluginMessage: { type: 'load-styles' } }, '*');
