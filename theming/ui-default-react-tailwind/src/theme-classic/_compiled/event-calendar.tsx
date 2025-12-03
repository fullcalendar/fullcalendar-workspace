import React from 'react'
import { CalendarOptions } from '@fullcalendar/core'
import { joinClassNames } from '@fullcalendar/core/internal'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'

export interface EventCalendarProps extends CalendarOptions {
  availableViews?: string[]
  addButton?: {
    isPrimary?: boolean
    text?: string
    hint?: string
    click?: (ev: MouseEvent) => void
  }
}

const eventCalendarPlugins = [
  interactionPlugin,
  dayGridPlugin,
  timeGridPlugin,
  listPlugin,
  multiMonthPlugin,
]

const eventCalendarAvailableViews = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
  'multiMonthYear',
]

// usually 11px font / 12px line-height
export const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

// neutral buttons
export const strongSolidPressableClass = '[background:linear-gradient(var(--fc-classic-strong),var(--fc-classic-strong))_var(--fc-classic-background)]'
const mutedHoverClass = 'hover:bg-(--fc-classic-muted)'
const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-classic-muted) active:bg-(--fc-classic-strong)`
const faintHoverClass = 'hover:bg-(--fc-classic-faint)'
const faintHoverPressableClass = `${faintHoverClass} focus-visible:bg-(--fc-classic-faint) active:bg-(--fc-classic-muted)`

const buttonIconClass = 'size-5'

// outline
const outlineWidthClass = 'outline-2'
export const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
export const primaryOutlineColorClass = 'outline-(--fc-classic-primary)'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-(--fc-classic-background) rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const getDayClass = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => joinClassNames(
  'border',
  data.isMajor ? 'border-(--fc-classic-strong-border)' : 'border-(--fc-classic-border)',
  data.isDisabled ? 'bg-(--fc-classic-faint)' :
    data.isToday && 'not-print:bg-(--fc-classic-today)',
)

const getSlotClass = (data: { isMinor: boolean }) => joinClassNames(
  'border border-(--fc-classic-border)',
  data.isMinor && 'border-dotted',
)

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  --------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-px' : 'mx-0.5',
    data.isSelected
      ? joinClassNames('bg-(--fc-classic-muted)', data.isDragging && 'shadow-sm')
      : (data.isInteractive ? mutedHoverPressableClass : mutedHoverClass),
  ],

  listItemEventBeforeClass: (data) => [
    'border-4',
    data.isNarrow ? 'mx-px' : 'mx-1',
  ],

  listItemEventInnerClass: (data) => [
    'flex flex-row items-center',
    'py-px gap-0.5',
    data.isNarrow ? xxsTextClass : 'text-xs',
  ],

  listItemEventTimeClass: 'px-px whitespace-nowrap overflow-hidden shrink-1',
  listItemEventTitleClass: 'px-px font-bold whitespace-nowrap overflow-hidden shrink-100',

  /* Day Row > Row Event
  --------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && joinClassNames('rounded-s-sm', data.isNarrow ? 'ms-px' : 'ms-0.5'),
    data.isEnd && joinClassNames('rounded-e-sm', data.isNarrow ? 'me-px' : 'me-0.5'),
  ],

  rowEventInnerClass: 'py-px gap-0.5',
  rowEventTimeClass: 'px-px',
  rowEventTitleClass: 'px-px',

  /* Day Row > More-Link
  --------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? 'mx-px border-(--fc-classic-primary)'
      : 'self-start mx-0.5 border-transparent',
    mutedHoverPressableClass,
  ],

  rowMoreLinkInnerClass: (data) => [
    'p-px',
    data.isNarrow ? xxsTextClass : 'text-xs',
  ],
}

export function EventCalendar({
  availableViews = eventCalendarAvailableViews,
  addButton,
  plugins: userPlugins,
  buttons: userButtons,
  views: userViews,
  ...restOptions
}: EventCalendarProps) {
  return (
    <FullCalendar
      plugins={[
        ...eventCalendarPlugins,
        ...(userPlugins || []),
      ]}
      initialView={availableViews[0]}
      className="gap-5"

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventColor="var(--fc-classic-event)"
      eventContrastColor="var(--fc-classic-event-contrast)"
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--fc-classic-background-event)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]"
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass="items-center"
      listItemEventBeforeClass="border-(--fc-event-color) rounded-full"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        (data.isDragging && !data.isSelected) && 'opacity-75',
        outlineOffsetClass,
      ]}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && 'border-s',
        data.isEnd && 'border-e',
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
      rowEventTimeClass="font-bold"

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => [
        'border-x',
        data.isStart && 'border-t rounded-t-sm',
        data.isEnd && 'mb-px border-b rounded-b-sm',
        'ring ring-(--fc-classic-background)',
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
          ? 'p-0.5 flex-row items-center gap-1'
          : 'px-0.5 flex-col',
      ]}
      columnEventTimeClass={(data) => [
        !data.isShort && 'pt-0.5',
        xxsTextClass,
      ]}
      columnEventTitleClass={(data) => [
        !data.isShort &&  'py-0.5',
        (data.isShort || data.isNarrow) ? xxsTextClass : 'text-xs',
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={[
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={[
        'mb-px rounded-sm border border-transparent print:border-black',
        `${strongSolidPressableClass} print:bg-white`,
        'ring ring-(--fc-classic-background)',
        outlineOffsetClass,
      ]}
      columnMoreLinkInnerClass={(data) => [
        'p-0.5',
        data.isNarrow ? xxsTextClass : 'text-xs',
      ]}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}
      dayHeaderClass={(data) => [
        'justify-center',
        data.isDisabled && 'bg-(--fc-classic-faint)',
        data.inPopover
          ? 'border-b border-(--fc-classic-border) bg-(--fc-classic-muted)'
          : joinClassNames(
              'border',
              data.isMajor ? 'border-(--fc-classic-strong-border)' : 'border-(--fc-classic-border)',
            ),
      ]}
      dayHeaderInnerClass={(data) => [
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ]}
      dayHeaderDividerClass="border-b border-(--fc-classic-border)"

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={getDayClass}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row justify-end',
      ]}
      dayCellTopInnerClass={(data) => [
        'px-1 whitespace-nowrap',
        data.isNarrow
          ? `py-0.5 ${xxsTextClass}`
          : 'py-1 text-sm',
        data.isOther && 'text-(--fc-classic-faint-foreground)',
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="bg-(--fc-classic-background) border border-(--fc-classic-border) shadow-md min-w-55"
      popoverCloseClass={[
        'group absolute top-0.5 end-0.5',
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      popoverCloseContent={() => x('size-5 text-sm not-group-hover:opacity-65')}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={getDayClass}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={getSlotClass}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayHeaderClass={[
        'border-b border-(--fc-classic-border) [background:linear-gradient(var(--fc-classic-muted),var(--fc-classic-muted))_var(--fc-classic-background)]',
        'flex flex-row items-center justify-between',
      ]}
      listDayHeaderInnerClass="px-3 py-2 text-sm font-bold"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.isSticky && 'border-b border-(--fc-classic-border) bg-(--fc-classic-background)',
        data.colCount > 1 ? 'pb-4' : 'py-2',
        'items-center',
      ]}
      singleMonthHeaderInnerClass="font-bold"

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-(--fc-classic-background)'}
      fillerClass="border border-(--fc-classic-border) opacity-50"
      dayHeaderRowClass="border border-(--fc-classic-border)"
      dayRowClass="border border-(--fc-classic-border)"
      slotHeaderRowClass="border border-(--fc-classic-border)"
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        'hover:underline',
        outlineWidthFocusClass,
        outlineInsetClass,
        primaryOutlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute top-0 start-0 rounded-ee-sm p-0.5 text-center',
        'text-(--fc-classic-muted-foreground)',
        'bg-(--fc-classic-muted)',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ]}
      nonBusinessClass="bg-(--fc-classic-faint)"
      highlightClass="bg-(--fc-classic-highlight)"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      viewClass="bg-(--fc-classic-background) border border-(--fc-classic-border)"

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today prev,next',
        center: 'title',
        end: availableViews.join(','),
      }}
      toolbarClass={(data) => [
        'flex flex-row flex-wrap items-center justify-between gap-3',
        data.borderlessX && 'px-3',
      ]}
      toolbarSectionClass="shrink-0 flex flex-row items-center gap-3"
      toolbarTitleClass="text-2xl font-bold"
      buttonGroupClass="flex flex-row items-center"
      buttonClass={(data) => [
        'py-2 border-x flex flex-row items-center',
        'focus-visible:outline-3 outline-slate-600/50',
        'hover:border-slate-900 active:border-slate-900 print:border-slate-900',
        'hover:bg-slate-800 active:bg-slate-800 print:bg-white',
        'text-sm text-white print:text-black',
        data.isIconOnly ? 'px-2.5' : 'px-3',
        data.inGroup
          ? 'first:rounded-s-[4px] last:rounded-e-[4px]'
          : 'rounded-[4px]',
        data.isSelected
          ? 'border-slate-900 bg-slate-800'
          : 'border-transparent bg-slate-700',
        data.isDisabled
          && 'opacity-65 pointer-events-none',
      ]}
      buttons={{
        prev: {
          iconContent: () => chevronLeft(`${buttonIconClass} [[dir=rtl]_&]:rotate-180`),
        },
        next: {
          iconContent: () => chevronLeft(`${buttonIconClass} rotate-180 [[dir=rtl]_&]:rotate-0`),
        },
        prevYear: {
          iconContent: () => chevronsLeft(`${buttonIconClass} [[dir=rtl]_&]:rotate-180`),
        },
        nextYear: {
          iconContent: () => chevronsLeft(`${buttonIconClass} rotate-180 [[dir=rtl]_&]:rotate-0`),
        },
        ...userButtons,
        add: addButton || {},
      }}

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
          tableClass: 'border border-(--fc-classic-border)',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: 'min-h-3',

          /* TimeGrid > Week Number Header
          ----------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'px-1 py-0.5',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],

          /* TimeGrid > All-Day Header
          ----------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'px-1 py-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          allDayDividerClass: 'border-y border-(--fc-classic-border) pb-0.5 bg-(--fc-classic-muted)',

          /* TimeGrid > Slot Header
          ----------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'px-1 py-0.5',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          slotHeaderDividerClass: 'border-e border-(--fc-classic-border)',

          /* TimeGrid > Now-Indicator
          ----------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: [
            'start-0 -mt-[5px]',
            'border-y-[5px] border-y-transparent',
            'border-s-[6px] border-s-(--fc-classic-now)',
          ],
          nowIndicatorLineClass: 'border-t border-(--fc-classic-now)',

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          ----------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            'group border-b border-(--fc-classic-border) px-3 py-2 gap-3',
            data.isInteractive
              ? joinClassNames(faintHoverPressableClass, outlineInsetClass)
              : faintHoverClass,
          ],
          listItemEventBeforeClass: 'border-5',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: [
            '-order-1 shrink-0 w-1/2 max-w-50',
            'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
          ],
          listItemEventTitleClass: (data) => [
            'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
            data.event.url && 'group-hover:underline',
          ],

          /* No-Events Screen
          ----------------------------------------------------------------------------------------- */

          noEventsClass: 'bg-(--fc-classic-muted) flex flex-col items-center justify-center',
          noEventsInnerClass: 'sticky bottom-0 py-15',

          ...userViews?.list,
        },
      }}

      {...restOptions}
    />
  )
}

/* SVGs
------------------------------------------------------------------------------------------------- */

function chevronLeft(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
}

function chevronsLeft(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
}

function x(className?: string) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
}
