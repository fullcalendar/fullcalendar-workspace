import { joinClassNames, createPlugin, PluginDef, CalendarOptions, DayHeaderData, DayCellData } from '@fullcalendar/core'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import './global.css'

// ambient types (tsc strips during build because of {})
import {} from '@fullcalendar/timeline'
import {} from '@fullcalendar/resource-daygrid'
import {} from '@fullcalendar/resource-timegrid'
import {} from '@fullcalendar/resource-timeline'
import {} from '@fullcalendar/adaptive'
import {} from '@fullcalendar/scrollgrid'
import {} from '@fullcalendar/list'
import {} from '@fullcalendar/multimonth'

// usually 11px font / 12px line-height
const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

// outline
const outlineWidthClass = 'outline-2'
const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const primaryOutlineColorClass = 'outline-(--fc-breezy-primary)'
const primaryOutlineFocusClass = `${outlineWidthFocusClass} ${primaryOutlineColorClass}`

// neutral buttons
const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-breezy-strong),var(--fc-breezy-strong))_var(--fc-breezy-background)]',
  'hover:[background:linear-gradient(var(--fc-breezy-stronger),var(--fc-breezy-stronger))_var(--fc-breezy-background)]',
  'active:[background:linear-gradient(var(--fc-breezy-strongest),var(--fc-breezy-strongest))_var(--fc-breezy-background)]',
)
const mutedHoverClass = 'hover:bg-(--fc-breezy-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-breezy-muted)`
const faintHoverClass = 'hover:bg-(--fc-breezy-faint)'
const faintHoverPressableClass = `${faintHoverClass} active:bg-(--fc-breezy-muted) focus-visible:bg-(--fc-breezy-faint)`

// controls
const selectedClass = `bg-(--fc-breezy-selected) text-(--fc-breezy-strong-foreground) ${primaryOutlineFocusClass}`
const unselectedClass = `text-(--fc-breezy-muted-foreground) hover:text-(--fc-breezy-strong-foreground) ${primaryOutlineFocusClass}`

// primary
const primaryClass = 'bg-(--fc-breezy-primary) text-(--fc-breezy-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-breezy-primary-over)`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-(--fc-breezy-primary-over)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${primaryOutlineFocusClass} ${outlineOffsetClass}`

// secondary
const secondaryClass = 'text-(--fc-breezy-secondary-foreground) bg-(--fc-breezy-secondary)'
const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-breezy-secondary-over)`
const secondaryButtonClass = `${secondaryPressableClass} border-(--fc-breezy-secondary-border) ${primaryOutlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = 'size-5 text-(--fc-breezy-secondary-icon) group-hover:text-(--fc-breezy-secondary-icon-over) group-focus-visible:text-(--fc-breezy-secondary-icon-over)'

// event content
const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--fc-breezy-foreground))]'
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--fc-breezy-background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--fc-breezy-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-breezy-background))]',
)

// interactive neutral foregrounds
const mutedFgPressableGroupClass = 'text-(--fc-breezy-muted-foreground) group-hover:text-(--fc-breezy-foreground) group-focus-visible:text-(--fc-breezy-foreground)'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-(--fc-breezy-background) rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const getNormalDayHeaderBorderClass = (data: DayHeaderData) => joinClassNames(
  !data.inPopover && (
    data.isMajor ? 'border border-(--fc-breezy-strong-border)' :
      !data.isNarrow && 'border border-(--fc-breezy-border)'
  )
)

const getMutedDayHeaderBorderClass = (data: DayHeaderData) => joinClassNames(
  !data.inPopover && (
    data.isMajor ? 'border border-(--fc-breezy-strong-border)' :
      !data.isNarrow && 'border border-(--fc-breezy-muted-border)'
  )
)

const getNormalDayCellBorderColorClass = (data: DayCellData) => (
  data.isMajor ? 'border-(--fc-breezy-strong-border)' : 'border-(--fc-breezy-border)'
)

const getMutedDayCellBorderColorClass = (data: DayCellData) => (
  data.isMajor ? 'border-(--fc-breezy-strong-border)' : 'border-(--fc-breezy-muted-border)'
)

const tallDayCellBottomClass = 'min-h-3'
const getShortDayCellBottomClass = (data: DayCellData) => joinClassNames(
  !data.isNarrow && 'min-h-px'
)

const mutedHoverButtonClass = joinClassNames(
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => joinClassNames(
    'mb-px p-px',
    data.isNarrow
      ? 'mx-px rounded-sm'
      : 'mx-1 rounded-md',
    data.isSelected
      ? 'bg-(--fc-breezy-muted)'
      : data.isInteractive
        ? mutedHoverPressableClass
        : mutedHoverClass,
  ),
  listItemEventInnerClass: (data) => joinClassNames(
    'flex flex-row items-center justify-between',
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs',
  ),
  listItemEventTimeClass: (data) => joinClassNames(
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-(--fc-breezy-muted-foreground) order-1 whitespace-nowrap overflow-hidden shrink-1',
  ),

  listItemEventTitleClass: (data) => joinClassNames(
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-(--fc-breezy-strong-foreground) font-medium whitespace-nowrap overflow-hidden shrink-100',
    data.timeText && 'text-ellipsis',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => joinClassNames(
    data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
    data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
  ),
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => joinClassNames(
    'mb-px border',
    data.isNarrow
      ? 'mx-px border-(--fc-breezy-primary) rounded-sm'
      : 'self-start mx-1 border-transparent rounded-md',
    mutedHoverPressableClass,
  ),
  rowMoreLinkInnerClass: (data) => joinClassNames(
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--fc-breezy-strong-foreground)',
  ),
}

export default createPlugin({
  name: '@fullcalendar/theme-breezy',
  optionDefaults: {
    className: "bg-(--fc-breezy-background) border border-(--fc-breezy-border) rounded-lg overflow-hidden reset-root",

    /* Toolbar
    --------------------------------------------------------------------------------------------- */

    headerToolbarClass: "border-b border-(--fc-breezy-border)",
    footerToolbarClass: "border-t border-(--fc-breezy-border)",
    toolbarClass: "px-4 py-4 bg-(--fc-breezy-faint) flex flex-row flex-wrap items-center justify-between gap-4",
    toolbarSectionClass: "shrink-0 flex flex-row items-center gap-4",
    toolbarTitleClass: "text-lg font-semibold text-(--fc-breezy-strong-foreground)",
    buttonGroupClass: (data) => joinClassNames(
      'flex flex-row items-center',
      !data.isSelectGroup && 'rounded-md shadow-xs',
    ),
    buttonClass: (data) => joinClassNames(
      'group py-2 flex flex-row items-center text-sm button-reset',
      data.isIconOnly ? 'px-2' : 'px-3',
      data.inSelectGroup ? joinClassNames(
        'rounded-md font-medium',
        data.isSelected
          ? selectedClass
          : unselectedClass,
      ) : joinClassNames(
        'font-semibold',
        data.isPrimary
          ? primaryButtonClass
          : secondaryButtonClass,
        data.inGroup
          ? 'first:rounded-s-md first:border-s last:rounded-e-md last:border-e border-y'
          : 'rounded-md shadow-xs border',
      ),
    ),
    buttons: {
      prev: {
        iconContent: () => chevronDown(
          joinClassNames(secondaryButtonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
        ),
      },
      next: {
        iconContent: () => chevronDown(
          joinClassNames(secondaryButtonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
        ),
      },
      prevYear: {
        iconContent: () => chevronDoubleLeft(
          joinClassNames(secondaryButtonIconClass, '[[dir=rtl]_&]:rotate-180'),
        )
      },
      nextYear: {
        iconContent: () => chevronDoubleLeft(
          joinClassNames(secondaryButtonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
        )
      },
    },

    /* Abstract Event
    --------------------------------------------------------------------------------------------- */

    eventShortHeight: 50,
    eventColor: "var(--fc-breezy-event)",
    eventClass: (data) => joinClassNames(
      data.isSelected
        ? joinClassNames(outlineWidthClass, data.isDragging && 'shadow-md')
        : outlineWidthFocusClass,
      primaryOutlineColorClass,
    ),

    /* Background Event
    --------------------------------------------------------------------------------------------- */

    backgroundEventColor: 'var(--fc-breezy-background-event)',
    backgroundEventClass: 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]',
    backgroundEventTitleClass: (data) => joinClassNames(
      'opacity-50 italic',
      data.isNarrow
        ? `p-1 ${xxsTextClass}`
        : 'p-2 text-xs',
      'text-(--fc-breezy-foreground)',
    ),

    /* Block Event
    --------------------------------------------------------------------------------------------- */

    blockEventClass: (data) => joinClassNames(
      'group relative print:bg-white border-transparent print:border-(--fc-event-color)',
      data.isInteractive ? eventFaintPressableClass : eventFaintBgClass,
      (data.isDragging && !data.isSelected) && 'opacity-75',
    ),
    blockEventInnerClass: eventMutedFgClass,
    blockEventTimeClass: "whitespace-nowrap overflow-hidden shrink-1",
    blockEventTitleClass: "whitespace-nowrap overflow-hidden shrink-100",

    /* Row Event
    --------------------------------------------------------------------------------------------- */

    rowEventClass: (data) => joinClassNames(
      'mb-px border-y',
      data.isStart && joinClassNames('border-s', data.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
      data.isEnd && joinClassNames('border-e', data.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
    ),
    rowEventBeforeClass: (data) => joinClassNames(
      data.isStartResizable && joinClassNames(
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-start-1',
      )
    ),
    rowEventAfterClass: (data) => joinClassNames(
      data.isEndResizable && joinClassNames(
        data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
        '-end-1',
      )
    ),
    rowEventInnerClass: (data) => joinClassNames(
      'flex flex-row items-center',
      data.isNarrow ? xxsTextClass : 'text-xs',
    ),
    rowEventTimeClass: (data) => joinClassNames(
      data.isNarrow ? 'ps-0.5' : 'ps-1',
      'font-medium',
    ),
    rowEventTitleClass: (data) => (
      data.isNarrow ? 'px-0.5' : 'px-1'
    ),

    /* Column Event
    --------------------------------------------------------------------------------------------- */

    columnEventClass: (data) => joinClassNames(
      'border-x ring ring-(--fc-breezy-background)',
      data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-1'),
      data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-1'),
    ),
    columnEventBeforeClass: (data) => joinClassNames(
      data.isStartResizable && joinClassNames(
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-top-1',
      )
    ),
    columnEventAfterClass: (data) => joinClassNames(
      data.isEndResizable && joinClassNames(
        data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
        '-bottom-1',
      )
    ),
    columnEventInnerClass: (data) => joinClassNames(
      'flex',
      data.isShort
        ? 'flex-row items-center gap-1 p-1'
        : joinClassNames(
            'flex-col',
            data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
          ),
      (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
    ),
    columnEventTimeClass: (data) => (
      !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
    ),
    columnEventTitleClass: (data) => joinClassNames(
      !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
      'font-semibold',
    ),

    /* More-Link
    --------------------------------------------------------------------------------------------- */

    moreLinkClass: `${outlineWidthFocusClass} ${primaryOutlineColorClass}`,
    moreLinkInnerClass: "whitespace-nowrap overflow-hidden",
    columnMoreLinkClass: (data) => joinClassNames(
      data.isNarrow ? 'my-px' : 'my-1',
      `border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white ring ring-(--fc-breezy-background)`,
    ),
    columnMoreLinkInnerClass: (data) => joinClassNames(
      data.isNarrow
        ? `p-0.5 ${xxsTextClass}`
        : 'p-1 text-xs',
      'text-(--fc-breezy-foreground)',
    ),

    /* Day Header
    --------------------------------------------------------------------------------------------- */

    dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
    dayHeaderClass: (data) => joinClassNames(
      'justify-center',
      data.inPopover && 'border-b border-(--fc-breezy-border) bg-(--fc-breezy-faint)',
    ),
    dayHeaderInnerClass: (data) => joinClassNames(
      'flex flex-row items-center',
      (!data.dayNumberText && !data.inPopover)
        ? joinClassNames(
            'py-1 rounded-sm text-xs',
            data.isNarrow
              ? 'px-1 m-1 text-(--fc-breezy-muted-foreground)'
              : 'px-1.5 m-2 font-semibold text-(--fc-breezy-foreground)',
            data.hasNavLink && mutedHoverButtonClass,
          )
        : (data.isToday && data.dayNumberText && !data.inPopover)
            ? joinClassNames(
                'group m-2 outline-none',
                data.isNarrow ? 'h-6' : 'h-8',
              )
            : joinClassNames(
                'rounded-sm',
                data.inPopover
                  ? 'm-2 px-1 py-0.5'
                  : joinClassNames(
                      'mx-2 h-6 px-1.5',
                      data.isNarrow ? 'my-2' : 'my-3',
                    ),
                data.hasNavLink && mutedHoverButtonClass,
              ),
    ),
    dayHeaderContent: (data) => (
      (!data.dayNumberText && !data.inPopover) ? (
        <Fragment>{data.text}</Fragment>
      ) : (
        <Fragment>
          {data.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                data.isNarrow ? 'text-xs' : 'text-sm',
                textPart.type === 'day'
                  ? joinClassNames(
                      'flex flex-row items-center',
                      !data.isNarrow && 'font-semibold',
                      (data.isToday && !data.inPopover)
                        ? joinClassNames(
                            'mx-0.5 rounded-full justify-center',
                            data.isNarrow ? 'size-6' : 'size-8',
                            data.hasNavLink
                              ? `${primaryPressableGroupClass} ${outlineWidthGroupFocusClass} ${outlineOffsetClass} ${primaryOutlineColorClass}`
                              : primaryClass,
                          )
                        : 'text-(--fc-breezy-strong-foreground)',
                    )
                  : 'text-(--fc-breezy-muted-foreground)',
              )}
            >{textPart.value}</span>
          ))}
        </Fragment>
      )
    ),

    /* Day Cell
    --------------------------------------------------------------------------------------------- */

    dayCellClass: (data) => joinClassNames(
      'border',
      ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-(--fc-breezy-faint)',
    ),
    dayCellTopClass: (data) => joinClassNames(
      data.isNarrow ? 'min-h-0.5' : 'min-h-1',
      'flex flex-row',
    ),
    dayCellTopInnerClass: (data) => joinClassNames(
      'flex flex-row items-center justify-center whitespace-nowrap',
      data.isNarrow
        ? `my-px h-5 ${xxsTextClass}`
        : 'my-1 h-6 text-xs',
      data.isToday
        ? joinClassNames(
            'rounded-full font-semibold',
            data.isNarrow ? 'ms-px' : 'ms-1',
            data.text === data.dayNumberText
              ? (data.isNarrow ? 'w-5' : 'w-6')
              : (data.isNarrow ? 'px-1' : 'px-2'),
            data.hasNavLink
              ? `${primaryPressableClass} ${outlineOffsetClass}`
              : primaryClass,
          )
        : joinClassNames(
            'rounded-e-sm',
            data.isNarrow ? 'px-1' : 'px-2',
            data.hasNavLink && mutedHoverPressableClass,
            data.isOther
              ? 'text-(--fc-breezy-faint-foreground)'
              : (data.monthText ? 'text-(--fc-breezy-foreground)' : 'text-(--fc-breezy-muted-foreground)'),
            data.monthText && 'font-bold',
          ),
    ),
    dayCellInnerClass: (data) => joinClassNames(data.inPopover && 'p-2'),

    /* Popover
    --------------------------------------------------------------------------------------------- */

    popoverClass: "bg-(--fc-breezy-popover) border border-(--fc-breezy-popover-border) rounded-lg overflow-hidden shadow-lg m-1 min-w-55 reset-root",
    popoverCloseClass: `group absolute top-2 end-2 p-0.5 rounded-sm ${mutedHoverButtonClass} button-reset`,
    popoverCloseContent: () => x(`size-5 ${mutedFgPressableGroupClass}`),

    /* Lane
    --------------------------------------------------------------------------------------------- */

    dayLaneClass: (data) => joinClassNames(
      'border',
      data.isMajor ? 'border-(--fc-breezy-strong-border)' : 'border-(--fc-breezy-muted-border)',
      data.isDisabled && 'bg-(--fc-breezy-faint)',
    ),
    dayLaneInnerClass: (data) => (
      data.isStack
        ? 'm-1'
        : data.isNarrow ? 'mx-px' : 'mx-1'
    ),
    slotLaneClass: (data) => joinClassNames(
      'border border-(--fc-breezy-muted-border)',
      data.isMinor && 'border-dotted',
    ),

    /* List Day
    --------------------------------------------------------------------------------------------- */

    listDaysClass: "my-10 mx-auto w-full max-w-218 px-4",
    listDayClass: "not-last:border-b border-(--fc-breezy-muted-border) flex flex-row items-start gap-2",
    listDayHeaderClass: "my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start",
    listDayHeaderInnerClass: (data) => joinClassNames(
      'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
      !data.level
        ? joinClassNames(
            data.isToday
              ? joinClassNames(
                  'font-semibold',
                  data.hasNavLink ? primaryPressableClass : primaryClass,
                )
              : joinClassNames(
                  'font-medium text-(--fc-breezy-strong-foreground)',
                  data.hasNavLink && mutedHoverPressableClass,
                ),
          )
        : joinClassNames(
            'text-(--fc-breezy-faint-foreground)',
            data.hasNavLink && `${mutedHoverPressableClass} hover:text-(--fc-breezy-muted-foreground)`,
          ),
    ),
    listDayEventsClass: "my-4 grow min-w-0 border border-(--fc-breezy-border) rounded-md",

    /* Single Month (in Multi-Month)
    --------------------------------------------------------------------------------------------- */

    singleMonthClass: "m-4",
    singleMonthHeaderClass: (data) => joinClassNames(
      data.isSticky && 'bg-(--fc-breezy-background) border-b border-(--fc-breezy-border)',
      data.colCount > 1 ? 'pb-1' : 'py-1',
      'items-center',
    ),
    singleMonthHeaderInnerClass: (data) => joinClassNames(
      'py-1 px-2 rounded-md text-sm text-(--fc-breezy-strong-foreground) font-semibold',
      data.hasNavLink && mutedHoverPressableClass,
    ),

    /* Misc Table
    --------------------------------------------------------------------------------------------- */

    fillerClass: "border border-(--fc-breezy-muted-border)",
    dayNarrowWidth: 100,
    dayHeaderRowClass: "border border-(--fc-breezy-muted-border)",
    dayRowClass: "border border-(--fc-breezy-border)",
    slotHeaderRowClass: "border border-(--fc-breezy-border)",
    slotHeaderInnerClass: "text-(--fc-breezy-faint-foreground) uppercase",

    /* Misc Content
    --------------------------------------------------------------------------------------------- */

    navLinkClass: `${outlineWidthFocusClass} ${primaryOutlineColorClass}`,
    inlineWeekNumberClass: (data) => joinClassNames(
      'absolute top-0 end-0 bg-(--fc-breezy-background) text-(--fc-breezy-muted-foreground) whitespace-nowrap rounded-es-md border-b border-b-(--fc-breezy-strong-border) border-s border-s-(--fc-breezy-border)',
      data.isNarrow
        ? `p-0.5 ${xxsTextClass}`
        : 'p-1.5 text-xs',
      data.hasNavLink
        ? `${mutedHoverPressableClass} -outline-offset-1`
        : mutedHoverClass,
    ),
    highlightClass: "bg-(--fc-breezy-highlight)",
    nonBusinessClass: "bg-(--fc-breezy-faint)",
    nowIndicatorLineClass: "-m-px border-1 border-(--fc-breezy-now)",
    nowIndicatorDotClass: "-m-[6px] border-6 border-(--fc-breezy-now) size-0 rounded-full ring-2 ring-(--fc-breezy-background)",

    /* Resource Day Header
    --------------------------------------------------------------------------------------------- */

    resourceDayHeaderAlign: "center",
    resourceDayHeaderClass: "border",
    resourceDayHeaderInnerClass: (data) => joinClassNames(
      'p-2 text-(--fc-breezy-foreground) font-semibold',
      data.isNarrow ? 'text-xs' : 'text-sm',
    ),

    /* Resource Data Grid
    --------------------------------------------------------------------------------------------- */

    resourceColumnHeaderClass: "border border-(--fc-breezy-muted-border) justify-center",
    resourceColumnHeaderInnerClass: "p-2 text-(--fc-breezy-foreground) text-sm",
    resourceColumnResizerClass: "absolute inset-y-0 w-[5px] end-[-3px]",
    resourceGroupHeaderClass: "border border-(--fc-breezy-border) bg-(--fc-breezy-muted)",
    resourceGroupHeaderInnerClass: "p-2 text-(--fc-breezy-foreground) text-sm",
    resourceCellClass: "border border-(--fc-breezy-muted-border)",
    resourceCellInnerClass: "p-2 text-(--fc-breezy-foreground) text-sm",
    resourceIndentClass: "ms-1 -me-1.5 justify-center",
    resourceExpanderClass: `group p-0.5 rounded-full ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`,
    resourceExpanderContent: (data) => chevronDown(
      joinClassNames(
        `size-5 ${mutedFgPressableGroupClass}`,
        !data.isExpanded && '-rotate-90 [[dir=rtl]_&]:rotate-90',
      )
    ),
    resourceHeaderRowClass: "border border-(--fc-breezy-border)",
    resourceRowClass: "border border-(--fc-breezy-border)",
    resourceColumnDividerClass: "border-e border-(--fc-breezy-strong-border)",

    /* Timeline Lane
    --------------------------------------------------------------------------------------------- */

    resourceGroupLaneClass: "border border-(--fc-breezy-border) bg-(--fc-breezy-muted)",
    resourceLaneClass: "border border-(--fc-breezy-border)",
    resourceLaneBottomClass: (data) => joinClassNames(data.options.eventOverlap && 'h-2'),
    timelineBottomClass: "h-2",
  },
  views: {
    dayGrid: {
      ...dayRowCommonClasses,
      dayHeaderClass: getNormalDayHeaderBorderClass,
      dayHeaderDividerClass: 'border-b border-(--fc-breezy-strong-border)',
      dayCellClass: getNormalDayCellBorderColorClass,
      dayCellBottomClass: getShortDayCellBottomClass,
      backgroundEventInnerClass: 'flex flex-row justify-end',
    },
    multiMonth: {
      ...dayRowCommonClasses,
      dayHeaderClass: getNormalDayHeaderBorderClass,
      dayHeaderDividerClass: (data) => data.isSticky && 'border-b border-(--fc-breezy-strong-border) shadow-sm',
      dayCellClass: getNormalDayCellBorderColorClass,
      dayCellBottomClass: getShortDayCellBottomClass,
      tableHeaderClass: (data) => data.isSticky && 'bg-(--fc-breezy-background)',
      tableBodyClass: 'border border-(--fc-breezy-border) rounded-md shadow-xs overflow-hidden',
    },
    timeGrid: {
      ...dayRowCommonClasses,
      dayHeaderClass: getMutedDayHeaderBorderClass,
      dayHeaderDividerClass: (data) => joinClassNames(
        'border-b',
        data.options.allDaySlot
          ? 'border-(--fc-breezy-border)'
          : 'border-(--fc-breezy-strong-border) shadow-sm',
      ),
      dayCellClass: getMutedDayCellBorderColorClass,
      dayCellBottomClass: tallDayCellBottomClass,

      /* TimeGrid > Week Number Header
      ------------------------------------------------------------------------------------------- */

      weekNumberHeaderClass: 'items-center justify-end',
      weekNumberHeaderInnerClass: (data) => joinClassNames(
        'm-1.5 h-6 px-1.5 text-(--fc-breezy-muted-foreground) rounded-sm flex flex-row items-center',
        data.hasNavLink && mutedHoverPressableClass,
        data.isNarrow ? 'text-xs' : 'text-sm',
      ),

      /* TimeGrid > All-Day Header
      ------------------------------------------------------------------------------------------- */

      allDayHeaderClass: 'items-center',
      allDayHeaderInnerClass: (data) => joinClassNames(
        'p-3 text-(--fc-breezy-faint-foreground)',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ),
      allDayDividerClass: 'border-b border-(--fc-breezy-strong-border) shadow-sm',

      /* TimeGrid > Slot Header
      ------------------------------------------------------------------------------------------- */

      slotHeaderClass: 'justify-end',
      slotHeaderInnerClass: (data) => joinClassNames(
        'relative px-3 py-2',
        data.isNarrow
          ? `-top-3.5 ${xxsTextClass}`
          : '-top-4 text-xs',
        data.isFirst && 'hidden',
      ),
      slotHeaderDividerClass: 'border-e border-(--fc-breezy-muted-border)',
    },
    list: {

      /* List-View > List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass: (data) => joinClassNames(
        'group not-last:border-b border-(--fc-breezy-muted-border) p-4 items-center gap-3',
        data.isInteractive
          ? faintHoverPressableClass
          : faintHoverClass,
      ),
      listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full',
      listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',
      listItemEventTimeClass: 'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-(--fc-breezy-muted-foreground)',
      listItemEventTitleClass: (data) => joinClassNames(
        'grow min-w-0 font-medium whitespace-nowrap overflow-hidden text-(--fc-breezy-foreground)',
        data.event.url && 'group-hover:underline',
      ),

      /* No-Events Screen
      ------------------------------------------------------------------------------------------- */

      noEventsClass: 'grow flex flex-col items-center justify-center',
      noEventsInnerClass: 'py-15',
    },
    resourceDayGrid: {
      resourceDayHeaderClass: (data) => (
        data.isMajor
          ? 'border-(--fc-breezy-strong-border)'
          : 'border-(--fc-breezy-border)'
      ),
    },
    resourceTimeGrid: {
      resourceDayHeaderClass: (data) => (
        data.isMajor
          ? 'border-(--fc-breezy-strong-border)'
          : 'border-(--fc-breezy-muted-border)'
      ),
    },
    timeline: {

      /* Timeline > Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass: (data) => data.isEnd && 'me-px',
      rowEventInnerClass: (data) => data.options.eventOverlap ? 'py-1' : 'py-2',

      /* Timeline > More-Link
      ------------------------------------------------------------------------------------------- */

      rowMoreLinkClass: `me-px mb-px border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white`,
      rowMoreLinkInnerClass: 'p-1 text-(--fc-breezy-foreground) text-xs',

      /* Timeline > Slot Header
      ------------------------------------------------------------------------------------------- */

      slotHeaderAlign: (data) => data.isTime ? 'start' : 'center',
      slotHeaderClass: (data) => joinClassNames(
        data.level > 0 && 'border border-(--fc-breezy-muted-border)',
        'justify-end',
      ),
      slotHeaderInnerClass: (data) => joinClassNames(
        'px-3 py-2 text-xs',
        data.isTime && joinClassNames(
          'relative -start-4',
          data.isFirst && 'hidden',
        ),
        data.hasNavLink && 'hover:underline',
      ),
      slotHeaderDividerClass: 'border-b border-(--fc-breezy-strong-border) shadow-sm',
    },
  },
}) as PluginDef

/* SVGs
------------------------------------------------------------------------------------------------- */

function chevronDown(className?: string) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
}

function chevronDoubleLeft(className?: string) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L6.31 10l3.72-3.72a.75.75 0 1 0-1.06-1.06L4.72 9.47Zm9.25-4.25L9.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L11.31 10l3.72-3.72a.75.75 0 0 0-1.06-1.06Z" clip-rule="evenodd" /></svg>
}

function x(className?: string) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
}
