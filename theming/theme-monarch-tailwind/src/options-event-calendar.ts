import { CalendarOptions, DayCellInfo, joinClassNames, ViewOptions } from '@fullcalendar/react'
import { filledRightTriangle } from './svgs'

/*
COLOR TODO:
  default-ui/shadcn: transparentPressableClass hover effect is unnoticable in dark mode
  default-ui: dark-mode now-indicator color is ugly pink
  default-ui: business hours a bit too dark (i.e. "faint" color not faint enough)
*/

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/react/daygrid'
import {} from '@fullcalendar/react/timegrid'
import {} from '@fullcalendar/react/list'
import {} from '@fullcalendar/react/multimonth'
import {} from '@fullcalendar/react/interaction'

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  tertiaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  faintBgClass: string

  // neutral foregrounds
  fgClass: string
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
  mutedHoverPressableGroupClass: string

  // popover
  popoverClass: string

  // secondary
  secondaryClass: string
  secondaryPressableClass: string

  // tertiary
  tertiaryClass: string
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventBgClass: string

  // misc content
  highlightClass: string
  nowBorderColorClass: string
}

// usually 11px font / 12px line-height
export const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {

  /* Common
  ----------------------------------------------------------------------------------------------- */

  // transparent resizer for mouse
  const blockPointerResizerClass = 'absolute hidden group-hover:block'
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) ${params.bgClass} rounded-full`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const tallDayCellBottomClass = 'min-h-4'
  const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
    !info.isNarrow && 'min-h-px'
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (info) => joinClassNames(
      'mb-px p-px rounded-sm',
      info.isNarrow ? 'mx-px' : 'mx-0.5',
    ),

    listItemEventBeforeClass: (info) => joinClassNames(
      'border-4', // 8px diameter
      info.isNarrow ? 'ms-0.5' : 'ms-1',
    ),

    listItemEventInnerClass: (info) => (
      info.isNarrow
        ? `py-px ${xxsTextClass}`
        : 'py-0.5 text-xs'
    ),

    listItemEventTimeClass: (info) => joinClassNames(
      info.isNarrow ? 'ps-0.5' : 'ps-1',
      'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ),

    listItemEventTitleClass: (info) => joinClassNames(
      info.isNarrow ? 'px-0.5' : 'px-1',
      'font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ),

    /* Day Row > Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (info) => joinClassNames(
      info.isStart && 'ms-px',
      info.isEnd && 'me-px',
    ),

    rowEventInnerClass: (info) => info.isNarrow ? 'py-px' : 'py-0.5',

    /* Day Row > More-Link
    --------------------------------------------------------------------------------------------- */

    rowMoreLinkClass: (info) => joinClassNames(
      'mb-px border rounded-sm',
      info.isNarrow
        ? `mx-px ${params.primaryBorderColorClass}`
        : 'mx-0.5 border-transparent',
      params.mutedHoverPressableClass,
    ),

    rowMoreLinkInnerClass: (info) => (
      info.isNarrow
        ? `px-0.5 py-px ${xxsTextClass}`
        : 'px-1 py-0.5 text-xs'
    ),
  }

  return {
    optionDefaults: {

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight: 50,
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,

      eventClass: (info) => joinClassNames(
        info.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              info.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor: params.bgEventColor,
      backgroundEventClass: params.bgEventBgClass,

      backgroundEventTitleClass: (info) => joinClassNames(
        'opacity-50 italic',
        info.isNarrow
          ? `px-1 py-1.5 ${xxsTextClass}`
          : 'px-2 py-2.5 text-xs',
      ),

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass: (info) => joinClassNames(
        'items-center',
        info.isSelected
          ? params.mutedBgClass
          : info.isInteractive
            ? params.mutedHoverPressableClass
            : params.mutedHoverClass,
      ),

      listItemEventBeforeClass: 'rounded-full border-(--fc-event-color)',
      listItemEventInnerClass: `${params.fgClass} flex flex-row items-center`, // fgClass needed for DnD

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (info) => joinClassNames(
        'group relative',
        'border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        info.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!info.isSelected && info.isDragging) && 'opacity-75',
      ),

      blockEventInnerClass: 'text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden',
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden',

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (info) => joinClassNames(
        'mb-px border-y',
        info.isStart ? 'border-s rounded-s-sm' : (!info.isNarrow && 'ms-2'), // space for triangle
        info.isEnd ? 'border-e rounded-e-sm' : (!info.isNarrow && 'me-2'), // space for triangle
      ),

      rowEventBeforeClass: (info) => joinClassNames(
        info.isStartResizable ? joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ) : (!info.isStart && !info.isNarrow) && joinClassNames(
          'absolute -start-2 w-2 -top-px -bottom-px' // housing for triangle
        )
      ),

      rowEventBeforeContent: (info) => (
        (!info.isStart && !info.isNarrow) && filledRightTriangle(
          'size-full rotate-180 [[dir=rtl]_&]:rotate-0 text-(--fc-event-color)',
        )
      ),

      rowEventAfterClass: (info) => joinClassNames(
        info.isEndResizable ? joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ) : (!info.isEnd && !info.isNarrow) && joinClassNames(
          'absolute -end-2 w-2 -top-px -bottom-px', // housing for triangle
        )
      ),

      rowEventAfterContent: (info) => (
        (!info.isEnd && !info.isNarrow) && filledRightTriangle(
          'size-full [[dir=rtl]_&]:rotate-180 text-(--fc-event-color)',
        )
      ),

      rowEventInnerClass: (info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      ),

      rowEventTimeClass: (info) => joinClassNames(
        'font-bold shrink-1', // shrinks second
        info.isNarrow ? 'ps-0.5' : 'ps-1',
      ),

      rowEventTitleClass: (info) => joinClassNames(
        'shrink-100', // shrinks first
        info.isNarrow ? 'px-0.5' : 'px-1',
      ),

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventTitleSticky: false, // disabled because title is below time

      columnEventClass: (info) => joinClassNames(
        `border-x ring ${params.bgRingColorClass}`,
        info.isStart && 'border-t rounded-t-sm',
        info.isEnd && 'mb-px border-b rounded-b-sm',
      ),

      columnEventBeforeClass: (info) => joinClassNames(
        info.isStartResizable && joinClassNames(
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        ),
      ),

      columnEventAfterClass: (info) => joinClassNames(
        info.isEndResizable && joinClassNames(
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        ),
      ),

      columnEventInnerClass: (info) => joinClassNames(
        'flex',
        info.isShort
          ? 'flex-row items-center p-1 gap-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              info.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      ),

      columnEventTimeClass: (info) => joinClassNames(
        'order-1 shrink-100', // appears below, shrinks first
        !info.isShort && (info.isNarrow ? 'pb-0.5' : 'pb-1'),
      ),

      columnEventTitleClass: (info) => joinClassNames(
        'shrink-1', // appears above, shrinks second
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
      ),

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: joinClassNames(
        'mb-px border border-transparent print:border-black rounded-sm',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
      ),
      columnMoreLinkInnerClass: (info) => (
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      ),

      /* Day Header
      ------------------------------------------------------------------------------------------- */
      // dayHeaderContent in slots.tsx...

      dayHeaderAlign: 'center', // h-align

      dayHeaderClass: (info) => joinClassNames(
        'justify-center', // v-align
        info.isMajor && `border ${params.strongBorderColorClass}`,
        (info.isDisabled && !info.inPopover) && params.faintBgClass,
      ),

      dayHeaderInnerClass: (
        'group mt-2 mx-2 flex flex-col items-center outline-none' // children do focus outline
      ),

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: (info) => joinClassNames(
        'border',
        info.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        info.isDisabled && params.faintBgClass,
      ),

      dayCellTopClass: (info) => joinClassNames(
        'flex flex-row',
        info.isNarrow
          ? 'justify-end min-h-px'
          : 'justify-center min-h-0.5',
      ),

      dayCellTopInnerClass: (info) => joinClassNames(
        'flex flex-row items-center justify-center whitespace-nowrap rounded-full',
        info.isNarrow
          ? `m-px h-5 ${xxsTextClass}`
          : 'm-1.5 h-6 text-sm',
        info.text === info.dayNumberText
          ? (info.isNarrow ? 'w-5' : 'w-6') // circle
          : (info.isNarrow ? 'px-1' : 'px-2'), // pill
        info.isToday
          ? (info.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
          : (info.hasNavLink && params.mutedHoverPressableClass),
        info.isOther && params.faintFgClass,
        info.monthText && 'font-bold',
      ),

      dayCellInnerClass: (info) => joinClassNames(info.inPopover && 'p-2'),

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat: { day: 'numeric', weekday: 'short' },

      popoverClass: `${params.popoverClass} min-w-60`,

      popoverCloseClass: joinClassNames(
        'group absolute top-2 end-2 size-8 rounded-full',
        'items-center justify-center', // v-align, h-align
        params.mutedHoverPressableClass,
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: (info) => joinClassNames(
        'border',
        info.isMajor ? params.strongBorderColorClass : params.borderColorClass,
        info.isDisabled && params.faintBgClass,
      ),
      dayLaneInnerClass: (info) => (
        info.isStack
          ? 'm-1' // simple print-view
          : info.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      ),

      slotLaneClass: (info) => joinClassNames(
        `border ${params.borderColorClass}`,
        info.isMinor && 'border-dotted',
      ),

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayFormat: { day: 'numeric' },
      listDayAltFormat: { month: 'short', weekday: 'short', forceCommas: true },

      listDayClass: (info) => joinClassNames(
        !info.isLast && `border-b ${params.borderColorClass}`,
        'flex flex-row items-start',
      ),

      listDayHeaderClass: 'p-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2',
      listDayHeaderInnerClass: (info) => (
        !info.level
          // main day-header
          ? joinClassNames(
              'h-9 rounded-full flex flex-row items-center text-lg',
              info.text === info.dayNumberText
                ? 'w-9 justify-center' // circle
                : 'px-3', // pill
              info.isToday
                ? (info.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
                : (info.hasNavLink && params.mutedHoverPressableClass)
            )
          // alt day-header
          : joinClassNames(
              'text-xs uppercase',
              info.hasNavLink && 'hover:underline',
            )
      ),

      listDayEventsClass: 'grow min-w-0 py-2 gap-1',

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: (info) => joinClassNames(
        info.multiMonthColumnCount > 1 && 'm-4',
        (info.multiMonthColumnCount === 1 && !info.isLast) &&
          `${params.borderColorClass} border-b`,
      ),

      singleMonthHeaderClass: (info) => joinClassNames(
        info.multiMonthColumnCount > 1
          ? 'pb-2'
          : `py-1 border-b ${params.borderColorClass} ${params.bgClass}`,
        'items-center', // h-align
      ),

      singleMonthHeaderInnerClass: (info) => joinClassNames(
        'px-3 py-1 rounded-full text-base font-bold',
        info.hasNavLink && params.mutedHoverPressableClass,
      ),

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass: params.bgClass,

      fillerClass: (info) => joinClassNames(
        'opacity-50 border',
        info.isHeader ? 'border-transparent' : params.borderColorClass,
      ),

      dayNarrowWidth: 100,
      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),

      inlineWeekNumberClass: (info) => joinClassNames(
        'absolute flex flex-row items-center whitespace-nowrap', // v-align
        info.isNarrow
          ? `top-0.5 start-0 my-px h-4 pe-1 rounded-e-full ${xxsTextClass}` // half-pill
          : 'top-1.5 start-1 h-6 px-2 rounded-full text-sm', // pill
        info.hasNavLink
          ? params.secondaryPressableClass
          : params.secondaryClass,
      ),

      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: joinClassNames(
        `-m-[6px] border-6 ${params.nowBorderColorClass} size-0 rounded-full`,
        `ring-2 ${params.bgRingColorClass}`,
      ),
    },
    views: {

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      dayGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      multiMonth: {
        ...dayRowCommonClasses,
        dayHeaderInnerClass: (info) => joinClassNames(!info.inPopover && 'mb-2'),
        dayHeaderDividerClass: (info) => joinClassNames(
          info.multiMonthColumnCount === 1 &&
            `border-b ${params.borderColorClass}`,
        ),
        tableBodyClass: (info) => joinClassNames(
          info.multiMonthColumnCount > 1 &&
            `border ${params.borderColorClass} rounded-sm overflow-hidden`,
        ),
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: tallDayCellBottomClass,

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (info) => joinClassNames(
          'ms-1 my-2 flex flex-row items-center rounded-full',
          info.options.dayMinWidth !== undefined && 'me-1', // when h-scrolling
          info.isNarrow
            ? 'h-5 px-1.5 text-xs'
            : 'h-6 px-2 text-sm',
          info.hasNavLink
            ? params.secondaryPressableClass
            : params.secondaryClass,
        ),

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center justify-end', // v-align, h-align
        allDayHeaderInnerClass: (info) => joinClassNames(
          /*
          */
          'p-2 text-end',
          info.isNarrow ? xxsTextClass : 'text-sm',
        ),

        // divider between all-day section and slots below
        allDayDividerClass: `border-b ${params.borderColorClass}`,

        /* TimeGrid > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderClass: (info) => joinClassNames(
          'w-2 self-end justify-end', // self-h-align, h-align
          `border ${params.borderColorClass}`,
          info.isMinor && 'border-dotted',
        ),
        slotHeaderInnerClass: (info) => joinClassNames(
          'relative ps-2 pe-3 py-2',
          info.isNarrow
            ? `-top-4 ${xxsTextClass}`
            : '-top-5 text-sm',
          info.isFirst && 'hidden',
        ),

        slotHeaderDividerClass: (info) => joinClassNames(
          'border-e',
          (info.isHeader && info.options.dayMinWidth === undefined)
            ? 'border-transparent'
            : params.borderColorClass,
        ),
      },
      list: {

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: 'group p-2 rounded-s-full gap-2',
        listItemEventBeforeClass: 'mx-2 border-5', // 10px diameter
        listItemEventInnerClass: 'gap-2 text-sm',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: (info) => joinClassNames(
          'grow min-w-0 whitespace-nowrap overflow-hidden',
          info.event.url && 'group-hover:underline',
        ),

        /* No-Events Screen
        ----------------------------------------------------------------------------------------- */

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
