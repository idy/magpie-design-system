import { toast, openDialog, initSelect, initTabs, initNav, detectWindowHost, initWindowChrome } from '../js/magpie.js';

const $ = (selector) => document.querySelector(selector);

initWindowChrome($('#titlebar'), detectWindowHost());

// Share the website preference while retaining the catalogue's existing choice.
const themeKey = 'mds-demo-theme';
let themePreference = 'system';
try {
  themePreference = localStorage.getItem('idy-theme') || localStorage.getItem(themeKey) || 'system';
} catch { /* Theme controls remain usable when storage is unavailable. */ }
$('#theme').value = ['light', 'dark'].includes(themePreference) ? themePreference : 'system';
window.IdySite.setTheme($('#theme').value);
for (const select of document.querySelectorAll('select.mds-select')) initSelect(select);
$('#theme').addEventListener('change', (event) => {
  window.IdySite.setTheme(event.target.value);
  try { localStorage.setItem(themeKey, event.target.value); } catch { /* Visit-only preference. */ }
  paintSwatches();
});

// Pages.
initNav($('#nav'), {
  onSelect(item) {
    for (const panel of document.querySelectorAll('[data-page-panel]')) panel.hidden = panel.dataset.pagePanel !== item.dataset.page;
    $('#crumb').textContent = item.textContent.trim();
    if (item.dataset.page === 'colour') paintSwatches();
  },
});

initTabs($('#demo-tabs'));

// Draft state in the action bar.
const saveState = $('#save-state');
function setDirty(dirty) {
  if (dirty) saveState.dataset.tone = 'warn';
  else delete saveState.dataset.tone;
  saveState.querySelector('.mds-dot').dataset.tone = dirty ? 'warn' : 'good';
  saveState.querySelector('span').textContent = dirty ? 'Unsaved changes' : 'All changes saved';
  $('#save').disabled = !dirty;
  $('#discard').disabled = !dirty;
}
$('#settings-form').addEventListener('input', () => setDirty(true));
$('#save').addEventListener('click', () => { setDirty(false); toast('Configuration saved and applied'); });
$('#validate').addEventListener('click', () => toast('Configuration is valid'));
$('#discard').addEventListener('click', async () => {
  if ((await openDialog($('#dialog'))) === 'discard') { setDirty(false); toast('Draft discarded'); }
});

// Feedback.
$('#show-toast').addEventListener('click', () => toast('YAML copied'));
$('#copy-code').addEventListener('click', () => toast('YAML copied'));
for (const button of [$('#pill-demo'), $('#demo-update')]) button.addEventListener('click', () => toast('Update checks are simulated on this page'));
$('#demo-connection').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const connected = button.getAttribute('aria-checked') !== 'true';
  button.setAttribute('aria-checked', String(connected));
  button.setAttribute('aria-label', connected ? 'Disconnect demo' : 'Connect demo');
  button.title = button.getAttribute('aria-label');
});
$('#show-dialog').addEventListener('click', async () => {
  const result = await openDialog($('#dialog'));
  $('#dialog-result').textContent = `Closed with “${result}”`;
});

// Colour swatches, read from the live theme.
const swatchSets = {
  Surfaces: ['canvas', 'sidebar', 'surface', 'raised', 'field', 'code'],
  Text: ['ink-strong', 'ink', 'ink-secondary', 'ink-soft', 'ink-subtle', 'muted', 'faint'],
  Accent: ['accent', 'accent-hover', 'accent-ink', 'selection'],
  Status: ['good', 'good-ink', 'warn', 'warn-detail', 'error', 'error-detail'],
  Lines: ['line', 'line-strong', 'switch-off', 'scroll-thumb'],
  Code: ['code-key', 'code-value', 'inline-code'],
};
function paintSwatches() {
  const root = $('#swatches');
  if (!root || root.closest('[hidden]')) return;
  const style = getComputedStyle(document.documentElement);
  root.replaceChildren(...Object.entries(swatchSets).map(([title, names]) => {
    const set = document.createElement('section');
    set.className = 'demo-swatch-set';
    set.innerHTML = `<h3>${title}</h3><div class="demo-swatch-list"></div>`;
    for (const name of names) {
      const value = style.getPropertyValue(`--mds-${name}`).trim();
      const row = document.createElement('div');
      row.className = 'demo-swatch';
      row.innerHTML = `<i style="background:var(--mds-${name})"></i><div><code>--mds-${name}</code><span>${value}</span></div>`;
      set.lastElementChild.append(row);
    }
    return set;
  }));
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintSwatches);

// Icon sprite catalogue.
fetch('../icons/icons.svg').then((response) => response.text()).then((text) => {
  const ids = [...text.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]);
  $('#icons').replaceChildren(...ids.map((id) => {
    const figure = document.createElement('figure');
    figure.innerHTML = `<svg class="mds-icon" aria-hidden="true"><use href="../icons/icons.svg#${id}"/></svg><figcaption>${id}</figcaption>`;
    return figure;
  }));
}).catch(() => { $('#icons').textContent = 'Serve the repository over HTTP to load the sprite.'; });
