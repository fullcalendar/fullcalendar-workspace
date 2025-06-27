import { CalendarOptions, createPlugin, PluginDef } from '@fullcalendar/core'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import * as svgIcons from './svgIcons.js'

/*
TODO: segmented buttons:
https://m3.material.io/components/segmented-buttons/overview

What font is this?
https://react-native-big-calendar.vercel.app/?path=/story/showcase-desktop--three-days-mode
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
Use rotated icons to save space
Theme buttons
Do navlink underline hover sparingly. Prefer bg color change

Google DESIGN:
  expander for resource groups, resource-nesting
  uppercase text for time slotLabels?
  (for demo only): change slotDuration and interval
  proper chevron!

NOTES:
for alignment,
  dayHeader and timeline-slotLabel are flex-col
  timeGrid-slotLabel is flex-row
text size:
  text-sm = 14px (day-numbers, slot-labels, datagrid cells)
  text-xs = 12px (events)
  xxsTextClass ~= 11px (time within events -- use sparingly)
border-radius
  don't need to parameterize. shadcn already customizes rounded-(lg|md|sm)

opacity on disabled-text day-header-tops aren't very good
*/

// TODO: compare these to shadcn variables
// TODO: maybe undo EM sizing.. won't work with react native
// TODO: ^^after, fix list-view sizing. will know units for circles better
// TODO: refine roundedness of events, spacing within
// TODO: hover effect on timegrid header is weird
// TODO: more rounded more-links
// TODO: more rounded mini-calendars
// TODO: dark mode!
// TODO: bigger circle on dayCellTop? won't match week number anymore?
// TODO: rename transparent* to ghost*
// TODO: rename disabled* to muted*

/*

(forget the toolbar!)

add custom colors to our tailwind config:

  src:
    <div class='bg-fc-primary hover:bg-fc-secondary' />

  default theme:
    @theme {
      --color-fc-primary: var(--color-red-100);
      --color-fc-secondary: var(--color-green-100);
    }
    @layer theme {
      .dark {
        --color-fc-primary: var(--color-red-900);
        --color-fc-secondary: var(--color-green-900);
      }
    }
    output:
      const primaryBgClass = 'bg-red-100 dark:bg-red-900'
      const secondaryHoverBgClass = 'hover:bg-green-100 dark:hover:bg-green-900'
      <div class={`${primaryBgClass} ${secondaryHoverBgClass}`} />

  shadcn theme:
    @theme {
      --fc-color-primary: var(--primary);
      --fc-color-secondary: var(--secondary);
    }
    output:
      <div class='bg-primary hover:bg-secondary' />





const surfaceBgColor = createVar()
const surfaceFgColor = createVar()

const primarySurface = createStyle({ // OR createInlineableStyle
  [surfaceBgColor]: 'gray',
  [surfaceFgColor]: 'black',
  dark: {
    [surfaceBgColor]: '#675496',
    [surfaceFgColor]: 'white',
  }
})

const dayCellToday = joinStyle(
  primarySurface,
  { // essentially createInlineableStyle
    'border-radius': 'lg',
  }
)
// ^^^
//
// tailwind:
// bg-gray-500 text-black dark:bg-[#675496] dark:text-white
//
//
// vanilla css:
// "fc-day-cell-today"
// :root {
//   --fc-surface-bg-color: gray;
//   --fc-surface-fc-color: black;
// }
// .fc-dark { ----!!!---- the copypastable plugin code should define this class for sure
//   --fc-surface-bg-color: #675496;
//   --fc-surface-fc-color: white;
// }
// .fc-day-cell-today {
//   background: var(--fc-surface-bg-color);
//   color: var(--fc-surface-fg-color);
// }
// .fc-day-cell-today {
//   border-radius: 20p;
// }
//
We must decide how joining works (https://vanilla-extract.style/documentation/style-composition/#style-composition)
Whether space-delimeted classnames OR selector inheritance OR maybe even inlining!
SOLUTION: when createStyles() result is merged with another, do what Vanilla Extract does (space-separate)
otherwise, if {} is used, just inline it







color vars:

  primary
  primary-hover
    the today-date circle
  secondary
    the week-pill, timeline-navlink pills
  ghost (only on hover)
    shadcn: use "accent" (on hover)
    the non-today-date circles
    the icon-button backgrounds



bg-primary
bg-secondary -- bg-secondary/90

*/

// shadcn: don't forget ring ao
const primarySurfaceClass = 'bg-[#675496] text-white' // shadcn "primary", "primary-foreground"
const secondarySurfaceClass = 'bg-[#e2e0f9]' // shadcn "secondary", "secondary-foreground"
const primaryPressableClass = `${primarySurfaceClass} hover:bg-[#7462a2] active:bg-[#544181]` // shadcn: same as above except with effects using color-mix
const secondaryPressableClass = `${secondarySurfaceClass} hover:bg-[#d6d4f0] active:bg-[#c4c1e9]` // shadcn: same as above except with effects using color-mix
const transparentPressableClass = 'hover:bg-gray-500/10 focus:bg-gray-500/10 active:bg-gray-500/20' // shadcn "accent", with effects using color-mix
const transparentStrongBgClass = 'bg-gray-500/30' // the touch-SELECTED version of above. use color-mix to make bolder?
const disabledTextColorClass = 'text-gray-500' // shadcn "muted-foreground"
const disabledPressableClass = `${secondarySurfaceClass} ${disabledTextColorClass}`
const neutralBgClass = 'bg-gray-500/7' // TODO: deal with this!!!... what is it used for ?
const moreLinkBgClass = 'bg-gray-300 dark:bg-gray-600' // TODO: deal with this!!!... ugly dark grey... rethink
const borderColorClass = 'border-[#dde3ea] dark:border-gray-800' // shadcn "border" TODO: for DARK
const borderClass = `border ${borderColorClass}` // all sides
const majorBorderClass = 'border border-gray-400 dark:border-gray-700' // shadcn "ring"
const alertBorderColorClass = 'border-red-600 dark:border-red-400' // shadcn "destructive"
const highlightBgClass = 'bg-cyan-100/40 dark:bg-blue-500/20' // shadcn "chart-1", fallback to "accent"

const xxsTextClass = 'text-[0.7rem]/[1.25]' // about 11px when default 16px root font size
const buttonIconClass = 'w-[1em] h-[1em] text-[1.5em]'

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

const getWeekNumberBadgeClasses = (data: { hasNavLink: boolean, isCompact: boolean }) => [
  'rounded-full h-[1.8em] flex flex-row items-center', // match height of daynumber
  data.hasNavLink
    ? secondaryPressableClass
    : `${secondarySurfaceClass} ${disabledTextColorClass}`,
  data.isCompact
    ? `${xxsTextClass} px-1`
    : 'text-sm px-2'
]

const rowWeekNumberClasses: CalendarOptions = {
  weekNumberClass: (data) => [
    data.isCell
      ? secondarySurfaceClass
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

export default createPlugin({
  name: '<%= pkgName %>', // TODO
  optionDefaults: {
    eventColor: 'var(--color-blue-500)', // TODO: theme should customize these!!!
    eventContrastColor: 'var(--color-white)',
    backgroundEventColor: 'var(--color-green-500)', // TODO: theme should customize these!!!
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

    buttonGroupClass: (data) => [
      'items-center isolate rounded-full',
      data.isViewGroup && secondarySurfaceClass,
    ],
    buttonClass: (data) => [
      'inline-flex items-center justify-center py-3 text-sm rounded-full',
      data.inGroup && 'relative active:z-20 focus:z-20',
      data.isSelected ? 'z-10' : 'z-0',
      data.isDisabled && `pointer-events-none`, // bypass hover styles
      data.isIconOnly ? 'px-3' : 'px-5',
      (data.isIconOnly || (data.inGroup && !data.isSelected))
        ? transparentPressableClass
        : data.isDisabled
          ? disabledPressableClass
          : primaryPressableClass,
    ],

    popoverClass: `${borderClass} rounded-lg bg-(--fc-canvas-color) shadow-lg m-2`,
    popoverHeaderClass: `justify-between items-center px-1 py-1`,
    popoverCloseClass: `absolute top-2 end-2 rounded-full w-8 h-8 inline-flex flex-row justify-center items-center ${transparentPressableClass}`,
    popoverCloseContent: () => svgIcons.x('w-[1.357em] h-[1.357em] opacity-65'),
    popoverBodyClass: 'p-2 min-w-3xs',

    moreLinkInnerClass: 'whitespace-nowrap overflow-hidden',

    // misc BG
    fillerClass: (data) => [
      'opacity-50 border',
      data.isHeader ? 'border-transparent' : borderColorClass,
    ],
    nonBusinessClass: neutralBgClass,
    highlightClass: highlightBgClass,

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
                ? ` w-[2em] rounded-full ${data.hasNavLink ? primaryPressableClass : primarySurfaceClass}`
                : data.hasNavLink
                  ? ` w-[2em] rounded-full ${transparentPressableClass}`
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
      'flex flex-row items-center justify-center w-[1.8em] h-[1.8em] rounded-full',
      data.isToday
        ? (data.hasNavLink ? primaryPressableClass : primarySurfaceClass)
        : data.hasNavLink && transparentPressableClass,
      data.hasMonthLabel && 'text-base font-bold',
      data.isCompact ? xxsTextClass : 'text-sm',
      !data.isCompact && 'm-2',
    ],

    allDayDividerClass: `border-t ${borderColorClass}`,

    dayLaneClass: (data) => [
      data.isMajor ? majorBorderClass : borderClass,
      data.isDisabled && neutralBgClass,
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
    listDayHeaderContent: (data) => !data.level ? (
      <Fragment>
        {data.textParts.map((textPart) => ( // primary
          textPart.type === 'day' ? (
            <div className={
              'flex flex-row items-center justify-center w-[2em] h-[2em] rounded-full' +
                (data.isToday
                  ? (' ' + (data.hasNavLink ? primaryPressableClass : primarySurfaceClass))
                  : (' ' + (data.hasNavLink ? transparentPressableClass : '')))
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

    nowIndicatorLineClass: `-m-px border-1 ${alertBorderColorClass}`,
    nowIndicatorDotClass: `rounded-full w-0 h-0 -mx-[6px] -my-[6px] border-6 ${alertBorderColorClass}`,

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

    resourceExpanderClass: (data) => [
      'self-center w-6 h-6 flex flex-row items-center justify-center rounded-full text-sm relative start-1',
      transparentPressableClass,
      data.isExpanded ? 'rotate-90' :
        data.direction === 'rtl' && 'rotate-180',
    ],
    resourceExpanderContent: () => svgIcons.chevronRight('w-[1.25em] h-[1.25em] opacity-65'),

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
          data.hasNavLink ? secondaryPressableClass : secondarySurfaceClass,
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
}) as PluginDef
