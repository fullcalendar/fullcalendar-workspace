import { describeRenderHookContract, RenderHookArea } from '../lib/render-hook-contract'

/*
The user-visible contract of every render-hook area in the standard views.
See lib/render-hook-contract.ts
*/

const DATE = '2024-01-17' // a Wednesday

const BASE_OPTIONS = {
  initialDate: DATE,
  now: `${DATE}T10:15:00`,
  timeZone: 'UTC',
  scrollTime: '08:00',
}

const EVENTS = [
  { title: 'Event A', start: `${DATE}T09:00:00`, end: `${DATE}T10:00:00` },
  { title: 'Event B', start: `${DATE}T11:00:00`, end: `${DATE}T12:00:00` },
]

const AREAS: RenderHookArea[] = [
  {
    name: 'allDayHeader',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek' },
    classOption: 'allDayHeaderClass',
    contentOption: 'allDayHeaderContent',
    hasDefaultContent: true,
    didMountOption: 'allDayHeaderDidMount',
    willUnmountOption: 'allDayHeaderWillUnmount',
    infoKeys: ['text', 'view'],
  },
  {
    name: 'backgroundEvent',
    options: {
      ...BASE_OPTIONS,
      initialView: 'timeGridWeek',
      events: [{ title: 'Background', start: `${DATE}T09:00:00`, end: `${DATE}T10:00:00`, display: 'background' }],
    },
    classOption: 'backgroundEventClass',
    contentOption: 'backgroundEventContent',
    hasDefaultContent: true,
    didMountOption: 'backgroundEventDidMount',
    willUnmountOption: 'backgroundEventWillUnmount',
    infoKeys: ['event', 'view'],
  },
  {
    name: 'dayCell',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth' },
    classOption: 'dayCellClass',
    contentOption: 'dayCellTopContent', // renders inside the cell
    didMountOption: 'dayCellDidMount',
    willUnmountOption: 'dayCellWillUnmount',
    infoKeys: ['date', 'isToday', 'view'],
  },
  {
    name: 'dayCellTop',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth' },
    classOption: 'dayCellTopClass',
    contentOption: 'dayCellTopContent',
    hasDefaultContent: true,
    infoKeys: ['date', 'view'],
  },
  {
    name: 'dayHeader',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek' },
    classOption: 'dayHeaderClass',
    contentOption: 'dayHeaderContent',
    hasDefaultContent: true,
    didMountOption: 'dayHeaderDidMount',
    willUnmountOption: 'dayHeaderWillUnmount',
    infoKeys: ['date', 'text', 'view'],
  },
  {
    name: 'event',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', events: EVENTS },
    classOption: 'eventClass',
    contentOption: 'eventContent',
    hasDefaultContent: true,
    didMountOption: 'eventDidMount',
    willUnmountOption: 'eventWillUnmount',
    infoKeys: ['event', 'timeText', 'view'],
  },
  {
    name: 'inlineWeekNumber',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', weekNumbers: true },
    classOption: 'inlineWeekNumberClass',
    contentOption: 'inlineWeekNumberContent',
    hasDefaultContent: true,
    didMountOption: 'inlineWeekNumberDidMount',
    willUnmountOption: 'inlineWeekNumberWillUnmount',
    infoKeys: ['num', 'text'],
  },
  {
    name: 'listDayHeader',
    options: { ...BASE_OPTIONS, initialView: 'listWeek', events: EVENTS },
    classOption: 'listDayHeaderClass',
    contentOption: 'listDayHeaderContent',
    contentSlotsPerEl: 2, // called for both inner parts of the header
    hasDefaultContent: true,
    didMountOption: 'listDayHeaderDidMount',
    willUnmountOption: 'listDayHeaderWillUnmount',
    infoKeys: ['date', 'view'],
  },
  {
    name: 'moreLink',
    options: {
      ...BASE_OPTIONS,
      initialView: 'dayGridMonth',
      dayMaxEvents: 1,
      events: EVENTS,
    },
    classOption: 'moreLinkClass',
    contentOption: 'moreLinkContent',
    hasDefaultContent: true,
    didMountOption: 'moreLinkDidMount',
    willUnmountOption: 'moreLinkWillUnmount',
    infoKeys: ['num', 'text', 'view'],
  },
  {
    name: 'noEvents',
    options: { ...BASE_OPTIONS, initialView: 'listWeek', events: [] },
    classOption: 'noEventsClass',
    contentOption: 'noEventsContent',
    hasDefaultContent: true,
    didMountOption: 'noEventsDidMount',
    willUnmountOption: 'noEventsWillUnmount',
    infoKeys: ['text', 'view'],
  },
  {
    name: 'nowIndicatorHeader',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek', nowIndicator: true },
    classOption: 'nowIndicatorHeaderClass',
    contentOption: 'nowIndicatorHeaderContent',
    didMountOption: 'nowIndicatorHeaderDidMount',
    willUnmountOption: 'nowIndicatorHeaderWillUnmount',
    infoKeys: ['date', 'view'],
  },
  {
    name: 'nowIndicatorLine',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek', nowIndicator: true },
    classOption: 'nowIndicatorLineClass',
    contentOption: 'nowIndicatorLineContent',
    didMountOption: 'nowIndicatorLineDidMount',
    willUnmountOption: 'nowIndicatorLineWillUnmount',
    infoKeys: ['date', 'view'],
  },
  {
    name: 'slotHeader',
    options: { ...BASE_OPTIONS, initialView: 'timeGridDay' },
    classOption: 'slotHeaderClass',
    contentOption: 'slotHeaderContent',
    hasClassOnlyEls: true, // minor slots have no label, content or mount hooks
    hasDefaultContent: true,
    didMountOption: 'slotHeaderDidMount',
    willUnmountOption: 'slotHeaderWillUnmount',
    infoKeys: ['date', 'text', 'view'],
  },
  {
    name: 'weekNumberHeader',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek', weekNumbers: true },
    classOption: 'weekNumberHeaderClass',
    contentOption: 'weekNumberHeaderContent',
    hasDefaultContent: true,
    didMountOption: 'weekNumberHeaderDidMount',
    willUnmountOption: 'weekNumberHeaderWillUnmount',
    infoKeys: ['num', 'text'],
  },
  {
    name: 'dayLane',
    options: { ...BASE_OPTIONS, initialView: 'timeGridWeek' },
    classOption: 'dayLaneClass',
    didMountOption: 'dayLaneDidMount',
    willUnmountOption: 'dayLaneWillUnmount',
    infoKeys: ['date', 'view'],
  },
  {
    name: 'slotLane',
    options: { ...BASE_OPTIONS, initialView: 'timeGridDay' },
    classOption: 'slotLaneClass',
    didMountOption: 'slotLaneDidMount',
    willUnmountOption: 'slotLaneWillUnmount',
    infoKeys: ['date', 'view'],
  },
  {
    name: 'singleMonth',
    options: { ...BASE_OPTIONS, initialView: 'multiMonthYear' },
    classOption: 'singleMonthClass',
    didMountOption: 'singleMonthDidMount',
    willUnmountOption: 'singleMonthWillUnmount',
    infoKeys: ['multiMonthColumns', 'isFirst', 'isLast'],
  },
  {
    name: 'view',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth' },
    classOption: 'viewClass',
    didMountOption: 'viewDidMount',
    willUnmountOption: 'viewWillUnmount',
    infoKeys: ['view'],
  },
  {
    name: 'popoverClose',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', dayMaxEvents: 1, events: EVENTS },
    setup: openFirstPopover,
    classOption: 'popoverCloseClass',
    isClassStringOnly: true,
    contentOption: 'popoverCloseContent',
    hasDefaultContent: true,
  },
  {
    name: 'rowEventBefore',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', events: [{ title: 'All-day', start: DATE }] },
    classOption: 'rowEventBeforeClass',
    contentOption: 'rowEventBeforeContent',
    infoKeys: ['event', 'view'],
  },
  {
    name: 'rowEventAfter',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth', events: [{ title: 'All-day', start: DATE }] },
    classOption: 'rowEventAfterClass',
    contentOption: 'rowEventAfterContent',
    infoKeys: ['event', 'view'],
  },
  {
    // per-button hooks, not top-level options
    name: 'button',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth' },
    classOption: 'class',
    didMountOption: 'didMount',
    willUnmountOption: 'willUnmount',
    buildOption: (name, value) => ({ buttons: { today: { [name]: value } } }),
    infoKeys: ['name', 'text'],
  },
  {
    name: 'buttonIcon',
    options: { ...BASE_OPTIONS, initialView: 'dayGridMonth' },
    classOption: 'class', // on the button, which contains the icon
    contentOption: 'iconContent',
    hasDefaultContent: true,
    buildOption: (name, value) => ({ buttons: { prev: { [name]: value } } }),
    knownBugs: {
      // per-button options merge shallowly with the theme's (mergeMaybePropsDepth1), so a user's
      // iconContent replaces the theme's instead of falling back to it
      contentTrue: 'returning true renders no icon instead of the theme\'s',
    },
  },
]

for (const area of AREAS) {
  describeRenderHookContract(area)
}

function openFirstPopover() {
  const moreLinkEl = document.querySelector('[aria-haspopup="dialog"]') as HTMLElement
  moreLinkEl.click()
}
