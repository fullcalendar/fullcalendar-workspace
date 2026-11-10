# Coverage gaps: keyboard/ARIA and sticky headers

New files only. No shared helpers changed.

## Files

- `standard/packages/vanilla-tests/tests/accessibility/keyboard.ts` (33 tests): real keyboard input (`userEvent.keyboard` / `userEvent.tab`) and `document.activeElement` checks.
  - Events: which settings make an event a focusable `role=button` (eventClick, eventInteractive, per-event `interactive`). Tab order skips non-interactive events. Enter/Space fire eventClick with the keydown event (other keys don't). A url event is a native link: Enter fires eventClick once via the browser's click. Also in list view.
  - Nav links: Enter on day-number, timeGrid day-header, list day-header and timeGridDay week-number links. Space works too, and a custom `navLinkDayClick` gets the keydown event. Only the first of a list day header's two links is tabbable. dayGrid inline week numbers are not tabbable and are aria-hidden.
  - More-link and popover: the more-link is a tabbable `role=button` with `aria-haspopup=dialog`, `aria-expanded` and `aria-controls`. Enter/Space open the popover and focus its close button. The popover is a `role=dialog` labelled by its title. It closes on Escape, on Enter on the close button, on Tab past the last event and on Shift+Tab before the close button, and each time focus returns to the more-link. Popover events can be tabbed through and activated. Also covers the timeGrid more-link.
  - Toolbar: Tab order skips the disabled today button. Enter/Space activate a button and focus stays on it. A view switch works from the keyboard and keeps focus.
- `standard/packages/vanilla-tests/tests/accessibility/aria.ts` (21 tests, 2 `it.fails`):
  - The view is labelled by the toolbar title, or by `aria-label`=title when the toolbar has no title (dayGrid/timeGrid table, list/multiMonth list).
  - dayGridMonth table structure: rowcount, colcount, rows labelled "Week N", columnheaders, cells, `aria-current`. Disabled cells (`aria-disabled`) outside validRange in dayGrid and timeGrid.
  - timeGrid rows, row headers and cells. Slot labels and lines are aria-hidden.
  - List view: list of `listitem` days labelled with the date, events lists labelled `eventsHint`, and a `role=status` no-events message.
  - multiMonth: a list of month tables labelled by the month title.
  - Toolbar: title heading with `headingLevel`. A view-only group is a `tablist` (`viewChangeHint`) with `role=tab` and `aria-selected`. A mixed group uses `aria-pressed`. Icon buttons have hidden icons.
- `standard/packages/vanilla-tests/tests/sizing/sticky.ts` (19 tests):
  - `tableHeaderSticky` with both the window and a 400px container as the scroller: auto with height/contentHeight auto, false, auto with a fixed height, true with a fixed height, in dayGridMonth and timeGridWeek. The header scrolls away once the calendar's bottom passes.
  - List view day headers stick within the list scroller.
  - multiMonth: with a single column, the month title and day header stick. With two columns, they don't.

## Bugs (it.fails, in aria.ts)

- **A view button alone in its toolbar group gets `role=tab` with no `tablist` around it.** Repro: `headerToolbar: { left: 'prev,next', right: 'dayGridMonth' }`. `ToolbarSection` gives `role=tab` whenever a group has only view buttons, but only wraps it in a `tablist` when the group has more than 1 child. ARIA requires tabs to be owned by a tablist (axe: aria-required-parent).
- **timeGrid's `aria-colcount` leaves out the row-header column.** `TimeGridLayout` sets `aria-colcount = cells.length` (7 in a week). Every row has a row header (or the empty corner cell) plus 7 cells, so 8 columns. dayGrid is correct (7, and inline week numbers sit inside cells).

## Questions for the maintainer (not tested, design choices)

- **The today button's accessible name doesn't contain its visible text.** It shows "Today" but its aria-label is "This Month" / "This Week" (todayHint). WCAG 2.5.3 Label in Name (level A) expects the visible text to be part of the name, e.g. so speech-input users can say "click Today".
- **Non-toggle buttons get `aria-pressed="false"`.** prev/next/today, and any button not in a view-only group, are announced as toggle buttons ("not pressed"). `aria-pressed` only means something for view buttons in mixed groups. The tests assert `aria-pressed` only there.
- Nav-link activation by keyboard switches the view and removes the focused link, so focus falls to `<body>`. This is common, but a screen-reader user loses their place. The toolbar keeps focus (tested).
- Day cells and time slots aren't keyboard-reachable, so there's no keyboard `dateClick`/`select`. This is a known limitation, not tested.

## Coverage not added

- `footerScrollbarSticky` needs `dayMinWidth`, which throws without the scrollgrid plugin (premium). The premium `sizing/horizontal-scrolling.ts` checks only that the sticky class is present, not where the scrollbar ends up on screen. Headless Chromium also hides scrollbars (0 height), so a position test would rest on a 0-height element.
