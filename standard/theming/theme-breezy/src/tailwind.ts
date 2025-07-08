import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timeline'

const buttonIconClass = 'size-5 text-gray-400' // best?

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const dayGridClasses: CalendarOptions = {

  /*
  TODO: make new inlineWeekNumberClass / cellWeekNumberClass
  BUG: z-index is wrong, can't click week numbers
  */
  weekNumberClass: (data) => [
    !data.isCell && 'absolute top-0 end-0 border-b border-b-gray-300 border-s border-s-gray-200 rounded-es-md bg-white',
  ],
  weekNumberInnerClass: (data) => [
    !data.isCell && 'px-1 py-0.5 text-xs/6',
  ],

  rowEventClass: (data) => [
    'mb-0.5',
    data.isStart && 'ms-1',
    data.isEnd && 'me-1',
  ],

  /*
  TODO: ensure ellipsis on overflowing title text
  */
  listItemEventClass: 'mb-px mx-1',
  listItemEventInnerClass: 'flex flex-row text-xs/6',
  listItemEventTimeClass: 'order-1 mx-0.5 text-gray-500',
  listItemEventTitleClass: 'flex-grow mx-0.5',
}

/*
NOTE: instead of w-* h-*, just use size-* !!!

TODO: how to do inner drop shadow within scroll area?
*/
export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    eventColor: 'var(--color-blue-500)',
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',

    className: 'rounded-lg overflow-hidden border border-gray-950/10', // TODO: standardize color

    /*
    TODO: add isPrimary button
    */
    toolbarClass: 'px-4 py-4 items-center bg-gray-50 gap-4',
    toolbarSectionClass: 'items-center gap-4',
    toolbarTitleClass: 'text-base font-semibold text-gray-900',

    buttonGroupClass: 'rounded-md shadow-xs',
    buttonClass: (data) => [
      'px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:relative',
      data.inGroup
        ? 'first:rounded-s-md last:rounded-e-md not-last:-me-px'
        : 'rounded-md shadow-xs',
      data.isSelected
        ? 'z-20 bg-indigo-600 text-white'
        : 'z-10 bg-white hover:bg-gray-50 ring ring-inset ring-gray-300',
    ],

    buttons: {
      prev: {
        // TODO: do RTL
        iconContent: () => svgIcons.chevronLeft(buttonIconClass),
      },
      next: {
        iconContent: () => svgIcons.chevronRight(buttonIconClass),
      }
    },

    viewClass: 'border-t border-gray-200', // TODO: make top/bottom border for toolbar???

    dayHeaderClass: 'border items-center',
    dayHeaderInnerClass: 'p-2',

    dayHeaderDividerClass: 'border-b border-gray-300',
    allDayDividerClass: 'border-b border-gray-300',

    dayRowClass: 'border border-gray-200',

    dayCellClass: (data) => [
      'border',
      (data.isOther || data.isDisabled) && 'bg-gray-50',
    ],
    dayCellTopClass: 'flex flex-row justify-start min-h-1',
    dayCellTopInnerClass: (data) => [
      'px-2 py-1 text-xs/6',
      data.isOther ? 'text-gray-400' : 'text-gray-700',
    ],

    dayLaneClass: 'border border-gray-100',

    slotLabelDividerClass: 'border-l border-gray-100',

    allDayHeaderInnerClass: 'text-xs/5 text-gray-400 p-3',

    /*
    Figure out how not having any border on slotLabel affects height-syncing
    */
    slotLabelClass: 'justify-end',
    slotLabelInnerClass: 'text-xs/5 text-gray-400 uppercase min-h-[3em] px-3 relative -top-[0.8em]', // HACK

    slotLaneClass: 'border border-gray-100',

    blockEventClass: 'bg-(--fc-canvas-color) relative',
    blockEventColorClass: 'absolute inset-0 bg-(--fc-event-color) opacity-15',
    blockEventInnerClass: 'relative z-20 text-xs/4',
    blockEventTimeClass: 'text-(--fc-event-color) contrast-150',
    blockEventTitleClass: 'text-(--fc-event-color) brightness-60',

    rowEventClass: (data) => [
      data.isStart && 'rounded-s-md',
      data.isEnd && 'rounded-e-md',
    ],
    rowEventColorClass: (data) => [
      data.isStart && 'rounded-s-md',
      data.isEnd && 'rounded-e-md',
    ],
    rowEventTimeClass: 'p-1',
    rowEventTitleClass: 'p-1',

    columnEventClass: (data) => [
      data.isStart && 'rounded-t-lg',
      data.isEnd && 'rounded-b-lg',
      (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventColorClass: (data) => [
      data.isStart && 'rounded-t-lg',
      data.isEnd && 'rounded-b-lg',
    ],
    columnEventInnerClass: 'py-1',
    columnEventTimeClass: 'px-2 pt-1',
    columnEventTitleClass: 'px-2 py-1 font-semibold',

    moreLinkInnerClass: 'text-xs/6',

    // TODO: event resizing
    // TODO: filler
  },
  views: {
    dayGrid: {
      ...dayGridClasses,
      dayHeaderClass: 'border-gray-200 text-xs/6 font-semibold text-gray-700',
      dayCellClass: 'border-gray-200',
    },
    multiMonth: {
      ...dayGridClasses,
      // TODO: sync with dayGrid?
    },
    timeGrid: {
      ...dayGridClasses,
      dayHeaderClass: 'border-gray-100 text-sm/6 text-gray-500',
      dayCellClass: 'border-gray-100',
      weekNumberClass: 'justify-end items-center',
      weekNumberInnerClass: 'px-3 text-sm/6 text-gray-500',

      columnEventClass: (data) => [
        'mx-1',
        data.isStart && 'mt-1',
        data.isEnd && 'mb-1',
      ],
    },
    timeline: {
    },
    list: {
    },
  },
}) as PluginDef
