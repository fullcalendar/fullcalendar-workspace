# A public dev-parts plugin that marks render-hook parts with `data-fc-part`

**Status:** open
**Issues:** none found

A development-only plugin that gives every element a `*Class` option styles a `data-fc-part` attribute naming that part, the option name without `Class` (`dayCellClass` → `data-fc-part="dayCell"`). Theme authors could see in devtools which option styles which element, and test suites, including apps', could find elements by part. Adam (2026-11-10) prefers a data attribute to a class name for this, and wants it to become a public plugin eventually, after the planned refactor of content injection.

## History

- Built during the test revamp as `fullcalendar/dev-parts` (`05949f690` and follow-ups): a `devParts` option, and a `getPartAttr(options, ...partNames)` helper called at about 160 render sites (55 as a `part` prop through `ContentContainer`/`ContentInjector`, about 100 as raw `data-fc-part` attributes on plain elements), plus `partName` on the header-tier types, and root-element handling in the vanilla `Calendar`.
- Removed in `2438fd2a6`. It added surface to content injection right before its refactor, cost every user about 0.6 KB gzipped (3.3 KB minified) even without the plugin, and its required `partName` briefly broke the protected API's `CellRenderConfig`/`CellDataConfig` types.
- The tests now use marker classes from a test-only plugin (`standard/packages/vanilla-tests/src/lib/parts.ts`): option defaults give each `*Class` option a `test-part-<name>` class, which core joins with the theme's and the app's classes. Its lists are kept by hand.

## What the design needs to settle

- **Zero cost without the plugin.** No part strings or helper calls in the production bundle.
- **Where to hook in.** Every part is a `*Class` option, but only about a third of the marked elements go through a content injector, and `generatorName` is often `undefined` or doesn't map to the part, so a content-injector hook alone misses most of them. Applying the part wherever a `*Class` option is applied would cover all of them. A class-option refiner that adds a marker class does that with no core changes, but gives a class, not the preferred data attribute.
- **Elements whose class option is deliberately skipped.** A disabled day header gets no `dayHeaderClass`, so a class-based mark misses it. Decide whether such elements still get their part.
- **Elements with several parts.** An event is `event`, `blockEvent` and `rowEvent` at once, so the attribute holds a space-separated list (`[data-fc-part~="blockEvent"]`).
- **The root element.** It has the `class` option, not a `rootClass`. The calendar element belongs to the app, so leave an app's own `data-fc-part` alone.
- **Guidance.** The removed plugin warned once that it's development-only and that styling against `data-fc-part` is unsupported (style through the `*Class` options). Decide whether a public version keeps that stance.
