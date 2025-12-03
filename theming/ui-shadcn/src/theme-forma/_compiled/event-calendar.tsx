import React from 'react'
import { CalendarOptions, DayCellData } from '@fullcalendar/core'
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

const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

export const eventCalendarPlugins = [
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  interactionPlugin,
  multiMonthPlugin,
]

const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) rounded-full bg-background'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

const getSlotClass = (data: { isMinor: boolean }) => cn(
  'border',
  data.isMinor && 'border-dotted',
)

const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  --------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-px' : 'mx-0.5',
    data.isSelected
      ? 'bg-foreground/5'
      : data.isInteractive
        ? 'hover:bg-foreground/5'
        : 'hover:bg-foreground/5',
  ],
  listItemEventBeforeClass: (data) => [
    'border-4 border-(--fc-event-color) rounded-full',
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
  --------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => data.isEnd && (data.isNarrow ? 'me-px' : 'me-0.5'),
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  --------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? 'mx-px border-primary'
      : 'mx-0.5 border-transparent self-start',
    'hover:bg-foreground/5',
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
  ],
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
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-sm overflow-hidden shadow-xs',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className="border-b p-3"
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

export function EventCalendarToolbar({
  className,
  controller,
  availableViews,
  addButton,
}: {
  className?: string
  controller: ReturnType<typeof useCalendarController>
  availableViews: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}) {
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
      eventContrastColor="var(--primary-foreground)"
      eventClass={(data) => [
        data.isSelected
          ? cn(
              'outline-3',
              data.isDragging && 'shadow-lg',
            )
          : 'focus-visible:outline-3',
        'outline-ring/50',
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--foreground)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]"
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass="items-center"
      listItemEventInnerClass="flex flex-row items-center"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative border-(--fc-event-color) print:bg-white',
        data.isInteractive
          ? 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))] hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]'
          : 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]',
        (data.isDragging && !data.isSelected) && 'opacity-75',
        '-outline-offset-3',
      ]}
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px not-print:py-px print:border-y items-center',
        data.isStart && 'border-s-6 rounded-s-sm',
        data.isEnd && 'not-print:pe-px print:border-e rounded-e-sm',
      ]}
      rowEventBeforeClass={(data) => (
        data.isStartResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-2',
        ] : (!data.isStart && !data.isNarrow) && [
          'ms-1 size-2 border-t-1 border-s-1 border-muted-foreground',
          '-rotate-45 [[dir=rtl]_&]:rotate-45',
        ]
      )}
      rowEventAfterClass={(data) => (
        data.isEndResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ] : (!data.isEnd && !data.isNarrow) && [
          'me-1 size-2 border-t-1 border-e-1 border-muted-foreground',
          'rotate-45 [[dir=rtl]_&]:-rotate-45',
        ]
      )}
      rowEventInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ]}
      rowEventTimeClass={(data) => [
        'font-medium',
        data.isNarrow ? 'ps-0.5' : 'ps-1',
      ]}
      rowEventTitleClass={(data) => (
        data.isNarrow ? 'px-0.5' : 'px-1'
      )}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => [
        'border-s-6 not-print:pe-px print:border-e',
        data.isStart && 'not-print:pt-px print:border-t rounded-t-sm',
        data.isEnd && 'mb-px not-print:pb-px print:border-b rounded-b-sm',
        'ring ring-background',
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
          : cn('flex-col', data.isNarrow ? 'px-0.5' : 'px-1')
      ]}
      columnEventTimeClass={(data) => [
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1'),
        xxsTextClass,
      ]}
      columnEventTitleClass={(data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={[
        'mb-px border border-transparent print:border-black rounded-sm',
        'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
        'ring ring-background',
        '-outline-offset-3',
      ]}
      columnMoreLinkInnerClass={(data) => (
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.isNarrow ? 'center' : 'start'}
      dayHeaderClass={(data) => [
        'justify-center',
        data.isToday && !data.level && 'relative',
        data.isDisabled && 'bg-foreground/3',
        data.inPopover
          ? cn('border-b', 'bg-foreground/5')
          : cn(
              data.isMajor ? 'border border-foreground/20' :
                !data.isNarrow && 'border',
            ),
      ]}
      dayHeaderInnerClass={(data) => [
        data.isToday && data.level && 'relative',
        'p-2 flex flex-col',
        data.hasNavLink && cn(
          'hover:bg-foreground/5',
          '-outline-offset-3',
        )
      ]}
      dayHeaderContent={(data) => (
        <React.Fragment>
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
        </React.Fragment>
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        data.isMajor ? 'border-foreground/20' : '',
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-foreground/3',
      ]}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row',
        ((data.isOther || data.isDisabled) && data.options.businessHours) && 'text-muted-foreground',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center justify-center whitespace-nowrap',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        data.isToday
          ? cn(
              'rounded-full',
              data.isNarrow ? 'ms-px' : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6')
                : (data.isNarrow ? 'px-1' : 'px-2'),
              data.hasNavLink
                ? cn('bg-primary text-primary-foreground hover:bg-primary/90', '')
                : 'bg-primary text-primary-foreground',
            )
          : cn(
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && 'hover:bg-foreground/5',
            ),
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat={{ day: 'numeric', weekday: 'long' }}
      popoverClass="border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55"
      popoverCloseClass={[
        'group absolute top-1 end-1 p-1 rounded-sm',
        'hover:bg-foreground/5',
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      popoverCloseContent={() => (
        <XIcon className={`size-5 ${mutedFgPressableGroupClass}`} />
      )}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-foreground/20' : '',
        data.isDisabled && 'bg-foreground/3',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={getSlotClass}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass="not-last:border-b flex flex-row items-start"
      listDayHeaderClass={(data) => [
        'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
        data.isToday && 'border-s-4 border-primary',
      ]}
      listDayHeaderInnerClass={(data) => [
        'my-0.5',
        !data.level
          ? cn('text-lg', data.isToday && 'font-bold')
          : 'text-xs',
        data.hasNavLink && 'hover:underline',
      ]}
      listDayEventsClass="grow min-w-0 p-4 gap-4"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.colCount > 1 ? 'pb-4' : 'py-2',
        data.isSticky && 'border-b bg-background',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-1 rounded-sm font-bold',
        data.hasNavLink && 'hover:bg-foreground/5',
        !data.isNarrow && 'text-lg',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-background'}
      fillerClass="border opacity-50"
      dayNarrowWidth={100}
      dayHeaderRowClass="border"
      dayRowClass="border"
      slotHeaderRowClass="border"
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute end-0 whitespace-nowrap rounded-s-sm',
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink
          ? 'bg-foreground/5 hover:bg-foreground/10'
          : 'bg-foreground/5',
      ]}
      nonBusinessClass="bg-foreground/3"
      highlightClass="bg-primary/10"
      nowIndicatorLineClass="-m-px border-1 border-destructive"
      nowIndicatorDotClass={[
        '-m-[6px] border-6 border-destructive size-0 rounded-full',
        'ring-2 ring-background',
      ]}

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

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
          dayHeaderDividerClass: (data) => data.isSticky && 'border-b',
          dayCellBottomClass: getShortDayCellBottomClass,
          dayHeaderInnerClass: (data) => data.isNarrow && 'text-muted-foreground',
          tableBodyClass: 'border rounded-sm overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: 'border-b',
          dayCellBottomClass: tallDayCellBottomClass,
          dayHeaderAlign: 'start',

          /* TimeGrid > Week Number Header
          ----------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-end justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'm-1 p-1 rounded-sm text-xs',
            data.hasNavLink && 'hover:bg-foreground/5',
          ],

          /* TimeGrid > All-Day Header
          ----------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'p-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: 'border-b',

          /* TimeGrid > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'p-2',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          slotHeaderDividerClass: 'border-e',

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          ----------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            'group border-s-6 border-(--fc-event-color) p-3 rounded-sm',
            data.isInteractive
              ? 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))] hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]'
              : 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]',
          ],
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (data) => [
            'grow min-w-0 whitespace-nowrap overflow-hidden font-semibold',
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

