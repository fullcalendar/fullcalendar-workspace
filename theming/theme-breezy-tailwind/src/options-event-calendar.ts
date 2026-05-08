import { CalendarOptions, DayCellInfo, DayHeaderInfo, joinClassNames, ViewOptions } from '@fullcalendar/react'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/react/daygrid'
import {} from '@fullcalendar/react/timegrid'
import {} from '@fullcalendar/react/list'
import {} from '@fullcalendar/react/multimonth'
import {} from '@fullcalendar/react/interaction'

/*
COLOR TODO:
  default-ui: are timegrid borders too faint (esp now that we have dotted isMinor) ?

NOTE: We don't do active: states, because tailwindplus does not do this!

REFERENCE:
  https://tailwindcss.com/plus/ui-blocks/application-ui/data-display/calendars
  Some dark mode:
    https://tailwindcss.com/plus/ui-blocks/application-ui/lists/tables
  User different navbar for view-selector:
    https://tailwindcss.com/plus/ui-blocks/application-ui/navigation/tabs#component-2a66fc822e8ad55f59321825e5af0980
  Flyout menus:
    https://tailwindcss.com/plus/ui-blocks/marketing/elements/flyout-menus#component-25601925ae83e51e1b31d3bd1c286515
*/

export interface EventCalendarOptionParams {
  // outline
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  primaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
  faintBgClass: string

  // neutral foregrounds
  fgClass: string
  strongFgClass: string
  mutedFgClass: string
  mutedFgHoverClass: string
  faintFgClass: string

  // neutral borders
  borderColorClass: string
  borderStartColorClass: string
  strongBorderColorClass: string
  strongBorderBottomColorClass: string
  mutedBorderColorClass: string

  // neutral buttons
  strongSolidPressableClass: string
  mutedHoverClass: string
  mutedHoverPressableClass: string
  faintHoverClass: string
  faintHoverPressableClass: string

  // popover
  popoverClass: string
  popoverHeaderClass: string

  // primary
  primaryClass: string
  primaryBorderColorClass: string
  primaryPressableClass: string
  primaryPressableGroupClass: string

  // secondary
  secondaryClass: string
  secondaryPressableClass: string

  // event content
  eventColor: string
  eventContrastColor: string
  eventFaintBgClass: string
  eventFaintPressableClass: string
  eventMutedFgClass: string
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

  const getNormalDayHeaderBorderClass = (info: DayHeaderInfo) => joinClassNames(
    !info.inPopover && (
      info.isMajor ? `border ${params.strongBorderColorClass}` :
        !info.isNarrow && `border ${params.borderColorClass}`
    )
  )
  const getMutedDayHeaderBorderClass = (info: DayHeaderInfo) => joinClassNames(
    !info.inPopover && (
      info.isMajor ? `border ${params.strongBorderColorClass}` :
        !info.isNarrow && `border ${params.mutedBorderColorClass}`
    )
  )

  const getNormalDayCellBorderColorClass = (info: DayCellInfo) => (
    info.isMajor ? params.strongBorderColorClass : params.borderColorClass
  )
  const getMutedDayCellBorderColorClass = (info: DayCellInfo) => (
    info.isMajor ? params.strongBorderColorClass : params.mutedBorderColorClass
  )

  const tallDayCellBottomClass = 'min-h-3'
  const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
    !info.isNarrow && 'min-h-px'
  )

  const mutedHoverButtonClass = joinClassNames(
    params.mutedHoverPressableClass,
    params.outlineWidthFocusClass,
    params.primaryOutlineColorClass,
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (info) => joinClassNames(
      'mb-px p-px',
      info.isNarrow
        ? 'mx-px rounded-sm'
        : 'mx-1 rounded-md',
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
      params.mutedFgClass,
      'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ),

    listItemEventTitleClass: (info) => joinClassNames(
      info.isNarrow ? 'px-px' : 'px-0.5',
      params.strongFgClass,
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
      'mb-px border',
      info.isNarrow
        ? `mx-px ${params.primaryBorderColorClass} rounded-sm`
        : 'self-start mx-1 border-transparent rounded-md',
      params.mutedHoverPressableClass,
    ),

    rowMoreLinkInnerClass: (info) => joinClassNames(
      info.isNarrow
        ? `p-px ${xxsTextClass}`
        : 'p-0.5 text-xs',
      params.strongFgClass,
    )
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
              info.isDragging && 'shadow-md',
            )
          : params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor: params.bgEventColor,
      backgroundEventClass: params.bgEventBgClass,

      backgroundEventTitleClass: (info) => joinClassNames(
        'opacity-50 italic',
        info.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        params.fgClass,
      ),

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (info) => joinClassNames(
        'group relative',
        info.isInteractive
          ? params.eventFaintPressableClass
          : params.eventFaintBgClass,
        'print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
        (info.isDragging && !info.isSelected) && 'opacity-75',
      ),

      blockEventInnerClass: params.eventMutedFgClass,
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (info) => joinClassNames(
        'mb-px border-y',
        info.isStart && joinClassNames('border-s', info.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
        info.isEnd && joinClassNames('border-e', info.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
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

      rowEventTimeClass: (info) => joinClassNames(
        info.isNarrow ? 'ps-0.5' : 'ps-1',
        'font-medium',
      ),

      rowEventTitleClass: (info) => (
        info.isNarrow ? 'px-0.5' : 'px-1'
      ),

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (info) => joinClassNames(
        `border-x ring ${params.bgRingColorClass}`,
        info.isStart && joinClassNames('border-t rounded-t-lg', info.isNarrow ? 'mt-px' : 'mt-1'),
        info.isEnd && joinClassNames('border-b rounded-b-lg', info.isNarrow ? 'mb-px' : 'mb-1'),
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
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      ),

      columnEventTimeClass: (info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'pt-0.5' : 'pt-1')
      ),

      columnEventTitleClass: (info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
        'font-semibold',
      ),

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: (info) => joinClassNames(
        info.isNarrow ? 'my-px' : 'my-1',
        'border border-transparent print:border-black rounded-md',
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
      // see dayHeaderContent in slots.tsx...

      dayHeaderAlign: (info) => info.inPopover ? 'start' : 'center', // h-align

      dayHeaderClass: (info) => joinClassNames(
        'justify-center', // v-align
        info.inPopover && params.popoverHeaderClass,
      ),

      dayHeaderInnerClass: (info) => joinClassNames(
        'flex flex-row items-center', // v-align
        (!info.dayNumberText && !info.inPopover)
          // small uniform text
          ? joinClassNames(
              'py-1 rounded-sm text-xs',
              info.isNarrow
                ? `px-1 m-1 ${params.mutedFgClass}`
                : `px-1.5 m-2 font-semibold ${params.fgClass}`,
              info.hasNavLink && mutedHoverButtonClass,
            )
          // normal-sized varying-color text
          : (info.isToday && info.dayNumberText && !info.inPopover)
              // WITH today circle
              ? joinClassNames(
                  'group m-2 outline-none',
                  info.isNarrow ? 'h-6' : 'h-8'
                )
              // WITHOUT today circle
              : joinClassNames(
                  'rounded-sm',
                  info.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : joinClassNames(
                        'mx-2 h-6 px-1.5',
                        info.isNarrow ? 'my-2' : 'my-3'
                      ),
                  info.hasNavLink && mutedHoverButtonClass,
                ),
      ),

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: (info) => joinClassNames(
        'border',
        // don't display bg-color for other-month/disabled cells when businessHours is doing the same
        ((info.isOther || info.isDisabled) && !info.options.businessHours) && params.faintBgClass,
      ),

      dayCellTopClass: (info) => joinClassNames(
        info.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row',
      ),

      dayCellTopInnerClass: (info) => joinClassNames(
        'flex flex-row items-center justify-center whitespace-nowrap', // v-align, h-align
        info.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-xs',
        info.isToday
          // primary-colored circle or pill
          ? joinClassNames(
              'rounded-full font-semibold',
              info.isNarrow
                ? 'ms-px'
                : 'ms-1',
              info.text === info.dayNumberText
                ? (info.isNarrow ? 'w-5' : 'w-6') // circle
                : (info.isNarrow ? 'px-1' : 'px-2'), // pill
              info.hasNavLink
                ? joinClassNames(params.primaryPressableClass, params.outlineOffsetClass)
                : params.primaryClass,
            )
          // half-rounded-ghost-button
          : joinClassNames(
              'rounded-e-sm',
              info.isNarrow ? 'px-1' : 'px-2',
              info.hasNavLink && params.mutedHoverPressableClass,
              info.isOther
                ? params.faintFgClass
                : (info.monthText ? params.fgClass : params.mutedFgClass),
              info.monthText && 'font-bold',
            ),
      ),

      dayCellInnerClass: (info) => joinClassNames(info.inPopover && 'p-2'),

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: joinClassNames(
        'group absolute top-2 end-2 p-0.5 rounded-sm',
        mutedHoverButtonClass,
      ),

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: (info) => joinClassNames(
        'border',
        info.isMajor ? params.strongBorderColorClass : params.mutedBorderColorClass,
        info.isDisabled && params.faintBgClass,
      ),
      dayLaneInnerClass: (info) => (
        info.isStack
          ? 'm-1' // simple print-view
          : info.isNarrow ? 'mx-px' : 'mx-1'
      ),

      slotLaneClass: (info) => joinClassNames(
        `border ${params.mutedBorderColorClass}`,
        info.isMinor && 'border-dotted',
      ),

      /* List Day
      ------------------------------------------------------------------------------------------- */

      // contains multiple days
      listDaysClass: 'my-10 mx-auto w-full max-w-218 px-4',

      listDayClass: (info) => joinClassNames(
        !info.isLast && `border-b ${params.mutedBorderColorClass}`,
        'flex flex-row items-start gap-2',
      ),

      listDayHeaderClass: 'my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start',
      listDayHeaderInnerClass: (info) => joinClassNames(
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !info.level
          // main title
          ? joinClassNames(
              info.isToday
                ? joinClassNames(
                    'font-semibold',
                    info.hasNavLink ? params.primaryPressableClass : params.primaryClass,
                  )
                : joinClassNames(
                    `font-medium ${params.strongFgClass}`,
                    info.hasNavLink && params.mutedHoverPressableClass,
                  )
            )
          // subtitle
          : joinClassNames(
              params.faintFgClass,
              info.hasNavLink && joinClassNames(
                params.mutedHoverPressableClass,
                params.mutedFgHoverClass,
              ),
            )
      ),

      listDayBodyClass: `my-4 grow min-w-0 border ${params.borderColorClass} rounded-md`,

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: (info) => joinClassNames(
        info.multiMonthColumns > 1 && 'm-4',
        (info.multiMonthColumns === 1 && !info.isLast) &&
          `border-b ${params.borderColorClass}`,
      ),

      singleMonthHeaderClass: (info) => joinClassNames(
        info.multiMonthColumns > 1
          ? 'pb-1'
          : `py-1.5 ${params.bgClass} border-b ${params.borderColorClass}`,
        'items-center', // h-align
      ),

      singleMonthHeaderInnerClass: (info) => joinClassNames(
        `py-1 px-2 rounded-md text-sm ${params.strongFgClass} font-semibold`,
        info.hasNavLink && params.mutedHoverPressableClass,
      ),

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass: params.bgClass,
      fillerClass: `border ${params.mutedBorderColorClass}`,

      dayNarrowWidth: 100,
      dayHeaderRowClass: `border ${params.mutedBorderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotHeaderRowClass: `border ${params.borderColorClass}`,
      slotHeaderInnerClass: `${params.faintFgClass} uppercase`,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),

      inlineWeekNumberClass: (info) => joinClassNames(
        `absolute top-0 end-0 ${params.bgClass} ${params.mutedFgClass} whitespace-nowrap rounded-es-md`,
        `border-b ${params.strongBorderBottomColorClass}`,
        `border-s ${params.borderStartColorClass}`,
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        info.hasNavLink
          ? `${params.mutedHoverPressableClass} -outline-offset-1`
          : params.mutedHoverClass,
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
        dayHeaderClass: getNormalDayHeaderBorderClass,
        dayHeaderDividerClass: `border-b ${params.strongBorderColorClass}`,
        dayCellClass: getNormalDayCellBorderColorClass,
        dayCellBottomClass: getShortDayCellBottomClass,

        // day-numbers are on start-side, so move bg-event titles to end-side
        backgroundEventInnerClass: 'flex flex-row justify-end',
      },
      multiMonth: {
        ...dayRowCommonClasses,
        dayHeaderClass: getNormalDayHeaderBorderClass,
        dayHeaderDividerClass: (info) => joinClassNames(
          info.multiMonthColumns === 1 &&
            `border-b ${params.strongBorderColorClass} shadow-sm`
        ),
        tableBodyClass: (info) => joinClassNames(
          info.multiMonthColumns > 1 &&
            `border ${params.borderColorClass} rounded-md shadow-xs overflow-hidden`
        ),
        dayCellClass: getNormalDayCellBorderColorClass,
        dayCellBottomClass: getShortDayCellBottomClass,
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayHeaderClass: getMutedDayHeaderBorderClass,
        dayHeaderDividerClass: (info) => joinClassNames(
          'border-b',
          info.options.allDaySlot
            ? params.borderColorClass
            : `${params.strongBorderColorClass} not-print:shadow-sm`,
        ),
        dayCellClass: getMutedDayCellBorderColorClass,
        dayCellBottomClass: tallDayCellBottomClass,

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (info) => joinClassNames(
          `m-1.5 h-6 px-1.5 ${params.mutedFgClass} rounded-sm flex flex-row items-center`,
          info.hasNavLink && params.mutedHoverPressableClass,
          info.isNarrow ? 'text-xs' : 'text-sm',
        ),

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center', // v-align
        allDayHeaderInnerClass: (info) => joinClassNames(
          `m-3 ${params.faintFgClass}`,
          info.isNarrow ? xxsTextClass : 'text-xs',
        ),

        allDayDividerClass: `border-b ${params.strongBorderColorClass} not-print:shadow-sm`,

        /* TimeGrid > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderClass: 'justify-end', // h-align
        slotHeaderInnerClass: (info) => joinClassNames(
          'relative mx-3 my-2',
          info.isNarrow
            ? `-top-3.5 ${xxsTextClass}`
            : '-top-4 text-xs',
          info.isFirst && 'hidden',
        ),

        slotHeaderDividerClass: `border-e ${params.mutedBorderColorClass}`,
      },
      list: {

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (info) => joinClassNames(
          'group p-4 items-center gap-3',
          !info.isLast && `border-b ${params.mutedBorderColorClass}`,
          info.isInteractive
            ? params.faintHoverPressableClass
            : params.faintHoverClass,
        ),

        listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full', // 8px diameter

        listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',

        listItemEventTimeClass: joinClassNames(
          'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis',
          params.mutedFgClass,
        ),

        listItemEventTitleClass: (info) => joinClassNames(
          'grow min-w-0 font-medium whitespace-nowrap overflow-hidden',
          params.fgClass,
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
