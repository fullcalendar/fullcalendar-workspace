# Calendar area (calendar-lifecycle, options, navigation, visible-range, toolbar, sizing)

## New shared helpers (new files only)

- `tests/lib/view-dates.ts`: `getActiveRange`/`getCurrentRange` (strings in the calendar's time zone; midnights as `YYYY-MM-DD`, anything else stays full ISO), `getDayHeaderDates`, `getDayCellDates`, `getTodayDates` (`aria-current="date"`).
- `tests/lib/models/toolbar.ts`: `ToolbarModel.header/footer(root)`. Finds buttons by their aria-label (ex: "Next Month", "This Week", "Week view"), clicks them with `userEvent.click`, and lists section contents. For a button's name→label mapping, use the public `calendar.getButtonState()[name].hint`.

## Library quirks / observations

- **A fixed `now` keeps ticking.** With `now: '2010-05-15'`, `calendar.today()` then `getDate()` gives `2010-05-15T00:00:00.070Z`: the time advances from the given value. Probably intended (the now-indicator needs it). Tests compare the date part only.
- **`validRange` as a function gets the start of today**, not the current instant (`now: '2017-06-09T10:00'` → `2017-06-09T00:00Z`). The legacy spec asserted the same.
- **Legacy prev-button comments were wrong about ranges.** `prev`/`next` take the start of the current range unit, then add `dateIncrement`. From week 2017-06-04, a year back is 2016-06-04 (Saturday), so the week is 2016-05-29–06-05, not 2016-06-05–06-12. The new rows use the real ranges, including an exact boundary.
- **No scrollbars in headless Chromium.** Playwright's `--hide-scrollbars` makes them take no space, even when styled with `::-webkit-scrollbar`. So `computeEdges`'s scrollbar widths are always 0 here, and the scrollbar cases of `computeEdges`/`computeInnerRect` can't be tested. Every other test in the suite also runs with zero-width scrollbars.
- `calendar.updateSize()` no longer exists. The legacy `updateSize` spec became `sizing/container-resize.ts`: a calendar rendered hidden and then shown has correct measured layout (more-link count matches a calendar rendered visible), and a container resize resizes the view and columns.
- The default titles for week views are month-based (`June 2014`, or `Mar – Apr 2017` across months), and the default for a 2-day custom view is `December 2014`. This matches the legacy specs.

## Legacy specs dropped or changed

- `view-dates/dateIncrement.ts`: comment-only file, deleted.
- `legacy/emitter.ts` tested the internal `Emitter` class. It's replaced by public `calendar.on/off` tests in `calendar-lifecycle/emitter.ts`, which also fill the `calendar.off` gap.
- `legacy/destroy.ts` counted listeners with jQuery's `ListenerCounter`. It's replaced by wrapping `EventTarget.prototype.add/removeEventListener` and checking that no listener stays on document, window, the root element, or non-DOM targets. The anchor is a document `mousedown` listener present before destroy. Listener counts on the root element relative to a bare Preact root were dropped.
- `navLinks`: the `describeTimeZones` matrix was dropped (the time zone isn't the subject).
- `legacy/firstDay`: the LTR/RTL matrix was reduced to one RTL geometry case.
- `height-and-contentHeight`: kept height/contentHeight × (init, setOption) × view scenarios. Scrollbars are detected as `scrollHeight > clientHeight` on overflow:auto descendants of the view part. The per-view repeats with 3 all-day variants were trimmed to one all-day case.
- `computeEdges`/`computeInnerRect`: kept the border/padding cases, dropped the scrollbar cases (see above). Both are still exported and used by `ElementScrollGeomCache`.
- `performance/*`: the rerender counts were ported, but the window resize is now a real container resize, anchored by checking that the view's width changed.
- `custom-view-class`: kept, with exact assertions on the content props instead of `typeof x === 'object'`.

## Coverage added

- `options/set-option.ts`: setOption for 11 options. Each is compared against initializing with the option, and must differ from the default.
- Toolbar: view-button clicks and `aria-selected`, custom button `click`/`hint`, header/footer `setOption` toggling.
- `navigation/dates-set.ts`: datesSet arguments on init/next.

## Shared legacy helpers still used elsewhere

`src/lib/ViewDateUtils.ts`, `ListenerCounter.ts`, `vdom-misc.ts` are still imported by premium Karma specs (`misc/dateIncrement.ts`, `timeline/timeline-date-range.ts`, `misc/destroy.ts`), so they were left in place.
