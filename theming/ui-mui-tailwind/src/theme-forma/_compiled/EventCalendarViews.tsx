import React from 'react'
import FullCalendar, { type CalendarOptions, type DayCellInfo, joinClassNames } from '@fullcalendar/react'
import CloseIcon from '@mui/icons-material/Close'

// outline
export const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
export const outlineOffsetClass = 'outline-offset-1'
export const outlineInsetClass = '-outline-offset-3'
export const primaryOutlineColorClass = 'outline-(--mui-palette-primary-main)'

// strongest (25%)
const strongestSolidBgActiveClass = 'active:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_25%,var(--mui-palette-background-paper))]'

// stronger (20%)
const strongerBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_20%,var(--mui-palette-background-paper))]'

// strong (16%)
const strongBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_16%,var(--mui-palette-background-paper))]'
export const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass} ${strongestSolidBgActiveClass}`

// muted (8%)
export const mutedBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
export const mutedPressableClass = `${mutedBgClass} ${strongBgHoverClass} ${strongerBgActiveClass}`
export const mutedHoverPressableClass = `${mutedBgHoverClass} ${strongBgFocusClass} ${strongBgActiveClass}`

// faint (4%)
export const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'

// primary
export const primaryClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
export const primaryPressableClass = `${primaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.8)]`

// event content
export const eventMutedBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--mui-palette-background-paper))]'
export const eventMutedPressableClass = joinClassNames(
  eventMutedBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_35%,var(--mui-palette-background-paper))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_40%,var(--mui-palette-background-paper))]',
)
export const eventFaintBgClass = 'bg-[color-mix(in_oklab,var(--fc-event-color)_20%,var(--mui-palette-background-paper))]'
export const eventFaintPressableClass = joinClassNames(
  eventFaintBgClass,
  'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_25%,var(--mui-palette-background-paper))]',
  'active:bg-[color-mix(in_oklab,var(--fc-event-color)_30%,var(--mui-palette-background-paper))]',
)

// how MUI does icon color
export const pressableIconClass = 'text-(--mui-palette-action-active) group-hover:text-(--mui-palette-text-primary) group-focus-visible:text-(--mui-palette-text-primary)'

// usually 11px font / 12px line-height
const xxsTextClass = 'text-[0.6875rem]/[1.090909]'

// transparent resizer for mouse
const blockPointerResizerClass = 'absolute hidden group-hover:block'
export const rowPointerResizerClass = `${blockPointerResizerClass} inset-y-0 w-2`
const columnPointerResizerClass = `${blockPointerResizerClass} inset-x-0 h-2`

// circle resizer for touch
const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) rounded-full bg-(--mui-palette-background-paper)`
export const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

export const tallDayCellBottomClass = 'min-h-4'
export const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
  !info.isNarrow && 'min-h-px'
)

const getSlotClass = (info: { isMinor: boolean }) => joinClassNames(
  `border border-(--mui-palette-divider)`,
  info.isMinor && 'border-dotted',
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => joinClassNames(
    'mb-px p-px rounded-sm',
    info.isNarrow ? 'mx-px' : 'mx-0.5',
    info.isSelected
      ? mutedBgClass
      : info.isInteractive
        ? mutedHoverPressableClass
        : mutedBgHoverClass,
  ),
  listItemEventBeforeClass: (info) => joinClassNames(
    'border-4 border-(--fc-event-color) rounded-full',
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

  rowEventClass: (info) => joinClassNames(info.isEnd && (info.isNarrow ? 'me-px' : 'me-0.5')),
  rowEventInnerClass: (info) => info.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => joinClassNames(
    'mb-px border rounded-sm',
    info.isNarrow
      ? `mx-px border-(--mui-palette-primary-main)`
      : 'mx-0.5 border-transparent self-start',
    mutedHoverPressableClass,
  ),
  rowMoreLinkInnerClass: (info) => info.isNarrow
    ? `px-0.5 py-px ${xxsTextClass}`
    : 'px-1 py-0.5 text-xs',
}

export default function EventCalendarViews({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <FullCalendar

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--mui-palette-primary-main)"
      eventContrastColor="var(--mui-palette-primary-contrastText)"
      eventClass={(info) => joinClassNames(
        info.isSelected
          ? joinClassNames(
              outlineWidthClass,
              info.isDragging && 'shadow-lg',
            )
          : outlineWidthFocusClass,
        primaryOutlineColorClass,
      )}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--mui-palette-secondary-main)"
      backgroundEventClass="not-print:bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)] print:border-1 print:border-(--fc-event-color)"
      backgroundEventTitleClass={(info) => joinClassNames(
        'opacity-50 italic',
        info.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      )}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass="items-center"
      listItemEventInnerClass="text-(--mui-palette-text-primary) flex flex-row items-center"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(info) => joinClassNames(
        `group relative border-(--fc-event-color) print:bg-white ${outlineOffsetClass}`,
        info.isInteractive
          ? eventMutedPressableClass
          : eventMutedBgClass,
        (info.isDragging && !info.isSelected) && 'opacity-75',
      )}
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(info) => joinClassNames(
        'mb-px not-print:py-px print:border-y items-center',
        info.isStart && 'border-s-6 rounded-s-sm',
        info.isEnd && 'not-print:pe-px print:border-e rounded-e-sm',
      )}
      rowEventBeforeClass={(info) => joinClassNames(
        info.isStartResizable ? joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-2',
        ) : (!info.isStart && !info.isNarrow) &&
          'ms-1 size-2 border-t-1 border-s-1 border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] -rotate-45 [[dir=rtl]_&]:rotate-45'
      )}
      rowEventAfterClass={(info) => joinClassNames(
        info.isEndResizable ? joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        ) : (!info.isEnd && !info.isNarrow) &&
          'me-1 size-2 border-t-1 border-e-1 border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] rotate-45 [[dir=rtl]_&]:-rotate-45'
      )}
      rowEventInnerClass={(info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}
      rowEventTimeClass={(info) => joinClassNames(
        'font-medium',
        info.isNarrow ? 'ps-0.5' : 'ps-1',
      )}
      rowEventTitleClass={(info) => (
        info.isNarrow ? 'px-0.5' : 'px-1'
      )}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(info) => joinClassNames(
        'border-s-6 not-print:pe-px print:border-e ring ring-(--mui-palette-background-paper)',
        info.isStart && 'not-print:pt-px print:border-t rounded-t-sm',
        info.isEnd && 'mb-px not-print:pb-px print:border-b rounded-b-sm',
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
              info.isNarrow ? 'px-0.5' : 'px-1',
            )
      )}
      columnEventTimeClass={(info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'pt-0.5' : 'pt-1'),
        xxsTextClass,
      )}
      columnEventTitleClass={(info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={`mb-px border border-transparent print:border-black rounded-sm ${strongSolidPressableClass} print:bg-white ring ring-(--mui-palette-background-paper) ${outlineOffsetClass}`}
      columnMoreLinkInnerClass={(info) => (
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(info) => info.isNarrow ? 'center' : 'start'}
      dayHeaderClass={(info) => joinClassNames(
        'justify-center',
        info.isToday && !info.level && 'relative',
        info.isDisabled && faintBgClass,
        info.inPopover
          ? 'border-b border-(--mui-palette-divider)'
          : joinClassNames(
              info.isMajor ? `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]` :
                !info.isNarrow && `border border-(--mui-palette-divider)`,
            ),
      )}
      dayHeaderInnerClass={(info) => joinClassNames(
        info.isToday && info.level && 'relative',
        'p-2 flex flex-col',
        info.hasNavLink && joinClassNames(
          mutedHoverPressableClass,
          outlineInsetClass,
        )
    )}
      dayHeaderContent={(info) => (
        <>
          {info.isToday && (
            <div className={`absolute top-0 inset-x-0 border-t-4 border-(--mui-palette-primary-main) pointer-events-none`} />
          )}
          {info.dayNumberText && (
            <div
              className={joinClassNames(
                info.isToday && 'font-bold',
                info.isNarrow ? 'text-base' : 'text-lg',
              )}
            >{info.dayNumberText}</div>
          )}
          {info.weekdayText && (
            <div className='text-xs'>{info.weekdayText}</div>
          )}
        </>
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        ((info.isOther || info.isDisabled) && !info.options.businessHours) && faintBgClass,
      )}
      dayCellTopClass={(info) => joinClassNames(
        info.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row',
        ((info.isOther || info.isDisabled) && info.options.businessHours) && 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
      )}
      dayCellTopInnerClass={(info) => joinClassNames(
        'flex flex-row items-center justify-center whitespace-nowrap',
        info.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        info.isToday
          ? joinClassNames(
              'rounded-full',
              info.isNarrow ? 'ms-px' : 'ms-1',
              info.text === info.dayNumberText
                ? (info.isNarrow ? 'w-5' : 'w-6')
                : (info.isNarrow ? 'px-1' : 'px-2'),
              info.hasNavLink
                ? joinClassNames(primaryPressableClass, outlineOffsetClass)
                : primaryClass,
            )
          : joinClassNames(
              'rounded-e-sm',
              info.isNarrow ? 'px-1' : 'px-2',
              info.hasNavLink && mutedHoverPressableClass,
            ),
        info.monthText && 'font-bold',
      )}
      dayCellInnerClass={(info) => joinClassNames(info.inPopover && 'p-2')}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverFormat={{ day: 'numeric', weekday: 'long' }}
      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55"
      popoverCloseClass={`group absolute top-1 end-1 p-1 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      popoverCloseContent={() => (
        <CloseIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={pressableIconClass}
        />
      )}
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
      slotLaneClass={getSlotClass}
      listDayClass={(info) => joinClassNames(
        !info.isLast && 'border-b border-(--mui-palette-divider)',
        'flex flex-row items-start',
      )}
      listDayHeaderClass={(info) => joinClassNames(
        'shrink-0 w-1/4 max-w-40 p-3 flex flex-col items-start',
        info.isToday && `border-s-4 border-(--mui-palette-primary-main)`,
      )}
      listDayHeaderInnerClass={(info) => joinClassNames(
        'my-0.5',
        !info.level
          ? joinClassNames('text-lg', info.isToday && 'font-bold')
          : 'text-xs',
        info.hasNavLink && 'hover:underline',
      )}
      listDayBodyClass="grow min-w-0 p-4 gap-4"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass={(info) => joinClassNames(
        info.multiMonthColumnCount > 1 && 'm-4',
        (info.multiMonthColumnCount === 1 && !info.isLast) && 'border-(--mui-palette-divider) border-b',
      )}
      singleMonthHeaderClass={(info) => joinClassNames(
        info.multiMonthColumnCount > 1 ? 'pb-4' : 'py-2 border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(info) => joinClassNames(
        'px-1 rounded-sm font-bold',
        info.hasNavLink && mutedHoverPressableClass,
        info.isNarrow ? 'text-base' : 'text-lg',
      )}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass="bg-(--mui-palette-background-paper)"
      fillerClass="border border-(--mui-palette-divider) opacity-50"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      inlineWeekNumberClass={(info) => joinClassNames(
        'absolute end-0 whitespace-nowrap rounded-s-sm',
        info.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        info.hasNavLink
          ? mutedPressableClass
          : mutedBgClass,
      )}
      nonBusinessClass={faintBgClass}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"
      nowIndicatorLineClass="-m-px border-1 border-(--mui-palette-error-main)"
      nowIndicatorDotClass="-m-[6px] border-6 border-(--mui-palette-error-main) size-0 rounded-full ring-2 ring-(--mui-palette-background-paper)"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: `border-b border-(--mui-palette-divider)`,
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
          dayHeaderDividerClass: (info) => joinClassNames(info.multiMonthColumnCount === 1 && `border-b border-(--mui-palette-divider)`),
          dayCellBottomClass: getShortDayCellBottomClass,
          dayHeaderInnerClass: (info) => joinClassNames(info.isNarrow && 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]'),
          tableBodyClass: (info) => joinClassNames(info.multiMonthColumnCount > 1 && 'border border-(--mui-palette-divider) rounded-sm overflow-hidden'),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderDividerClass: `border-b border-(--mui-palette-divider)`,
          dayCellBottomClass: tallDayCellBottomClass,
          dayHeaderAlign: 'start',

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-end justify-end',
          weekNumberHeaderInnerClass: (info) => joinClassNames(
            'm-1 p-1 rounded-sm text-xs',
            info.hasNavLink && mutedHoverPressableClass,
          ),

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (info) => joinClassNames(
            'm-2 text-end',
            info.isNarrow ? xxsTextClass : 'text-xs',
          ),
          allDayDividerClass: `border-b border-(--mui-palette-divider)`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (info) => joinClassNames(
            'm-2',
            info.isNarrow ? xxsTextClass : 'text-xs',
          ),
          slotHeaderDividerClass: `border-e border-(--mui-palette-divider)`,

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (info) => joinClassNames(
            'group border-s-6 border-(--fc-event-color) p-3 rounded-sm',
            info.isInteractive
              ? eventFaintPressableClass
              : eventFaintBgClass,
          ),
          listItemEventInnerClass: 'gap-2 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-40 whitespace-nowrap overflow-hidden text-ellipsis',
          listItemEventTitleClass: (info) => joinClassNames(
            'grow min-w-0 whitespace-nowrap overflow-hidden font-semibold',
            info.event.url && 'group-hover:underline',
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
