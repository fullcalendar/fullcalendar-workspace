# Phase 1: DOM snapshot tool

## Purpose

Catch unintended DOM changes during the refactor. A phase that should change only how things are
rendered internally should produce identical DOM.

This is a refactoring aid, not a long-term test:

- The tool is committed.
- Snapshots are git-ignored and never committed.
- A baseline is recorded from a commit whenever it's needed, and can always be regenerated.
- Nothing runs it automatically. CI and the normal spec runs don't use it.

## Status

Built. Files:

- `scripts/bin/dom-snapshot.js`: the launcher (record, compare, list).
- `premium/packages/vanilla-scheduler-tests/src/dom-snapshot/`:
  - `fixtures.ts`: fixture definitions, free of runner specifics;
  - `serialize.ts`: the normalising serializer;
  - `dom-snapshot.ts`: the opt-in spec that records them.
- `.gitignore`: `/.dom-snapshots`.

The fixtures live in the scheduler test package, because its bundle includes every standard view
too, so one run covers both packages.

## Usage

```sh
# build the test bundle first (or have `pnpm dev` running). FORCE_REACT=1 for the React runtime
pnpm --filter "@fullcalendar-tests/premium" run build

node scripts/bin/dom-snapshot.js record <label> [--only <substring>]
node scripts/bin/dom-snapshot.js compare <labelA> <labelB> [--stat]
node scripts/bin/dom-snapshot.js list
```

- Like `karma-test.js`, it binds port 9876, so it may need to run outside the sandbox.
- **Runtime detection:** `record` detects the runtime from the bundle (React leaves `__react*`
  keys on DOM nodes) and writes to `.dom-snapshots/<label>.<runtime>/`.
- **`compare`** takes labels with or without the runtime suffix. Without one, it compares every
  runtime recorded under both labels. It prints a per-fixture summary and unified diffs, and exits 1
  if anything differs.
- **`meta.json`** records:
  - the commit and whether the tree was dirty;
  - the fixture count;
  - whether classnames are readable (`pnpm dev` builds, `f-<name>`) or hashed (`pnpm build`,
    `fc-<hash>`). `compare` warns when the two sides differ;
  - which fixtures hit ResizeObserver loop errors.
- **Recording a baseline at another commit:** check that commit out in a separate worktree, build
  there, and point its `.dom-snapshots` at this one (or copy the folder over).

## Mechanism

- **Reuse:** the existing Karma config (`standard/scripts/config/karma.js`) and the built test
  bundle.
- **Own launcher**, because `karma-test.js` replaces `client` wholesale. It sets
  `client.args = ['--dom-snapshot', '--grep', …]` and registers an inline reporter plugin.
- **Opt-in at runtime:** `generate-index.js` bundles every spec file, so `dom-snapshot.ts` defines
  its `describe` only when `__karma__.config.args` includes `--dom-snapshot`. Normal runs see no
  specs from it.
- **Transport:** each fixture sends `__karma__.info({ domSnapshot: { name, html } })`. Karma emits
  `browser_info` for info payloads without `log`/`total`/`dump`, and the reporter's `onBrowserInfo`
  writes the files.
- **ResizeObserver loop errors** are swallowed per fixture, as `ignoreResizeObserverLoops` does in
  the specs, and listed in `meta.json` instead of failing the run.

## Fixtures

**Views:**

- dayGrid: month, week, day.
- timeGrid: week, day.
- list: day, week, month, year.
- multiMonthYear.
- timeline: day, week, month, year.
- resourceTimeline: day, week, month.
- resourceTimeGrid: day, week.
- resourceDayGrid: day, week, month.

**Variants**, applied where they make sense for the view:

- default;
- `dayMinWidth` (the pannable layouts);
- print mode, entered with `_beforeprint` after the first render;
- RTL;
- `dayMaxEvents` / `eventMaxStack` (more-links, and an opened popover);
- `weekNumbers`;
- `nowIndicator` with a fixed now;
- a date selection. Not a selected event: event selection is only reachable through a touch
  long-press;
- background events;
- nested and grouped resources, an expanded and a collapsed group, and `datesAboveResources`;
- render hooks: a `*Content` function returning a string, `{ html }`, `{ domNodes }` and `true`;
  `*Class` functions;
- themes: every fixture already runs with the classic theme plugin and the test theme
  (`theme-for-tests*.ts`), which the test globals load, so theme classnames are covered throughout;
- an empty list view (the `noEvents` area);
- a drag in progress, in RTL.

**Event data:** one set reused across fixtures:

- all-day, timed, multi-day timed and cross-midnight events;
- events touching hidden days;
- events with `url` and with custom colors;
- events assigned to resources.

**Outside the view tree:** the serializer also walks portal targets, because `MorePopover` renders
through `createPortal`. A mid-drag fixture also needs `document.body`, because `ElementMirror`
appends the drag mirror there by default. Include one mid-drag fixture in RTL, since `StandardEvent`
sets `dir` on a dragged event to cover that case.

## Determinism

- Fixed `now`, `timeZone: 'UTC'`, the `en` locale and an explicit container size set in the fixture.
  Karma's window is already fixed at 1280×1696 (`karma.js`), but don't rely on it. Remove the
  license banner.
- Wait for layout to settle before serialising: `waitTimeout` plus two animation frames, the same as
  the specs use for async layout.
- **Normalisation:**
  - Rewrite generated ids (`baseId`-derived ids, `aria-labelledby`/`aria-controls` targets) to stable
    tokens in order of first appearance.
  - Sort class names.
  - Sort inline style properties.
  - Round numbers in inline styles to 0.1px. Keep the styles themselves, because the measurement
    output is exactly what the refactor touches.
  - Drop comments and whitespace-only text.
- Pretty-print one element per line, so diffs read well.

## Done when

- [x] Recording twice at the same commit gives zero diffs. Two separate Karma launches: 129
  fixtures, 0 changed.
- [x] A deliberate one-class change in `StandardEvent` shows up in every fixture that renders
  events: 127 of 129 changed, and only the two empty-list fixtures didn't. A full rebuild of all
  packages for that check shifted no other hashed classname.
- [ ] A baseline is recorded at the phase-1 commit, under both runtimes, and noted here. Not at the
  phase-0 commit: the fixtures and runner don't exist there, and phase 1 changes no rendered DOM,
  so the two are equivalent.

## Findings

- **Run time:** a full record takes about 20 seconds per runtime (129 fixtures), so `--only` is a
  convenience, not a necessity.
- **Sub-pixel noise:** none seen with 0.1px rounding.
- **Preact vs React:** the two produce identical DOM apart from the hashed module classnames, whose
  hash includes the package path. Compare within one runtime only, as the tool does.
- **ResizeObserver loop errors** in 9 fixtures, all resource TimeGrid/DayGrid at a 1100px width:
  `resourceTimeGridWeek` (default, rtl, print, now-indicator, dates-above-resources),
  `resourceDayGridMonth` (default, rtl, print) and `resourceDayGridWeek` (print). They happen in
  both runtimes. Worth a look when phase 7 reaches those layouts, since a loop usually means a
  measurement feeding back into itself.
