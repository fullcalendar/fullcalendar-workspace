import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

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
  mutedSolidBgClass: string
  faintBgClass: string

  // neutral foregrounds
  fgClass: string
  strongFgClass: string
  mutedFgClass: string

  // neutral borders
  borderColorClass: string
  strongBorderColorClass: string

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

  // misc calendar content
  highlightClass: string
  nowBorderColorClass: string
}

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

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

  const getDayGridItemClass = (data: { isNarrow: boolean }) => joinClassNames(
    'mb-px rounded-sm',
    data.isNarrow
      ? 'mx-0.5'
      : 'mx-1',
  )

  const dayRowItemClasses: CalendarOptions = {
    rowEventClass: (data) => [
      'mb-px',
      data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
      data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
    ],
    rowEventInnerClass: (data) => [
      data.isNarrow ? 'py-px' : 'py-0.5',
    ],

    listItemEventClass: (data) => [
      'p-px',
      getDayGridItemClass(data),
      data.isInteractive ? params.mutedHoverPressableClass : params.mutedHoverClass,
    ],
    listItemEventInnerClass: (data) => [
      'justify-between flex flex-row',
      data.isNarrow ? 'py-px' : 'py-0.5',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'px-px' : 'px-0.5',
      'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],
    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'px-px' : 'px-0.5',
      'text-ellipsis font-medium whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ],

    rowMoreLinkClass: (data) => [
      getDayGridItemClass(data),
      'border',
      data.isNarrow
        ? params.primaryBorderColorClass
        : 'border-transparent self-start',
      params.mutedHoverPressableClass,
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isNarrow ? 'p-px' : 'p-0.5',
      data.isNarrow ? xxsTextClass : 'text-xs',
      params.strongFgClass,
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,
      // eventDisplay: 'block',

      eventShortHeight: 50,
      dayNarrowWidth: 100,

      // best place? be consistent with otherthemes

      tableHeaderClass: (data) => data.isSticky && params.bgClass,

      singleMonthClass: 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-2' : 'py-1',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        'justify-center', // h-align
      ],
      singleMonthHeaderInnerClass: (data) => [
        'text-base font-semibold rounded-sm px-1',
        data.hasNavLink && params.mutedHoverPressableClass,
      ],

      highlightClass: params.highlightClass,
      nonBusinessClass: params.faintBgClass,

      popoverClass: 'min-w-55 ' + params.popoverClass,
      popoverCloseClass: [
        'absolute inline-flex flex-row top-1.5 end-1.5 p-1 rounded-sm group',
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
        params.mutedHoverPressableClass,
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderClass: (data) => [
        data.inPopover ? params.popoverHeaderClass :
          data.isMajor && `border ${params.strongBorderColorClass}`
      ],
      dayHeaderInnerClass: (data) => [
        'flex flex-row items-center', // v-align
        data.isNarrow ? 'text-xs' : 'text-sm',
        !data.dayNumberText ? joinClassNames(
          // not date-specific
          'm-2',
          params.mutedFgClass,
        ) : data.inPopover ? joinClassNames(
          // ghost-button-like IN POPOVER
          'm-2 h-6 px-1 rounded-sm font-semibold',
          data.hasNavLink && params.mutedHoverPressableClass,
        ) : !data.isToday ? joinClassNames(
          // ghost-button-like IN VIEW HEADER
          'my-2.5 h-6 px-1 rounded-sm',
          params.mutedFgClass,
          data.hasNavLink && params.mutedHoverPressableClass,
        ) : (
          // circle within (see slots.tsx)
          'mx-2 my-2 h-7 group outline-none'
        )
      ],

      dayRowClass: `border ${params.borderColorClass}`,

      dayCellClass: (data) => [
        'border',
        data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
      ],
      dayCellTopClass: 'flex flex-row justify-end min-h-1',

      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center', // v-align
        !data.isOther && 'font-semibold', // TODO: move to slots.tsx?
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !data.isToday
          // ghost-button-like
          ? joinClassNames(
              'rounded-s-sm whitespace-pre',
              data.isNarrow ? 'px-1' : 'px-2',
              data.monthText ? params.fgClass : params.mutedFgClass,
              data.hasNavLink && params.mutedHoverPressableClass,
            )
          // circle inside (see slots.tsx)
          : joinClassNames(
              data.isNarrow
                ? 'mx-px'
                : 'mx-2', // today-circle will overcome by 1
              'group outline-none',
            )
      ],

      dayCellInnerClass: (data) => [
        data.inPopover && 'p-2',
      ],

      dayLaneClass: (data) => [
        'border',
        data.isMajor
          ? params.strongBorderColorClass
          : params.borderColorClass,
        data.isDisabled && params.faintBgClass,
      ],

      /*
      BUG: z-index is wrong, can't click week numbers
      */
      inlineWeekNumberClass: (data) => [
        `absolute start-0 rounded-e-sm ${params.fgClass}`,
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink && params.mutedHoverPressableClass,
      ],

      listItemEventInnerClass: params.strongFgClass,

      navLinkClass: [
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      moreLinkClass: [
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      eventClass: (data) => [
        params.tertiaryOutlineColorClass,
        data.isSelected
          ? params.outlineWidthClass
          : params.outlineWidthFocusClass,
      ],

      blockEventClass: (data) => [
        'relative group',
        'bg-(--fc-event-color) print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
      ],
      blockEventInnerClass: 'text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      backgroundEventClass: params.bgEventBgClass,
      backgroundEventTitleClass: (data) => [
        'opacity-50 italic',
        params.strongFgClass,
        // use this technique in other themes...
        (data.isNarrow || data.isShort) ? xxsTextClass : 'text-xs',
        data.isNarrow ? 'mx-1' : 'mx-2',
        data.isShort ? 'my-1' : 'my-2',
      ],

      rowEventClass: (data) => [
        'border-y',
        data.isStart && 'rounded-s-sm border-s',
        data.isEnd && 'rounded-e-sm border-e',
      ],
      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventInnerClass: (data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
        // subclasses determine py
      ],
      rowEventTimeClass: (data) => [
        data.isNarrow ? 'ps-0.5' : 'ps-1',
      ],
      rowEventTitleClass: (data) => [
        data.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      ],
      //^^^for row event, switch order of title/time?

      columnEventClass: (data) => [
        'border-x',
        data.isStart && 'rounded-t-lg border-t',
        data.isEnd && 'rounded-b-lg border-b',
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
        'flex',
        data.isShort
          ? 'flex-row p-1 gap-1' // one line
          : joinClassNames( // two lines
              'flex-col',
              data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (data.isNarrow || data.isShort)
          ? xxsTextClass
          : 'text-xs',
      ],
      columnEventTimeClass: (data) => [
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1'),
      ],
      columnEventTitleClass: (data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      ],

      columnMoreLinkClass: `m-0.5 rounded-lg ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white ring ${params.bgRingColorClass}`,
      columnMoreLinkInnerClass: (data) => [
        params.strongFgClass,
        data.isNarrow ? 'p-0.5' : 'p-1',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      allDayHeaderClass: 'items-center', // v-align
      allDayHeaderInnerClass: (data) => [
        `p-2 ${params.fgClass}`,
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      allDayDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only

      slotLaneClass: (data) => [
        `border ${params.borderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      fillerClass: `border ${params.borderColorClass} opacity-50`,

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} ring-2 ${params.bgRingColorClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: (data) => !data.isNarrow && 'min-h-0.5', // TODO: DRY
        dayHeaderAlign: (data) => (
          data.inPopover ? 'start' :
            data.isNarrow ? 'center' : 'end'
        ),

        dayHeaderDividerClass: ['border-t', params.borderColorClass],
      },
      multiMonth: {
        ...dayRowItemClasses,
        dayCellBottomClass: (data) => !data.isNarrow && 'min-h-0.5', // TODO: DRY
        dayHeaderAlign: (data) => (
          data.inPopover ? 'start' :
            data.isNarrow ? 'center' : 'end'
        ),

        dayHeaderDividerClass: (data) => data.isSticky && ['border-t', params.borderColorClass],

        tableBodyClass: [
          'border', params.borderColorClass,
          'rounded-sm overflow-hidden',
        ],
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-3',
        dayHeaderAlign: (data) => (
          data.inPopover ? 'start' : 'center'
        ),

        dayHeaderDividerClass: (data) => [
          'border-t', params.borderColorClass,
          !data.options.allDaySlot && 'shadow-sm',
        ],

        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: (data) => [
          `mx-1 px-1 ${params.mutedFgClass} h-6 flex flex-row items-center`,
          data.isNarrow ? 'text-xs' : 'text-sm',
          data.hasNavLink && params.mutedHoverPressableClass,
        ],

        columnEventClass: (data) => [
          'mx-0.5', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-0.5',
          data.isEnd && 'mb-0.5',
        ],

        slotLabelClass: 'justify-end', // v-align
        slotLabelInnerClass: (data) => [
          `relative p-2 ${params.fgClass}`,
          data.isNarrow
            ? `-top-3.5 ${xxsTextClass}`
            : '-top-4 text-xs',
        ],
        slotLabelDividerClass: `border-s ${params.borderColorClass}`,
        // TODO: higher levels should have h-borders
      },
      list: {
        listDayClass: `flex flex-col group/day`,

        listDayHeaderClass: `flex flex-row justify-between ${params.mutedSolidBgClass} border-b ${params.borderColorClass}`,
        listDayHeaderInnerClass: (data) => [
          'm-2 px-2 py-1 rounded-sm text-sm',
          !data.level && 'font-semibold',
          data.hasNavLink && params.outlineInsetClass,
          (data.isToday && !data.level)
            ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
            : (data.hasNavLink && params.mutedHoverPressableClass),
        ],

        listDayEventsClass: `flex flex-col py-2 gap-2 group-not-last/day:border-b ${params.borderColorClass}`,

        listItemEventClass: (data) => [
          'py-1',
          'group',
          data.isInteractive ? params.faintHoverPressableClass : params.faintHoverClass,
          data.isInteractive && params.outlineInsetClass, // move inside
        ],
        listItemEventBeforeClass: 'bg-(--fc-event-color) w-1.5 rounded-full',
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-60 ps-6 pe-4 py-2 order-[-1] text-sm whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: (data) => [
          'grow min-w-0 px-4 py-2 text-sm whitespace-nowrap overflow-hidden',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
