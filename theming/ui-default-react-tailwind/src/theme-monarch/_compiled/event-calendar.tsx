import React from 'react'
import { CalendarOptions, DayCellData } from '@fullcalendar/core'
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
const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
export const outlineColorClass = 'outline-(--fc-monarch-outline)'
const outlineFocusClass = `${outlineColorClass} ${outlineWidthFocusClass}`

// neutral buttons
export const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-monarch-strong),var(--fc-monarch-strong))_var(--fc-monarch-background)]',
  'hover:[background:linear-gradient(var(--fc-monarch-stronger),var(--fc-monarch-stronger))_var(--fc-monarch-background)]',
  'active:[background:linear-gradient(var(--fc-monarch-strongest),var(--fc-monarch-strongest))_var(--fc-monarch-background)]',
)
const mutedHoverClass = 'hover:bg-(--fc-monarch-muted)'
const mutedHoverGroupClass = 'group-hover:bg-(--fc-monarch-muted)'
export const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-monarch-muted) active:bg-(--fc-monarch-strong)`
const mutedHoverPressableGroupClass = `${mutedHoverGroupClass} group-focus-visible:bg-(--fc-monarch-muted) group-active:bg-(--fc-monarch-strong)`

// controls
const selectedClass = 'bg-(--fc-monarch-selected) text-(--fc-monarch-selected-foreground)'
const selectedPressableClasss = `${selectedClass} hover:bg-(--fc-monarch-selected-over) active:bg-(--fc-monarch-selected-down)`
const selectedButtonClass = `${selectedPressableClasss} border border-transparent ${outlineFocusClass} -outline-offset-1`
const unselectedButtonClass = `${mutedHoverPressableClass} border border-transparent ${outlineFocusClass} -outline-offset-1`

// primary
const primaryClass = 'bg-(--fc-monarch-primary) text-(--fc-monarch-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-monarch-primary-over) active:bg-(--fc-monarch-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${outlineFocusClass}`

// secondary *calendar content* (has muted color)
export const secondaryClass = 'bg-(--fc-monarch-secondary) text-(--fc-monarch-secondary-foreground)'
export const secondaryPressableClass = `${secondaryClass} hover:bg-(--fc-monarch-secondary-over) active:bg-(--fc-monarch-secondary-down) ${outlineFocusClass}`

// secondary *toolbar button* (neutral)
const secondaryButtonClass = `${mutedHoverPressableClass} border border-(--fc-monarch-strong-border) ${outlineFocusClass} -outline-offset-1`
const secondaryButtonIconClass = `size-5 text-(--fc-monarch-foreground) group-hover:text-(--fc-monarch-strong-foreground) group-focus-visible:text-(--fc-monarch-strong-foreground)`

// tertiary
const tertiaryClass = 'bg-(--fc-monarch-tertiary) text-(--fc-monarch-tertiary-foreground)'
const tertiaryPressableClass = `${tertiaryClass} hover:bg-(--fc-monarch-tertiary-over) active:bg-(--fc-monarch-tertiary-down)`
const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-(--fc-monarch-tertiary-over) group-active:bg-(--fc-monarch-tertiary-down) ${outlineFocusClass}`

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-(--fc-monarch-muted-foreground) group-hover:text-(--fc-monarch-foreground) group-focus-visible:text-(--fc-monarch-foreground)'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-(--fc-monarch-background) rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-px' : 'mx-0.5',
  ],
  listItemEventBeforeClass: (data) => [
    'border-4',
    data.isNarrow ? 'ms-0.5' : 'ms-1',
  ],
  listItemEventInnerClass: (data) => (
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs'
  ),
  listItemEventTimeClass: (data) => [
    data.isNarrow ? 'ps-0.5' : 'ps-1',
    'whitespace-nowrap overflow-hidden shrink-1',
  ],
  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-0.5' : 'px-1',
    'font-bold whitespace-nowrap overflow-hidden shrink-100',
  ],

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && 'ms-px',
    data.isEnd && 'me-px',
  ],
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? 'mx-px border-(--fc-monarch-primary)'
      : 'mx-0.5 border-transparent',
    mutedHoverPressableClass,
  ],
  rowMoreLinkInnerClass: (data) => (
    data.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
  ),
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
      className="bg-(--fc-monarch-background) border border-(--fc-monarch-border) rounded-xl overflow-hidden"

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today prev,next title',
        end: availableViews.join(','),
      }}
      toolbarClass="p-4 flex flex-row flex-wrap items-center justify-between gap-3"
      toolbarSectionClass="shrink-0 flex flex-row items-center gap-3"
      toolbarTitleClass="text-2xl font-bold"
      buttonGroupClass={(data) => [
        'rounded-full flex flex-row items-center',
        data.isSelectGroup && 'border border-(--fc-monarch-border)'
      ]}
      buttonClass={(data) => [
        'py-2.5 rounded-full flex flex-row items-center text-sm',
        data.isIconOnly ? 'px-2.5' : 'px-5',
        data.inSelectGroup && '-m-px',
        (data.isIconOnly || (data.inSelectGroup && !data.isSelected))
          ? unselectedButtonClass
          : data.isSelected
            ? selectedButtonClass
            : data.isPrimary
              ? primaryButtonClass
              : secondaryButtonClass
      ]}
      buttons={{
        prev: {
          iconContent: () => chevronDown(
            joinClassNames(
              secondaryButtonIconClass,
              'rotate-90 [[dir=rtl]_&]:-rotate-90',
            )
          )
        },
        next: {
          iconContent: () => chevronDown(
            joinClassNames(
              secondaryButtonIconClass,
              '-rotate-90 [[dir=rtl]_&]:rotate-90',
            )
          )
        },
        prevYear: {
          iconContent: () => chevronDoubleLeft(
            joinClassNames(
              secondaryButtonIconClass,
              '[[dir=rtl]_&]:rotate-180'
            )
          )
        },
        nextYear: {
          iconContent: () => chevronDoubleLeft(
            joinClassNames(
              secondaryButtonIconClass,
              'rotate-180 [[dir=rtl]_&]:rotate-0',
            )
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
      eventColor="var(--fc-monarch-event)"
      eventContrastColor="var(--fc-monarch-event-contrast)"
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : outlineWidthFocusClass,
        outlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--fc-monarch-tertiary)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]"
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `px-1 py-1.5 ${xxsTextClass}`
          : 'px-2 py-2.5 text-xs',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass={(data) => [
        'items-center',
        data.isSelected
          ? 'bg-(--fc-monarch-muted)'
          : data.isInteractive
            ? mutedHoverPressableClass
            : mutedHoverClass,
      ]}
      listItemEventBeforeClass="rounded-full border-(--fc-event-color)"
      listItemEventInnerClass="flex flex-row items-center"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative',
        'border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!data.isSelected && data.isDragging) && 'opacity-75',
      ]}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden"
      blockEventTitleClass="whitespace-nowrap overflow-hidden"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart ? 'border-s rounded-s-sm' : (!data.isNarrow && 'ms-2'),
        data.isEnd ? 'border-e rounded-e-sm' : (!data.isNarrow && 'me-2'),
      ]}
      rowEventBeforeClass={(data) => (
        data.isStartResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ] : (!data.isStart && !data.isNarrow) && [
          'absolute -start-2 w-2 -top-px -bottom-px'
        ]
      )}
      rowEventBeforeContent={(data) => (
        (!data.isStart && !data.isNarrow) ? filledRightTriangle(
          'size-full rotate-180 [[dir=rtl]_&]:rotate-0 text-(--fc-event-color)',
        ) : <></> // React HACK for stubborn SVG staying
      )}
      rowEventAfterClass={(data) => (
        data.isEndResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ] : (!data.isEnd && !data.isNarrow) && [
          'absolute -end-2 w-2 -top-px -bottom-px',
        ]
      )}
      rowEventAfterContent={(data) => (
        (!data.isEnd && !data.isNarrow) ? filledRightTriangle(
          'size-full [[dir=rtl]_&]:rotate-180 text-(--fc-event-color)',
        ) : <></> // React HACK for stubborn SVG staying
      )}
      rowEventInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ]}
      rowEventTimeClass={(data) => [
        'font-bold shrink-1',
        data.isNarrow ? 'ps-0.5' : 'ps-1',
      ]}
      rowEventTitleClass={(data) => [
        'shrink-100',
        data.isNarrow ? 'px-0.5' : 'px-1',
      ]}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventTitleSticky={false}
      columnEventClass={(data) => [
        `border-x ring ring-(--fc-monarch-background)`,
        data.isStart && 'border-t rounded-t-sm',
        data.isEnd && 'mb-px border-b rounded-b-sm',
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
          ? 'flex-row items-center p-1 gap-1'
          : joinClassNames(
              'flex-col',
              data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ]}
      columnEventTimeClass={(data) => [
        'order-1 shrink-100',
        !data.isShort && (data.isNarrow ? 'pb-0.5' : 'pb-1'),
      ]}
      columnEventTitleClass={(data) => [
        'shrink-1',
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={[
        outlineWidthFocusClass,
        outlineColorClass,
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={[
        'mb-px border border-transparent print:border-black rounded-sm',
        `${strongSolidPressableClass} print:bg-white`,
        'ring ring-(--fc-monarch-background)',
      ]}
      columnMoreLinkInnerClass={(data) => (
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign="center"
      dayHeaderClass={(data) => [
        'justify-center',
        data.isMajor && 'border border-(--fc-monarch-strong-border)',
        (data.isDisabled && !data.inPopover) && 'bg-(--fc-monarch-faint)',
      ]}
      dayHeaderInnerClass="group mt-2 mx-2 flex flex-col items-center outline-none"
      dayHeaderContent={(data) => (
        <>
          {data.weekdayText && (
            <div
              className={joinClassNames(
                'text-xs uppercase',
                'text-(--fc-monarch-muted-foreground)',
              )}
            >{data.weekdayText}</div>
          )}
          {data.dayNumberText && (
            <div
              className={joinClassNames(
                'm-0.5 rounded-full flex flex-row items-center justify-center',
                data.isNarrow
                  ? 'size-7 text-md'
                  : 'size-8 text-lg',
                data.isToday
                  ? (data.hasNavLink ? tertiaryPressableGroupClass : tertiaryClass)
                  : (data.hasNavLink && mutedHoverPressableGroupClass),
                data.hasNavLink && joinClassNames(
                  outlineWidthGroupFocusClass,
                  outlineColorClass,
                ),
              )}
            >{data.dayNumberText}</div>
          )}
        </>
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-monarch-strong-border)' : 'border-(--fc-monarch-border)',
        data.isDisabled && 'bg-(--fc-monarch-faint)',
      ]}
      dayCellTopClass={(data) => [
        'flex flex-row',
        data.isNarrow
          ? 'justify-end min-h-px'
          : 'justify-center min-h-0.5',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center justify-center whitespace-nowrap rounded-full',
        data.isNarrow
          ? `m-px h-5 ${xxsTextClass}`
          : 'm-1.5 h-6 text-sm',
        data.text === data.dayNumberText
          ? (data.isNarrow ? 'w-5' : 'w-6')
          : (data.isNarrow ? 'px-1' : 'px-2'),
        data.isToday
          ? (data.hasNavLink ? tertiaryPressableClass : tertiaryClass)
          : (data.hasNavLink && mutedHoverPressableClass),
        data.isOther && 'text-(--fc-monarch-faint-foreground)',
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat={{ day: 'numeric', weekday: 'short' }}
      popoverClass="border border-(--fc-monarch-border) rounded-lg overflow-hidden m-2 bg-(--fc-monarch-popover) text-(--fc-monarch-popover-foreground) shadow-lg min-w-60"
      popoverCloseClass={[
        'group absolute top-2 end-2 size-8 rounded-full',
        'items-center justify-center',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        outlineColorClass,
      ]}
      popoverCloseContent={() => x(`size-5 ${mutedFgPressableGroupClass}`)}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-monarch-strong-border)' : 'border-(--fc-monarch-border)',
        data.isDisabled && 'bg-(--fc-monarch-faint)',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={(data) => [
        'border border-(--fc-monarch-border)',
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayFormat={{ day: 'numeric' }}
      listDaySideFormat={{ month: 'short', weekday: 'short', forceCommas: true }}
      listDayClass="not-last:border-b border-(--fc-monarch-border) flex flex-row items-start"
      listDayHeaderClass="m-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2"
      listDayHeaderInnerClass={(data) => (
        !data.level
          ? joinClassNames(
              'h-9 rounded-full flex flex-row items-center text-lg',
              data.text === data.dayNumberText
                ? 'w-9 justify-center'
                : 'px-3',
              data.isToday
                ? (data.hasNavLink ? tertiaryPressableClass : tertiaryClass)
                : (data.hasNavLink && mutedHoverPressableClass)
            )
          : joinClassNames(
              'text-xs uppercase',
              data.hasNavLink && 'hover:underline',
            )
      )}
      listDayEventsClass="grow min-w-0 py-2 gap-1"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'border-b border-(--fc-monarch-border) bg-(--fc-monarch-background)',
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-3 py-1 rounded-full font-bold',
        data.hasNavLink && mutedHoverPressableClass,
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => (
        data.isSticky && 'border-b border-(--fc-monarch-border) bg-(--fc-monarch-background)'
      )}
      fillerClass={(data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : 'border-(--fc-monarch-border)',
      ]}
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--fc-monarch-border)"
      dayRowClass="border border-(--fc-monarch-border)"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        outlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute flex flex-row items-center whitespace-nowrap',
        data.isNarrow
          ? `top-0.5 start-0 my-px h-4 pe-1 rounded-e-full ${xxsTextClass}`
          : 'top-1.5 start-1 h-6 px-2 rounded-full text-sm',
        data.hasNavLink
          ? secondaryPressableClass
          : secondaryClass,
      ]}
      nonBusinessClass="bg-(--fc-monarch-faint)"
      highlightClass="bg-(--fc-monarch-highlight)"
      nowIndicatorLineClass="-m-px border-1 border-(--fc-monarch-now)"
      nowIndicatorDotClass={[
        '-m-[6px] border-6 border-(--fc-monarch-now) size-0 rounded-full',
        'ring-2 ring-(--fc-monarch-background)',
      ]}

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableBodyClass: 'border border-(--fc-monarch-border) rounded-sm',
          dayHeaderInnerClass: (data) => !data.inPopover && 'mb-2',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'ms-1 my-2 flex flex-row items-center rounded-full',
            data.options.dayMinWidth !== undefined && 'me-1',
            data.isNarrow
              ? 'h-5 px-1.5 text-xs'
              : 'h-6 px-2 text-sm',
            data.hasNavLink
              ? secondaryPressableClass
              : secondaryClass,
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'p-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          allDayDividerClass: 'border-b border-(--fc-monarch-border)',

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: (data) => [
            'w-2 self-end justify-end',
            'border border-(--fc-monarch-border)',
            data.isMinor && 'border-dotted',
          ],
          slotHeaderInnerClass: (data) => [
            'relative ps-2 pe-3 py-2',
            data.isNarrow
              ? `-top-4 ${xxsTextClass}`
              : '-top-5 text-sm',
            data.isFirst && 'hidden',
          ],
          slotHeaderDividerClass: (data) => [
            'border-e',
            (data.isHeader && data.options.dayMinWidth === undefined)
              ? 'border-transparent'
              : 'border-(--fc-monarch-border)',
          ],

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: 'group p-2 rounded-s-full gap-2',
          listItemEventBeforeClass: 'mx-2 border-5',
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (data) => [
            'grow min-w-0 whitespace-nowrap overflow-hidden',
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
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="80 -880 800 800" fill="currentColor"><path d="M480-304 240-544l56-56 184 184 184-184 56 56-240 240Z"/></svg>
}

function chevronDoubleLeft(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="80 -880 800 800" fill="currentColor"><path d="M440-240 200-480l240-240 56 56-183 184 183 184-56 56Zm264 0L464-480l240-240 56 56-183 184 183 184-56 56Z"/></svg>
}

function x(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="80 -880 800 800" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
}

function filledRightTriangle(className?: string) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 2200"
      preserveAspectRatio="none"
      className={className}
     >
      <polygon points="0,0 66,0 800,1100 66,2200 0,2200" fill="currentColor" />
    </svg>
  )
}

