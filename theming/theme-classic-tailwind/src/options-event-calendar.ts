import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/react'

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
  bgEventFgOpacityClass: string
  smallDotBorderClass: string
  largeDotBorderClass: string

  // misc content
  highlightClass: string
  todayBgNotPrintClass: string
  nowBorderColorClass: string
  nowBorderStartColorClass: string
  nowBorderTopColorClass: string
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

  const getDayClass = (info: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => joinClassNames(
    'border',
    info.isMajor ? params.strongBorderColorClass : params.borderColorClass,
    info.isDisabled ? params.faintBgClass :
      info.isToday && params.todayBgNotPrintClass,
  )

  const getSlotClass = (info: { isMinor: boolean }) => joinClassNames(
    `border ${params.borderColorClass}`,
    info.isMinor && 'border-dotted',
  )

  const dayRowCommonClasses: CalendarOptions = {

    /* Day Row > List-Item Event
    --------------------------------------------------------------------------------------------- */

    listItemEventClass: (info) => joinClassNames(
      `mb-px p-px rounded-sm`,
      info.isNarrow ? 'mx-px' : 'mx-0.5',
      info.isSelected
        ? joinClassNames(params.mutedBgClass, info.isDragging && 'shadow-sm')
        : (info.isInteractive ? params.mutedHoverPressableClass : params.mutedHoverClass),
    ),

    listItemEventBeforeClass: (info) => joinClassNames(
      params.smallDotBorderClass,
      info.isNarrow ? 'mx-px' : 'mx-1',
    ),

    listItemEventInnerClass: (info) => joinClassNames(
      'flex flex-row items-center',
      'py-px gap-0.5',
      info.isNarrow ? xxsTextClass : 'text-xs',
    ),

    listItemEventTimeClass: 'px-px whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'px-px font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    /* Day Row > Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (info) => joinClassNames(
      info.isStart && joinClassNames('rounded-s-sm', info.isNarrow ? 'ms-px' : 'ms-0.5'),
      info.isEnd && joinClassNames('rounded-e-sm', info.isNarrow ? 'me-px' : 'me-0.5'),
    ),

    rowEventInnerClass: 'py-px gap-0.5',
    rowEventTimeClass: 'px-px',
    rowEventTitleClass: 'px-px',

    /* Day Row > More-Link
    --------------------------------------------------------------------------------------------- */

    rowMoreLinkClass: (info) => joinClassNames(
      'mb-px border rounded-sm',
      info.isNarrow
        ? `mx-px ${params.primaryBorderColorClass}`
        : 'self-start mx-0.5 border-transparent',
      params.mutedHoverPressableClass,
    ),

    rowMoreLinkInnerClass: (info) => joinClassNames(
      'p-px',
      info.isNarrow ? xxsTextClass : 'text-xs',
    ),
  }

  return {
    optionDefaults: {

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,

      eventClass: (info) => joinClassNames(
        info.isSelected
          ? joinClassNames(
              params.outlineWidthClass,
              info.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor: params.bgEventColor,
      backgroundEventClass: params.bgEventBgClass,

      backgroundEventTitleClass: (info) => joinClassNames(
        params.bgEventFgOpacityClass, 'italic',
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
      ),

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass: 'items-center',
      listItemEventBeforeClass: 'border-(--fc-event-color) rounded-full',
      listItemEventInnerClass: params.fgClass, // needed for DnD

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass: (info) => joinClassNames(
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        (info.isDragging && !info.isSelected) && 'opacity-75',
        params.outlineOffsetClass,
      ),

      blockEventInnerClass: 'text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (info) => joinClassNames(
        'mb-px border-y',
        info.isStart && 'border-s',
        info.isEnd && 'border-e',
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

      rowEventTimeClass: 'font-bold',

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass: (info) => joinClassNames(
        'border-x',
        info.isStart && 'border-t rounded-t-sm',
        info.isEnd && 'mb-px border-b rounded-b-sm',
        `ring ${params.bgRingColorClass}`,
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
          ? 'p-0.5 flex-row items-center gap-1' // one line
          : 'px-0.5 flex-col', // two lines
      ),

      columnEventTimeClass: (info) => joinClassNames(
        !info.isShort && 'pt-0.5',
        xxsTextClass,
      ),

      columnEventTitleClass: (info) => joinClassNames(
        !info.isShort &&  'py-0.5',
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      ),

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass: joinClassNames(
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      columnMoreLinkClass: joinClassNames(
        'mb-px rounded-sm border border-transparent print:border-black',
        `${params.strongSolidPressableClass} print:bg-white`,
        `ring ${params.bgRingColorClass}`,
        params.outlineOffsetClass, // just like block events
      ),
      columnMoreLinkInnerClass: (info) => joinClassNames(
        'p-0.5',
        info.isNarrow ? xxsTextClass : 'text-xs',
      ),

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign: (info) => info.inPopover ? 'start' : 'center',

      dayHeaderClass: (info) => joinClassNames(
        'justify-center', // v-align
        info.isDisabled && params.faintBgClass,
        info.inPopover
          ? params.popoverHeaderClass
          : joinClassNames(
              'border',
              info.isMajor ? params.strongBorderColorClass : params.borderColorClass,
            ),
      ),

      dayHeaderInnerClass: (info) => joinClassNames(
        'mx-1 my-0.5 flex flex-col',
        info.isNarrow ? xxsTextClass : 'text-sm',
      ),

      dayHeaderDividerClass: `border-b ${params.borderColorClass}`,

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass: getDayClass,

      dayCellTopClass: (info) => joinClassNames(
        info.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row justify-end',
      ),

      dayCellTopInnerClass: (info) => joinClassNames(
        'mx-1 whitespace-nowrap',
        info.isNarrow
          ? `my-0.5 ${xxsTextClass}`
          : 'my-1 text-sm',
        info.isOther && params.faintFgClass,
        info.monthText && 'font-bold',
      ),

      dayCellInnerClass: (info) => joinClassNames(info.inPopover && 'p-2'),

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass: `${params.popoverClass} min-w-55`,

      popoverCloseClass: joinClassNames(
        'group absolute top-0.5 end-0.5',
        params.outlineWidthFocusClass,
        params.primaryOutlineColorClass,
      ),

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass: getDayClass,
      dayLaneInnerClass: (info) => (
        info.isStack
          ? 'm-1' // simple print-view
          : info.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      ),

      slotLaneClass: getSlotClass,

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayHeaderClass: joinClassNames(
        `border-b ${params.borderColorClass} ${params.mutedSolidBgClass}`,
        '-mb-px flex flex-row items-center justify-between',
      ),

      listDayHeaderInnerClass: 'px-3 py-2 text-sm font-bold',

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass: (info) => joinClassNames(
        info.multiMonthColumnCount > 1 && 'm-4',
        (info.multiMonthColumnCount === 1 && !info.isLast) &&
          `${params.borderColorClass} border-b`,
      ),

      singleMonthHeaderClass: (info) => joinClassNames(
        info.multiMonthColumnCount > 1
          ? 'pb-4'
          : `py-2 border-b ${params.borderColorClass} ${params.bgClass}`,
        'items-center', // h-align
      ),

      singleMonthHeaderInnerClass: 'text-base font-bold',

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass: params.bgClass,
      fillerClass: `border ${params.borderColorClass} opacity-50`,

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayRowClass: `border ${params.borderColorClass}`,

      slotHeaderRowClass: `border ${params.borderColorClass}`,
      slotHeaderClass: getSlotClass,

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass: joinClassNames(
        'hover:underline',
        params.outlineWidthFocusClass,
        params.outlineInsetClass,
        params.primaryOutlineColorClass,
      ),

      inlineWeekNumberClass: (info) => joinClassNames(
        `absolute top-0 start-0 rounded-ee-sm p-0.5 text-center`,
        params.mutedFgClass,
        params.mutedBgClass,
        info.isNarrow ? xxsTextClass : 'text-sm',
      ),

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

        tableClass: (info) => joinClassNames(
          info.multiMonthColumnCount > 1 && `${params.borderColorClass} border`
        )
      },
      timeGrid: {
        ...dayRowCommonClasses,
        dayCellBottomClass: 'min-h-3',

        /* TimeGrid > Week Number Header
        ----------------------------------------------------------------------------------------- */

        weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
        weekNumberHeaderInnerClass: (info) => joinClassNames(
          'mx-1 my-0.5',
          info.isNarrow ? xxsTextClass : 'text-sm',
        ),

        /* TimeGrid > All-Day Header
        ----------------------------------------------------------------------------------------- */

        allDayHeaderClass: 'items-center justify-end', // v-align, h-align
        allDayHeaderInnerClass: (info) => joinClassNames(
          'mx-1 my-2 text-end',
          info.isNarrow ? xxsTextClass : 'text-sm',
        ),

        allDayDividerClass: `border-y ${params.borderColorClass} pb-0.5 ${params.mutedBgClass}`,

        /* TimeGrid > Slot Header
        ----------------------------------------------------------------------------------------- */

        slotHeaderClass: 'justify-end', // h-align
        slotHeaderInnerClass: (info) => joinClassNames(
          'mx-1 my-0.5',
          info.isNarrow ? xxsTextClass : 'text-sm',
        ),

        slotHeaderDividerClass: `border-e ${params.borderColorClass}`,

        /* TimeGrid > Now-Indicator
        ----------------------------------------------------------------------------------------- */

        // create left/right pointing arrow
        nowIndicatorHeaderClass: joinClassNames(
          'start-0 -mt-[5px]',
          'border-y-[5px] border-y-transparent',
          `border-s-[6px] ${params.nowBorderStartColorClass}`,
        ),

        nowIndicatorLineClass: `border-t ${params.nowBorderColorClass}`,
      },
      list: {
        listDayClass: (info) => joinClassNames(
          'flex flex-col',
          !info.isLast && `border-b ${params.borderColorClass}`,
        ),

        /* List-View > List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass: (info) => joinClassNames(
          `group px-3 py-2 gap-3 border-t ${params.borderColorClass}`,
          info.isInteractive
            ? joinClassNames(params.faintHoverPressableClass, params.outlineInsetClass)
            : params.faintHoverClass,
        ),

        listItemEventBeforeClass: params.largeDotBorderClass, // 10px diameter

        listItemEventInnerClass: '[display:contents]',

        listItemEventTimeClass: joinClassNames(
          '-order-1 shrink-0 w-1/2 max-w-50',
          'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
        ),

        listItemEventTitleClass: (info) => joinClassNames(
          'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
          info.event.url && 'group-hover:underline',
        ),

        /* No-Events Screen
        ----------------------------------------------------------------------------------------- */

        noEventsClass: `${params.mutedBgClass} flex flex-col items-center justify-center`,
        noEventsInnerClass: 'sticky bottom-0 py-15',
      },
    },
  }
}
