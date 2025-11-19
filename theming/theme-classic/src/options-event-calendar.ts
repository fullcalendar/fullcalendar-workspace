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

  // neutral buttons
  strongSolidPressableClass: string
  mutedHoverClass: string
  mutedHoverPressableClass: string
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

  // misc content
  highlightClass: string
  todayBgNotPrintClass: string
  nowBorderColorClass: string
  nowBorderStartColorClass: string
  nowBorderTopColorClass: string
}

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {

  /* Common
  ----------------------------------------------------------------------------------------------- */

  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) ${params.bgClass} rounded-full`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getDayClass = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => joinClassNames(
    'border',
    data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
    data.isDisabled ? params.faintBgClass :
      data.isToday && params.todayBgNotPrintClass,
  )

  const getSlotClass = (data: { isMinor: boolean }) => joinClassNames(
    `border ${params.borderColorClass}`,
    data.isMinor && 'border-dotted',
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (data) => [
      `mb-px p-px rounded-sm`,
      data.isNarrow ? 'mx-px' : 'mx-0.5',
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
      'py-px gap-0.5',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],

    listItemEventTimeClass: 'px-px whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'px-px font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    /* Day Row > Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (data) => [
      data.isStart && joinClassNames('rounded-s-sm', data.isNarrow ? 'ms-px' : 'ms-0.5'),
      data.isEnd && joinClassNames('rounded-e-sm', data.isNarrow ? 'me-px' : 'me-0.5'),
    ],

    rowEventInnerClass: 'py-px gap-0.5',
    rowEventTimeClass: 'px-px',
    rowEventTitleClass: 'px-px',

    /* Day Row > More-Link
    --------------------------------------------------------------------------------------------- */

    rowMoreLinkClass: (data) => [
      'mb-px border rounded-sm',
      data.isNarrow
        ? `mx-px ${params.primaryBorderColorClass}`
        : 'self-start mx-0.5 border-transparent',
      params.mutedHoverPressableClass,
    ],

    rowMoreLinkInnerClass: (data) => [
      'p-px',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],
  }

  return {
    optionDefaults: {

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,

      eventClass: (data) => [
        'hover:no-underline',
        data.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              data.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor: params.bgEventColor,
      backgroundEventClass: params.bgEventBgClass,

      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
      ],

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass: 'items-center',
      listItemEventBeforeClass: 'border-(--fc-event-color) rounded-full',

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (data) => [
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        (data.isDragging && !data.isSelected) && 'opacity-75',
        params.outlineOffsetClass,
      ],

      blockEventInnerClass: 'text-(--fc-event-contrast-color) print:text-black flex',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (data) => [
        'mb-px border-y',
        data.isStart && 'border-s',
        data.isEnd && 'border-e',
      ],

      rowEventBeforeClass: (data) => (
        data.isStartResizable && [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ]
      ),

      rowEventAfterClass: (data) => (
        data.isEndResizable && [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ]
      ),

      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      rowEventTimeClass: 'font-bold',

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (data) => [
        'mb-px border-x',
        data.isStart && 'border-t rounded-t-sm',
        data.isEnd && 'border-b rounded-b-sm',
        `ring ${params.bgRingColorClass}`,
      ],

      columnEventBeforeClass: (data) => (
        data.isStartResizable && [
          data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        ]
      ),

      columnEventAfterClass: (data) => (
        data.isEndResizable && [
          data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        ]
      ),

      columnEventInnerClass: (data) => (
        data.isShort
          ? 'flex-row p-0.5 gap-1' // one line
          : 'flex-col px-0.5' // two lines
      ),

      columnEventTimeClass: (data) => [
        !data.isShort && 'pt-0.5',
        xxsTextClass,
      ],

      columnEventTitleClass: (data) => [
        !data.isShort &&  'py-0.5',
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ],

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: [
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],
      moreLinkInnerClass: `whitespace-nowrap overflow-hidden`,

      columnMoreLinkClass: [
        'mb-px rounded-sm border border-transparent print:border-black',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
        params.outlineOffsetClass, // just like block events
      ],
      columnMoreLinkInnerClass: (data) => [
        'p-0.5',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',

      dayHeaderClass: (data) => [
        data.isDisabled && params.faintBgClass,
        data.inPopover
          ? params.popoverHeaderClass
          : joinClassNames(
              'border',
              data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
            )
      ],

      dayHeaderInnerClass: (data) => [
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ],

      dayHeaderDividerClass: `border-b ${params.borderColorClass}`,

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: getDayClass,

      dayCellTopClass: (data) => [
        data.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row justify-end',
      ],

      dayCellTopInnerClass: (data) => [
        'px-1 whitespace-nowrap',
        data.isNarrow
          ? `py-0.5 ${xxsTextClass}`
          : 'py-1 text-sm',
        data.isOther && params.faintFgClass,
        data.monthText && 'font-bold',
      ],

      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: [
        'group absolute top-0.5 end-0.5 inline-flex flex-row',
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: getDayClass,
      dayLaneInnerClass: (data) => (
        data.isSimple
          ? 'm-1' // simple print-view
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      ),

      slotLaneClass: getSlotClass,

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayHeaderClass: [
        `border-b ${params.borderColorClass} ${params.mutedSolidBgClass}`,
        'flex flex-row justify-between',
      ],

      listDayHeaderInnerClass: 'px-3 py-2 text-sm font-bold',

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: 'm-4',

      singleMonthHeaderClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        data.colCount > 1 ? 'pb-4' : 'py-2',
        'justify-center', // h-align
      ],

      singleMonthHeaderInnerClass: 'font-bold',

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass: (data) => data.isSticky && params.bgClass,
      fillerClass: `border ${params.borderColorClass} opacity-50`,

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotLabelRowClass: `border ${params.borderColorClass}`,
      slotLabelClass: getSlotClass,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: [
        'hover:underline',
        params.outlineWidthFocusClass,
        params.outlineInsetClass,
        params.primaryOutlineColorClass,
      ],

      inlineWeekNumberClass: (data) => [
        `absolute top-0 start-0 rounded-ee-sm p-0.5 text-center`,
        params.mutedFgClass,
        params.mutedBgClass,
        data.isNarrow ? xxsTextClass : 'text-sm',
      ],

      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,
    },
    views: {
      dayGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: 'min-h-px',
      },
      multiMonth: {
        ...dayRowCommonClasses,
        dayCellBottomClass: 'min-h-px',

        tableClass: `border ${params.borderColorClass}`,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: 'min-h-3',

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (data) => [
          'px-1 py-0.5',
          data.isNarrow ? xxsTextClass : 'text-sm',
        ],

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center justify-end', // v-align, h-align
        allDayHeaderInnerClass: (data) => [
          /*
          whitespace-pre -- respects line breaks for locale text
          text-end -- aligns text when multi-line
          */
          'px-1 py-2 whitespace-pre text-end',
          data.isNarrow ? xxsTextClass : 'text-sm',
        ],

        allDayDividerClass: `border-y ${params.borderColorClass} pb-0.5 ${params.mutedBgClass}`,

        /* TimeGrid > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelClass: 'justify-end', // h-align
        slotLabelInnerClass: (data) => [
          'px-1 py-0.5',
          data.isNarrow ? xxsTextClass : 'text-sm',
        ],

        slotLabelDividerClass: `border-e ${params.borderColorClass}`,

        /* TimeGrid > Now-Indicator
        ----------------------------------------------------------------------------------------- */

        // create left/right pointing arrow
        nowIndicatorLabelClass: [
          'start-0 -mt-[5px]',
          'border-y-[5px] border-y-transparent',
          `border-s-[6px] ${params.nowBorderStartColorClass}`,
        ],

        nowIndicatorLineClass: `border-t ${params.nowBorderColorClass}`,
      },
      list: {

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (data) => [
          `group px-3 py-2 border-b ${params.borderColorClass} gap-3`,
          data.isInteractive
            ? joinClassNames(params.faintHoverPressableClass, params.outlineInsetClass)
            : params.faintHoverClass,
        ],

        listItemEventBeforeClass: 'border-5', // 10px diameter

        listItemEventInnerClass: '[display:contents]',

        listItemEventTimeClass: [
          '-order-1 shrink-0 w-1/2 max-w-50',
          'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
        ],

        listItemEventTitleClass: (data) => [
          'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
          data.event.url && 'group-hover:underline',
        ],

        /* No-Events Screen
        ----------------------------------------------------------------------------------------- */

        noEventsClass: `${params.mutedBgClass} flex flex-col items-center justify-center`,
        noEventsInnerClass: 'sticky bottom-0 py-15',
      },
    },
  }
}
