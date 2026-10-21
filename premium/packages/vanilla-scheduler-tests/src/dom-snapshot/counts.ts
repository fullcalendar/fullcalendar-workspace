import type { Calendar, CalendarOptions } from 'fullcalendar'

/*
Render-hook call counts for the DOM snapshot tool (scripts/bin/dom-snapshot.js).
A refactor may make these counts go down, never up: each count stands in for how often some
component rebuilt its JSX. See planning/phase-2-render-hook-specs.md
*/

/*
Every render-hook option that takes a function: the *Class options typed ClassNameGenerator, and all
*Content, *DidMount and *WillUnmount options. Taken from standard/packages/preact/src/options.ts and
premium/packages/preact-scheduler/src/common/options.ts. String-only *Class options can't count calls.
*/
export const COUNTED_OPTION_NAMES = [
  // Class (95)
  'allDayHeaderClass', 'allDayHeaderInnerClass', 'backgroundEventClass',
  'backgroundEventInnerClass', 'backgroundEventTitleClass', 'blockEventAfterClass',
  'blockEventBeforeClass', 'blockEventClass', 'blockEventInnerClass', 'blockEventTimeClass',
  'blockEventTitleClass', 'buttonClass', 'buttonGroupClass', 'columnEventAfterClass',
  'columnEventBeforeClass', 'columnEventClass', 'columnEventInnerClass', 'columnEventTimeClass',
  'columnEventTitleClass', 'columnMoreLinkClass', 'columnMoreLinkInnerClass', 'dayCellBottomClass',
  'dayCellClass', 'dayCellInnerClass', 'dayCellTopClass', 'dayCellTopInnerClass', 'dayHeaderClass',
  'dayHeaderDividerClass', 'dayHeaderInnerClass', 'dayLaneClass', 'dayLaneInnerClass',
  'eventAfterClass', 'eventBeforeClass', 'eventClass', 'eventInnerClass', 'eventTimeClass',
  'eventTitleClass', 'fillerClass', 'footerToolbarClass', 'headerToolbarClass',
  'inlineWeekNumberClass', 'listDayBodyClass', 'listDayClass', 'listDayHeaderClass',
  'listDayHeaderInnerClass', 'listItemEventAfterClass', 'listItemEventBeforeClass',
  'listItemEventClass', 'listItemEventInnerClass', 'listItemEventTimeClass',
  'listItemEventTitleClass', 'moreLinkClass', 'moreLinkInnerClass', 'noEventsClass',
  'noEventsInnerClass', 'nowIndicatorHeaderClass', 'nowIndicatorLineClass', 'resourceCellClass',
  'resourceCellInnerClass', 'resourceColumnHeaderClass', 'resourceColumnHeaderInnerClass',
  'resourceColumnResizerClass', 'resourceDayHeaderClass', 'resourceDayHeaderInnerClass',
  'resourceExpanderClass', 'resourceGroupHeaderClass', 'resourceGroupHeaderInnerClass',
  'resourceGroupLaneClass', 'resourceGroupLaneInnerClass', 'resourceLaneBottomClass',
  'resourceLaneClass', 'resourceLaneTopClass', 'rowEventAfterClass', 'rowEventBeforeClass',
  'rowEventClass', 'rowEventInnerClass', 'rowEventTimeClass', 'rowEventTitleClass',
  'rowMoreLinkClass', 'rowMoreLinkInnerClass', 'singleMonthClass', 'singleMonthHeaderClass',
  'singleMonthHeaderInnerClass', 'slotHeaderClass', 'slotHeaderDividerClass',
  'slotHeaderInnerClass', 'slotLaneClass', 'tableBodyClass', 'tableClass', 'tableHeaderClass',
  'toolbarClass', 'toolbarSectionClass', 'viewClass', 'weekNumberHeaderClass',
  'weekNumberHeaderInnerClass',
  // Content (24)
  'allDayHeaderContent', 'backgroundEventContent', 'dayCellTopContent', 'dayHeaderContent',
  'eventContent', 'inlineWeekNumberContent', 'listDayHeaderContent', 'moreLinkContent',
  'noEventsContent', 'nowIndicatorHeaderContent', 'nowIndicatorLineContent', 'popoverCloseContent',
  'resourceCellContent', 'resourceColumnHeaderContent', 'resourceDayHeaderContent',
  'resourceExpanderContent', 'resourceGroupHeaderContent', 'resourceGroupLaneContent',
  'resourceLaneBottomContent', 'resourceLaneTopContent', 'rowEventAfterContent',
  'rowEventBeforeContent', 'slotHeaderContent', 'weekNumberHeaderContent',
  // DidMount (23)
  'allDayHeaderDidMount', 'backgroundEventDidMount', 'dayCellDidMount', 'dayHeaderDidMount',
  'dayLaneDidMount', 'eventDidMount', 'inlineWeekNumberDidMount', 'listDayHeaderDidMount',
  'moreLinkDidMount', 'noEventsDidMount', 'nowIndicatorHeaderDidMount', 'nowIndicatorLineDidMount',
  'resourceCellDidMount', 'resourceColumnHeaderDidMount', 'resourceDayHeaderDidMount',
  'resourceGroupHeaderDidMount', 'resourceGroupLaneDidMount', 'resourceLaneDidMount',
  'singleMonthDidMount', 'slotHeaderDidMount', 'slotLaneDidMount', 'viewDidMount',
  'weekNumberHeaderDidMount',
  // WillUnmount (23)
  'allDayHeaderWillUnmount', 'backgroundEventWillUnmount', 'dayCellWillUnmount',
  'dayHeaderWillUnmount', 'dayLaneWillUnmount', 'eventWillUnmount', 'inlineWeekNumberWillUnmount',
  'listDayHeaderWillUnmount', 'moreLinkWillUnmount', 'noEventsWillUnmount',
  'nowIndicatorHeaderWillUnmount', 'nowIndicatorLineWillUnmount', 'resourceCellWillUnmount',
  'resourceColumnHeaderWillUnmount', 'resourceDayHeaderWillUnmount',
  'resourceGroupHeaderWillUnmount', 'resourceGroupLaneWillUnmount', 'resourceLaneWillUnmount',
  'singleMonthWillUnmount', 'slotHeaderWillUnmount', 'slotLaneWillUnmount', 'viewWillUnmount',
  'weekNumberHeaderWillUnmount',
]

export type CallCounts = { [optionName: string]: number }

/*
Option values that count calls without changing output. Options from themes and plugins merge with
these: classnames are joined, `true` content falls back to the theme's or the default content, and
lifecycle callbacks all run (see options-manip.ts).
*/
export function buildCountingOptions(counts: CallCounts): CalendarOptions {
  const options: CalendarOptions = {}

  for (const name of COUNTED_OPTION_NAMES) {
    options[name] = /Content$/.test(name)
      ? () => {
        counts[name] = (counts[name] || 0) + 1
        return true
      }
      : /Class$/.test(name)
        ? () => {
          counts[name] = (counts[name] || 0) + 1
          return ''
        }
        : () => {
          counts[name] = (counts[name] || 0) + 1
        }
  }

  return options
}

// Scenarios
// -------------------------------------------------------------------------------------------------

export interface CountScenario {
  name: string // "<viewType>/<action>"
  options: CalendarOptions
  // the counted action. counts start after the first render settled, except for 'initial'
  action?: (calendar: Calendar, el: HTMLElement) => Promise<void> | void
}

const DATE = '2024-01-17'

const COUNT_RESOURCES = [
  { id: 'a', title: 'Room A' },
  { id: 'b', title: 'Room B' },
  { id: 'c', title: 'Room C', children: [{ id: 'c1', title: 'Room C1' }] },
  { id: 'd', title: 'Room D' },
]

// ~3 events a day through January, some multi-day, some all-day
const BUSY_EVENTS = buildBusyEvents()

const BASE_OPTIONS: CalendarOptions = {
  initialDate: DATE,
  now: `${DATE}T10:15:00`,
  timeZone: 'UTC',
  scrollTime: '08:00',
  height: 700,
  editable: true,
  nowIndicator: true,
  schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
  resources: COUNT_RESOURCES,
  events: BUSY_EVENTS,
}

const VIEWS = [
  'dayGridMonth', 'timeGridWeek', 'resourceTimelineWeek',
  'resourceTimeGridWeek', 'resourceDayGridWeek', // phase 7b (the day-table pipeline)
]

const ACTIONS: { name: string, action?: CountScenario['action'] }[] = [
  { name: 'initial' },
  { name: 'next', action: (calendar) => calendar.next() },
  // an option with no visible effect, to count re-renders from option changes alone
  { name: 'unrelated-option', action: (calendar) => calendar.setOption('dragScroll', false) },
  {
    name: 'add-event',
    action: (calendar) => {
      calendar.addEvent({ title: 'Added', start: `${DATE}T13:00:00`, end: `${DATE}T14:00:00`, resourceId: 'b' })
    },
  },
  {
    name: 'drag',
    action: (calendar) => new Promise<void>((resolve) => {
      const eventEl = calendar.el.querySelector('.fc-event:not(.fc-bg-event)')
      const isVertical = /^(resource)?timeGrid/i.test(calendar.view.type)

      $(eventEl).simulate('drag', {
        dx: isVertical ? 0 : 140,
        dy: isVertical ? 60 : 0,
        onRelease: () => resolve(),
      })
    }),
  },
  {
    name: 'resize-container',
    action: (calendar, el) => {
      el.style.width = '900px'
    },
  },
]

export const COUNT_SCENARIOS: CountScenario[] = []

for (const viewType of VIEWS) {
  for (const { name, action } of ACTIONS) {
    COUNT_SCENARIOS.push({
      name: `${viewType}/${name}`,
      options: { ...BASE_OPTIONS, initialView: viewType },
      action,
    })
  }
}

// phase 7b: dates above resources, and a selection mirror kept across a resource rename
for (const viewType of ['resourceTimeGridWeek', 'resourceDayGridWeek']) {
  for (const { name, action } of ACTIONS) {
    COUNT_SCENARIOS.push({
      name: `${viewType}/dates-above-resources/${name}`,
      options: { ...BASE_OPTIONS, initialView: viewType, datesAboveResources: true },
      action,
    })
  }
}

COUNT_SCENARIOS.push({
  name: 'resourceTimeGridWeek/select-mirror-resource-rename',
  options: { ...BASE_OPTIONS, initialView: 'resourceTimeGridWeek', selectable: true, selectMirror: true },
  action: (calendar) => {
    calendar.select({ start: `${DATE}T13:00:00`, end: `${DATE}T15:00:00`, resourceId: 'b' } as any)
    calendar.getResourceById('b').setProp('title', 'Room B2')
  },
})

function buildBusyEvents() {
  const events = []
  const resourceIds = ['a', 'b', 'c1', 'd']

  for (let day = 1; day <= 31; day += 1) {
    const dayStr = `2024-01-${String(day).padStart(2, '0')}`

    events.push(
      { title: `Morning ${day}`, start: `${dayStr}T09:00:00`, end: `${dayStr}T10:30:00`, resourceId: resourceIds[day % 4] },
      { title: `Lunch ${day}`, start: `${dayStr}T12:00:00`, end: `${dayStr}T13:00:00`, resourceId: resourceIds[(day + 1) % 4] },
      { title: `Afternoon ${day}`, start: `${dayStr}T14:00:00`, end: `${dayStr}T16:00:00`, resourceId: resourceIds[(day + 2) % 4] },
    )

    if (day % 5 === 0) {
      events.push({ title: `All-day ${day}`, start: dayStr, resourceId: resourceIds[(day + 3) % 4] })
    }

    if (day % 7 === 0) {
      events.push({
        title: `Multi-day ${day}`,
        start: dayStr,
        end: `2024-01-${String(Math.min(day + 3, 31)).padStart(2, '0')}`,
        resourceId: resourceIds[day % 4],
      })
    }
  }

  return events
}
