import React from 'react'
import { CalendarOptions, DayCellData, DayHeaderData } from '@fullcalendar/core'
import { joinClassNames } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'

const eventCalendarPlugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

// usually 11px font / 12px line-height
const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

// outline
const outlineWidthClass = 'outline-2'
export const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
export const primaryOutlineColorClass = 'outline-(--fc-breezy-primary)'
const primaryOutlineFocusClass = `${outlineWidthFocusClass} ${primaryOutlineColorClass}`

// neutral buttons
export const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-breezy-strong),var(--fc-breezy-strong))_var(--fc-breezy-background)]',
  'hover:[background:linear-gradient(var(--fc-breezy-stronger),var(--fc-breezy-stronger))_var(--fc-breezy-background)]',
  'active:[background:linear-gradient(var(--fc-breezy-strongest),var(--fc-breezy-strongest))_var(--fc-breezy-background)]',
)
const mutedHoverClass = 'hover:bg-(--fc-breezy-muted)'
export const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-breezy-muted)`
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
export const mutedFgPressableGroupClass = 'text-(--fc-breezy-muted-foreground) group-hover:text-(--fc-breezy-foreground) group-focus-visible:text-(--fc-breezy-foreground)'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-(--fc-breezy-background) rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const getNormalDayHeaderBorderClass = (data: DayHeaderData) => (
  !data.inPopover && (
    data.isMajor ? 'border border-(--fc-breezy-strong-border)' :
      !data.isNarrow && 'border border-(--fc-breezy-border)'
  )
)

const getMutedDayHeaderBorderClass = (data: DayHeaderData) => (
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
const getShortDayCellBottomClass = (data: DayCellData) => (
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

  listItemEventClass: (data) => [
    'mb-px p-px',
    data.isNarrow
      ? 'mx-px rounded-sm'
      : 'mx-1 rounded-md',
    data.isSelected
      ? 'bg-(--fc-breezy-muted)'
      : data.isInteractive
        ? mutedHoverPressableClass
        : mutedHoverClass,
  ],
  listItemEventInnerClass: (data) => [
    'flex flex-row items-center justify-between',
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs',
  ],
  listItemEventTimeClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-(--fc-breezy-muted-foreground) order-1 whitespace-nowrap overflow-hidden shrink-1',
  ],

  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-(--fc-breezy-strong-foreground) font-medium whitespace-nowrap overflow-hidden shrink-100',
    data.timeText && 'text-ellipsis',
  ],

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
    data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
  ],
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border',
    data.isNarrow
      ? 'mx-px border-(--fc-breezy-primary) rounded-sm'
      : 'self-start mx-1 border-transparent rounded-md',
    mutedHoverPressableClass,
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--fc-breezy-strong-foreground)',
  ],
}

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  plugins: userPlugins,
  buttons: userButtons,
  views: userViews,
  ...restOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      plugins={[
        ...eventCalendarPlugins,
        ...(userPlugins || []),
      ]}
      initialView={availableViews[0]}
      className="bg-(--fc-breezy-background) border border-(--fc-breezy-border) rounded-lg overflow-hidden"

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'prev,today,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      headerToolbarClass="border-b border-(--fc-breezy-border)"
      footerToolbarClass="border-t border-(--fc-breezy-border)"
      toolbarClass="px-4 py-4 bg-(--fc-breezy-faint) flex flex-row flex-wrap items-center justify-between gap-4"
      toolbarSectionClass="shrink-0 flex flex-row items-center gap-4"
      toolbarTitleClass="text-lg font-semibold text-(--fc-breezy-strong-foreground)"
      buttonGroupClass={(data) => [
        'flex flex-row items-center',
        !data.isSelectGroup && 'rounded-md shadow-xs',
      ]}
      buttonClass={(data) => [
        'group py-2 flex flex-row items-center text-sm',
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
      ]}
      buttons={{
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
        ...userButtons,
        add: {
          isPrimary: true,
          ...addButton,
        },
      }}

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--fc-breezy-event)"
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(outlineWidthClass, data.isDragging && 'shadow-md')
          : outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor='var(--fc-breezy-background-event)'
      backgroundEventClass='bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]'
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        'text-(--fc-breezy-foreground)',
      ]}

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative print:bg-white border-transparent print:border-(--fc-event-color)',
        data.isInteractive ? eventFaintPressableClass : eventFaintBgClass,
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ]}
      blockEventInnerClass={eventMutedFgClass}
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && joinClassNames('border-s', data.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
        data.isEnd && joinClassNames('border-e', data.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
      ]}
      rowEventBeforeClass={(data) => (
        data.isStartResizable && [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ]
      )}
      rowEventAfterClass={(data) => (
        data.isEndResizable && [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ]
      )}
      rowEventInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ]}
      rowEventTimeClass={(data) => [
        data.isNarrow ? 'ps-0.5' : 'ps-1',
        'font-medium',
      ]}
      rowEventTitleClass={(data) => (
        data.isNarrow ? 'px-0.5' : 'px-1'
      )}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => [
        'border-x ring ring-(--fc-breezy-background)',
        data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-1'),
        data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-1'),
      ]}
      columnEventBeforeClass={(data) => (
        data.isStartResizable && [
          data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        ]
      )}
      columnEventAfterClass={(data) => (
        data.isEndResizable && [
          data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        ]
      )}
      columnEventInnerClass={(data) => [
        'flex',
        data.isShort
          ? 'flex-row items-center gap-1 p-1'
          : joinClassNames(
              'flex-col',
              data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ]}
      columnEventTimeClass={(data) => (
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-semibold',
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={(data) => [
        data.isNarrow ? 'my-px' : 'my-1',
        `border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white ring ring-(--fc-breezy-background)`,
      ]}
      columnMoreLinkInnerClass={(data) => [
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        'text-(--fc-breezy-foreground)',
      ]}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}
      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover && 'border-b border-(--fc-breezy-border) bg-(--fc-breezy-faint)',
      ]}
      dayHeaderInnerClass={(data) => [
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
      ]}
      dayHeaderContent={(data) => (
        (!data.dayNumberText && !data.inPopover) ? (
          <>{data.text}</>
        ) : (
          <>
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
          </>
        )
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-(--fc-breezy-faint)',
      ]}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row',
      ]}
      dayCellTopInnerClass={(data) => [
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
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="bg-(--fc-breezy-popover) border border-(--fc-breezy-popover-border) rounded-lg overflow-hidden shadow-lg m-1 min-w-55"
      popoverCloseClass={`group absolute top-2 end-2 p-0.5 rounded-sm ${mutedHoverButtonClass}`}
      popoverCloseContent={() => x(`size-5 ${mutedFgPressableGroupClass}`)}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-breezy-strong-border)' : 'border-(--fc-breezy-muted-border)',
        data.isDisabled && 'bg-(--fc-breezy-faint)',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'mx-1'
      )}
      slotLaneClass={(data) => [
        'border border-(--fc-breezy-muted-border)',
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDaysClass="my-10 mx-auto w-full max-w-218 px-4"
      listDayClass="not-last:border-b border-(--fc-breezy-muted-border) flex flex-row items-start gap-2"
      listDayHeaderClass="my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start"
      listDayHeaderInnerClass={(data) => [
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
      ]}
      listDayEventsClass="my-4 grow min-w-0 border border-(--fc-breezy-border) rounded-md"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'bg-(--fc-breezy-background) border-b border-(--fc-breezy-border)',
        data.colCount > 1 ? 'pb-1' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'py-1 px-2 rounded-md text-sm font-semibold text-(--fc-breezy-strong-foreground)',
        data.hasNavLink && mutedHoverPressableClass,
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      fillerClass="border border-(--fc-breezy-muted-border)"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--fc-breezy-muted-border)"
      dayRowClass="border border-(--fc-breezy-border)"
      slotHeaderRowClass="border border-(--fc-breezy-border)"
      slotHeaderInnerClass="text-(--fc-breezy-faint-foreground) uppercase"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      inlineWeekNumberClass={(data) => [
        'absolute top-0 end-0 bg-(--fc-breezy-background) text-(--fc-breezy-muted-foreground) whitespace-nowrap rounded-es-md border-b border-b-(--fc-breezy-strong-border) border-s border-s-(--fc-breezy-border)',
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        data.hasNavLink
          ? `${mutedHoverPressableClass} -outline-offset-1`
          : mutedHoverClass,
      ]}
      highlightClass="bg-(--fc-breezy-highlight)"
      nonBusinessClass="bg-(--fc-breezy-faint)"
      nowIndicatorLineClass="-m-px border-1 border-(--fc-breezy-now)"
      nowIndicatorDotClass="-m-[6px] border-6 border-(--fc-breezy-now) size-0 rounded-full ring-2 ring-(--fc-breezy-background)"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getNormalDayHeaderBorderClass,
          dayHeaderDividerClass: 'border-b border-(--fc-breezy-strong-border)',
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          backgroundEventInnerClass: 'flex flex-row justify-end',
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderClass: getNormalDayHeaderBorderClass,
          dayHeaderDividerClass: (data) => data.isSticky && 'border-b border-(--fc-breezy-strong-border) shadow-sm',
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableHeaderClass: (data) => data.isSticky && 'bg-(--fc-breezy-background)',
          tableBodyClass: 'border border-(--fc-breezy-border) rounded-md shadow-xs overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getMutedDayHeaderBorderClass,
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? 'border-(--fc-breezy-border)'
              : 'border-(--fc-breezy-strong-border) shadow-sm',
          ],
          dayCellClass: getMutedDayCellBorderColorClass,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'm-1.5 h-6 px-1.5 text-(--fc-breezy-muted-foreground) rounded-sm flex flex-row items-center',
            data.hasNavLink && mutedHoverPressableClass,
            data.isNarrow ? 'text-xs' : 'text-sm',
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => [
            'p-3 text-(--fc-breezy-faint-foreground)',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: 'border-b border-(--fc-breezy-strong-border) shadow-sm',

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'relative px-3 py-2',
            data.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            data.isFirst && 'hidden',
          ],
          slotHeaderDividerClass: 'border-e border-(--fc-breezy-muted-border)',

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            'group not-last:border-b border-(--fc-breezy-muted-border) p-4 items-center gap-3',
            data.isInteractive
              ? faintHoverPressableClass
              : faintHoverClass,
          ],
          listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full',
          listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-(--fc-breezy-muted-foreground)',
          listItemEventTitleClass: (data) => [
            'grow min-w-0 font-medium whitespace-nowrap overflow-hidden text-(--fc-breezy-foreground)',
            data.event.url && 'group-hover:underline',
          ],

          /* No-Events Screen
          --------------------------------------------------------------------------------------- */

          noEventsClass: 'grow flex flex-col items-center justify-center',
          noEventsInnerClass: 'py-15',

          ...userViews?.list,
        },
      }}

      {...restOptions}
    />
  )
}

/* SVGs
------------------------------------------------------------------------------------------------- */

export function chevronDown(className?: string) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
}

function chevronDoubleLeft(className?: string) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L6.31 10l3.72-3.72a.75.75 0 1 0-1.06-1.06L4.72 9.47Zm9.25-4.25L9.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L11.31 10l3.72-3.72a.75.75 0 0 0-1.06-1.06Z" clip-rule="evenodd" /></svg>
}

function x(className?: string) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
}
