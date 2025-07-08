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
  */
  weekNumberClass: (data) => [
    !data.isCell && 'absolute top-0 end-0 border-b border-b-gray-300 border-s border-s-gray-200 rounded-es-md bg-white',
  ],
  weekNumberInnerClass: (data) => [
    !data.isCell && 'px-1 py-0.5 text-xs/6',
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
    eventColor: 'var(--color-red-500)',
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',

    className: 'rounded-lg overflow-hidden border border-gray-950/10', // TODO: standardize color

    /*
    TODO: add isPrimary button
    */
    toolbarClass: 'px-6 py-4 items-center bg-gray-50 gap-4',
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

    dayHeaderClass: 'border border-gray-200 items-center',
    dayHeaderInnerClass: 'p-2',

    dayHeaderDividerClass: 'border-b border-gray-300',
    allDayDividerClass: 'border-b border-gray-300',

    dayRowClass: 'border border-gray-200',

    dayCellClass: (data) => [
      'border border-gray-200',
      (data.isOther || data.isDisabled) && 'bg-gray-50',
    ],
    dayCellTopClass: 'flex flex-row justify-start',
    dayCellTopInnerClass: (data) => [
      'px-2 py-1 text-xs/6',
      data.isOther ? 'text-gray-400' : 'text-gray-700',
    ],

    dayLaneClass: 'border border-gray-200',

    slotLabelDividerClass: 'border-l border-gray-200',

    allDayHeaderInnerClass: 'text-xs/5 text-gray-400 p-3',

    /*
    Figure out how not having any border on slotLabel affects height-syncing
    */
    slotLabelClass: 'justify-end',
    slotLabelInnerClass: 'text-xs/5 text-gray-400 uppercase min-h-[3em] px-3 relative -top-[0.8em]', // HACK

    slotLaneClass: 'border border-gray-200',

    blockEventInnerClass: 'text-xs/6',
    moreLinkInnerClass: 'text-xs/6',
  },
  views: {
    dayGrid: {
      ...dayGridClasses,
      dayHeaderClass: 'text-xs/6 font-semibold text-gray-700',
    },
    multiMonth: {
      ...dayGridClasses,
      // TODO: sync with dayGrid?
    },
    timeGrid: {
      ...dayGridClasses,
      dayHeaderClass: 'text-sm/6 text-gray-500',
      weekNumberClass: 'justify-end items-center',
      weekNumberInnerClass: 'px-3 text-sm/6 text-gray-500',
    },
    timeline: {
    },
    list: {
    },
  },
}) as PluginDef
