# Issues

Bugs, features, ideas and behaviors in FullCalendar itself, found during the test revamp. One file per item, sorted into a folder by kind. Each file opens with its title and its **Status**, **Release** (once triaged), **Test** and **Issues** lines. This index is generated: after adding or changing a file, run `python3 planning/build-issues.py`.

| Folder | Holds | Statuses |
|---|---|---|
| `bugs/` | FullCalendar does something wrong, and we know what right is. | `confirmed`, `fixed` |
| `features/` | A new API with an agreed design, ready to build. | `designed`, `building`, `shipped` |
| `ideas/` | A real need whose design or fix isn't settled yet. | `open`, `parked` |
| `behaviors/` | Intended or arguable behavior: document it, change it in a major version, or promote it to a bug. | `arguable`, `intended` |

**Release** is `next` (non-breaking, after the test revamp merges) or `v8` (breaking, for the next major version). Adam sets it when triaging: a file without one hasn't been triaged yet.

**Test** is where the suites cover it. For a bug it's an `it.fails` test, which passes while the bug exists and fails once it's fixed: then change it to `it`. For a behavior, the test asserts what happens today. `standard/.../` is `standard/packages/vanilla-tests/`, `premium/.../` is `premium/packages/vanilla-scheduler-tests/`.

**Issues** are matching FullCalendar GitHub issues, as of their last check. In the table, *closed* marks a closed issue and *related* one that isn't the same problem but bears on it; the file says how.

## Bugs

### Not triaged

| Item | Status | Test | Issues |
|---|---|---|---|
| [A Google Calendar ID or API URL given as a plain string source is fetched as a JSON feed](bugs/google-calendar-string-source.md) | confirmed | `event-sources/google-calendar.ts` |  |
| [A view button alone in its group is `role=tab` with no `tablist`](bugs/lone-view-button-tab.md) | confirmed | `accessibility/aria.ts` | [#6522](https://github.com/fullcalendar/fullcalendar/issues/6522) (related) |
| [A week-aligned timeline's active range isn't its slots' range](bugs/timeline-week-aligned-active-range.md) | confirmed | `visible-range/timeline.ts` | [#7026](https://github.com/fullcalendar/fullcalendar/issues/7026) (closed, related) |
| [dayGrid business hours leave the Sunday unshaded across a week boundary](bugs/daygrid-business-hours-week-boundary.md) | confirmed | `business-hours/daygrid.ts` |  |
| [`EventApi.getResources()` returns `null` entries](bugs/event-get-resources-nulls.md) | confirmed | `resource-data/event-association.ts` | [#7300](https://github.com/fullcalendar/fullcalendar/issues/7300) |
| [In resource views, an event source's `color` beats a resource's `eventColor`](bugs/resource-view-color-precedence.md) | confirmed | `resource-data/event-styling.ts` | [#5743](https://github.com/fullcalendar/fullcalendar/issues/5743) (related) |
| [multiMonth selection and resizing can't cross months](bugs/multimonth-cross-month-interaction.md) | confirmed | `date-select/multimonth.ts`, `event-resize/multimonth.ts` | [#7183](https://github.com/fullcalendar/fullcalendar/issues/7183), [#7201](https://github.com/fullcalendar/fullcalendar/issues/7201) (closed) |
| [Prev, next and today are announced as toggle buttons](bugs/toolbar-buttons-aria-pressed.md) | confirmed | `accessibility/aria.ts` | [#8042](https://github.com/fullcalendar/fullcalendar/issues/8042), [#6521](https://github.com/fullcalendar/fullcalendar/issues/6521) (closed, related) |
| [`ResourceApi.setProp()` drops event-styling props](bugs/resource-set-prop-event-styling.md) | confirmed | `resource-data/crud.ts` | [#6468](https://github.com/fullcalendar/fullcalendar/issues/6468) (related) |
| [`ResourceApi.toPlainObject()` never outputs `eventColor`](bugs/resource-to-plain-object-event-color.md) | confirmed | `resource-data/crud.ts` |  |
| [`startStr`/`endStr` of a nonexistent (spring-forward) time name a different instant than `start`/`end`](bugs/nonexistent-time-start-str.md) | confirmed | `event-render/timeline.ts` | [#3887](https://github.com/fullcalendar/fullcalendar/issues/3887) (closed, related) |
| [Timeline `next()` moves backwards when `dateIncrement` is smaller than the duration](bugs/timeline-next-with-short-date-increment.md) | confirmed | `visible-range/scheduler-views.ts` | [#4678](https://github.com/fullcalendar/fullcalendar/issues/4678) (closed), [#5319](https://github.com/fullcalendar/fullcalendar/issues/5319) (closed) |
| [Timeline weeks given in days don't align to `firstDay`](bugs/timeline-weeks-in-days-first-day.md) | confirmed | `visible-range/timeline.ts` | [#7026](https://github.com/fullcalendar/fullcalendar/issues/7026) (closed) |
| [timelineYear with month header intervals and day slots renders month slots](bugs/timeline-year-month-headers-day-slots.md) | confirmed | `visible-range/timeline.ts` | [#4937](https://github.com/fullcalendar/fullcalendar/issues/4937) |
| [Under React, `moreLinkClick`'s `jsEvent` is a SyntheticEvent](bugs/react-more-link-click-js-event.md) | confirmed | `more-link/click.ts` |  |

## Features

None yet.

## Ideas

### v8

| Item | Status | Test | Issues |
|---|---|---|---|
| [Overhaul `ThirdPartyDraggable`](ideas/third-party-draggable-api.md) | open | `event-drag/third-party.ts` | [#7492](https://github.com/fullcalendar/fullcalendar/issues/7492), [#7593](https://github.com/fullcalendar/fullcalendar/issues/7593) (closed), [#7514](https://github.com/fullcalendar/fullcalendar/issues/7514) (closed) |

### Not triaged

| Item | Status | Test | Issues |
|---|---|---|---|
| [Dragging into the bottom strip of a timeGrid all-day cell misses it](ideas/all-day-drop-gap.md) | open |  |  |
| [Keyboard focus after activating a nav link](ideas/nav-link-keyboard-focus.md) | open |  | [#6524](https://github.com/fullcalendar/fullcalendar/issues/6524) (closed, related) |
| [The today button's accessible name doesn't contain its visible text](ideas/today-button-accessible-name.md) | open |  |  |

## Behaviors

### v8

| Item | Status | Test | Issues |
|---|---|---|---|
| [`calendar.select()` checks nothing before firing `select`](behaviors/select-method-no-checks.md) | arguable | `date-select/select-method.ts` | [#4150](https://github.com/fullcalendar/fullcalendar/issues/4150) |
| [How event settings combine across calendar, source, resource and event](behaviors/event-settings-precedence.md) | arguable | `constraints/resources.ts`, `resource-data/event-styling.ts` | [#5743](https://github.com/fullcalendar/fullcalendar/issues/5743) (related) |
| [Options explicitly set to `undefined` aren't treated as unset](behaviors/options-explicitly-undefined.md) | arguable |  | [#3298](https://github.com/fullcalendar/fullcalendar/issues/3298) (closed, related) |
| [What `eventOrder` and `resourceOrder` functions receive](behaviors/order-function-arguments.md) | arguable | `resource-data/resource-order.ts` | [#3950](https://github.com/fullcalendar/fullcalendar/issues/3950) (closed, related) |
