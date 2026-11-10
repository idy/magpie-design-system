import { initSelect } from '../js/magpie.js';

const fixture = document.querySelector('#fixture');
const results = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
function test(name, run) {
  try { run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
const icon = name => `<svg class="mds-icon" aria-hidden="true"><use href="../icons/icons.svg#${name}"/></svg>`;
const pill = (classes = 'mds-pill--responsive') => `<button type="button" class="mds-pill ${classes}" aria-label="Check for app updates">${icon('up')}<span class="mds-pill-label" aria-live="polite">Check for updates</span></button>`;
function mount() {
  fixture.innerHTML = `<div class="mds-titlebar-actions"><button type="button" class="mds-switch" role="switch" aria-checked="false" aria-label="Connect"><span class="mds-switch-track" aria-hidden="true"></span></button>${pill()}<button type="button" class="mds-icon-button" aria-label="Refresh">${icon('reload')}</button></div>`;
  return { toggle: fixture.querySelector('.mds-switch'), update: fixture.querySelector('.mds-pill'), refresh: fixture.querySelector('.mds-icon-button') };
}
function contrast(a, b) {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('Controlled button switches retain native disabled and focus behavior', () => {
  const { toggle } = mount();
  let clicks = 0;
  toggle.addEventListener('click', () => clicks++);
  toggle.focus();
  assert(document.activeElement === toggle, 'Switch button cannot receive keyboard focus');
  toggle.disabled = true; toggle.click();
  assert(clicks === 0, 'Disabled switch issued an action');
  toggle.disabled = false; toggle.click();
  assert(clicks === 1 && toggle.getAttribute('aria-checked') === 'false', 'CSS switch must leave state management to the application');
});

test('Button and checkbox switches share legible off/on thumbs in both themes', () => {
  for (const theme of ['light', 'dark']) {
    const { toggle } = mount();
    fixture.dataset.theme = theme;
    fixture.insertAdjacentHTML('beforeend', '<label class="mds-switch"><input type="checkbox"><span class="mds-switch-track"></span></label>');
    const checkbox = fixture.querySelector('input');
    for (const checked of [false, true]) {
      toggle.setAttribute('aria-checked', String(checked)); checkbox.checked = checked;
      for (const track of fixture.querySelectorAll('.mds-switch-track')) {
        track.style.transition = 'none';
        const thumb = getComputedStyle(track, '::after');
        assert(contrast(thumb.backgroundColor, getComputedStyle(track).backgroundColor) >= 3, `${theme}/${checked}: thumb is lost against its track`);
      }
      const tracks = fixture.querySelectorAll('.mds-switch-track');
      assert(getComputedStyle(tracks[0]).backgroundColor === getComputedStyle(tracks[1]).backgroundColor, 'Button and checkbox disagree on state');
    }
  }
  delete fixture.dataset.theme;
});

test('Explicit icon pills keep square geometry and normal icon scale', () => {
  fixture.innerHTML = pill('mds-pill--icon');
  const button = fixture.querySelector('button'), bounds = button.getBoundingClientRect();
  assert(Math.abs(bounds.width - bounds.height) < 1, 'Icon action became a vertical capsule');
  assert(fixture.querySelector('svg').getBoundingClientRect().width === 16, 'Toolbar icon scale differs from refresh');
  assert(fixture.querySelector('.mds-pill-label').getBoundingClientRect().width <= 1, 'Icon-only label is still painted');
  assert(button.getAttribute('aria-label'), 'Icon action lost its accessible name');
});

test('Responsive pills preserve labels on desktop and square targets in narrow windows', () => {
  const { update } = mount();
  const bounds = update.getBoundingClientRect(), label = update.querySelector('.mds-pill-label').getBoundingClientRect();
  if (matchMedia('(max-width:640px)').matches) {
    assert(Math.abs(bounds.width - bounds.height) < 1, 'Compact action is not square');
    assert(label.width <= 1, 'Compact action still paints its long label');
  } else {
    assert(label.width > 1 && bounds.width > bounds.height, 'Desktop action lost its readable label');
  }
});

test('Compact busy/error states keep the same target and live status', () => {
  const { update } = mount();
  const label = update.querySelector('.mds-pill-label');
  const initial = update.getBoundingClientRect();
  for (const phase of ['busy', 'error']) {
    update.setAttribute('aria-busy', String(phase === 'busy'));
    update.dataset.tone = phase === 'error' ? 'error' : 'accent';
    label.textContent = phase === 'busy' ? 'Downloading 100%' : 'Retry update';
    const bounds = update.getBoundingClientRect();
    if (matchMedia('(max-width:640px)').matches) assert(Math.abs(bounds.width - initial.width) < 1 && Math.abs(bounds.height - initial.height) < 1, `${phase}: target shifted`);
    assert(label.getAttribute('aria-live') === 'polite', 'Status announcement was removed');
  }
});

test('Neighboring toolbar targets stay separate', () => {
  const { toggle, update, refresh } = mount();
  const t = toggle.getBoundingClientRect(), u = update.getBoundingClientRect(), r = refresh.getBoundingClientRect();
  assert(u.left - t.right >= 8 && r.left - u.right >= 8, 'Neighboring target gaps collapsed');
});

test('Coarse-pointer toolbar controls provide at least 44px targets', () => {
  if (!matchMedia('(pointer:coarse)').matches) return;
  const controls = Object.values(mount());
  fixture.insertAdjacentHTML('beforeend', pill('mds-pill--icon'));
  controls.push(fixture.lastElementChild);
  for (const control of controls) {
    const bounds = control.getBoundingClientRect();
    assert(bounds.width >= 44 && bounds.height >= 44, `${control.className}: undersized touch target`);
  }
});

initSelect(document.querySelector('#invalid-text'));
const failed = results.filter(result => !result.passed);
window.toolbarTestResults = { total: results.length, failed: failed.length, results, viewport: [innerWidth, innerHeight], coarse: matchMedia('(pointer:coarse)').matches };
document.querySelector('#results').textContent = results.map(result => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`).join('\n') + `\n\n${results.length - failed.length}/${results.length} passed`;
document.title = `${failed.length ? 'FAIL' : 'PASS'}: toolbar browser tests`;
