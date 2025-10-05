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

later:
  simplify rowEventColorClass arrows
  use SVGs

audit use of "group" classnames
*/

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  secondaryClass: string // bg & fg
  secondaryPressableClass: string

  tertiaryClass: string // bg & fg
  tertiaryPressableClass: string
  tertiaryPressableGroupClass: string

  ghostHoverClass: string
  ghostPressableClass: string
  ghostPressableGroupClass: string

  // outline utilities. not already used in (secondary/tertiary/ghost)Pressable
  focusOutlineClass: string
  focusOutlineGroupClass: string
  selectedOutlineClass: string

  strongBgClass: string // used by more-link
  mutedBgClass: string // used by disabled cells
  mutedWashClass: string // used by non-business-hours (guaranteed semitransparent)
  highlightClass: string

  borderColorClass: string
  primaryBorderColorClass: string
  strongBorderColorClass: string
  nowBorderColorClass: string

  eventColor: string
  eventContrastColor: string
  bgEventColor: string
  bgEventColorClass: string

  popoverClass: string

  bgClass: string
  bgOutlineClass: string

  mutedFgClass: string
  disabledFgClass: string
}

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]' // usually 11px font / 12px line-height

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.bgClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getWeekNumberPillClasses = (data: { hasNavLink: boolean, isCompact: boolean }) => [
    'rounded-full h-6 flex flex-row items-center', // match height of daynumber
    data.hasNavLink
      ? params.secondaryPressableClass
      : params.secondaryClass,
    data.isCompact
      ? `${xxsTextClass} px-1`
      : 'text-sm px-2'
  ]

  const dayRowItemBaseClass = 'mx-0.5 mb-px rounded-sm'
  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: (data) => [
      `${dayRowItemBaseClass} p-px`,
      data.isSelected
        ? joinClassNames(params.mutedBgClass, data.isDragging && 'shadow-sm')
        : (data.isInteractive ? params.ghostPressableClass : params.ghostHoverClass),
    ],
    listItemEventColorClass: (data) => [
      'border-4', // 8px diameter
      data.isCompact ? 'mx-px' : 'mx-1',
    ],
    listItemEventInnerClass: (data) => data.isCompact ? xxsTextClass : 'text-xs',
    listItemEventTimeClass: 'p-0.5 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
    listItemEventTitleClass: 'p-0.5 font-bold whitespace-nowrap overflow-hidden shrink-100', // shrinks first

    rowMoreLinkClass: (data) => [
      dayRowItemBaseClass,
      params.ghostPressableClass,
      data.isCompact
        ? `border ${params.primaryBorderColorClass}`
        : 'p-px'
    ],
    rowMoreLinkInnerClass: (data) => [
      'p-0.5',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.bgEventColor,

      tableHeaderClass: (data) => data.isSticky && `${params.bgClass} border-b ${params.borderColorClass}`,

      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthHeaderClass: (data) => [
        data.colCount > 1 ? 'pb-2' : 'py-1',
        data.isSticky && `border-b ${params.borderColorClass} ${params.bgClass}`,
        'justify-center',
      ],
      singleMonthHeaderInnerClass: (data) => [
        'font-bold rounded-full px-2 py-1',
        data.hasNavLink && params.ghostPressableClass,
      ],

      popoverClass: 'm-2 min-w-3xs ' + params.popoverClass,
      popoverCloseClass: `absolute top-2 end-2 rounded-full w-8 h-8 inline-flex flex-row justify-center items-center ${params.ghostPressableClass}`,

      fillerClass: (data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : params.borderColorClass,
      ],
      nonBusinessClass: params.mutedWashClass,
      highlightClass: params.highlightClass,

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',
      inlineWeekNumberClass: (data) => [
        'absolute z-20',
        data.isCompact ? 'top-1 start-0.5' : 'top-1.5 start-1',
      ],
      inlineWeekNumberInnerClass: getWeekNumberPillClasses,

      eventClass: (data) => [
        'hover:no-underline',
        data.isSelected && params.selectedOutlineClass,
      ],

      backgroundEventColorClass: 'bg-(--fc-event-color) ' + params.bgEventColorClass,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      listItemEventClass: 'items-center',
      listItemEventColorClass: 'rounded-full border-(--fc-event-color)',
      listItemEventInnerClass: 'flex flex-row items-center',

      blockEventClass: (data) => [
        'relative isolate group',
        'border-transparent bg-(--fc-event-color)',
        'print:border-(--fc-event-color) print:bg-white',
        params.focusOutlineClass,
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : joinClassNames('focus-visible:shadow-md', data.isDragging && 'opacity-75'),
      ],
      blockEventInnerClass: 'z-10 flex text-(--fc-event-contrast-color) print:text-black',
      blockEventTimeClass: 'whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      blockEventTitleClass: 'whitespace-nowrap overflow-hidden shrink-100', // shrinks first

      rowEventClass: (data) => [
        'mb-px',
        'border-y',
        data.isStart ? 'ms-px border-s rounded-s-sm' : 'ms-2',
        data.isEnd ? 'me-px border-e rounded-e-sm' : 'me-2',
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
        'p-0.5 font-bold',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTitleClass: (data) => [
        'p-0.5',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      columnEventClass: (data) => [
        'mb-px',
        'border-x',
        data.isStart && 'border-t rounded-t-sm',
        data.isEnd && 'border-b rounded-b-sm',
        (data.level || data.isMirror) && !data.isSelected && `outline ${params.bgOutlineClass}`,
      ],
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventInnerClass: (data) => data.isCompact
        ? 'flex-row gap-1' // one line
        : 'flex-col gap-px', // two lines
      columnEventTimeClass: 'p-1 text-xs order-1',
      columnEventTitleClass: (data) => data.isCompact ? xxsTextClass : 'p-1 text-xs',
      columnEventTitleSticky: false, // because time below title, sticky looks bad

      // TODO: keep DRY with timeline rowMoreLink
      columnMoreLinkClass: `relative mb-px p-px rounded-xs ${params.bgClass} outline ${params.bgOutlineClass}`,
      columnMoreLinkColorClass: `absolute z-0 inset-0 rounded-xs ${params.strongBgClass} print:bg-white print:border print:border-black`,
      columnMoreLinkInnerClass: 'z-10 p-0.5 text-xs',

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderAlign: 'center',
      dayHeaderClass: (data) => [
        data.isDisabled && params.mutedBgClass,
        'items-center',
      ],
      dayHeaderInnerClass: (data) => [
        'pt-2 flex flex-col items-center group outline-none',
        data.isCompact && xxsTextClass,
      ],

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.mutedBgClass,
      ],
      dayCellTopClass: (data) => [
        'flex flex-row',
        data.isCompact ? 'justify-end' : 'justify-center',
        'min-h-[2px]', // effectively 2px top padding when no day-number
      ],
      dayCellTopInnerClass: (data) => [
        // TODO: this won't work if hasMonthLabel "Jan 1"... circle will look weird
        'flex flex-row items-center justify-center w-6 h-6 rounded-full',
        data.isToday
          ? (data.hasNavLink ? params.tertiaryPressableClass : params.tertiaryClass)
          : data.hasNavLink && params.ghostPressableClass,
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
        !data.isCompact && 'm-1.5',
        data.isOther && params.disabledFgClass,
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      dayLaneClass: (data) => [
        data.isMajor ? `border ${params.strongBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.mutedBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLaneClass: (data) => [
        `border ${params.borderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full size-0 -m-[6px] border-6 ${params.nowBorderColorClass} outline-2 ${params.bgOutlineClass}`,
    },
    views: {
      dayGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        tableBodyClass: `border ${params.borderColorClass} rounded-sm`,
        ...dayRowItemClasses,
        dayHeaderInnerClass: 'mb-2',
        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayRowItemClasses,
        dayCellBottomClass: 'min-h-4', // for ALL-DAY

        weekNumberHeaderClass: 'items-center justify-end',
        weekNumberHeaderInnerClass: getWeekNumberPillClasses,

        allDayHeaderClass: 'justify-end items-center', // items-center = valign
        allDayHeaderInnerClass: (data) => [
          'p-2 text-end', // align text right when multiline
          'whitespace-pre', // respects line-breaks in locale data
          data.isCompact ? xxsTextClass : 'text-sm',
        ],
        allDayDividerClass: `border-t ${params.borderColorClass}`,

        slotLabelClass: (data) => [
          `border ${params.borderColorClass}`,
          'w-2 self-end justify-end',
          data.isMinor && 'border-dotted',
        ],
        slotLabelInnerClass: (data) => [
          `relative ps-2 pe-3 pb-5 text-end`,
          xxsTextClass,
          data.isCompact
            ? `${xxsTextClass} -top-1.5` // 1.5 tw-units is half xxs's line-height
            : 'text-sm -top-2.5', // 2.5 tw-units is half text-sm's line-height
        ],
        slotLabelDividerClass: (data) => [
          'border-l',
          data.isHeader ? 'border-transparent' : params.borderColorClass,
        ],
      },
      list: {
        listDayClass: `flex flex-row items-start not-last:border-b ${params.borderColorClass}`,
        listDayHeaderClass: 'shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2 m-2 sticky top-0',
        listDayHeaderInnerClass: (data) => [
          'group outline-none',
          !data.level
            ? 'flex flex-row items-center text-lg' // primary
            : 'uppercase text-xs hover:underline', // secondary
        ],
        listDayEventsClass: 'grow min-w-0 flex flex-col py-2',

        listItemEventClass: (data) => [
          'group rounded-s-full p-2 gap-2',
          data.isInteractive ? params.ghostPressableClass : params.ghostHoverClass,
        ],
        listItemEventColorClass: 'border-5 mx-2', // 10px diameter
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
