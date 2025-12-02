import React from 'react'
import { CalendarOptions, DayCellData, DayHeaderData } from '@fullcalendar/core'
import { joinClassNames } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

const eventCalendarPlugins = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
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
const outlineInsetClass = '-outline-offset-2'
export const tertiaryOutlineColorClass = 'outline-(--fc-pulse-tertiary)'
const tertiaryOutlineFocusClass = `${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`

// shadows
const smallBoxShadowClass = '[box-shadow:0_1px_2px_rgba(0,0,0,0.1)]'
const largeBoxShadowClass = '[box-shadow:0_1px_3px_rgba(0,0,0,0.2)]'

// neutral buttons
export const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-pulse-strong),var(--fc-pulse-strong))_var(--fc-pulse-background)]',
  'hover:[background:linear-gradient(var(--fc-pulse-stronger),var(--fc-pulse-stronger))_var(--fc-pulse-background)]',
  'active:[background:linear-gradient(var(--fc-pulse-strongest),var(--fc-pulse-strongest))_var(--fc-pulse-background)]',
)
const mutedHoverClass = 'hover:bg-(--fc-pulse-muted)'
export const mutedHoverPressableClass = `${mutedHoverClass} active:bg-(--fc-pulse-strong) focus-visible:bg-(--fc-pulse-muted)`
const faintHoverClass = 'hover:bg-(--fc-pulse-faint)'
const faintHoverPressableClass = `${faintHoverClass} active:bg-(--fc-pulse-muted) focus-visible:bg-(--fc-pulse-faint)`

// controls
const selectedButtonClass = `bg-(--fc-pulse-selected) text-(--fc-pulse-selected-foreground) ${largeBoxShadowClass} ${tertiaryOutlineFocusClass}`
const unselectedButtonClass = `text-(--fc-pulse-unselected-foreground) ${mutedHoverPressableClass} ${tertiaryOutlineFocusClass}`

// primary *toolbar button*
const primaryClass = 'bg-(--fc-pulse-primary) text-(--fc-pulse-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-pulse-primary-over) active:bg-(--fc-pulse-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border-transparent ${tertiaryOutlineFocusClass} ${outlineOffsetClass}`

// secondary *toolbar button*
const secondaryPressableClass = 'text-(--fc-pulse-secondary-foreground) hover:bg-(--fc-pulse-secondary-over) focus-visible:bg-(--fc-pulse-secondary-over) active:bg-(--fc-pulse-secondary-down)'
const secondaryButtonClass = `${secondaryPressableClass} ${tertiaryOutlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = 'size-5 text-(--fc-pulse-secondary-icon) group-hover:text-(--fc-pulse-secondary-icon-over) group-focus-visible:text-(--fc-pulse-secondary-icon-over)'

// tertiary
const tertiaryClass = 'bg-(--fc-pulse-tertiary) text-(--fc-pulse-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-pulse-tertiary-over) active:bg-(--fc-pulse-tertiary-down) focus-visible:bg-(--fc-pulse-tertiary-over)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-pulse-tertiary-over) group-active:bg-(--fc-pulse-tertiary-down) group-focus-visible:bg-(--fc-pulse-tertiary-over)`

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-(--fc-pulse-muted-foreground) group-hover:text-(--fc-pulse-foreground) group-focus-visible:text-(--fc-pulse-foreground)'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-(--fc-pulse-background) rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-3'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-0.5'
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  --------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-0.5' : 'mx-1',
    data.isSelected
      ? 'bg-(--fc-pulse-muted)'
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
    'order-1 whitespace-nowrap overflow-hidden shrink-1',
  ],

  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'font-medium whitespace-nowrap overflow-hidden shrink-100',
    data.timeText && 'text-ellipsis',
  ],

  /* Day Row > Row Event
  --------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
    data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
  ],

  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  --------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? `mx-0.5 border-(--fc-pulse-primary) ${mutedHoverPressableClass}`
      : 'self-start mx-1 border-transparent bg-(--fc-pulse-muted) hover:bg-(--fc-pulse-strong) active:bg-(--fc-pulse-stronger)',
  ],

  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--fc-pulse-foreground)',
  ],
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
      className="gap-6"

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--fc-pulse-event)"
      eventContrastColor="var(--fc-pulse-event-contrast)"
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging && 'shadow-lg',
            )
          : outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--fc-pulse-background-event)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]"
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        (data.isNarrow || data.isShort)
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        'text-(--fc-pulse-foreground)',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventTitleClass="text-(--fc-pulse-foreground)"
      listItemEventTimeClass="text-(--fc-pulse-muted-foreground)"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ]}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && 'rounded-s-sm border-s',
        data.isEnd && 'rounded-e-sm border-e',
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
      rowEventTimeClass={(data) => (
        data.isNarrow ? 'ps-0.5' : 'ps-1'
      )}
      rowEventTitleClass={(data) => [
        data.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      ]}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => [
        'border-x ring ring-(--fc-pulse-background)',
        data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-0.5'),
        data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-0.5'),
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
        (data.isNarrow || data.isShort) ? xxsTextClass : 'text-xs',
      ]}
      columnEventTimeClass={(data) => (
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={[
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={[
        'my-0.5 border border-transparent print:border-black rounded-md',
        `${strongSolidPressableClass} print:bg-white`,
        'ring ring-(--fc-pulse-background)',
      ]}
      columnMoreLinkInnerClass={(data) => [
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        'text-(--fc-pulse-foreground)',
      ]}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover ? 'border-b border-(--fc-pulse-border) bg-(--fc-pulse-faint)' :
          data.isMajor && 'border border-(--fc-pulse-strong-border)',
      ]}
      dayHeaderInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow ? 'text-xs' : 'text-sm',
        data.inPopover ? joinClassNames(
          'm-1.5 px-1 py-0.5 rounded-sm font-semibold',
          'text-(--fc-pulse-foreground)',
          data.hasNavLink && mutedHoverPressableClass,
        ) : !data.dayNumberText ? joinClassNames(
          'mx-0.5 my-1.5 py-0.5 px-1.5 rounded-sm',
          'text-(--fc-pulse-muted-foreground)',
          data.hasNavLink && mutedHoverPressableClass,
        ) : !data.isToday ? joinClassNames(
          'mx-2 my-2.5 h-6 px-1.5 rounded-sm',
          'text-(--fc-pulse-muted-foreground)',
          data.hasNavLink && mutedHoverPressableClass,
        ) : (
          'group mx-2 my-2 h-7 outline-none'
        )
      ]}
      dayHeaderContent={(data: DayHeaderData) => (
        (data.inPopover || !data.dayNumberText || !data.isToday) ? (
          <>{data.text}</>
        ) : (
          <>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  (textPart.type === 'day' && data.isToday)
                    ? joinClassNames(
                        'first:-ms-1 last:-me-1 size-7 rounded-full font-semibold',
                        'flex flex-row items-center justify-center',
                        data.hasNavLink
                          ? joinClassNames(
                              tertiaryPressableGroupClass,
                              outlineWidthGroupFocusClass,
                              outlineOffsetClass,
                              tertiaryOutlineColorClass,
                            )
                          : tertiaryClass,
                      )
                    : 'text-(--fc-pulse-muted-foreground)',
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
        data.isMajor
          ? 'border-(--fc-pulse-strong-border)'
          : 'border-(--fc-pulse-border)',
      ]}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row justify-end',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !data.isToday
          ? joinClassNames(
              'rounded-s-sm whitespace-nowrap',
              !data.isOther && 'font-semibold',
              data.isNarrow ? 'px-1' : 'px-2',
              data.monthText ? 'text-(--fc-pulse-foreground)' : 'text-(--fc-pulse-muted-foreground)',
              data.hasNavLink && mutedHoverPressableClass,
            )
          : joinClassNames(
              'group outline-none',
              data.isNarrow
                ? 'mx-px'
                : 'mx-2',
            )
      ]}
      dayCellTopContent={(data: DayCellData) => (
        !data.isToday ? (
          <>{data.text}</>
        ) : (
          <>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  (textPart.type === 'day' && data.isToday)
                    ? joinClassNames(
                        'rounded-full font-semibold',
                        'flex flex-row items-center justify-center',
                        data.isNarrow
                          ? 'size-5'
                          : 'size-6 first:-ms-1 last:-me-1',
                        data.hasNavLink
                          ? joinClassNames(
                              tertiaryPressableGroupClass,
                              outlineWidthGroupFocusClass,
                              outlineOffsetClass,
                              tertiaryOutlineColorClass,
                            )
                          : tertiaryClass,
                      )
                    : (data.monthText ? 'text-(--fc-pulse-foreground)' : 'text-(--fc-pulse-muted-foreground)'),
                )}
              >{textPart.value}</span>
            ))}
          </>
        )
      )}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="bg-(--fc-pulse-background) border border-(--fc-pulse-strong-border) rounded-sm overflow-hidden shadow-md m-1 min-w-55"
      popoverCloseClass={[
        'group absolute top-1.5 end-1.5 p-0.5 rounded-sm',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      popoverCloseContent={() => x(`size-5 ${mutedFgPressableGroupClass}`)}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-pulse-strong-border)' : 'border-(--fc-pulse-border)',
        data.isDisabled && 'bg-(--fc-pulse-faint)',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'mx-0.5'
      )}
      slotLaneClass={(data) => [
        'border border-(--fc-pulse-border)',
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass="group/day flex flex-col"
      listDayHeaderClass={[
        'border-b border-(--fc-pulse-border) [background:linear-gradient(var(--fc-pulse-faint),var(--fc-pulse-faint))_var(--fc-pulse-background)] text-(--fc-pulse-foreground)',
        'flex flex-row items-center justify-between',
      ]}
      listDayHeaderInnerClass={(data) => [
        'm-1.5 px-1.5 py-0.5 rounded-sm text-sm',
        !data.level && 'font-semibold',
        (!data.level && data.isToday)
          ? data.hasNavLink
              ? joinClassNames(tertiaryPressableClass, outlineOffsetClass)
              : tertiaryClass
          : data.hasNavLink && mutedHoverPressableClass,
      ]}
      listDayEventsClass="group-not-last/day:border-b border-(--fc-pulse-border) px-1.5 py-2 gap-2"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-3"
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'border-b border-(--fc-pulse-border) bg-(--fc-pulse-background)',
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-1.5 py-0.5 rounded-sm font-semibold',
        data.hasNavLink && mutedHoverPressableClass,
        'text-(--fc-pulse-foreground)',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-(--fc-pulse-background)'}
      fillerClass="border border-(--fc-pulse-border) opacity-50"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--fc-pulse-border)"
      dayRowClass="border border-(--fc-pulse-border)"
      slotHeaderRowClass="border border-(--fc-pulse-border)"
      slotHeaderInnerClass="text-(--fc-pulse-muted-foreground)"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute start-0 whitespace-nowrap rounded-e-sm',
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink && mutedHoverPressableClass,
        'text-(--fc-pulse-muted-foreground)',
      ]}
      highlightClass="bg-(--fc-pulse-highlight)"
      nonBusinessClass="bg-(--fc-pulse-faint)"
      nowIndicatorLineClass="-m-px border-1 border-(--fc-pulse-now)"
      nowIndicatorDotClass={[
        '-m-[6px] border-6 border-(--fc-pulse-now) size-0 rounded-full',
        'ring-2 ring-(--fc-pulse-background)',
      ]}

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      viewClass={[
        'rounded-sm overflow-hidden',
        `bg-(--fc-pulse-background) border border-(--fc-pulse-border) ${smallBoxShadowClass}`,
      ]}

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'prev,today,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      toolbarClass={(data) => [
        'flex flex-row flex-wrap items-center justify-between gap-5',
        data.borderlessX && 'px-3',
      ]}
      toolbarSectionClass="shrink-0 flex flex-row items-center gap-5"
      toolbarTitleClass="text-2xl font-bold text-(--fc-pulse-foreground)"
      buttonGroupClass={(data) => [
        'py-px rounded-sm flex flex-row items-center',
        data.isSelectGroup
          ? 'bg-(--fc-pulse-unselected)'
          : `bg-(--fc-pulse-secondary) ${smallBoxShadowClass}`
      ]}
      buttonClass={(data) => [
        'group py-2 flex flex-row items-center text-sm',
        data.isIconOnly ? 'px-2.5' : 'px-4',
        data.inSelectGroup
          ? joinClassNames(
              'rounded-sm',
              data.isSelected
                ? selectedButtonClass
                : joinClassNames(
                    unselectedButtonClass,
                    '-my-px border-y border-transparent',
                  )
            )
          : joinClassNames(
              'border',
              !data.inGroup
                ? 'rounded-sm'
                : '-my-px not-first:-ms-px first:rounded-s-sm last:rounded-e-sm',
              data.isPrimary
                ? joinClassNames(
                    primaryButtonClass,
                    !data.inGroup && largeBoxShadowClass,
                  )
                : joinClassNames(
                    secondaryButtonClass,
                    'border-(--fc-pulse-strong-border)',
                    !data.inGroup
                      ? `bg-(--fc-pulse-secondary) ${smallBoxShadowClass}`
                      : 'not-first:border-s-transparent not-last:border-e-(--fc-pulse-border)',
                  )
            ),
      ]}
      buttons={{
        ...userButtons,
        add: {
          isPrimary: true,
          ...addButton,
        },
        prev: {
          iconContent: () => chevronDown(
            joinClassNames(secondaryButtonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
          )
        },
        next: {
          iconContent: () => chevronDown(
            joinClassNames(secondaryButtonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
          )
        },
        prevYear: {
          iconContent: () => chevronsLeft(
            joinClassNames(secondaryButtonIconClass, '[[dir=rtl]_&]:rotate-180'),
          )
        },
        nextYear: {
          iconContent: () => chevronsLeft(
            joinClassNames(secondaryButtonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
          )
        },
      }}

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: 'border-b border-(--fc-pulse-border)',
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: (data) => data.isSticky && 'border-b border-(--fc-pulse-border)',
          dayCellBottomClass: getShortDayCellBottomClass,
          viewClass: 'bg-(--fc-pulse-faint)',
          tableBodyClass: 'border border-(--fc-pulse-border) bg-(--fc-pulse-background) rounded-sm overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? 'border-(--fc-pulse-border)'
              : 'border-(--fc-pulse-strong-border) shadow-sm'
          ],
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          ----------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'mx-0.5 h-6 px-1.5 text-(--fc-pulse-muted-foreground) flex flex-row items-center rounded-sm',
            data.isNarrow ? 'text-xs' : 'text-sm',
            data.hasNavLink && mutedHoverPressableClass,
          ],

          /* TimeGrid > All-Day Header
          ----------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => [
            'p-2 text-(--fc-pulse-muted-foreground)',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: 'border-b border-(--fc-pulse-strong-border) shadow-sm',

          /* TimeGrid > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'relative p-2',
            data.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            data.isFirst && 'hidden',
          ],
          slotHeaderDividerClass: 'border-e border-(--fc-pulse-border)',

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          ----------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            'group py-1 rounded-sm',
            data.isInteractive
              ? joinClassNames(faintHoverPressableClass, outlineInsetClass)
              : faintHoverClass,
          ],
          listItemEventBeforeClass: 'w-1.5 bg-(--fc-event-color) rounded-full',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: [
            '-order-1 shrink-0 w-1/2 max-w-60 px-4 py-2',
            'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
          ],
          listItemEventTitleClass: (data) => [
            'grow min-w-0 px-4 py-2 whitespace-nowrap overflow-hidden text-sm',
            data.event.url && 'group-hover:underline',
          ],

          /* No-Events Screen
          ----------------------------------------------------------------------------------------- */

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
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
}

function chevronsLeft(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
}

function x(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
}

