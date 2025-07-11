
## 6.1.18 (2025-06-29)

- fix: Optimize custom content-injection rerendering performance (#3003, #7650)
  (Especially important for event rerendering with `eventContent`)

## 6.1.17 (2025-04-01)

- fix: recurring event start/end time not updated when timezone changed  (#5273)
- fix: nowIndicator not updated when timezone changed (#5753)
- fix: nowIndicator lags after returning to suspended tab (#7806)
- fix: "today" date does not update after current time crosses midnight (#3783)
- fix: day header 1 day behind with Luxon & timezone with midnight DST (#7633)
- fix: in timeline, incorrect navLink for granularities other than day/week (#4931)
- fix: validRange in multiMonth view does not render all the days (#7287)

### Angular

- feature: Accept TempateRef for `resourceAreaColumns.cellContent` (#7894), thx @gongAll

## 6.1.16 (2024-12-04)

### Angular

- Angular 19 support (#7824)

## 6.1.15 (2024-07-12)

### General

- fix: dragScroll does not work on multiMonth view (#7324)
- fix: clicking on nowIndicator line ignores the event behind (#6801)
- fix: dates not selectable in Shadow DOM since v6.1.12 (#7685)

### React

- fix: adaptive print version shows events with custom eventContent with zero height (#7419)

## 6.1.14 (2024-06-04)

### React

- React 19 support

### Angular

- Angular 18 support (#7682)

## 6.1.13 (2024-05-22)

### TimeGrid

- follow-up fix to #7533 that improves event-dragging from timed to all-day

### Timeline

- follow-up fix to #7335 that sidesteps issues with dynamically loaded fonts

## 6.1.12 (2024-05-21)

### General

- fix: don't allow event drag-n-drop on obscured calendars (#5026)

### TimeGrid

- fix: when moving event from all-day -> timed, use literal mouse position for event drop (#7533)

### Timeline

- fix: timeline rtl initial scroll on Chrome (#7335)

## 6.1.11 (2024-02-19)

### General

- fix: fc-event-past className not attached to events that end midnight before today (#6120, #6486)
- fix: aria-labelledby on view container should not exist when headerToolbar:false (#6884)

### DayGrid and MultiMonth

- fix: possible infinite recursion with dayGrid, dayMaxEventRows, and many hidden event rows (#7462)
- fix: incorrectly put events under +more link (#7002, #6608, #6900)

### React

- fix: possible +more link numbers incorrect (#7573, #6608, #6900)

### Angular

- fix: Angular 17 SRR error with el.getRootNode (#7550)

## 6.1.10 (2023-11-28)

- feature: Angular version 17 support (#7525)
- fix: Vue 3 background event with custom rendering, not receiving el in eventDidMount (#7524)
- fix: font-icon elements should have role="img" (#7501)
- locale: fix bg (#7493)
- locale: fix ca (#7394)
- locale: fix nl (#7471)

## 6.1.9 (2023-09-21)

- fix: Table selection is not prevented when long pressing to drag events in Safari (#7441)
- fix: Custom event rendering with `white-space:normal` can causes infinite loop (#7447)
- fix: `eventClick` does not fire for allDay events with async provided resources (#7365)
- fix: `eventContent` with Preact nodes (via `createElement`) not rendering (#7342)
- fix: React 16: calling calendarApi methods within useEffect causes fatal error (#7448)
- fix: Angular/Vue2: dot-event element from `eventDidMount` does not exists in the DOM (#7191)
- fix: Angular Universal: `document` is not defined error (#7352)

## 6.1.8 (2023-05-24)

- feature: Luxon 3 plugin (#6957)
- feature: Angular 16 support (#7312)
- fix: React warning with JSX "flushSync was called from inside a lifecycle method" (#7334)
- fix: styling sometimes broken in production Next.js (#7284)
- fix: styling broken in Remix, use official workaround (#7261)
- fix: for React custom views, alias `component` setting to `content` (#7207)
- locale fix: he (#7124)
- locale fix: zh-tw (#7289)

## 6.1.7 (2023-05-08)

- fix: React 18 flickering while rendering event-mirror during drag/resize/select (#7165, #7234)
- fix: React & Vue3: unnecessary calls to `eventContent` for event-mirror during drag/resize/select

## 6.1.6 (2023-04-23)

- fix: timeZone change (w/ tz plugin) not updating recurring event times (#5273)
- fix: timeZone change (w/ tz plugin) not rerendering timed events
- fix: rrule package breaks when imported via cjs, like in Next.js (#7260)

## 6.1.5 (2023-03-21)

- fix: inject static runtime stylesheets near top of head, avoid CSS precedence problems (#7220)
- fix: prevent unnecessary reflows during clicking (potentially solves #7209)
- fix: RRule events w/ wrong dates after being dynamically updated (#7230)
- fix: incorrect calendar dimensions when first rendered in Ionic-Angular (#4976)
- fix: dayGrid timed events w/ custom eventContent fire eventDidMount w/ stale element (#7191)
- fix: resource-timeline crashes when resourceGroupLaneContent is set (#7203)
- fix: buggy dragging of timed event from timegrid more-popover to all-day slot (#7222)
- fix: timeline slots do not fill print version if initially scrolled (#6859)
- fix: Resource::getParent() returns undefined (#7023)
- fix: Preact breaking .d.ts changes, using more specific semver range (#7225)
- fix: broken daygrid-related styles in timegrid/multimonth if daygrid not loaded (#7238)
- fix: support Vue dash-name slot names, for use with script tags (#7078)
- fix: Nuxt 2 error: Cannot read properties of undefined (reading 'isHiddenDay') (#7217)
- fix: Vue 2 SSR broken

## 6.1.4 (2023-02-07)

- fix: bug introduced in v6.1.3 where month-start-text appears within day cells of multimonth view

## 6.1.3 (2023-02-07)

- fix: React: finally fix root cause of state issues (#7066, #7067, #7071)
- fix: Angular: NgClass can only toggle CSS classes expressed as strings (#7182)
- fix: Angular/Vue: accept content-injection function w/ { html } or { domNodes } (#7188)
- fix: monthStartFormat not working with dayGrid views having a custom duration (#7197)

## 6.1.2 (2023-01-31)

Apply v6.1.1's new CJS/ESM/nested-import interop strategy to React/Vue connectors. Details:

- For maximum compatibility with legacy build systems like create-react-app
- Only affects React/Vue2/Vue3 connectors. Assets for standard/premium not generated

## 6.1.1 (2023-01-30)

- fix: Multi-Month not included in fullcalendar-scheduler (#7177)
- fix: Multi-Month has nonexistent 'internal' entrypoint, causing error for skypack (#7176)
- fix: Vue connector should not error-out when given content-injector functions (#7175)
- fix: continued CJS/ESM confusion with certain build tools (#7170, #7113, #7143)

## 6.1.0 (2023-01-29)

- feature: multimonth view (#470, #1140)
  - provides `multiMonthYear` view, which displays 3x4 small months when space permits
  - can extend `multiMonth` view with custom durations
  - can specify `multiMonthMinWidth`, which will force wrapping if months are too small
  - can specify `multiMonthMaxColumns: 1` to guarantee one column of months
  - can specify `multiMonthTitleFormat` to customize text above each month
- feature: improved daygrid behavior when multiple weeks/months
  - when many rows, instead of condensing rows, guaranteed min-height, for forcing scrollbars
  - displaying month names for month switchovers, controlled by `monthStartFormat`
  - a new stock `dayGridYear` view
- feature: in daygrid/multimonth, +more link has hover effect with grey background color
- feature: `@fullcalendar/web-component` has `shadow` option
- feature/fix: from content-injection hooks, returning `true` does default rendering (#7110)
- feature/fix: CSP nonce value passed to dynamically-injected stylesheets (#7104)
- fix: React event duplication while DnD and updating redux store (#7066, #7067, #7071)
- fix: styles are not applied correctly for elements using shadow DOM (#7118)
- fix: custom view `content` with JSX doesn't render (#7160)
- fix: `resourceAreaHeaderContent` overrides `headerContent` in resource columns (#7153)
- fix: update moment-timezone for latest tz data (#6987)
- fix: dayGrid w/ `showNonCurrentDates: false` can have final squished row (#7162)
- fix: root-level repo with git submodules shouldn't force ssh protocol (#6714)
- fix: in `fullcalendar` bundle, `FullCalendar.Preact` exposed for interop with plugins
- fix: EventApi::toPlainObject now returns `allDay` property
- locale: add weekTextLong for French locale (#6731, #7144)
- locale: replace "évènement" in French locales (#7108)
- locale: add Uzbek cyrillic translation (#6853)
- locale: update Galician locale (#7103)
- locale: update pt-br locale (#7106)

## 6.0.4 (2023-01-13)

React:

- FIX: Remove need to import `react-dom/test-utils` for `act()` (#7140, #7141)

## 6.0.3 (2023-01-11)

Standard/premium

- FIX: Time grid and timeline more-events link positioned incorrectly (#7134, #7115)
- FIX: file extensions of CJS/ESM dist files changed to support Jest (#7113)

React:

- FIX: Maximum update depth exceeded w/ eventContent & dayMaxEvents (#7116)
- FIX: Certain cases of broken rendering w/ React 17 and content-injection (#7127, #7131)
- FIX: Content-injection not using updated function closures for rendering (#7119)

Vue 3:

- FIX: With Webpack, fullySpecified:false workaround no longer needed (#7125, #7114)

## 6.0.2 (2022-12-27)

Standard/premium:

- FIX: unable to resize an event smaller after initial resize (#7099)

React:

- FIX: re-rendering loop error with navLink and dayCellContent (#7107)

Angular:

- FIX: resource content-injection, when resource element destroyed, throws JS error (#7105)

Vue 2:

- FIX: resource content-injection, when resource element destroyed, throws JS error

## 6.0.1 (2022-12-20)

Standard/premium:

- FIX: Property `type` does not exist on type `ViewApi` (#7056)
- FIX: Expose `globalLocales` publicly for importing on-demand (#7057)

React:

- FIX: multi-day events rendered by eventContent are overlapping each other (#7089)

Angular:

- FIX: error with eventContent & list view (#7058)

## 6.0.0 (2022-12-13)

[V6 Release Notes and Upgrade Guide](https://fullcalendar.io/docs/v6/upgrading-from-v5)

Changes since final beta:

- FIX: certain ng-template names don't work ([angular-426])
- FIX: minify CSS that is embedded into JS files
- FIX: more informational README files in published packages
- FIX: daygrid events sometimes not correctly positioned with Vue connectors
- BREAKING: @fullcalendar/icalendar now has ical.js peer dependency

[angular-426]: https://github.com/fullcalendar/fullcalendar-angular/issues/426

## 6.0.0-beta.4 (2022-12-07)

Standard/Premium:

- FIX: jsDelivr default URLs have wrong mime type (#7045)
- FIX: Unmet peer dependency "moment" warning from moment-timezone (#6839)
- FIX: fullcalendar and fullcalendar-scheduler packages accidentally include sourcemaps

Angular:

- FIX: BrowserModule incompatible with lazy-loaded module ([angular-423])
- FIX: Inputs should accept undefined/null for compatibility with async ([angular-424])
- FIX: content-injections bugs with drag-n-drop and rerendering

Vue:

- FIX: Remove global js 'default' from export maps (#7047)
- FIX: content-injections bugs with drag-n-drop and rerendering

React:

- FIX: Remove global js 'default' from export maps (#7047)

[angular-423]: https://github.com/fullcalendar/fullcalendar-angular/issues/423
[angular-424]: https://github.com/fullcalendar/fullcalendar-angular/issues/424

## 6.0.0-beta.3 (2022-12-01)

Bugfixes:

- Wrong typing for events function and errorCallback (#7039)
- Error with global bundle and individual global locales (#7033)
- Fix package.json lint warnings (#7038)
- Fixes in React/Angular connectors (see individual changelogs)

## 6.0.0-beta.2 (2022-11-22)

See https://fullcalendar.io/docs/v6/upgrading-from-v5

## 5.11.3 (2022-08-23)

- fixed: timeline view (without resources) problem with expanding height (#5792)
- fixed: locales not working in IE11 (#6790)

## 6.0.0-beta.1 (2022-08-03)

FullCalendar no longer attempts to import .css files. Instead, FullCalendar's JS is responsible for
injecting its own CSS. This solves many issues with third party libraries:

- _Webpack_: no longer necessary to use css-loader
  (see [example project][webpack-css-hack])
- _Rollup_: no longer necessary to use a css-processing plugin (like postcss)
  (see [example project][rollup-css-hack])
- _NextJS_: no longer necessary to ignore and manually import .css files
  (see [example project][next-css-hack], #6674)
- _Angular 14_ is incompatible with FullCalendar v5 ([see ticket][angular-css-bug]). FullCalendar v6
  restores support for Angular 14 and above, but does so via a completely different package. Please
  use the new FullCalendar Web Component package (`@fullcalendar/web-component`), which can
  integrate with Angular via the [method described here][angular-web-components].

[webpack-css-hack]: https://github.com/fullcalendar/fullcalendar-examples/blob/10fe58abfc94457c7582af3948b3764cd17e7960/webpack/webpack.config.js
[rollup-css-hack]: https://github.com/fullcalendar/fullcalendar-examples/blob/10fe58abfc94457c7582af3948b3764cd17e7960/rollup/rollup.config.js
[next-css-hack]: https://github.com/fullcalendar/fullcalendar-examples/tree/10fe58abfc94457c7582af3948b3764cd17e7960/next
[angular-css-bug]: https://github.com/fullcalendar/fullcalendar-angular/issues/403
[angular-web-components]: https://coryrylan.com/blog/using-web-components-in-angular

## 5.11.2 (2022-07-26)

- fixed: React Strict Mode, dateSet, and "Maximum update depth exceeded error" (#5935, [react-185])
- fixed: React Strict Mode, timeline scrolling not synced ([react-192])
- fixed: React, datesSet with object-like dateIncrement, "Maximum update depth..." ([react-131])

[react-185]: https://github.com/fullcalendar/fullcalendar-react/issues/185
[react-192]: https://github.com/fullcalendar/fullcalendar-react/issues/192
[react-131]: https://github.com/fullcalendar/fullcalendar-react/issues/131

## 5.11.1 (_see dates in tickets_)

- react fix: restore accidentally-removed support for React 17 ([react-182])
- vue3 fix: Cannot target calendar api with several instances ([vue-155])

[react-182]: https://github.com/fullcalendar/fullcalendar-react/issues/182
[vue-155]: https://github.com/fullcalendar/fullcalendar-vue/issues/155

## 5.11.0 (2022-04-08)

- internal changes for compatibility with React 18

## 5.10.2 (2022-02-09)

- bootstrap 5 support, via `@fullcalendar/bootstrap5` package (#6299)
- luxon 2 support, via `@fullcalendar/luxon2` package (#6502)
- angular 13 support ([ang-387][ang-387])

[ang-387]: https://github.com/fullcalendar/fullcalendar-angular/issues/387

## 5.10.1 (2021-11-02)

- locale strings for the recent WAI-ARIA improvements:
  - nb (#6610)
  - de (#6597)
  - sv (#6592)

## 5.10.0 (2021-10-13)

- feature: WAI-ARIA improvements:
  - toolbar (#6521)
    - human-readable `title` attributes on all buttons. new options:
      - `buttonHints`
      - `customButtons.hint`
      - `viewHint` (ex: `$0 view` -> `"month view"`)
    - `aria-labelledby` attribute connecting view-title with view-container
  - event elements (#3364)
    - previously, only events with an `event.url` property were tabbable by the end-user.
      now, events _without_ urls can be made tabbable by enabling `event.interactive` or by
      enabling the calendar-wide `eventInteractive` option.
    - when focused, pressing enter/spacebar will trigger an `eventClick`
  - more-links and popover (#6523)
    - human-readable `title` attributes on "+more" links via new option `moreLinkHint`
    - when focused, pressing enter/spacebar will open popover
    - `aria-controls`/`aria-expanded` attributes connecting link to popover
    - `aria-labelledby` attribute connecting popover-title to popover
    - `aria-label` attribute describing "X" close icon via new option `closeHint`
    - pressing escape key closes popover
  - nav-links (#6524)
    - human-readable `title` attributes on all navLinks via new option `navLinkHint`
    - when focused, pressing enter/spacebar will trigger `navLinkClick`
  - table-based views (#6526)
    - all cells within thead elements have been made into `<th>` tags
    - retrofit the necessarily non-ARIA-friendly table markup with `role` tags. the root table is a
      `grid`, children have been given `rowgroup`/`row`/`columnheader`/`rowheader`/`cell`, and
      non-functional table elements have been given `presentation`.
    - in timegrid views, the time-axis axis has been removed from the accessibility tree
  - list-view (#6525)
    - introduced a table-header specifically for screen readers. header cells label the time/event
      columns using the following new options: `timeHint` and `eventHint`
    - removed the "dot" column from the accessibility tree
- feature: date formatting option `week` now accepts `'long'` if locale defines `weekTextLong`
- bugfix: timeline-view events hidden by `eventMaxStack` sometimes appear over other events (#6543)
- bugfix: daygrid event rendering with `dayMaxEventRows` and custom `eventOrder` can cause infinite loop (#6573)
- bugfix: content-injected html/domNodes as view-specific options don't clear when switching views (#6079, #6555)
- bugfix: more compliant CSS with Sass processors (#6564)
- locale: added si-lk (#6553)

HELP WANTED populating new options in locales (examples: [es][es-aria-example], [en-GB][en-aria-example])

- `buttonHints`
- `viewHint`
- `weekTextLong`
- `moreLinkHint`
- `navLinkHint`
- `closeHint`
- `timeHint`
- `eventHint`

[es-aria-example]: https://github.com/fullcalendar/fullcalendar/commit/63cd61bd89ae56642e76e3ea8b3a44cbd3fe2555
[en-aria-example]: https://github.com/fullcalendar/fullcalendar/commit/d8e33a04ecc9bd8dd54f1d2c39aaa7ed919f896c

## 5.9.0 (2021-07-28)

- fix: dayGrid events sometimes overlap when eventOrderStrict:true (#6393)
- fix: timeline events incorrectly positioned when uneven heights (#6395)
- fix: dayGrid events snap to top of cell while resizing (#6308)
- fix: duplicate events in dayGrid popover (#6397)
- fix: sticky elements within header of timeline views not sticking
- fix: resource-timeline views with sticky elements not working within shadow DOM (#5888)
- fix: event dragging auto-scroll does not work within shadow DOM (#6428)
- fix: cannot resize timeline events via touch within shadow DOM (#6429, #6449)
- fix: error with eventContent, domNodes, and view-specific options (#6079)
- fix: times events do not get printed in Firefox using adaptive plugin (#6438)
- fix: icalendar events with RECURRENCE-ID are displayed twice (#6451)
- fix: typing of Event::setProp does not allow boolean (#6445)
- fix: typing fix rrule's freq property (#6235)
- locale: added Samoan (#6368)
- locale: added Central Kurdish (#6400)
- locale: added Khmer (#6416)
- locale: fixed Hungarian (#6229)

## 5.8.0 (2021-06-15)

- fix: events not rendering in Jest environment (#6377)
- fix: prev button sometimes ineffective when dateIncrement < view's duration (#5319, #4678)
- fix: changeDate ineffective when date already in view (#4929)
- fix: upgrade tslib to guarantee \_\_spreadArray (#6376)
- fix: eventOrderStrict positioning problems (#5767)

## 5.7.2 (2021-06-03)

- fixed table-related Chrome 91 bug causing timegrid view with allDaySlot:false and certain
  custom CSS to appear broken (#6338, #6343)

## 5.7.1 (2021-06-02)

- updated Angular connector to support Angular 12 ([angular-369](https://github.com/fullcalendar/fullcalendar-angular/issues/369))
- new Vue 3 connector ([vue-131](https://github.com/fullcalendar/fullcalendar-vue/issues/131))

## 5.7.0 (2021-05-11)

- feature: +more popover for timegrid (#4218)
- feature: +more popover for timeline (#4827)
- feature: eventShortHeight for timegrid
- feature: eventMinHeight for timegrid (#961)
- feature: eventMinWidth for timeline (#4823)
- feature: eventOrderStrict flag to ensure strict event ordering (#5766, #5767)
- feature: scrollTimeReset flag to not reset scroll state across dates (#6178)
- fix: events can be completely hidden behind others with custom eventOrder (#6019)
- fix: less homogeneous event widths in timegrid (#5004)
- fix: +more shows on days with less events than dayMaxEvents (#6187)
- fix: +more popover can be scrolled down with page scroll (#5532)
- fix: +more popover falls behind the sticky dates header (#5782)
- fix: all-day events are displayed in front of the sticky header (#5596)
- fix: respect duration in eventOrder as highest precedence (#5481)
- fix: refetching events should keep event popover open (#3958)
- fix: accidental +more popover close with shadow dom (#6205)
- fix: dayGrid events stretched out of cells in print media (#6300)
- dev: when attempting `npm install` in the dev repo, will throw an error saying to use yarn (#5504)
- dev: ensure building on windows works (#5366)
  obscure breaking changes:
- renamed fc-timegrid-event-condensed className to fc-timegrid-event-short
- removed config.timeGridEventCondensedHeight

## 5.6.0 (2021-03-28)

- feature: icalendar events receive URL (#6173)
- feature: icalendar events receive location, organizer, description in extendedProps (#6097)
- fix: resizing resource column larger does not always update column widths (#6140)
- fix: print view cut off for wide liquid-width calendar (#5707)
- fix: event start time is limited by what is visible by slotMinTime (#6162)
- fix: Event::setProp can't change the id (#4730)
- fix: icalendar event source does not update on refreshEvents (#6194)
- fix: business hours per resource do not fill row height with expandRows (#6134)
- fix: icalendar recurring events ignoring count rule (#6190)
- fix: icalendar recurring timed-events with wrong times (#6139, #6106)
- fix: removed accidental ical.js dependency in common's package.json (#6171)
- fix: for gcal events, restore extendedProperties (#5083)
- fix: for gcal events, make attachments available (#5024)
- fix: can't parse rrule strings with newlines after UNTIL statements (#6126)
- locale: fixed typos in Tamil (#6115)
- locale: added Bengali (#6096)
- breaking-change: for icalendar recurring event that don't specify dtend/duration,
  the resulting Event object's end is now determined by forceEventDuration, defaultTimedEventDuration,
  and defaultAllDayEventDuration, whereas previously it was _sometimes_ null.

## 5.5.1 (2021-01-16)

- view styles lost after changing to view with allDaySlot:false, view-specific dayHeaders (#6069)
- type error when slotDuration is in whole days (#5952)
- rrule byweekday property not working (#6059)
- support for recurring events in iCalendar feed (#6068)
- add Indian/Tamil language support (#6061)
- error in @fullcalendar/scrollgrid with NextJS (SSR) (#6037)
- removed unnecessary use of Promise in icalendar package. restores IE11 compatibility

## 5.5.0 (2020-12-19)

- icalendar support (#1580)
- support exrule and exdate for rrule plugin (#4439)
- support for Angular 11
- fix: recurring events missing with dtstart in UTC and timeZone not UTC (#5993)
- fix: events can have a gap between and take more rows than dayMaxEventRows when using eventOrder (#5883)
- fix: events dragged from the More popup to another resource drop on the wrong resource (#5593)
- fix: week number rendered twice in ResourceTimeGridView (#5890)
- fix: nowIndicator not positioned correctly for resourceTimelineYear view with slot duration 1 month (#5999)
- fix: oldResource and newResource missing from EventDropArg typescript definition (#6010)
- fix: loading callback fires before resources are done loading and again after (#5896)
- fix: locales are not compatible with IE 11 (#6014)
- fix: IE11 freezes trying to display dayGrid with dayMinWidth (#5971)
- fix: calling revert func within eventChange would erase affected event
- locale: add Armenian
- locale: add Austrian
- locale: add Welsh
- locale: add Esperanto
- locale: improve Dutch
- breaking-change: EventDropArg typescript type moved from interaction package to core

## 5.4.0 (2020-11-11)

- new fixedMirrorParent settings for drag-n-drop. workaround for #4673
- rrule exclusion doesn't work while adding the 'Z' char for RRule datetimes (#5726)
- fix JS error when using dayMaxEventRows on small screens (#5850, #5863)
- export types for ResourceFunc and ResourceInput (#5797)
- more descriptive license key warning (#5910)
- better compatibility with Webpack 5, deeming `resolve.fullySpecified` unnecessary (#5822)
- dist files now include a CJS file. ESM is still used by default in most environments (#5929)

## 5.3.2 (2020-09-06)

fix: more-link sometimes incorrectly positioned behind events (#5790)

## 5.3.1 (2020-09-04)

bugfixes:

- error with stickyScrollings.updateSize in certain 3rd-party environments (#5601)
- rrule exclusion doesn't work while adding the 'Z' char for RRule datetimes (#5726)
- more links sometimes hidden behind events with dayMaxEventRows (#5771)
- wrong version text in dist js files (#5778)

## 5.3.0 (2020-08-12)

bugfixes:

- timelineDay with maxTime after 24:00, drag-n-drop behavior (#3900)
- Resizing on touch devices loses selection (#5706)
- Alignment of events in dayGridWeek when weekNumbers:true (#5708)
- Events are not printed in order according to their start time (#5709)
- scrollTime does not always work on prev/next (#5351)
- render method not rerendering resourceLabelContent (#5586)
- timeGrid with dayMinWidth, weekNumber cell collapses (#5684)
- fix luxon connector browser-global JS file including actual luxon lib

## 5.2.1 (2020-07-30)

Fixed misconfigured bundledDependencies. Only affected @fullcalendar/core NPM package.

## 5.2.0 (2020-07-30)

features:

- provide browser-global JS file for all packages (#5617)
- indicate which row (or format) is being rendered in slotLabelContent (#5516)
- nepali locale (#5574)

bugfixes:

- compatible with server-side rendering (SSR) (#4784)
- background events don't fire eventClick in daygrid when clicked on day header (#5560)
- background events don't fire eventClick in timegrid (#5579)
- bigger touch hit area for selected list-item events in daygrid (#5635)
- CustomButtonInput click argument type is incorrect (#5432)
- parse rrule strings the same as objects (#5326)
- navLinks are not clickable if slotLabelFormat is a moment format (#5317)
- unswitch CSS variables in v-event.css (#5552)
- time slots not aligned to labels with dayMinWidth and Bootstrap theme (#5600)
- expandRows broken for time slat labels when horizontal scrolling (#5674)
- render method not rerendering resourceLabelContent (#5586)
- eventReceive/eventLeave is missing revert and relatedEvents (#5610)
- daygrid event changes between list-item and block, depending on start date (#5634)
- default scrollTime is not appropriate for month/year view (#5645)
- naturalBound is null with CSP (#5556)
- does not support Content Security Policy (CSP) nonce, only unsafe-inline css (#4317)
- RTL timeline scrolling messed up with nowIndicator (#5632)
- scrollTime does not always work when changing views (#5351)
- (p)react maximum recursion with specific resize/scrollbars (#5558, #5606)
- dayGridMonth overflows in Firefox (#5524)

## 5.1.0 (2020-06-29)

- fix: css variables for default event border and bg color switched (#5551)
- fix: eventContent moves arrow event length indicators (#5547)
- fix: wrong ts types for bootstrapFontAwesome settings (#5548)
- fix: Dash between event start and end times is "undefined" with
  eventTimeFormat and moment plugin (#5493)
- fix: Events get displaced due to incorrect collisions detected depending on
  browser, zoom level (#5549)
- fix: Resource rows are initially squished in Chome in timeline view with
  contentHeight: "auto" and JSON resources (#5545)
- fix: unwanted text selection while dragging in Safari
- fix: reintroduce list-view color-change on event-row hover

## 5.0.1 (2020-06-23)

- fix: give type attribute to buttons in header to prevent form submit (#5529)
- fix: time axis customization via slotLabelContent causes ugly spacing (#5526)
- fix: export EventSourceFunc in type definitions (#5530)
- fix: prevent timed background events from appearing in daygrid
- fix: change CSS for when 'today' background color is applied
  - fixes bootstrap-themed popover incorrectly being colored semi-transparent
  - removes yellow color from date headers in timegrid view, which looks better

## 5.0.0 (2020-06-21)

Changes since RC:

- CSS fix for timegrid events. overflow hidden on time text
- fix where dayMaxEvents would not readjust when increasing height of calendar
- don't set custom text colors on list-view events or list-item events (#5518)
- fix event dot color not being customizable (#5522)
- fix for calendar updating when no options were reset (#5519)
- fix typescript def omission of eventSource 'method' prop (#5505)
- fix typescript def problem with schedulerLicenseKey again (#5462)

## 5.0.0-rc (2020-06-15)

Changes since beta.4:

- breaking changes:
  - renamed `datesDidUpdate` to `datesSet` and added more props to the arg
  - for `eventResize` callback arg, renamed `prevEvent` to `oldEvent`
  - resources are ordered by ID by default. no longer sort by natural order
- new features:
  - system for overriding CSS variables
  - timegrid event titles are sticky-positioned while scrolling
  - eventDrop now receives relatedEvents prop
  - eventResize now receives relatedEvents prop
  - eventReceive now receives relatedEvents prop and a revert function
  - eventLeave now receives relatedEvents prop and a revert function
  - eventAdd
  - eventChange
  - eventRemove
  - eventsSet
  - initialEvents
  - Event::toPlainObject, Event::toJSON
  - Event::startStr, Event::endStr
  - Calendar::addEvent accept `true` for source
  - resourceAdd
  - resourceChange
  - resourceRemove
  - resourcesSet
  - initialResources
  - Resource::setProp
  - Resource::setExtendedProp
  - Resource::toPlainObject, Resource::toJSON
  - View::calendar
  - TypeScript definitions for Vue connector
- bugfixes:
  - Event popover display issues with many events (#5471)
  - Jest test runner cannot find fullcalendar modules (#5467)
  - Incorrect version of tslib required (#5479)
  - License key option unknown, error in console (#5462)
  - @fullcalendar/common has no exported member ScrollGridChunkConfig (#5459)
  - event title should display on same line as time for 30 minute events in grid views (#5447)

## 5.0.0-beta.4 (2020-05-26)

Changes since beta.3:

- features:
  - improved printing for timeline view (#4813)
- fixes:
  - `eventDisplay` not working (#5434)
  - typescript errors when compiling with tsc (#5446)
  - `slotLabelFormat` as array not working (#5450)
  - more exports of typescript interfaces (#5452)

## 5.0.0-beta.3 (2020-05-20)

Changes since beta.2:

- features:
  - the `@fullcalendar/react` plugin now uses React's real virtual DOM engine
  - typescript definitions for every part of the API. baked in, so won't fall out of date.
  - console warnings when given unknown options/props/listeners
- minor API changes:
  - `windowResize` and `datesDidUpdate` now receive an arg with a ViewApi object
  - `eventSourceSuccess`, `eventSourceFailure`, and `moreLinkClick` can't be attached using .on()
- distribution:
  - working sourcemaps in all packages (#4719)
  - the `fullcalendar` and `fullcalendar-scheduler` bundles
    - are published as browser-globals only. no longer published as UMDs
    - now include the Google Calendar connector in their main files
    - don't provide copies of the other non-bundled plugins anymore (like rrule, moment, moment-timezone)
    - both receive locale/locale-all entrypoints that will be automatically connected when loaded
- fixes:
  - Week numbers are not clickable as navLinks (#5427)
  - Events of different heights in the same resource can be positioned incorrectly (#5413)
  - Events displayed on wrong date when pushed down by previous events that span multiple days (#5408)
  - `textColor` setting in Event Object not working anymore (#5355)
  - `resourceAreaWidth` is not updated when changed with setOption (#5368)
  - JS error when printing timeline view with expandRows (#5399)
  - fixed Scheduler license keys not working with `fullcalendar-scheduler` bundle

## 5.0.0-beta.2 (2020-04-14)

Changes since beta.1:

- feature: sticky header dates and footer scrollbar
- feature: daygrid events with times render differently by default, with a dot
- feature: a `datesDidUpdate` callback
- renamed options:
  - `defaultView` -> `initialView`
  - `defaultDate` -> `initialDate`
  - `header` -> `headerToolbar`
  - `footer` -> `footerToolbar`
  - `allDayDefault` -> `defaultAllDay`
  - `eventRendering` -> `eventDisplay` (and `display` in event objects)
  - `dir` -> `direction`
- fix: sometimes event dragging and selecting broken after switching views (#5346)
- fix: most likely fixed problem with infinite loop (#5352)
- fix: timeline scrolling sometimes gets out of sync when using a scroll wheel (#4889)
- fix: many other little bugfixes

View the [full changelog](https://fullcalendar.io/docs/v5/upgrading-from-v4)

## 5.0.0-beta.1 (2020-04-06)

Read the [blog post](https://fullcalendar.io/blog/2020/04/v5-beta-released)

## 4.4.0 (2020-02-11)

- configurable `googleCalendarApiBase` (#4974)
- fix: navigating prev/next quickly might miss an event-source fetch (#4975)
- new locales: ug (#180), uz (#3553)
- locale fixes: fr (#5236), az (#5185), th (#5069), el (#5010), pt-br (#3812)

## 4.3.1 (2019-08-10)

- `FullCalendar.version` had incorrect text
- scheduler's releaseDate not written correctly,
  resulting in license key warning always showing.

## 4.3.0 (2019-08-09)

- HTML/CSS for timeline events has been refactored. BREAKING CHANGE if customized CSS.
- timeline event titles sometimes overflow outside of element when time (#4928)
- eventStartEditable false is not compatible with eventResourceEditable true (#4930)
- calling Calendar::render after initial render causes bad sizing (#4718, #4723)
- when list views destroyed, wouldn't call eventDestroy (#4727)
- solve JS errors when switching views and using showNonCurrentDates (#4677, #4767)
- prevent unnecessary scrollbars from appearing in daygrid views (4624, #4732)
- draggedEvent start time is null in eventAllow when switching resources (#4932)
- scrollToTime method honors a whole duration, not just a time (#4935)
- some background events wouldn't recieve eventClick or hovering (#3148, #4750)
- fix infinite recursion when custom view type is itself (#4198)
- respect firstDay setting when weekNumberCalculation set to ISO (#4734)
- fix typo in Danish (#4708)
- adjust typescript def for setExtendedProp (#4679)
- googleCalendarApiKey added to typescript options definition (#4772)
- moment/luxon formatting same-day range with dash (#4686)
- error importing moment plugin into typescript project (#4691, #4680, #4580)
- refs to sourcemaps removed from dist (accidentally included in previous version)
- distributing an ESM file, referenced by package.json's `module`
- using a more portable SASS (#4626, #4651, #4671)

## 4.2.0 (2019-06-02)

- fix recurring event expansion when event starts before view and has duration (#4617, #4635)
- simple event recurring now allows a duration property on the event object
- internal Calendar::setOptions method removed (never meant to be public)

## 4.1.0 (2019-04-24)

- scrollToTime method (#467)
- ISO8601 datetime strings with no 'T' not parsed in Safari (#4610)
- all-day dropped events after third not being draggable (#4616)
- dateClick/selecting sometime report wrong dates after calendar resize (#4608)
- js error when using navLinks with header=false (#4619)
- js error when more+ link and multiple async event sources (#4585)
- timeGridEventMinHeight is not defined in OptionsInput interface (#4605)
- Interdependent package semvers with carrot, use tilde (#4620)
- dayRender now called for day columns in timeGrid views

## 4.0.2 (2019-04-03)

Bugfixes:

- eventAllow and constraints not respected when dragging event between calendars
- viewSkeletonRender now in typedefs (#4589)
- invalid draggedEvent properties in eventAllow for external dnd (#4575)
- forceEventDuration not working with external dnd (#4597)
- rrule displaying time when allDay is true (#4576)
- rrule events not displaying at interval start (#4596)
- prev button not initially working when starting on 31st of a month (#4595)
- clicking X in popover generating a dayClick (#4584)
- locale file used as single script tag not affecting calendar locale (#4581)
- header "today" button not translated for pt and pt-br (#4591)
- fa locale typo (#4582)

## 4.0.1 (2019-03-18)

Read about all the changes in v4:
https://fullcalendar.io/docs/upgrading-from-v3

Obscure breaking changes from v3->v4 not mentioned elsewhere:

- `touchMouseIgnoreWait` moved to `(packageRoot).config.touchMouseIgnoreWait`
- `dataAttrPrefix` moved to `(packageRoot).config.dataAttrPrefix`

Advancements since latest prerelease:

- New styling for buttons and icons in header. New styling for events.
- Bugfixes: #4539, #4503, #4534, #4505, #4477, #4467, #4454, #4458, #4483,
  #4517, #4506, #4435, #4498, #4497, #4446, #4432, #4530

NOTE: version "4.0.0" was skipped because of an NPM publishing error

## 3.10.0 (2019-01-10)

POTENTIALLY BREAKING CHANGE:
The jquery and moment packages have been moved to peerDependencies. If you are using
NPM to install fullcalendar, you'll need to explicitly add jquery and moment as
dependencies of your project. NPM will not install them automatically. (#4136, #4233)

New Features:

- events from a Google Calendar event source will receive extended props (#4123)
- export more classes and util functions (#4124)
- new locales: zh-hk (#4266), be (#4274)

Bugfixes:

- not accepting dayClicks/selects because of overflow-x:hidden on html/body (#3615)
- event end time not displayed when duration is one slot, in agenda view (#3049)
- switching views before event fetch resolves, JS error (#3689)
- single-day allDay event not showing when time is specified (#3854)
- prev button doesn't work when previous days are hidden by hiddenDays and dayCount
  is greater than dateIncrement (#4202)
- calendar locale not used in all moments objects (#4174)
- background event background color does not completely fill cells in Chrome (#4145)
- provide a delta for eventResize when resizing from start (#4135)
- IE11 memory leak from not removing handler correctly (#4311)
- make touchstart handlers passive (#4087)
- fixed typescript definition for: eventAllow (#4243), selectAllow (#4319)
- fixed locales: de (#4197, #4371), hu (#4203), tr (#4312), ja (#4329)

## 3.9.0 (2018-03-04)

- Bootstrap 4 support (#4032, #4065, thx @GeekJosh)
- add OptionsInput to the fullcalendar.d.ts exports (#4040, #4006)
- columnHeaderFormat/columnHeaderHtml/columnHeaderText in .d.ts file (#4061, #4085)
- list-view auto-height not working (#3346, #4071, thx @WhatTheBuild)
- bump momentjs minimum version to 2.20.1, for locale fixes (#4014)
- swedish week header translation fix (#4082)
- dutch year translation (#4069)

## 3.8.2 (2018-01-30)

Bugfixes:

- Fix TypeScript definitions file with strictNullChecks (#4035)

## 3.8.1 (2018-01-28)

Bugfixes:

- TypeScript definition file not compatible with noImplicitAny (#4017)
- ES6 classes are not supported for grid class (#3437)
- day numbers in month view should be localized (#3339)
- select helper is resizable, causes js error (#3764)
- selecting over existing select helper causes js error (#4031)
- eventOrder doesn't work on custom fields (#3950)
- aria label on button icons (#4023)
- dynamic option changes to select/overlap/allow doesn't cause rerender

Locales:

- added Georgian (#3994)
- added Bosnian (#4029)

## 3.8.0 (2017-12-18)

- new settings for month/agenda/basic views (#3078):
  - `columnHeaderFormat` (renamed from `columnFormat`)
  - `columnHeaderText`
  - `columnHeaderHtml`
- TypeScript definition file (fullcalendar.d.ts) included in npm package (#3889)
- codebase using SASS, though not taking advantage of it yet (#3463)
- codebase fully ported to TypeScript / Webpack
- Afrikaans locale fix (#3862)

## 3.7.0 (2017-11-13)

Bugfixes:

- `render` method does not re-adjust calendar dimension (#3893)
- when custom view navigates completely into hidden weekends, JS error ([scheduler-375])

Other:

- in themes.html demo, fixed broken Bootswatch themes (#3917)
- moved JavaScript codebase over to TypeScript
  (same external API; embedded typedefs coming soon)

[scheduler-375]: https://github.com/fullcalendar/fullcalendar-scheduler/issues/375

## 3.6.2 (2017-10-23)

Bugfixes:

- Google Calendar event sources not calling `loading` callback (#3884)
- `eventDataTransform` w/ eventConstraint shouldn't be called during event resizing (#3859)
- `navLinks` would go to the previously navigated date (#3869)
- `nowIndicator` arrow would repeatedly render (#3872)
- fc-content-skeleton DOM element would repeatedly render on navigation in agenda view

## 3.6.1 (2017-10-11)

Bugfixes:

- JSON feed event sources always requesting current page (#3865)
- multi-day events appearing multiple times in more+ popover (#3856)

## 3.6.0 (2017-10-10)

Features:

- `agendaEventMinHeight` for guaranteeing height (#961, #3788) thx @Stafie
- `columnHeader` can be set to `false` to hide headings (#3438, #3787) thx @caseyjhol
- export all View classes (#2851, #3831)
- `updateEvent`, update complex attributes (#2864)
- Albanian locale (#3847) thx @alensaqe

Bugfixes:

- objects used as non-standard Event properties ignored by `updateEvent` (#3839)
- listDay error if event goes over period (#3843)
- `validDays` with `hiddenDays`, js error when no days active (#3846)
- json feed Event Source object no longer has `url` property (#3845)
- `updateEvent`, allDay to timed, when no end, wrong end date (#3144)
- `removeEvents` by `_id` stopped working (#3828)
- correct `this` context in FuncEventSource (#3848) thx @declspec
- js event not received in unselect callback when selecting another cell (#3832)

Incompatibilities:

- The `viewRender` callback might now be fired AFTER events have been rendered
  to the DOM. However, the eventRender/eventAfterRender/eventAfterAllRender callbacks
  will always be fired after `viewRender`, just as before.
- The internal `Grid` class (accessed via `$.fullCalendar.Grid`) has been removed.
  For monkeypatching, use DayGrid/TimeGrid directly.

## 3.5.1 (2017-09-06)

- fixed loading trigger not firing (#3810)
- fixed overaggressively fetching events, on option changes (#3820)
- fixed event object `date` property being discarded (tho still parsed) (#3819)
- fixed event object `_id` property being discarded (#3811)

## 3.5.0 (2017-08-30)

Features:

- Bootstrap 3 theme support (#2334, #3566)
  - via `themeSystem: 'bootstrap3'` (the `theme` option is deprecated)
  - new `bootstrapGlyphicons` option
  - jQuery UI "Cupertino" theme no longer included in zip archive
  - improved theme switcher on demo page (#1436)
    (big thanks to @joankaradimov)
- 25% event rendering performance improvement across the board (#2524)
- console message for unknown method/calendar (#3253)
- Serbian cyrilic/latin (#3656)
- available via Packagist (#2999, #3617)

Bugfixes:

- slot time label invisible when minTime starts out of alignment (#2786)
- bug with inverse-background event rendering when out of range (#3652)
- wrongly disabled prev/next when current date outside of validRange (#3686, #3651)
- updateEvent, error when changing allDay from false to true (#3518)
- updateEvent doesn't support ID changes (#2928)
- Promise then method doesn't forward result (#3744)
- Korean typo (#3693)
- fixed switching from any view to listview, eventAfterRender isn't called (#3751)

Incompatibilities:

- Event Objects obtained from clientEvents or various callbacks are no longer
  references to internally used objects. Rather, they are static object copies.
- `clientEvents` method no longer returns events in same order as received.
  Do not depend on order.

## 3.4.0 (2017-04-27)

- composer.json for Composer (PHP package manager) (#3617)
- fix toISOString for locales with non-trivial postformatting (#3619)
- fix for nested inverse-background events (#3609)
- Estonian locale (#3600)
- fixed Latvian localization (#3525)
- internal refactor of async systems

## 3.3.1 (2017-04-01)

Bugfixes:

- stale calendar title when navigate away from then back to the a view (#3604)
- js error when gotoDate immediately after calendar initialization (#3598)
- agenda view scrollbars causes misalignment in jquery 3.2.1 (#3612)
- navigation bug when trying to navigate to a day of another week (#3610)
- dateIncrement not working when duration and dateIncrement have different units

## 3.3.0 (2017-03-23)

Features:

- `visibleRange` - complete control over view's date range (#2847, #3105, #3245)
- `validRange` - restrict date range (#429)
- `changeView` - pass in a date or visibleRange as second param (#3366)
- `dateIncrement` - customize prev/next jump (#2710)
- `dateAlignment` - custom view alignment, like start-of-week (#3113)
- `dayCount` - force a fixed number-of-days, even with hiddenDays (#2753)
- `showNonCurrentDates` - option to hide day cells for prev/next months (#437)
- can define a defaultView with a duration/visibleRange/dayCount with needing
  to create a custom view in the `views` object. Known as a "Generic View".

Behavior Changes:

- when custom view is specified with duration `{days:7}`,
  it will no longer align with the start of the week. (#2847)
- when `gotoDate` is called on a custom view with a duration of multiple days,
  the view will always shift to begin with the given date. (#3515)

Bugfixes:

- event rendering when excessive `minTime`/`maxTime` (#2530)
- event dragging not shown when excessive `minTime`/`maxTime` (#3055)
- excessive `minTime`/`maxTime` not reflected in event fetching (#3514)
  - when minTime is negative, or maxTime beyond 24 hours, when event data is requested
    via a function or a feed, the given data params will have time parts.
- external event dragging via touchpunch broken (#3544)
- can't make an immediate new selection after existing selection, with mouse.
  introduced in v3.2.0 (#3558)

## 3.2.0 (2017-02-14)

Features:

- `selectMinDistance`, threshold before a mouse selection begins (#2428)

Bugfixes:

- iOS 10, unwanted scrolling while dragging events/selection (#3403)
- dayClick triggered when swiping on touch devices (#3332)
- dayClick not functioning on Firefix mobile (#3450)
- title computed incorrectly for views with no weekends (#2884)
- unwanted scrollbars in month-view when non-integer width (#3453, #3444)
- incorrect date formatting for locales with non-standlone month/day names (#3478)
- date formatting, incorrect omission of trailing period for certain locales (#2504, #3486)
- formatRange should collapse same week numbers (#3467)
- Taiwanese locale updated (#3426)
- Finnish noEventsMessage updated (#3476)
- Croatian (hr) buttonText is blank (#3270)
- JSON feed PHP example, date range math bug (#3485)

## 3.1.0 (2016-12-05)

- experimental support for implicitly batched ("debounced") event rendering (#2938)
  - `eventRenderWait` (off by default)
- new `footer` option, similar to header toolbar (#654, #3299)
- event rendering batch methods (#3351):
  - `renderEvents`
  - `updateEvents`
- more granular touch settings (#3377):
  - `eventLongPressDelay`
  - `selectLongPressDelay`
- eventDestroy not called when removing the popover (#3416, #3419)
- print stylesheet and gcal extension now offered as minified (#3415)
- fc-today in agenda header cells (#3361, #3365)
- height-related options in tandem with other options (#3327, #3384)
- Kazakh locale (#3394)
- Afrikaans locale (#3390)
- internal refactor related to timing of rendering and firing handlers.
  calls to rerender the current date-range and events from within handlers
  might not execute immediately. instead, will execute after handler finishes.

## 3.0.1 (2016-09-26)

Bugfixes:

- list view rendering event times incorrectly (#3334)
- list view rendering events/days out of order (#3347)
- events with no title rendering as "undefined"
- add .fc scope to table print styles (#3343)
- "display no events" text fix for German (#3354)

## 3.0.0 (2016-09-04)

Features:

- List View (#560)
  - new views: `listDay`, `listWeek`, `listMonth`, `listYear`, and simply `list`
  - `listDayFormat`
  - `listDayAltFormat`
  - `noEventsMessage`
- Clickable day/week numbers for easier navigation (#424)
  - `navLinks`
  - `navLinkDayClick`
  - `navLinkWeekClick`
- Programmatically allow/disallow user interactions:
  - `eventAllow` (#2740)
  - `selectAllow` (#2511)
- Option to display week numbers in cells (#3024)
  - `weekNumbersWithinDays` (set to `true` to activate)
- When week calc is ISO, default first day-of-week to Monday (#3255)
- Macedonian locale (#2739)
- Malay locale

Breaking Changes:

- IE8 support dropped
- jQuery: minimum support raised to v2.0.0
- MomentJS: minimum support raised to v2.9.0
- `lang` option renamed to `locale`
- dist files have been renamed to be more consistent with MomentJS:
  - `lang/` -> `locale/`
  - `lang-all.js` -> `locale-all.js`
- behavior of moment methods no longer affected by ambiguousness:
  - `isSame`
  - `isBefore`
  - `isAfter`
- View-Option-Hashes no longer supported (deprecated in 2.2.4)
- removed `weekMode` setting
- removed `axisFormat` setting
- DOM structure of month/basic-view day cell numbers changed

Bugfixes:

- `$.fullCalendar.version` incorrect (#3292)

Build System:

- using gulp instead of grunt (faster)
- using npm internally for dependencies instead of bower
- changed repo directory structure

## 2.9.1 (2016-07-31)

- multiple definitions for businessHours (#2686)
- businessHours for single day doesn't display weekends (#2944)
- height/contentHeight can accept a function or 'parent' for dynamic value (#3271)
- fix +more popover clipped by overflow (#3232)
- fix +more popover positioned incorrectly when scrolled (#3137)
- Norwegian Nynorsk translation (#3246)
- fix isAnimating JS error (#3285)

## 2.9.0 (2016-07-10)

- Setters for (almost) all options (#564).
  See [docs](https://fullcalendar.io/docs/utilities/dynamic_options/) for more info.
- Travis CI improvements (#3266)

## 2.8.0 (2016-06-19)

- getEventSources method (#3103, #2433)
- getEventSourceById method (#3223)
- refetchEventSources method (#3103, #1328, #254)
- removeEventSources method (#3165, #948)
- prevent flicker when refetchEvents is called (#3123, #2558)
- fix for removing event sources that share same URL (#3209)
- jQuery 3 support (#3197, #3124)
- Travis CI integration (#3218)
- EditorConfig for promoting consistent code style (#141)
- use en dash when formatting ranges (#3077)
- height:auto always shows scrollbars in month view on FF (#3202)
- new languages:
  - Basque (#2992)
  - Galician (#194)
  - Luxembourgish (#2979)

## 2.7.3 (2016-06-02)

internal enhancements that plugins can benefit from:

- EventEmitter not correctly working with stopListeningTo
- normalizeEvent hook for manipulating event data

## 2.7.2 (2016-05-20)

- fixed desktops/laptops with touch support not accepting mouse events for
  dayClick/dragging/resizing (#3154, #3149)
- fixed dayClick incorrectly triggered on touch scroll (#3152)
- fixed touch event dragging wrongfully beginning upon scrolling document (#3160)
- fixed minified JS still contained comments
- UI change: mouse users must hover over an event to reveal its resizers

## 2.7.1 (2016-05-01)

- dayClick not firing on touch devices (#3138)
- icons for prev/next not working in MS Edge (#2852)
- fix bad languages troubles with firewalls (#3133, #3132)
- update all dev dependencies (#3145, #3010, #2901, #251)
- git-ignore npm debug logs (#3011)
- misc automated test updates (#3139, #3147)
- Google Calendar htmlLink not always defined (#2844)

## 2.7.0 (2016-04-23)

touch device support (#994): - smoother scrolling - interactions initiated via "long press": - event drag-n-drop - event resize - time-range selecting - `longPressDelay`

## 2.6.1 (2016-02-17)

- make `nowIndicator` positioning refresh on window resize

## 2.6.0 (2016-01-07)

- current time indicator (#414)
- bundled with most recent version of moment (2.11.0)
- UMD wrapper around lang files now handles commonjs (#2918)
- fix bug where external event dragging would not respect eventOverlap
- fix bug where external event dropping would not render the whole-day highlight

## 2.5.0 (2015-11-30)

- internal timezone refactor. fixes #2396, #2900, #2945, #2711
- internal "grid" system refactor. improved API for plugins.

## 2.4.0 (2015-08-16)

- add new buttons to the header via `customButtons` ([225])
- control stacking order of events via `eventOrder` ([364])
- control frequency of slot text via `slotLabelInterval` ([946])
- `displayEventTime` ([1904])
- `on` and `off` methods ([1910])
- renamed `axisFormat` to `slotLabelFormat`

[225]: https://code.google.com/p/fullcalendar/issues/detail?id=225
[364]: https://code.google.com/p/fullcalendar/issues/detail?id=364
[946]: https://code.google.com/p/fullcalendar/issues/detail?id=946
[1904]: https://code.google.com/p/fullcalendar/issues/detail?id=1904
[1910]: https://code.google.com/p/fullcalendar/issues/detail?id=1910

## 2.3.2 (2015-06-14)

- minor code adjustment in preparation for plugins

## 2.3.1 (2015-03-08)

- Fix week view column title for en-gb ([PR220])
- Publish to NPM ([2447])
- Detangle bower from npm package ([PR179])

[PR220]: https://github.com/arshaw/fullcalendar/pull/220
[2447]: https://code.google.com/p/fullcalendar/issues/detail?id=2447
[PR179]: https://github.com/arshaw/fullcalendar/pull/179

## 2.3.0 (2015-02-21)

- internal refactoring in preparation for other views
- businessHours now renders on whole-days in addition to timed areas
- events in "more" popover not sorted by time ([2385])
- avoid using moment's deprecated zone method ([2443])
- destroying the calendar sometimes causes all window resize handlers to be unbound ([2432])
- multiple calendars on one page, can't accept external elements after navigating ([2433])
- accept external events from jqui sortable ([1698])
- external jqui drop processed before reverting ([1661])
- IE8 fix: month view renders incorrectly ([2428])
- IE8 fix: eventLimit:true wouldn't activate "more" link ([2330])
- IE8 fix: dragging an event with an href
- IE8 fix: invisible element while dragging agenda view events
- IE8 fix: erratic external element dragging

[2385]: https://code.google.com/p/fullcalendar/issues/detail?id=2385
[2443]: https://code.google.com/p/fullcalendar/issues/detail?id=2443
[2432]: https://code.google.com/p/fullcalendar/issues/detail?id=2432
[2433]: https://code.google.com/p/fullcalendar/issues/detail?id=2433
[1698]: https://code.google.com/p/fullcalendar/issues/detail?id=1698
[1661]: https://code.google.com/p/fullcalendar/issues/detail?id=1661
[2428]: https://code.google.com/p/fullcalendar/issues/detail?id=2428
[2330]: https://code.google.com/p/fullcalendar/issues/detail?id=2330

## 2.2.7 (2015-02-10)

- view.title wasn't defined in viewRender callback ([2407])
- FullCalendar versions >= 2.2.5 brokenness with Moment versions <= 2.8.3 ([2417])
- Support Bokmal Norwegian language specifically ([2427])

[2407]: https://code.google.com/p/fullcalendar/issues/detail?id=2407
[2417]: https://code.google.com/p/fullcalendar/issues/detail?id=2417
[2427]: https://code.google.com/p/fullcalendar/issues/detail?id=2427

## 2.2.6 (2015-01-11)

- Compatibility with Moment v2.9. Was breaking GCal plugin ([2408])
- View object's `title` property mistakenly omitted ([2407])
- Single-day views with hiddens days could cause prev/next misbehavior ([2406])
- Don't let the current date ever be a hidden day (solves [2395])
- Hebrew locale ([2157])

[2408]: https://code.google.com/p/fullcalendar/issues/detail?id=2408
[2407]: https://code.google.com/p/fullcalendar/issues/detail?id=2407
[2406]: https://code.google.com/p/fullcalendar/issues/detail?id=2406
[2395]: https://code.google.com/p/fullcalendar/issues/detail?id=2395
[2157]: https://code.google.com/p/fullcalendar/issues/detail?id=2157

## 2.2.5 (2014-12-30)

- `buttonText` specified for custom views via the `views` option
  - bugfix: wrong default value, couldn't override default
  - feature: default value taken from locale

## 2.2.4 (2014-12-29)

- Arbitrary durations for basic/agenda views with the `views` option ([692])
- Specify view-specific options using the `views` option. fixes [2283]
- Deprecate view-option-hashes
- Formalize and expose View API ([1055])
- updateEvent method, more intuitive behavior. fixes [2194]

[692]: https://code.google.com/p/fullcalendar/issues/detail?id=692
[2283]: https://code.google.com/p/fullcalendar/issues/detail?id=2283
[1055]: https://code.google.com/p/fullcalendar/issues/detail?id=1055
[2194]: https://code.google.com/p/fullcalendar/issues/detail?id=2194

## 2.2.3 (2014-11-26)

- removeEventSource with Google Calendar object source, would not remove ([2368])
- Events with invalid end dates are still accepted and rendered ([2350], [2237], [2296])
- Bug when rendering business hours and navigating away from original view ([2365])
- Links to Google Calendar events will use current timezone ([2122])
- Google Calendar plugin works with timezone names that have spaces
- Google Calendar plugin accepts person email addresses as calendar IDs
- Internally use numeric sort instead of alphanumeric sort ([2370])

[2368]: https://code.google.com/p/fullcalendar/issues/detail?id=2368
[2350]: https://code.google.com/p/fullcalendar/issues/detail?id=2350
[2237]: https://code.google.com/p/fullcalendar/issues/detail?id=2237
[2296]: https://code.google.com/p/fullcalendar/issues/detail?id=2296
[2365]: https://code.google.com/p/fullcalendar/issues/detail?id=2365
[2122]: https://code.google.com/p/fullcalendar/issues/detail?id=2122
[2370]: https://code.google.com/p/fullcalendar/issues/detail?id=2370

## 2.2.2 (2014-11-19)

- Fixes to Google Calendar API V3 code
  - wouldn't recognize a lone-string Google Calendar ID if periods before the @ symbol
  - removeEventSource wouldn't work when given a Google Calendar ID

## 2.2.1 (2014-11-19)

- Migrate Google Calendar plugin to use V3 of the API ([1526])

[1526]: https://code.google.com/p/fullcalendar/issues/detail?id=1526

## 2.2.0 (2014-11-14)

- Background events. Event object's `rendering` property ([144], [1286])
- `businessHours` option ([144])
- Controlling where events can be dragged/resized and selections can go ([396], [1286], [2253])
  - `eventOverlap`, `selectOverlap`, and similar
  - `eventConstraint`, `selectConstraint`, and similar
- Improvements to dragging and dropping external events ([2004])
  - Associating with real event data. used with `eventReceive`
  - Associating a `duration`
- Performance boost for moment creation
  - Be aware, FullCalendar-specific methods now attached directly to global moment.fn
  - Helps with [issue 2259][2259]
- Reintroduced forgotten `dropAccept` option ([2312])

[144]: https://code.google.com/p/fullcalendar/issues/detail?id=144
[396]: https://code.google.com/p/fullcalendar/issues/detail?id=396
[1286]: https://code.google.com/p/fullcalendar/issues/detail?id=1286
[2004]: https://code.google.com/p/fullcalendar/issues/detail?id=2004
[2253]: https://code.google.com/p/fullcalendar/issues/detail?id=2253
[2259]: https://code.google.com/p/fullcalendar/issues/detail?id=2259
[2312]: https://code.google.com/p/fullcalendar/issues/detail?id=2312

## 2.1.1 (2014-08-29)

- removeEventSource not working with array ([2203])
- mouseout not triggered after mouseover+updateEvent ([829])
- agenda event's render with no <a> href, not clickable ([2263])

[2203]: https://code.google.com/p/fullcalendar/issues/detail?id=2203
[829]: https://code.google.com/p/fullcalendar/issues/detail?id=829
[2263]: https://code.google.com/p/fullcalendar/issues/detail?id=2263

## 2.1.0 (2014-08-25)

Large code refactor with better OOP, better code reuse, and more comments.
**No more reliance on jQuery UI** for event dragging, resizing, or anything else.

Significant changes to HTML/CSS skeleton:

- Leverages tables for liquid rendering of days and events. No costly manual repositioning ([809])
- **Backwards-incompatibilities**:
  - **Many classNames have changed. Custom CSS will likely need to be adjusted.**
  - IE7 definitely not supported anymore
  - In `eventRender` callback, `element` will not be attached to DOM yet
  - Events are styled to be one line by default ([1992]). Can be undone through custom CSS,
    but not recommended (might get gaps [like this][111] in certain situations).

A "more..." link when there are too many events on a day ([304]). Works with month and basic views
as well as the all-day section of the agenda views. New options:

- `eventLimit`. a number or `true`
- `eventLimitClick`. the `"popover`" value will reveal all events in a raised panel (the default)
- `moreLinkText`
- `dayPopoverFormat`

Changes related to height and scrollbars:

- `aspectRatio`/`height`/`contentHeight` values will be honored _no matter what_
  - If too many events causing too much vertical space, scrollbars will be used ([728]).
    This is default behavior for month view (**backwards-incompatibility**)
  - If too few slots in agenda view, view will stretch to be the correct height ([2196])
- `'auto'` value for `height`/`contentHeight` options. If content is too tall, the view will
  vertically stretch to accomodate and no scrollbars will be used ([521]).
- Tall weeks in month view will borrow height from other weeks ([243])
- Automatically scroll the view then dragging/resizing an event ([1025], [2078])
- New `fixedWeekCount` option to determines the number of weeks in month view
  - Supersedes `weekMode` (**deprecated**). Instead, use a combination of `fixedWeekCount` and
    one of the height options, possibly with an `'auto'` value

Much nicer, glitch-free rendering of calendar _for printers_ ([35]). Things you might not expect:

- Buttons will become hidden
- Agenda views display a flat list of events where the time slots would be

Other issues resolved along the way:

- Space on right side of agenda events configurable through CSS ([204])
- Problem with window resize ([259])
- Events sorting stays consistent across weeks ([510])
- Agenda's columns misaligned on wide screens ([511])
- Run `selectHelper` through `eventRender` callbacks ([629])
- Keyboard access, tabbing ([637])
- Run resizing events through `eventRender` ([714])
- Resize an event to a different day in agenda views ([736])
- Allow selection across days in agenda views ([778])
- Mouseenter delegated event not working on event elements ([936])
- Agenda event dragging, snapping to different columns is erratic ([1101])
- Android browser cuts off Day view at 8 PM with no scroll bar ([1203])
- Don't fire `eventMouseover`/`eventMouseout` while dragging/resizing ([1297])
- Customize the resize handle text ("=") ([1326])
- If agenda event is too short, don't overwrite `.fc-event-time` ([1700])
- Zooming calendar causes events to misalign ([1996])
- Event destroy callback on event removal ([2017])
- Agenda views, when RTL, should have axis on right ([2132])
- Make header buttons more accessibile ([2151])
- daySelectionMousedown should interpret OSX ctrl+click as a right mouse click ([2169])
- Best way to display time text on multi-day events _with times_ ([2172])
- Eliminate table use for header layout ([2186])
- Event delegation used for event-related callbacks (like `eventClick`). Speedier.

[35]: https://code.google.com/p/fullcalendar/issues/detail?id=35
[204]: https://code.google.com/p/fullcalendar/issues/detail?id=204
[243]: https://code.google.com/p/fullcalendar/issues/detail?id=243
[259]: https://code.google.com/p/fullcalendar/issues/detail?id=259
[304]: https://code.google.com/p/fullcalendar/issues/detail?id=304
[510]: https://code.google.com/p/fullcalendar/issues/detail?id=510
[511]: https://code.google.com/p/fullcalendar/issues/detail?id=511
[521]: https://code.google.com/p/fullcalendar/issues/detail?id=521
[629]: https://code.google.com/p/fullcalendar/issues/detail?id=629
[637]: https://code.google.com/p/fullcalendar/issues/detail?id=637
[714]: https://code.google.com/p/fullcalendar/issues/detail?id=714
[728]: https://code.google.com/p/fullcalendar/issues/detail?id=728
[736]: https://code.google.com/p/fullcalendar/issues/detail?id=736
[778]: https://code.google.com/p/fullcalendar/issues/detail?id=778
[809]: https://code.google.com/p/fullcalendar/issues/detail?id=809
[936]: https://code.google.com/p/fullcalendar/issues/detail?id=936
[1025]: https://code.google.com/p/fullcalendar/issues/detail?id=1025
[1101]: https://code.google.com/p/fullcalendar/issues/detail?id=1101
[1203]: https://code.google.com/p/fullcalendar/issues/detail?id=1203
[1297]: https://code.google.com/p/fullcalendar/issues/detail?id=1297
[1326]: https://code.google.com/p/fullcalendar/issues/detail?id=1326
[1700]: https://code.google.com/p/fullcalendar/issues/detail?id=1700
[1992]: https://code.google.com/p/fullcalendar/issues/detail?id=1992
[1996]: https://code.google.com/p/fullcalendar/issues/detail?id=1996
[2017]: https://code.google.com/p/fullcalendar/issues/detail?id=2017
[2078]: https://code.google.com/p/fullcalendar/issues/detail?id=2078
[2132]: https://code.google.com/p/fullcalendar/issues/detail?id=2132
[2151]: https://code.google.com/p/fullcalendar/issues/detail?id=2151
[2169]: https://code.google.com/p/fullcalendar/issues/detail?id=2169
[2172]: https://code.google.com/p/fullcalendar/issues/detail?id=2172
[2186]: https://code.google.com/p/fullcalendar/issues/detail?id=2186
[2196]: https://code.google.com/p/fullcalendar/issues/detail?id=2196
[111]: https://code.google.com/p/fullcalendar/issues/detail?id=111

## 2.0.3 (2014-08-15)

- moment-2.8.1 compatibility ([2221])
- relative path in bower.json ([PR 117])
- upgraded jquery-ui and misc dev dependencies

[2221]: https://code.google.com/p/fullcalendar/issues/detail?id=2221
[PR 117]: https://github.com/arshaw/fullcalendar/pull/177

## 2.0.2 (2014-06-24)

- bug with persisting addEventSource calls ([2191])
- bug with persisting removeEvents calls with an array source ([2187])
- bug with removeEvents method when called with 0 removes all events ([2082])

[2191]: https://code.google.com/p/fullcalendar/issues/detail?id=2191
[2187]: https://code.google.com/p/fullcalendar/issues/detail?id=2187
[2082]: https://code.google.com/p/fullcalendar/issues/detail?id=2082

## 2.0.1 (2014-06-15)

- `delta` parameters reintroduced in `eventDrop` and `eventResize` handlers ([2156])
  - **Note**: this changes the argument order for `revertFunc`
- wrongfully triggering a windowResize when resizing an agenda view event ([1116])
- `this` values in event drag-n-drop/resize handlers consistently the DOM node ([1177])
- `displayEventEnd` - v2 workaround to force display of an end time ([2090])
- don't modify passed-in eventSource items ([954])
- destroy method now removes fc-ltr class ([2033])
- weeks of last/next month still visible when weekends are hidden ([2095])
- fixed memory leak when destroying calendar with selectable/droppable ([2137])
- Icelandic language ([2180])
- Bahasa Indonesia language ([PR 172])

[1116]: https://code.google.com/p/fullcalendar/issues/detail?id=1116
[1177]: https://code.google.com/p/fullcalendar/issues/detail?id=1177
[2090]: https://code.google.com/p/fullcalendar/issues/detail?id=2090
[954]: https://code.google.com/p/fullcalendar/issues/detail?id=954
[2033]: https://code.google.com/p/fullcalendar/issues/detail?id=2033
[2095]: https://code.google.com/p/fullcalendar/issues/detail?id=2095
[2137]: https://code.google.com/p/fullcalendar/issues/detail?id=2137
[2156]: https://code.google.com/p/fullcalendar/issues/detail?id=2156
[2180]: https://code.google.com/p/fullcalendar/issues/detail?id=2180
[PR 172]: https://github.com/arshaw/fullcalendar/pull/172

## 2.0.0 (2014-06-01)

Internationalization support, timezone support, and [MomentJS] integration. Extensive changes, many
of which are backwards incompatible.

[Full list of changes][Upgrading-to-v2] | [Affected Issues][Date-Milestone]

An automated testing framework has been set up ([Karma] + [Jasmine]) and tests have been written
which cover about half of FullCalendar's functionality. Special thanks to @incre-d, @vidbina, and
@sirrocco for the help.

In addition, the main development repo has been repurposed to also include the built distributable
JS/CSS for the project and will serve as the new [Bower] endpoint.

[MomentJS]: http://momentjs.com/
[Upgrading-to-v2]: http://arshaw.com/fullcalendar/wiki/Upgrading-to-v2/
[Date-Milestone]: https://code.google.com/p/fullcalendar/issues/list?can=1&q=milestone%3Ddate
[Karma]: http://karma-runner.github.io/
[Jasmine]: http://jasmine.github.io/
[Bower]: http://bower.io/

## 1.6.4 (2013-09-01)

- better algorithm for positioning timed agenda events ([1115])
- `slotEventOverlap` option to tweak timed agenda event overlapping ([218])
- selection bug when slot height is customized ([1035])
- supply view argument in `loading` callback ([1018])
- fixed week number not displaying in agenda views ([1951])
- fixed fullCalendar not initializing with no options ([1356])
- NPM's `package.json`, no more warnings or errors ([1762])
- building the bower component should output `bower.json` instead of `component.json` ([PR 125])
- use bower internally for fetching new versions of jQuery and jQuery UI

[1115]: https://code.google.com/p/fullcalendar/issues/detail?id=1115
[218]: https://code.google.com/p/fullcalendar/issues/detail?id=218
[1035]: https://code.google.com/p/fullcalendar/issues/detail?id=1035
[1018]: https://code.google.com/p/fullcalendar/issues/detail?id=1018
[1951]: https://code.google.com/p/fullcalendar/issues/detail?id=1951
[1356]: https://code.google.com/p/fullcalendar/issues/detail?id=1356
[1762]: https://code.google.com/p/fullcalendar/issues/detail?id=1762
[PR 125]: https://github.com/arshaw/fullcalendar/pull/125

## 1.6.3 (2013-08-10)

- `viewRender` callback ([PR 15])
- `viewDestroy` callback ([PR 15])
- `eventDestroy` callback ([PR 111])
- `handleWindowResize` option ([PR 54])
- `eventStartEditable`/`startEditable` options ([PR 49])
- `eventDurationEditable`/`durationEditable` options ([PR 49])
- specify function for `$.ajax` `data` parameter for JSON event sources ([PR 59])
- fixed bug with agenda event dropping in wrong column ([PR 55])
- easier event element z-index customization ([PR 58])
- classNames on past/future days ([PR 88])
- allow `null`/`undefined` event titles ([PR 84])
- small optimize for agenda event rendering ([PR 56])
- deprecated:
  - `viewDisplay`
  - `disableDragging`
  - `disableResizing`
- bundled with latest jQuery (1.10.2) and jQuery UI (1.10.3)

[PR 15]: https://github.com/arshaw/fullcalendar/pull/15
[PR 111]: https://github.com/arshaw/fullcalendar/pull/111
[PR 54]: https://github.com/arshaw/fullcalendar/pull/54
[PR 49]: https://github.com/arshaw/fullcalendar/pull/49
[PR 59]: https://github.com/arshaw/fullcalendar/pull/59
[PR 55]: https://github.com/arshaw/fullcalendar/pull/55
[PR 58]: https://github.com/arshaw/fullcalendar/pull/58
[PR 88]: https://github.com/arshaw/fullcalendar/pull/88
[PR 84]: https://github.com/arshaw/fullcalendar/pull/84
[PR 56]: https://github.com/arshaw/fullcalendar/pull/56

## 1.6.2 (2013-07-18)

- `hiddenDays` option ([686])
- bugfix: when `eventRender` returns `false`, incorrect stacking of events ([762])
- bugfix: couldn't change `event.backgroundImage` when calling `updateEvent` (thx @stephenharris)

[686]: https://code.google.com/p/fullcalendar/issues/detail?id=686
[762]: https://code.google.com/p/fullcalendar/issues/detail?id=762

## 1.6.1 (2013-04-14)

- fixed event inner content overflow bug ([1783])
- fixed table header className bug [1772]
- removed text-shadow on events (better for general use, thx @tkrotoff)

[1783]: https://code.google.com/p/fullcalendar/issues/detail?id=1783
[1772]: https://code.google.com/p/fullcalendar/issues/detail?id=1772

## 1.6.0 (2013-03-18)

- visual facelift, with bootstrap-inspired buttons and colors
- simplified HTML/CSS for events and buttons
- `dayRender`, for modifying a day cell ([191], thx @althaus)
- week numbers on side of calendar ([295])
  - `weekNumber`
  - `weekNumberCalculation`
  - `weekNumberTitle`
  - `W` formatting variable
- finer snapping granularity for agenda view events ([495], thx @ms-doodle-com)
- `eventAfterAllRender` ([753], thx @pdrakeweb)
- `eventDataTransform` (thx @joeyspo)
- `data-date` attributes on cells (thx @Jae)
- expose `$.fullCalendar.dateFormatters`
- when clicking fast on buttons, prevent text selection
- bundled with latest jQuery (1.9.1) and jQuery UI (1.10.2)
- Grunt/Lumbar build system for internal development
- build for Bower package manager
- build for jQuery plugin site

[191]: https://code.google.com/p/fullcalendar/issues/detail?id=191
[295]: https://code.google.com/p/fullcalendar/issues/detail?id=295
[495]: https://code.google.com/p/fullcalendar/issues/detail?id=495
[753]: https://code.google.com/p/fullcalendar/issues/detail?id=753

## 1.5.4 (2012-09-05)

- made compatible with jQuery 1.8.\* (thx @archaeron)
- bundled with jQuery 1.8.1 and jQuery UI 1.8.23

## 1.5.3 (2012-02-06)

- fixed dragging issue with jQuery UI 1.8.16 ([1168])
- bundled with jQuery 1.7.1 and jQuery UI 1.8.17

[1168]: https://code.google.com/p/fullcalendar/issues/detail?id=1168

## 1.5.2 (2011-08-21)

- correctly process UTC "Z" ISO8601 date strings ([750])

[750]: https://code.google.com/p/fullcalendar/issues/detail?id=750

## 1.5.1 (2011-04-09)

- more flexible ISO8601 date parsing ([814])
- more flexible parsing of UNIX timestamps ([826])
- FullCalendar now buildable from source on a Mac ([795])
- FullCalendar QA'd in FF4 ([883])
- upgraded to jQuery 1.5.2 (which supports IE9) and jQuery UI 1.8.11

[814]: https://code.google.com/p/fullcalendar/issues/detail?id=814
[826]: https://code.google.com/p/fullcalendar/issues/detail?id=826
[795]: https://code.google.com/p/fullcalendar/issues/detail?id=795
[883]: https://code.google.com/p/fullcalendar/issues/detail?id=883

## 1.5 (2011-03-19)

- slicker default styling for buttons
- reworked a lot of the calendar's HTML and accompanying CSS (solves [327] and [395])
- more printer-friendly (fullcalendar-print.css)
- fullcalendar now inherits styles from jquery-ui themes differently.
  styles for buttons are distinct from styles for calendar cells.
  (solves [299])
- can now color events through FullCalendar options and Event-Object properties ([117])
  THIS IS NOW THE PREFERRED METHOD OF COLORING EVENTS (as opposed to using className and CSS)
  - FullCalendar options:
    - eventColor (changes both background and border)
    - eventBackgroundColor
    - eventBorderColor
    - eventTextColor
  - Event-Object options:
    - color (changes both background and border)
    - backgroundColor
    - borderColor
    - textColor
- can now specify an event source as an _object_ with a `url` property (json feed) or
  an `events` property (function or array) with additional properties that will
  be applied to the entire event source:
  - color (changes both background and border)
  - backgroudColor
  - borderColor
  - textColor
  - className
  - editable
  - allDayDefault
  - ignoreTimezone
  - startParam (for a feed)
  - endParam (for a feed)
  - ANY OF THE JQUERY $.ajax OPTIONS
    allows for easily changing from GET to POST and sending additional parameters ([386])
    allows for easily attaching ajax handlers such as `error` ([754])
    allows for turning caching on ([355])
- Google Calendar feeds are now specified differently:
  - specify a simple string of your feed's URL
  - specify an _object_ with a `url` property of your feed's URL.
    you can include any of the new Event-Source options in this object.
  - the old `$.fullCalendar.gcalFeed` method still works
- no more IE7 SSL popup ([504])
- remove `cacheParam` - use json event source `cache` option instead
- latest jquery/jquery-ui

[327]: https://code.google.com/p/fullcalendar/issues/detail?id=327
[395]: https://code.google.com/p/fullcalendar/issues/detail?id=395
[299]: https://code.google.com/p/fullcalendar/issues/detail?id=299
[117]: https://code.google.com/p/fullcalendar/issues/detail?id=117
[386]: https://code.google.com/p/fullcalendar/issues/detail?id=386
[754]: https://code.google.com/p/fullcalendar/issues/detail?id=754
[355]: https://code.google.com/p/fullcalendar/issues/detail?id=355
[504]: https://code.google.com/p/fullcalendar/issues/detail?id=504

## 1.4.11 (2011-02-22)

- fixed rerenderEvents bug ([790])
- fixed bug with faulty dragging of events from all-day slot in agenda views
- bundled with jquery 1.5 and jquery-ui 1.8.9

[790]: https://code.google.com/p/fullcalendar/issues/detail?id=790

## 1.4.10 (2011-01-02)

- fixed bug with resizing event to different week in 5-day month view ([740])
- fixed bug with events not sticking after a removeEvents call ([757])
- fixed bug with underlying parseTime method, and other uses of parseInt ([688])

[740]: https://code.google.com/p/fullcalendar/issues/detail?id=740
[757]: https://code.google.com/p/fullcalendar/issues/detail?id=757
[688]: https://code.google.com/p/fullcalendar/issues/detail?id=688

## 1.4.9 (2010-11-16)

- new algorithm for vertically stacking events ([111])
- resizing an event to a different week ([306])
- bug: some events not rendered with consecutive calls to addEventSource ([679])

[111]: https://code.google.com/p/fullcalendar/issues/detail?id=111
[306]: https://code.google.com/p/fullcalendar/issues/detail?id=306
[679]: https://code.google.com/p/fullcalendar/issues/detail?id=679

## 1.4.8 (2010-10-16)

- ignoreTimezone option (set to `false` to process UTC offsets in ISO8601 dates)
- bugfixes
  - event refetching not being called under certain conditions ([417], [554])
  - event refetching being called multiple times under certain conditions ([586], [616])
  - selection cannot be triggered by right mouse button ([558])
  - agenda view left axis sized incorrectly ([465])
  - IE js error when calendar is too narrow ([517])
  - agenda view looks strange when no scrollbars ([235])
  - improved parsing of ISO8601 dates with UTC offsets
- $.fullCalendar.version
- an internal refactor of the code, for easier future development and modularity

[417]: https://code.google.com/p/fullcalendar/issues/detail?id=417
[554]: https://code.google.com/p/fullcalendar/issues/detail?id=554
[586]: https://code.google.com/p/fullcalendar/issues/detail?id=586
[616]: https://code.google.com/p/fullcalendar/issues/detail?id=616
[558]: https://code.google.com/p/fullcalendar/issues/detail?id=558
[465]: https://code.google.com/p/fullcalendar/issues/detail?id=465
[517]: https://code.google.com/p/fullcalendar/issues/detail?id=517
[235]: https://code.google.com/p/fullcalendar/issues/detail?id=235

## 1.4.7 (2010-07-05)

- "dropping" external objects onto the calendar
  - droppable (boolean, to turn on/off)
  - dropAccept (to filter which events the calendar will accept)
  - drop (trigger)
- selectable options can now be specified with a View Option Hash
- bugfixes
  - dragged & reverted events having wrong time text ([406])
  - bug rendering events that have an endtime with seconds, but no hours/minutes ([477])
  - gotoDate date overflow bug ([429])
  - wrong date reported when clicking on edge of last column in agenda views [412]
- support newlines in event titles
- select/unselect callbacks now passes native js event

[406]: https://code.google.com/p/fullcalendar/issues/detail?id=406
[477]: https://code.google.com/p/fullcalendar/issues/detail?id=477
[429]: https://code.google.com/p/fullcalendar/issues/detail?id=429
[412]: https://code.google.com/p/fullcalendar/issues/detail?id=412

## 1.4.6 (2010-05-31)

- "selecting" days or timeslots
  - options: selectable, selectHelper, unselectAuto, unselectCancel
  - callbacks: select, unselect
  - methods: select, unselect
- when dragging an event, the highlighting reflects the duration of the event
- code compressing by Google Closure Compiler
- bundled with jQuery 1.4.2 and jQuery UI 1.8.1

## 1.4.5 (2010-02-21)

- lazyFetching option, which can force the calendar to fetch events on every view/date change
- scroll state of agenda views are preserved when switching back to view
- bugfixes
  - calling methods on an uninitialized fullcalendar throws error
  - IE6/7 bug where an entire view becomes invisible ([320])
  - error when rendering a hidden calendar (in jquery ui tabs for example) in IE ([340])
  - interconnected bugs related to calendar resizing and scrollbars
    - when switching views or clicking prev/next, calendar would "blink" ([333])
    - liquid-width calendar's events shifted (depending on initial height of browser) ([341])
    - more robust underlying algorithm for calendar resizing

[320]: https://code.google.com/p/fullcalendar/issues/detail?id=320
[340]: https://code.google.com/p/fullcalendar/issues/detail?id=340
[333]: https://code.google.com/p/fullcalendar/issues/detail?id=333
[341]: https://code.google.com/p/fullcalendar/issues/detail?id=341

## 1.4.4 (2010-02-03)

- optimized event rendering in all views (events render in 1/10 the time)
- gotoDate() does not force the calendar to unnecessarily rerender
- render() method now correctly readjusts height

## 1.4.3 (2009-12-22)

- added destroy method
- Google Calendar event pages respect currentTimezone
- caching now handled by jQuery's ajax
- protection from setting aspectRatio to zero
- bugfixes
  - parseISO8601 and DST caused certain events to display day before
  - button positioning problem in IE6
  - ajax event source removed after recently being added, events still displayed
  - event not displayed when end is an empty string
  - dynamically setting calendar height when no events have been fetched, throws error

## 1.4.2 (2009-12-02)

- eventAfterRender trigger
- getDate & getView methods
- height & contentHeight options (explicitly sets the pixel height)
- minTime & maxTime options (restricts shown hours in agenda view)
- getters [for all options] and setters [for height, contentHeight, and aspectRatio ONLY! stay tuned..]
- render method now readjusts calendar's size
- bugfixes
  - lightbox scripts that use iframes (like fancybox)
  - day-of-week classNames were off when firstDay=1
  - guaranteed space on right side of agenda events (even when stacked)
  - accepts ISO8601 dates with a space (instead of 'T')

## 1.4.1 (2009-10-31)

- can exclude weekends with new 'weekends' option
- gcal feed 'currentTimezone' option
- bugfixes
  - year/month/date option sometimes wouldn't set correctly (depending on current date)
  - daylight savings issue caused agenda views to start at 1am (for BST users)
- cleanup of gcal.js code

## 1.4 (2009-10-19)

- agendaWeek and agendaDay views
- added some options for agenda views:
  - allDaySlot
  - allDayText
  - firstHour
  - slotMinutes
  - defaultEventMinutes
  - axisFormat
- modified some existing options/triggers to work with agenda views:
  - dragOpacity and timeFormat can now accept a "View Hash" (a new concept)
  - dayClick now has an allDay parameter
  - eventDrop now has an an allDay parameter
    (this will affect those who use revertFunc, adjust parameter list)
- added 'prevYear' and 'nextYear' for buttons in header
- minor change for theme users, ui-state-hover not applied to active/inactive buttons
- added event-color-changing example in docs
- better defaults for right-to-left themed button icons

## 1.3.2 (2009-10-13)

- Bugfixes (please upgrade from 1.3.1!)
  - squashed potential infinite loop when addMonths and addDays
    is called with an invalid date
  - $.fullCalendar.parseDate() now correctly parses IETF format
  - when switching views, the 'today' button sticks inactive, fixed
- gotoDate now can accept a single Date argument
- documentation for changes in 1.3.1 and 1.3.2 now on website

## 1.3.1 (2009-09-30)

- Important Bugfixes (please upgrade from 1.3!)
  - When current date was late in the month, for long months, and prev/next buttons
    were clicked in month-view, some months would be skipped/repeated
  - In certain time zones, daylight savings time would cause certain days
    to be misnumbered in month-view
- Subtle change in way week interval is chosen when switching from month to basicWeek/basicDay view
- Added 'allDayDefault' option
- Added 'changeView' and 'render' methods

## 1.3 (2009-09-21)

- different 'views': month/basicWeek/basicDay
- more flexible 'header' system for buttons
- themable by jQuery UI themes
- resizable events (require jQuery UI resizable plugin)
- rescoped & rewritten CSS, enhanced default look
- cleaner css & rendering techniques for right-to-left
- reworked options & API to support multiple views / be consistent with jQuery UI
- refactoring of entire codebase
  - broken into different JS & CSS files, assembled w/ build scripts
  - new test suite for new features, uses firebug-lite
- refactored docs
- Options
  - - date
  - - defaultView
  - - aspectRatio
  - - disableResizing
  - - monthNames (use instead of $.fullCalendar.monthNames)
  - - monthNamesShort (use instead of $.fullCalendar.monthAbbrevs)
  - - dayNames (use instead of $.fullCalendar.dayNames)
  - - dayNamesShort (use instead of $.fullCalendar.dayAbbrevs)
  - - theme
  - - buttonText
  - - buttonIcons
  - x draggable -> editable/disableDragging
  - x fixedWeeks -> weekMode
  - x abbrevDayHeadings -> columnFormat
  - x buttons/title -> header
  - x eventDragOpacity -> dragOpacity
  - x eventRevertDuration -> dragRevertDuration
  - x weekStart -> firstDay
  - x rightToLeft -> isRTL
  - x showTime (use 'allDay' CalEvent property instead)
- Triggered Actions
  - - eventResizeStart
  - - eventResizeStop
  - - eventResize
  - x monthDisplay -> viewDisplay
  - x resize -> windowResize
  - 'eventDrop' params changed, can revert if ajax cuts out
- CalEvent Properties
  - x showTime -> allDay
  - x draggable -> editable
  - 'end' is now INCLUSIVE when allDay=true
  - 'url' now produces a real <a> tag, more native clicking/tab behavior
- Methods:
  - - renderEvent
  - x prevMonth -> prev
  - x nextMonth -> next
  - x prevYear/nextYear -> moveDate
  - x refresh -> rerenderEvents/refetchEvents
  - x removeEvent -> removeEvents
  - x getEventsByID -> clientEvents
- Utilities:
  - 'formatDate' format string completely changed (inspired by jQuery UI datepicker + datejs)
  - 'formatDates' added to support date-ranges
- Google Calendar Options:
  - x draggable -> editable
- Bugfixes
  - gcal extension fetched 25 results max, now fetches all

## 1.2.1 (2009-06-29)

- bugfixes
  - allows and corrects invalid end dates for events
  - doesn't throw an error in IE while rendering when display:none
  - fixed 'loading' callback when used w/ multiple addEventSource calls
  - gcal className can now be an array

## 1.2 (2009-05-31)

- expanded API
  - 'className' CalEvent attribute
  - 'source' CalEvent attribute
  - dynamically get/add/remove/update events of current month
  - locale improvements: change month/day name text
  - better date formatting ($.fullCalendar.formatDate)
  - multiple 'event sources' allowed
    - dynamically add/remove event sources
- options for prevYear and nextYear buttons
- docs have been reworked (include addition of Google Calendar docs)
- changed behavior of parseDate for number strings
  (now interpets as unix timestamp, not MS times)
- bugfixes
  - rightToLeft month start bug
  - off-by-one errors with month formatting commands
  - events from previous months sticking when clicking prev/next quickly
- Google Calendar API changed to work w/ multiple event sources
  - can also provide 'className' and 'draggable' options
- date utilties moved from $ to $.fullCalendar
- more documentation in source code
- minified version of fullcalendar.js
- test suit (available from svn)
- top buttons now use `<button>` w/ an inner `<span>` for better css cusomization
  - thus CSS has changed. IF UPGRADING FROM PREVIOUS VERSIONS,
    UPGRADE YOUR FULLCALENDAR.CSS FILE

## 1.1 (2009-05-10)

- Added the following options:
  - weekStart
  - rightToLeft
  - titleFormat
  - timeFormat
  - cacheParam
  - resize
- Fixed rendering bugs
  - Opera 9.25 (events placement & window resizing)
  - IE6 (window resizing)
- Optimized window resizing for ALL browsers
- Events on same day now sorted by start time (but first by timespan)
- Correct z-index when dragging
- Dragging contained in overflow DIV for IE6
- Modified fullcalendar.css
  - for right-to-left support
  - for variable start-of-week
  - for IE6 resizing bug
  - for THEAD and TBODY (in 1.0, just used TBODY, restructured in 1.1)
  - IF UPGRADING FROM FULLCALENDAR 1.0, YOU MUST UPGRADE FULLCALENDAR.CSS
