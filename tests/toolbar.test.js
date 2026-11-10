import { initSelect } from '../js/magpie.js';

const fixture = document.querySelector('#fixture');
const caretSource = await fetch('../icons/caret-down.svg').then(response => response.text());
const spriteSource = await fetch('../icons/icons.svg').then(response => response.text());
const sprite = document.importNode(new DOMParser().parseFromString(spriteSource, 'image/svg+xml').documentElement, true);
sprite.style.display = 'none'; sprite.setAttribute('aria-hidden', 'true'); document.body.prepend(sprite);
const results = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
function test(name, run) {
  try { run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}
const icon = name => `<svg class="mds-icon" aria-hidden="true"><use href="#${name}"/></svg>`;
const pill = (classes = 'mds-pill--responsive') => `<button type="button" class="mds-pill ${classes}" aria-label="Check for app updates">${icon('up')}<span class="mds-pill-label" aria-live="polite">Check for updates</span></button>`;
function mount() {
  fixture.innerHTML = `<div class="mds-titlebar-actions mds-titlebar-actions--balanced"><button type="button" class="mds-switch" role="switch" aria-checked="false" aria-label="Connect"><span class="mds-switch-track" aria-hidden="true"></span></button>${pill()}<button type="button" class="mds-icon-button mds-icon-button--compact" aria-label="Refresh">${icon('reload')}</button></div>`;
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

test('Responsive pills preserve desktop labels and compact faces in narrow windows', () => {
  const { update } = mount();
  const bounds = update.getBoundingClientRect(), label = update.querySelector('.mds-pill-label').getBoundingClientRect();
  if (matchMedia('(max-width:640px)').matches) {
    const face = getComputedStyle(update, '::before');
    assert(parseFloat(face.height) === 20 && bounds.width >= parseFloat(face.width), 'Compact face escaped its native target');
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

test('Compact action faces match the switch track without shrinking click targets', () => {
  const { toggle, update, refresh } = mount();
  const trackHeight = toggle.querySelector('.mds-switch-track').getBoundingClientRect().height;
  for (const button of [update, refresh]) {
    const face = getComputedStyle(button, '::before');
    assert(parseFloat(face.height) === trackHeight, 'Visible action height differs from the switch track');
    assert(face.pointerEvents === 'none', 'Decorative face intercepts the button action');
    assert(button.getBoundingClientRect().height >= trackHeight, 'Native click target is smaller than its face');
    assert(getComputedStyle(button).backgroundColor === 'rgba(0, 0, 0, 0)', 'Outer click target is painted as a tall button');
  }
});

test('Neighboring toolbar targets stay separate', () => {
  const { toggle, update, refresh } = mount();
  const t = toggle.getBoundingClientRect(), u = update.getBoundingClientRect(), r = refresh.getBoundingClientRect();
  assert(u.left - t.right >= -0.5 && r.left - u.right >= -0.5, 'Expanded click targets overlap');
});

function faceBounds(button) {
  const rect = button.getBoundingClientRect(), width = parseFloat(getComputedStyle(button, '::before').width);
  return { left: rect.left + (rect.width - width) / 2, right: rect.right - (rect.width - width) / 2 };
}

function assertEqualGaps(anchors, message) {
  const gaps = anchors.slice(1).map((anchor, index) => anchor.left - anchors[index].right);
  assert(gaps.every(gap => Math.abs(gap - 8) < 1), `${message}: visual gaps ${gaps.join(', ')}`);
}

test('Balanced action rows give switch, update face and refresh ink equal visible gaps', () => {
  const { toggle, update, refresh } = mount();
  const track = toggle.querySelector('.mds-switch-track').getBoundingClientRect();
  const ink = refresh.querySelector('use').getBoundingClientRect();
  assert(ink.width > 0, 'Refresh glyph did not load');
  assertEqualGaps([track, faceBounds(update), ink], 'Compact toolbar');
  update.hidden = true;
  assertEqualGaps([toggle.querySelector('.mds-switch-track').getBoundingClientRect(), refresh.querySelector('use').getBoundingClientRect()], 'Hidden update');
});

test('Every visible interval stays equal across status, mode and update states', () => {
  fixture.innerHTML = `<div class="mds-titlebar-actions mds-titlebar-actions--balanced"><span class="mds-status"><i class="mds-dot"></i><span>Preview</span></span><span class="mds-action-slot--select"><label class="mds-visually-hidden" for="mode-spacing">Mode</label><select id="mode-spacing" class="mds-select mds-select--text"><option>Rule-based</option><option>Global (Kill-Switch)</option><option>全局（Kill-Switch）</option></select></span><span class="mds-action-slot--switch"><button class="mds-switch" type="button" role="switch" aria-checked="false" aria-label="Connect"><span class="mds-switch-track"></span></button></span>${pill()}<button class="mds-icon-button mds-icon-button--compact" aria-label="Refresh">${icon('reload')}</button></div>`;
  const row = fixture.firstElementChild, source = row.querySelector('select'), control = initSelect(source);
  const update = row.querySelector('.mds-pill'), refresh = row.querySelector('.mds-icon-button');
  const status = row.querySelector('.mds-status');
  if (matchMedia('(max-width:860px)').matches) status.querySelector('span').className = 'mds-visually-hidden';
  const probe = new DOMParser().parseFromString(caretSource, 'image/svg+xml').documentElement;
  const node = document.importNode(probe, true); node.setAttribute('width', '14'); node.setAttribute('height', '14');
  node.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none'; fixture.append(node);
  const caretInk = node.querySelector('path').getBoundingClientRect();
  const caretInset = node.getBoundingClientRect().right - caretInk.right;
  try {
    for (let selected = 0; selected < source.options.length; selected++) {
      source.selectedIndex = selected; control.refresh();
      for (const state of ['idle', 'busy', 'error', 'hidden']) {
        update.hidden = state === 'hidden'; update.setAttribute('aria-busy', String(state === 'busy')); update.dataset.tone = state === 'error' ? 'error' : 'accent';
        update.querySelector('.mds-pill-label').textContent = state === 'busy' ? 'Downloading 100%' : state === 'error' ? 'Retry update' : 'Check for updates';
        const trigger = control.trigger, rect = trigger.getBoundingClientRect(), style = getComputedStyle(trigger);
        const text = document.createRange(); text.selectNodeContents(trigger);
        const placement = Number(style.backgroundPositionX.match(/-\s*([\d.]+)px/)?.[1] ?? 9);
        const textBounds = text.getBoundingClientRect();
        const mode = { left: textBounds.left, right: rect.right - parseFloat(style.borderRightWidth) - placement - caretInset };
        if (trigger.scrollWidth <= trigger.clientWidth + 1) {
          const internalGap = mode.right - caretInk.width - textBounds.right;
          assert(Math.abs(internalGap - 8) < 0.25, `${source.value}/${state}: text-to-caret gap ${internalGap}`);
        }
        const anchors = [status.getBoundingClientRect(), mode, row.querySelector('.mds-switch-track').getBoundingClientRect()];
        if (!update.hidden) anchors.push(faceBounds(update));
        anchors.push(refresh.querySelector('use').getBoundingClientRect());
        assertEqualGaps(anchors, `${source.value}/${state}`);
        const targets = [...row.querySelectorAll('button')].filter(button => button.getClientRects().length).map(button => button.getBoundingClientRect()).sort((a, b) => a.left - b.left);
        for (let index = 1; index < targets.length; index++) assert(targets[index].left >= targets[index - 1].right - 0.5, 'Expanded targets overlap');
      }
    }
  } finally { control.destroy(); }
});

test('Dense titlebar targets stay at least 24px wide and 44px tall on coarse pointers', () => {
  if (!matchMedia('(pointer:coarse)').matches) return;
  for (const control of Object.values(mount())) {
    const bounds = control.getBoundingClientRect();
    assert(bounds.width >= 24 && bounds.height >= 44, `${control.className}: undersized dense target`);
  }
  fixture.insertAdjacentHTML('beforeend', pill('mds-pill--icon'));
  const standalone = fixture.lastElementChild.getBoundingClientRect();
  assert(standalone.width >= 44 && standalone.height >= 44, 'Standalone targets must retain their original size');
});

initSelect(document.querySelector('#invalid-text'));
const failed = results.filter(result => !result.passed);
window.toolbarTestResults = { total: results.length, failed: failed.length, results, viewport: [innerWidth, innerHeight], coarse: matchMedia('(pointer:coarse)').matches };
document.querySelector('#results').textContent = results.map(result => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`).join('\n') + `\n\n${results.length - failed.length}/${results.length} passed`;
document.title = `${failed.length ? 'FAIL' : 'PASS'}: toolbar browser tests`;
