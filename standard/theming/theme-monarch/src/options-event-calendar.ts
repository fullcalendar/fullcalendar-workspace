import { CalendarOptions, ViewOptions } from '@fullcalendar/core'

// ambient types
// TODO: make these all peer deps? or wait, move options to just core
import '@fullcalendar/daygrid'
import '@fullcalendar/timegrid'
import '@fullcalendar/list'
import '@fullcalendar/multimonth'
import '@fullcalendar/interaction'

export interface EventCalendarOptionParams {
  // already rounded
  // TODO: move to ClassNameGenerator and have public util that rasterizes it?
  // TODO: have different pill for weekNumber vs timeline slotLabel
  todayPillClass: (data: { hasNavLink: boolean }) => string
  pillClass: (data: { hasNavLink: boolean }) => string

  highlightClass: string
  disabledBgClass: string

  borderColorClass: string // eventually just borderColor
  majorBorderColorClass: string // eventually just majorBorderColor
  alertBorderColorClass: string // eventually just alertBorderColor

  canvasBgColor?: string // eventually just canvasColor
  canvasOutlineColor?: string // eventually just canvasColor

  eventColor: string
  eventContrastColor: string
  backgroundEventColor: string
  backgroundEventColorClass: string
}

export const xxsTextClass = 'text-[0.7rem]/[1.25]' // about 11px when default 16px root font size
export const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600' // TODO: deal with this!!!... ugly dark grey... rethink
const nonBusinessHoursClass = 'bg-gray-500/7' // must be semitransprent
export const transparentPressableClass = 'hover:bg-gray-500/10 focus:bg-gray-500/10 active:bg-gray-500/20'
const transparentStrongBgClass = 'bg-gray-500/30' // the touch-SELECTED version of above. use color-mix to make bolder?

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) bg-(--fc-canvas-color)`
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const rowItemBaseClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link
const rowItemClasses: CalendarOptions = {
  listItemEventClass: rowItemBaseClass,
  listItemEventColorClass: (data) => [
    'border-4', // 8px diameter circle
    data.isCompact ? 'mx-px' : 'mx-1',
  ],
  listItemEventInnerClass: (data) => data.isCompact ? xxsTextClass : 'text-xs',
  listItemEventTimeClass: 'p-0.5',
  listItemEventTitleClass: 'p-0.5 font-bold',

  rowMoreLinkClass: (data) => [
    rowItemBaseClass,
    transparentPressableClass,
    'p-0.5',
    data.isCompact && 'border border-blue-500', // looks like bordered event
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
}

export function createEventCalendarOptions({
  borderColorClass,
  majorBorderColorClass,
  alertBorderColorClass,
  eventColor,
  eventContrastColor,
  backgroundEventColor,
  ...props
}: EventCalendarOptionParams): {
  optionDefaults: CalendarOptions
  views?: { [viewName: string]: ViewOptions }
} {
  // TODO: DRY
  const borderClass = `border ${borderColorClass}` // all sides
  const majorBorderClass = `border ${majorBorderColorClass}`

  const getWeekNumberBadgeClasses = (data: { hasNavLink: boolean, isCompact: boolean }) => [
    'rounded-full h-[1.8em] flex flex-row items-center', // match height of daynumber
    props.pillClass({ hasNavLink: data.hasNavLink }),
    data.isCompact
      ? `${xxsTextClass} px-1`
      : 'text-sm px-2'
  ]

  const rowWeekNumberClasses: CalendarOptions = {
    weekNumberClass: (data) => [
      data.isCell
        ? '' // TODO: some sort of shaded bg
        : 'absolute z-20 ' + (data.isCompact ? 'top-1 start-0.5' : 'top-2 start-1'),
    ],
    weekNumberInnerClass: (data) => data.isCell
      ? '' // TODO: cell styles
      : getWeekNumberBadgeClasses(data)
  }

  const axisWeekNumberClasses: CalendarOptions = {
    weekNumberClass: 'items-center justify-end',
    weekNumberInnerClass: getWeekNumberBadgeClasses,
  }

  return {
    optionDefaults: {
      eventColor,
      eventContrastColor,
      backgroundEventColor,
      //  backgroundEventContrastColor, --- TODO
      // eventDisplay: 'block',

      className: `${borderClass} rounded-xl overflow-hidden`,

      tableHeaderClass: (data) => data.isSticky && `bg-(--fc-canvas-color) border-b ${borderColorClass}`,

      popoverClass: `${borderClass} rounded-lg bg-(--fc-canvas-color) shadow-lg m-2`,
      popoverHeaderClass: `px-1 py-1`,
      popoverCloseClass: `absolute top-2 end-2 rounded-full w-8 h-8 inline-flex flex-row justify-center items-center ${transparentPressableClass}`,
      popoverBodyClass: 'p-2 min-w-3xs',

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      // misc BG
      fillerClass: (data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : borderColorClass,
      ],
      nonBusinessClass: nonBusinessHoursClass,
      highlightClass: props.highlightClass,

      eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
      eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

      backgroundEventColorClass:
        'bg-(--fc-event-color) ' + props.backgroundEventColorClass,

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
      // Dot uses border instead of bg because it shows up in print
      // Views must decide circle radius via border thickness
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
        (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
      ],
      columnEventInnerClass: (data) => [
        data.isCompact
          ? 'flex-row gap-1' // one line
          : 'flex-col gap-px', // two lines
      ],
      columnEventTimeClass: 'p-1 text-xs order-1', // TODO: order won't work in react native!
      columnEventTitleClass: (data) => [
        data.isCompact ? xxsTextClass : 'p-1 text-xs',
      ],
      columnEventTitleSticky: false, // because time below title, sticky looks bad

      // MultiMonth
      singleMonthClass: (data) => data.colCount > 1 && 'm-4',
      singleMonthTitleClass: (data) => [
        data.isSticky && `border-b ${borderColorClass} bg-(--fc-canvas-color)`,
        data.isSticky
          ? 'py-2' // single column
          : 'pb-4', // multi-column
        data.isCompact ? 'text-base' : 'text-lg',
        'text-center font-bold',
      ],

      dayHeaderRowClass: borderClass,
      dayHeaderClass: (data) => [
        data.isDisabled && props.disabledBgClass,
        'items-center',
      ],
      dayHeaderInnerClass: (data) => [
        'group pt-2 flex flex-col items-center',
        data.isCompact && xxsTextClass,
      ],

      dayRowClass: borderClass,
      dayCellClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && props.disabledBgClass,
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
          ? props.todayPillClass({ hasNavLink: data.hasNavLink })
          : data.hasNavLink && transparentPressableClass,
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
        !data.isCompact && 'm-2',
      ],

      allDayDividerClass: `border-t ${borderColorClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && props.disabledBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLaneClass: (data) => [
        borderClass,
        data.isMinor && 'border-dotted',
      ],

      listDayClass: `flex flex-row items-start not-last:border-b ${borderColorClass}`,
      listDayHeaderClass: 'flex flex-row items-center w-40',
      listDayHeaderInnerClass: (data) => !data.level
        ? 'm-2 flex flex-row items-center text-lg group' // primary
        : 'uppercase text-xs hover:underline', // secondary
      listDayEventsClass: 'flex-grow flex flex-col py-2',
      // events defined in views.list.listItemEvent* below...

      nowIndicatorLineClass: `-m-px border-1 ${alertBorderColorClass}`,
      nowIndicatorDotClass: `rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 ${alertBorderColorClass}`,

      resourceDayHeaderClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        data.isDisabled && props.disabledBgClass,
        'items-center',
      ],
      resourceDayHeaderInnerClass: (data) => [
        'py-2 flex flex-col',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      resourceAreaHeaderRowClass: borderClass,
      resourceAreaHeaderClass: `${borderClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-s ${borderColorClass}`, // TODO: put bigger hit area inside

      // For both resources & resource groups
      resourceAreaRowClass: borderClass,

      resourceGroupHeaderClass: props.disabledBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: [borderClass, props.disabledBgClass],

      resourceCellClass: borderClass,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceExpanderClass: (data) => [
        'self-center w-6 h-6 flex flex-row items-center justify-center rounded-full text-sm relative start-1',
        transparentPressableClass,
        data.isExpanded ? 'rotate-90' :
          data.direction === 'rtl' && 'rotate-180',
      ],

      resourceLaneClass: borderClass,
      resourceLaneBottomClass: (data) => !data.isCompact && 'pb-3',

      // Non-resource Timeline
      timelineBottomClass: 'pb-3',
    },
    views: {
      dayGrid: {
        ...rowItemClasses,
        ...rowWeekNumberClasses,

        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        ...rowItemClasses,
        ...rowWeekNumberClasses,

        tableBodyClass: `${borderClass} rounded-sm`,
        dayHeaderInnerClass: 'mb-2',
        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...rowItemClasses,
        ...axisWeekNumberClasses,

        dayRowClass: 'min-h-12', // looks good when matches slotLabelInnerClass
        dayCellBottomClass: 'min-h-4', // for ALL-DAY

        allDayHeaderClass: 'justify-end items-center', // items-center = valign
        allDayHeaderInnerClass: (data) => [
          'px-2 py-0.5 text-end', // align text right when multiline
          'whitespace-pre', // respects line-breaks in locale data
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        columnMoreLinkClass: `mb-px rounded-xs outline outline-(--fc-canvas-color) ${moreLinkBgClass}`,
        columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

        slotLabelClass: (data) => [
          borderClass,
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
          data.isHeader ? 'border-transparent' : borderColorClass,
        ],
      },
      timeline: {
        rowEventClass: [
          'me-px', // space from slot line
        ],
        rowEventInnerClass: () => [
          'gap-1', // large gap, because usually time is *range*, and we have a lot of h space anyway
          // TODO: find better way to do isSpacious
          // data.isSpacious
        ],

        rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelSticky: '0.5rem',
        slotLabelClass: (data) => (data.level && !data.isTime)
          ? [
            'border border-transparent',
            'justify-start',
          ]
          : [
            borderClass,
            'h-2 self-end justify-end',
          ],
        slotLabelInnerClass: (data) => (data.level && !data.isTime)
          ? [
            // TODO: converge with week-label styles
            'px-2 py-1 rounded-full text-sm',
            props.pillClass({ hasNavLink: data.hasNavLink }),
          ]
          : 'pb-3 -ms-1 text-sm min-w-14',
          // TODO: also test lowest-level days

        slotLabelDividerClass: `border-b ${borderColorClass}`,
      },
      list: {
        listItemEventClass: 'group rounded-s-xl p-1',
        listItemEventColorClass: 'border-5 mx-2', // 10px diameter circle
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
