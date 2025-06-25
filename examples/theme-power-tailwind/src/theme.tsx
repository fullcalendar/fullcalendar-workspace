import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import * as svgIcons from './svgIcons.js'

/*
TODO: segmented buttons:
https://m3.material.io/components/segmented-buttons/overview
*/

// Will import ambient types during dev but strip out for build
import {} from '@fullcalendar/timegrid'
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timeline'

/*
TODO:
day-circle hovers should always hover gray
rethink classNames.rigid change
  overflow not working well on datagrid column resizing now
QUESTION: why does datagrid cell have inner wrap?

Google DESIGN:
  expander for resource groups, resource-nesting
  uppercase text for time slotLabels?
  (for demo only): change slotDuration and interval

NOTES:
for alignment,
  dayHeader and timeline-slotLabel are flex-col
  timeGrid-slotLabel is flex-row
text size:
  text-sm = 14px (day-numbers, slot-labels, datagrid cells)
  text-xs = 12px (events)
  xxsTextClass ~= 11px (time within events -- use sparingly)
*/

const xxsTextClass = 'text-[0.7rem]/[1.25]' // about 11px when default 16px root font size
const buttonIconClass = 'w-[1em] h-[1em] text-[1.5em]'

const neutralBgClass = 'bg-gray-500/7'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

const borderColorClass = 'border-gray-300 dark:border-gray-800'
const borderClass = `border ${borderColorClass}` // all sides
const majorBorderClass = 'border border-gray-400 dark:border-gray-700'

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
    'p-0.5 hover:bg-gray-500/20', // matches list-item hover
    data.isCompact && 'border border-blue-500', // looks like bordered event
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
}

const getSlotClasses = (data: { isMinor: boolean }) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

const weekNumberColorClass = 'bg-gray-300 dark:bg-gray-700 opacity-60'
const weekNumberPaddingClass = 'px-0.5'
const getWeekNumberInnerClass = (data: { hasNavLink: boolean, isCompact: boolean }) => [
  weekNumberPaddingClass,
  data.hasNavLink && 'hover:underline',
  data.isCompact ? xxsTextClass : 'text-sm',
]
const getWeekNumberLabelClass = (data: { hasNavLink: boolean, isCompact: boolean }) => [
  'rounded-sm',
  weekNumberColorClass,
  ...getWeekNumberInnerClass(data),
]
const rowWeekNumberClasses: CalendarOptions = {
  weekNumberClass: (data) => [
    data.isCell
      ? weekNumberColorClass
      : 'absolute z-20 ' + (data.isCompact ? 'top-1 start-0.5' : 'top-2 start-1'),
  ],
  weekNumberInnerClass: (data) => data.isCell
    ? getWeekNumberInnerClass(data)
    : getWeekNumberLabelClass(data)
}
const axisWeekNumberClasses: CalendarOptions = {
  weekNumberClass: 'items-center justify-end',
  weekNumberInnerClass: getWeekNumberLabelClass,
}

export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    eventColor: 'var(--color-blue-500)',
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)',
    // eventDisplay: 'block',

    className: `${borderClass} rounded-xl overflow-hidden`,

    tableHeaderClass: (data) => data.isSticky && `bg-(--fc-canvas-color) border-b ${borderColorClass}`,

    toolbarClass: 'p-4 items-center gap-3',
    toolbarSectionClass: (data) => [
      'items-center gap-3',
      data.name === 'center' && '-order-1 sm:order-0 w-full sm:w-auto', // nicer wrapping
    ],
    toolbarTitleClass: 'text-xl md:text-2xl font-bold',

    buttons: {
      prev: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronLeft(buttonIconClass)
          : svgIcons.chevronRight(buttonIconClass),
      },
      next: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronRight(buttonIconClass)
          : svgIcons.chevronLeft(buttonIconClass),
      },
      prevYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsLeft(buttonIconClass)
          : svgIcons.chevronsRight(buttonIconClass),
      },
      nextYear: {
        iconContent: (data) => data.direction === 'ltr'
          ? svgIcons.chevronsRight(buttonIconClass)
          : svgIcons.chevronsLeft(buttonIconClass),
      },
    },

    buttonGroupClass: 'items-center isolate',
    buttonClass: (data) => [
      'inline-flex items-center px-3 py-3 border-x',
      'focus:outline-3 outline-slate-600/50',
      'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
      'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
      'text-sm text-white print:text-black',
      data.inGroup
        ? 'first:rounded-s-lg last:rounded-e-lg relative active:z-20 focus:z-20'
        : 'rounded-lg',
      data.isSelected // implies inGroup
        ? 'z-10 border-slate-900 bg-slate-800'
        : 'z-0 border-transparent bg-slate-700',
      data.isDisabled
        && 'opacity-65 pointer-events-none', // bypass hover styles
    ],

    popoverClass: `${borderClass} rounded-lg bg-(--fc-canvas-color) shadow-lg m-2`,
    popoverHeaderClass: `justify-between items-center px-1 py-1`,
    popoverCloseClass: 'absolute top-2 end-2 rounded-full w-8 h-8 inline-flex flex-row justify-center items-center hover:bg-gray-200',
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClass: 'p-2 min-w-3xs',

    moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

    // misc BG
    fillerClass: (data) => [
      'opacity-50 border',
      data.isHeader ? 'border-transparent' : borderColorClass,
    ],
    nonBusinessClass: neutralBgClass,
    highlightClass: 'bg-cyan-100/40 dark:bg-blue-500/20',

    eventClass: (data) => data.event.url && 'hover:no-underline',
    eventTimeClass: 'whitespace-nowrap overflow-hidden flex-shrink-1', // shrinks second
    eventTitleClass: 'whitespace-nowrap overflow-hidden flex-shrink-100', // shrinks first

    backgroundEventColorClass: 'bg-(--fc-event-color) brightness-150 opacity-15',
    backgroundEventTitleClass: (data) => [
      'm-2 opacity-50 italic',
      data.isCompact ? xxsTextClass : 'text-xs',
    ],

    listItemEventClass: (data) => [
      'items-center',
      data.isSelected
        ? 'bg-gray-500/40' // touch-selected
        : 'hover:bg-gray-500/20 focus:bg-gray-500/30',
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
      data.isStart && 'rounded-s-md',
      data.isEnd && 'rounded-e-md',
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
    rowEventTimeClass: 'p-0.5 font-bold',
    rowEventTitleClass: 'p-0.5',

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
      data.isStart && 'rounded-t-md',
      data.isEnd && 'rounded-b-md',
      (data.level || data.isDragging) && 'outline outline-(--fc-canvas-color)',
    ],
    columnEventInnerClass: (data) => [
      data.isCompact
        ? 'flex-row gap-1' // one line
        : 'flex-col gap-px', // two lines
    ],
    columnEventTimeClass: 'text-xs order-1', // TODO: order won't work in react native!
    columnEventTitleClass: (data) => [
      data.isCompact ? xxsTextClass : 'py-px text-xs',
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
      data.isDisabled && neutralBgClass,
      'items-center',
    ],
    dayHeaderInnerClass: (data) => [
      'group pt-2 flex flex-col items-center',
      data.isCompact && xxsTextClass,
    ],
    dayHeaderContent: (data) => (
      <Fragment>
        {data.weekdayText && (
          <div className={
            'uppercase text-xs opacity-60' +
              (data.hasNavLink ? ' group-hover:opacity-90' : '')
          }>{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={
              'm-0.5 flex flex-row items-center justify-center text-lg h-[2em]' +
              (data.isToday
                ? ' w-[2em] rounded-full bg-blue-500 text-white'
                : data.hasNavLink
                  ? ' w-[2em] rounded-full group-hover:bg-gray-500/7'
                  : '')
            }
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),

    dayRowClass: borderClass,
    dayCellClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      data.isDisabled && neutralBgClass,
    ],
    dayCellTopClass: (data) => [
      'flex flex-row',
      data.isCompact ? 'justify-end' : 'justify-center',
      'min-h-[2px]', // effectively 2px top padding when no day-number
      data.isOther && 'opacity-30',
    ],
    dayCellTopInnerClass: (data) => [
      data.isCompact ? (!data.isToday && 'mx-1') : 'm-1',
      'flex flex-row items-center justify-center h-[1.8em]' +
        (data.isToday ? ' w-[1.8em] rounded-full bg-blue-500 text-white decoration-red-100' : ''),
      data.hasMonthLabel && 'text-base font-bold',
      data.isCompact ? xxsTextClass : 'text-sm',
      data.hasNavLink && 'hover:underline'
    ],

    allDayDividerClass: `border-t ${borderColorClass}`,

    dayLaneClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      data.isDisabled && neutralBgClass,
    ],
    dayLaneInnerClass: (data) => data.isSimple
      ? 'm-1' // simple print-view
      : 'ms-0.5 me-[2.5%]',

    slotLabelInnerClass: (data) => data.hasNavLink && 'hover:underline',
    slotLaneClass: getSlotClasses,

    listDayClass: `flex flex-row items-start not-last:border-b ${borderColorClass}`,
    listDayHeaderClass: 'flex flex-row items-center w-40',
    listDayHeaderInnerClass: (data) => !data.level
      ? 'm-2 flex flex-row items-center text-lg group' // primary
      : 'uppercase text-xs hover:underline', // secondary
    listDayHeaderContent: (data) => !data.level ? (
      <Fragment>
        {data.textParts.map((textPart) => ( // primary
          textPart.type === 'day' ? (
            <div className={
              'flex flex-row items-center justify-center w-[2em] h-[2em] rounded-full' +
                (data.isToday
                  ? ' bg-blue-500 text-white'
                  : data.hasNavLink
                    ? ' hover:bg-gray-500/7'
                    : '')
            }>{textPart.value}</div>
          ) : (
            <div className='whitespace-pre'>{textPart.value}</div>
          )
        ))}
      </Fragment>
    ) : (
      data.text // secondary
    ),
    listDayEventsClass: 'flex-grow flex flex-col py-2',
    // events defined in views.list.listItemEvent* below...

    nowIndicatorLineClass: '-m-px border-1 border-red-600 dark:border-red-400',
    nowIndicatorDotClass: 'rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 border-red-600 dark:border-red-400', // TODO: cripser with bg instead of border?

    resourceDayHeaderClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      data.isDisabled && neutralBgClass,
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

    resourceGroupHeaderClass: neutralBgClass,
    resourceGroupHeaderInnerClass: 'p-2 text-sm',
    resourceGroupLaneClass: [borderClass, neutralBgClass],

    resourceCellClass: borderClass,
    resourceCellInnerClass: 'p-2 text-sm',

    resourceExpanderClass: 'self-center relative -top-px start-1 text-sm opacity-65', // HACK: relative 1px shift up
    resourceExpanderContent: (data) => data.isExpanded
      ? svgIcons.minusSquare('w-[1em] h-[1em]')
      : svgIcons.plusSquare('w-[1em] h-[1em]'),

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
          'bg-gray-300 dark:bg-gray-700 opacity-60',
          data.hasNavLink && 'hover:underline',
        ]
        : 'pb-3 -ms-1 text-sm',
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
}) as PluginDef
