import { CalendarOptions, joinClassNames, ViewOptions } from '@fullcalendar/core'
import { filledRightTriangle } from './svgs.js'

/*
TODO: double-check units for ticks
TODO: day-headers in timeline have different border color that body slats
TODO: button hover-effect for not-today?
TODO: X is too big
TODO: week-number hover gets really dim. weird mousedown effect
TODO: MUI figure out select colors vs bg-event color. currently inverse of classic-theme
TODO: MUI resource group oddly dark gray
TODO: transparentPressableClass hover effect is unnoticable in dark mode
TODO: dark-mode now-indicator color is ugly pink
TODO: test business hours

monarch no sticky col events!? disabled, in js setting, but should that js setting exist? part of theme?
monarch col event, when really squatty, compresses divs weird
add 2px h padding on daygrid-event time ? probably. morelink should match.
monarch: test "today" when semi-transparent is-other

color refactor:
  TODO: MUI multimonth, stacked rows of disabled days don't work
  TODO: don't use opacity so much... use muted text color

core:
  TODO: setting for FIRST slot, for hiding label

audit use of "group" classnames

BUG: Monarch: when timegrid narrow, week number erroneously turns into half-pill

BUG: narrow column-event time/title spacing looks bad

when isNarrow, axis labels have wrong y positioning
*/

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
  outlineWidthGroupFocusClass: string
  tertiaryOutlineColorClass: string

  // neutral backgrounds
  bgClass: string
  bgRingColorClass: string
  mutedBgClass: string
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

  const getWeekNumberPillClasses = (data: { hasNavLink: boolean, isNarrow: boolean }) => [
    'flex flex-row items-center', // match height of daynumber
    data.hasNavLink
      ? params.secondaryPressableClass
      : params.secondaryClass,
    data.isNarrow
      ? `rounded-e-full h-4 pe-1 ${xxsTextClass}`
      : 'rounded-full h-6 px-2 text-sm'
  ]

  const dayRowItemBaseClass = 'mx-0.5 mb-px rounded-sm'
  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: `${dayRowItemBaseClass} p-px`,
    listItemEventBeforeClass: (data) => [
      'border-4', // 8px diameter
      data.isNarrow ? 'mx-px' : 'mx-1',
    ],
    listItemEventInnerClass: (data) => data.isNarrow ? xxsTextClass : 'text-xs', // TODO: put on time/title ?
    listItemEventTimeClass: (data) => [
      data.isNarrow ? 'p-px' : 'p-0.5',
      'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    ],
    listItemEventTitleClass: (data) => [
      data.isNarrow ? 'p-px' : 'p-0.5',
      'p-0.5 font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first
    ],

    rowEventClass: (data) => [
      data.isStart && 'ms-px',
      data.isEnd && 'me-px',
    ],

    rowMoreLinkClass: (data) => [
      dayRowItemBaseClass,
      params.mutedHoverPressableClass,
      data.isNarrow
        ? `border ${params.primaryBorderColorClass}`
        : 'p-px'
    ],
    rowMoreLinkInnerClass: (data) => [
      data.isNarrow ? `p-px ${xxsTextClass}` : 'p-0.5 text-xs',
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,

      eventShortHeight: 50,
      dayNarrowWidth: 100,

      tableHeaderClass: (data) => data.isSticky && `${params.bgClass} border-b ${params.borderColorClass}`,

      singleMonthClass: 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-2' : 'py-1',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        'justify-center', // h-align
      ],
      singleMonthHeaderInnerClass: (data) => [
        'font-bold rounded-full px-2 py-1',
        data.hasNavLink && params.mutedHoverPressableClass,
      ],

      popoverClass: 'min-w-3xs ' + params.popoverClass,
      popoverCloseClass: [
        'absolute top-2 end-2 rounded-full size-8 inline-flex flex-row justify-center items-center group',
        params.mutedHoverPressableClass,
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ],

      fillerClass: (data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : params.borderColorClass,
      ],
      nonBusinessClass: params.faintBgClass,
      highlightClass: params.highlightClass,

      moreLinkClass: joinClassNames(
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ),
      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      navLinkClass: joinClassNames(
        params.tertiaryOutlineColorClass,
        params.outlineWidthFocusClass,
      ),

      inlineWeekNumberClass: (data) => [
        'absolute',
        data.isNarrow
          ? 'top-0.5 start-0 my-px'
          : 'top-1.5 start-1',
        ...getWeekNumberPillClasses(data),
      ],

      eventClass: (data) => [
        'hover:no-underline', // really needed?
        params.tertiaryOutlineColorClass,
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

      listItemEventClass: (data) => [
        'items-center',
        data.isSelected
          ? joinClassNames(
              params.mutedBgClass,
              data.isDragging && 'shadow-sm',
            )
          : (data.isInteractive ? params.mutedHoverPressableClass : params.mutedHoverClass),
      ],
      listItemEventBeforeClass: 'rounded-full border-(--fc-event-color)',
      listItemEventInnerClass: 'flex flex-row items-center',

      // best look like Google Calendar
      listDayFormat: { day: 'numeric' },
      listDaySideFormat: { month: 'short', weekday: 'short', forceCommas: true },

      blockEventClass: (data) => [
        'relative group',
        'bg-(--fc-event-color) print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : joinClassNames(
              'focus-visible:shadow-md',
              data.isDragging && 'opacity-75'
            ),
      ],
      blockEventInnerClass: 'flex text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden',
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden',

      rowEventClass: (data) => [
        'mb-px',
        'border-y',
        data.isStart ? 'border-s rounded-s-sm' : 'ms-2',
        data.isEnd ? 'border-e rounded-e-sm' : 'me-2',
      ],
      rowEventBeforeClass: (data) =>
        data.isStartResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1', // because both ^scenarious have width-2
        ] : !data.isStart && [
          'absolute -start-2 w-2 -top-px -bottom-px'
        ],
      rowEventBeforeContent: (data) => !data.isStart && filledRightTriangle('size-full text-(--fc-event-color) rotate-180 [[dir=rtl]_&]:rotate-0'),
      rowEventAfterClass: (data) =>
        data.isEndResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1', // because both ^scenarious have width-2
        ] : !data.isEnd && [
          'absolute -end-2 w-2 -top-px -bottom-px',
        ],
      rowEventAfterContent: (data) => !data.isEnd && filledRightTriangle('size-full text-(--fc-event-color) [[dir=rtl]_&]:rotate-180'),

      rowEventInnerClass: 'flex-row items-center',

      rowEventTimeClass: (data) => [
        'font-bold',
        data.isNarrow ? `p-px ${xxsTextClass}` : 'p-0.5 text-xs',
        'shrink-1', // shrinks second
      ],
      rowEventTitleClass: (data) => [
        data.isNarrow ? `p-px ${xxsTextClass}` : 'p-0.5 text-xs',
        'shrink-100', // shrinks first
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
        data.isShort
          ? 'flex-row gap-1' // one line
          : 'flex-col', // two lines
        'py-1',
        (data.isShort || data.isNarrow)
          ? `px-0.5 ${xxsTextClass}`
          : 'px-1 text-xs',
      ],
      columnEventTimeClass: (data) => [ // appears below
        'order-1 shrink-100', // shrinks first
        !data.isShort && 'pt-0.5',
      ],
      columnEventTitleClass: [ // appears above
        'shrink-1', // shrinks second
      ],
      columnEventTitleSticky: false, // because time below title, sticky looks bad

      columnMoreLinkClass: `relative mb-px rounded-xs ${params.strongSolidPressableClass} border border-transparent print:border-black print:bg-white ring ${params.bgRingColorClass}`,
      columnMoreLinkInnerClass: (data) => [
        'p-0.5',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ],

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderAlign: 'center',
      dayHeaderClass: (data) => [
        (data.isDisabled && !data.inPopover) && params.faintBgClass,
        'items-center',
        data.isMajor && `border ${params.strongBorderColorClass}` // TODO: only do border-start?
      ],
      dayHeaderInnerClass: (data) => [
        'mt-2 mx-2 flex flex-col items-center group outline-none', // kill outline because sub-elements do it
        data.isNarrow && xxsTextClass,
      ],

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.faintBgClass,
      ],
      dayCellTopClass: (data) => [
        'flex flex-row',
        'min-h-[2px]', // effectively 2px top padding when no day-number
        data.isNarrow ? 'justify-end' : 'justify-center',
      ],
      dayCellTopInnerClass: (data) => [
        'flex flex-row items-center justify-center rounded-full whitespace-nowrap',
        data.isNarrow
          ? `h-5 m-px ${xxsTextClass}`
          : `h-6 m-1.5 text-sm`,
        data.text === data.dayNumberText
          ? (data.isNarrow ? 'w-5' : 'w-6') // circle
          : (data.isNarrow ? 'px-1' : 'px-2'), // pill
        data.isToday
          ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
          : (data.hasNavLink && params.mutedHoverPressableClass),
        data.monthText && 'font-bold',
        data.isOther && params.faintFgClass,
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      dayLaneClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.faintBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLaneClass: (data) => [
        `border ${params.borderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} ring-2 ${params.bgRingColorClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: (data) => !data.isNarrow && 'min-h-[1px]', // TODO: DRY
      },
      multiMonth: {
        tableBodyClass: `border ${params.borderColorClass} rounded-sm`,
        ...dayRowItemClasses,
        dayHeaderInnerClass: 'mb-2',
        dayCellBottomClass: (data) => !data.isNarrow && 'min-h-[1px]', // TODO: DRY
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-4', // for ALL-DAY

        weekNumberHeaderClass: 'items-center justify-end',
        weekNumberHeaderInnerClass: (data) => [
          'ms-1',
          data.options.dayMinWidth !== undefined && 'me-1',
          ...getWeekNumberPillClasses(data),
        ],

        allDayHeaderClass: 'justify-end items-center', // items-center = valign
        allDayHeaderInnerClass: (data) => [
          'p-2 text-end', // align text right when multiline
          'whitespace-pre', // respects line-breaks in locale data
          data.isNarrow ? xxsTextClass : 'text-sm',
        ],
        allDayDividerClass: `border-t ${params.borderColorClass}`,

        slotLabelClass: (data) => [
          `border ${params.borderColorClass}`,
          'w-2 self-end justify-end', // (self-h-align, contents-h-align)
          data.isMinor && 'border-dotted',
        ],
        slotLabelInnerClass: (data) => [
          `ps-2 pe-3 py-2 relative`,
          data.isNarrow
            ? `${xxsTextClass} -top-4.5`
            : 'text-sm -top-5',
        ],
        slotLabelDividerClass: (data) => [
          'border-l',
          (data.isHeader && data.options.dayMinWidth === undefined) // only hide border in header if no h-scrolling -- TODO: week-number pill margin
            ? 'border-transparent'
            : params.borderColorClass,
        ],
      },
      list: {
        listDayClass: `flex flex-row items-start not-last:border-b ${params.borderColorClass}`,
        listDayHeaderClass: 'shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2 m-2',
        listDayHeaderInnerClass: (data) => [
          !data.level
            ? joinClassNames( // primary (multiple span children)
                'text-lg flex flex-row items-center items-center rounded-full h-9',
                data.text === data.dayNumberText
                  ? 'w-9 justify-center' // circle
                  : 'px-3', // pill
                data.isToday
                  ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
                  : (data.hasNavLink && params.mutedHoverPressableClass)
              )
            : 'text-xs uppercase hover:underline', // secondary (only one text child)
        ],
        listDayEventsClass: 'grow min-w-0 flex flex-col py-2',

        listItemEventClass: 'group rounded-s-full p-2 gap-2',
        listItemEventBeforeClass: 'border-5 mx-2', // 10px diameter
        listItemEventInnerClass: 'text-sm gap-2',
        listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
        listItemEventTitleClass: (data) => [
          'grow min-w-0 whitespace-nowrap overflow-hidden',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: 'grow flex flex-col items-center justify-center',
        noEventsInnerClass: 'py-15',
      },
    },
  }
}
