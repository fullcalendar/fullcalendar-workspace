import React from 'react'
import FullCalendar, { type CalendarOptions, type DayCellInfo } from '@fullcalendar/react'
import '@fullcalendar/react/skeleton.css'
import { cn } from '../../lib/utils'

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) rounded-full bg-background'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (info: DayCellInfo) => cn(
  !info.isNarrow && 'min-h-px'
)

const getSlotClass = (info: { isMinor: boolean }) => cn(
  'border',
  info.isMinor && 'border-dotted',
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => cn(
    'mb-px p-px rounded-sm',
    info.isNarrow ? 'mx-px' : 'mx-0.5',
    info.isSelected
      ? 'bg-foreground/5'
      : 'hover:bg-foreground/5',
  ),
  listItemEventBeforeClass: (info) => cn(
    'border-4 border-(--fc-event-color) rounded-full',
    info.isNarrow ? 'ms-0.5' : 'ms-1',
  ),
  listItemEventInnerClass: (info) => (
    info.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs'
  ),
  listItemEventTimeClass: (info) => cn(
    info.isNarrow ? 'ps-0.5' : 'ps-1',
    'whitespace-nowrap overflow-hidden shrink-1',
  ),
  listItemEventTitleClass: (info) => cn(
    info.isNarrow ? 'px-0.5' : 'px-1',
    'font-bold whitespace-nowrap overflow-hidden shrink-100',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (info) => cn(info.isEnd && (info.isNarrow ? 'me-px' : 'me-0.5')),
  rowEventInnerClass: (info) => info.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => cn(
    'mb-px border rounded-sm hover:bg-foreground/5',
    info.isNarrow
      ? 'mx-px border-primary'
      : 'mx-0.5 border-transparent self-start',
  ),
  rowMoreLinkInnerClass: (info) => cn(
    info.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
  ),
}

export type EventCalendarViewProps =
  CalendarOptions &
  Required<Pick<CalendarOptions, 'popoverCloseContent'>> // ensure callers define icons

export function EventCalendarViews({
  views: userViews,
  ...restOptions
}: EventCalendarViewProps) {
  return (
    <FullCalendar

      /* Abstract Event
      ----------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--chart-2)"
      eventContrastColor="var(--primary-foreground)"
      eventClass={(info) => cn(
        info.isSelected
          ? [
              'outline-3',
              info.isDragging && 'shadow-lg',
            ]
          : 'focus-visible:outline-3',
        'outline-ring/50',
      )}

      /* Background Event
      ----------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--chart-3)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]"
      backgroundEventTitleClass={(info) => cn(
        'opacity-50 italic',
        info.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      )}

      /* List-Item Event
      ----------------------------------------------------------------------------------------- */

      listItemEventClass="items-center"
      listItemEventInnerClass="flex flex-row items-center"

      /* Block Event
      ----------------------------------------------------------------------------------------- */

      blockEventClass={(info) => cn(
        'group relative border-(--fc-event-color) print:bg-white bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--background))] -outline-offset-3',
        info.isInteractive && 'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--background))]',
        (info.isDragging && !info.isSelected) && 'opacity-75',
      )}
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ----------------------------------------------------------------------------------------- */

      rowEventClass={(info) => cn(
        'mb-px not-print:py-px print:border-y items-center',
        info.isStart && 'border-s-6 rounded-s-sm',
        info.isEnd && 'not-print:pe-px print:border-e rounded-e-sm',
      )}
      rowEventBeforeClass={(info) => cn(
        info.isStartResizable && [
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-2',
        ],
        (!info.isStart && !info.isNarrow) && [
          'ms-1 size-2 border-t-1 border-s-1 border-muted-foreground',
          '-rotate-45 [[dir=rtl]_&]:rotate-45',
        ]
      )}
      rowEventAfterClass={(info) => cn(
        info.isEndResizable && [
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ],
        (!info.isEnd && !info.isNarrow) && [
          'me-1 size-2 border-t-1 border-e-1 border-muted-foreground',
          'rotate-45 [[dir=rtl]_&]:-rotate-45',
        ]
      )}
      rowEventInnerClass={(info) => cn(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}
      rowEventTimeClass={(info) => cn(
        'font-medium',
        info.isNarrow ? 'ps-0.5' : 'ps-1',
      )}
      rowEventTitleClass={(info) => (
        info.isNarrow ? 'px-0.5' : 'px-1'
      )}

      /* Column Event
      ----------------------------------------------------------------------------------------- */

      columnEventClass={(info) => cn(
        'border-s-6 not-print:pe-px print:border-e ring ring-background',
        info.isStart && 'not-print:pt-px print:border-t rounded-t-sm',
        info.isEnd && 'mb-px not-print:pb-px print:border-b rounded-b-sm',
      )}
      columnEventBeforeClass={(info) => cn(
        info.isStartResizable && [
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        ]
      )}
      columnEventAfterClass={(info) => cn(
        info.isEndResizable && [
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        ]
      )}
      columnEventInnerClass={(info) => cn(
        'flex',
        info.isShort
          ? 'flex-row items-center p-1 gap-1'
          : ['flex-col', info.isNarrow ? 'px-0.5' : 'px-1']
      )}
      columnEventTimeClass={(info) => cn(
        !info.isShort && (info.isNarrow ? 'pt-0.5' : 'pt-1'),
        xxsTextClass,
      )}
      columnEventTitleClass={(info) => cn(
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}

      /* More-Link
      ----------------------------------------------------------------------------------------- */

      moreLinkClass="focus-visible:outline-3 outline-ring/50"
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass="mb-px border border-transparent print:border-black rounded-sm bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white ring ring-background -outline-offset-3"
      columnMoreLinkInnerClass={(info) => (
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ----------------------------------------------------------------------------------------- */

      dayHeaderAlign={(info) => info.isNarrow ? 'center' : 'start'}
      dayHeaderClass={(info) => cn(
        'justify-center',
        info.isToday && !info.level && 'relative',
        info.isDisabled && 'bg-foreground/3',
        info.inPopover
          ? ['border-b', 'bg-foreground/5']
          : info.isMajor ? 'border border-foreground/20' :
              !info.isNarrow && 'border',
      )}
      dayHeaderInnerClass={(info) => cn(
        info.isToday && info.level && 'relative',
        'p-2 flex flex-col',
        info.hasNavLink && 'hover:bg-foreground/5 -outline-offset-3',
      )}
      dayHeaderContent={(info) => (
        <>
          {info.isToday && (
            <div className="absolute top-0 inset-x-0 border-t-4 border-primary pointer-events-none" />
          )}
          {info.dayNumberText && (
            <div
              className={cn(
                info.isToday && 'font-bold',
                info.isNarrow ? 'text-base' : 'text-lg',
              )}
            >{info.dayNumberText}</div>
          )}
          {info.weekdayText && (
            <div className="text-xs">{info.weekdayText}</div>
          )}
        </>
      )}

      /* Day Cell
      ----------------------------------------------------------------------------------------- */

      dayCellClass={(info) => cn(
        'border',
        info.isMajor && 'border-foreground/20',
        ((info.isOther || info.isDisabled) && !info.options.businessHours) && 'bg-foreground/3',
      )}
      dayCellTopClass={(info) => cn(
        info.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row',
        ((info.isOther || info.isDisabled) && info.options.businessHours) && 'text-muted-foreground',
      )}
      dayCellTopInnerClass={(info) => cn(
        'flex flex-row items-center justify-center whitespace-nowrap',
        info.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        info.isToday
          ? [
              'rounded-full',
              info.isNarrow ? 'ms-px' : 'ms-1',
              info.text === info.dayNumberText
                ? (info.isNarrow ? 'w-5' : 'w-6')
                : (info.isNarrow ? 'px-1' : 'px-2'),
              'bg-primary text-primary-foreground',
              info.hasNavLink && 'hover:bg-primary/90',
            ]
          : [
              'rounded-e-sm',
              info.isNarrow ? 'px-1' : 'px-2',
              info.hasNavLink && 'hover:bg-foreground/5',
            ],
        info.monthText && 'font-bold',
      )}
      dayCellInnerClass={(info) => cn(info.inPopover && 'm-2')}

      /* Popover
      ----------------------------------------------------------------------------------------- */

      popoverFormat={{ day: 'numeric', weekday: 'long' }}
      popoverClass="border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55"
      popoverCloseClass="group absolute top-1 end-1 p-1 rounded-sm hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"

      /* Lane
      ----------------------------------------------------------------------------------------- */

      dayLaneClass={(info) => cn(
        'border',
        info.isMajor && 'border-foreground/20',
        info.isDisabled && 'bg-foreground/3',
      )}
      dayLaneInnerClass={(info) => (
        info.isStack
          ? 'm-1'
          : info.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={getSlotClass}

      /* List Day
      ----------------------------------------------------------------------------------------- */

      listDayClass={(info) => cn(
        !info.isLast && 'border-b',
        'flex flex-row items-start',
      )}
      listDayHeaderClass={(info) => cn(
        'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
        info.isToday && 'border-s-4 border-primary',
      )}
      listDayHeaderInnerClass={(info) => cn(
        'my-0.5',
        !info.level
          ? ['text-lg', info.isToday && 'font-bold']
          : 'text-xs',
        info.hasNavLink && 'hover:underline',
      )}
      listDayBodyClass="grow min-w-0 p-4 gap-4"

      /* Single Month (in Multi-Month)
      ----------------------------------------------------------------------------------------- */

      singleMonthClass={(info) => cn(
        info.multiMonthColumnCount > 1 && 'm-4',
        (info.multiMonthColumnCount === 1 && !info.isLast) && 'border-b',
      )}
      singleMonthHeaderClass={(info) => cn(
        info.multiMonthColumnCount > 1 ? 'pb-4' : 'py-2 border-b bg-background',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(info) => cn(
        'px-1 rounded-sm font-bold',
        info.hasNavLink && 'hover:bg-foreground/5',
        info.isNarrow ? 'text-base' : 'text-lg',
      )}

      /* Misc Table
      ----------------------------------------------------------------------------------------- */

      tableHeaderClass='bg-background'
      fillerClass="border opacity-50"
      dayNarrowWidth={100}
      dayHeaderRowClass="border"
      dayRowClass="border"
      slotHeaderRowClass="border"
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ----------------------------------------------------------------------------------------- */

      navLinkClass="focus-visible:outline-3 outline-ring/50"
      inlineWeekNumberClass={(info) => cn(
        'absolute end-0 whitespace-nowrap rounded-s-sm bg-foreground/5',
        info.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        info.hasNavLink && 'hover:bg-foreground/10',
      )}
      nonBusinessClass="bg-foreground/3"
      highlightClass="bg-chart-1/15"
      nowIndicatorLineClass="-m-px border-1 border-destructive"
      nowIndicatorDotClass="-m-[6px] border-6 border-destructive size-0 rounded-full ring-2 ring-background"

      /* View-Specific Options
      ----------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: 'border-b',
          dayCellBottomClass: getShortDayCellBottomClass,
          backgroundEventInnerClass: 'flex flex-row justify-end',
          ...userViews?.dayGrid,
        },
        dayGridMonth: {
          dayHeaderFormat: { weekday: 'long' },
          ...userViews?.dayGridMonth,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: (info) => cn(info.multiMonthColumnCount === 1 && 'border-b'),
          dayCellBottomClass: getShortDayCellBottomClass,
          dayHeaderInnerClass: (info) => cn(info.isNarrow && 'text-muted-foreground'),
          tableBodyClass: (info) => cn(info.multiMonthColumnCount > 1 && 'border rounded-sm overflow-hidden'),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: 'border-b',
          dayCellBottomClass: tallDayCellBottomClass,
          dayHeaderAlign: 'start',

          /* TimeGrid > Week Number Header
          ------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-end justify-end',
          weekNumberHeaderInnerClass: (info) => cn(
            'm-1 p-1 rounded-sm text-xs',
            info.hasNavLink && 'hover:bg-foreground/5',
          ),

          /* TimeGrid > All-Day Header
          ------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (info) => cn(
            'm-2 text-end',
            info.isNarrow ? xxsTextClass : 'text-xs',
          ),
          allDayDividerClass: 'border-b',

          /* TimeGrid > Slot Header
          ------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (info) => cn(
            'm-2',
            info.isNarrow ? xxsTextClass : 'text-xs',
          ),
          slotHeaderDividerClass: 'border-e',

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          ------------------------------------------------------------------------------------- */

          listItemEventClass: (info) => cn(
            'group border-s-6 border-(--fc-event-color) p-3 rounded-sm bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--background))]',
            info.isInteractive && 'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--background))]',
          ),
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (info) => cn(
            'grow min-w-0 whitespace-nowrap overflow-hidden font-semibold',
            info.event.url && 'group-hover:underline',
          ),

          /* No-Events Screen
          ------------------------------------------------------------------------------------- */

          noEventsClass: 'grow flex flex-col items-center justify-center',
          noEventsInnerClass: 'py-15',

          ...userViews?.list,
        },
      }}

      {...restOptions}
    />
  )
}
