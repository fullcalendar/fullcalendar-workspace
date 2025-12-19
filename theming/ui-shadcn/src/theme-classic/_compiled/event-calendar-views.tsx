import React from 'react'
import FullCalendar from '@fullcalendar/react'
import { type CalendarOptions } from '@fullcalendar/core'
import '@fullcalendar/core/skeleton.css'
import type {} from '@fullcalendar/daygrid'
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import { cn } from '../../lib/utils.js'

export const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-background rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const getDayClass = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => cn(
  'border',
  data.isMajor && 'border-foreground/20',
  data.isDisabled ? 'bg-foreground/3' :
    data.isToday && 'not-print:bg-yellow-400/15 dark:bg-yellow-200/10',
)

const getSlotClass = (data: { isMinor: boolean }) => cn(
  'border',
  data.isMinor && 'border-dotted',
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => cn(
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-px' : 'mx-0.5',
    data.isSelected
      ? ['bg-foreground/5', data.isDragging && 'shadow-sm']
      : 'hover:bg-foreground/5',
  ),
  listItemEventBeforeClass: (data) => cn(
    'border-4',
    data.isNarrow ? 'mx-px' : 'mx-1',
  ),
  listItemEventInnerClass: (data) => cn(
    'flex flex-row items-center py-px gap-0.5',
    data.isNarrow ? xxsTextClass : 'text-xs',
  ),
  listItemEventTimeClass: 'px-px whitespace-nowrap overflow-hidden shrink-1',
  listItemEventTitleClass: 'px-px font-bold whitespace-nowrap overflow-hidden shrink-100',

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => cn(
    data.isStart && ['rounded-s-sm', data.isNarrow ? 'ms-px' : 'ms-0.5'],
    data.isEnd && ['rounded-e-sm', data.isNarrow ? 'me-px' : 'me-0.5'],
  ),
  rowEventInnerClass: 'py-px gap-0.5',
  rowEventTimeClass: 'px-px',
  rowEventTitleClass: 'px-px',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => cn(
    'mb-px border rounded-sm hover:bg-foreground/5',
    data.isNarrow
      ? 'mx-px border-primary'
      : 'self-start mx-0.5 border-transparent',
  ),
  rowMoreLinkInnerClass: (data) => cn(
    'p-px',
    data.isNarrow ? xxsTextClass : 'text-xs',
  ),
}

export type EventCalendarViewProps =
  CalendarOptions &
  Required<Pick<CalendarOptions, 'popoverCloseContent'>> & { // ensure callers define icons
    liquidHeight?: boolean
  }

export function EventCalendarViews({
  className,
  liquidHeight,
  height,
  views: userViews,
  ...restOptions
}: EventCalendarViewProps) {
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      className={cn(
        'bg-background border-t',
        !borderlessX && !borderlessBottom && 'rounded-sm overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessBottom && 'border-b',
        liquidHeight && 'grow min-h-0',
        className,
      )}
    >
      <FullCalendar
        height={liquidHeight ? '100%' : height}

        /* Abstract Event
        ----------------------------------------------------------------------------------------- */

        eventColor='var(--primary)'
        eventContrastColor='var(--primary-foreground)'
        eventClass={(data) => cn(
          data.isSelected
            ? ['outline-3', data.isDragging ? 'shadow-lg' : 'shadow-md']
            : 'focus-visible:outline-3',
          'outline-ring/50',
        )}

        /* Background Event
        ----------------------------------------------------------------------------------------- */

        backgroundEventColor='var(--foreground)'
        backgroundEventClass='bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'
        backgroundEventTitleClass={(data) => cn(
          'opacity-50 italic',
          data.isNarrow
            ? `p-0.5 ${xxsTextClass}`
            : 'p-1.5 text-xs',
        )}

        /* List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass='items-center'
        listItemEventBeforeClass='border-(--fc-event-color) rounded-full'

        /* Block Event
        ----------------------------------------------------------------------------------------- */

        blockEventClass={(data) => cn(
          'group relative border-transparent print:border-(--fc-event-color) bg-(--fc-event-color) print:bg-white -outline-offset-1',
          (data.isDragging && !data.isSelected) && 'opacity-75',
        )}
        blockEventInnerClass='text-(--fc-event-contrast-color) print:text-black'
        blockEventTimeClass='whitespace-nowrap overflow-hidden shrink-1'
        blockEventTitleClass='whitespace-nowrap overflow-hidden shrink-100'

        /* Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass={(data) => cn(
          'mb-px border-y',
          data.isStart && 'border-s',
          data.isEnd && 'border-e',
        )}
        rowEventBeforeClass={(data) => cn(
          data.isStartResizable && [
            data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
            '-start-1',
          ]
        )}
        rowEventAfterClass={(data) => cn(
          data.isEndResizable && [
            data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
            '-end-1',
          ]
        )}
        rowEventInnerClass={(data) => cn(
          'flex flex-row items-center',
          data.isNarrow ? xxsTextClass : 'text-xs',
        )}
        rowEventTimeClass='font-bold'

        /* Column Event
        ----------------------------------------------------------------------------------------- */

        columnEventClass={(data) => cn(
          'border-x ring ring-background',
          data.isStart && 'border-t rounded-t-sm',
          data.isEnd && 'mb-px border-b rounded-b-sm',
        )}
        columnEventBeforeClass={(data) => cn(
          data.isStartResizable && [
            data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
            '-top-1',
          ]
        )}
        columnEventAfterClass={(data) => cn(
          data.isEndResizable && [
            data.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
            '-bottom-1',
          ]
        )}
        columnEventInnerClass={(data) => cn(
          'flex',
          data.isShort
            ? 'p-0.5 flex-row items-center gap-1'
            : 'px-0.5 flex-col',
        )}
        columnEventTimeClass={(data) => cn(
          !data.isShort && 'pt-0.5',
          xxsTextClass,
        )}
        columnEventTitleClass={(data) => cn(
          !data.isShort && 'py-0.5',
          (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
        )}

        /* More-Link
        ----------------------------------------------------------------------------------------- */

        moreLinkClass="focus-visible:outline-3 outline-ring/50"
        moreLinkInnerClass='whitespace-nowrap overflow-hidden'
        columnMoreLinkClass="mb-px rounded-sm border border-transparent print:border-black bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white ring ring-background -outline-offset-1"
        columnMoreLinkInnerClass={(data) => cn(
          'p-0.5',
          data.isNarrow ? xxsTextClass : 'text-xs',
        )}

        /* Day Header
        ----------------------------------------------------------------------------------------- */

        dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}
        dayHeaderClass={(data) => cn(
          'justify-center',
          data.isDisabled && 'bg-foreground/3',
          data.inPopover
            ? 'border-b bg-foreground/5'
            : ['border', data.isMajor && 'border-foreground/20'],
        )}
        dayHeaderInnerClass={(data) => cn(
          'px-1 py-0.5 flex flex-col',
          data.isNarrow ? xxsTextClass : 'text-sm',
        )}
        dayHeaderDividerClass='border-b'

        /* Day Cell
        ----------------------------------------------------------------------------------------- */

        dayCellClass={getDayClass}
        dayCellTopClass={(data) => cn(
          data.isNarrow ? 'min-h-px' : 'min-h-0.5',
          'flex flex-row justify-end',
        )}
        dayCellTopInnerClass={(data) => cn(
          'px-1 whitespace-nowrap',
          data.isNarrow
            ? `py-0.5 ${xxsTextClass}`
            : 'py-1 text-sm',
          data.isOther && 'text-muted-foreground',
          data.monthText && 'font-bold',
        )}
        dayCellInnerClass={(data) => cn(data.inPopover && 'p-2')}

        /* Popover
        ----------------------------------------------------------------------------------------- */

        popoverClass='border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55'
        popoverCloseClass="group absolute top-0.5 end-0.5 focus-visible:outline-3 outline-ring/50"

        /* Lane
        ----------------------------------------------------------------------------------------- */

        dayLaneClass={getDayClass}
        dayLaneInnerClass={(data) => (
          data.isStack
            ? 'm-1'
            : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
        )}
        slotLaneClass={getSlotClass}

        /* List Day
        ----------------------------------------------------------------------------------------- */

        listDayHeaderClass="border-b bg-muted flex flex-row items-center justify-between"
        listDayHeaderInnerClass='px-3 py-2 text-sm font-bold'

        /* Single Month (in Multi-Month)
        ----------------------------------------------------------------------------------------- */

        singleMonthClass='m-4'
        singleMonthHeaderClass={(data) => cn(
          data.isSticky && 'border-b bg-background',
          data.colCount > 1 ? 'pb-4' : 'py-2',
          'items-center',
        )}
        singleMonthHeaderInnerClass='text-base font-bold'

        /* Misc Table
        ----------------------------------------------------------------------------------------- */

        tableHeaderClass={(data) => cn(data.isSticky && 'bg-background')}
        fillerClass='border opacity-50'
        dayHeaderRowClass='border'
        dayRowClass='border'
        slotHeaderRowClass='border'
        slotHeaderClass={getSlotClass}

        /* Misc Content
        ----------------------------------------------------------------------------------------- */

        navLinkClass="hover:underline focus-visible:outline-3 -outline-offset-3 outline-ring/50"
        inlineWeekNumberClass={(data) => cn(
          'absolute top-0 start-0 rounded-ee-sm p-0.5 text-center text-muted-foreground bg-foreground/5',
          data.isNarrow ? xxsTextClass : 'text-sm',
        )}
        nonBusinessClass='bg-foreground/3'
        highlightClass='bg-primary/10'

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
            tableClass: 'border',
            ...userViews?.multiMonth,
          },
          timeGrid: {
            ...dayRowCommonClasses,
            dayCellBottomClass: 'min-h-3',

            /* TimeGrid > Week Number Header
            ------------------------------------------------------------------------------------- */

            weekNumberHeaderClass: 'items-center justify-end',
            weekNumberHeaderInnerClass: (data) => cn(
              'px-1 py-0.5',
              data.isNarrow ? xxsTextClass : 'text-sm',
            ),

            /* TimeGrid > All-Day Header
            ------------------------------------------------------------------------------------- */

            allDayHeaderClass: 'items-center justify-end',
            allDayHeaderInnerClass: (data) => cn(
              'px-1 py-2 whitespace-pre text-end',
              data.isNarrow ? xxsTextClass : 'text-sm',
            ),
            allDayDividerClass: 'border-y pb-0.5 bg-foreground/5',

            /* TimeGrid > Slot Header
            ------------------------------------------------------------------------------------- */

            slotHeaderClass: 'justify-end',
            slotHeaderInnerClass: (data) => cn(
              'px-1 py-0.5',
              data.isNarrow ? xxsTextClass : 'text-sm',
            ),
            slotHeaderDividerClass: 'border-e',

            /* TimeGrid > Now-Indicator
            ------------------------------------------------------------------------------------- */

            nowIndicatorHeaderClass: "start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-destructive",
            nowIndicatorLineClass: 'border-t border-destructive',

            ...userViews?.timeGrid,
          },
          list: {

            /* List-View > List-Item Event
            ------------------------------------------------------------------------------------- */

            listItemEventClass: (data) => cn(
              'group border-b px-3 py-2 gap-3 hover:bg-muted/50',
              data.isInteractive && 'focus-visible:bg-muted/50 -outline-offset-3',
            ),
            listItemEventBeforeClass: 'border-5',
            listItemEventInnerClass: '[display:contents]',
            listItemEventTimeClass: "-order-1 shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-sm",
            listItemEventTitleClass: (data) => cn(
              'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
              data.event.url && 'group-hover:underline',
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
    </div>
  )
}

