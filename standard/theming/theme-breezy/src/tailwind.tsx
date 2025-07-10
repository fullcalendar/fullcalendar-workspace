import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import * as svgIcons from './svgIcons.js'

// Will import ambient types during dev but strip out for build
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timeline'

const xxsTextClass = 'text-[0.7rem]/[1.25]' // about 11px when default 16px root font size

const buttonIconClass = 'size-5 text-gray-400' // best?

/*
applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
TODO: rename to "dayRowContent" or something
TODO: audit all forced line-heights. not a fan

Some dark mode:
https://tailwindcss.com/plus/ui-blocks/application-ui/lists/tables

User different navbar for view-selector:
https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs#component-2a66fc822e8ad55f59321825e5af0980

Flyout menus:
https://tailwindcss.com/plus/ui-blocks/marketing/elements/flyout-menus#component-25601925ae83e51e1b31d3bd1c286515

Themes should completely decide if list-view dayheaders are sticky (put in the changelog?)

TODO: add all the whitespace-nowrap overflow-hidden to the text divs
  add to checklist

TODO: fix popover styling

TODO: multi-month SINGLE-col sticky mess

TODO: audit other more-link styles (not just for daygrid)

TODO: now indicator
TODO: shadow on resourceArea?
*/
const dayGridClasses: CalendarOptions = {

  /*
  TODO: make new inlineWeekNumberClass / cellWeekNumberClass
  BUG: z-index is wrong, can't click week numbers
  */
  weekNumberClass: (data) => [
    !data.isCell && (
      'absolute z-10 top-0 end-0 border-b border-b-gray-300 border-s border-s-gray-200 rounded-es-md bg-white'
    ),
  ],
  weekNumberInnerClass: (data) => [
    !data.isCell && (
      'py-0.5 ' +
        (data.isCompact
          ? xxsTextClass + ' px-0.5'
          : 'text-xs/6 px-1')
    ),
  ],

  rowEventClass: (data) => [
    data.isCompact ? 'mb-px' : 'mb-0.5',
    data.isStart && (data.isCompact ? 'ms-px' : 'ms-1'),
    data.isEnd && (data.isCompact ? 'me-px' : 'me-1'),
  ],

  /*
  TODO: ensure ellipsis on overflowing title text
  TODO: add-back space between time/title? (try ellipsis first)
  */
  listItemEventClass: 'mx-1 mb-px hover:bg-gray-100 rounded-md',
  listItemEventInnerClass: 'p-1 flex flex-row text-xs/4',
  listItemEventTimeClass: 'order-1 text-gray-500',
  listItemEventTitleClass: 'flex-grow font-medium',

  rowMoreLinkClass: (data) => [
    'flex flex-row',
    data.isCompact ? 'mx-px' : 'mx-1',
    data.isCompact && 'border rounded-sm border-indigo-600',
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-xs',
    !data.isCompact && 'p-1',
    'whitespace-nowrap overflow-hidden',
  ]
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

    popoverClass: 'border border-gray-300 shadow-md bg-white rounded-lg m-1',
    popoverBodyClass: 'p-2 min-w-50',

    buttonGroupClass: (data) => [
      !data.isViewGroup && 'rounded-md shadow-xs border border-gray-300'
    ],
    buttonClass: (data) => [
      'py-2.5 text-sm focus:relative',
      data.isIconOnly ? 'px-2.5' : 'px-3.5',
      data.inViewGroup ? (
        'rounded-md font-medium text-gray-600 hover:text-gray-800 ' +
        (data.isSelected
          ? 'bg-gray-200'
          : '')
        //
        // Colored version:
        // 'rounded-md font-medium hover:text-gray-800 ' +
        // (data.isSelected
        //   ? 'bg-indigo-100 text-indigo-700'
        //   : 'text-gray-600')
      ) : (
        'bg-white hover:bg-gray-50 font-semibold text-gray-900 ' +
        (data.inGroup
          ? 'first:rounded-s-md last:rounded-e-md'
          : 'rounded-md shadow-xs border border-gray-300')
      ),
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

    dayHeaderClass: 'items-center',
    dayHeaderInnerClass: 'p-2 flex flex-row items-center',
    dayHeaderContent: (data) => (
      <Fragment>
        {data.textParts.map((textPart) => (
          textPart.type !== 'day' ? (
            <span className='whitespace-pre'>{textPart.value}</span>
          ) : (
            data.isToday ? (
              <span className='font-semibold w-8 h-8 whitespace-pre rounded-full bg-indigo-600 text-white flex flex-row items-center justify-center ms-1'>{textPart.value}</span>
            ) : (
              <span className='font-semibold h-8 whitespace-pre flex flex-row items-center'>{textPart.value}</span>
            )
          )
        ))}
      </Fragment>
    ),

    dayRowClass: 'border border-gray-200',

    dayCellClass: (data) => [
      'border',
      (data.isOther || data.isDisabled) && 'bg-gray-50',
    ],
    dayCellTopClass: 'flex flex-row justify-start min-h-1',
    dayCellTopInnerClass: (data) => [
      data.isCompact ? xxsTextClass : 'text-xs/6',
      !data.isCompact && 'p-1',
      data.isOther ? 'text-gray-400' : 'text-gray-700',
      !data.isToday && 'mx-1',
    ],
    dayCellTopContent: (data) => (
      <Fragment>
        {data.textParts.map((textPart) => (
          textPart.type !== 'day' ? (
            <span className='whitespace-pre'>{textPart.value}</span>
          ) : (
            data.isToday ? (
              <span className='w-[2em] h-[2em] flex flex-row items-center justify-center whitespace-pre rounded-full bg-indigo-600 text-white font-semibold'>{textPart.value}</span>
            ) : (
              <span className='h-[2em] flex flex-row items-center justify-center whitespace-pre'>{textPart.value}</span>
            )
          )
        ))}
      </Fragment>
    ),

    dayLaneClass: 'border border-gray-100',

    allDayHeaderInnerClass: 'text-xs/5 text-gray-400 p-3',

    slotLabelInnerClass: 'text-xs/5 text-gray-400 uppercase',

    slotLaneClass: 'border border-gray-100',

    blockEventClass: 'bg-(--fc-canvas-color) relative',
    blockEventColorClass: 'absolute inset-0 bg-(--fc-event-color) opacity-15',
    blockEventInnerClass: 'relative z-20 text-xs/4 flex', // NOTE: subclass determines direction
    /*
    ^^^NOTE: should core determine flex-direction because core needs to do sticky anyway, right!?
    */
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
    rowEventInnerClass: 'flex-row',
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
    columnEventInnerClass: 'flex-col py-1',
    // TODO: move the x-padding to the inner div? same concept with row-events
    columnEventTimeClass: 'px-2 pt-1',
    columnEventTitleClass: 'px-2 py-1 font-semibold',

    rowMoreLinkInnerClass: 'rounded-md hover:bg-gray-100',

    fillerClass: 'border border-gray-100 bg-white',

    listDaysClass: 'px-4 my-10 mx-auto w-full max-w-200',
    listDayClass: 'flex flex-row not-last:border-b not-last:border-gray-200',
    listDayHeaderClass: 'w-40',
    listDayHeaderInnerClass: 'sticky top-0 py-4 text-sm text-gray-500',
    listDayEventsClass: 'flex-grow flex flex-col',

    singleMonthClass: 'm-5',
    singleMonthTitleClass: 'text-center text-sm font-semibold text-gray-900 pb-2',

    // TODO: event resizing
    // TODO: do isMajor border as darker (and put into checklist)

    // Premium
    // ---------------------------------------------------------------------------------------------

    resourceAreaDividerClass: 'border-l border-gray-300',

    resourceAreaHeaderRowClass: 'border border-gray-200',
    resourceAreaHeaderClass: 'border border-gray-100',
    resourceAreaHeaderInnerClass: 'p-2 text-sm',

    resourceAreaRowClass: 'border border-gray-200',
    resourceCellClass: 'border border-gray-100',
    resourceCellInnerClass: 'p-2 text-sm',

    resourceGroupHeaderClass: 'bg-gray-50',
    resourceGroupHeaderInnerClass: 'p-2 text-sm',

    resourceGroupLaneClass: 'border border-gray-200 bg-gray-50',
    resourceLaneClass: 'border border-gray-200',
    // resourceLaneTopClass: 'h-0.5',
    // resourceLaneBottomClass: 'h-1', // fix BUG, why this need to be so thick?

    resourceExpanderClass: 'self-center',
    resourceExpanderContent: (data) => // TODO: support RTL
      svgIcons.chevronRight(
        'w-[1.2em] h-[1.2em] relative left-1' +
        (data.isExpanded ? ' rotate-90' : '')
      )
  },
  views: {
    dayGrid: {
      ...dayGridClasses,
      dayHeaderDividerClass: 'border-b border-gray-300',
      dayHeaderClass: 'border border-gray-200 text-xs/6 font-semibold text-gray-700',
      dayCellClass: 'border-gray-200',
    },
    multiMonth: {
      ...dayGridClasses,
      dayHeaderInnerClass: 'text-xs/6 text-gray-500',

      tableBodyClass: 'ring-1 ring-gray-200 shadow-sm ring ring-gray-200 rounded-md overflow-hidden',

      // TODO: sync with dayGrid?
    },
    timeGrid: {
      ...dayGridClasses,

      allDayDividerClass: 'border-b border-gray-300 shadow-sm',

      dayHeaderDividerClass: (data) => [
        'border-b',
        data.hasAllDaySlot ? 'border-gray-200' : 'border-gray-300 shadow-sm',
      ],
      dayHeaderClass: 'border border-gray-100 text-sm/6 text-gray-500',
      dayCellClass: 'border-gray-100',
      weekNumberClass: 'justify-end items-center',
      weekNumberInnerClass: 'px-3 text-sm/6 text-gray-500',

      /*
      Figure out how not having any border on slotLabel affects height-syncing
      */
      slotLabelClass: 'justify-end',
      slotLabelInnerClass: 'min-h-[3em] px-3 relative -top-[0.8em]', // HACK

      slotLabelDividerClass: 'border-l border-gray-100',

      columnEventClass: (data) => [
        'mx-1',
        data.isStart && 'mt-1',
        data.isEnd && 'mb-1',
      ],
    },
    timeline: {
      slotLabelDividerClass: 'border-t border-gray-300',

      slotLabelAlign: 'center',
      slotLabelClass: 'justify-end',
      slotLabelInnerClass: '-ms-1 pe-6 py-2',
      //^^^wait, we don't want do this this for upper-level slot labels

      rowEventClass: 'mb-px',
    },
    list: {
      listItemEventClass: 'not-last:border-b not-last:border-gray-200',
      listItemEventInnerClass: 'py-4 flex flex-row text-sm',

      // TODO: make this common?...
      listItemEventTimeClass: 'order-1 text-gray-500',
      listItemEventTitleClass: 'flex-grow font-semibold text-gray-900',
    },
  },
}) as PluginDef
