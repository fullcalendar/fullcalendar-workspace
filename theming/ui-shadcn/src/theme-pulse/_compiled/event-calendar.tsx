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

const tallDayCellBottomClass = 'min-h-3'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-0.5'
)

export const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  --------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-0.5' : 'mx-1',
    data.isSelected
      ? 'bg-foreground/5'
      : data.isInteractive
        ? 'hover:bg-foreground/5'
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
    'order-1 whitespace-nowrap overflow-hidden shrink-1',
  ],
  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'font-medium whitespace-nowrap overflow-hidden shrink-100',
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
    'mb-px border rounded-sm',
    data.isNarrow
      ? 'mx-0.5 border-primary hover:bg-foreground/5'
      : 'self-start mx-1 border-transparent bg-foreground/5 hover:bg-foreground/10',
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
  ],
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
  const borderlessBottom = restOptions.borderlessBottom ?? restOptions.borderless

  return (
    <div
      className={cn(className, 'flex flex-col gap-6')}
      style={{ height }}
      dir={direction === 'rtl' ? 'rtl' : undefined}
    >
      <EventCalendarToolbar
        className={borderlessX ? 'px-3' : ''}
        controller={controller}
        availableViews={availableViews}
        addButton={addButton}
      />
      <div className='grow min-h-0'>
        <EventCalendarView
          className={cn(
            'bg-background border-t',
            !borderlessX && !borderlessBottom && 'rounded-sm overflow-hidden',
            !borderlessX && 'border-x',
            !borderlessBottom && 'border-b',
          )}
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
              data.isDragging && 'shadow-lg',
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
        (data.isNarrow || data.isShort)
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventTitleClass=''
      listItemEventTimeClass='text-muted-foreground'

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ]}
      blockEventInnerClass='text-(--fc-event-contrast-color) print:text-black'
      blockEventTimeClass='whitespace-nowrap overflow-hidden shrink-1'
      blockEventTitleClass='whitespace-nowrap overflow-hidden shrink-100'

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && 'rounded-s-sm border-s',
        data.isEnd && 'rounded-e-sm border-e',
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
      rowEventTimeClass={(data) => (
        data.isNarrow ? 'ps-0.5' : 'ps-1'
      )}
      rowEventTitleClass={(data) => [
        data.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      ]}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => [
        'border-x ring ring-background',
        data.isStart && cn('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-0.5'),
        data.isEnd && cn('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-0.5'),
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
          : cn(
              'flex-col',
              data.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (data.isNarrow || data.isShort) ? xxsTextClass : 'text-xs',
      ]}
      columnEventTimeClass={(data) => (
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'
      columnMoreLinkClass={[
        'my-0.5 border border-transparent print:border-black rounded-md',
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

      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover ? 'border-b bg-foreground/5' :
          data.isMajor && 'border border-foreground/20',
      ]}
      dayHeaderInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow ? 'text-xs' : 'text-sm',
        data.inPopover ? cn(
          'm-1.5 px-1 py-0.5 rounded-sm font-semibold',
          data.hasNavLink && 'hover:bg-foreground/5',
        ) : !data.dayNumberText ? cn(
          'mx-0.5 my-1.5 py-0.5 px-1.5 rounded-sm',
          'text-muted-foreground',
          data.hasNavLink && 'hover:bg-foreground/5',
        ) : !data.isToday ? cn(
          'mx-2 my-2.5 h-6 px-1.5 rounded-sm',
          'text-muted-foreground',
          data.hasNavLink && 'hover:bg-foreground/5',
        ) : (
          'group mx-2 my-2 h-7 outline-none'
        )
      ]}
      dayHeaderContent={(data) => (
        (data.inPopover || !data.dayNumberText || !data.isToday) ? (
          <>{data.text}</>
        ) : (
          <>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={cn(
                  'whitespace-pre',
                  (textPart.type === 'day' && data.isToday)
                    ? cn(
                        'first:-ms-1 last:-me-1 size-7 rounded-full font-semibold',
                        'flex flex-row items-center justify-center',
                        data.hasNavLink
                          ? cn(
                              'bg-primary/20 dark:bg-primary/30 group-hover:bg-primary/40',
                              'group-focus-visible:outline-3',
                              '-outline-offset-1',
                              'outline-ring/50',
                            )
                          : 'bg-primary/20 dark:bg-primary/30',
                      )
                    : 'text-muted-foreground',
                )}
              >{textPart.value}</span>
            ))}
          </>
        )
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        data.isMajor
          ? 'border-foreground/20'
          : '',
      ]}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row justify-end',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !data.isToday
          ? cn(
              'rounded-s-sm whitespace-nowrap',
              !data.isOther && 'font-semibold',
              data.isNarrow ? 'px-1' : 'px-2',
              data.monthText ? '' : 'text-muted-foreground',
              data.hasNavLink && 'hover:bg-foreground/5',
            )
          : cn(
              'group outline-none',
              data.isNarrow
                ? 'mx-px'
                : 'mx-2',
            )
      ]}
      dayCellTopContent={(data) => (
        !data.isToday ? (
          <>{data.text}</>
        ) : (
          <>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={cn(
                  'whitespace-pre',
                  (textPart.type === 'day' && data.isToday)
                    ? cn(
                        'rounded-full font-semibold',
                        'flex flex-row items-center justify-center',
                        data.isNarrow
                          ? 'size-5'
                          : 'size-6 first:-ms-1 last:-me-1',
                        data.hasNavLink
                          ? cn(
                              'bg-primary/20 dark:bg-primary/30 group-hover:bg-primary/40',
                              'group-focus-visible:outline-3',
                              '-outline-offset-1',
                              'outline-ring/50',
                            )
                          : 'bg-primary/20 dark:bg-primary/30',
                      )
                    : (data.monthText ? '' : 'text-muted-foreground'),
                )}
              >{textPart.value}</span>
            ))}
          </>
        )
      )}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass='border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground min-w-55'
      popoverCloseClass={[
        'group absolute top-1.5 end-1.5 p-0.5 rounded-sm',
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
          : data.isNarrow ? 'mx-px' : 'mx-0.5'
      )}
      slotLaneClass={(data) => [
        'border',
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass='group/day flex flex-col'
      listDayHeaderClass={[
        'border-b bg-[color-mix(in_oklab,var(--foreground)_3%,var(--background))]',
        'flex flex-row items-center justify-between',
      ]}
      listDayHeaderInnerClass={(data) => [
        'm-1.5 px-1.5 py-0.5 rounded-sm text-sm',
        !data.level && 'font-semibold',
        (!data.level && data.isToday)
          ? data.hasNavLink
              ? 'bg-primary/20 dark:bg-primary/30 hover:bg-primary/40 focus-visible:outline-3 -outline-offset-1 outline-ring/50'
              : 'bg-primary/20 dark:bg-primary/30'
          : data.hasNavLink && 'hover:bg-foreground/5',
      ]}
      listDayEventsClass='group-not-last/day:border-b px-1.5 py-2 gap-2'

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass='m-3'
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'border-b bg-background',
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-1.5 py-0.5 rounded-sm font-semibold',
        data.hasNavLink && 'hover:bg-foreground/5',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-background'}
      fillerClass='border opacity-50'
      dayNarrowWidth={100}
      dayHeaderRowClass='border'
      dayRowClass='border'
      slotHeaderRowClass='border'
      slotHeaderInnerClass='text-muted-foreground'

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        'focus-visible:outline-3',
        'outline-ring/50',
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute start-0 whitespace-nowrap rounded-e-sm',
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink && 'hover:bg-foreground/5',
        'text-muted-foreground',
      ]}
      highlightClass='bg-primary/10'
      nonBusinessClass='bg-foreground/3'
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
          dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: 'border-b',
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: (data) => data.isSticky && 'border-b',
          dayCellBottomClass: getShortDayCellBottomClass,
          viewClass: 'bg-foreground/3',
          tableBodyClass: 'border bg-background rounded-sm overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? ''
              : 'border-foreground/20 shadow-sm'
          ],
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'mx-0.5 h-6 px-1.5 text-muted-foreground flex flex-row items-center rounded-sm',
            data.isNarrow ? 'text-xs' : 'text-sm',
            data.hasNavLink && 'hover:bg-foreground/5',
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => [
            'p-2 text-muted-foreground',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: 'border-b border-foreground/20 shadow-sm',

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'relative p-2',
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
            'group py-1 rounded-sm',
            data.isInteractive
              ? 'hover:bg-muted/50 focus-visible:bg-muted/50 -outline-offset-3'
              : 'hover:bg-muted/50',
          ],
          listItemEventBeforeClass: 'w-1.5 bg-(--fc-event-color) rounded-full',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: [
            '-order-1 shrink-0 w-1/2 max-w-60 px-4 py-2',
            'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
          ],
          listItemEventTitleClass: (data) => [
            'grow min-w-0 px-4 py-2 whitespace-nowrap overflow-hidden text-sm',
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

