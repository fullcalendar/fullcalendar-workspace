import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

/*
TODO:
  how to add top border to header cell. can we do it with impunity?
  make event selected state be solid color (like apple calendar)

Colors:
https://react.fluentui.dev/?path=/docs/theme-colors--docs
For color variations, see different brand colors:
https://fluent2.microsoft.design/color
spacing and whatnot:
https://react.fluentui.dev/?path=/docs/theme-spacing--docs

TODO: put blue line at top of popover when isToday?

TODO: week numbers in small singleMonths look bad

BUG: +more-popover in multimonth has popover-header content centered

TODO: ensure +more link has same height as normal event, even in condensed multimonth

TODO: bottom border radius weird
TODO: ensure button-group (non-view) looks okay. not hover-only

TODO: pressdown color on Today button looks mushy

TODO: make Today button border darker

TODO: remove navlink underline effect. outlook doesn't use underlines at all

TODO: timeGrid short-event doesn't put title+time on same line

TODO: negative margins on timegrid slot labels not working anymore

TODO: nicer rounded styling for more-link in timegrid/timeline
*/

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height
const cellPaddingClass = 'p-2'
const axisClass = 'justify-end' // align axisInner right
const axisInnerClass = `${cellPaddingClass} text-end` // align text right when multiline

const getSlotClasses = (data: { isMinor: boolean }, borderClass: string) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

export interface EventCalendarOptionParams {
  primaryClass: string // bg & fg
  primaryPressableClass: string

  secondaryClass: string // bg & fg
  secondaryPressableClass: string

  ghostHoverClass: string
  ghostPressableClass: string

  mutedClass: string
  mutedPressableClass: string

  strongBgClass: string
  mutedBgClass: string
  faintBgClass: string
  highlightClass: string

  borderColorClass: string
  primaryBorderColorClass: string
  strongBorderColorClass: string
  nowBorderColorClass: string

  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventColorClass: string

  popoverClass: string

  bgClass: string
  bgOutlineColorClass: string

  mutedFgClass: string
}

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const dayGridItemClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link
  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      dayGridItemClass,
      'p-px',
      'items-center',
      data.isSelected
        ? joinClassNames(params.mutedBgClass, data.isDragging && 'shadow-sm')
        : (data.isInteractive ? params.ghostPressableClass : params.ghostHoverClass),
    ],
    listItemEventColorClass: (data) => [
      data.isCompact ? 'mx-px' : 'mx-1',
      'border-4', // 8px diameter circle

      // Dot uses border instead of bg because it shows up in print
      // Views must decide circle radius via border thickness
      'rounded-full border-(--fc-event-color)',
    ],
    listItemEventInnerClass: (data) => [
      'flex flex-row items-center', // as opposed to display:contents
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: 'p-0.5 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'p-0.5 font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    rowEventClass: (data) => [
      data.isEnd && 'me-0.5',
    ],

    rowMoreLinkClass: (data) => [
      dayGridItemClass,
      data.isCompact
        ? `border ${params.primaryBorderColorClass}`
        : 'self-start p-px',
      params.ghostPressableClass,
    ],
    rowMoreLinkInnerClass: (data) => [
      'p-0.5',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      backgroundEventColor: params.bgEventColor,

      tableHeaderClass: (data) => data.isSticky && params.bgClass,

      navLinkClass: 'hover:underline', // TODO: kill

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      // TODO: fix problem with huge hit area for title
      popoverClass: 'min-w-[220px] ' + params.popoverClass,
      popoverCloseClass: 'absolute top-2 end-2',

      inlineWeekNumberClass: (data) => [
        'absolute z-20 top-1 end-0 rounded-s-full',
        data.hasNavLink
          ? params.mutedPressableClass
          : params.mutedClass,
      ],
      inlineWeekNumberInnerClass: (data) => [
        data.isCompact ? xxsTextClass : 'text-xs',
        'py-1 pe-1 ps-2 text-center',
        params.mutedFgClass,
      ],

      // misc BG
      fillerClass: `border ${params.borderColorClass} opacity-50`,
      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      eventClass: (data) => data.event.url && 'hover:no-underline',

      backgroundEventColorClass: 'bg-(--fc-event-color) brightness-150 opacity-15',
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      blockEventClass: [
        'relative', // for absolute-positioned color
        'group', // for focus and hover
        params.bgClass,
        'border-(--fc-event-color)',
        // TODO: isDragging, isSelected
        'p-px',
      ],
      blockEventColorClass: [
        'absolute inset-0 bg-(--fc-event-color) print:bg-white not-print:opacity-30',
        'border-(--fc-event-color)',
      ],
      blockEventInnerClass: [
        'relative z-10 flex', // TODO
      ],
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      rowEventClass: (data) => [
        'mb-px', // space between events
        'flex flex-row items-center', // for valigning title and <> arrows
        data.isStart && 'border-s-6 rounded-s-sm',
        data.isEnd && 'rounded-e-sm',
      ],
      rowEventBeforeClass: (data) => data.isStartResizable ? [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ] : [
        // the < continuation
        !data.isStart && (
          'relative z-10 size-2 border-t-1 border-s-1 border-gray-500 ms-1' +
          ' -rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventAfterClass: (data) => data.isEndResizable ? [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ] : [
        // the > continuation
        !data.isEnd && (
          'relative z-10 size-2 border-t-1 border-e-1 border-gray-500 me-1' +
          ' rotate-45' // TODO: make RTL-friendly
        )
      ],
      rowEventColorClass: (data) => [
        'print:border-y',
        data.isEnd && 'rounded-e-sm print:border-e',
      ],
      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: 'p-0.5',
      rowEventTitleClass: 'p-0.5',

      columnEventClass: (data) => [
        'border-s-6 rounded-s-sm rounded-e-sm mb-px',
        (data.level || data.isMirror) && `outline ${params.bgOutlineColorClass}`
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventColorClass: (data) => [
        'print:border-e',
        data.isStart && 'print:border-t',
        data.isEnd && 'print:border-b rounded-e-sm',
      ],
      columnEventInnerClass: (data) => [
        data.isCompact
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: [
        'p-0.5', // TODO: DRY with rowEvent?
        xxsTextClass,
      ],
      columnEventTitleClass: (data) => [
        'p-0.5', // TODO: DRY with rowEvent?
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      // MultiMonth
      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthHeaderClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        data.colCount > 1 ? 'pb-4' : 'py-2',
        'justify-center',
      ],
      singleMonthHeaderInnerClass: (data) => [
        'text-center font-bold rounded-sm px-1',
        data.hasNavLink && params.ghostPressableClass,
        data.isCompact ? 'text-base' : 'text-lg', // need to specify "base". no
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderClass: (data) => [
        !data.isCompact && `border ${params.borderColorClass}`, // HACK for no-show-border in multimonth
        (data.isDisabled || data.inPopover) && params.faintBgClass,
        data.isToday && !data.level && 'relative', // contain wide top-border
      ],
      dayHeaderInnerClass: (data) => [
        'p-2 flex flex-col', // TODO: adjust padding when isCompact?
        data.isCompact ? xxsTextClass : 'text-xs',
        data.isToday && data.level && 'relative', // contain narrow top-border
      ],

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        (data.isDisabled || data.isOther) && params.faintBgClass,
      ],
      dayCellTopClass: [
        'flex flex-row',
        'min-h-[2px]', // effectively 2px top padding when no day-number
      ],
      dayCellTopInnerClass: (data) => [
        'px-1 py-1 flex flex-row',
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],
      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      allDayDividerClass: `border-t ${params.borderColorClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: `border ${params.borderColorClass}`, // Timeline
      slotLabelAlign: 'center',
      slotLabelClass: (data) => getSlotClasses(data, `border ${params.borderColorClass}`),
      slotLaneClass: (data) => getSlotClasses(data, `border ${params.borderColorClass}`),

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} outline-2 ${params.bgOutlineColorClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,

        dayHeaderDividerClass: ['border-t', params.borderColorClass],

        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        ...dayRowItemClasses,

        dayHeaderDividerClass: (data) => data.isSticky && ['border-t', params.borderColorClass],

        dayHeaderAlign: 'center', // TODO: give start-aligned when !data.isCompact -- but prop doesnt exist!

        tableBodyClass: [
          'border', params.borderColorClass,
          'rounded-sm overflow-hidden',
        ],

        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayRowItemClasses,
        // TODO: DRY
        dayHeaderDividerClass: ['border-t', params.borderColorClass],

        dayCellBottomClass: 'min-h-4', // for ALL-DAY

        allDayHeaderClass: [
          axisClass,
          'items-center', // valign
        ],
        allDayHeaderInnerClass: (data) => [
          axisInnerClass,
          'whitespace-pre', // respects line-breaks in locale data
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        weekNumberHeaderClass: `${axisClass} items-end`,
        weekNumberHeaderInnerClass: (data) => [
          axisInnerClass,
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        // TODO: move to general settings? or always have this type of thing in timeGrid?
        // TODO: keep DRY with timeline rowMoreLink
        columnMoreLinkClass: `relative mb-px p-px rounded-xs ${params.bgClass} outline ${params.bgOutlineColorClass}`,
        columnMoreLinkColorClass: `z-0 absolute inset-0 ${params.strongBgClass} print:bg-white print:border print:border-black`,
        columnMoreLinkInnerClass: 'z-10 p-0.5 text-xs',

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [
          axisInnerClass,
          data.isCompact ? xxsTextClass : 'text-xs',
        ],

        slotLabelDividerClass: `border-l ${params.borderColorClass}`,
      },
      list: {
        listDayClass: `not-last:border-b ${params.borderColorClass} flex flex-row items-start`,
        listDayHeaderClass: 'top-0 sticky shrink-0 w-1/4 max-w-40 p-3 flex flex-col',
        listDayHeaderInnerClass: (data) => [
          data.level ? 'text-xs' : ('text-lg' + (data.isToday ? ' font-bold' : '')),
        ],
        listDayEventsClass: 'grow min-w-0 flex flex-col items-stretch gap-4 p-4',

        listItemEventClass: `${params.bgClass} p-3 flex flex-row rounded-sm border-s-6 border-(--fc-event-color) relative`, // why the hover color!?
        listItemEventColorClass: 'absolute inset-0 bg-(--fc-event-color) opacity-20 rounded-e-sm',

        listItemEventInnerClass: 'relative flex flex-row gap-2 text-sm',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: 'grow min-w-0 font-semibold whitespace-nowrap overflow-hidden text-ellipsis',

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
