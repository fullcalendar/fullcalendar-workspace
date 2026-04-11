import React from 'react'
import FullCalendar, { type CalendarOptions } from '@fullcalendar/react'
import '@fullcalendar/react/skeleton.css'
import { cn } from '../../lib/utils'

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-background rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const getDayClass = (info: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => cn(
  'border',
  info.isMajor && 'border-foreground/20',
  info.isDisabled ? 'bg-foreground/3' :
    info.isToday && 'not-print:bg-yellow-400/15 dark:bg-yellow-200/10',
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
      ? ['bg-foreground/5', info.isDragging && 'shadow-sm']
      : 'hover:bg-foreground/5',
  ),
  listItemEventBeforeClass: (info) => cn(
    'border-4',
    info.isNarrow ? 'mx-px' : 'mx-1',
  ),
  listItemEventInnerClass: (info) => cn(
    'flex flex-row items-center py-px gap-0.5',
    info.isNarrow ? xxsTextClass : 'text-xs',
  ),
  listItemEventTimeClass: 'px-px whitespace-nowrap overflow-hidden shrink-1',
  listItemEventTitleClass: 'px-px font-bold whitespace-nowrap overflow-hidden shrink-100',

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (info) => cn(
    info.isStart && ['rounded-s-sm', info.isNarrow ? 'ms-px' : 'ms-0.5'],
    info.isEnd && ['rounded-e-sm', info.isNarrow ? 'me-px' : 'me-0.5'],
  ),
  rowEventInnerClass: 'py-px gap-0.5',
  rowEventTimeClass: 'px-px',
  rowEventTitleClass: 'px-px',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => cn(
    'mb-px border rounded-sm hover:bg-foreground/5',
    info.isNarrow
      ? 'mx-px border-primary'
      : 'self-start mx-0.5 border-transparent',
  ),
  rowMoreLinkInnerClass: (info) => cn(
    'p-px',
    info.isNarrow ? xxsTextClass : 'text-xs',
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
      backgroundEventClass='not-print:bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)] print:border-1 print:border-(--fc-event-color)'
      backgroundEventTitleClass={(info) => cn(
        'opacity-50 italic',
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
      )}

      /* List-Item Event
      ----------------------------------------------------------------------------------------- */

      listItemEventClass='items-center'
      listItemEventBeforeClass='border-(--fc-event-color) rounded-full'

      /* Block Event
      ----------------------------------------------------------------------------------------- */

      blockEventClass={(info) => cn(
        'group relative border-transparent print:border-(--fc-event-color) bg-(--fc-event-color) print:bg-white',
        (info.isDragging && !info.isSelected) && 'opacity-75',
      )}
      blockEventInnerClass='text-(--fc-event-contrast-color) print:text-black'
      blockEventTimeClass='whitespace-nowrap overflow-hidden shrink-1'
      blockEventTitleClass='whitespace-nowrap overflow-hidden shrink-100'

      /* Row Event
      ----------------------------------------------------------------------------------------- */

      rowEventClass={(info) => cn(
        'mb-px border-y',
        info.isStart && 'border-s',
        info.isEnd && 'border-e',
      )}
      rowEventBeforeClass={(info) => cn(
        info.isStartResizable && [
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ]
      )}
      rowEventAfterClass={(info) => cn(
        info.isEndResizable && [
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ]
      )}
      rowEventInnerClass={(info) => cn(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}
      rowEventTimeClass='font-bold'

      /* Column Event
      ----------------------------------------------------------------------------------------- */

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
          ? 'p-0.5 flex-row items-center gap-1'
          : 'px-0.5 flex-col',
      )}
      columnEventTimeClass={(info) => cn(
        !info.isShort && 'pt-0.5',
        xxsTextClass,
      )}
      columnEventTitleClass={(info) => cn(
        !info.isShort && 'py-0.5',
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}

      /* More-Link
      ----------------------------------------------------------------------------------------- */

      moreLinkClass="focus-visible:outline-3 outline-ring/50"
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'
      columnMoreLinkClass="mb-px rounded-sm border border-transparent print:border-black bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white ring ring-background"
      columnMoreLinkInnerClass={(info) => cn(
        'p-0.5',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}

      /* Day Header
      ----------------------------------------------------------------------------------------- */

      dayHeaderAlign={(info) => info.inPopover ? 'start' : 'center'}
      dayHeaderClass={(info) => cn(
        'justify-center',
        info.isDisabled && 'bg-foreground/3',
        info.inPopover
          ? 'border-b bg-foreground/5'
          : ['border', info.isMajor && 'border-foreground/20'],
      )}
      dayHeaderInnerClass={(info) => cn(
        'mx-1 my-0.5 flex flex-col',
        info.isNarrow ? xxsTextClass : 'text-sm',
      )}
      dayHeaderDividerClass='border-b'

      /* Day Cell
      ----------------------------------------------------------------------------------------- */

      dayCellClass={getDayClass}
      dayCellTopClass={(info) => cn(
        info.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row justify-end',
      )}
      dayCellTopInnerClass={(info) => cn(
        'mx-1 whitespace-nowrap',
        info.isNarrow
          ? `my-0.5 ${xxsTextClass}`
          : 'my-1 text-sm',
        info.isOther && 'text-muted-foreground',
        info.monthText && 'font-bold',
      )}
      dayCellInnerClass={(info) => cn(info.inPopover && 'p-2')}

      /* Popover
      ----------------------------------------------------------------------------------------- */

      popoverClass='border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55'
      popoverCloseClass="group absolute top-0.5 end-0.5 focus-visible:outline-3 outline-ring/50"

      /* Lane
      ----------------------------------------------------------------------------------------- */

      dayLaneClass={getDayClass}
      dayLaneInnerClass={(info) => (
        info.isStack
          ? 'm-1'
          : info.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={getSlotClass}

      /* List Day
      ----------------------------------------------------------------------------------------- */

      listDayHeaderClass="-mb-px border-b bg-muted flex flex-row items-center justify-between"
      listDayHeaderInnerClass='px-3 py-2 text-sm font-bold'

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
      singleMonthHeaderInnerClass='text-base font-bold'

      /* Misc Table
      ----------------------------------------------------------------------------------------- */

      tableHeaderClass='bg-background'
      fillerClass='border opacity-50'
      dayHeaderRowClass='border'
      dayRowClass='border'
      slotHeaderRowClass='border'
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ----------------------------------------------------------------------------------------- */

      navLinkClass="hover:underline focus-visible:outline-3 -outline-offset-3 outline-ring/50"
      inlineWeekNumberClass={(info) => cn(
        'absolute top-0 start-0 rounded-ee-sm p-0.5 text-center text-muted-foreground bg-foreground/5',
        info.isNarrow ? xxsTextClass : 'text-sm',
      )}
      nonBusinessClass='bg-foreground/3'
      highlightClass='bg-chart-1/20'

      /* View-Specific Options
      ----------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: 'min-h-px',
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayCellBottomClass: 'min-h-px',
          tableClass: (info) => cn(info.multiMonthColumnCount > 1 && 'border'),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: 'min-h-3',

          /* TimeGrid > Week Number Header
          ------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (info) => cn(
            'mx-1 my-0.5',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),

          /* TimeGrid > All-Day Header
          ------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (info) => cn(
            'mx-1 my-2 text-end',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),
          allDayDividerClass: 'border-y pb-0.5 bg-foreground/5',

          /* TimeGrid > Slot Header
          ------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (info) => cn(
            'mx-1 my-0.5',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),
          slotHeaderDividerClass: 'border-e',

          /* TimeGrid > Now-Indicator
          ------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: "start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-destructive",
          nowIndicatorLineClass: 'border-t border-destructive',

          ...userViews?.timeGrid,
        },
        list: {
          listDayClass: (info) => cn(
            !info.isLast && 'border-b',
            'flex flex-col',
          ),

          /* List-View > List-Item Event
          ------------------------------------------------------------------------------------- */

          listItemEventClass: (info) => cn(
            'group border-t px-3 py-2 gap-3 hover:bg-muted/50',
            info.isInteractive && 'focus-visible:bg-muted/50 -outline-offset-3',
          ),
          listItemEventBeforeClass: 'border-5',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: "-order-1 shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-sm",
          listItemEventTitleClass: (info) => cn(
            'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
            info.event.url && 'group-hover:underline',
          ),

          /* No-Events Screen
          ------------------------------------------------------------------------------------- */

          noEventsClass: 'bg-foreground/5 flex flex-col items-center justify-center',
          noEventsInnerClass: 'sticky bottom-0 py-15',

          ...userViews?.list,
        },
      }}

      {...restOptions}
    />
  )
}
