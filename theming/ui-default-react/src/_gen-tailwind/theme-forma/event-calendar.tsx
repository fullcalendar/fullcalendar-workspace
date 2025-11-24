import React from 'react'
import { CalendarOptions, DayCellData, joinClassNames } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import multiMonthPlugin from '@fullcalendar/multimonth'

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
const blockTouchResizerClass = 'absolute size-2 border border-(--fc-event-color) bg-(--fc-forma-background) rounded-full'
const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

const tallDayCellBottomClass = 'min-h-4'
const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

const getSlotClass = (data: { isMinor: boolean }) => joinClassNames(
  'border border-(--fc-forma-border)',
  data.isMinor && 'border-dotted',
)

// outline
const outlineWidthClass = 'outline-2'
export const outlineWidthFocusClass = 'focus-visible:outline-2'
const outlineOffsetClass = 'outline-offset-2'
const outlineInsetClass = '-outline-offset-2'
export const primaryOutlineColorClass = 'outline-(--fc-forma-primary)'
const primaryOutlineFocusClass = `${outlineWidthFocusClass} ${primaryOutlineColorClass}`

// neutral buttons
const strongSolidPressableClass = joinClassNames(
  '[background:linear-gradient(var(--fc-forma-strong),var(--fc-forma-strong))_var(--fc-forma-background)]',
  'hover:[background:linear-gradient(var(--fc-forma-stronger),var(--fc-forma-stronger))_var(--fc-monarch-background)]',
  'active:[background:linear-gradient(var(--fc-forma-strongest),var(--fc-forma-strongest))_var(--fc-monarch-background)]',
)
const mutedPressableClass = 'bg-(--fc-forma-muted) hover:bg-(--fc-forma-strong) active:bg-(--fc-forma-stronger) focus-visible:outline-2 outline-(--fc-forma-primary)'
const mutedHoverClass = 'hover:bg-(--fc-forma-muted)'
export const mutedHoverPressableClass = `${mutedHoverClass} focus-visible:bg-(--fc-forma-muted) active:bg-(--fc-forma-strong)`
const mutedHoverButtonClass = `${mutedHoverPressableClass} border border-transparent ${primaryOutlineFocusClass}`

// controls
const unselectedPressableClass = mutedHoverPressableClass
const unselectedButtonClass = `${unselectedPressableClass} border border-transparent ${primaryOutlineFocusClass}`
const selectedButtonClass = 'bg-(--fc-forma-muted) border border-(--fc-forma-strong-border) focus-visible:outline-2 outline-(--fc-forma-primary) -outline-offset-1'

// primary
const primaryClass = 'bg-(--fc-forma-primary) text-(--fc-forma-primary-foreground)'
const primaryPressableClass = `${primaryClass} hover:bg-(--fc-forma-primary-over) focus-visible:bg-(--fc-forma-primary-over) active:bg-(--fc-forma-primary-down)`
const primaryButtonClass = `${primaryPressableClass} border border-transparent ${primaryOutlineFocusClass} ${outlineOffsetClass}`

// secondary *toolbar button*
const secondaryButtonClass = `${mutedHoverPressableClass} border border-(--fc-forma-border) hover:border-(--fc-forma-strong-border) ${primaryOutlineFocusClass}`
const secondaryButtonIconClass = 'size-5'

// event content
const eventMutedBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-forma-background))]'
const eventMutedPressableClass = joinClassNames(
  eventMutedBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--fc-forma-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_40%,var(--fc-forma-background))]',
)
const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--fc-forma-background))]'
const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--fc-forma-background))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--fc-forma-background))]',
)
const bgEventBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]'

// interactive neutral foregrounds
export const mutedFgPressableGroupClass = 'text-(--fc-forma-muted-foreground) group-hover:text-(--fc-forma-primary) group-focus-visible:text-(--fc-forma-primary)'

const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-px' : 'mx-0.5',
    data.isSelected
      ? 'bg-(--fc-forma-muted)'
      : data.isInteractive
        ? mutedHoverPressableClass
        : mutedHoverClass,
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
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => data.isEnd && (data.isNarrow ? 'me-px' : 'me-0.5'),
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? 'mx-px border-(--fc-forma-primary)'
      : 'mx-0.5 border-transparent self-start',
    mutedHoverPressableClass,
  ],

  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
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
      className='bg-(--fc-forma-background) border border-(--fc-forma-border) rounded-sm shadow-xs overflow-hidden'

      /* Toolbar
      ------------------------------------------------------------------------------------------- */

      headerToolbar={{
        start: (addButton ? 'add ' : '') + 'today prev,next title',
        end: availableViews.join(','),
      }}
      headerToolbarClass='border-b border-(--fc-forma-border)'
      footerToolbarClass='border-t border-(--fc-forma-border)'
      toolbarClass='p-3 flex flex-row flex-wrap items-center justify-between gap-3'
      toolbarSectionClass='shrink-0 flex flex-row items-center gap-3'
      toolbarTitleClass='text-xl'
      buttonGroupClass='flex flex-row items-center'
      buttonClass={(data) => [
        'group py-1.5 rounded-sm flex flex-row items-center text-sm',
        data.isIconOnly ? 'px-2' : 'px-3',
        data.isIconOnly
          ? mutedHoverButtonClass
          : data.inSelectGroup
            ? data.isSelected
              ? selectedButtonClass
              : unselectedButtonClass
            : data.isPrimary
              ? primaryButtonClass
              : secondaryButtonClass,
      ]}
      buttons={{
        add: {
          isPrimary: true,
          ...addButton,
        },
        prev: {
          iconContent: () => chevronDown(
            joinClassNames(secondaryButtonIconClass, 'rotate-90 [[dir=rtl]_&]:-rotate-90'),
          ),
        },
        next: {
          iconContent: () => chevronDown(
            joinClassNames(secondaryButtonIconClass, '-rotate-90 [[dir=rtl]_&]:rotate-90'),
          ),
        },
        prevYear: {
          iconContent: () => chevronDoubleLeft(
            joinClassNames(secondaryButtonIconClass, '[[dir=rtl]_&]:rotate-180'),
          )
        },
        nextYear: {
          iconContent: () => chevronDoubleLeft(
            joinClassNames(secondaryButtonIconClass, 'rotate-180 [[dir=rtl]_&]:rotate-0'),
          )
        },
        ...userButtons,
      }}

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor='var(--fc-forma-event)'
      eventContrastColor='var(--fc-forma-event-contrast)'
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging && 'shadow-lg',
            )
          : outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor='var(--fc-forma-background-event)'
      backgroundEventClass={bgEventBgClass}
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass='items-center'
      listItemEventInnerClass='flex flex-row items-center'

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative border-(--fc-event-color) print:bg-white',
        data.isInteractive
          ? eventMutedPressableClass
          : eventMutedBgClass,
        (data.isDragging && !data.isSelected) && 'opacity-75',
        outlineOffsetClass,
      ]}
      blockEventTimeClass='whitespace-nowrap overflow-hidden shrink-1'
      blockEventTitleClass='whitespace-nowrap overflow-hidden shrink-100'

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
          'ms-1 size-2 border-t-1 border-s-1 border-(--fc-forma-muted-foreground)',
          '-rotate-45 [[dir=rtl]_&]:rotate-45',
        ]
      )}
      rowEventAfterClass={(data) => (
        data.isEndResizable ? [
          data.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ] : (!data.isEnd && !data.isNarrow) && [
          'me-1 size-2 border-t-1 border-e-1 border-(--fc-forma-muted-foreground)',
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
        'ring ring-(--fc-forma-background)',
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
          : joinClassNames(
              'flex-col',
              data.isNarrow ? 'px-0.5' : 'px-1',
            )
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
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      moreLinkInnerClass='whitespace-nowrap overflow-hidden'
      columnMoreLinkClass={[
        'mb-px border border-transparent print:border-black rounded-sm',
        `${strongSolidPressableClass} print:bg-white`,
        'ring ring-(--fc-forma-background)',
        outlineOffsetClass,
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
        data.isDisabled && 'bg-(--fc-forma-faint)',
        data.inPopover
          ? 'border-b border-(--fc-forma-border) bg-(--fc-forma-faint)'
          : joinClassNames(
              data.isMajor ? 'border border-(--fc-forma-strong-border)' :
                !data.isNarrow && 'border border-(--fc-forma-border)',
            ),
      ]}
      dayHeaderInnerClass={(data) => [
        data.isToday && data.level && 'relative',
        'p-2 flex flex-col',
        data.hasNavLink && joinClassNames(
          mutedHoverPressableClass,
          outlineInsetClass,
        )
      ]}
      dayHeaderContent={(data) => (
        <React.Fragment>
          {data.isToday && (
            <div className='absolute top-0 inset-x-0 border-t-4 border-(--fc-forma-primary) pointer-events-none' />
          )}
          {data.dayNumberText && (
            <div
              className={joinClassNames(
                data.isToday && 'font-bold',
                data.isNarrow ? 'text-md' : 'text-lg',
              )}
            >{data.dayNumberText}</div>
          )}
          {data.weekdayText && (
            <div className='text-xs'>{data.weekdayText}</div>
          )}
        </React.Fragment>
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-forma-strong-border)' : 'border-(--fc-forma-border)',
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && 'bg-(--fc-forma-faint)',
      ]}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row',
        ((data.isOther || data.isDisabled) && data.options.businessHours) && 'text-(--fc-forma-faint-foreground)',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center justify-center whitespace-nowrap',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        data.isToday
          ? joinClassNames(
              'rounded-full',
              data.isNarrow ? 'ms-px' : 'ms-1',
              data.text === data.dayNumberText
                ? (data.isNarrow ? 'w-5' : 'w-6')
                : (data.isNarrow ? 'px-1' : 'px-2'),
              data.hasNavLink
                ? joinClassNames(primaryPressableClass, outlineOffsetClass)
                : primaryClass,
            )
          : joinClassNames(
              'rounded-e-sm',
              data.isNarrow ? 'px-1' : 'px-2',
              data.hasNavLink && mutedHoverPressableClass,
            ),
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat={{ day: 'numeric', weekday: 'long' }}
      popoverClass='border border-(--fc-forma-border) bg-(--fc-forma-background) shadow-md min-w-55'
      popoverCloseClass={[
        'group absolute top-1 end-1 p-1 rounded-sm',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      popoverCloseContent={() => dismiss(`size-5 ${mutedFgPressableGroupClass}`)}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-(--fc-forma-strong-border)' : 'border-(--fc-forma-border)',
        data.isDisabled && 'bg-(--fc-forma-faint)',
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={getSlotClass}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayClass='not-last:border-b border-(--fc-forma-border) flex flex-row items-start'
      listDayHeaderClass={(data) => [
        'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
        data.isToday && 'border-s-4 border-(--fc-forma-primary)',
      ]}
      listDayHeaderInnerClass={(data) => [
        'my-0.5',
        !data.level
          ? joinClassNames('text-lg', data.isToday && 'font-bold')
          : 'text-xs',
        data.hasNavLink && 'hover:underline',
      ]}
      listDayEventsClass='grow min-w-0 p-4 gap-4'

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass='m-4'
      singleMonthHeaderClass={(data) => [
        data.colCount > 1 ? 'pb-4' : 'py-2',
        data.isSticky && 'border-b border-(--fc-forma-border) bg-(--fc-forma-background)',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-1 rounded-sm font-bold',
        data.hasNavLink && mutedHoverPressableClass,
        !data.isNarrow && 'text-lg',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-(--fc-forma-background)'}
      fillerClass='border border-(--fc-forma-border) opacity-50'
      dayNarrowWidth={100}
      dayHeaderRowClass='border border-(--fc-forma-border)'
      dayRowClass='border border-(--fc-forma-border)'
      slotHeaderRowClass='border border-(--fc-forma-border)'
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute end-0 whitespace-nowrap rounded-s-sm',
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink
          ? mutedPressableClass
          : 'bg-(--fc-forma-muted)',
      ]}
      nonBusinessClass='bg-(--fc-forma-faint)'
      highlightClass='bg-(--fc-forma-highlight)'
      nowIndicatorLineClass='-m-px border-1 border-(--fc-forma-primary)'
      nowIndicatorDotClass={[
        '-m-[6px] border-6 border-(--fc-forma-primary) size-0 rounded-full',
        'ring-2 ring-(--fc-forma-background)',
      ]}

      /* View-Specific
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: 'border-b border-(--fc-forma-border)',
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
          dayHeaderDividerClass: (data) => data.isSticky && 'border-b border-(--fc-forma-border)',
          dayCellBottomClass: getShortDayCellBottomClass,
          dayHeaderInnerClass: (data) => data.isNarrow && 'text-(--fc-forma-muted-foreground)',
          tableBodyClass: 'border border-(--fc-forma-border) rounded-sm overflow-hidden',
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: 'border-b border-(--fc-forma-border)',
          dayCellBottomClass: tallDayCellBottomClass,
          dayHeaderAlign: 'start',

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-end justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'm-1 p-1 rounded-sm text-xs',
            data.hasNavLink && mutedHoverPressableClass,
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'p-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: 'border-b border-(--fc-forma-border)',

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'p-2',
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          slotHeaderDividerClass: 'border-e border-(--fc-forma-border)',
          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            'group border-s-6 border-(--fc-event-color) p-3 rounded-sm',
            data.isInteractive
              ? eventFaintPressableClass
              : eventFaintBgClass,
          ],
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (data) => [
            'grow min-w-0 whitespace-nowrap overflow-hidden font-semibold',
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

export function chevronDown(className?: string) {
  return (
    <svg className={className} xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M15.8527 7.64582C16.0484 7.84073 16.0489 8.15731 15.854 8.35292L10.389 13.8374C10.1741 14.0531 9.82477 14.0531 9.60982 13.8374L4.14484 8.35292C3.94993 8.15731 3.95049 7.84073 4.1461 7.64582C4.34171 7.4509 4.65829 7.45147 4.85321 7.64708L9.99942 12.8117L15.1456 7.64708C15.3406 7.45147 15.6571 7.4509 15.8527 7.64582Z' />
    </svg>
  )
}

function chevronDoubleLeft(className?: string) {
  return (
    <svg className={className} xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M11.3544 15.8527C11.1594 16.0484 10.8429 16.0489 10.6472 15.854L5.16276 10.389C4.94705 10.1741 4.94705 9.82477 5.16276 9.60982L10.6472 4.14484C10.8429 3.94993 11.1594 3.95049 11.3544 4.1461C11.5493 4.34171 11.5487 4.65829 11.3531 4.85321L6.18851 9.99942L11.3531 15.1456C11.5487 15.3406 11.5493 15.6571 11.3544 15.8527ZM15.3534 15.8527C15.1585 16.0484 14.8419 16.0489 14.6463 15.854L9.16178 10.389C8.94607 10.1741 8.94607 9.82477 9.16178 9.60982L14.6463 4.14484C14.8419 3.94993 15.1585 3.95049 15.3534 4.1461C15.5483 4.34171 15.5477 4.65829 15.3521 4.85321L10.1875 9.99942L15.3521 15.1456C15.5477 15.3406 15.5483 15.6571 15.3534 15.8527Z' />
    </svg>
  )
}

function dismiss(className?: string) {
  return (
    <svg className={className} xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='currentColor'>
      <path d='M4.08859 4.21569L4.14645 4.14645C4.32001 3.97288 4.58944 3.9536 4.78431 4.08859L4.85355 4.14645L10 9.293L15.1464 4.14645C15.32 3.97288 15.5894 3.9536 15.7843 4.08859L15.8536 4.14645C16.0271 4.32001 16.0464 4.58944 15.9114 4.78431L15.8536 4.85355L10.707 10L15.8536 15.1464C16.0271 15.32 16.0464 15.5894 15.9114 15.7843L15.8536 15.8536C15.68 16.0271 15.4106 16.0464 15.2157 15.9114L15.1464 15.8536L10 10.707L4.85355 15.8536C4.67999 16.0271 4.41056 16.0464 4.21569 15.9114L4.14645 15.8536C3.97288 15.68 3.9536 15.4106 4.08859 15.2157L4.14645 15.1464L9.293 10L4.14645 4.85355C3.97288 4.67999 3.9536 4.41056 4.08859 4.21569L4.14645 4.14645L4.08859 4.21569Z' />
    </svg>
  )
}

