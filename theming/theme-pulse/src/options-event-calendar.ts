import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/daygrid'
import '@fullcalendar/timegrid'
import '@fullcalendar/list'
import '@fullcalendar/multimonth'
import '@fullcalendar/interaction'

const defaultEventColor = 'var(--fc-pulse-event-color)'
const defaultEventContrastColor = 'var(--color-white)'
/*
TODO: default-background-event and selection colors
red: #FF3D57
green: #09B66D
primary-blue: #0081FF
apple-primary-blue: #117aff
apple-red: #fd453b (same for dark mode: #fd3b30)
light-blue: #22CCE2
*/

const dayGridClasses: CalendarOptions = {
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
}

export function createEventCalendarOptions({}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  return {
    optionDefaults: {
      eventColor: defaultEventColor,
      eventContrastColor: defaultEventContrastColor,
      backgroundEventColor: 'var(--color-green-500)',
      // eventDisplay: 'block',

      class: 'gap-6',

      viewClass: `bg-white rounded-lg overflow-hidden border border-[rgb(228_228_229)] [box-shadow:0_1px_2px_rgba(0,0,0,0.1)]`,

      dayHeaderInnerClass: (data) => [
        !data.isToday && 'mx-1',
        'my-1',
        'text-gray-500',
        'p-1 text-sm',
        'flex flex-row items-center',
      ],

      dayHeaderDividerClass: 'border-b border-gray-200',

      dayRowClass: 'border border-gray-200',

      dayCellClass: [
        'border border-gray-200',
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
        'border border-gray-200',
        // data.isToday && 'bg-[#117aff]/5',
      ],

      /*
      TODO: not necessary to have color-class do bg color! we're not doing any transforms
      */
      blockEventClass: 'relative',
      blockEventColorClass: 'absolute z-10 inset-0 bg-(--fc-event-color)',
      blockEventInnerClass: 'relative z-20 text-(--fc-event-contrast-color) text-xs',

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

      allDayDividerClass: 'border-b border-gray-200 shadow-sm',

      slotLabelDividerClass: 'border-s border-gray-200',

      slotLabelClass: 'justify-end',
      slotLabelInnerClass: 'p-2 text-xs text-gray-700',

      slotLaneClass: 'border border-gray-200',

      fillerClass: (data) => [
        !data.isHeader && 'border border-gray-100',
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
