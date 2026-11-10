# Magpie Design System

Buildless CSS tokens, components and a desktop app shell for the
[idy.dev](https://idy.dev) apps. It is extracted from the TailSplit
configuration window, so panels running in a browser tab, macOS WKWebView or
Windows WebView2 share one look and one set of behaviours.

The visual language follows [Magpie](https://github.com/yetone/magpie) by
[yetone](https://github.com/yetone), hence the name. See [Credits](#credits).

- **No build step, no dependencies.** Plain CSS and one ES module.
- **Light and dark** follow the system, with an optional `data-theme` override
  that also works on a single subtree.
- **Prefixed** `mds-` classes and `--mds-` custom properties, so the library can sit
  beside an app's own styles.
- **Accessible by default.** State comes from native attributes (`disabled`,
  `aria-selected`, `aria-current`, `aria-busy`, `aria-invalid`, `:checked`), with
  visible focus rings, 44px touch targets on coarse pointers and reduced-motion support.

## Use it

Pin a tag. Every release is tagged `vX.Y.Z`.

**Vendor the files** (recommended for apps with a strict Content Security
Policy, such as loopback-only panels). Copy `css/`, `js/` and `icons/` into the
app's static assets and serve them from your own origin:

```sh
git clone --depth 1 --branch v0.2.0 https://github.com/idy/magpie-design-system.git /tmp/mds
cp -R /tmp/mds/css /tmp/mds/js /tmp/mds/icons path/to/assets/mds/
```

**Or load from a CDN** on public pages:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/idy/magpie-design-system@v0.2.0/css/magpie.css">
<script type="module">
  import { toast } from 'https://cdn.jsdelivr.net/gh/idy/magpie-design-system@v0.2.0/js/magpie.js';
</script>
```

**Or install from Git** with npm (`exports` maps `.` to the module and
`./css` to the stylesheet):

```sh
npm install github:idy/magpie-design-system#v0.2.0
```

`css/magpie.css` imports everything. To pick layers, link them in this order:

| File | Contents | Optional |
| --- | --- | --- |
| `css/tokens.css` | Colour, type, spacing, radius and motion tokens; light and dark themes | No |
| `css/base.css` | Document defaults: box sizing, body type, focus ring, selection, caret, scrollbars, inline `code`, reduced motion | Yes, skip it inside a page with its own reset |
| `css/components.css` | Buttons, form controls, switch, tabs, settings rows, card, notice, status, pill, spinner, toast, dialog, code panel | No |
| `css/layout.css` | App shell: titlebar, brand, window controls, sidebar navigation, workspace, toolbar, action bar | Yes, if you only need components |

Icons live in one sprite, `icons/icons.svg`. Reference it from the same origin:

```html
<svg class="mds-icon" aria-hidden="true"><use href="/assets/mds/icons/icons.svg#reload"/></svg>
```

## Demo

[Open the live component catalogue](https://idy.github.io/magpie-design-system/).
It includes controls, settings, feedback, code panels, colour tokens and icons,
with light, dark and system themes.

To run it locally:

```sh
npm run demo
```

Then open <http://127.0.0.1:4173/demo/>. The demo is itself built with the
shell and covers every component, its states, the live colour tokens and the
icon set, in light and dark.

GitHub Pages deploys the catalogue automatically from `main` through
`.github/workflows/pages.yml`, after `npm test` passes. Only `index.html`,
`demo/`, `css/`, `js/` and `icons/` enter the Pages artifact. The root URL
redirects to `demo/` so the same relative asset paths work locally and under
the GitHub project path. To redeploy without a commit, run the workflow
manually from the repository's Actions tab.

## Theme

Without any attribute, the root follows `prefers-color-scheme`. Set
`data-theme="light"` or `data-theme="dark"` on `<html>` to pin a theme, or on
any element to theme only that subtree. `setTheme()` does this from script.

Theme tokens hold literal values in each theme block rather than `var()`
aliases. Custom properties resolve where they are declared, so aliases would
not follow a nested `data-theme`.

## Tokens

All tokens are custom properties on `:root`, prefixed `--mds-`.

| Group | Tokens | Use |
| --- | --- | --- |
| Surfaces | `canvas`, `sidebar`, `surface`, `raised`, `field`, `code` | Window background, sidebar, cards and groups, buttons and toasts, inputs, code panels |
| Lines | `line`, `line-strong` | Hairline dividers; control and dialog borders |
| Text | `ink-strong`, `ink`, `ink-secondary`, `ink-soft`, `ink-subtle`, `muted`, `faint` | Selected and emphasised text, body text, then progressively quieter labels, hints and placeholders |
| Accent | `accent`, `accent-hover`, `accent-ink`, `on-accent`, `selection` | Primary fills; accent-coloured text, focus rings and carets; text on accent; text selection |
| Status | `good`, `good-ink`, `warn`, `warn-detail`, `warn-line`, `warn-bg`, `error`, `error-detail`, `error-line`, `error-bg`, `error-hover`, `info-line`, `info-bg`, `info-hover`, `danger` | Tones for status, notices and pills; `danger` is the window close hover |
| Overlays | `hover`, `selected`, `wash`, `subtle-hover`, `icon-hover`, `button-hover`, `field-hover` | Translucent hover and selection layers that work on any surface |
| Details | `inline-code`, `scroll-thumb`, `scroll-thumb-hover`, `spinner-line`, `switch-off`, `switch-knob`, `code-key`, `code-value`, `actionbar`, `toast-shadow`, `dialog-shadow` | Component specifics |
| Type | `font`, `mono`, `text-title` (1.125rem), `text-heading` (1rem), `text-body` (0.875rem), `text-note` (0.8125rem), `text-caption` (0.75rem), `text-code` (0.8125rem) | Platform UI face and mono face, and the type scale |
| Layout | `gutter`, `gap`, `section-gap`, `control-height`, `titlebar-height`, `sidebar-width` | Shell geometry; `gutter` and `sidebar-width` shrink on narrow windows |
| Radius | `radius-xs` (4px), `radius-sm` (6px), `radius-md` (8px), `radius-lg` (10px), `radius-xl` (12px), `radius-pill` | Inline code, controls, segmented tabs and notices, groups and cards, dialogs, pills and switches |
| Motion | `duration-fast` (120ms), `duration` (150ms), `ease` | Control transitions and the toast entrance |

## Components

Colour intent uses `data-tone="neutral|accent|good|warn|error"` wherever a
component has tones.

| Component | Markup | Notes |
| --- | --- | --- |
| Button | `<button class="mds-button">` + `mds-button--primary`, `--subtle`, `--small` | Primary is for the one action that commits work |
| Link button | `<button class="mds-link-button">` | Secondary actions in cards and footers |
| Icon button | `<button class="mds-icon-button" aria-label="…">` | Always give it an accessible name |
| Input and textarea | `.mds-input`, `.mds-textarea` | `aria-invalid="true"` marks an error; add `.mds-mono` for addresses and code |
| Dropdown | `<select class="mds-select">`; `.mds-select--inline` for toolbars | `initSelect()` replaces the platform picker with a themed listbox, preserving form data and events |
| Input with unit | `<div class="mds-input-unit"><input class="mds-input"><span>bytes</span></div>` | |
| Checkbox | `<label class="mds-check"><input type="checkbox">Label</label>` | |
| Switch | `<label class="mds-switch"><input type="checkbox" role="switch"><span class="mds-switch-track"></span></label>` | Label it with `<label for>` or `aria-label` |
| Segmented tabs | `<div class="mds-tabs" role="tablist">` with `role="tab"` buttons; `.mds-tabs--fill` | Use with `initTabs()` |
| Section heading | `<div class="mds-section-heading"><h2>…</h2><p>…</p></div>` | |
| Settings group | `.mds-group` > `.mds-row` > `.mds-row-label` + `.mds-row-control`; `.mds-row--toggle`, `.mds-hint`, `.mds-optional`, `.mds-note` | Rows stack when the group is narrower than 560px (container query) |
| Card | `.mds-card` with `.mds-card-title`, `.mds-card-hint`, `.mds-card-footer` | A single surface; do not nest cards |
| Notice | `<div class="mds-notice" role="alert"><div><strong>…</strong><p>…</p></div>[button]</div>` | Defaults to warn; `data-tone="error"` or `"accent"` |
| Status | `<span class="mds-status" data-tone="good"><i class="mds-dot"></i><span>…</span></span>`; `.mds-status--note` | A `data-tone` on the dot overrides the line's tone |
| Pill | `<button class="mds-pill">` | One pending action, e.g. an update; `aria-busy="true"` spins its icon |
| Spinner, loading | `.mds-spinner`, `.mds-loading` | |
| Toast | `.mds-toast` | Created by `toast()` |
| Dialog | `<dialog class="mds-dialog">` with `<form method="dialog">` and `.mds-dialog-actions`; `.mds-dialog--wide` | Use with `openDialog()` |
| Code | `.mds-code` > `.mds-code-header`, `.mds-code-meta`, `.mds-code-body` of `.mds-code-line`s, `.mds-code-footer`; `.mds-pre` for logs | Lines are numbered with CSS counters; colour with `.mds-code-key`, `-value`, `-comment` |
| Utilities | `.mds-icon`, `.mds-mono`, `.mds-tabular`, `.mds-visually-hidden` | |

### Custom dropdown

Use `initSelect()` on a single `<select class="mds-select">` to replace the
platform picker with a themed combobox and listbox. All dropdowns in the
catalogue, including the theme control, use this component.

```html
<label for="appearance">Appearance</label>
<select class="mds-select mds-select--inline" id="appearance" name="appearance">
  <option value="system">Follow system</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
<script type="module">
  import { initSelect } from './mds/js/magpie.js';
  const source = document.querySelector('#appearance');
  const dropdown = initSelect(source);
  source.addEventListener('change', () => console.log(source.value));
</script>
```

Use an external `<label for="…">`, `aria-label` or `aria-labelledby`.
`aria-describedby`, `aria-invalid` and `required` are forwarded to the
visible control. The original select is hidden after enhancement and stays
the source of form values, so `FormData`, `input`, `change` and form reset
continue to work. Without JavaScript it remains a normal select.

The menu shows a check beside the selected option, supports option groups
and disabled options, skips unavailable items during keyboard navigation,
flips above its trigger when space is tight, and stays inside the viewport.
It uses the Popover API to escape clipped settings groups; older WebViews
use a fixed portal that copies the control's theme tokens.

- Click, Enter or Space opens the menu; arrows, Home and End browse options.
- Enter, Space or Tab commits; Escape or clicking outside cancels.
- Typing searches labels; repeating a letter cycles matching options.

The returned controller exposes `trigger`, `open()`, `close()`, `refresh()`
and `destroy()`. Call `refresh()` after assigning `source.value` or
`source.selectedIndex` programmatically, or dispatch a `change` event.
Changes to option labels, disabled state and option children are observed
automatically. `destroy()` removes generated markup and listeners and
restores the original select. Calling `initSelect()` twice on one element
returns the same controller. Multiple-selection and list-style selects
(`multiple` or `size > 1`) are intentionally left to other controls.

### App shell

```html
<header class="mds-titlebar" id="titlebar">
  <a class="mds-brand" href="/"><span class="mds-brand-mark">…</span><span class="mds-brand-name">App</span></a>
  <div class="mds-titlebar-content">
    <nav class="mds-crumbs"><span>Settings</span><span class="mds-crumb-sep">/</span><span aria-current="page">Network</span></nav>
    <div class="mds-titlebar-actions">…</div>
    <div class="mds-window-controls" hidden>
      <button data-window-action="minimize" aria-label="Minimise">…</button>
      <button data-window-action="zoom" aria-label="Maximise or restore">…</button>
      <button data-window-action="close" aria-label="Close window">…</button>
    </div>
  </div>
</header>
<div class="mds-shell">
  <aside class="mds-sidebar">
    <nav class="mds-nav"><p class="mds-nav-group">Network</p><button class="mds-nav-item" aria-current="page">…</button></nav>
    <div class="mds-sidebar-footer"><div class="mds-sidebar-item">…</div></div>
  </aside>
  <main class="mds-workspace">
    <div class="mds-toolbar">…<div class="mds-toolbar-actions">…</div></div>
    <section class="mds-stack">…</section>
    <footer class="mds-actionbar"><span class="mds-status mds-status--note">…</span><div class="mds-actionbar-buttons">…</div></footer>
  </main>
</div>
```

Below 640px the sidebar becomes a horizontal tab strip and the action bar
stacks. `data-window-chrome="macos"` widens the sidebar and clears the traffic
lights; `"windows"` shows the page-drawn window controls.

## JavaScript

`js/magpie.js` is a dependency-free ES module. Importing it runs nothing.

| Function | Purpose |
| --- | --- |
| `setTheme(theme, root?)` | Pin `'light'` or `'dark'` on `root` (default `<html>`); anything else follows the system again |
| `toast(message, { duration?, element? })` | Show one status message in a shared `.mds-toast` (`role="status"`), replacing the previous one |
| `openDialog(dialog, { fallback? })` | `showModal()` and resolve with the dialog's `returnValue`; Escape resolves with `fallback` (`'cancel'`) |
| `initSelect(select)` | Custom dropdown with keyboard navigation and typeahead; preserves the original select's form data and events; returns `trigger`, `open`, `close`, `refresh` and `destroy` |
| `initTabs(tablist, { onSelect? })` | Roving tabindex, Arrow/Home/End keys, `aria-selected` and panel `hidden` via `aria-controls`; `onSelect` may return `false` to veto |
| `initNav(nav, { onSelect? })` | Move `aria-current="page"` between `.mds-nav-item` buttons; `onSelect` may return `false` to veto |
| `detectWindowHost(macHandler?)` | Find the native bridge: WKWebView message handler `macHandler`, or WebView2 `chrome.webview`; `null` in a browser |
| `initWindowChrome(titlebar, bridge)` | Frameless-window titlebar: posts `drag` after a real 4px drag, `zoom` on double-click, and each `data-window-action`; sets `data-window-chrome` |

```js
import { detectWindowHost, initWindowChrome, initTabs, toast } from './mds/js/magpie.js';

initWindowChrome(document.querySelector('#titlebar'), detectWindowHost('myAppWindow'));
initTabs(document.querySelector('.mds-tabs'), { onSelect: (tab) => canLeaveCurrentTab() });
toast('Configuration saved and applied');
```

## Repository layout

| Path | Purpose |
| --- | --- |
| `css/` | The library, in cascade order via `css/magpie.css` |
| `js/magpie.js` | Behaviour helpers and public exports |
| `js/select.js` | Custom dropdown implementation, re-exported by `magpie.js` |
| `icons/icons.svg` | Icon sprite, 24px grid, `currentColor` strokes |
| `demo/` | Catalogue page; not part of the published package |
| `scripts/check.mjs` | Consistency checks run by `npm test` and CI |

## Develop

Requires Node 18+ for checks and Python 3 for the demo server.

```sh
npm test       # token parity, undeclared tokens, demo classes and icons, documented exports
npm run demo   # http://127.0.0.1:4173/demo/
```

With the demo server running, open
<http://127.0.0.1:4173/tests/select.html> to run the dependency-free dropdown
browser regression suite. It covers pointer and keyboard selection, disabled
items and groups, typeahead, form data, reset, required validation, dynamic
options, clipped groups, viewport placement, labels, teardown, disabled
fieldsets and the fallback portal's nested theme. These browser checks run
separately from the Node consistency checks in `npm test`.

Keep the two dark-theme blocks in `css/tokens.css` identical; `npm test`
fails otherwise. Bump `version` in `package.json` together with the pinned
examples in this README, then tag `vX.Y.Z`.

## Credits

The look and feel of this design system, and of the TailSplit window it was
extracted from, is modelled on **[Magpie](https://github.com/yetone/magpie)**
by **[yetone](https://github.com/yetone)** ([usemagpie.ai](https://usemagpie.ai)).
Thank you, yetone, for the careful, native-feeling interface that inspired it.
Magpie is released under the MIT License. This repository does not include
Magpie source code; it is an independent implementation, and the name
acknowledges where the style comes from.

## License

[MIT](LICENSE) © idy
