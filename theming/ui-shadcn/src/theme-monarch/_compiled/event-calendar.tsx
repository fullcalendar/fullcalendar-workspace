import React from 'react'
import { CalendarController, CalendarOptions, DayCellData } from '@fullcalendar/core'
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

const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-background rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

export const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  --------------------------------------------------------------------------------------------- */

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
  --------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && 'ms-px',
    data.isEnd && 'me-px',
  ],
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  --------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? 'mx-px border-primary'
      : 'mx-0.5 border-transparent',
    'hover:bg-foreground/5',
  ],
  rowMoreLinkInnerClass: (data) => (
    data.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
  ),
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
        'flex flex-col',
        'bg-background',
        !borderlessX && !borderlessTop && !borderlessBottom && 'rounded-lg overflow-hidden',
        !borderlessX && 'border-x',
        !borderlessTop && 'border-t',
        !borderlessBottom && 'border-b',
      )}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className='p-4'
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
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
      <div className='flex items-center shrink-0 gap-3'>
        {addButton && (
          <Button
            onClick={addButton.click as any}
            aria-label={addButton.hint}
          >{addButton.text}</Button>
        )}
        <Button
          onClick={() => controller.today()}
          aria-label={buttons.today.hint}
          variant='outline'
        >{buttons.today.text}</Button>
        <div className='flex items-center'>
          <Button
            onClick={() => controller.prev()}
            disabled={buttons.prev.isDisabled}
            aria-label={buttons.prev.hint}
            variant='ghost'
            size='icon'
          >
            <ChevronLeftIcon className='[[dir=rtl]_&]:rotate-180' />
          </Button>
          <Button
            onClick={() => controller.next()}
            disabled={buttons.next.isDisabled}
            aria-label={buttons.next.hint}
            variant='ghost'
            size='icon'
          >
            <ChevronRightIcon className='[[dir=rtl]_&]:rotate-180' />
          </Button>
        </div>
        <div className='text-xl'>{controller.view?.title}</div>
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
      eventColor='var(--primary)'
      eventContrastColor='var(--primary-foreground)'
      eventClass={(data) => [
        data.isSelected
          ? cn(
              'outline-3',
              data.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : 'focus-visible:outline-3',
        'outline-ring/50',
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor='var(--foreground)'
      backgroundEventClass='bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'
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
          ? 'bg-foreground/5'
          : data.isInteractive
            ? 'hover:bg-foreground/5'
            : 'hover:bg-foreground/5',
      ]}
      listItemEventBeforeClass='rounded-full border-(--fc-event-color)'
      listItemEventInnerClass='flex flex-row items-center'

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative',
        'border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!data.isSelected && data.isDragging) && 'opacity-75',
      ]}
      blockEventInnerClass='text-(--fc-event-contrast-color) print:text-black'
      blockEventTimeClass='whitespace-nowrap overflow-hidden'
      blockEventTitleClass='whitespace-nowrap overflow-hidden'

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
        ) : <></> // HACK for React vdom
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
        ) : <></> // HACK for React vdom
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
        'border-x ring ring-background',
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
          : cn(
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
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'
      columnMoreLinkClass={[
        'mb-px border border-transparent print:border-black rounded-sm',
        'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))] hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))] print:bg-white',
        'ring ring-background',
      ]}
      columnMoreLinkInnerClass={(data) => (
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign='center'
      dayHeaderClass={(data) => [
        'justify-center',
        data.isMajor && 'border border-foreground/20',
        (data.isDisabled && !data.inPopover) && 'bg-foreground/3',
      ]}
      dayHeaderInnerClass='group mt-2 mx-2 flex flex-col items-center outline-none'
      dayHeaderContent={(data) => (
        <>
          {data.weekdayText && (
            <div
              className={cn(
                'text-xs uppercase',
                'text-muted-foreground',
              )}
            >{data.weekdayText}</div>
          )}
          {data.dayNumberText && (
            <div
              className={cn(
                'm-0.5 rounded-full flex flex-row items-center justify-center',
                data.isNarrow
                  ? 'size-7 text-md'
                  : 'size-8 text-lg',
                data.isToday
                  ? (data.hasNavLink ? 'bg-primary/20 dark:bg-primary/30 group-hover:bg-primary/40' : 'bg-primary/20 dark:bg-primary/30')
                  : (data.hasNavLink && 'hover:bg-foreground/5'),
                data.hasNavLink && cn(
                  'group-focus-visible:outline-3',
                  'outline-ring/50',
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
        data.isMajor ? 'border-foreground/20' : '',
        data.isDisabled && 'bg-foreground/3',
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
          ? (data.hasNavLink ? 'bg-primary/20 dark:bg-primary/30 hover:bg-primary/40 focus-visible:outline-3 outline-ring/50' : 'bg-primary/20 dark:bg-primary/30')
          : (data.hasNavLink && 'hover:bg-foreground/5'),
        data.isOther && 'text-muted-foreground',
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat={{ day: 'numeric', weekday: 'short' }}
      popoverClass='border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-60'
      popoverCloseClass={[
        'group absolute top-2 end-2 size-8 rounded-full',
        'items-center justify-center',
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
      slotLaneClass={(data) => [
        'border',
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayFormat={{ day: 'numeric' }}
      listDaySideFormat={{ month: 'short', weekday: 'short', forceCommas: true }}
      listDayClass='not-last:border-b flex flex-row items-start'
      listDayHeaderClass='m-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2'
      listDayHeaderInnerClass={(data) => (
        !data.level
          ? cn(
              'h-9 rounded-full flex flex-row items-center text-lg',
              data.text === data.dayNumberText
                ? 'w-9 justify-center'
                : 'px-3',
              data.isToday
                ? (data.hasNavLink ? 'bg-primary/20 dark:bg-primary/30 hover:bg-primary/40 focus-visible:outline-3 outline-ring/50' : 'bg-primary/20 dark:bg-primary/30')
                : (data.hasNavLink && 'hover:bg-foreground/5')
            )
          : cn(
              'text-xs uppercase',
              data.hasNavLink && 'hover:underline',
            )
      )}
      listDayEventsClass='grow min-w-0 py-2 gap-1'

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass='m-4'
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'border-b bg-background',
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-3 py-1 rounded-full font-bold',
        data.hasNavLink && 'hover:bg-foreground/5',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => (
        data.isSticky && 'border-b bg-background'
      )}
      fillerClass={(data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : '',
      ]}
      dayNarrowWidth={100}
      dayHeaderRowClass='border'
      dayRowClass='border'

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute flex flex-row items-center whitespace-nowrap',
        data.isNarrow
          ? `top-0.5 start-0 my-px h-4 pe-1 rounded-e-full ${xxsTextClass}`
          : 'top-1.5 start-1 h-6 px-2 rounded-full text-sm',
        data.hasNavLink
          ? 'bg-foreground/10 hover:bg-foreground/20 focus-visible:outline-3 outline-ring/50'
          : 'bg-foreground/10',
      ]}
      nonBusinessClass='bg-foreground/3'
      highlightClass='bg-primary/10'
      nowIndicatorLineClass='-m-px border-1 border-destructive'
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
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableBodyClass: 'border rounded-sm',
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
              ? 'bg-foreground/10 hover:bg-foreground/20 focus-visible:outline-3 outline-ring/50'
              : 'bg-foreground/10',
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'p-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          allDayDividerClass: 'border-b',

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: (data) => [
            'w-2 self-end justify-end',
            'border',
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
              : '',
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

