import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

/*
TODO: default-background-event and selection colors
red: #FF3D57
green: #09B66D
primary-blue: #0081FF
apple-primary-blue: #117aff
apple-red: #fd453b (same for dark mode: #fd3b30)
light-blue: #22CCE2

TODO: implement now-indicator
TODO: text-gray-500 is yucky for Shadcn

TODO: give day-number-circle to list-view day-headers

TODO: multimonth very poorly condensed with events

TODO: test standlone secondary button. correct borders and shadow?

TODO: pressdown colors on buttons

TODO: in default-ui, make secondary button have bg-filled-muted, not lines

TODO: shift timegrid slot labels over to start-of line

TODO: give nav-link hover effect to everything!
TODO: give hover effect to singleMonthHeaderInnerClass

TODO: in all-day section when many events are stacked,
  not enough bottom padding to daycell

TODO: in daygrid, day-header text doesn't align nicely with day-cell day-number-text

TODO: space in-between timeline events (left-to-right space aka "me-px")
TODO: ^^^same with vertical space
TODO: ^^^same with more-link

TODO: list-view day-headers when they stack, border is doubled-up

TODO: have press-effect on ui buttons. and ALL buttons

TODO: hover color on list-view events

TODO: give week-numbers an ghost-pressable-effect!

TODO: fix popover header text styling

TODO: improve resourceExpander hover and tab effect

Dark-mode Pulse buttons look bad

popover-close needs hover color or bg-change
*/

export interface EventCalendarOptionParams {
  tertiaryClass: string
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  ghostHoverClass: string
  ghostPressableClass: string // needed anymore?

  strongSolidPressableClass: string

  mutedBgClass: string
  mutedSolidBgClass: string
  faintBgClass: string
  highlightClass: string

  borderColorClass: string
  strongBorderColorClass: string
  nowBorderColorClass: string
  primaryBorderColorClass: string

  tertiaryOutlineColorClass: string
  outlineWidthClass: string
  outlineWidthFocusClass: string
  outlineWidthGroupFocusClass: string
  outlineOffsetClass: string
  outlineInsetClass: string

  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventBgClass: string

  popoverClass: string

  bgClass: string
  bgRingColorClass: string

  fgClass: string
  strongFgClass: string
  mutedFgClass: string

  faintHoverClass: string
  faintPressableClass: string
}

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute z-10 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-10 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getDayGridItemClass = (data: { isCompact: boolean }) => joinClassNames(
    'mb-px rounded-sm',
    data.isCompact
      ? 'mx-0.5'
      : 'mx-1',
  )

  const dayRowItemClasses: CalendarOptions = {
    rowEventClass: (data) => [
      'mb-px',
      data.isStart && (data.isCompact ? 'ms-0.5' : 'ms-1'),
      data.isEnd && (data.isCompact ? 'me-0.5' : 'me-1'),
    ],

    listItemEventClass: (data) => [
      'p-px',
      getDayGridItemClass(data),
      data.isInteractive ? params.ghostPressableClass : params.ghostHoverClass,
    ],
    listItemEventInnerClass: (data) => [
      'justify-between flex flex-row',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
    listItemEventTimeClass: (data) => [
      data.isCompact ? 'p-px' : 'p-0.5',
      'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],
    listItemEventTitleClass: (data) => [
      data.isCompact ? 'p-px' : 'p-0.5',
      'text-ellipsis font-medium whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ],

    rowMoreLinkClass: (data) => [
      getDayGridItemClass(data),
      data.isCompact
        ? `border ${params.primaryBorderColorClass}`
        : 'self-start p-px',
      params.ghostPressableClass,
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isCompact ? 'p-px' : 'p-0.5',
      data.isCompact ? xxsTextClass : 'text-xs',
      params.strongFgClass,
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,
      // eventDisplay: 'block',

      // best place? be consistent with otherthemes

      tableHeaderClass: (data) => data.isSticky && params.bgClass,

      singleMonthClass: 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-2' : 'py-1',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        'justify-center', // h-align
      ],
      singleMonthHeaderInnerClass: (data) => [
        'text-base font-semibold',
        data.hasNavLink && params.ghostPressableClass,
      ],

      highlightClass: params.highlightClass,
      nonBusinessClass: params.faintBgClass,

      popoverClass: 'min-w-[220px] ' + params.popoverClass,
      popoverCloseClass: [
        'absolute top-2 end-2 p-1 rounded-sm',
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
        params.ghostPressableClass,
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,

      dayHeaderClass: (data) => [
        data.inPopover ? `border ${params.strongBorderColorClass} ${params.mutedBgClass}` :
          data.isMajor && `border ${params.strongBorderColorClass}`
      ],
      dayHeaderInnerClass: (data) => [
        'flex flex-row items-center', // v-align
        data.isCompact ? 'text-xs' : 'text-sm',
        !data.dayNumberText ? joinClassNames(
          // not date-specific
          'm-2',
          params.mutedFgClass,
        ) : data.inPopover ? joinClassNames(
          // ghost-button-like IN POPOVER
          'm-2 h-6 px-1 rounded-sm font-semibold',
          data.hasNavLink && params.ghostPressableClass,
        ) : !data.isToday ? joinClassNames(
          // ghost-button-like IN VIEW HEADER
          'my-2.5 h-6 px-1 rounded-sm',
          params.mutedFgClass,
          data.hasNavLink && params.ghostPressableClass,
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
        data.isCompact
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !data.isToday
          // ghost-button-like
          ? joinClassNames(
              'rounded-s-sm',
              data.isCompact ? 'px-1' : 'px-2',
              params.mutedFgClass,
              data.hasNavLink && params.ghostPressableClass,
            )
          // circle inside (see slots.tsx)
          : joinClassNames(
              data.isCompact
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
        `absolute z-10 start-0 rounded-e-sm ${params.fgClass}`,
        data.isCompact
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink && params.ghostPressableClass,
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
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
        params.strongFgClass,
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
        'flex flex-row',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: (data) => data.isCompact ? 'p-px' : 'p-0.5',
      rowEventTitleClass: (data) => [
        data.isCompact ? 'p-px' : 'p-0.5',
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
      columnEventInnerClass: 'flex flex-col py-1 text-xs',
      // TODO: move the x-padding to the inner div? same concept with row-events
      columnEventTimeClass: 'px-2 pt-1',
      columnEventTitleClass: 'px-2 py-1 font-medium',

      columnMoreLinkClass: `m-0.5 rounded-lg ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white ring ${params.bgRingColorClass}`,
      columnMoreLinkInnerClass: `p-0.5 text-xs ${params.strongFgClass}`,

      allDayHeaderClass: 'items-center', // v-align
      allDayHeaderInnerClass: `p-2 text-xs ${params.fgClass}`,

      allDayDividerClass: `border-b ${params.borderColorClass} shadow-sm`,

      slotLabelRowClass: `border ${params.borderColorClass}`, // timeline only

      slotLaneClass: `border ${params.borderColorClass}`,

      fillerClass: (data) => [
        !data.isHeader && `border ${params.borderColorClass} opacity-50`,
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} ring-2 ${params.bgRingColorClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: (data) => !data.isCompact && 'min-h-0.5', // TODO: DRY
        dayHeaderAlign: (data) => (
          data.inPopover ? 'start' :
            data.isCompact ? 'center' : 'end'
        ),

        dayHeaderDividerClass: ['border-t', params.borderColorClass],
      },
      multiMonth: {
        ...dayRowItemClasses,
        dayCellBottomClass: (data) => !data.isCompact && 'min-h-0.5', // TODO: DRY
        dayHeaderAlign: (data) => (
          data.inPopover ? 'start' :
            data.isCompact ? 'center' : 'end'
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
        dayHeaderAlign: 'center',

        dayHeaderDividerClass: (data) => [
          'border-t', params.borderColorClass,
          !data.options.allDaySlot && 'shadow-sm',
        ],

        weekNumberHeaderClass: 'justify-end items-center',
        weekNumberHeaderInnerClass: `px-2 text-sm ${params.fgClass}`,

        columnEventClass: (data) => [
          'mx-0.5', // TODO: move this to the columnInner thing? yes!!
          data.isStart && 'mt-0.5',
          data.isEnd && 'mb-0.5',
        ],

        slotLabelClass: 'justify-end', // v-align
        slotLabelInnerClass: `relative -top-4 p-2 text-xs ${params.fgClass}`,
        slotLabelDividerClass: `border-s ${params.borderColorClass}`,
        // TODO: higher levels should have h-borders
      },
      list: {
        listDayClass: `flex flex-col not-first:border-t ${params.borderColorClass}`,

        listDayHeaderClass: `flex flex-row justify-between ${params.mutedSolidBgClass} border-b ${params.borderColorClass} top-0 sticky`,
        listDayHeaderInnerClass: (data) => [
          'm-2 px-2 py-1 rounded-sm text-sm',
          !data.level && 'font-semibold',
          data.hasNavLink && params.outlineInsetClass,
          (data.isToday && !data.level)
            ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
            : (data.hasNavLink && params.ghostPressableClass),
        ],

        listDayEventsClass: 'flex flex-col py-2 gap-2',

        listItemEventClass: (data) => [
          'py-1',
          data.isInteractive ? params.faintPressableClass : params.faintHoverClass,
          data.isInteractive && params.outlineInsetClass, // move inside
        ],
        listItemEventBeforeClass: 'bg-(--fc-event-color) w-1.5 rounded-full',
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-60 ps-6 pe-4 py-2 order-[-1] text-sm whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: 'grow min-w-0 px-4 py-2 text-sm whitespace-nowrap overflow-hidden',

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
