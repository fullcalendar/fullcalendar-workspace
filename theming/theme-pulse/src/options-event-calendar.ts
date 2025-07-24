import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/daygrid'
import '@fullcalendar/timegrid'
import '@fullcalendar/list'
import '@fullcalendar/multimonth'
import '@fullcalendar/interaction'

/*
TODO: default-background-event and selection colors
red: #FF3D57
green: #09B66D
primary-blue: #0081FF
apple-primary-blue: #117aff
apple-red: #fd453b (same for dark mode: #fd3b30)
light-blue: #22CCE2

TODO: implement now-indicator
TODO: text-gray-500 is yucky for Shadcn
*/

const dayGridClasses: CalendarOptions = {
  /*
  TODO: make new inlineWeekNumberClass / cellWeekNumberClass
  BUG: z-index is wrong, can't click week numbers
  */
  weekNumberClass: (data) => [
    !data.isCell && (
      'absolute z-10 top-0 start-0'
    ),
  ],
  weekNumberInnerClass: (data) => [
    !data.isCell && (
      'py-2 text-xs text-gray-700 ' +
        (data.isCompact
          ? 'px-1'
          : 'px-2')
    ),
  ],

  rowEventClass: (data) => [
    'mb-0.5',
    data.isStart && 'ms-1',
    data.isEnd && 'me-1',
  ],

  listItemEventClass: 'mx-1 p-1 mb-0.5 hover:bg-gray-100 rounded-sm',
  listItemEventInnerClass: 'flex flex-row text-xs',
  listItemEventTimeClass: 'order-1',
  listItemEventTitleClass: 'font-medium flex-grow',

  rowEventTimeClass: 'order-1',
  rowEventTitleClass: 'flex-grow',

  moreLinkClass: 'mx-1 flex flex-row',
  moreLinkInnerClass: `p-1 text-xs font-medium rounded-sm bg-[#eeeeef]`,
  //^^^ setting that lets you do just "+3"
}

export interface EventCalendarOptionParams {
  todayCircleBgColorClass: string
  todayCircleTextColorClass: string

  borderColorClass: string
  // majorBorderColorClass: string // TODO

  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  const borderClass = `border ${params.borderColorClass}`

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.backgroundEventColor,
      // eventDisplay: 'block',

      class: 'gap-6',

      viewClass: 'bg-white rounded-lg overflow-hidden ' +
        'border border-[rgb(228_228_229)] [box-shadow:0_1px_2px_rgba(0,0,0,0.1)]',
        // ^^^ what is this border!?

      dayHeaderInnerClass: (data) => [
        !data.isToday && 'mx-1',
        'my-1',
        'text-gray-500',
        'p-1 text-sm',
        'flex flex-row items-center',
      ],

      dayHeaderDividerClass: `border-b ${params.borderColorClass}`,

      dayRowClass: borderClass,

      dayCellClass: [
        borderClass,
        // data.isToday && 'bg-[#0081FF]/5',
      ],
      dayCellTopClass: 'flex flex-row justify-end min-h-1',
      dayCellTopInnerClass: (data) => [
        !data.isToday && 'mx-1',
        data.isOther ? 'text-gray-500' : 'font-semibold',
        'p-1 text-sm',
        'flex flex-row',
      ],

      dayLaneClass: [
        borderClass,
        // data.isToday && 'bg-[#117aff]/5',
      ],

      /*
      TODO: not necessary to have color-class do bg color! we're not doing any transforms
      */
      blockEventClass: 'relative',
      blockEventColorClass: 'absolute z-10 inset-0 bg-(--fc-event-color)',
      blockEventInnerClass: 'relative z-20 text-(--fc-event-contrast-color) text-xs',

      backgroundEventColorClass: 'bg-(--fc-event-color) ' + params.backgroundEventColorClass,
      backgroundEventTitleClass: [
        'm-2 opacity-50 italic',
        'text-xs', // data.isCompact ? xxsTextClass : 'text-xs', -- TODO
      ],

      rowEventColorClass: (data) => [
        data.isStart && 'rounded-s-sm',
        data.isEnd && 'rounded-e-sm',
      ],
      rowEventInnerClass: 'flex flex-row',
      rowEventTimeClass: 'p-1',
      rowEventTitleClass: 'p-1 font-medium',
      //^^^for row event, switch order of title/time?

      columnEventColorClass: (data) => [
        data.isStart && 'rounded-t-lg',
        data.isEnd && 'rounded-b-lg',
        (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
      ],
      columnEventInnerClass: 'flex-col py-1',
      // TODO: move the x-padding to the inner div? same concept with row-events
      columnEventTimeClass: 'px-2 pt-1',
      columnEventTitleClass: 'px-2 py-1 font-medium',

      allDayHeaderInnerClass: 'p-2 text-xs text-gray-700',

      allDayDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

      slotLabelDividerClass: `border-s ${params.borderColorClass}`,

      slotLabelClass: 'justify-end',
      slotLabelInnerClass: 'p-2 text-xs text-gray-700',

      slotLaneClass: borderClass,

      fillerClass: (data) => [
        !data.isHeader && `${borderClass} opacity-50`,
      ],
    },
    views: {
      dayGrid: {
        ...dayGridClasses,
        dayHeaderClass: 'items-end',
      },
      multiMonth: {
        ...dayGridClasses,
      },
      timeGrid: {
        ...dayGridClasses,
        dayHeaderClass: 'items-center',
        weekNumberClass: 'justify-end items-center',
        weekNumberInnerClass: 'px-2 text-sm text-gray-700',

        columnEventClass: (data) => [
          'mx-0.5', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-0.5',
          data.isEnd && 'mb-0.5',
        ],
      },
      list: {
      },
    },
  }
}
