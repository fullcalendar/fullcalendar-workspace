# Phase 1: DOM snapshot tool

## Purpose

Catch unintended DOM changes during the refactor. A phase that should change only how things are
rendered internally should produce identical DOM.

This is a refactoring aid, not a long-term test:

- The tool is committed.
- Snapshots are git-ignored and never committed.
- A baseline is recorded from a commit whenever it's needed, and can always be regenerated.
- Nothing runs it automatically. CI and the normal spec runs don't use it.

## Usage (target)

```sh
node scripts/bin/dom-snapshot.js record <label>        # e.g. baseline, after-phase-4
node scripts/bin/dom-snapshot.js compare <labelA> <labelB>
```

- Snapshots go in `.dom-snapshots/<label>/`, which is git-ignored.
- `record` writes a `meta.json` with the commit SHA and whether the working tree was dirty.
- `compare` prints a per-fixture summary and a unified diff of the files that changed.
- To get a baseline, record at the baseline commit (e.g. in a separate worktree), then record again
  after the change.

## Mechanism

- **Reuse what we have:** the existing Karma config (`standard/scripts/config/karma.js`) and the built
  test bundles.
- **Own launcher:** `scripts/bin/dom-snapshot.js`, modelled on `karma-test.js` but separate, because
  `karma-test.js` replaces `client` wholesale. It sets its own `client.args` and registers an inline
  reporter plugin.
- **Opt-in gating at runtime:** `generate-index.js` bundles every spec file, so the fixture file
  can't be excluded at build time. Its `describe` checks for a client arg (e.g. `--dom-snapshot`) and
  defines nothing otherwise. Don't use `fdescribe`, which the index generator treats as a filter.
- **Getting DOM out of the browser:** `__karma__.info({ fixture, html })`, one call per fixture,
  received by the inline reporter and written to disk. Karma 6 allows 100 MB socket messages, so
  size isn't a concern. Avoid `console.log`, which goes through `captureConsole` and the dots
  reporter.
- **Both runtimes:** `record` takes `--react` and uses the `FORCE_REACT=1` bundle. Labels get a
  runtime suffix.
- Keep the fixture definitions separate from the runner, so a later Playwright runner could reuse
  them.

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
- a selected event and a date selection;
- background events;
- nested and grouped resources, an expanded and a collapsed group, and `datesAboveResources`;
- render hooks: a `*Content` function returning a string, `{ html }`, `{ domNodes }` and `true`;
  `*Class` functions;
- a theme fixture (one built-in theme) so class names that themes depend on are covered.

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

- Recording twice at the same commit gives zero diffs, both runs in one session and across two
  sessions.
- A deliberate one-class change in `StandardEvent` shows up as a diff in every fixture that renders
  events.
- A baseline is recorded at the phase-1 commit, under both runtimes, and noted here. Not at the
  phase-0 commit: the fixtures and runner don't exist there, and phase 1 changes no rendered DOM,
  so the two are equivalent.

## Open questions

- How long does the full matrix take to record? If it's more than a few minutes, add a filter
  argument (`--only timeGrid`).
- Are some measured sizes unstable at sub-pixel level in headless Chrome even after rounding? If so,
  widen the rounding for those properties only.
