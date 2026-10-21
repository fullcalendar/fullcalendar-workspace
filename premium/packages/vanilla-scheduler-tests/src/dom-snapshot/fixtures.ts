import type { Calendar, CalendarOptions } from 'fullcalendar'

/*
Fixtures for the DOM snapshot tool (scripts/bin/dom-snapshot.js). Each fixture renders a calendar,
optionally puts it into some state, and has its DOM serialized. Keep this file free of test-runner
specifics, so another runner could reuse it.
*/

export interface DomFixture {
  name: string // "<viewType>/<variant>"
  options: CalendarOptions
  // put the calendar into the state to snapshot. called after the first render has settled
  setup?: (calendar: Calendar) => Promise<void> | void
  // undo anything setup did outside the calendar (e.g. an in-progress drag)
  teardown?: (calendar: Calendar) => Promise<void> | void
}

const DATE = '2024-01-17' // a Wednesday

const RESOURCES = [
  { id: 'a', title: 'Room A', building: 'North' },
  { id: 'b', title: 'Room B', building: 'North', eventColor: '#2a7' },
  {
    id: 'c',
    title: 'Room C',
    building: 'South',
    children: [
      { id: 'c1', title: 'Room C1', building: 'South' },
      { id: 'c2', title: 'Room C2', building: 'South' },
    ],
  },
  { id: 'd', title: 'Room D', building: 'South' },
]

const EVENTS = [
  { id: 'allday', title: 'All-day', start: '2024-01-17', resourceId: 'a' },
  { id: 'multiday', title: 'Multi-day', start: '2024-01-15', end: '2024-01-19', resourceId: 'b' },
  { id: 'timed1', title: 'Timed 1', start: '2024-01-17T09:00:00', end: '2024-01-17T10:30:00', resourceId: 'a' },
  {
    id: 'timed2',
    title: 'Timed 2, overlapping and colored',
    start: '2024-01-17T09:30:00',
    end: '2024-01-17T11:00:00',
    resourceId: 'a',
    color: '#c33',
    textColor: '#fff',
  },
  { id: 'timed3', title: 'Timed 3', start: '2024-01-17T10:00:00', end: '2024-01-17T10:30:00', resourceId: 'a' },
  { id: 'timed4', title: 'Timed 4', start: '2024-01-17T10:00:00', end: '2024-01-17T11:30:00', resourceId: 'a' },
  {
    id: 'multitimed',
    title: 'Multi-day timed',
    start: '2024-01-16T14:00:00',
    end: '2024-01-18T10:00:00',
    resourceIds: ['c1', 'd'],
  },
  {
    id: 'midnight',
    title: 'Across midnight',
    start: '2024-01-18T22:00:00',
    end: '2024-01-19T02:00:00',
    resourceId: 'c2',
  },
  {
    id: 'weekend',
    title: 'Into the weekend',
    start: '2024-01-19T20:00:00',
    end: '2024-01-21T12:00:00',
    resourceId: 'd',
  },
  { id: 'url', title: 'With url', start: '2024-01-19T13:00:00', url: 'https://example.com/', resourceId: 'b' },
  {
    id: 'bg-timed',
    start: '2024-01-17T12:00:00',
    end: '2024-01-17T14:00:00',
    display: 'background',
    resourceId: 'b',
  },
  { id: 'bg-allday', start: '2024-01-18', display: 'background', resourceId: 'c1' },
  // far away, for year-ish views
  { id: 'march', title: 'In March', start: '2024-03-05T09:00:00', resourceId: 'a' },
  { id: 'june', title: 'In June', start: '2024-06-10', end: '2024-06-13', resourceId: 'b' },
]

const BASE_OPTIONS: CalendarOptions = {
  initialDate: DATE,
  now: `${DATE}T10:15:00`,
  timeZone: 'UTC',
  scrollTime: '08:00',
  height: 700,
  schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source', // no license banner
  resources: RESOURCES,
  events: EVENTS,
}

const DAYGRID_VIEWS = ['dayGridMonth', 'dayGridWeek', 'dayGridDay']
const TIMEGRID_VIEWS = ['timeGridWeek', 'timeGridDay']
const LIST_VIEWS = ['listDay', 'listWeek', 'listMonth', 'listYear']
const TIMELINE_VIEWS = ['timelineDay', 'timelineWeek', 'timelineMonth', 'timelineYear']
const RESOURCE_TIMELINE_VIEWS = ['resourceTimelineDay', 'resourceTimelineWeek', 'resourceTimelineMonth']
const RESOURCE_TIMEGRID_VIEWS = ['resourceTimeGridDay', 'resourceTimeGridWeek']
const RESOURCE_DAYGRID_VIEWS = ['resourceDayGridDay', 'resourceDayGridWeek', 'resourceDayGridMonth']

const ALL_VIEWS = [
  ...DAYGRID_VIEWS,
  ...TIMEGRID_VIEWS,
  ...LIST_VIEWS,
  'multiMonthYear',
  ...TIMELINE_VIEWS,
  ...RESOURCE_TIMELINE_VIEWS,
  ...RESOURCE_TIMEGRID_VIEWS,
  ...RESOURCE_DAYGRID_VIEWS,
]
const GRID_VIEWS = [ // views with day columns that can scroll horizontally
  ...DAYGRID_VIEWS,
  ...TIMEGRID_VIEWS,
  ...RESOURCE_TIMEGRID_VIEWS,
  ...RESOURCE_DAYGRID_VIEWS,
]
const TIME_AXIS_VIEWS = [ // views with a now-indicator
  ...TIMEGRID_VIEWS,
  ...RESOURCE_TIMEGRID_VIEWS,
  'timelineDay',
  'timelineWeek',
  ...RESOURCE_TIMELINE_VIEWS,
]

interface Variant {
  name: string
  views: string[]
  options?: CalendarOptions
  setup?: DomFixture['setup']
  teardown?: DomFixture['teardown']
}

const VARIANTS: Variant[] = [
  { name: 'default', views: ALL_VIEWS },
  { name: 'rtl', views: ALL_VIEWS, options: { direction: 'rtl' } },
  {
    name: 'print',
    views: ALL_VIEWS,
    setup: (calendar) => {
      calendar.trigger('_beforeprint' as any)
    },
    teardown: (calendar) => {
      calendar.trigger('_afterprint' as any)
    },
  },
  { name: 'pannable', views: GRID_VIEWS, options: { dayMinWidth: 220 } },
  {
    name: 'more-links',
    views: [
      ...DAYGRID_VIEWS, ...TIMEGRID_VIEWS, 'multiMonthYear', ...TIMELINE_VIEWS, ...RESOURCE_TIMELINE_VIEWS,
      'resourceTimeGridWeek', 'resourceDayGridWeek', // phase 7b
    ],
    options: { dayMaxEvents: 2, eventMaxStack: 1 },
  },
  {
    name: 'popover',
    views: ['dayGridMonth', 'timeGridWeek', 'resourceTimelineDay', 'resourceTimeGridWeek', 'resourceDayGridWeek'],
    options: { dayMaxEvents: 2, eventMaxStack: 1 },
    setup: async (calendar) => {
      const moreLinkEl = calendar.el.querySelector('[aria-haspopup="dialog"]') as HTMLElement
      moreLinkEl.click()
    },
  },
  {
    name: 'week-numbers',
    views: ['dayGridMonth', 'dayGridWeek', 'timeGridWeek', 'multiMonthYear', 'timelineWeek'],
    options: { weekNumbers: true },
  },
  { name: 'now-indicator', views: TIME_AXIS_VIEWS, options: { nowIndicator: true } },
  {
    name: 'selection',
    views: ['dayGridMonth', 'timeGridWeek', 'resourceTimelineDay', 'resourceTimeGridDay', 'resourceDayGridWeek'],
    options: { selectable: true },
    setup: (calendar) => {
      calendar.select({
        start: `${DATE}T13:00:00`,
        end: `${DATE}T15:00:00`,
        allDay: /dayGrid/i.test(calendar.view.type) ? true : undefined,
        resourceId: calendar.view.type.startsWith('resource') ? 'b' : undefined,
      } as any)
    },
  },
  {
    name: 'hidden-days',
    views: [
      'dayGridMonth', 'timeGridWeek', 'timelineWeek', 'resourceTimelineWeek', 'listWeek',
      'resourceDayGridWeek', 'resourceTimeGridWeek', 'resourceDayGridMonth', // phase 7b
    ],
    options: { weekends: false },
  },
  {
    name: 'grouped',
    views: RESOURCE_TIMELINE_VIEWS.slice(0, 1).concat(RESOURCE_TIMEGRID_VIEWS.slice(0, 1)),
    options: { resourceGroupField: 'building' },
  },
  {
    name: 'collapsed',
    views: ['resourceTimelineDay'],
    options: { resourcesInitiallyExpanded: false },
  },
  {
    name: 'dates-above-resources',
    views: ['resourceTimeGridWeek', 'resourceDayGridWeek', 'resourceDayGridMonth', 'resourceTimeGridDay'],
    options: { datesAboveResources: true },
  },
  {
    name: 'render-hooks',
    views: ['dayGridMonth', 'timeGridWeek', 'listWeek', 'resourceTimelineWeek', 'multiMonthYear'],
    options: {
      eventContent: (info) => {
        switch (info.event.id) {
          case 'timed1':
            return 'string content'
          case 'timed2':
            return { html: '<b>html</b> content' }
          case 'allday': {
            const el = document.createElement('i')
            el.textContent = 'domNodes content'
            return { domNodes: [el] }
          }
          default:
            return true // default content
        }
      },
      eventClass: (info) => (info.event.allDay ? 'hook-event-allday' : 'hook-event-timed'),
      dayCellClass: (info) => (info.isToday ? 'hook-cell-today' : ''),
      dayHeaderContent: (info) => ({ html: `<u>${info.text}</u>` }),
      moreLinkContent: (info) => `${info.num} more!`,
      resourceCellContent: (info) => `resource ${info.resource.id}`,
    },
  },
  {
    name: 'list-empty',
    views: LIST_VIEWS.slice(0, 2),
    options: { events: [] },
  },
  {
    // the drag mirror and the dragged event, mid-drag. RTL because StandardEvent has an RTL hack for it
    name: 'mid-drag-rtl',
    views: ['dayGridMonth', 'timeGridWeek'],
    options: { direction: 'rtl', editable: true },
    setup: (calendar) => {
      const eventEl = findEventEl(calendar, 'Timed 1')
      const rect = eventEl.getBoundingClientRect()
      const start = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }

      $(eventEl).simulate('mousedown', start)

      for (let i = 1; i <= 5; i += 1) {
        $(document).simulate('mousemove', { clientX: start.clientX - i * 20, clientY: start.clientY + i * 20 })
      }
    },
    teardown: (calendar) => {
      $(document).simulate('mouseup', {})
    },
  },

  // phase 7b (planning/phase-7b-day-table-plan.md §4.4): the day-table pipeline's cases
  ...PHASE_7B_VARIANTS(),
]

export const DOM_FIXTURES: DomFixture[] = []

for (const variant of VARIANTS) {
  for (const viewType of variant.views) {
    DOM_FIXTURES.push({
      name: `${viewType}/${variant.name}`,
      options: { ...BASE_OPTIONS, initialView: viewType, ...variant.options },
      setup: variant.setup,
      teardown: variant.teardown,
    })
  }
}

function PHASE_7B_VARIANTS(): Variant[] {
  const WED = '2024-01-17'
  const wednesdayEvents = ['a', 'b', 'c1', 'c2', 'd'].map((resourceId) => ({
    title: `Wed ${resourceId}`, start: `${WED}T09:00:00`, end: `${WED}T10:00:00`, resourceId,
  }))
  const saturdayEvents = ['a', 'b', 'c1', 'c2', 'd'].map((resourceId) => ({
    title: `Sat ${resourceId}`, start: '2024-01-20T09:00:00', end: '2024-01-20T10:00:00', resourceId,
  }))
  const selectTimedInB = (calendar: Calendar) => {
    calendar.select({ start: `${WED}T13:00:00`, end: `${WED}T15:00:00`, resourceId: 'b' } as any)
  }

  return [
    {
      name: 'selection-no-resource',
      views: ['resourceTimeGridDay', 'resourceDayGridWeek'],
      options: { selectable: true },
      setup: (calendar) => {
        calendar.select({
          start: `${WED}T13:00:00`,
          end: `${WED}T15:00:00`,
          allDay: /dayGrid/i.test(calendar.view.type) ? true : undefined,
        } as any)
      },
    },
    {
      name: 'select-mirror',
      views: ['resourceTimeGridWeek', 'timeGridWeek'],
      options: { selectable: true, selectMirror: true },
      setup: (calendar) => {
        calendar.select({
          start: `${WED}T13:00:00`,
          end: `${WED}T15:00:00`,
          resourceId: calendar.view.type.startsWith('resource') ? 'b' : undefined,
        } as any)
      },
    },
    {
      name: 'select-mirror-after-rename',
      views: ['resourceTimeGridWeek'],
      options: { selectable: true, selectMirror: true },
      setup: (calendar) => {
        selectTimedInB(calendar)
        calendar.getResourceById('b').setProp('title', 'Room B2')
      },
    },
    {
      // a real re-parse of a's ui (setProp('eventColor') isn't one): addResource with a's id
      name: 'select-mirror-after-other-ui-change',
      views: ['resourceTimeGridWeek'],
      options: { selectable: true, selectMirror: true },
      setup: (calendar) => {
        selectTimedInB(calendar)
        calendar.addResource({ id: 'a', title: 'Room A', building: 'North', eventColor: '#c0c' }, false)
      },
    },
    {
      name: 'mid-drag',
      views: ['resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: { editable: true },
      setup: (calendar) => startDrag(calendar, 'Timed 1', 1, 0),
      teardown: endDrag,
    },
    {
      name: 'mid-drag-rtl-resources',
      views: ['resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: { editable: true, direction: 'rtl' },
      setup: (calendar) => startDrag(calendar, 'Timed 1', -1, 0),
      teardown: endDrag,
    },
    {
      name: 'mid-drag-multi',
      views: ['resourceTimeGridWeek'],
      options: { editable: true },
      setup: (calendar) => startDrag(calendar, 'Multi-day timed', -1, 0),
      teardown: endDrag,
    },
    {
      name: 'mid-drag-to-allday',
      views: ['timeGridWeek', 'resourceTimeGridWeek'],
      options: { editable: true },
      setup: (calendar) => {
        const eventEl = findEventEl(calendar, 'Timed 1')
        const allDayHeaderEl = calendar.el.querySelector('.fc-timegrid-allday-header') as HTMLElement
        const rect = eventEl.getBoundingClientRect()
        const start = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const targetY = allDayHeaderEl.getBoundingClientRect().top + allDayHeaderEl.getBoundingClientRect().height / 2

        $(eventEl).simulate('mousedown', start)
        for (let i = 1; i <= 5; i += 1) {
          $(document).simulate('mousemove', { clientX: start.clientX, clientY: start.clientY + (targetY - start.clientY) * i / 5 })
        }
      },
      teardown: endDrag,
    },
    {
      // a keyed and a keyless event sharing a groupId: dragging one moves both
      name: 'mid-drag-grouped',
      views: ['resourceTimeGridWeek'],
      options: {
        editable: true,
        events: [
          ...EVENTS,
          { id: 'grouped-a', groupId: 'pair', title: 'Grouped A', start: `${WED}T15:00:00`, end: `${WED}T16:00:00`, resourceId: 'a' },
          { id: 'grouped-none', groupId: 'pair', title: 'Grouped none', start: `${WED}T15:00:00`, end: `${WED}T16:00:00` },
        ],
      },
      setup: (calendar) => startDrag(calendar, 'Grouped A', 1, 0),
      teardown: endDrag,
    },
    {
      // every resource's events on an interior hidden day: resources survive view-wide filtering but
      // none earns a column, so the model falls back to resourceless
      name: 'filtered-fallback',
      views: ['resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: { filterResourcesWithEvents: true, hiddenDays: [3], events: wednesdayEvents, selectable: true, businessHours: true },
      setup: selectTimedInB,
    },
    {
      // the other branch: hidden weekends are trimmed off the range, so view-wide filtering empties resources
      name: 'filtered-empty',
      views: ['resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: { filterResourcesWithEvents: true, weekends: false, events: saturdayEvents },
    },
    {
      name: 'filtered-per-date',
      views: ['resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: { filterResourcesWithEvents: true },
    },
    {
      name: 'filtered-per-date-dates-above',
      views: ['resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: { filterResourcesWithEvents: true, datesAboveResources: true },
    },
    {
      name: 'resourceless',
      views: ['resourceTimeGridDay', 'resourceDayGridWeek'],
      options: { resources: [] },
    },
    {
      name: 'business-hours',
      views: ['resourceTimeGridDay', 'resourceDayGridWeek'],
      options: {
        businessHours: true,
        resources: RESOURCES.map((resource) => (
          resource.id === 'b'
            ? { ...resource, businessHours: { startTime: '12:00', endTime: '20:00', daysOfWeek: [1, 2, 3, 4, 5] } }
            : resource
        )),
      },
    },
    {
      name: 'multi-resource-ties',
      views: ['resourceTimeGridDay'],
      options: {
        events: [
          // a recurring def before a single event with the same title and times: instance order wins
          { title: 'Tie', daysOfWeek: [3], startTime: '13:00', endTime: '14:00', resourceId: 'a' },
          { title: 'Tie', start: `${WED}T13:00:00`, end: `${WED}T14:00:00`, resourceId: 'a' },
          { title: 'Same', start: `${WED}T15:00:00`, end: `${WED}T16:00:00`, resourceId: 'a' },
          { title: 'Same', start: `${WED}T15:00:00`, end: `${WED}T16:00:00`, resourceId: 'b' },
          { title: 'Same', start: `${WED}T15:00:00`, end: `${WED}T16:00:00`, resourceIds: ['a', 'b'] },
        ],
      },
    },
    {
      // individual eventUiBases entries exist only for events from sources
      name: 'source-styles',
      views: ['resourceTimeGridDay', 'resourceTimeGridWeek', 'resourceDayGridWeek'],
      options: {
        events: undefined,
        eventSources: [
          { color: '#a5f', events: [
            { title: 'Source 1', start: `${WED}T09:00:00`, end: `${WED}T10:00:00`, resourceId: 'a' },
            { title: 'Source 2', start: `${WED}T11:00:00`, end: `${WED}T12:00:00`, resourceIds: ['b', 'd'] },
          ] },
          { events: EVENTS },
        ],
      },
    },
    {
      name: 'inverse-bg-shared',
      views: ['resourceTimeGridDay', 'resourceDayGridWeek'],
      options: {
        events: [
          { groupId: 'g', display: 'inverse-background', start: `${WED}T09:00:00`, end: `${WED}T12:00:00`, resourceId: 'a' },
          { groupId: 'g', display: 'inverse-background', start: `${WED}T14:00:00`, end: `${WED}T16:00:00`, resourceIds: ['a', 'b'] },
          // no instance in range: still initializes its group
          { groupId: 'g2', display: 'inverse-background', start: '2024-03-01T09:00:00', end: '2024-03-01T10:00:00', resourceId: 'b' },
          { title: 'Fg', start: `${WED}T10:00:00`, end: `${WED}T11:00:00`, resourceId: 'a' },
        ],
      },
    },
    // standard views
    {
      name: 'list-item-multiday',
      views: ['dayGridMonth'],
      options: { eventDisplay: 'list-item' },
    },
    {
      name: 'inverse-bg',
      views: ['timeGridWeek', 'dayGridMonth'],
      options: {
        events: [
          { groupId: 'g', display: 'inverse-background', start: `${WED}T09:00:00`, end: `${WED}T12:00:00` },
          { groupId: 'g', display: 'inverse-background', start: '2024-03-01T09:00:00', end: '2024-03-01T10:00:00' }, // no in-range instance
          { title: 'Fg', start: `${WED}T10:00:00`, end: `${WED}T11:00:00` },
        ],
      },
    },
    {
      // an all-day background event renders in both lanes; a source-level background display only in the all-day row
      name: 'source-bg-allday',
      views: ['timeGridWeek'],
      options: {
        events: undefined,
        eventSources: [
          { display: 'background', events: [{ start: '2024-01-16', allDay: true }] },
          { events: [{ start: '2024-01-18', allDay: true, display: 'background' }] },
        ],
      },
    },
    {
      // slots past midnight with now after midnight: the line isn't drawn in the previous day's column
      name: 'now-indicator-extended',
      views: ['timeGridDay'],
      options: { nowIndicator: true, slotMaxTime: '26:00', now: '2024-01-18T01:00:00' },
    },
  ]
}

function startDrag(calendar: Calendar, title: string, xSign: number, ySign: number) {
  const eventEl = findEventEl(calendar, title)
  const rect = eventEl.getBoundingClientRect()
  const start = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }

  $(eventEl).simulate('mousedown', start)

  for (let i = 1; i <= 5; i += 1) {
    $(document).simulate('mousemove', { clientX: start.clientX + xSign * i * 20, clientY: start.clientY + ySign * i * 20 })
  }
}

function endDrag() {
  $(document).simulate('mouseup', {})
}

// .fc-event comes from the theme-for-tests plugin
function findEventEl(calendar: Calendar, title: string): HTMLElement {
  for (const el of Array.from(calendar.el.querySelectorAll<HTMLElement>('.fc-event'))) {
    if (el.textContent.includes(title)) {
      return el
    }
  }

  throw new Error(`No event element with title "${title}"`)
}
