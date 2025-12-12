import React from 'react'
import { CalendarController, CalendarOptions, DayCellData, DayHeaderData } from '@fullcalendar/core'
import { useCalendarController } from '@fullcalendar/react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { Button } from '../../ui/button.js'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.js'
import { cn } from '../../lib/utils.js'

export const eventCalendarPlugins = [
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

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-background rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const getNormalDayHeaderBorderClass = (data: DayHeaderData) => cn(
  !data.inPopover && (
    data.isMajor ? 'border border-foreground/20' :
      !data.isNarrow && 'border'
  )
)
const getMutedDayHeaderBorderClass = (data: DayHeaderData) => cn(
  !data.inPopover && (
    data.isMajor ? 'border border-foreground/20' :
      !data.isNarrow && 'border'
  )
)

const getNormalDayCellBorderColorClass = (data: DayCellData) => cn(
  data.isMajor && 'border-foreground/20'
)
const getMutedDayCellBorderColorClass = (data: DayCellData) => cn(
  data.isMajor && 'border-foreground/20'
)

const tallDayCellBottomClass = 'min-h-3'
const getShortDayCellBottomClass = (data: DayCellData) => cn(
  !data.isNarrow && 'min-h-px'
)

const mutedHoverButtonClass = 'hover:bg-foreground/5 focus-visible:outline-3 outline-ring/50'
const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => cn(
    'mb-px p-px',
    data.isNarrow
      ? 'mx-px rounded-sm'
      : 'mx-1 rounded-md',
    data.isSelected
      ? 'bg-foreground/5'
      : 'hover:bg-foreground/5',
  ),
  listItemEventInnerClass: (data) => cn(
    'flex flex-row items-center justify-between',
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs',
  ),
  listItemEventTimeClass: (data) => cn(
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-muted-foreground order-1 whitespace-nowrap overflow-hidden shrink-1',
  ),
  listItemEventTitleClass: (data) => cn(
    data.isNarrow ? 'px-px' : 'px-0.5',
    'font-medium whitespace-nowrap overflow-hidden shrink-100',
    data.timeText && 'text-ellipsis',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => cn(
    data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
    data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
  ),
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => cn(
    'mb-px border',
    data.isNarrow
      ? 'mx-px border-primary rounded-sm'
      : 'self-start mx-1 border-transparent rounded-md',
    'hover:bg-foreground/5',
  ),
  rowMoreLinkInnerClass: (data) =>
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs'
}

export interface EventCalendarProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
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
  className,
  height,
  contentHeight,
  direction,
  plugins: userPlugins,
  ...restOptions
}: EventCalendarProps) {
  const controller = useCalendarController()
  const borderlessX = restOptions.borderlessX ?? restOptions.borderless
  const borderlessTop = restOptions.borderlessTop ?? restOptions.borderless
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      className={cn(
        className,
        'flex flex-col bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className="border-b p-4 bg-sidebar text-sidebar-foreground"
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className="grow min-h-0">
        <EventCalendarView
          height={height !== undefined ? '100%' : contentHeight}
          initialView={availableViews[0]}
          controller={controller}
          plugins={[
            ...eventCalendarPlugins,
            ...(userPlugins || []),
          ]}
          {...restOptions}
        />
      </div>
    </div>
  )
}

export interface EventCalendarToolbarProps {
  className?: string
  controller: CalendarController
  availableViews: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

export function EventCalendarToolbar({
  className,
  controller,
  availableViews,
  addButton,
}: EventCalendarToolbarProps) {
  const buttons = controller.getButtonState()

  return (
    <div className={cn('flex items-center justify-between flex-wrap gap-3', className)}>
      <div className="flex items-center shrink-0 gap-3">
        {addButton && (
          <Button
            onClick={addButton.click as any}
            aria-label={addButton.hint}
          >{addButton.text}</Button>
        )}
        <Button
          onClick={() => controller.today()}
          aria-label={buttons.today.hint}
          variant="outline"
        >{buttons.today.text}</Button>
        <div className="flex items-center">
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant="ghost"
            size="icon"
          >
            <ChevronLeftIcon className="[[dir=rtl]_&]:rotate-180" />
          </Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant="ghost"
            size="icon"
          >
            <ChevronRightIcon className="[[dir=rtl]_&]:rotate-180" />
          </Button>
        </div>
        <div className="text-xl">{controller.view?.title}</div>
      </div>
      <Tabs value={controller.view?.type ?? availableViews[0]}>
        <TabsList>
          {availableViews.map((availableView) => (
            <TabsTrigger
              key={availableView}
              value={availableView}
              onClick={() => controller.changeView(availableView)}
              aria-label={buttons[availableView]?.hint}
            >{buttons[availableView]?.text}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

export function EventCalendarView({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <FullCalendar

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--primary)"
      eventClass={(data) => cn(
        data.isSelected
          ? [
              'outline-3',
              data.isDragging && 'shadow-md',
            ]
          : 'focus-visible:outline-3',
        'outline-ring/50',
      )}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--foreground)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]"
      backgroundEventTitleClass={(data) => cn(
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      )}

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => cn(
        'group relative print:bg-white border-transparent print:border-(--fc-event-color) bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]',
        data.isInteractive && 'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      )}
      blockEventInnerClass="text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--foreground))]"
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => cn(
        'mb-px border-y',
        data.isStart && ['border-s', data.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'],
        data.isEnd && ['border-e', data.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'],
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
      rowEventTimeClass={(data) => cn(
        data.isNarrow ? 'ps-0.5' : 'ps-1',
        'font-medium',
      )}
      rowEventTitleClass={(data) => cn(
        data.isNarrow ? 'px-0.5' : 'px-1'
      )}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => cn(
        'border-x ring ring-background',
        data.isStart && ['border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-1'],
        data.isEnd && ['border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-1'],
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
          ? 'flex-row items-center gap-1 p-1'
          : ['flex-col', data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1'],
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      )}
      columnEventTimeClass={(data) => cn(
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(data) => cn(
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-semibold',
      )}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass="focus-visible:outline-3 outline-ring/50"
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={(data) => cn(
        data.isNarrow ? 'my-px' : 'my-1',
        'border border-transparent print:border-black rounded-md bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white ring ring-background',
      )}
      columnMoreLinkInnerClass={(data) => cn(
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}
      dayHeaderClass={(data) => cn(
        'justify-center',
        data.inPopover && 'border-b bg-foreground/5',
      )}
      dayHeaderInnerClass={(data) => cn(
        'flex flex-row items-center',
        (!data.dayNumberText && !data.inPopover)
          ? [
              'py-1 rounded-sm text-xs',
              data.isNarrow
                ? 'px-1 m-1 text-muted-foreground'
                : 'px-1.5 m-2 font-semibold',
              data.hasNavLink && mutedHoverButtonClass,
            ]
          : (data.isToday && data.dayNumberText && !data.inPopover)
              ? [
                  'group m-2 outline-none',
                  data.isNarrow ? 'h-6' : 'h-8'
                ]
              : [
                  'rounded-sm',
                  data.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : [
                        'mx-2 h-6 px-1.5',
                        data.isNarrow ? 'my-2' : 'my-3'
                      ],
                  data.hasNavLink && mutedHoverButtonClass,
                ],
      )}
      dayHeaderContent={(data) => (
        (!data.dayNumberText && !data.inPopover) ? (
          <>{data.text}</>
        ) : (
          <>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={cn(
                  'whitespace-pre',
                  data.isNarrow ? 'text-xs' : 'text-sm',
                  textPart.type === 'day'
                    ? [
                        'flex flex-row items-center',
                        !data.isNarrow && 'font-semibold',
                        (data.isToday && !data.inPopover) && [
                          'mx-0.5 rounded-full justify-center bg-primary text-primary-foreground',
                          data.isNarrow ? 'size-6' : 'size-8',
                          data.hasNavLink && 'group-hover:bg-primary/90 group-focus-visible:outline-3 outline-ring/50',
                        ],
                      ]
                    : 'text-muted-foreground',
                )}
              >{textPart.value}</span>
            ))}
          </>
        )
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => cn(
        'border',
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-foreground/3',
      )}
      dayCellTopClass={(data) => cn(
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row',
      )}
      dayCellTopInnerClass={(data) => cn(
        'flex flex-row items-center justify-center whitespace-nowrap',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-xs',
        data.isToday
          ? [
              'rounded-full font-semibold',
              data.isNarrow
                ? 'ms-px'
                : 'ms-1',
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
              (data.isOther || !data.monthText) && 'text-muted-foreground',
              data.monthText && 'font-bold',
            ],
      )}
      dayCellInnerClass={(data) => cn(data.inPopover && 'p-2')}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55"
      popoverCloseClass={`group absolute top-2 end-2 p-0.5 rounded-sm ${mutedHoverButtonClass}`}
      popoverCloseContent={() => (
        <XIcon className={`size-5 ${mutedFgPressableGroupClass}`} />
      )}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => cn(
        'border',
        data.isMajor && 'border-foreground/20',
        data.isDisabled && 'bg-foreground/3',
      )}
      dayLaneInnerClass={(data) => cn(
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'mx-1'
      )}
      slotLaneClass={(data) => cn(
        'border',
        data.isMinor && 'border-dotted',
      )}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDaysClass="my-10 mx-auto w-full max-w-218 px-4"
      listDayClass="not-last:border-b flex flex-row items-start gap-2"
      listDayHeaderClass="my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start"
      listDayHeaderInnerClass={(data) => cn(
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !data.level
          ? [
              data.isToday
                ? [
                    'font-semibold bg-primary text-primary-foreground',
                    data.hasNavLink && 'hover:bg-primary/90',
                  ]
                : [
                    'font-medium',
                    data.hasNavLink && 'hover:bg-foreground/5',
                  ]
            ]
          : [
              'text-muted-foreground',
              data.hasNavLink && 'hover:bg-foreground/5 hover:text-muted-foreground',
            ]
      )}
      listDayEventsClass="my-4 grow min-w-0 border rounded-md"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => cn(
        data.isSticky && 'bg-background border-b',
        data.colCount > 1 ? 'pb-1' : 'py-1',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(data) => cn(
        'py-1 px-2 rounded-md text-sm font-semibold',
        data.hasNavLink && 'hover:bg-foreground/5',
      )}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      fillerClass="border"
      dayNarrowWidth={100}
      dayHeaderRowClass="border"
      dayRowClass="border"
      slotHeaderRowClass="border"
      slotHeaderInnerClass="text-muted-foreground uppercase"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass="focus-visible:outline-3 outline-ring/50"
      inlineWeekNumberClass={(data) => cn(
        'absolute top-0 end-0 bg-background text-muted-foreground whitespace-nowrap rounded-es-md border-b border-b-foreground/20 border-s hover:bg-foreground/5',
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        data.hasNavLink && '-outline-offset-1',
      )}
      highlightClass="bg-primary/10"
      nonBusinessClass="bg-foreground/3"
      nowIndicatorLineClass="-m-px border-1 border-destructive"
      nowIndicatorDotClass="-m-[6px] border-6 border-destructive size-0 rounded-full ring-2 ring-background"

      /* View-Specific Options
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
          dayHeaderDividerClass: (data) => cn(data.isSticky && 'border-b border-foreground/20 shadow-sm'),
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableHeaderClass: (data) => cn(data.isSticky && 'bg-background'),
          tableBodyClass: 'border rounded-md shadow-xs overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getMutedDayHeaderBorderClass,
          dayHeaderDividerClass: (data) => cn(
            'border-b',
            !data.options.allDaySlot && 'border-foreground/20 shadow-sm',
          ),
          dayCellClass: getMutedDayCellBorderColorClass,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => cn(
            'm-1.5 h-6 px-1.5 text-muted-foreground rounded-sm flex flex-row items-center',
            data.hasNavLink && 'hover:bg-foreground/5',
            data.isNarrow ? 'text-xs' : 'text-sm',
          ),

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => cn(
            'p-3 text-muted-foreground',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ),
          allDayDividerClass: 'border-b border-foreground/20 shadow-sm',

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => cn(
            'relative px-3 py-2',
            data.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            data.isFirst && 'hidden',
          ),
          slotHeaderDividerClass: 'border-e',

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => cn(
            'group not-last:border-b p-4 items-center gap-3 hover:bg-muted/50',
            data.isInteractive && 'focus-visible:bg-muted/50',
          ),
          listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full',
          listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-muted-foreground',
          listItemEventTitleClass: (data) => cn(
            'grow min-w-0 font-medium whitespace-nowrap overflow-hidden',
            data.event.url && 'group-hover:underline',
          ),

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

