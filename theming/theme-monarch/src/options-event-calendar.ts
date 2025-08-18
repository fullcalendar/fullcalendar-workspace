import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

/*
TODO:
  audit responsiveness
  audit dark modes
  list-view
    single-events in a day should vertically align with number
    (rethink how circle-number height is done)
  put x-padding on non-circled day numbers. tab-focusing looks bad right now
  expander for resource groups, resource-nesting
  uppercase text for time slotLabels?
  (for demo only): change slotDuration and interval
  proper chevron!
  tricks to make current-view-tabs not so wide

bug: left-align dayheader for day-only views after views.day options bug above is fixed
  later: fix Screenshots/multimonth-more-link-bug.png
  core: kill border-radius and drop-shadow on (Calendar|View) when borderless
    OR, have root-div (and view-div? else?) explicitly handle this
  bug: Causes scrollbars when there shouldn't be
    slotDuration: '01:00',
    expandRows: true,

same height for all daygrid event-like elements

TODO: resource-view expander doesn't expand. use chevron-down and do rotations
TODO: put bigger hit area inside resource-area-divider-RESIZER
TODO: timeline event spaciousness
TODO: better icon sizes
*/

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/daygrid'
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  // should just provide colors and hover effects
  todayPillClass: (data: { hasNavLink: boolean }) => string
  // same. for week number and timeline axis labels
  pillClass: (data: { hasNavLink: boolean }) => string
  highlightClass: string
  disabledBgClass: string
  borderColorClass: string
  nowIndicatorBorderColorClass: string
  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string
  popoverClass: string
  pageBgColorClass: string
  pageBgColorOutlineClass: string
}

export const xxsTextClass = 'text-[0.7rem]/[1.25]'
export const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600' // TODO: ugly dark grey?
export const majorBorderColorClass = 'border-gray-400 dark:border-gray-700'
export const transparentPressableClass = 'hover:bg-gray-500/10 focus:bg-gray-500/10 active:bg-gray-500/20'
const transparentStrongBgClass = 'bg-gray-500/30'
const nonBusinessHoursClass = 'bg-gray-500/7' // must be semitransprent

export function createEventCalendarOptions(params: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // transparent resizer for mouse
  const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
  const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
  const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

  // circle resizer for touch
  const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) ${params.pageBgColorClass}`
  const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
  const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

  const getWeekNumberPillClasses = (data: { hasNavLink: boolean, isCompact: boolean }) => [
    'rounded-full h-[1.8em] flex flex-row items-center', // match height of daynumber
    params.pillClass({ hasNavLink: data.hasNavLink }),
    data.isCompact
      ? `${xxsTextClass} px-1`
      : 'text-sm px-2'
  ]

  const dayRowItemBaseClass = 'mx-0.5 mb-px rounded-sm'
  const dayRowItemClasses: CalendarOptions = {
    listItemEventClass: dayRowItemBaseClass,
    listItemEventColorClass: (data) => [
      'border-4', // 8px diameter
      data.isCompact ? 'mx-px' : 'mx-1',
    ],
    listItemEventInnerClass: (data) => data.isCompact ? xxsTextClass : 'text-xs',
    listItemEventTimeClass: 'p-0.5',
    listItemEventTitleClass: 'p-0.5 font-bold',

    rowMoreLinkClass: (data) => [
      dayRowItemBaseClass,
      transparentPressableClass,
      'p-0.5',
      data.isCompact && 'border border-blue-500', // looks like bordered event
    ],
    rowMoreLinkInnerClass: (data) => data.isCompact ? xxsTextClass : 'text-xs',
  }

  return {
    optionDefaults: {
      eventColor: params.eventColor,
      eventContrastColor: params.eventContrastColor,
      backgroundEventColor: params.backgroundEventColor,

      className: `border ${params.borderColorClass} rounded-xl overflow-hidden`,
      tableHeaderClass: (data) => data.isSticky && `${params.pageBgColorClass} border-b ${params.borderColorClass}`,

      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthHeaderClass: (data) => [
        data.isSticky && `border-b ${params.borderColorClass} ${params.pageBgColorClass}`,
        data.isSticky
          ? 'py-2' // single column
          : 'pb-4', // multi-column
        data.isCompact ? 'text-base' : 'text-lg',
        'text-center font-bold',
      ],

      popoverClass: 'm-2 min-w-3xs ' + params.popoverClass,
      popoverCloseClass: `absolute top-2 end-2 rounded-full w-8 h-8 inline-flex flex-row justify-center items-center ${transparentPressableClass}`,

      fillerClass: (data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : params.borderColorClass,
      ],
      nonBusinessClass: nonBusinessHoursClass,
      highlightClass: params.highlightClass,

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',
      inlineWeekNumberClass: (data) => [
        'absolute z-20',
        data.isCompact ? 'top-1 start-0.5' : 'top-2 start-1',
      ],
      inlineWeekNumberInnerClass: getWeekNumberPillClasses,

      eventClass: 'hover:no-underline',
      eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
      eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

      backgroundEventColorClass: 'bg-(--fc-event-color) ' + params.backgroundEventColorClass,
      backgroundEventTitleClass: (data) => [
        'm-2 opacity-50 italic',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],

      listItemEventClass: (data) => [
        'items-center',
        data.isSelected
          ? transparentStrongBgClass // touch-selected
          : transparentPressableClass,
        (data.isSelected && data.isDragging) && 'shadow-sm', // touch-dragging
      ],
      listItemEventColorClass: 'rounded-full border-(--fc-event-color)',
      listItemEventInnerClass: 'flex flex-row items-center',

      blockEventClass: (data) => [
        'relative', // for absolute-positioned color
        'group', // for focus and hover
        (data.isDragging && !data.isSelected) && 'opacity-75',
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : 'focus:shadow-md',
      ],
      blockEventColorClass: (data) => [
        'absolute z-0 inset-0',
        'bg-(--fc-event-color) print:bg-white',
        'print:border print:border-(--fc-event-color)',
        data.isSelected
          ? 'brightness-75'
          : 'group-focus:brightness-75',
      ],
      blockEventInnerClass: 'relative z-10 flex text-(--fc-event-contrast-color)',

      rowEventClass: (data) => [
        'mb-px', // space between events
        data.isStart ? 'ms-px' : 'ps-2',
        data.isEnd ? 'me-px' : 'pe-2',
      ],
      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventColorClass: (data) => [
        data.isStart && 'rounded-s-sm',
        data.isEnd && 'rounded-e-sm',
        (!data.isStart && !data.isEnd) // arrows on both sides
          ? '[clip-path:polygon(0_50%,6px_0,calc(100%_-_6px)_0,100%_50%,calc(100%_-_6px)_100%,6px_100%)]'
          : !data.isStart // just start side
            ? '[clip-path:polygon(0_50%,6px_0,100%_0,100%_100%,6px_100%)]'
            : !data.isEnd // just end side
              && '[clip-path:polygon(0_0,calc(100%_-_6px)_0,100%_50%,calc(100%_-_6px)_100%,0_100%)]',
      ],
      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: 'p-1 font-bold',
      rowEventTitleClass: 'p-1',

      columnEventClass: 'mb-px', // space from slot line
      columnEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      ],
      columnEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      ],
      columnEventColorClass: (data) => [
        data.isStart && 'rounded-t-sm',
        data.isEnd && 'rounded-b-sm',
        (data.level || data.isDragging) && `outline ${params.pageBgColorOutlineClass}`,
      ],
      columnEventInnerClass: (data) => data.isCompact
        ? 'flex-row gap-1' // one line
        : 'flex-col gap-px', // two lines
      columnEventTimeClass: 'p-1 text-xs order-1',
      columnEventTitleClass: (data) => data.isCompact ? xxsTextClass : 'p-1 text-xs',
      columnEventTitleSticky: false, // because time below title, sticky looks bad

      columnMoreLinkClass: `mb-px rounded-xs outline ${params.pageBgColorOutlineClass} ${moreLinkBgClass}`,
      columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

      dayHeaderRowClass: `border ${params.borderColorClass}`,
      dayHeaderClass: (data) => [
        data.isDisabled && params.disabledBgClass,
        'items-center',
      ],
      dayHeaderInnerClass: (data) => [
        'group pt-2 flex flex-col items-center',
        data.isCompact && xxsTextClass,
      ],

      dayRowClass: `border ${params.borderColorClass}`,
      dayCellClass: (data) => [
        data.isMajor ? `border ${majorBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.disabledBgClass,
      ],
      dayCellTopClass: (data) => [
        'flex flex-row',
        data.isCompact ? 'justify-end' : 'justify-center',
        'min-h-[2px]', // effectively 2px top padding when no day-number
        data.isOther && 'opacity-30',
      ],
      dayCellTopInnerClass: (data) => [
        // TODO: this won't work if hasMonthLabel "Jan 1"... circle will look weird
        'flex flex-row items-center justify-center w-[1.8em] h-[1.8em] rounded-full',
        data.isToday
          ? params.todayPillClass({ hasNavLink: data.hasNavLink })
          : data.hasNavLink && transparentPressableClass,
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
        !data.isCompact && 'm-2',
      ],
      dayCellInnerClass: (data) => data.inPopover && 'p-2',

      dayLaneClass: (data) => [
        data.isMajor ? `border ${majorBorderColorClass}` : `border ${params.borderColorClass}`,
        data.isDisabled && params.disabledBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLaneClass: (data) => [
        `border ${params.borderColorClass}`,
        data.isMinor && 'border-dotted',
      ],

      nowIndicatorLineClass: `-m-px border-1 ${params.nowIndicatorBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 ${params.nowIndicatorBorderColorClass}`,
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
        dayRowClass: 'min-h-12', // looks good when matches slotLabelInnerClass
        dayCellBottomClass: 'min-h-4', // for ALL-DAY

        weekNumberHeaderClass: 'items-center justify-end',
        weekNumberHeaderInnerClass: getWeekNumberPillClasses,

        allDayHeaderClass: 'justify-end items-center', // items-center = valign
        allDayHeaderInnerClass: (data) => [
          'px-2 py-0.5 text-end', // align text right when multiline
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
          'ps-2 pe-3 py-0.5 -mt-[1em] text-end', // best -mt- value???
          'min-h-[3em]',
          data.isCompact ? xxsTextClass : 'text-sm',
        ],
        slotLabelDividerClass: (data) => [
          'border-l',
          data.isHeader ? 'border-transparent' : params.borderColorClass,
        ],
      },
      list: {
        listDayClass: `flex flex-row items-start not-last:border-b ${params.borderColorClass}`,
        listDayHeaderClass: 'flex flex-row items-center w-40',
        listDayHeaderInnerClass: (data) => !data.level
          ? 'm-2 flex flex-row items-center text-lg group' // primary
          : 'uppercase text-xs hover:underline', // secondary
        listDayEventsClass: 'flex-grow flex flex-col py-2',

        listItemEventClass: 'group rounded-s-xl p-1',
        listItemEventColorClass: 'border-5 mx-2', // 10px diameter
        listItemEventInnerClass: 'text-sm',
        listItemEventTimeClass: 'w-40 mx-2',
        listItemEventTitleClass: (data) => [
          'mx-2',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center`,
      },
    },
  }
}
