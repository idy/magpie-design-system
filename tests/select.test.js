import { initSelect } from '../js/magpie.js';

const fixture = document.querySelector('#fixture');
const results = [];
let controls = [];
const assert = (condition, detail) => { if (!condition) throw new Error(detail); };
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const key = (trigger, value) => trigger.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));

function mount(markup = '<option value="a">Apple</option><option value="b" disabled>Banana</option><option value="c">Cherry</option>', attributes = '') {
  fixture.innerHTML = `<form><label for="fruit">Fruit</label><select class="mds-select" id="fruit" name="fruit" ${attributes}>${markup}</select><button type="button" id="after">After</button></form>`;
  const select = fixture.querySelector('select');
  const api = initSelect(select);
  controls.push(api);
  return { select, api, trigger: api.trigger, menu: document.getElementById(api.trigger.getAttribute('aria-controls')), form: fixture.querySelector('form') };
}
async function test(name, run) {
  try { await run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
  finally {
    for (const control of controls) control.destroy();
    controls = [];
    fixture.replaceChildren();
  }
}

await test('Pointer selection updates the native value and emits one input/change pair', () => {
  const { select, trigger, menu, form } = mount();
  let input = 0; let change = 0;
  form.addEventListener('input', () => input++);
  form.addEventListener('change', () => change++);
  select.showPicker = () => { throw new Error('Native picker must never open'); };
  trigger.click();
  assert(trigger.getAttribute('aria-expanded') === 'true', 'Menu did not open');
  assert(menu.querySelectorAll('[role="option"]').length === 3, 'Options missing');
  menu.querySelector('[data-index="2"]').click();
  assert(select.value === 'c', 'Native value did not change');
  assert(trigger.textContent === 'Cherry', 'Trigger label did not update');
  assert(input === 1 && change === 1, 'Wrong event count');
  assert(menu.hidden && trigger.getAttribute('aria-expanded') === 'false', 'Menu did not close');
  assert(new FormData(form).get('fruit') === 'c', 'Form data did not contain the selection');
});

await test('Arrow keys skip disabled options and Escape cancels without changing the value', () => {
  const { select, trigger } = mount();
  key(trigger, 'ArrowDown');
  key(trigger, 'ArrowDown');
  assert(trigger.getAttribute('aria-activedescendant').endsWith('-2'), 'Disabled option was not skipped');
  key(trigger, 'Escape');
  assert(select.value === 'a', 'Escape committed an unconfirmed selection');
  assert(!trigger.hasAttribute('aria-activedescendant'), 'Closed trigger references a hidden option');
});

await test('Home, End, Enter and Tab commit the intended selection', () => {
  const { select, trigger } = mount();
  key(trigger, 'End'); key(trigger, 'Enter');
  assert(select.value === 'c', 'End/Enter failed');
  key(trigger, 'Home'); key(trigger, 'Tab');
  assert(select.value === 'a', 'Home/Tab failed');
  assert(trigger.getAttribute('aria-expanded') === 'false', 'Tab left the menu open');
});

await test('Typeahead cycles matching labels and preserves multi-character prefixes', () => {
  const { select, trigger } = mount('<option value="a">Apple</option><option value="b">Banana</option><option value="blue">Blueberry</option>');
  key(trigger, 'b');
  assert(select.value === 'b', 'First matching label was not selected');
  key(trigger, 'b');
  assert(select.value === 'blue', 'Repeated letters did not cycle matches');
  // Start a fresh search after opening the menu.
  trigger.click(); key(trigger, 'Escape'); trigger.click();
  key(trigger, 'b'); key(trigger, 'l'); key(trigger, 'Enter');
  assert(select.value === 'blue', 'Multi-character search failed');
});

await test('Clicking outside closes the menu and preserves its value', () => {
  const { select, trigger, menu } = mount();
  trigger.click(); key(trigger, 'End');
  document.querySelector('#after').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  assert(menu.hidden && select.value === 'a', 'Outside click committed or kept the menu open');
});

await test('Disabled controls and disabled option groups cannot be selected', async () => {
  const { select, trigger, api, menu } = mount('<optgroup label="Locked" disabled><option value="a">Apple</option></optgroup><optgroup label="Available"><option value="c">Cherry</option></optgroup>');
  select.disabled = true; await tick();
  assert(trigger.disabled, 'Disabled state was not observed');
  api.open(); assert(menu.hidden, 'Disabled menu opened');
  select.disabled = false; await tick();
  trigger.click(); key(trigger, 'Enter');
  assert(select.value === 'c', 'Disabled group was not skipped');
});

await test('Form reset restores both the native value and visible label', async () => {
  const { select, trigger, form } = mount();
  key(trigger, 'End'); key(trigger, 'Enter');
  form.reset(); await tick();
  assert(select.value === 'a' && trigger.textContent === 'Apple', 'Reset did not synchronise the display');
});

await test('Required validation focuses the visible control and clears after selection', () => {
  const { select, trigger, form } = mount('<option value="" disabled selected>Choose a fruit</option><option value="a">Apple</option>', 'required');
  assert(!form.reportValidity(), 'Required value passed validation');
  assert(document.activeElement === trigger, 'Invalid hidden select could not redirect focus');
  assert(trigger.getAttribute('aria-invalid') === 'true', 'Invalid state is missing');
  key(trigger, 'ArrowDown'); key(trigger, 'Enter');
  assert(select.value === 'a' && form.checkValidity(), 'Valid selection did not satisfy the form');
  assert(trigger.getAttribute('aria-invalid') !== 'true', 'Invalid state was not cleared');
});

await test('Programmatic updates, option labels and dynamic disabled states refresh', async () => {
  const { select, trigger, api } = mount();
  select.value = 'c'; api.refresh();
  assert(trigger.textContent === 'Cherry', 'Programmatic value did not refresh');
  select.options[2].label = 'Cherry updated'; await tick();
  assert(trigger.textContent === 'Cherry updated', 'Option label was not observed');
  const added = new Option('<img src=x onerror=alert(1)>', 'literal');
  select.append(added); await tick();
  select.value = 'literal'; api.refresh();
  assert(trigger.textContent === added.label && !trigger.querySelector('img'), 'Option label was interpreted as HTML');
});

await test('Menus escape clipped groups and flip inside the viewport', () => {
  const { trigger, menu, api } = mount();
  const wrapper = trigger.parentElement;
  const clip = document.createElement('div');
  clip.className = 'mds-group';
  clip.style.cssText = 'position:fixed;right:8px;bottom:8px;width:200px;height:38px;overflow:hidden';
  wrapper.before(clip); clip.append(wrapper);
  api.open();
  const anchor = trigger.getBoundingClientRect();
  const bounds = menu.getBoundingClientRect();
  assert(bounds.bottom <= anchor.top && bounds.top >= 0, 'Menu did not flip above the trigger');
  assert(bounds.left >= 0 && bounds.right <= innerWidth, 'Menu overflows the viewport');
  const hit = document.elementFromPoint(bounds.left + 20, bounds.top + 20);
  assert(menu.contains(hit), 'Overflow-clipped group hides the menu');
});

await test('Labels focus the combobox and descriptions reach its accessibility attributes', () => {
  const { select, trigger, api } = mount();
  select.setAttribute('aria-describedby', 'help'); api.refresh();
  fixture.querySelector('label').click();
  assert(document.activeElement === trigger, 'Label did not focus the custom control');
  assert(trigger.getAttribute('aria-labelledby') === fixture.querySelector('label').id, 'Accessible label was lost');
  assert(trigger.getAttribute('aria-describedby') === 'help', 'Description was not forwarded');
});

await test('Initialisation is idempotent and destroy restores the original select', () => {
  const { select, api } = mount();
  assert(initSelect(select) === api, 'Duplicate initialisation created another control');
  api.destroy(); controls = [];
  assert(!select.hidden && !fixture.querySelector('.mds-select-control'), 'Original select was not restored');
  assert(!fixture.querySelector('label').id, 'Generated label ID was not removed');
  controls.push(initSelect(select));
  assert(select.hidden, 'Reinitialisation after destroy failed');
});

await test('The older-WebView portal preserves a nested dark theme', () => {
  const original = HTMLElement.prototype.showPopover;
  let control;
  try {
    HTMLElement.prototype.showPopover = undefined;
    control = mount();
  } finally { HTMLElement.prototype.showPopover = original; }
  const { trigger, menu, api } = control;
  trigger.parentElement.dataset.theme = 'dark';
  api.open();
  assert(menu.parentElement === document.body, 'Fallback did not move above clipped groups');
  assert(getComputedStyle(menu).backgroundColor === 'rgb(35, 35, 38)', 'Portal lost its nested theme');
  key(trigger, 'End'); key(trigger, 'Enter');
  assert(trigger.textContent === 'Cherry', 'Fallback selection failed');
});

await test('A disabled fieldset updates its enhanced controls when enabled again', async () => {
  fixture.innerHTML = '<form><fieldset disabled><label for="fruit">Fruit</label><select class="mds-select" id="fruit"><option>Apple</option><option>Cherry</option></select></fieldset></form>';
  const fieldset = fixture.querySelector('fieldset');
  const api = initSelect(fixture.querySelector('select')); controls.push(api);
  assert(api.trigger.disabled, 'Fieldset disabled state was lost');
  fieldset.disabled = false; await tick();
  assert(!api.trigger.disabled, 'Fieldset enable did not refresh the trigger');
  api.open();
  assert(api.trigger.getAttribute('aria-expanded') === 'true', 'Enabled fieldset control would not open');
});

const failed = results.filter((result) => !result.passed);
window.selectTestResults = { total: results.length, failed: failed.length, results };
document.querySelector('#results').textContent = results.map((result) => `${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`).join('\n') + `\n\n${results.length - failed.length}/${results.length} passed`;
document.title = `${failed.length ? 'FAIL' : 'PASS'}: dropdown browser tests`;
