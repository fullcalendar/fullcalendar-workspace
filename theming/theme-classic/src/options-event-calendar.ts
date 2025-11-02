import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string
  primaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  mutedSolidBgClass: string
  faintBgClass: string

  // neutral foregrounds
  mutedFgClass: string
  faintFgClass: string

  // neutral borders
  borderColorClass: string
  strongBorderColorClass: string
  primaryBorderColorClass: string

  // strong *button*
  strongSolidPressableClass: string

  // muted-on-hover
  mutedHoverClass: string
  mutedHoverPressableClass: string

  // faint-on-hover
  faintHoverClass: string
  faintHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventBgClass: string

  // misc calendar content
  highlightClass: string
  todayBgNotPrintClass: string
  nowBorderColorClass: string
  nowBorderStartColorClass: string
  nowBorderTopColorClass: string
}

const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height
const cellPaddingClass = 'px-1 py-0.5'
const listViewItemPaddingClass = 'px-3 py-2'
const axisClass = 'justify-end' // h-align

// TODO: kill?
export const getDayHeaderInnerClasses = (data: { isNarrow: boolean }) => [
  `flex flex-col ${cellPaddingClass}`,
  data.isNarrow ? xxsTextClass : 'text-sm',
]

const getAxisInnerClasses = (data: { isNarrow: boolean }) => [
  `${cellPaddingClass} text-end`,
  data.isNarrow ? xxsTextClass : 'text-sm',
]

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute size-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getDayClasses = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => [
    'border',
    data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
    data.isToday && params.todayBgNotPrintClass,
    data.isDisabled && params.faintBgClass,
  ]

  const getSlotClasses = (data: { isMinor: boolean }) => [
    `border ${params.borderColorClass}`,
    data.isMinor && 'border-dotted',
  ]

  const dayRowItemBaseClass = 'mx-0.5 mb-px rounded-sm' // TODO: make x a px val?
  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      `${dayRowItemBaseClass} p-px`,
      data.isSelected
        ? joinClassNames(params.mutedBgClass, data.isDragging && 'shadow-sm')
        : (data.isInteractive ? params.mutedHoverPressableClass : params.mutedHoverClass),
    ],
    listItemEventBeforeClass: (data) => [
      'border-4', // 8px diameter
      data.isNarrow ? 'mx-px' : 'mx-1',
    ],
    listItemEventInnerClass: (data) => [
      'flex flex-row items-center',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: 'p-px whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'p-px font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    rowEventClass: (data) => [
      data.isStart && 'ms-0.5 rounded-s-sm',
      data.isEnd && 'me-0.5 rounded-e-sm',
    ],
    rowEventInnerClass: 'p-px gap-0.5',

    rowMoreLinkClass: (data) => [
      dayRowItemBaseClass,
      params.mutedHoverPressableClass,
      data.isNarrow
        ? `border ${params.primaryBorderColorClass}`
        : 'self-start p-px',
    ],
    rowMoreLinkInnerClass: (data) => [
      'p-px',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,

      tableHeaderClass: (data) => data.isSticky && params.bgClass,

      singleMonthClass: 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-4' : 'py-2',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        'justify-center',
      ],
      singleMonthHeaderInnerClass: 'font-bold',

      popoverClass: `${params.popoverClass} min-w-[220px]`,
      popoverCloseClass: joinClassNames(
        'absolute inline-flex flex-row top-0.5 end-0.5 group',
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ),

      fillerClass: `border ${params.borderColorClass} opacity-50`,
      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      navLinkClass: joinClassNames(
        'hover:underline',
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
        params.outlineInsetClass, // move inside
      ),

      moreLinkClass: joinClassNames(
        params.primaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ),
      moreLinkInnerClass: `whitespace-nowrap overflow-hidden`,

      inlineWeekNumberClass: (data) => [
        `absolute top-0 start-0 rounded-ee-sm p-0.5 text-center`,
        params.mutedFgClass,
        params.mutedBgClass,
        data.isNarrow ? xxsTextClass : 'text-sm',
      ],

      eventClass: (data) => [
        'hover:no-underline',
        params.primaryOutlineColorClass,
        data.isSelected
          ? params.outlineWidthClass
          : params.outlineWidthFocusClass,
      ],

      backgroundEventClass: params.bgEventBgClass,
      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        data.isNarrow ? 'm-1' : 'm-2',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      listItemEventClass: 'items-center',
      listItemEventBeforeClass: 'rounded-full border-(--fc-event-color)',

      blockEventClass: (data) => [
        'bg-(--fc-event-color) border-transparent', // subclasses do print-border-width
        'print:bg-white print:border-(--fc-event-color)',
        'group relative', // for resizers
        params.outlineOffsetClass,
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : joinClassNames(
              'focus-visible:shadow-md',
              data.isDragging && 'opacity-75',
            ),
          // TODO: reintroduce brightness-75 when isSelected?
      ],
      blockEventInnerClass: 'flex text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      rowEventClass: (data) => [
        'mb-px',
        'border-y',
        data.isStart && 'border-s',
        data.isEnd && 'border-e',
      ],
      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventInnerClass: 'flex-row items-center', // sub-classes define padding and gap
      rowEventTimeClass: (data) => [
        'font-bold',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],
      rowEventTitleClass: (data) => [
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      columnEventClass: (data) => [
        'mb-px',
        'border-x',
        data.isStart && 'border-t rounded-t-sm',
        data.isEnd && 'border-b rounded-b-sm',
        `ring ${params.bgRingColorClass}`,
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventInnerClass: (data) => [
        'p-px',
        data.isShort
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: xxsTextClass,
      columnEventTitleClass: (data) => [
        (data.isShort || data.isNarrow)
          ? xxsTextClass
          : 'py-px text-xs',
      ],

      columnMoreLinkClass: [
        `mb-px rounded-sm ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white ring ${params.bgRingColorClass}`,
        params.outlineOffsetClass, // just like block events
      ],
      columnMoreLinkInnerClass: (data) => [
        'p-0.5', // better to use pixels like events?
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
      dayHeaderClass: (data) => [
        data.inPopover ? params.popoverHeaderClass : joinClassNames(
          // TODO: make DRY with what's in options-scheduler.ts ?
          'border',
          data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
          data.isDisabled && params.faintBgClass,
        )
      ],
      dayHeaderInnerClass: getDayHeaderInnerClasses,
      dayHeaderDividerClass: `border-t ${params.borderColorClass}`,

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: getDayClasses,
      dayCellTopClass: [
        'flex flex-row justify-end min-h-[2px]',
      ],
      dayCellTopInnerClass: (data) => [
        'px-1 whitespace-nowrap',
        data.isNarrow ? 'py-0.5' : 'py-1',
        data.monthText && 'font-bold',
        data.isNarrow ? xxsTextClass : 'text-sm',
        data.isOther && params.faintFgClass,
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      dayLaneClass: getDayClasses,
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only
      slotLabelClass: getSlotClasses,
      slotLaneClass: getSlotClasses,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        tableClass: `border ${params.borderColorClass}`,
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-3',

        weekNumberHeaderClass: `${axisClass} items-center`, // v-align
        weekNumberHeaderInnerClass: getAxisInnerClasses,

        allDayHeaderClass: `${axisClass} items-center`, // v-align
        allDayHeaderInnerClass: (data) => [ // sort of like getAxisInnerClasses, but with different padding
          `px-1 py-2 text-end`,
          data.isNarrow ? xxsTextClass : 'text-sm',
          'whitespace-pre', // respects line-breaks in locale data
        ],
        allDayDividerClass: `border-y ${params.borderColorClass} pb-0.5 ${params.mutedBgClass}`,

        slotLabelClass: axisClass,
        slotLabelInnerClass: getAxisInnerClasses,
        slotLabelDividerClass: `border-l ${params.borderColorClass}`,

        nowIndicatorLabelClass: `start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] ${params.nowBorderStartColorClass}`,
        nowIndicatorLineClass: `border-t ${params.nowBorderColorClass}`,
      },
      list: {
        listDayHeaderClass: `flex flex-row justify-between border-b ${params.borderColorClass} ${params.mutedSolidBgClass}`,
        listDayHeaderInnerClass: `${listViewItemPaddingClass} text-sm font-bold`,

        listItemEventClass: (data) => [
          'group gap-3 border-b',
          params.borderColorClass,
          listViewItemPaddingClass,
          data.isInteractive
            ? joinClassNames(
                params.faintHoverPressableClass,
                params.outlineInsetClass, // move inside
              )
            : params.faintHoverClass,
        ],
        listItemEventBeforeClass: 'border-5', // 10px diameter
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'order-[-1] shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-sm', // send to start
        listItemEventTitleClass: (data) => [
          'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: `flex flex-col items-center justify-center ${params.mutedBgClass}`, // TODO: use faintBgClass here?
        noEventsInnerClass: 'sticky bottom-0 py-15',
      },
    },
  }
}
