import { CalendarOptions, DayCellInfo, joinClassNames, ViewOptions } from '@fullcalendar/react'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/react/daygrid'
import {} from '@fullcalendar/react/timegrid'
import {} from '@fullcalendar/react/list'
import {} from '@fullcalendar/react/multimonth'
import {} from '@fullcalendar/react/interaction'

/*
COLOR TODO:
  Bad that timegrid slots are bolder than daygridheaders in same view?
  Rethink daygrid day-number color/boldness

REFERENCE:
  https://themeforest.net/item/arion-admin-dashboard-ui-kit-sketch-template/23432569
  colors from template:
    red: #FF3D57
    green: #09B66D
    primary-blue: #0081FF
    apple-primary-blue: #117aff
    apple-red: #fd453b (same for dark mode: #fd3b30)
    light-blue: #22CCE2
*/

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string
  tertiaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  faintBgClass: string
  faintSolidBgClass: string

  // neutral foregrounds
  fgClass: string
  mutedFgClass: string

  // neutral borders
  borderColorClass: string
  strongBorderColorClass: string

  // neutral buttons
  strongSolidPressableClass: string
  mutedPressableClass: string
  mutedHoverClass: string
  mutedHoverPressableClass: string

  // faint-on-hover
  faintHoverClass: string
  faintHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryBorderColorClass: string

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

  const tallDayCellBottomClass = 'min-h-3'
  const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
    !info.isNarrow && 'min-h-0.5'
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (info) => joinClassNames(
      'mb-px p-px rounded-sm',
      info.isNarrow ? 'mx-0.5' : 'mx-1',
      info.isSelected
        ? params.mutedBgClass
        : info.isInteractive
          ? params.mutedHoverPressableClass
          : params.mutedHoverClass,
    ),

    listItemEventInnerClass: (info) => joinClassNames(
      'flex flex-row items-center justify-between',
      info.isNarrow
        ? `py-px ${xxsTextClass}`
        : 'py-0.5 text-xs',
    ),

    listItemEventTimeClass: (info) => joinClassNames(
      info.isNarrow ? 'px-px' : 'px-0.5',
      'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ),

    listItemEventTitleClass: (info) => joinClassNames(
      info.isNarrow ? 'px-px' : 'px-0.5',
      'font-medium whitespace-nowrap overflow-hidden shrink-100', // shrinks first
      info.timeText && 'text-ellipsis',
    ),

    /* Day Row > Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (info) => joinClassNames(
      info.isStart && (info.isNarrow ? 'ms-0.5' : 'ms-1'),
      info.isEnd && (info.isNarrow ? 'me-0.5' : 'me-1'),
    ),

    rowEventInnerClass: (info) => info.isNarrow ? 'py-px' : 'py-0.5',

    /* Day Row > More-Link
    --------------------------------------------------------------------------------------------- */

    rowMoreLinkClass: (info) => joinClassNames(
      'mb-px border rounded-sm',
      info.isNarrow
        ? `mx-0.5 ${params.primaryBorderColorClass} ${params.mutedHoverPressableClass}`
        : `self-start mx-1 border-transparent ${params.mutedPressableClass}`,
    ),

    rowMoreLinkInnerClass: (info) => joinClassNames(
      info.isNarrow
        ? `p-px ${xxsTextClass}`
        : 'p-0.5 text-xs',
      params.fgClass,
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
              info.isDragging && 'shadow-lg',
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
        (info.isNarrow || info.isShort)
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        params.fgClass,
      ),

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventTitleClass: params.fgClass,
      listItemEventTimeClass: params.mutedFgClass,

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (info) => joinClassNames(
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        info.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (info.isDragging && !info.isSelected) && 'opacity-75',
      ),

      blockEventInnerClass: 'text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (info) => joinClassNames(
        'mb-px border-y',
        info.isStart && 'rounded-s-sm border-s',
        info.isEnd && 'rounded-e-sm border-e',
      ),

      rowEventBeforeClass: (info) => joinClassNames(
        info.isStartResizable && joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        )
      ),

      rowEventAfterClass: (info) => joinClassNames(
        info.isEndResizable && joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        )
      ),

      rowEventInnerClass: (info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      ),

      rowEventTimeClass: (info) => (
        info.isNarrow ? 'ps-0.5' : 'ps-1'
      ),

      rowEventTitleClass: (info) => joinClassNames(
        info.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      ),

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (info) => joinClassNames(
        `border-x ring ${params.bgRingColorClass}`,
        info.isStart && joinClassNames('border-t rounded-t-lg', info.isNarrow ? 'mt-px' : 'mt-0.5'),
        info.isEnd && joinClassNames('border-b rounded-b-lg', info.isNarrow ? 'mb-px' : 'mb-0.5'),
      ),

      columnEventBeforeClass: (info) => joinClassNames(
        info.isStartResizable && joinClassNames(
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        )
      ),

      columnEventAfterClass: (info) => joinClassNames(
        info.isEndResizable && joinClassNames(
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        )
      ),

      columnEventInnerClass: (info) => joinClassNames(
        'flex',
        info.isShort
          ? 'flex-row items-center gap-1 p-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              info.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (info.isNarrow || info.isShort) ? xxsTextClass : 'text-xs',
      ),

      columnEventTimeClass: (info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'pt-0.5' : 'pt-1')
      ),

      columnEventTitleClass: (info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      ),

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: joinClassNames(
        'my-0.5 border border-transparent print:border-black rounded-md',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
      ),
      columnMoreLinkInnerClass: (info) => joinClassNames(
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        params.fgClass,
      ),

      /* Day Header
      ------------------------------------------------------------------------------------------- */
      // dayHeaderContent in slots.tsx...

      dayHeaderClass: (info) => joinClassNames(
        'justify-center', // v-align
        info.inPopover ? params.popoverHeaderClass :
          info.isMajor && `border ${params.strongBorderColorClass}`,
      ),

      dayHeaderInnerClass: (info) => joinClassNames(
        'flex flex-row items-center', // v-align
        info.isNarrow ? 'text-xs' : 'text-sm',
        info.inPopover ? joinClassNames(
          // ghost-button IN POPOVER
          'm-1.5 px-1 py-0.5 rounded-sm font-semibold',
          params.fgClass,
          info.hasNavLink && params.mutedHoverPressableClass,
        ) : !info.dayNumberText ? joinClassNames(
          // ghost-button IN VIEW HEADER (short)
          'mx-0.5 my-1.5 py-0.5 px-1.5 rounded-sm',
          params.mutedFgClass,
          info.hasNavLink && params.mutedHoverPressableClass,
        ) : !info.isToday ? joinClassNames(
          // ghost-button IN VIEW HEADER (tall)
          'mx-2 my-2.5 h-6 px-1.5 rounded-sm',
          params.mutedFgClass,
          info.hasNavLink && params.mutedHoverPressableClass,
        ) : (
          // circle inside (see slots.tsx)
          'group mx-2 my-2 h-7 outline-none'
        )
      ),

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: (info) => joinClassNames(
        'border',
        info.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
      ),

      dayCellTopClass: (info) => joinClassNames(
        info.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row justify-end', // h-align
      ),

      dayCellTopInnerClass: (info) => joinClassNames(
        'flex flex-row items-center', // v-align
        info.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !info.isToday
          // ghost-button
          ? joinClassNames(
              'rounded-s-sm whitespace-nowrap',
              !info.isOther && 'font-semibold',
              info.isNarrow ? 'px-1' : 'px-2',
              info.monthText ? params.fgClass : params.mutedFgClass,
              info.hasNavLink && params.mutedHoverPressableClass,
            )
          // circle inside (see slots.tsx)
          : joinClassNames(
              'group outline-none',
              info.isNarrow
                ? 'mx-px'
                : 'mx-2', // NOTE: today-circle might have -1 x-margin
            )
      ),

      dayCellInnerClass: (info) => joinClassNames(info.inPopover && 'p-2'),

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: joinClassNames(
        'group absolute top-1.5 end-1.5 p-0.5 rounded-sm',
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
          : info.isNarrow ? 'mx-px' : 'mx-0.5'
      ),

      slotLaneClass: (info) => joinClassNames(
        `border ${params.borderColorClass}`,
        info.isMinor && 'border-dotted',
      ),

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass: (info) => joinClassNames(
        'flex flex-col',
        !info.isLast && `border-b ${params.borderColorClass}`,
      ),

      listDayHeaderClass: joinClassNames(
        `-mb-px border-b ${params.borderColorClass} ${params.faintSolidBgClass} ${params.fgClass}`,
        'flex flex-row items-center justify-between',
      ),
      listDayHeaderInnerClass: (info) => joinClassNames(
        'm-1.5 px-1.5 py-0.5 rounded-sm text-sm',
        !info.level && 'font-semibold',
        (!info.level && info.isToday)
          // today
          ? info.hasNavLink
              ? joinClassNames(params.tertiaryPressableClass, params.outlineOffsetClass)
              : params.tertiaryClass
          // NOT today
          : info.hasNavLink && params.mutedHoverPressableClass,
      ),

      listDayBodyClass: `mt-px px-1.5 py-2 gap-2`,

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: (info) => joinClassNames(
        info.multiMonthColumns > 1 && 'm-3',
        (info.multiMonthColumns === 1 && !info.isLast) &&
          `border-b ${params.borderColorClass}`
      ),

      singleMonthHeaderClass: (info) => joinClassNames(
        info.multiMonthColumns > 1
          ? 'pb-2'
          : `py-1 border-b ${params.borderColorClass} ${params.bgClass}`,
        'items-center', // h-align
      ),

      singleMonthHeaderInnerClass: (info) => joinClassNames(
        'px-1.5 py-0.5 rounded-sm text-base font-semibold',
        info.hasNavLink && params.mutedHoverPressableClass,
        params.fgClass,
      ),

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableBodyClass: params.bgClass,
      fillerClass: `border ${params.borderColorClass} opacity-50`,

      dayNarrowWidth: 100,
      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotHeaderRowClass: `border ${params.borderColorClass}`,
      slotHeaderInnerClass: params.mutedFgClass,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.tertiaryOutlineColorClass,
      ),

      inlineWeekNumberClass: (info) => joinClassNames(
        `absolute start-0 whitespace-nowrap rounded-e-sm`,
        info.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        info.hasNavLink && params.mutedHoverPressableClass,
        params.mutedFgClass,
      ),

      highlightClass: params.highlightClass,
      nonBusinessHoursClass: params.faintBgClass,

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
        tableHeaderClass: params.bgClass,
        dayHeaderAlign: (info) => info.inPopover ? 'start' : info.isNarrow ? 'center' : 'end',
        dayHeaderDividerClass: `border-b ${params.borderColorClass}`,
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      multiMonth: {
        ...dayRowCommonClasses,
        viewClass: params.faintBgClass,
        tableHeaderClass: (info) => joinClassNames(
          info.multiMonthColumns === 1 && params.bgClass
        ),
        dayHeaderAlign: (info) => info.inPopover ? 'start' : info.isNarrow ? 'center' : 'end',
        dayHeaderDividerClass: (info) => joinClassNames(
          info.multiMonthColumns === 1 && `border-b ${params.borderColorClass}`,
        ),
        tableBodyClass: (info) => joinClassNames(
          info.multiMonthColumns > 1 &&
            `border ${params.borderColorClass} rounded-sm overflow-hidden`,
        ),
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        tableHeaderClass: params.bgClass,
        dayHeaderAlign: (info) => info.inPopover ? 'start' : 'center',
        dayHeaderDividerClass: (info) => joinClassNames(
          'border-b',
          info.options.allDaySlot
            ? params.borderColorClass
            : `${params.strongBorderColorClass} not-print:shadow-sm`
        ),
        dayCellBottomClass: tallDayCellBottomClass,

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (info) => joinClassNames(
          `mx-0.5 h-6 px-1.5 ${params.mutedFgClass} flex flex-row items-center rounded-sm`,
          info.isNarrow ? 'text-xs' : 'text-sm',
          info.hasNavLink && params.mutedHoverPressableClass,
        ),

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center', // v-align
        allDayHeaderInnerClass: (info) => joinClassNames(
          `m-2 ${params.mutedFgClass}`,
          info.isNarrow ? xxsTextClass : 'text-xs',
        ),

        allDayDividerClass: `border-b ${params.strongBorderColorClass} not-print:shadow-sm`,

        /* TimeGrid > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderClass: 'justify-end', // h-align
        slotHeaderInnerClass: (info) => joinClassNames(
          'relative m-2',
          info.isNarrow
            ? `-top-3.5 ${xxsTextClass}`
            : '-top-4 text-xs',
          info.isFirst && 'hidden',
        ),

        slotHeaderDividerClass: `border-e ${params.borderColorClass}`,
      },
      list: {
        viewClass: params.bgClass,

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (info) => joinClassNames(
          'group py-1 rounded-sm',
          info.isInteractive
            ? joinClassNames(params.faintHoverPressableClass, params.outlineInsetClass)
            : params.faintHoverClass,
        ),

        listItemEventBeforeClass: 'w-1.5 bg-(--fc-event-color) rounded-full', // stretches full height

        listItemEventInnerClass: '[display:contents]',

        listItemEventTimeClass: joinClassNames(
          '-order-1 shrink-0 w-1/2 max-w-60 px-4 py-2',
          'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
        ),

        listItemEventTitleClass: (info) => joinClassNames(
          'grow min-w-0 px-4 py-2 whitespace-nowrap overflow-hidden text-sm',
          info.event.url && 'group-hover:underline',
        ),

        /* No-Events Screen
        ----------------------------------------------------------------------------------------- */

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: `py-15 ${params.mutedFgClass}`,
      },
    },
  }
}
