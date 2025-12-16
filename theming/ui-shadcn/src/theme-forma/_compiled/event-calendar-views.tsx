import React from 'react'
import FullCalendar from '@fullcalendar/react'
import { type CalendarOptions, type DayCellData } from '@fullcalendar/core'
import '@fullcalendar/core/global.css'
import type {} from '@fullcalendar/daygrid'
import type {} from '@fullcalendar/timegrid'
import type {} from '@fullcalendar/list'
import type {} from '@fullcalendar/multimonth'
import { cn } from '../../lib/utils.js'

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) rounded-full bg-background'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (data: DayCellData) => cn(
  !data.isNarrow && 'min-h-px'
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
      ? 'bg-foreground/5'
      : 'hover:bg-foreground/5',
  ),
  listItemEventBeforeClass: (data) => cn(
    'border-4 border-(--fc-event-color) rounded-full',
    data.isNarrow ? 'ms-0.5' : 'ms-1',
  ),
  listItemEventInnerClass: (data) => (
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs'
  ),
  listItemEventTimeClass: (data) => cn(
    data.isNarrow ? 'ps-0.5' : 'ps-1',
    'whitespace-nowrap overflow-hidden shrink-1',
  ),
  listItemEventTitleClass: (data) => cn(
    data.isNarrow ? 'px-0.5' : 'px-1',
    'font-bold whitespace-nowrap overflow-hidden shrink-100',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => cn(data.isEnd && (data.isNarrow ? 'me-px' : 'me-0.5')),
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => cn(
    'mb-px border rounded-sm hover:bg-foreground/5',
    data.isNarrow
      ? 'mx-px border-primary'
      : 'mx-0.5 border-transparent self-start',
  ),
  rowMoreLinkInnerClass: (data) => cn(
    data.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
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
  return (
    <div
      className={cn(
        liquidHeight && 'grow min-h-0',
        className,
      )}
    >
      <FullCalendar
        height={liquidHeight ? '100%' : height}

        /* Abstract Event
        ----------------------------------------------------------------------------------------- */

        eventShortHeight={50}
        eventColor="var(--primary)"
        eventContrastColor="var(--primary-foreground)"
        eventClass={(data) => cn(
          data.isSelected
            ? [
                'outline-3',
                data.isDragging && 'shadow-lg',
              ]
            : 'focus-visible:outline-3',
          'outline-ring/50',
        )}

        /* Background Event
        ----------------------------------------------------------------------------------------- */

        backgroundEventColor="var(--foreground)"
        backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]"
        backgroundEventTitleClass={(data) => cn(
          'opacity-50 italic',
          data.isNarrow
            ? `p-1 ${xxsTextClass}`
            : 'p-2 text-xs',
        )}

        /* List-Item Event
        ----------------------------------------------------------------------------------------- */

        listItemEventClass="items-center"
        listItemEventInnerClass="flex flex-row items-center"

        /* Block Event
        ----------------------------------------------------------------------------------------- */

        blockEventClass={(data) => cn(
          'group relative border-(--fc-event-color) print:bg-white bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))] -outline-offset-3',
          data.isInteractive && 'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]',
          (data.isDragging && !data.isSelected) && 'opacity-75',
        )}
        blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
        blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

        /* Row Event
        ----------------------------------------------------------------------------------------- */

        rowEventClass={(data) => cn(
          'mb-px not-print:py-px print:border-y items-center',
          data.isStart && 'border-s-6 rounded-s-sm',
          data.isEnd && 'not-print:pe-px print:border-e rounded-e-sm',
        )}
        rowEventBeforeClass={(data) => cn(
          data.isStartResizable && [
            data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
            '-start-2',
          ],
          (!data.isStart && !data.isNarrow) && [
            'ms-1 size-2 border-t-1 border-s-1 border-muted-foreground',
            '-rotate-45 [[dir=rtl]_&]:rotate-45',
          ]
        )}
        rowEventAfterClass={(data) => cn(
          data.isEndResizable && [
            data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
            '-end-1',
          ],
          (!data.isEnd && !data.isNarrow) && [
            'me-1 size-2 border-t-1 border-e-1 border-muted-foreground',
            'rotate-45 [[dir=rtl]_&]:-rotate-45',
          ]
        )}
        rowEventInnerClass={(data) => cn(
          'flex flex-row items-center',
          data.isNarrow ? xxsTextClass : 'text-xs',
        )}
        rowEventTimeClass={(data) => cn(
          'font-medium',
          data.isNarrow ? 'ps-0.5' : 'ps-1',
        )}
        rowEventTitleClass={(data) => (
          data.isNarrow ? 'px-0.5' : 'px-1'
        )}

        /* Column Event
        ----------------------------------------------------------------------------------------- */

        columnEventClass={(data) => cn(
          'border-s-6 not-print:pe-px print:border-e ring ring-background',
          data.isStart && 'not-print:pt-px print:border-t rounded-t-sm',
          data.isEnd && 'mb-px not-print:pb-px print:border-b rounded-b-sm',
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
            ? 'flex-row items-center p-1 gap-1'
            : ['flex-col', data.isNarrow ? 'px-0.5' : 'px-1']
        )}
        columnEventTimeClass={(data) => cn(
          !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1'),
          xxsTextClass,
        )}
        columnEventTitleClass={(data) => cn(
          !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
          (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
        )}

        /* More-Link
        ----------------------------------------------------------------------------------------- */

        moreLinkClass="focus-visible:outline-3 outline-ring/50"
        moreLinkInnerClass="whitespace-nowrap overflow-hidden"
        columnMoreLinkClass="mb-px border border-transparent print:border-black rounded-sm bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white ring ring-background -outline-offset-3"
        columnMoreLinkInnerClass={(data) => (
          data.isNarrow
            ? `p-0.5 ${xxsTextClass}`
            : 'p-1 text-xs'
        )}

        /* Day Header
        ----------------------------------------------------------------------------------------- */

        dayHeaderAlign={(data) => data.isNarrow ? 'center' : 'start'}
        dayHeaderClass={(data) => cn(
          'justify-center',
          data.isToday && !data.level && 'relative',
          data.isDisabled && 'bg-foreground/3',
          data.inPopover
            ? ['border-b', 'bg-foreground/5']
            : data.isMajor ? 'border border-foreground/20' :
                !data.isNarrow && 'border',
        )}
        dayHeaderInnerClass={(data) => cn(
          data.isToday && data.level && 'relative',
          'p-2 flex flex-col',
          data.hasNavLink && 'hover:bg-foreground/5 -outline-offset-3',
        )}
        dayHeaderContent={(data) => (
          <>
            {data.isToday && (
              <div className="absolute top-0 inset-x-0 border-t-4 border-primary pointer-events-none" />
            )}
            {data.dayNumberText && (
              <div
                className={cn(
                  data.isToday && 'font-bold',
                  data.isNarrow ? 'text-md' : 'text-lg',
                )}
              >{data.dayNumberText}</div>
            )}
            {data.weekdayText && (
              <div className="text-xs">{data.weekdayText}</div>
            )}
          </>
        )}

        /* Day Cell
        ----------------------------------------------------------------------------------------- */

        dayCellClass={(data) => cn(
          'border',
          data.isMajor && 'border-foreground/20',
          ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-foreground/3',
        )}
        dayCellTopClass={(data) => cn(
          data.isNarrow ? 'min-h-px' : 'min-h-0.5',
          'flex flex-row',
          ((data.isOther || data.isDisabled) && data.options.businessHours) && 'text-muted-foreground',
        )}
        dayCellTopInnerClass={(data) => cn(
          'flex flex-row items-center justify-center whitespace-nowrap',
          data.isNarrow
            ? `my-px h-5 ${xxsTextClass}`
            : 'my-1 h-6 text-sm',
          data.isToday
            ? [
                'rounded-full',
                data.isNarrow ? 'ms-px' : 'ms-1',
                data.text === data.dayNumberText
                  ? (data.isNarrow ? 'w-5' : 'w-6')
                  : (data.isNarrow ? 'px-1' : 'px-2'),
                'bg-primary text-primary-foreground',
                data.hasNavLink && 'hover:bg-primary/90',
              ]
            : [
                'rounded-e-sm',
                data.isNarrow ? 'px-1' : 'px-2',
                data.hasNavLink && 'hover:bg-foreground/5',
              ],
          data.monthText && 'font-bold',
        )}
        dayCellInnerClass={(data) => cn(data.inPopover && 'p-2')}

        /* Popover
        ----------------------------------------------------------------------------------------- */

        dayPopoverFormat={{ day: 'numeric', weekday: 'long' }}
        popoverClass="border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55"
        popoverCloseClass="group absolute top-1 end-1 p-1 rounded-sm hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50"

        /* Lane
        ----------------------------------------------------------------------------------------- */

        dayLaneClass={(data) => cn(
          'border',
          data.isMajor && 'border-foreground/20',
          data.isDisabled && 'bg-foreground/3',
        )}
        dayLaneInnerClass={(data) => (
          data.isStack
            ? 'm-1'
            : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
        )}
        slotLaneClass={getSlotClass}

        /* List Day
        ----------------------------------------------------------------------------------------- */

        listDayClass="not-last:border-b flex flex-row items-start"
        listDayHeaderClass={(data) => cn(
          'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
          data.isToday && 'border-s-4 border-primary',
        )}
        listDayHeaderInnerClass={(data) => cn(
          'my-0.5',
          !data.level
            ? ['text-lg', data.isToday && 'font-bold']
            : 'text-xs',
          data.hasNavLink && 'hover:underline',
        )}
        listDayEventsClass="grow min-w-0 p-4 gap-4"

        /* Single Month (in Multi-Month)
        ----------------------------------------------------------------------------------------- */

        singleMonthClass="m-4"
        singleMonthHeaderClass={(data) => cn(
          data.colCount > 1 ? 'pb-4' : 'py-2',
          data.isSticky && 'border-b bg-background',
          'items-center',
        )}
        singleMonthHeaderInnerClass={(data) => cn(
          'px-1 rounded-sm font-bold',
          data.hasNavLink && 'hover:bg-foreground/5',
          data.isNarrow ? 'text-base' : 'text-lg',
        )}

        /* Misc Table
        ----------------------------------------------------------------------------------------- */

        tableHeaderClass={(data) => cn(data.isSticky && 'bg-background')}
        fillerClass="border opacity-50"
        dayNarrowWidth={100}
        dayHeaderRowClass="border"
        dayRowClass="border"
        slotHeaderRowClass="border"
        slotHeaderClass={getSlotClass}

        /* Misc Content
        ----------------------------------------------------------------------------------------- */

        navLinkClass="focus-visible:outline-3 outline-ring/50"
        inlineWeekNumberClass={(data) => cn(
          'absolute end-0 whitespace-nowrap rounded-s-sm bg-foreground/5',
          data.isNarrow
            ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
            : 'top-1 p-1 text-xs',
          data.hasNavLink && 'hover:bg-foreground/10',
        )}
        nonBusinessClass="bg-foreground/3"
        highlightClass="bg-primary/10"
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
            dayHeaderDividerClass: (data) => cn(data.isSticky && 'border-b'),
            dayCellBottomClass: getShortDayCellBottomClass,
            dayHeaderInnerClass: (data) => cn(data.isNarrow && 'text-muted-foreground'),
            tableBodyClass: 'border rounded-sm overflow-hidden',
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
            weekNumberHeaderInnerClass: (data) => cn(
              'm-1 p-1 rounded-sm text-xs',
              data.hasNavLink && 'hover:bg-foreground/5',
            ),

            /* TimeGrid > All-Day Header
            ------------------------------------------------------------------------------------- */

            allDayHeaderClass: 'items-center justify-end',
            allDayHeaderInnerClass: (data) => cn(
              'p-2 whitespace-pre text-end',
              data.isNarrow ? xxsTextClass : 'text-xs',
            ),
            allDayDividerClass: 'border-b',

            /* TimeGrid > Slot Header
            ------------------------------------------------------------------------------------- */

            slotHeaderClass: 'justify-end',
            slotHeaderInnerClass: (data) => cn(
              'p-2',
              data.isNarrow ? xxsTextClass : 'text-xs',
            ),
            slotHeaderDividerClass: 'border-e',

            ...userViews?.timeGrid,
          },
          list: {

            /* List-View > List-Item Event
            ------------------------------------------------------------------------------------- */

            listItemEventClass: (data) => cn(
              'group border-s-6 border-(--fc-event-color) p-3 rounded-sm bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]',
              data.isInteractive && 'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]',
            ),
            listItemEventInnerClass: 'gap-2 text-sm',
            listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
            listItemEventTitleClass: (data) => cn(
              'grow min-w-0 whitespace-nowrap overflow-hidden font-semibold',
              data.event.url && 'group-hover:underline',
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
    </div>
  )
}

