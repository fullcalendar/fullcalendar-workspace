import React from 'react'
import FullCalendar, { type CalendarOptions, type DayCellInfo } from '@fullcalendar/react'
import '@fullcalendar/react/skeleton.css'
import { cn } from '../../lib/utils'

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-background rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (info: DayCellInfo) => cn(
  !info.isNarrow && 'min-h-px'
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => cn(
    'mb-px p-px rounded-sm',
    info.isNarrow ? 'mx-px' : 'mx-0.5',
  ),
  listItemEventBeforeClass: (info) => cn(
    'border-4',
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

  rowEventClass: (info) => cn(
    info.isStart && 'ms-px',
    info.isEnd && 'me-px',
  ),
  rowEventInnerClass: (info) => cn(info.isNarrow ? 'py-px' : 'py-0.5'),

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => cn(
    'mb-px border rounded-sm hover:bg-foreground/5',
    info.isNarrow
      ? 'mx-px border-primary'
      : 'mx-0.5 border-transparent',
  ),
  rowMoreLinkInnerClass: (info) => (
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
      eventColor='var(--primary)'
      eventContrastColor='var(--primary-foreground)'
      eventClass={(info) => cn(
        info.isSelected
          ? ['outline-3', info.isDragging ? 'shadow-lg' : 'shadow-md']
          : 'focus-visible:outline-3',
        'outline-ring/50',
      )}

      /* Background Event
      ----------------------------------------------------------------------------------------- */

      backgroundEventColor='var(--chart-3)'
      backgroundEventClass='bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'
      backgroundEventTitleClass={(info) => cn(
        'opacity-50 italic',
        info.isNarrow
          ? `px-1 py-1.5 ${xxsTextClass}`
          : 'px-2 py-2.5 text-xs',
      )}

      /* List-Item Event
      ----------------------------------------------------------------------------------------- */

      listItemEventClass={(info) => cn(
        'items-center',
        info.isSelected
          ? 'bg-foreground/5'
          : 'hover:bg-foreground/5',
      )}
      listItemEventBeforeClass='rounded-full border-(--fc-event-color)'
      listItemEventInnerClass='flex flex-row items-center'

      /* Block Event
      ----------------------------------------------------------------------------------------- */

      blockEventClass={(info) => cn(
        'group relative border-transparent print:border-(--fc-event-color) bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        info.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!info.isSelected && info.isDragging) && 'opacity-75',
      )}
      blockEventInnerClass='text-(--fc-event-contrast-color) print:text-black'
      blockEventTimeClass='whitespace-nowrap overflow-hidden'
      blockEventTitleClass='whitespace-nowrap overflow-hidden'

      /* Row Event
      ----------------------------------------------------------------------------------------- */

      rowEventClass={(info) => cn(
        'mb-px border-y',
        info.isStart ? 'border-s rounded-s-sm' : (!info.isNarrow && 'ms-2'),
        info.isEnd ? 'border-e rounded-e-sm' : (!info.isNarrow && 'me-2'),
      )}
      rowEventBeforeClass={(info) => cn(
        info.isStartResizable && [
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ],
        (!info.isStart && !info.isNarrow) && 'absolute -start-2 w-2 -top-px -bottom-px'
      )}
      rowEventBeforeContent={(info) => (
        (!info.isStart && !info.isNarrow) ? filledRightTriangle(
          'size-full rotate-180 [[dir=rtl]_&]:rotate-0 text-(--fc-event-color)',
        ) : <></> // HACK for React vdom
      )}
      rowEventAfterClass={(info) => cn(
        info.isEndResizable && [
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ],
        (!info.isEnd && !info.isNarrow) && 'absolute -end-2 w-2 -top-px -bottom-px'
      )}
      rowEventAfterContent={(info) => (
        (!info.isEnd && !info.isNarrow) ? filledRightTriangle(
          'size-full [[dir=rtl]_&]:rotate-180 text-(--fc-event-color)',
        ) : <></> // HACK for React vdom
      )}
      rowEventInnerClass={(info) => cn(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}
      rowEventTimeClass={(info) => cn(
        'font-bold shrink-1',
        info.isNarrow ? 'ps-0.5' : 'ps-1',
      )}
      rowEventTitleClass={(info) => cn(
        'shrink-100',
        info.isNarrow ? 'px-0.5' : 'px-1',
      )}

      /* Column Event
      ----------------------------------------------------------------------------------------- */

      columnEventTitleSticky={false}
      columnEventClass={(info) => cn(
        'border-x ring ring-background',
        info.isStart && 'border-t rounded-t-sm',
        info.isEnd && 'mb-px border-b rounded-b-sm',
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
          : ['flex-col', info.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1'],
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}
      columnEventTimeClass={(info) => cn(
        'order-1 shrink-100',
        !info.isShort && (info.isNarrow ? 'pb-0.5' : 'pb-1'),
      )}
      columnEventTitleClass={(info) => cn(
        'shrink-1',
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
      )}

      /* More-Link
      ----------------------------------------------------------------------------------------- */

      moreLinkClass="focus-visible:outline-3 outline-ring/50"
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'
      columnMoreLinkClass="mb-px border border-transparent print:border-black rounded-sm bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white ring ring-background"
      columnMoreLinkInnerClass={(info) => (
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ----------------------------------------------------------------------------------------- */

      dayHeaderAlign='center'
      dayHeaderClass={(info) => cn(
        'justify-center',
        info.isMajor && 'border border-foreground/20',
        (info.isDisabled && !info.inPopover) && 'bg-foreground/3',
      )}
      dayHeaderInnerClass='group mt-2 mx-2 flex flex-col items-center outline-none'
      dayHeaderContent={(info) => (
        <>
          {info.weekdayText && (
            <div className="text-xs uppercase text-muted-foreground">{info.weekdayText}</div>
          )}
          {info.dayNumberText && (
            <div
              className={cn(
                'm-0.5 rounded-full flex flex-row items-center justify-center',
                info.isNarrow
                  ? 'size-7 text-base'
                  : 'size-8 text-lg',
                info.isToday
                  ? [
                      'bg-chart-1/50',
                      info.hasNavLink && 'group-hover:bg-chart-1/60',
                    ]
                  : (info.hasNavLink && 'hover:bg-foreground/5'),
                info.hasNavLink && 'group-focus-visible:outline-3 outline-ring/50',
              )}
            >{info.dayNumberText}</div>
          )}
        </>
      )}

      /* Day Cell
      ----------------------------------------------------------------------------------------- */

      dayCellClass={(info) => cn(
        'border',
        info.isMajor && 'border-foreground/20',
        info.isDisabled && 'bg-foreground/3',
      )}
      dayCellTopClass={(info) => cn(
        'flex flex-row',
        info.isNarrow
          ? 'justify-end min-h-px'
          : 'justify-center min-h-0.5',
      )}
      dayCellTopInnerClass={(info) => cn(
        'flex flex-row items-center justify-center whitespace-nowrap rounded-full',
        info.isNarrow
          ? `m-px h-5 ${xxsTextClass}`
          : 'm-1.5 h-6 text-sm',
        info.text === info.dayNumberText
          ? (info.isNarrow ? 'w-5' : 'w-6')
          : (info.isNarrow ? 'px-1' : 'px-2'),
        info.isToday
          ? [
              'bg-chart-1/50',
              info.hasNavLink && 'hover:bg-chart-1/60 focus-visible:outline-3 outline-ring/50',
            ]
          : (info.hasNavLink && 'hover:bg-foreground/5'),
        info.isOther && 'text-muted-foreground',
        info.monthText && 'font-bold',
      )}
      dayCellInnerClass={(info) => cn(info.inPopover && 'p-2')}

      /* Popover
      ----------------------------------------------------------------------------------------- */

      popoverFormat={{ day: 'numeric', weekday: 'short' }}
      popoverClass='border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-60'
      popoverCloseClass="group absolute top-2 end-2 size-8 rounded-full items-center justify-center hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"

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
      slotLaneClass={(info) => cn(
        'border',
        info.isMinor && 'border-dotted',
      )}

      /* List Day
      ----------------------------------------------------------------------------------------- */

      listDayFormat={{ day: 'numeric' }}
      listDayAltFormat={{ month: 'short', weekday: 'short', forceCommas: true }}
      listDayClass={(info) => cn(
        !info.isLast && 'border-b',
        'flex flex-row items-start',
      )}
      listDayHeaderClass='p-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2'
      listDayHeaderInnerClass={(info) => cn(
        !info.level
          ? [
              'h-9 rounded-full flex flex-row items-center text-lg',
              info.text === info.dayNumberText
                ? 'w-9 justify-center'
                : 'px-3',
              info.isToday
                ? [
                    'bg-chart-1/50',
                    info.hasNavLink && 'hover:bg-chart-1/60 focus-visible:outline-3 outline-ring/50',
                  ]
                : (info.hasNavLink && 'hover:bg-foreground/5')
            ]
          : [
              'text-xs uppercase',
              info.hasNavLink && 'hover:underline',
            ]
      )}
      listDayBodyClass='grow min-w-0 py-2 gap-1'

      /* Single Month (in Multi-Month)
      ----------------------------------------------------------------------------------------- */

      singleMonthClass={(info) => cn(
        info.multiMonthColumnCount > 1 && 'm-4',
        (info.multiMonthColumnCount === 1 && !info.isLast) && 'border-b',
      )}
      singleMonthHeaderClass={(info) => cn(
        info.multiMonthColumnCount > 1
          ? 'pb-2'
          : 'py-1 border-b bg-background',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(info) => cn(
        'px-3 py-1 rounded-full text-base font-bold',
        info.hasNavLink && 'hover:bg-foreground/5',
      )}

      /* Misc Table
      ----------------------------------------------------------------------------------------- */

      tableHeaderClass='bg-background'
      fillerClass={(info) => cn(
        'opacity-50 border',
        info.inTableHeader && 'border-transparent',
      )}
      dayNarrowWidth={100}
      dayHeaderRowClass='border'
      dayRowClass='border'

      /* Misc Content
      ----------------------------------------------------------------------------------------- */

      navLinkClass="focus-visible:outline-3 outline-ring/50"
      inlineWeekNumberClass={(info) => cn(
        'absolute flex flex-row items-center whitespace-nowrap bg-foreground/10',
        info.isNarrow
          ? `top-0.5 start-0 my-px h-4 pe-1 rounded-e-full ${xxsTextClass}`
          : 'top-1.5 start-1 h-6 px-2 rounded-full text-sm',
        info.hasNavLink && 'hover:bg-foreground/20 focus-visible:outline-3 outline-ring/50',
      )}
      nonBusinessClass='bg-foreground/3'
      highlightClass='bg-chart-1/20'
      nowIndicatorLineClass='-m-px border-1 border-destructive'
      nowIndicatorDotClass="-m-[6px] border-6 border-destructive size-0 rounded-full ring-2 ring-background"

      /* View-Specific Options
      ----------------------------------------------------------------------------------------- */

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
          tableBodyClass: (info) => cn(
            info.multiMonthColumnCount > 1 && 'border rounded-sm overflow-hidden',
          ),
          dayHeaderInnerClass: (info) => cn(!info.inPopover && 'mb-2'),
          dayHeaderDividerClass: (info) => cn(
            info.multiMonthColumnCount === 1 && 'border-b',
          ),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          ------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (info) => cn(
            'ms-1 my-2 flex flex-row items-center rounded-full bg-foreground/10',
            info.options.dayMinWidth !== undefined && 'me-1',
            info.isNarrow
              ? 'h-5 px-1.5 text-xs'
              : 'h-6 px-2 text-sm',
            info.hasNavLink && 'hover:bg-foreground/20 focus-visible:outline-3 outline-ring/50',
          ),

          /* TimeGrid > All-Day Header
          ------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (info) => cn(
            'm-2 text-end',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),
          allDayDividerClass: 'border-b',

          /* TimeGrid > Slot Header
          ------------------------------------------------------------------------------------- */

          slotHeaderClass: (info) => cn(
            'w-2 self-end justify-end',
            'border',
            info.isMinor && 'border-dotted',
          ),
          slotHeaderInnerClass: (info) => cn(
            'relative ms-2 me-3 my-2',
            info.isNarrow
              ? `-top-4 ${xxsTextClass}`
              : '-top-5 text-sm',
            info.isFirst && 'hidden',
          ),
          slotHeaderDividerClass: (info) => cn(
            'border-e',
            (info.inTableHeader && info.options.dayMinWidth === undefined) && 'border-transparent',
          ),

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          ------------------------------------------------------------------------------------- */

          listItemEventClass: 'group p-2 rounded-s-full gap-2',
          listItemEventBeforeClass: 'mx-2 border-5',
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (info) => cn(
            'grow min-w-0 whitespace-nowrap overflow-hidden',
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

/* SVGs
------------------------------------------------------------------------------------------------- */

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
