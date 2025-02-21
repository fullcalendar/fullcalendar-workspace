
## v7.0.0

### :sparkles: Features

- More streamlined HTML skeleton and more flexbox-based CSS (as opposed to table-based)
- No longer a need to call `.updateSize()` after the page's dimensions have been programmatically changed. All sizing/positioning of events and views will stay updated automatically. Related to the "resizing" bugfixes below.
- Improve Bootstrap 5 theme color mode, use of semantic color vars ([#7465](https://github.com/fullcalendar/fullcalendar/issues/7465)) <!-- TODO: make demo, add to docs -->
- `eventSlicing` setting, which controls whether DayGrid can can put fragments of multi-day events with +more links. Defaults to `true` to preserve v6 compatibility. <!-- https://fullcalendar.freshdesk.com/a/tickets/9203 -->
- In Resource Timeline view, `resourceAreaHeaderContent` above columns now stays fixed during horizontal scrolling ([#7779](https://github.com/fullcalendar/fullcalendar/issues/7779))
- If `resourceAreaWidth` or `resourceAreaColumns.width` specified as percentage, will persist as percentage after user-resize

### :watch: Performance

- Fixed unnecessary event rendering and calling of `eventContent` when unrelated events change ([#3003](https://github.com/fullcalendar/fullcalendar/issues/3003), [#7650](https://github.com/fullcalendar/fullcalendar/issues/7650))
- DayGrid/TimeGrid rendering performance gain ([#7677](https://github.com/fullcalendar/fullcalendar/issues/7677))
- MultiMonth performance gain, solving "Forced reflow while executing JavaScript took <#> ms" violation ([#7209](https://github.com/fullcalendar/fullcalendar/issues/7209)) <!-- manually verified -->
- Less layout thrashing ([#4906](https://github.com/fullcalendar/fullcalendar/issues/4906))
- Less flickering during event rerendering for React connector ([#7488](https://github.com/fullcalendar/fullcalendar/issues/7488))

### :accessibility: Accessibility

- Better table semantics for screen readers ([#6641](https://github.com/fullcalendar/fullcalendar/issues/6641), [#7656](https://github.com/fullcalendar/fullcalendar/issues/7656), [#7455](https://github.com/fullcalendar/fullcalendar/issues/7455))
- Non-editable events should not be rendered as anchor tags ([#7675](https://github.com/fullcalendar/fullcalendar/issues/7675))
- List-view weekday navLinks should not have aria-hidden ([#7645](https://github.com/fullcalendar/fullcalendar/issues/7645))
- List-view accessibility markup less table-like, more list-like. Removed table pseudo-headers and thus removed the `eventHint` and `timeHint` locale settings.
- TimeGrid accessibility markup more table-like, puts timed events in single "row" labelled by `timedText` setting
- Add aria-current="date" for "today" highlight ([#7502](https://github.com/fullcalendar/fullcalendar/issues/7502))
- Use aria-label instead of title attribute ([#7584](https://github.com/fullcalendar/fullcalendar/issues/7584))
- Aria improvement for view-switcher within toolbar ([#7809](https://github.com/fullcalendar/fullcalendar/issues/7809), [#6522](https://github.com/fullcalendar/fullcalendar/issues/6522))
- Customizable heading hierarchy level via `headingLevel` ([#6972](https://github.com/fullcalendar/fullcalendar/issues/6972)) <!-- TODO: document new feature -->
- Improve MultiMonth title hierarchy via role=list ([#7537](https://github.com/fullcalendar/fullcalendar/issues/7537))
- Improve +more link popover-like aria attributes ([#7567](https://github.com/fullcalendar/fullcalendar/issues/7567))
- Improve navLink aria attributes, give role=link ([#7567](https://github.com/fullcalendar/fullcalendar/issues/7567))
- Give role=button to clickable event elements w/o urls ([#7567](https://github.com/fullcalendar/fullcalendar/issues/7567))
- Tabbable popover close button ([#7157](https://github.com/fullcalendar/fullcalendar/issues/7157))
- Navigate popover items with keyboard ([#6624](https://github.com/fullcalendar/fullcalendar/issues/6624))
- Disabled day cells have broken ARIA references ([#7379](https://github.com/fullcalendar/fullcalendar/issues/7379))
- Move aria-label/labelledby away from invalid elements to cells ([#7566](https://github.com/fullcalendar/fullcalendar/issues/7566))
- Invalid `role` attributes on td/th/tr elements inside a table element ([#7568](https://github.com/fullcalendar/fullcalendar/issues/7568))
- Event time order different than DOM order, bad for tabbing ([#6943](https://github.com/fullcalendar/fullcalendar/issues/6943))
- Certain date/time text should be text-selectable ([#5628](https://github.com/fullcalendar/fullcalendar/issues/5628))

All calendar views now pass [Axe accessibility testing](https://www.deque.com/axe/) with the exception of a false-positive [scrollbar error](https://github.com/fullcalendar/fullcalendar/issues/7481) (TODO: create demo of workaround)

### :printer: Printing

- DayGrid
  - Event titles should not repeat each day ([#6657](https://github.com/fullcalendar/fullcalendar/issues/6657))
- TimeGrid
  - First page blank when multiple pages ([#7007](https://github.com/fullcalendar/fullcalendar/issues/7007))
  - Last event cut-off when multiple pages ([#7673](https://github.com/fullcalendar/fullcalendar/issues/7673))
  - Show all time slot lines ([#5465](https://github.com/fullcalendar/fullcalendar/issues/5465))
    - NOTE: Impossible to achieve multi-page breaking in Firefox, so falls back to flat list of events without slot lines
- Timeline
  - Show all time slot lines ([#6636](https://github.com/fullcalendar/fullcalendar/issues/6636), [#6802](https://github.com/fullcalendar/fullcalendar/issues/6802))
- Resource-Timeline
  - Resource rows no longer break across pages
  - Resource-area columns shrink-to-fit based on percentage, saving more space for timeline

### :beetle: Bugfixes

- Responsiveness
  - "More" button (events) on smartphones not working properly ([#2991](https://github.com/fullcalendar/fullcalendar/issues/2991)) <!-- no repro, not sure if fixed in past version, but definitely fixed now) -->
  - Toolbar CSS is more robust on smaller screens and more customizable for desired responsive behavior ([#4638](https://github.com/fullcalendar/fullcalendar/issues/4638))
- Resizing
  - Layout does not resize to new container width after browser resizing ([#6407](https://github.com/fullcalendar/fullcalendar/issues/6407)) <!-- too hard to recreate... definitely fixed -->
  - Resource rows don't adjust height to fit resourceLaneContent ([#6103](https://github.com/fullcalendar/fullcalendar/issues/6103))
  - Resource rows don't render with correct height ([#6082](https://github.com/fullcalendar/fullcalendar/issues/6082)) <!-- no good reproduction - ask them to do it -->
  - Dynamic calendar width doesn't adjust ([#5507](https://github.com/fullcalendar/fullcalendar/issues/5507)) <!-- no repro available -->
  - Adjust calendar sizing when scrollbar width changes (or (de)activated) ([#5561](https://github.com/fullcalendar/fullcalendar/issues/5561)) <!-- tested manually w/ system settings -->
  - Day number in day cells are hidden by vertical scrollbar ([#6798](https://github.com/fullcalendar/fullcalendar/issues/6798))
- Scrollbars
  - Don't show MacOS/iOS hovering scrollbars in timeline header/left ([#5180](https://github.com/fullcalendar/fullcalendar/issues/5180))
  - Disable hovering scrollbars in header/resourceArea ([#6894](https://github.com/fullcalendar/fullcalendar/issues/6894))
  - Unnecessary scrollbars in day headers ([#6047](https://github.com/fullcalendar/fullcalendar/issues/6047))
- List View sticky headers lack bottom border ([#7778](https://github.com/fullcalendar/fullcalendar/issues/7778))
- Vertical Resource views with no resources shows blank resource row ([#7377](https://github.com/fullcalendar/fullcalendar/issues/7377))
- DayGrid view
  - Better dayGrid height row height, height:auto, and +more link behavior ([#6033](https://github.com/fullcalendar/fullcalendar/issues/6033)) <!-- ^^^ repro in other issue vvv -->
  - Day cells are not always equal height with calendar height set to auto ([#5762](https://github.com/fullcalendar/fullcalendar/issues/5762))
  - Events not rendered when container is resized ([#7555](https://github.com/fullcalendar/fullcalendar/issues/7555)) <!-- can't produce - ask them -->
  - Events overflow below day cell with dayMaxEvents:true and showNonCurrentDates:false ([#6749](https://github.com/fullcalendar/fullcalendar/issues/6749)) <!-- updated original repro: https://codepen.io/arshaw/pen/NWQGQLN?editors=0110 -->
  - Events times are cutoff with eventDisplay: "block" when there is not enough space for the title ([#6457](https://github.com/fullcalendar/fullcalendar/issues/6457))
  - Compressed space between events in dayGrid when month-start title ([#7184](https://github.com/fullcalendar/fullcalendar/issues/7184))
- Resource-Timeline scrolls down when it shouldn't, attempting to preserve scroll state ([#4443](https://github.com/fullcalendar/fullcalendar/issues/4443))
- The `moreLinkClick` date is always UTC, not adjusted by timezone plugins ([#7314](https://github.com/fullcalendar/fullcalendar/issues/7314))
- TimeGrid "all-day" text is better aligned, better split across multiple lines

### :warning: Breaking Changes

v7 is designed to be backwards-compatible with v6, but with the following minor exceptions:

- API changes
  - `windowResize` event no longer fires
  - `windowResizeDelay` setting removed
  - `handleWindowResize` callback removed
  - The `moreLinkClick` date will be adjusted to a timezone plugin's offset, no longer unconditionally UTC
  - Users of `@fullcalendar/icalendar` must upgrade their `ical.js` peerDependency to v2 ([#7734](https://github.com/fullcalendar/fullcalendar/issues/7734))
  - Users of `@fullcalendar/bootstrap5` must upgrade `bootstrap` to 5.2.x or newer and explicitly list it as as peerDependency
- Visual-only changes
  - For all table headers, no longer bold styling by default
  - Newlines in `allDayText` will be displayed as line breaks in TimeGrid
  - Disabled days (via `validRange`) now display text in TimeGrid and DayGrid header cells. Still no content within body cells.
  - The `multiMonthMinWidth` pixel value now *includes* the padding within each month tile
  - For headerToolbar/footerToolbar for RTL calendars, elements within toolbar sections specified as `left` and `right` now span right-to-left
  - Bootstrap theme default line-height less chunky
  - TimeGrid overlapping events that previously spanned full column width now have a right margin. This was an accidental regression from v5 -> v6, and the v5 behavior is restored ([#6569](https://github.com/fullcalendar/fullcalendar/issues/6569))
  - The `weekNumbers:true` setting no longer displays week numbers in certain cases:
    - `resourceTimeGridDay` view, because x-axis header cell alongside resource names is reserved for a future label
    - `dayGridDay` view, `dayGridWeek` view, or any dayGrid-based view with only one row
- Minor markup-related changes
  - Removed `data-navlink` attribute in favor of `fc-navlink` className
  - Using `role=link` instead of `<a>` to avoid accidentally inheriting styles
  - Using `role=heading` instead of `<h2>` in toolbar title
  - In `resourceDayGrid`-based views, and `resourceTimeGrid`-based views
    - When `datesAboveResources:true`, the header resource below the header dates have `data-date` attributes
    - When `datesAboveResources:false`, the header dates below the header resources have `data-resource-id` attributes
- FullCalendar-internal exports
  - `DayTable` from `'@fullcalendar/daygrid/internal'` removed
  - `DayTableView` from `'@fullcalendar/daygrid/internal'` renamed to `DayGridView`
  - `DayTimeCols` from `'@fullcalendar/timegrid/internal'` removed
  - `DayTimeColsView` from `'@fullcalendar/timegrid/internal'` renamed to `TimeGridView`

### :fast_forward: Features Postponed Until v7.1

Unfortunately we didn't have time to do these but will implement them in a follow-up minor release:

- Improve resource timeline performance with virtual rendering ([#5673](https://github.com/fullcalendar/fullcalendar/issues/5673))
- Resource open/close animation ([#4844](https://github.com/fullcalendar/fullcalendar/issues/4844))

### :scroll: License Change to Premium Packages

While the STANDARD FullCalendar packages have been, and always will be, licensed under the permissive MIT license, the PREMIUM packages have more complex licensing:

| Application Type | Company Type   | v6 Premium License
| ---------------- | -------------- | ------------------
| Closed-source    | For-profit     | Custom commercial license
| Closed-source    | Not-for-profit | Creative-commons non-commercial license
| Open-source      | For-profit     | GPLv3 copyleft license
| Open-source      | Not-for-profit | GPLv3 copyleft license

In v7, [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) is replacing GPLv3 as the copyleft license used for open-source projects.

We've discovered a few instances of for-profit companies using FullCalendar Premium in closed-source projects, claiming to be GPLv3-compliant via the [SaaS loophole](https://www.mend.io/blog/the-saas-loophole-in-gpl-open-source-licenses/). By switching to AGPLv3, we are closing this loophole and forcing such companies to either purchase a commercial license or stay on v6.

If you are the author of a GPL'd SaaS project that uses FullCalendar Premium and are concerned that you cannot upgrade to v7 due to the license change, please consider switching your project's license to AGPLv3 to avoid abuse of the SaaS loophole.
