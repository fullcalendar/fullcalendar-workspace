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
  faintBgClass: string

  // neutral foregrounds
  mutedFgBorderColorClass: string
  faintFgClass: string

  // neutral borders
  borderColorClass: string
  strongBorderColorClass: string

  // neutral buttons
  strongSolidPressableClass: string
  mutedPressableClass: string
  mutedHoverClass: string
  mutedHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryClass: string
  primaryBorderColorClass: string
  primaryPressableClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  eventFaintBgClass: string
  eventFaintPressableClass: string
  eventMutedBgClass: string
  eventMutedPressableClass: string
  bgEventColor: string
  bgEventBgClass: string

  // misc content
  highlightClass: string
  nowBorderColorClass: string
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
  const blockTouchResizerClass = `absolute size-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const tallDayCellBottomClass = 'min-h-4'
  const getShortDayCellBottomClass = (data: { isNarrow: boolean }) => (
    !data.isNarrow && 'min-h-px'
  )

  const getSlotClass = (data: { isMinor: boolean }) => joinClassNames(
    `border ${params.borderColorClass}`,
    data.isMinor && 'border-dotted',
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (data) => [
      'mb-px p-px rounded-sm',
      data.isNarrow ? 'mx-px' : 'mx-0.5',
      data.isSelected
        ? params.mutedBgClass
        : data.isInteractive
          ? params.mutedHoverPressableClass
          : params.mutedHoverClass,
    ],

    listItemEventBeforeClass: (data) => [
      'border-4 border-(--fc-event-color) rounded-full', // 8px diameter
      data.isNarrow ? 'ms-0.5' : 'ms-1',
    ],

    listItemEventInnerClass: (data) => (
      data.isNarrow
        ? `py-px ${xxsTextClass}`
        : 'py-0.5 text-xs'
    ),

    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'ps-0.5' : 'ps-1',
      'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],

    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'px-0.5' : 'px-1',
      'font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ],

    /* Day Row > Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (data) => data.isEnd && (data.isNarrow ? 'me-px' : 'me-0.5'),
    rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

    /* Day Row > More-Link
    --------------------------------------------------------------------------------------------- */

    rowMoreLinkClass: (data) => [
      'mb-px border rounded-sm',
      data.isNarrow
        ? `mx-px ${params.primaryBorderColorClass}`
        : 'mx-0.5 border-transparent self-start',
      params.mutedHoverPressableClass,
    ],

    rowMoreLinkInnerClass: (data) => [
      data.isNarrow
        ? `px-0.5 py-px ${xxsTextClass}`
        : `px-1 py-0.5 text-xs`
    ],
  }

  return {
    optionDefaults: {

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight: 50,
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,

      eventClass: (data) => [
        data.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              data.isDragging && 'shadow-lg',
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
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      ],

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass: 'items-center',
      listItemEventInnerClass: 'flex flex-row items-center',

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (data) => [
        'group relative border-(--fc-event-color) print:bg-white',
        data.isInteractive
          ? params.eventMutedPressableClass
          : params.eventMutedBgClass,
        (data.isDragging && !data.isSelected) && 'opacity-75',
        params.outlineOffsetClass,
      ],

      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (data) => [
        /*
        items-center -- for valigning title and <> arrows
        */
        'mb-px not-print:py-px print:border-y items-center',
        data.isStart && 'border-s-6 rounded-s-sm',
        data.isEnd && 'not-print:pe-px print:border-e rounded-e-sm',
      ],

      rowEventBeforeClass: (data) => (
        data.isStartResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-2', // more than 1 to overcome start-border
        ] : (!data.isStart && !data.isNarrow) && [
          // continuation arrow
          `ms-1 size-2 border-t-1 border-s-1 ${params.mutedFgBorderColorClass}`,
          '-rotate-45 [[dir=rtl]_&]:rotate-45',
        ]
      ),

      rowEventAfterClass: (data) => (
        data.isEndResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ] : (!data.isEnd && !data.isNarrow) && [
          // continuation arrow
          `me-1 size-2 border-t-1 border-e-1 ${params.mutedFgBorderColorClass}`,
          'rotate-45 [[dir=rtl]_&]:-rotate-45',
        ]
      ),

      rowEventInnerClass: (data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      rowEventTimeClass: (data) => [
        'font-medium',
        data.isNarrow ? 'ps-0.5' : 'ps-1',
      ],

      rowEventTitleClass: (data) => (
        data.isNarrow ? 'px-0.5' : 'px-1'
      ),

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (data) => [
        'border-s-6 not-print:pe-px print:border-e',
        data.isStart && 'not-print:pt-px print:border-t rounded-t-sm',
        data.isEnd && 'mb-px not-print:pb-px print:border-b rounded-b-sm',
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

      columnEventInnerClass: (data) => [
        'flex',
        data.isShort
          ? 'flex-row items-center p-1 gap-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              data.isNarrow ? 'px-0.5' : 'px-1',
            )
      ],

      columnEventTimeClass: (data) => [
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1'),
        xxsTextClass,
      ],

      columnEventTitleClass: (data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ],

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: [
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: [
        'mb-px border border-transparent print:border-black rounded-sm',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
        params.outlineOffsetClass, // just like block events
      ],
      columnMoreLinkInnerClass: (data) => (
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      ),

      /* Day Header
      ------------------------------------------------------------------------------------------- */
      // dayHeaderContent in slots.tsx...

      dayHeaderAlign: (data) => data.isNarrow ? 'center' : 'start',

      dayHeaderClass: (data) => [
        'justify-center', // v-align
        data.isToday && !data.level && 'relative', // contain wide top-border
        data.isDisabled && params.faintBgClass,
        data.inPopover
          ? params.popoverHeaderClass
          : joinClassNames(
              data.isMajor ? `border ${params.strongBorderColorClass}` :
                !data.isNarrow && `border ${params.borderColorClass}`,
            ),
      ],

      dayHeaderInnerClass: (data) => [
        data.isToday && data.level && 'relative', // contain narrow top-border
        'p-2 flex flex-col',
        data.hasNavLink && joinClassNames(
          params.mutedHoverPressableClass,
          params.outlineInsetClass, // move inside
        )
      ],

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        /*
        don't display bg-color for other-month/disabled cells when businessHours is doing the same
        */
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && params.faintBgClass,
      ],

      dayCellTopClass: (data) => [
        data.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row',
        /*
        when businessHours owns the cell bg-color, use faint-text to denote other-month/disabled
        */
        ((data.isOther || data.isDisabled) && data.options.businessHours) && params.faintFgClass,
      ],

      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center justify-center whitespace-nowrap',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        data.isToday
          ? joinClassNames(
              'rounded-full',
              data.isNarrow ? 'ms-px' : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6') // circle
                : (data.isNarrow ? 'px-1' : 'px-2'), // pill
              data.hasNavLink
                ? joinClassNames(params.primaryPressableClass, params.outlineOffsetClass)
                : params.primaryClass,
            )
          : joinClassNames( // ghost-button
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && params.mutedHoverPressableClass,
            ),
        data.monthText && 'font-bold',
      ],

      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat: { day: 'numeric', weekday: 'long' },

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: [
        'group absolute top-1 end-1 p-1 rounded-sm inline-flex flex-row',
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: (data) => [
        'border',
        data.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => (
        data.isSimple
          ? 'm-1' // simple print-view
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      ),

      slotLaneClass: getSlotClass,

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass: `not-last:border-b ${params.borderColorClass} flex flex-row items-start`,

      listDayHeaderClass: (data) => [
        'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
        data.isToday && `border-s-4 ${params.primaryBorderColorClass}`,
      ],
      listDayHeaderInnerClass: (data) => [
        'my-0.5',
        !data.level
          ? joinClassNames('text-lg', data.isToday && 'font-bold')
          : 'text-xs',
        data.hasNavLink && 'hover:underline',
      ],

      listDayEventsClass: 'p-4 grow min-w-0 items-stretch gap-4',

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: 'm-4',

      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-4' : 'py-2',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        'items-center', // h-align
      ],

      singleMonthHeaderInnerClass: (data) => [
        'px-1 rounded-sm font-bold',
        data.hasNavLink && params.mutedHoverPressableClass,
        !data.isNarrow && 'text-lg',
      ],

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass: (data) => data.isSticky && params.bgClass,
      fillerClass: `border ${params.borderColorClass} opacity-50`,

      dayNarrowWidth: 100,
      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotLabelRowClass: `border ${params.borderColorClass}`,
      slotLabelClass: getSlotClass,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: [
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ],

      inlineWeekNumberClass: (data) => [
        'absolute end-0 whitespace-nowrap rounded-s-sm',
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink
          ? params.mutedPressableClass
          : params.mutedBgClass,
      ],

      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: [
        `-m-[6px] border-6 ${params.nowBorderColorClass} size-0 rounded-full`,
        `ring-2 ${params.bgRingColorClass}`,
      ],
    },
    views: {

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      dayGrid: {
        ...dayRowCommonClasses,
        dayHeaderDividerClass: `border-b ${params.borderColorClass}`,
        dayCellBottomClass: getShortDayCellBottomClass,

        // day-numbers are on start-side, so move bg-event titles to end-side
        backgroundEventInnerClass: 'flex flex-row justify-end',
      },
      dayGridMonth: {
        // core normally display short for month (like "Mon") but long (like "Monday") looks good in Forma
        dayHeaderFormat: { weekday: 'long' },
      },
      multiMonth: {
        ...dayRowCommonClasses,
        dayHeaderDividerClass: (data) => data.isSticky && `border-b ${params.borderColorClass}`,
        dayCellBottomClass: getShortDayCellBottomClass,

        tableBodyClass: `border ${params.borderColorClass} rounded-sm overflow-hidden`,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayHeaderDividerClass: `border-b ${params.borderColorClass}`,
        dayCellBottomClass: tallDayCellBottomClass,
        dayHeaderAlign: 'start', // overrides general option

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-end justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (data) => [
          'm-1 p-1 rounded-sm text-xs',
          data.hasNavLink && params.mutedHoverPressableClass,
        ],

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center justify-end', // v-align, h-align
        allDayHeaderInnerClass: (data) => [
          /*
          whitespace-pre -- respects line breaks for locale text
          text-end -- aligns text when multi-line
          */
          'p-2 whitespace-pre text-end',
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        allDayDividerClass: `border-b ${params.borderColorClass}`,

        /* TimeGrid > Slot Label
        ----------------------------------------------------------------------------------------- */

        slotLabelClass: 'justify-end', // h-align
        slotLabelInnerClass: (data) => [
          'p-2',
          data.isNarrow ? xxsTextClass : 'text-xs',
        ],

        slotLabelDividerClass: `border-e ${params.borderColorClass}`,
      },
      list: {

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (data) => [
          'group border-s-6 border-(--fc-event-color) p-3 rounded-sm',
          data.isInteractive
            ? params.eventFaintPressableClass
            : params.eventFaintBgClass,
        ],

        listItemEventInnerClass: 'gap-2 text-sm',

        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',

        listItemEventTitleClass: (data) => [
          'grow min-w-0 whitespace-nowrap overflow-hidden font-semibold',
          data.event.url && 'group-hover:underline',
        ],

        /* No-Events Screen
        ----------------------------------------------------------------------------------------- */

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
