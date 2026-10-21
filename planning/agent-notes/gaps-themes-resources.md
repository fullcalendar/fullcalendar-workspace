# gaps: themes smoke + resource-level constraint props

Coverage-gap tests (no legacy files involved).

## Files

- NEW `standard/packages/vanilla-tests/tests/themes/smoke.ts`: 12 tests (breezy, forma, monarch, pulse ×
  dayGridMonth, timeGridWeek, listWeek).
- `premium/packages/vanilla-scheduler-tests/tests/constraints/resources.ts`: new describe
  `resource-level eventConstraint, eventOverlap and eventAllow`, 17 tests (file total 31).

## Themes smoke: how it's set up

- The calendar is built with `new Calendar(...)` and its own plugin list (view plugins, the theme plugin,
  `tests/lib/test-plugin`), because `initCalendar` always adds the classic theme plugin and two theme
  plugins would mix their option defaults.
- Each theme's `theme.css` plus one palette is imported with `?inline` and injected as a `<style>` only
  for that test, then removed (`onTestFinished`). The built themes' class names are scoped per theme
  (`fc-monarch-xYz`, `fc-classic-xYz`), so the classic CSS that setup.ts loads globally can't style them.
- "The theme actually applied" check: the root and view carry `fc-<theme>-*` classes and no `fc-classic-*`
  ones, and the view's left border is 1px solid in the color of the palette's `--fc-<theme>-border`
  (which differs from classic's). A mutation check (no CSS injected) fails all 12.
- Note: the timeGridWeek title is "May 2024" (month-only), the same as with classic. That's the timeGrid
  default (see toolbar/title.ts), not something the themes change.

## Resource-level props: library behavior (from premium/packages/preact-scheduler/src/resource)

- Validation (`resource/validation.ts`, `isPropsValidWithResources`) splits by resource with
  `ResourceSplitter`. A dragged event is checked against the resource(s) it has AFTER the drop. So a
  resource's eventConstraint/eventOverlap/eventAllow governs drops INTO it. Dragging an event out of a
  constrained resource into an unconstrained one is allowed, even outside the first resource's
  constraint. Tested as is (seems the sensible meaning, but worth confirming it's what the docs promise).
- Combining: constraints and allow functions are concatenated, so the resource's apply on top of the
  calendar's (tested). `overlap` is a boolean override, so an event's own `overlap: true` overrides its
  resource's `eventOverlap: false`. The event underneath also inherits its resource's
  `eventOverlap: false`, which still blocks the drop unless it too has `overlap: true` (both tested).
- No bugs found. All new tests pass as plain `it`. A mutation check (resource props removed) fails the
  10 rows that depend on them.

## Possible quirk (from reading the code, untested)

- Event-source-level vs resource-level precedence differs by path. Validation and resource views go
  through `Splitter.buildEventUiForKey`: global < resource < source < event. Non-resource views get the
  resource UI injected by `ResourceEventConfigAdder` after the source UI: global < source < resource < event.
  For constraints/allows (concatenated) this doesn't matter. For booleans/colors it could: e.g. a source
  `color` vs a resource `eventColor` may win differently in `timeGridDay` than in `resourceTimeGridDay`.
  Not verified in a browser.
