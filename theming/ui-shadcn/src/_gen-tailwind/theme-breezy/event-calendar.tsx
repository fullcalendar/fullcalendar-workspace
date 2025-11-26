import React from 'react'
import { CalendarOptions, DayCellData, DayHeaderData, joinClassNames } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import { XIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from 'lucide-react'

export const eventCalendarPlugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

export const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

// usually 11px font / 12px line-height
const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-background rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-3'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

const getNormalDayHeaderBorderClass = (data: DayHeaderData) => (
  !data.inPopover && (
    data.isMajor ? 'border border-foreground/20' :
      !data.isNarrow && 'border'
  )
)
const getMutedDayHeaderBorderClass = (data: DayHeaderData) => (
  !data.inPopover && (
    data.isMajor ? 'border border-foreground/20' :
      !data.isNarrow && 'border'
  )
)

const getNormalDayCellBorderColorClass = (data: DayCellData) => (
  data.isMajor && 'border-foreground/20'
)
const getMutedDayCellBorderColorClass = (data: DayCellData) => (
  data.isMajor && 'border-foreground/20'
)

const mutedHoverButtonClass = joinClassNames(
  'hover:bg-foreground/5',
  'focus-visible:bg-foreground/5',
  'focus-visible:outline-3',
  'outline-ring/50',
)

// event content
const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  --------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px',
    data.isNarrow
      ? 'mx-px rounded-sm'
      : 'mx-1 rounded-md',
    data.isSelected
      ? 'bg-foreground/5'
      : data.isInteractive
        ? 'hover:bg-foreground/5 focus-visible:bg-foreground/5'
        : 'hover:bg-foreground/5',
  ],

  listItemEventInnerClass: (data) => [
    'flex flex-row items-center justify-between',
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs',
  ],

  listItemEventTimeClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-muted-foreground',
    'order-1 whitespace-nowrap overflow-hidden shrink-1',
  ],

  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'whitespace-nowrap overflow-hidden shrink-100',
    'font-medium',
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
    'mb-px border',
    data.isNarrow
      ? 'mx-px border-primary rounded-sm'
      : 'self-start mx-1 border-transparent rounded-md',
    'hover:bg-foreground/5 focus-visible:bg-foreground/5',
  ],

  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
  ]
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
  buttons: userButtons,
  views: userViews,
  plugins: userPlugins,
  ...restOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      initialView={availableViews[0]}
      plugins={[
        ...eventCalendarPlugins,
        ...(userPlugins || []),
      ]}
      className='bg-background border rounded-lg overflow-hidden'

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'prev,today,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      headerToolbarClass='border-b'
      footerToolbarClass='border-t'
      toolbarClass='px-4 py-4 bg-foreground/3 flex flex-row flex-wrap items-center justify-between gap-4'
      toolbarSectionClass='shrink-0 flex flex-row items-center gap-4'
      toolbarTitleClass='text-lg font-semibold'
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
            ? 'bg-primary/10 text-foreground focus-visible:outline-2 outline-ring/50'
            : 'text-muted-foreground hover:text-foreground focus-visible:outline-2 outline-ring/50',
        ) : joinClassNames(
          'font-semibold',
          data.isPrimary
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-transparent focus-visible:outline-2 outline-offset-2 outline-ring/50'
            : 'hover:bg-foreground/20 focus-visible:outline-2 outline-ring/50 border border-foreground/20 -outline-offset-1',
          data.inGroup
            ? 'first:rounded-s-md first:border-s last:rounded-e-md last:border-e border-y'
            : 'rounded-md shadow-xs border',
        ),
      ]}
      buttons={{
        add: {
          isPrimary: true,
          ...addButton,
        },
        prev: {
          iconContent: () => (
            <ChevronLeftIcon className={joinClassNames(`size-5 ${mutedFgPressableGroupClass}`, '[[dir=rtl]_&]:rotate-180')} />
          ),
        },
        next: {
          iconContent: () => (
            <ChevronRightIcon className={joinClassNames(`size-5 ${mutedFgPressableGroupClass}`, '[[dir=rtl]_&]:rotate-180')} />
          ),
        },
        prevYear: {
          iconContent: () => (
            <ChevronsLeftIcon className={joinClassNames(`size-5 ${mutedFgPressableGroupClass}`, '[[dir=rtl]_&]:rotate-180')} />
          )
        },
        nextYear: {
          iconContent: () => (
            <ChevronsRightIcon className={joinClassNames(`size-5 ${mutedFgPressableGroupClass}`, '[[dir=rtl]_&]:rotate-180')} />
          )
        },
        ...userButtons,
      }}

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor='var(--primary)'
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              'outline-3',
              data.isDragging && 'shadow-md',
            )
          : 'focus-visible:outline-3',
        'outline-ring/50',
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor='var(--foreground)'
      backgroundEventClass={bgEventBgClass}
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      ]}

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative',
        data.isInteractive
          ? 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))] hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]'
          : 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]',
        'print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ]}
      blockEventInnerClass='text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--foreground))]'
      blockEventTimeClass='whitespace-nowrap overflow-hidden shrink-1'
      blockEventTitleClass='whitespace-nowrap overflow-hidden shrink-100'

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
        'border-x ring ring-background',
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

      moreLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'
      columnMoreLinkClass={(data) => [
        data.isNarrow ? 'my-px' : 'my-1',
        'border border-transparent print:border-black rounded-md',
        'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
        'ring ring-background',
      ]}
      columnMoreLinkInnerClass={(data) => [
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
      ]}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}
      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover && 'border-b bg-foreground/5',
      ]}
      dayHeaderInnerClass={(data) => [
        'flex flex-row items-center',
        (!data.dayNumberText && !data.inPopover)
          ? joinClassNames(
              'py-1 rounded-sm text-xs',
              data.isNarrow
                ? 'px-1 m-1 text-muted-foreground'
                : 'px-1.5 m-2 font-semibold',
              data.hasNavLink && mutedHoverButtonClass,
            )
          : (data.isToday && data.dayNumberText && !data.inPopover)
              ? joinClassNames(
                  'group m-2 outline-none',
                  data.isNarrow ? 'h-6' : 'h-8'
                )
              : joinClassNames(
                  'rounded-sm',
                  data.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : joinClassNames(
                        'mx-2 h-6 px-1.5',
                        data.isNarrow ? 'my-2' : 'my-3'
                      ),
                  data.hasNavLink && mutedHoverButtonClass,
                ),
      ]}
      dayHeaderContent={(data) => (
        (!data.dayNumberText && !data.inPopover) ? (
          <React.Fragment>{data.text}</React.Fragment>
        ) : (
          <React.Fragment>
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
                                ? joinClassNames(
                                    'bg-primary text-primary-foreground group-hover:bg-primary/90',
                                    'group-focus-visible:outline-3',
                                    '-outline-offset-3',
                                    'outline-ring/50',
                                  )
                                : 'bg-primary text-primary-foreground',
                            )
                          : ''
                      )
                    : 'text-muted-foreground',
                )}
              >{textPart.value}</span>
            ))}
          </React.Fragment>
        )
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-foreground/3',
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
              data.isNarrow
                ? 'ms-px'
                : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6')
                : (data.isNarrow ? 'px-1' : 'px-2'),
              data.hasNavLink
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-primary text-primary-foreground',
            )
          : joinClassNames(
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && 'hover:bg-foreground/5 focus-visible:bg-foreground/5',
              (data.isOther || !data.monthText) && 'text-muted-foreground',
              data.monthText && 'font-bold',
            ),
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass='border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55'
      popoverCloseClass={[
        'group absolute top-2 end-2 p-0.5 rounded-sm',
        mutedHoverButtonClass,
      ]}
      popoverCloseContent={() => (
        <XIcon className={`size-5 ${mutedFgPressableGroupClass}`} />
      )}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor && 'border-foreground/20',
        data.isDisabled && 'bg-foreground/3',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'mx-1'
      )}
      slotLaneClass={(data) => [
        'border',
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDaysClass='my-10 mx-auto w-full max-w-218 px-4'
      listDayClass={[
        'not-last:border-b',
        'flex flex-row items-start gap-2',
      ]}
      listDayHeaderClass='my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start'
      listDayHeaderInnerClass={(data) => [
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !data.level
          ? joinClassNames(
              data.isToday
                ? joinClassNames(
                    'font-semibold',
                    'bg-primary text-primary-foreground',
                    data.hasNavLink && 'hover:bg-primary/90',
                  )
                : joinClassNames(
                    'font-medium',
                    data.hasNavLink && 'hover:bg-foreground/5 focus-visible:bg-foreground/5',
                  )
            )
          : joinClassNames(
              'text-muted-foreground',
              data.hasNavLink && joinClassNames(
                'hover:bg-foreground/5 focus-visible:bg-foreground/5',
                'hover:text-muted-foreground',
              ),
            )
      ]}
      listDayEventsClass='my-4 grow min-w-0 border rounded-md'

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass='m-4'
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'bg-background border-b',
        data.colCount > 1 ? 'pb-1' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'py-1 px-2 rounded-md text-sm font-semibold',
        data.hasNavLink && 'hover:bg-foreground/5 focus-visible:bg-foreground/5',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      fillerClass='border'
      dayNarrowWidth={100}
      dayHeaderRowClass='border'
      dayRowClass='border'

      slotHeaderRowClass='border'
      slotHeaderInnerClass='text-muted-foreground uppercase'

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute top-0 end-0 bg-background text-muted-foreground whitespace-nowrap rounded-es-md',
        'border-b border-foreground/20',
        'border-s',
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        'hover:bg-foreground/5',
        data.hasNavLink && 'focus-visible:bg-foreground/5 -outline-offset-1',
      ]}
      highlightClass='bg-primary/10'
      nonBusinessClass='bg-foreground/3'
      nowIndicatorLineClass='-m-px border-1 border-destructive'
      nowIndicatorDotClass={[
        '-m-[6px] border-6 border-destructive size-0 rounded-full',
        'ring-2 ring-background',
      ]}

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getNormalDayHeaderBorderClass,
          dayHeaderDividerClass: 'border-b border-foreground/20',
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          backgroundEventInnerClass: 'flex flex-row justify-end',
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderClass: getNormalDayHeaderBorderClass,
          dayHeaderDividerClass: (data) => data.isSticky && 'border-b border-foreground/20 shadow-sm',
          dayCellBottomClass: getShortDayCellBottomClass,
          tableHeaderClass: (data) => data.isSticky && 'bg-background',
          tableBodyClass: 'border rounded-md shadow-xs overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getMutedDayHeaderBorderClass,
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? ''
              : 'border-foreground/20 shadow-sm',
          ],
          dayCellClass: getMutedDayCellBorderColorClass,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'm-1.5 h-6 px-1.5 text-muted-foreground rounded-sm flex flex-row items-center',
            data.hasNavLink && 'hover:bg-foreground/5 focus-visible:bg-foreground/5',
            data.isNarrow ? 'text-xs' : 'text-sm',
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => [
            'p-3 text-muted-foreground',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: 'border-b border-foreground/20 shadow-sm',

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
          slotHeaderDividerClass: 'border-e',
          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            'group not-last:border-b p-4 items-center gap-3',
            data.isInteractive
              ? 'hover:bg-muted/50 focus-visible:bg-muted/50'
              : 'hover:bg-muted/50',
          ],
          listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full',
          listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',
          listItemEventTimeClass: [
            'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis',
            'text-muted-foreground',
          ],
          listItemEventTitleClass: (data) => [
            'grow min-w-0 font-medium whitespace-nowrap overflow-hidden',
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


