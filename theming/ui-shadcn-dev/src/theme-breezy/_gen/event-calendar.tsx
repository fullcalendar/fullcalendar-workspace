import React from 'react'
import { CalendarOptions } from "@fullcalendar/core"
import { useCalendarController } from "@fullcalendar/react"
import FullCalendar from '@fullcalendar/react'
import { CalendarController } from '@fullcalendar/core'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { Button } from '../../ui/button.js'
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs.js'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'
import { cn, ClassValue } from '../../lib/utils.js'

import '@fullcalendar/core/global.css'

const eventCalendarPlugins = [
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

// outline
export const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
export const outlineColorClass = 'outline-ring/50'

// stronger (13%)
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--foreground)_13%,var(--background))]'

// strong (10%)
const strongBgHoverClass = 'hover:bg-foreground/10'
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--foreground)_10%,var(--background))]'
export const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass}`

// muted (5% - simulates a semi-transparent version of bg-muted)
export const mutedBgClass = 'bg-foreground/5'
const mutedBgHoverClass = 'hover:bg-foreground/5'

// faint (50% of bg-muted)
const faintBgHoverClass = 'hover:bg-muted/50'
const faintBgFocusClass = 'focus-visible:bg-muted/50'

// primary
const primaryClass = 'bg-primary text-(--primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-primary/90`
const primaryPressableGroupClass = `${primaryClass} group-hover:bg-primary/90`

// event content
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,var(--background))]'
const eventFaintPressableClass = cn(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--background))]',
)
const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--foreground))]'
const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_10%,transparent)]'

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-muted-foreground group-hover:text-foreground group-focus-visible:text-foreground'

const xxsTextClass = 'text-[0.6875rem] leading-normal'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) bg-background rounded-full`
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const mutedHoverButtonClass = cn(
  `${mutedBgClass} ${strongBgHoverClass}`,
  outlineWidthFocusClass,
  outlineColorClass,
)

export interface EventCalendarProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: ClassValue
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
        className='border-b p-4 bg-sidebar text-sidebar-foreground'
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

      eventClass={(data) => [
        data.isSelected
          ? cn(
              outlineWidthClass,
              data.isDragging && 'shadow-md',
            )
          : outlineWidthFocusClass,
        outlineColorClass,
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
        '',
      ]}

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative',
        data.isInteractive
          ? eventFaintPressableClass
          : eventFaintBgClass,
        'print:bg-white',
        'border-transparent print:border-(--fc-event-color)',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ]}

      blockEventInnerClass={eventMutedFgClass}
      blockEventTimeClass='whitespace-nowrap overflow-hidden shrink-1' // shrinks second
      blockEventTitleClass='whitespace-nowrap overflow-hidden shrink-100' // shrinks first

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && cn('border-s', data.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
        data.isEnd && cn('border-e', data.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
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
        `border-x ring ring-background`,
        data.isStart && cn('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-1'),
        data.isEnd && cn('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-1'),
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
          ? 'flex-row items-center gap-1 p-1' // one line
          : cn( // two lines
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
        outlineWidthFocusClass,
        outlineColorClass,
      ]}
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'

      columnMoreLinkClass={(data) => [
        data.isNarrow ? 'my-px' : 'my-1',
        'border border-transparent print:border-black rounded-md',
        `${strongSolidPressableClass} print:bg-white`,
        `ring ring-background`,
      ]}
      columnMoreLinkInnerClass={(data) => [
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        '',
      ]}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}

      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover && `border rounded-md overflow-hidden shadow-lg m-1 bg-popover text-popover-foreground border-b ${mutedBgClass}`,
      ]}

      dayHeaderInnerClass={(data) => [
        'flex flex-row items-center',
        (!data.dayNumberText && !data.inPopover)
          ? cn(
              'py-1 rounded-sm text-xs',
              data.isNarrow
                ? `px-1 m-1 text-muted-foreground`
                : `px-1.5 m-2 font-semibold `,
              data.hasNavLink && mutedHoverButtonClass,
            )
          : (data.isToday && data.dayNumberText && !data.inPopover)
              ? cn(
                  'group m-2 outline-none',
                  data.isNarrow ? 'h-6' : 'h-8'
                )
              : cn(
                  'rounded-sm',
                  data.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : cn(
                        'mx-2 h-6 px-1.5',
                        data.isNarrow ? 'my-2' : 'my-3'
                      ),
                  data.hasNavLink && mutedHoverButtonClass,
                ),
      ]}

      dayHeaderContent={(data) => (
        (!data.dayNumberText && !data.inPopover) ? (
          // small uniform text
          <React.Fragment>{data.text}</React.Fragment>
        ) : (
          // normal-sized varying-color text (needs 'group')
          <React.Fragment>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={cn(
                  'whitespace-pre',
                  data.isNarrow ? 'text-xs' : 'text-sm',
                  textPart.type === 'day'
                    ? cn(
                        'flex flex-row items-center', // v-align
                        !data.isNarrow && 'font-semibold',
                        (data.isToday && !data.inPopover)
                          // day-number circle
                          ? cn(
                              'mx-0.5 rounded-full justify-center',
                              data.isNarrow ? 'size-6' : 'size-8',
                              data.hasNavLink
                                ? cn(
                                    primaryPressableGroupClass,
                                    outlineWidthGroupFocusClass,
                                    '',
                                    outlineColorClass,
                                  )
                                : primaryClass,
                            )
                          // day-number emphasized text
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
        // don't display bg-color for other-month/disabled cells when businessHours is doing the same
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
          // primary-colored circle or pill
          ? cn(
              'rounded-full font-semibold',
              data.isNarrow
                ? 'ms-px'
                : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6') // circle
                : (data.isNarrow ? 'px-1' : 'px-2'), // pill
              data.hasNavLink
                ? cn(primaryPressableClass, '')
                : primaryClass,
            )
          // half-rounded-ghost-button
          : cn(
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && `${mutedBgClass} ${strongBgHoverClass}`,
              data.isOther
                ? 'text-muted-foreground'
                : (data.monthText ? '' : 'text-muted-foreground'),
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
        data.isMajor ? 'border-foreground/20' : 'border-muted-foreground',
        data.isDisabled && 'bg-foreground/3',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'mx-1'
      )}

      slotLaneClass={(data) => [
        `border border-muted-foreground`,
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      // contains multiple days
      listDaysClass='my-10 mx-auto w-full max-w-218 px-4'

      listDayClass={[
        `not-last:border-b border-muted-foreground`,
        'flex flex-row items-start gap-2',
      ]}

      listDayHeaderClass='my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start'
      listDayHeaderInnerClass={(data) => [
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !data.level
          // main title
          ? cn(
              data.isToday
                ? cn(
                    'font-semibold',
                    data.hasNavLink ? primaryPressableClass : primaryClass,
                  )
                : cn(
                    `font-medium `,
                    data.hasNavLink && `${mutedBgClass} ${strongBgHoverClass}`,
                  )
            )
          // subtitle
          : cn(
              'text-muted-foreground',
              data.hasNavLink && cn(
                `${mutedBgClass} ${strongBgHoverClass}`,
                'hover:text-muted-foreground',
              ),
            )
      ]}

      listDayEventsClass={`my-4 grow min-w-0 border  rounded-md`}

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass='m-4'

      singleMonthHeaderClass={(data) => [
        data.isSticky && `bg-background border-b `,
        data.colCount > 1 ? 'pb-1' : 'py-1',
        'items-center',
      ]}

      singleMonthHeaderInnerClass={(data) => [
        `py-1 px-2 rounded-md text-sm font-semibold `,
        data.hasNavLink && `${mutedBgClass} ${strongBgHoverClass}`,
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      fillerClass='border border-muted-foreground'

      dayNarrowWidth={100}
      dayHeaderRowClass='border border-muted-foreground'
      dayRowClass='border '

      slotHeaderRowClass='border '
      slotHeaderInnerClass='text-muted-foreground uppercase'

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        outlineColorClass,
      ]}

      inlineWeekNumberClass={(data) => [
        `absolute top-0 end-0 bg-background text-muted-foreground whitespace-nowrap rounded-es-md`,
        `border-b border-b-foreground/20`,
        `border-s `,
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        data.hasNavLink
          ? `${`${mutedBgClass} ${strongBgHoverClass}`} -outline-offset-1`
          : mutedBgHoverClass,
      ]}

      highlightClass='bg-primary/10'
      nonBusinessClass='bg-foreground/3'

      nowIndicatorLineClass='-m-px border-1 border-destructive'
      nowIndicatorDotClass={[
        `-m-[6px] border-6 border-destructive size-0 rounded-full`,
        `ring-2 ring-background`,
      ]}

      /* Day Row > List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass={(data) => [
        'mb-px p-px',
        data.isNarrow
          ? 'mx-px rounded-sm'
          : 'mx-1 rounded-md',
        data.isSelected
          ? mutedBgClass
          : data.isInteractive
            ? `${mutedBgClass} ${strongBgHoverClass}`
            : mutedBgHoverClass,
      ]}

      listItemEventInnerClass={(data) => [
        'flex flex-row items-center justify-between',
        data.isNarrow
          ? `py-px ${xxsTextClass}`
          : 'py-0.5 text-xs',
      ]}

      listItemEventTimeClass={(data) => [
        data.isNarrow ? 'px-px' : 'px-0.5',
        'text-muted-foreground',
        'order-1 whitespace-nowrap overflow-hidden shrink-1', // shrinks second
      ]}

      listItemEventTitleClass={(data) => [
        data.isNarrow ? 'px-px' : 'px-0.5',
        '',
        'font-medium whitespace-nowrap overflow-hidden shrink-100', // shrinks first
        data.timeText && 'text-ellipsis',
      ]}

      /* Day Row > More-Link
      ------------------------------------------------------------------------------------------- */

      rowMoreLinkClass={(data) => [
        'my-px',
        data.isNarrow
          ? `p-px ${xxsTextClass}`
          : 'p-0.5 text-xs',
        'border border-transparent rounded-sm',
        `${strongSolidPressableClass} print:bg-white`,
        '',
      ]}

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          dayHeaderClass: (data) => (
            !data.inPopover && (
              data.isMajor ? `border border-foreground/20` :
                !data.isNarrow && `border `
            )
          ),
          dayHeaderDividerClass: `border-b border-foreground/20`,
          dayCellClass: (data) => (
            data.isMajor ? 'border-foreground/20' : ''
          ),
          dayCellBottomClass: (data) => (
            !data.isNarrow && 'min-h-px'
          ),
          // day-numbers are on start-side, so move bg-event titles to end-side
          backgroundEventInnerClass: 'flex flex-row justify-end',
          ...userViews?.dayGrid,
        },
        multiMonth: {
          dayHeaderClass: (data) => (
            !data.inPopover && (
              data.isMajor ? `border border-foreground/20` :
                !data.isNarrow && `border `
            )
          ),
          dayHeaderDividerClass: (data) => data.isSticky && `border-b border-foreground/20 shadow-sm`,
          dayCellBottomClass: (data) => (
            !data.isNarrow && 'min-h-px'
          ),
          tableHeaderClass: (data) => data.isSticky && 'bg-background',
          tableBodyClass: `border  rounded-md shadow-xs overflow-hidden`,
          ...userViews?.multiMonth,
        },
        timeGrid: {
          dayHeaderClass: (data) => (
            !data.inPopover && (
              data.isMajor ? `border border-foreground/20` :
                !data.isNarrow && `border border-muted-foreground`
            )
          ),
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? ''
              : `border-foreground/20 shadow-sm`,
          ],
          dayCellClass: (data) => (
            data.isMajor ? 'border-foreground/20' : 'border-muted-foreground'
          ),
          dayCellBottomClass: 'min-h-3',

          /* TimeGrid > Week Number Header
          ----------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end', // v-align, h-align
          weekNumberHeaderInnerClass: (data) => [
            `m-1.5 h-6 px-1.5 text-muted-foreground rounded-sm flex flex-row items-center`,
            data.hasNavLink && `${mutedBgClass} ${strongBgHoverClass}`,
            data.isNarrow ? 'text-xs' : 'text-sm',
          ],

          /* TimeGrid > All-Day Header
          ----------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center', // v-align
          allDayHeaderInnerClass: (data) => [
            `p-3 text-muted-foreground`,
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],

          allDayDividerClass: `border-b border-foreground/20 shadow-sm`,

          /* TimeGrid > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end', // h-align
          slotHeaderInnerClass: (data) => [
            'relative px-3 py-2',
            data.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            data.isFirst && 'hidden',
          ],

          slotHeaderDividerClass: `border-e border-muted-foreground`,
          ...userViews?.timeGrid,
        },
        list: {
          /* List-View > List-Item Event
          ----------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            `group not-last:border-b border-muted-foreground p-4 items-center gap-3`,
            data.isInteractive
              ? `${faintBgHoverClass} ${faintBgFocusClass}`
              : faintBgHoverClass,
          ],

          listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full', // 8px diameter

          listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',

          listItemEventTimeClass: [
            'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis',
            'text-muted-foreground',
          ],

          listItemEventTitleClass: (data) => [
            'grow min-w-0 font-medium whitespace-nowrap overflow-hidden',
            '',
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

