import React from 'react'
import FullCalendar, { type CalendarOptions, type DayCellInfo, joinClassNames } from '@fullcalendar/react'
import { EventCalendarCloseIcon } from './icons'

// outline
export const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
export const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
export const tertiaryOutlineColorClass = 'outline-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.5)]'

// strongest (25%)
const strongestSolidBgActiveClass = 'active:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_25%,var(--mui-palette-background-paper))]'

// stronger (20%)
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_20%,var(--mui-palette-background-paper))]'

// strong (16%)
const strongBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongBgFocusGroupClass = 'group-focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongBgActiveGroupClass = 'group-active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_16%,var(--mui-palette-background-paper))]'
export const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass} ${strongestSolidBgActiveClass}`

// muted (8%)
export const mutedBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgHoverGroupClass = 'group-hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
export const mutedHoverPressableClass = `${mutedBgHoverClass} ${strongBgFocusClass} ${strongBgActiveClass}`
const mutedHoverPressableGroupClass = `${mutedBgHoverGroupClass} ${strongBgFocusGroupClass} ${strongBgActiveGroupClass}`

// faint (4%)
export const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'

// secondary (less-contrasty version of primary)
export const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
export const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)]`

// tertiary (it's actually MUI's "secondary", like an accent color)
export const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
export const tertiaryPressableClass = `${tertiaryClass} hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)]`
export const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] group-active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)]`

// usually 11px font / 12px line-height
const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
export const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) bg-(--mui-palette-background-paper) rounded-full`
export const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

export const tallDayCellBottomClass = 'min-h-4'
export const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
  !info.isNarrow && 'min-h-px',
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => joinClassNames(
    'mb-px p-px rounded-sm',
    info.isNarrow ? 'mx-px' : 'mx-0.5',
  ),
  listItemEventBeforeClass: (info) => joinClassNames(
    'border-4',
    info.isNarrow ? 'ms-0.5' : 'ms-1',
  ),
  listItemEventInnerClass: (info) => (
    info.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs'
  ),
  listItemEventTimeClass: (info) => joinClassNames(
    info.isNarrow ? 'ps-0.5' : 'ps-1',
    'whitespace-nowrap overflow-hidden shrink-1',
  ),
  listItemEventTitleClass: (info) => joinClassNames(
    info.isNarrow ? 'px-0.5' : 'px-1',
    'font-bold whitespace-nowrap overflow-hidden shrink-100',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (info) => joinClassNames(
    info.isStart && 'ms-px',
    info.isEnd && 'me-px',
  ),
  rowEventInnerClass: (info) => info.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => joinClassNames(
    'mb-px border rounded-sm',
    info.isNarrow
      ? `mx-px border-(--mui-palette-primary-main)`
      : 'mx-0.5 border-transparent',
    mutedHoverPressableClass,
  ),
  rowMoreLinkInnerClass: (info) => (
    info.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
  ),
}

export interface EventCalendarViewsProps extends Omit<CalendarOptions, 'class' | 'className' | 'headerToolbar' | 'footerToolbar'> {}

export default function EventCalendarViews({
  views: userViews,
  ...restOptions
}: EventCalendarViewsProps) {
  return (
    <FullCalendar
      className='root-reset'

      /* Abstract Event
      ----------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--mui-palette-primary-main)"
      eventContrastColor="var(--mui-palette-primary-contrastText)"
      eventClass={(info) => joinClassNames(
        info.isDragging && 'root-reset',
        info.event.url && 'link-reset',
        info.isSelected
          ? joinClassNames(
              outlineWidthClass,
              info.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      )}

      /* Background Event
      ----------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--mui-palette-secondary-main)"
      backgroundEventClass="not-print:bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)] print:border-1 print:border-(--fc-event-color)"
      backgroundEventTitleClass={(info) => joinClassNames(
        'opacity-50 italic',
        info.isNarrow
          ? `px-1 py-1.5 ${xxsTextClass}`
          : 'px-2 py-2.5 text-xs',
      )}

      /* List-Item Event
      ----------------------------------------------------------------------------------------- */

      listItemEventClass={(info) => joinClassNames(
        'items-center',
        info.isSelected
          ? mutedBgClass
          : info.isInteractive
            ? mutedHoverPressableClass
            : mutedBgHoverClass,
      )}
      listItemEventBeforeClass="rounded-full border-(--fc-event-color)"
      listItemEventInnerClass="text-(--mui-palette-text-primary) flex flex-row items-center"

      /* Block Event
      ----------------------------------------------------------------------------------------- */

      blockEventClass={(info) => joinClassNames(
        'group relative border-transparent print:border-(--fc-event-color) bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        info.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!info.isSelected && info.isDragging) && 'opacity-75',
      )}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden"
      blockEventTitleClass="whitespace-nowrap overflow-hidden"

      /* Row Event
      ----------------------------------------------------------------------------------------- */

      rowEventClass={(info) => joinClassNames(
        'mb-px border-y',
        info.isStart ? 'border-s rounded-s-sm' : (!info.isNarrow && 'ms-2'),
        info.isEnd ? 'border-e rounded-e-sm' : (!info.isNarrow && 'me-2'),
      )}
      rowEventBeforeClass={(info) => joinClassNames(
        info.isStartResizable ? joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        ) : (!info.isStart && !info.isNarrow) && (
          'absolute -start-2 w-2 -top-px -bottom-px'
        )
      )}
      rowEventBeforeContent={(info) => (
        (!info.isStart && !info.isNarrow) ? filledRightTriangle(
          'size-full rotate-180 [[dir=rtl]_&]:rotate-0 text-(--fc-event-color)',
        ) : <></> // HACK for React vdom
      )}
      rowEventAfterClass={(info) => joinClassNames(
        info.isEndResizable ? joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ) : (!info.isEnd && !info.isNarrow) && (
          'absolute -end-2 w-2 -top-px -bottom-px'
        )
      )}
      rowEventAfterContent={(info) => (
        (!info.isEnd && !info.isNarrow) ? filledRightTriangle(
          'size-full [[dir=rtl]_&]:rotate-180 text-(--fc-event-color)',
        ) : <></> // HACK for React vdom
      )}
      rowEventInnerClass={(info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}
      rowEventTimeClass={(info) => joinClassNames(
        'font-bold shrink-1',
        info.isNarrow ? 'ps-0.5' : 'ps-1',
      )}
      rowEventTitleClass={(info) => joinClassNames(
        'shrink-100',
        info.isNarrow ? 'px-0.5' : 'px-1',
      )}

      /* Column Event
      ----------------------------------------------------------------------------------------- */

      columnEventTitleSticky={false}
      columnEventClass={(info) => joinClassNames(
        'border-x ring ring-(--mui-palette-background-paper)',
        info.isStart && 'border-t rounded-t-sm',
        info.isEnd && 'mb-px border-b rounded-b-sm',
      )}
      columnEventBeforeClass={(info) => joinClassNames(
        info.isStartResizable && joinClassNames(
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-top-1',
        )
      )}
      columnEventAfterClass={(info) => joinClassNames(
        info.isEndResizable && joinClassNames(
          info.isSelected ? columnTouchResizerClass : columnPointerResizerClass,
          '-bottom-1',
        )
      )}
      columnEventInnerClass={(info) => joinClassNames(
        'flex',
        info.isShort
          ? 'flex-row items-center p-1 gap-1'
          : joinClassNames(
              'flex-col',
              info.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}
      columnEventTimeClass={(info) => joinClassNames(
        'order-1 shrink-100',
        !info.isShort && (info.isNarrow ? 'pb-0.5' : 'pb-1'),
      )}
      columnEventTitleClass={(info) => joinClassNames(
        'shrink-1',
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
      )}

      /* More-Link
      ----------------------------------------------------------------------------------------- */

      moreLinkClass={`${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={`mb-px border border-transparent print:border-black rounded-sm ${strongSolidPressableClass} print:bg-white ring ring-(--mui-palette-background-paper)`}
      columnMoreLinkInnerClass={(info) => (
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ----------------------------------------------------------------------------------------- */

      dayHeaderAlign="center"
      dayHeaderClass={(info) => joinClassNames(
        'justify-center',
        info.isMajor && 'border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]',
        (info.isDisabled && !info.inPopover) && faintBgClass,
      )}
      dayHeaderInnerClass="group mt-2 mx-2 flex flex-col items-center outline-none"
      dayHeaderContent={(info) => (
        <>
          {info.weekdayText && (
            <div
              className={joinClassNames(
                'text-xs uppercase',
                'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
              )}
            >{info.weekdayText}</div>
          )}
          {info.dayNumberText && (
            <div
              className={joinClassNames(
                'm-0.5 rounded-full flex flex-row items-center justify-center',
                info.isNarrow
                  ? 'size-7 text-base'
                  : 'size-8 text-lg',
                info.isToday
                  ? (info.hasNavLink ? tertiaryPressableGroupClass : tertiaryClass)
                  : (info.hasNavLink && mutedHoverPressableGroupClass),
                info.hasNavLink && joinClassNames(
                  outlineWidthGroupFocusClass,
                  tertiaryOutlineColorClass,
                ),
              )}
            >{info.dayNumberText}</div>
          )}
        </>
      )}

      /* Day Cell
      ----------------------------------------------------------------------------------------- */

      dayCellClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        info.isDisabled && faintBgClass,
      )}
      dayCellTopClass={(info) => joinClassNames(
        'flex flex-row',
        info.isNarrow
          ? 'justify-end min-h-px'
          : 'justify-center min-h-0.5',
      )}
      dayCellTopInnerClass={(info) => joinClassNames(
        'flex flex-row items-center justify-center whitespace-nowrap rounded-full',
        info.isNarrow
          ? `m-px h-5 ${xxsTextClass}`
          : 'm-1.5 h-6 text-sm',
        info.text === info.dayNumberText
          ? (info.isNarrow ? 'w-5' : 'w-6')
          : (info.isNarrow ? 'px-1' : 'px-2'),
        info.isToday
          ? (info.hasNavLink ? tertiaryPressableClass : tertiaryClass)
          : (info.hasNavLink && mutedHoverPressableClass),
        info.isOther && 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
        info.monthText && 'font-bold',
      )}
      dayCellInnerClass={(info) => joinClassNames(info.inPopover && 'p-2')}

      /* Popover
      ----------------------------------------------------------------------------------------- */

      popoverFormat={{ day: 'numeric', weekday: 'short' }}
      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-60 root-reset"
      popoverCloseClass={`group absolute top-2 end-2 size-8 rounded-full items-center justify-center ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${tertiaryOutlineColorClass} button-reset`}
      popoverCloseContent={() => <EventCalendarCloseIcon />}
      dayLaneClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        info.isDisabled && faintBgClass,
      )}
      dayLaneInnerClass={(info) => (
        info.isStack
          ? 'm-1'
          : info.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={(info) => joinClassNames(
        'border border-(--mui-palette-divider)',
        info.isMinor && 'border-dotted',
      )}
      listDayFormat={{ day: 'numeric' }}
      listDayAltFormat={{ month: 'short', weekday: 'short', forceCommas: true }}
      listDayClass={(info) => joinClassNames(
        !info.isLast && 'border-b border-(--mui-palette-divider)',
        'flex flex-row items-start',
      )}
      listDayHeaderClass="p-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2"
      listDayHeaderInnerClass={(info) => (
        !info.level
          ? joinClassNames(
              'h-9 rounded-full flex flex-row items-center text-lg',
              info.text === info.dayNumberText
                ? 'w-9 justify-center'
                : 'px-3',
              info.isToday
                ? (info.hasNavLink ? tertiaryPressableClass : tertiaryClass)
                : (info.hasNavLink && mutedHoverPressableClass)
            )
          : joinClassNames(
              'text-xs uppercase',
              info.hasNavLink && 'hover:underline',
            )
      )}
      listDayBodyClass="grow min-w-0 py-2 gap-1"

      /* Single Month (in Multi-Month)
      ----------------------------------------------------------------------------------------- */

      singleMonthClass={(info) => joinClassNames(
        info.multiMonthColumns > 1 && 'm-4',
        (info.multiMonthColumns === 1 && !info.isLast) && 'border-(--mui-palette-divider) border-b',
      )}
      singleMonthHeaderClass={(info) => joinClassNames(
        info.multiMonthColumns > 1 ? 'pb-2' : 'py-1 border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(info) => joinClassNames(
        'px-3 py-1 rounded-full text-base font-bold',
        info.hasNavLink && mutedHoverPressableClass,
      )}

      /* Misc Table
      ----------------------------------------------------------------------------------------- */

      tableHeaderClass="bg-(--mui-palette-background-paper)"
      fillerClass={(info) => joinClassNames(
        'opacity-50 border',
        info.inTableHeader ? 'border-transparent' : 'border-(--mui-palette-divider)',
      )}
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"

      /* Misc Content
      ----------------------------------------------------------------------------------------- */

      navLinkClass={`${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      inlineWeekNumberClass={(info) => joinClassNames(
        'absolute flex flex-row items-center whitespace-nowrap',
        info.isNarrow
          ? `top-0.5 start-0 my-px h-4 pe-1 rounded-e-full ${xxsTextClass}`
          : 'top-1.5 start-1 h-6 px-2 rounded-full text-sm',
        info.hasNavLink
          ? secondaryPressableClass
          : secondaryClass,
      )}
      nonBusinessHoursClass={faintBgClass}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"
      nowIndicatorLineClass="-m-px border-1 border-(--mui-palette-error-main)"
      nowIndicatorDotClass="-m-[6px] border-6 border-(--mui-palette-error-main) size-0 rounded-full ring-2 ring-(--mui-palette-background-paper)"

      /* View-Specific Options
      ----------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderInnerClass: (info) => joinClassNames(!info.inPopover && 'mb-2'),
          dayHeaderDividerClass: (info) => joinClassNames(info.multiMonthColumns === 1 && 'border-b border-(--mui-palette-divider)'),
          tableBodyClass: (info) => joinClassNames(info.multiMonthColumns > 1 && 'border border-(--mui-palette-divider) rounded-sm overflow-hidden'),
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          ------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (info) => joinClassNames(
            'ms-1 my-2 flex flex-row items-center rounded-full',
            info.options.dayMinWidth !== undefined && 'me-1',
            info.isNarrow
              ? 'h-5 px-1.5 text-xs'
              : 'h-6 px-2 text-sm',
            info.hasNavLink
              ? secondaryPressableClass
              : secondaryClass,
          ),

          /* TimeGrid > All-Day Header
          ------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (info) => joinClassNames(
            'm-2 text-end',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),
          allDayDividerClass: `border-b border-(--mui-palette-divider)`,

          /* TimeGrid > Slot Header
          ------------------------------------------------------------------------------------- */

          slotHeaderClass: (info) => joinClassNames(
            'w-2 self-end justify-end border border-(--mui-palette-divider)',
            info.isMinor && 'border-dotted',
          ),
          slotHeaderInnerClass: (info) => joinClassNames(
            'relative ms-2 me-3 my-2',
            info.isNarrow
              ? `-top-4 ${xxsTextClass}`
              : '-top-5 text-sm',
            info.isFirst && 'hidden',
          ),
          slotHeaderDividerClass: (info) => joinClassNames(
            'border-e',
            (info.inTableHeader && info.options.dayMinWidth === undefined)
              ? 'border-transparent'
              : 'border-(--mui-palette-divider)',
          ),

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          ------------------------------------------------------------------------------------- */

          listItemEventClass: 'group p-2 rounded-s-full gap-2',
          listItemEventBeforeClass: 'mx-2 border-5',
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (info) => joinClassNames(
            'grow min-w-0 whitespace-nowrap overflow-hidden',
            info.event.url && 'group-hover:underline',
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
