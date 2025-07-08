import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
// import { createElement, Fragment } from '@fullcalendar/core/preact'
import * as svgIcons from './svgIcons.js'

/*
buttons:
https://developer.apple.com/design/human-interface-guidelines/buttons

tab-bar:
https://developer.apple.com/design/human-interface-guidelines/tab-bars
https://developer.apple.com/design/human-interface-guidelines/segmented-controls
*/

// Will import ambient types during dev but strip out for build
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/timeline'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import type {} from '@fullcalendar/resource-daygrid'
import type {} from '@fullcalendar/resource-timeline'

const xxsTextClass = 'text-[0.7rem]/[1.25]'
const buttonIconClass = 'text-[1.5em] w-[1em] h-[1em]' // yield buttons that are 1px taller than text buttons!!!

const neutralBgClass = 'bg-gray-500/10'
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600'

const majorBorderClass = 'border border-gray-400 dark:border-gray-700' // TODO
const borderColorClass = 'border-black/10 dark:border-white/10'
const borderClass = `border ${borderColorClass}` // all sides

const cellPaddingClass = 'px-1 py-0.5'
const listItemPaddingClass = 'px-3 py-2' // list-day-header and list-item-event
const dayGridItemClass = 'mx-0.5 mb-px rounded-sm' // list-item-event and more-link

// timegrid axis
const axisClass = 'justify-end' // align axisInner right
const axisInnerClass = `${cellPaddingClass} text-end` // align text right when multiline

// transparent resizer for mouse
// must have 'group' on the event, for group-hover
const blockPointerResizerClass = `absolute z-20 hidden group-hover:block`
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute z-20 h-2 w-2 rounded-full border border-(--fc-event-color) bg-(--fc-canvas-color)`
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const continuationArrowClass = 'relative z-10 mx-px border-y-[5px] border-y-transparent opacity-50'

// applies to DayGrid, TimeGrid ALL-DAY, MultiMonth
const dayGridClasses: CalendarOptions = {
  listItemEventClass: [dayGridItemClass, 'p-px'],
  listItemEventColorClass: (data) => [
    data.isCompact ? 'mx-px' : 'mx-1',
    'border-4', // 8px diameter circle
  ],
  listItemEventInnerClass: (data) => [
    'flex flex-row items-center', // as opposed to display:contents
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
  listItemEventTimeClass: 'p-px',
  listItemEventTitleClass: 'p-px font-bold',

  rowEventClass: (data) => [
    data.isStart && 'ms-0.5',
    data.isEnd && 'me-0.5',
  ],
  rowEventColorClass: (data) => [
    data.isStart && 'rounded-s-full',
    data.isEnd && 'rounded-e-full',
  ],
  rowEventInnerClass: (data) => [
    data.isStart && 'ps-1',
    data.isEnd && 'pe-1',
  ],

  rowMoreLinkClass: (data) => [
    dayGridItemClass,
    data.isCompact
      ? 'border border-blue-500' // looks like bordered event
      : 'self-start p-px',
    'hover:bg-gray-500/20', // matches list-item hover
  ],
  rowMoreLinkInnerClass: (data) => [
    'p-px',
    data.isCompact ? xxsTextClass : 'text-xs',
  ],
}

const floatingWeekNumberClasses: CalendarOptions = {
  weekNumberClass: [
    'absolute z-20 top-0 start-0 p-1.5 min-w-[1.5em]',
  ],
  weekNumberInnerClass: (data) => [
    data.isCompact ? xxsTextClass : 'text-sm',
    'opacity-60 text-center',
  ],
}

const getDayHeaderClasses = (data: { isDisabled: boolean, isMajor: boolean }) => [
  'justify-center',
  data.isMajor ? majorBorderClass : 'border border-transparent',
  data.isDisabled && neutralBgClass,
]

const getDayHeaderInnerClasses = (data: { isCompact: boolean }) => [
  'flex flex-col',
  'p-1.5',
  data.isCompact ? xxsTextClass : 'text-sm',
]

const getSlotClasses = (data: { isMinor: boolean }) => [
  borderClass,
  data.isMinor && 'border-dotted',
]

export interface ThemePluginConfig {
}

/*
TODO: hook up highlightColor
*/
export function createThemePlugin({}: ThemePluginConfig): PluginDef {
  return createPlugin({
    name: '<%= pkgName %>', // TODO
    optionDefaults: {
      eventColor: '#0a78fa',
      /*
      io-light-primary: #0a78fa
      light-blue: #37b3f7
      red: #f0442e

      */

      eventContrastColor: 'var(--color-white)',
      backgroundEventColor: 'var(--color-green-500)',

      className: 'gap-5',

      tableHeaderClass: (data) => data.isSticky && 'bg-(--fc-canvas-color)',
      tableBodyClass: `${borderClass} rounded-lg`,

      toolbarClass: (data) => [
        'items-center gap-4',
        data.borderlessX && 'px-3', // space from edge
      ],
      toolbarSectionClass: (data) => [
        'items-center gap-4',
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

      buttonGroupClass: (data) => [
        'items-center isolate',
        'p-[3px] rounded-full overflow-hidden',
        data.isViewGroup
          ? 'bg-black/10 dark:bg-white/10'
          : 'bg-(--fc-canvas-color) border border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.10)]',

        // more glass-like
        // 'border border-gray-300',
        // 'bg-gray-100 shadow-[0_0_10px_rgba(0,0,0,0.10)]',
      ],

      buttonClass: (data) => [
        'text-sm rounded-full',
        data.inGroup ? 'py-[6px]' : 'py-[9px]',
        data.isIconOnly ? 'px-[6px]' : 'px-[14px]',
        data.isSelected ? 'bg-(--fc-canvas-color) shadow-[0_0_2px_rgba(0,0,0,0.10)]' : (
          !data.inGroup && 'bg-(--fc-canvas-color) border border-black/15 shadow-[0_1px_2px_rgba(0,0,0,0.10)]'
        )

        // more glass-like
        // data.isSelected ? 'bg-white shadow-[0_0_5px_rgba(0,0,0,0.10)]' : (
        //   (!data.inGroup && 'bg-gray-200')
        // ),

        // 'inline-flex items-center px-3 py-2 border-x',
        // 'focus:outline-3 outline-slate-600/50',
        // 'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
        // 'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
        // 'text-sm text-white print:text-black',
        // data.inGroup
        //   ? 'first:rounded-s-sm last:rounded-e-sm relative active:z-20 focus:z-20'
        //   : 'rounded-sm',
        // data.isSelected // implies inGroup
        //   ? 'z-10 border-slate-900 bg-slate-800'
        //   : 'z-0 border-transparent bg-slate-700',
        // data.isDisabled
        //   && 'opacity-65 pointer-events-none', // bypass hover styles
      ],

      popoverClass: `${borderClass} bg-(--fc-canvas-color) shadow-md`,
      popoverHeaderClass: `flex flex-row justify-between items-center px-1 py-1 ${neutralBgClass}`,
      popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
      popoverBodyClass: 'p-2 min-w-[220px]',

      navLinkClass: 'hover:underline',

      moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

      // misc BG
      fillerClass: (data) => [
        'border opacity-50',
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

      blockEventClass: (data) => [
        'relative', // for absolute-positioned color
        'group', // for focus and hover
        (data.isDragging && !data.isSelected) && 'opacity-75',
        data.isSelected
          ? (data.isDragging ? 'shadow-lg' : 'shadow-md')
          : 'focus:shadow-md',
      ],
      blockEventColorClass: (data) => [
        'absolute z-0 inset-0 bg-(--fc-event-color) opacity-90',
        'print:border print:border-(--fc-event-color) print:bg-white',
        data.isSelected
          ? 'brightness-75'
          : 'group-focus:brightness-75',
      ],
      blockEventInnerClass: 'relative z-10 print:text-black flex text-(--fc-event-contrast-color)',
      // text-(--fc-event-contrast-color)

      rowEventClass: 'mb-px', // space between events
      rowEventBeforeClass: (data) => data.isStartResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      ],
      rowEventAfterClass: (data) => data.isEndResizable && [
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      ],
      rowEventColorClass: (data) => [
        !data.isStart && 'print:border-s-0',
        !data.isEnd && 'print:border-e-0',
      ],
      rowEventInnerClass: (data) => [
        'flex-row items-center',
        data.isCompact ? xxsTextClass : 'text-xs',
      ],
      rowEventTimeClass: 'p-[3px] font-bold',
      rowEventTitleClass: 'p-[3px]',

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
      columnEventTimeClass: xxsTextClass,
      columnEventTitleClass: (data) => [
        data.isCompact ? xxsTextClass : 'py-px text-xs',
      ],

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
      dayHeaderClass: getDayHeaderClasses,
      dayHeaderInnerClass: getDayHeaderInnerClasses,
      // dayHeaderDividerClass: ['border-t', borderColorClass],

      dayRowClass: borderClass,
      dayCellClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        // data.isToday && todayBgClass,
        data.isDisabled && neutralBgClass,
      ],
      dayCellTopClass: (data) => [
        'flex flex-row justify-end',
        'min-h-[2px]', // effectively 2px top padding when no day-number
        data.isOther && 'opacity-30',
      ],
      dayCellTopInnerClass: (data) => [
        'p-1.5',
        data.hasMonthLabel && 'text-base font-bold',
        data.isCompact ? xxsTextClass : 'text-sm',
      ],

      allDayDividerClass: `border-t ${borderColorClass}`,

      dayLaneClass: (data) => [
        data.isMajor ? majorBorderClass : borderClass,
        // data.isToday && todayBgClass,
        data.isDisabled && neutralBgClass,
      ],
      dayLaneInnerClass: (data) => data.isSimple
        ? 'm-1' // simple print-view
        : 'ms-0.5 me-[2.5%]',

      slotLabelRowClass: borderClass, // Timeline
      slotLabelAlign: 'center',
      slotLabelClass: getSlotClasses,
      slotLaneClass: getSlotClasses,

      listDayClass: `not-last:border-b ${borderColorClass}`,
      listDayHeaderClass: (data) => [
        `flex flex-row justify-between border-b ${borderColorClass} font-bold`,
        'relative', // for overlaid "before" color
        data.isSticky && 'bg-(--fc-canvas-color)', // base color for overlaid "before" color
      ],
      listDayHeaderBeforeClass: `absolute inset-0 ${neutralBgClass}`,
      listDayHeaderInnerClass: `relative ${listItemPaddingClass} text-sm`, // above the "before" element

      resourceDayHeaderClass: getDayHeaderClasses,
      resourceDayHeaderInnerClass: getDayHeaderInnerClasses,

      resourceAreaHeaderRowClass: borderClass,
      resourceAreaHeaderClass: `${borderClass} items-center`, // valign
      resourceAreaHeaderInnerClass: 'p-2 text-sm',

      resourceAreaDividerClass: `border-x ${borderColorClass} pl-0.5 ${neutralBgClass}`,

      // For both resources & resource groups
      resourceAreaRowClass: borderClass,

      resourceGroupHeaderClass: neutralBgClass,
      resourceGroupHeaderInnerClass: 'p-2 text-sm',
      resourceGroupLaneClass: [borderClass, neutralBgClass],

      resourceCellClass: borderClass,
      resourceCellInnerClass: 'p-2 text-sm',

      resourceExpanderClass: 'self-center relative -top-px start-1 opacity-65', // HACK: relative 1px shift up
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
        ...dayGridClasses,
        ...floatingWeekNumberClasses,

        dayHeaderClass: 'items-end',

        dayCellBottomClass: 'min-h-[1px]',
      },
      multiMonth: {
        ...dayGridClasses,
        ...floatingWeekNumberClasses,

        dayHeaderClass: 'items-end',

        dayCellBottomClass: 'min-h-[1px]',
      },
      timeGrid: {
        ...dayGridClasses,

        dayHeaderClass: 'items-center',

        dayRowClass: 'min-h-[3em]',
        dayCellBottomClass: 'min-h-[1em]', // for ALL-DAY

        allDayHeaderClass: [
          axisClass,
          'items-center', // valign
        ],
        allDayHeaderInnerClass: (data) => [
          axisInnerClass,
          'whitespace-pre', // respects line-breaks in locale data
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        weekNumberClass: `${axisClass} items-center`,
        weekNumberInnerClass: (data) => [
          axisInnerClass,
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        columnMoreLinkClass: `mb-px rounded-xs outline outline-(--fc-canvas-color) ${moreLinkBgClass}`,
        columnMoreLinkInnerClass: 'px-0.5 py-1 text-xs',

        slotLabelClass: axisClass,
        slotLabelInnerClass: (data) => [
          axisInnerClass,
          'min-h-[1.5em]',
          data.isCompact ? xxsTextClass : 'text-sm',
        ],

        slotLabelDividerClass: (data) => [
          'border-l',
          data.isHeader ? 'border-transparent' : borderColorClass,
        ],

        nowIndicatorLabelClass: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-red-500',
        nowIndicatorLineClass: 'border-t border-red-500',
      },
      timeline: {
        rowEventClass: [
          'me-px', // space from slot line
          'items-center', // for aligning continuation arrows
        ],
        rowEventBeforeClass: (data) => !data.isStartResizable && [
          continuationArrowClass,
          'border-e-[5px] border-e-black', // pointing to start
        ],
        rowEventAfterClass: (data) => !data.isEndResizable && [
          continuationArrowClass,
          'border-s-[5px] border-s-black', // pointing to end
        ],
        rowEventInnerClass: (data) => [
          'px-px gap-1', // TODO: put the gap on the global rowEventInnerClass???
          data.isSpacious ? 'py-1' : 'py-px',
        ],

        rowMoreLinkClass: `me-px p-px ${moreLinkBgClass}`,
        rowMoreLinkInnerClass: 'p-0.5 text-xs',

        slotLabelClass: 'justify-center',
        slotLabelInnerClass: 'p-1 text-sm',

        slotLabelDividerClass: `border-b ${borderColorClass}`,

        nowIndicatorLabelClass: 'top-0 -mx-[5px] border-x-[5px] border-x-transparent border-t-[6px] border-t-red-500',
        nowIndicatorLineClass: 'border-l border-red-500',
      },
      list: {
        listItemEventClass: `group gap-3 not-last:border-b ${borderColorClass} ${listItemPaddingClass}`,
        listItemEventColorClass: 'border-5', // 10px diameter circle
        listItemEventInnerClass: '[display:contents]',
        listItemEventTimeClass: 'order-[-1] w-[165px] text-sm', // send to start
        listItemEventTitleClass: (data) => [
          'text-sm',
          data.event.url && 'group-hover:underline',
        ],

        noEventsClass: `py-15 flex flex-col flex-grow items-center justify-center ${neutralBgClass}`,
      },
    },
  }) as PluginDef
}
