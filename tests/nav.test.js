import { initNav } from '../js/magpie.js';

const fixture = document.querySelector('#fixture');
const results = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function mount(onSelect) {
  fixture.innerHTML = `<nav class="mds-nav" aria-label="Test navigation">
    <div class="mds-nav-branch">
      <button class="mds-nav-item mds-nav-parent" aria-expanded="false" aria-controls="children">Settings</button>
      <div class="mds-subnav" id="children" hidden>
        <button class="mds-nav-item" id="general" aria-current="page">General</button>
        <button class="mds-nav-item" id="network">Network and sharing</button>
      </div>
    </div>
    <button class="mds-nav-item" id="about">About</button>
  </nav>`;
  const nav = fixture.querySelector('nav');
  const api = initNav(nav, { onSelect });
  return { nav, api, parent: nav.querySelector('.mds-nav-parent'), panel: nav.querySelector('.mds-subnav'), general: nav.querySelector('#general'), network: nav.querySelector('#network'), about: nav.querySelector('#about') };
}
async function test(name, run) {
  try { await run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
  finally { fixture.replaceChildren(); }
}

await test('The selected descendant opens its parent and only the leaf is current', () => {
  const { parent, panel, nav } = mount();
  assert(parent.getAttribute('aria-expanded') === 'true' && !panel.hidden, 'Current path is hidden');
  assert(parent.hasAttribute('data-active'), 'Parent active surface is missing');
  assert(!parent.hasAttribute('aria-current'), 'Parent incorrectly claims to be the current page');
  assert(nav.querySelectorAll('[aria-current="page"]').length === 1, 'Current page is ambiguous');
});

await test('Parent disclosure toggles without navigating or clearing selection', async () => {
  let calls = 0;
  const { parent, panel, general } = mount(() => calls++);
  parent.click(); await tick();
  assert(panel.hidden && parent.getAttribute('aria-expanded') === 'false', 'Collapse failed');
  assert(general.getAttribute('aria-current') === 'page' && parent.hasAttribute('data-active'), 'Collapse lost the current page');
  parent.click(); await tick();
  assert(!panel.hidden && calls === 0, 'Disclosure navigated or failed to expand');
});

await test('Selecting root and nested leaves updates the entire active path', async () => {
  const { api, parent, panel, network, about } = mount();
  await api.select(about);
  assert(about.getAttribute('aria-current') === 'page' && !parent.hasAttribute('data-active'), 'Root selection left the parent active');
  parent.click();
  assert(panel.hidden, 'Test parent did not collapse');
  await api.select(network);
  assert(network.getAttribute('aria-current') === 'page' && !about.hasAttribute('aria-current'), 'Nested leaf was not selected');
  assert(!panel.hidden && parent.hasAttribute('data-active'), 'Selecting a descendant did not reveal its path');
});

await test('A rejected navigation keeps the previous page and parent state', async () => {
  const { api, parent, general, network, about } = mount(async () => false);
  assert(await api.select(network) === false, 'Vetoed nested navigation succeeded');
  assert(await api.select(about) === false, 'Vetoed root navigation succeeded');
  assert(general.getAttribute('aria-current') === 'page' && parent.hasAttribute('data-active'), 'Veto discarded the original active path');
});

await test('Parents and disabled or foreign items cannot be selected as pages', async () => {
  const { api, parent, network } = mount();
  network.disabled = true;
  assert(await api.select(parent) === false, 'Parent was treated as a page');
  assert(await api.select(network) === false, 'Disabled page was selected');
  assert(await api.select(document.createElement('button')) === false, 'Foreign item was accepted');
});

const failed = results.filter((result) => !result.passed);
window.navTestResults = { total: results.length, failed: failed.length, results };
document.querySelector('#results').textContent = results.map((result) => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`).join('\n') + `\n\n${results.length - failed.length}/${results.length} passed`;
document.title = `${failed.length ? 'FAIL' : 'PASS'}: nested navigation browser tests`;
