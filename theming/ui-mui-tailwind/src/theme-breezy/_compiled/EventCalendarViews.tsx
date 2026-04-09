import React from 'react'
import FullCalendar, { type CalendarOptions, type DayCellInfo, type DayHeaderInfo, joinClassNames } from '@fullcalendar/react'
import CloseIcon from '@mui/icons-material/Close'

// outline
export const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
export const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
export const outlineOffsetClass = 'outline-offset-1'
export const primaryOutlineColorClass = 'outline-(--mui-palette-primary-main)'

// strongest (25%)
const strongestSolidBgActiveClass = 'active:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_25%,var(--mui-palette-background-paper))]'

// stronger (20%)
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_20%,var(--mui-palette-background-paper))]'

// strong (16%)
const strongBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]'
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_16%,var(--mui-palette-background-paper))]'
export const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass} ${strongestSolidBgActiveClass}`

// muted (8%)
export const mutedBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
export const mutedHoverPressableClass = `${mutedBgHoverClass} ${strongBgFocusClass} ${strongBgActiveClass}`

// faint (4%)
export const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintHoverPressableClass = `${faintBgHoverClass} ${faintBgFocusClass} ${mutedBgActiveClass}`

// primary
export const primaryClass = 'bg-(--mui-palette-primary-main) text-(--mui-palette-primary-contrastText)'
export const primaryPressableClass = `${primaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.8)]`
export const primaryPressableGroupClass = `${primaryClass} group-hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.9)] group-active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.8)]`

// event content
export const eventMutedFgClass = 'text-[color-mix(in_oklab,var(--fc-event-color)_50%,var(--mui-palette-text-primary))]'
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
const blockTouchResizerClass = `absolute size-2 border border-(--fc-event-color) bg-(--mui-palette-background-paper) rounded-full`
export const rowTouchResizerClass = `${blockTouchResizerClass} top-1/2 -mt-1`
const columnTouchResizerClass = `${blockTouchResizerClass} left-1/2 -ml-1`

export const getNormalDayHeaderBorderClass = (info: DayHeaderInfo) => joinClassNames(
  !info.inPopover && (
    info.isMajor ? `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]` :
      !info.isNarrow && `border border-(--mui-palette-divider)`
  )
)
export const getMutedDayHeaderBorderClass = (info: DayHeaderInfo) => joinClassNames(
  !info.inPopover && (
    info.isMajor ? `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]` :
      !info.isNarrow && `border border-(--mui-palette-divider)`
  )
)

export const getNormalDayCellBorderColorClass = (info: DayCellInfo) => joinClassNames(
  info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)'
)
export const getMutedDayCellBorderColorClass = (info: DayCellInfo) => joinClassNames(
  info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)'
)

export const tallDayCellBottomClass = 'min-h-3'
export const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
  !info.isNarrow && 'min-h-px'
)

const mutedHoverButtonClass = joinClassNames(
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => joinClassNames(
    'mb-px p-px',
    info.isNarrow
      ? 'mx-px rounded-sm'
      : 'mx-1 rounded-md',
    info.isSelected
      ? mutedBgClass
      : info.isInteractive
        ? mutedHoverPressableClass
        : mutedBgHoverClass,
  ),
  listItemEventInnerClass: (info) => joinClassNames(
    'flex flex-row items-center justify-between',
    info.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs',
  ),
  listItemEventTimeClass: (info) => joinClassNames(
    info.isNarrow ? 'px-px' : 'px-0.5',
    'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] order-1 whitespace-nowrap overflow-hidden shrink-1',
  ),
  listItemEventTitleClass: (info) => joinClassNames(
    info.isNarrow ? 'px-px' : 'px-0.5',
    'text-(--mui-palette-text-primary) font-medium whitespace-nowrap overflow-hidden shrink-100',
    info.timeText && 'text-ellipsis',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (info) => joinClassNames(
    info.isStart && (info.isNarrow ? 'ms-0.5' : 'ms-1'),
    info.isEnd && (info.isNarrow ? 'me-0.5' : 'me-1'),
  ),
  rowEventInnerClass: (info) => joinClassNames(info.isNarrow ? 'py-px' : 'py-0.5'),

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => joinClassNames(
    'mb-px border',
    info.isNarrow
      ? `mx-px border-(--mui-palette-primary-main) rounded-sm`
      : 'self-start mx-1 border-transparent rounded-md',
    mutedHoverPressableClass,
  ),
  rowMoreLinkInnerClass: (info) => joinClassNames(
    info.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--mui-palette-text-primary)',
  )
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
              info.isDragging && 'shadow-md',
            )
          : outlineWidthFocusClass,
        primaryOutlineColorClass,
      )}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--mui-palette-secondary-main)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_8%,transparent)]"
      backgroundEventTitleClass={(info) => joinClassNames(
        'opacity-50 italic text-(--mui-palette-text-primary)',
        info.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      )}

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(info) => joinClassNames(
        'group relative print:bg-white border-transparent print:border-(--fc-event-color)',
        info.isInteractive
          ? eventFaintPressableClass
          : eventFaintBgClass,
        (info.isDragging && !info.isSelected) && 'opacity-75',
      )}
      blockEventInnerClass={eventMutedFgClass}
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(info) => joinClassNames(
        'mb-px border-y',
        info.isStart && joinClassNames('border-s', info.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
        info.isEnd && joinClassNames('border-e', info.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
      )}
      rowEventBeforeClass={(info) => joinClassNames(
        info.isStartResizable && joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-start-1',
        )
      )}
      rowEventAfterClass={(info) => joinClassNames(
        info.isEndResizable && joinClassNames(
          info.isSelected ? rowTouchResizerClass : rowPointerResizerClass,
          '-end-1',
        )
      )}
      rowEventInnerClass={(info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}
      rowEventTimeClass={(info) => joinClassNames(
        info.isNarrow ? 'ps-0.5' : 'ps-1',
        'font-medium',
      )}
      rowEventTitleClass={(info) => info.isNarrow ? 'px-0.5' : 'px-1'}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(info) => joinClassNames(
        `border-x ring ring-(--mui-palette-background-paper)`,
        info.isStart && joinClassNames('border-t rounded-t-lg', info.isNarrow ? 'mt-px' : 'mt-1'),
        info.isEnd && joinClassNames('border-b rounded-b-lg', info.isNarrow ? 'mb-px' : 'mb-1'),
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
          ? 'flex-row items-center gap-1 p-1'
          : joinClassNames(
              'flex-col',
              info.isNarrow ? 'px-1 py-0.5' : 'px-2 py-1',
            ),
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}
      columnEventTimeClass={(info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
        'font-semibold',
      )}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={(info) => joinClassNames(
        info.isNarrow ? 'my-px' : 'my-1',
        `border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white ring ring-(--mui-palette-background-paper)`,
      )}
      columnMoreLinkInnerClass={(info) => joinClassNames(
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        'text-(--mui-palette-text-primary)',
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(info) => info.inPopover ? 'start' : 'center'}
      dayHeaderClass={(info) => joinClassNames(
        'justify-center',
        info.inPopover && 'border-b border-(--mui-palette-divider)',
      )}
      dayHeaderInnerClass={(info) => joinClassNames(
        'flex flex-row items-center',
        (!info.dayNumberText && !info.inPopover)
          ? joinClassNames(
              'py-1 rounded-sm text-xs',
              info.isNarrow
                ? `px-1 m-1 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]`
                : `px-1.5 m-2 font-semibold text-(--mui-palette-text-primary)`,
              info.hasNavLink && mutedHoverButtonClass,
            )
          : (info.isToday && info.dayNumberText && !info.inPopover)
              ? joinClassNames(
                  'group m-2 outline-none',
                  info.isNarrow ? 'h-6' : 'h-8'
                )
              : joinClassNames(
                  'rounded-sm',
                  info.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : joinClassNames(
                        'mx-2 h-6 px-1.5',
                        info.isNarrow ? 'my-2' : 'my-3'
                      ),
                  info.hasNavLink && mutedHoverButtonClass,
                ),
      )}
      dayHeaderContent={(info) => (
        (!info.dayNumberText && !info.inPopover) ? (
          <>{info.text}</>
        ) : (
          <>
            {info.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  info.isNarrow ? 'text-xs' : 'text-sm',
                  textPart.type === 'day'
                    ? joinClassNames(
                        'flex flex-row items-center',
                        !info.isNarrow && 'font-semibold',
                        (info.isToday && !info.inPopover)
                          ? joinClassNames(
                              'mx-0.5 rounded-full justify-center',
                              info.isNarrow ? 'size-6' : 'size-8',
                              info.hasNavLink
                                ? joinClassNames(
                                    primaryPressableGroupClass,
                                    outlineWidthGroupFocusClass,
                                    outlineOffsetClass,
                                    primaryOutlineColorClass,
                                  )
                                : primaryClass,
                            )
                          : 'text-(--mui-palette-text-primary)'
                      )
                    : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
                )}
              >{textPart.value}</span>
            ))}
          </>
        )
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(info) => joinClassNames(
        'border',
        ((info.isOther || info.isDisabled) && !info.options.businessHours) && faintBgClass,
      )}
      dayCellTopClass={(info) => joinClassNames(
        info.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row',
      )}
      dayCellTopInnerClass={(info) => joinClassNames(
        'flex flex-row items-center justify-center whitespace-nowrap',
        info.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-xs',
        info.isToday
          ? joinClassNames(
              'rounded-full font-semibold',
              info.isNarrow
                ? 'ms-px'
                : 'ms-1',
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
              info.isOther
                ? 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]'
                : (info.monthText ? 'text-(--mui-palette-text-primary)' : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]'),
              info.monthText && 'font-bold',
            ),
      )}
      dayCellInnerClass={(info) => joinClassNames(info.inPopover && 'p-2')}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55"
      popoverCloseClass={`group absolute top-2 end-2 p-0.5 rounded-sm ${mutedHoverButtonClass}`}
      popoverCloseContent={() => (
        <CloseIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={pressableIconClass}
        />
      )}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        info.isDisabled && faintBgClass,
      )}
      dayLaneInnerClass={(info) => joinClassNames(
        info.isStack
          ? 'm-1'
          : info.isNarrow ? 'mx-px' : 'mx-1'
      )}
      slotLaneClass={(info) => joinClassNames(
        'border border-(--mui-palette-divider)',
        info.isMinor && 'border-dotted',
      )}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDaysClass="my-10 mx-auto w-full max-w-218 px-4"
      listDayClass={(info) => joinClassNames(
        !info.isLast && 'border-b border-(--mui-palette-divider)',
        'flex flex-row items-start gap-2',
      )}
      listDayHeaderClass="my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start"
      listDayHeaderInnerClass={(info) => joinClassNames(
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !info.level
          ? joinClassNames(
              info.isToday
                ? joinClassNames(
                    'font-semibold',
                    info.hasNavLink ? primaryPressableClass : primaryClass,
                  )
                : joinClassNames(
                    `font-medium text-(--mui-palette-text-primary)`,
                    info.hasNavLink && mutedHoverPressableClass,
                  )
            )
          : joinClassNames(
              'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
              info.hasNavLink && joinClassNames(
                mutedHoverPressableClass,
                'hover:text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
              ),
            )
      )}
      listDayBodyClass="my-4 grow min-w-0 border border-(--mui-palette-divider) rounded-md"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass={(info) => joinClassNames(
        info.multiMonthColumnCount > 1 && 'm-4',
        (info.multiMonthColumnCount === 1 && !info.isLast) && 'border-b border-(--mui-palette-divider)',
      )}
      singleMonthHeaderClass={(info) => joinClassNames(
        info.multiMonthColumnCount > 1 ? 'pb-1' : 'py-1.5 bg-(--mui-palette-background-paper) border-b border-(--mui-palette-divider)',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(info) => joinClassNames(
        `py-1 px-2 rounded-md text-sm text-(--mui-palette-text-primary) font-semibold`,
        info.hasNavLink && mutedHoverPressableClass,
      )}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass="bg-(--mui-palette-background-paper)"
      fillerClass="border border-(--mui-palette-divider)"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
      slotHeaderInnerClass="text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)] uppercase"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      inlineWeekNumberClass={(info) => joinClassNames(
        'absolute top-0 end-0 bg-(--mui-palette-background-paper) text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] whitespace-nowrap rounded-es-md border-b border-b-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] border-s border-s-(--mui-palette-divider)',
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        info.hasNavLink
          ? `${mutedHoverPressableClass} -outline-offset-1`
          : mutedBgHoverClass,
      )}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"
      nonBusinessClass={faintBgClass}
      nowIndicatorLineClass="-m-px border-1 border-(--mui-palette-error-main)"
      nowIndicatorDotClass="-m-[6px] border-6 border-(--mui-palette-error-main) size-0 rounded-full ring-2 ring-(--mui-palette-background-paper)"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getNormalDayHeaderBorderClass,
          dayHeaderDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]`,
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          backgroundEventInnerClass: 'flex flex-row justify-end',
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderClass: getNormalDayHeaderBorderClass,
          dayHeaderDividerClass: (info) => joinClassNames(info.multiMonthColumnCount === 1 && `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`),
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableBodyClass: (info) => joinClassNames(info.multiMonthColumnCount > 1 && 'border border-(--mui-palette-divider) rounded-md shadow-xs overflow-hidden'),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getMutedDayHeaderBorderClass,
          dayHeaderDividerClass: (info) => joinClassNames(
            'border-b',
            info.options.allDaySlot
              ? 'border-(--mui-palette-divider)'
              : `border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,
          ),
          dayCellClass: getMutedDayCellBorderColorClass,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (info) => joinClassNames(
            `m-1.5 h-6 px-1.5 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] rounded-sm flex flex-row items-center`,
            info.hasNavLink && mutedHoverPressableClass,
            info.isNarrow ? 'text-xs' : 'text-sm',
          ),

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (info) => joinClassNames(
            `m-3 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]`,
            info.isNarrow ? xxsTextClass : 'text-xs',
          ),
          allDayDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (info) => joinClassNames(
            'relative mx-3 my-2',
            info.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            info.isFirst && 'hidden',
          ),
          slotHeaderDividerClass: `border-e border-(--mui-palette-divider)`,

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (info) => joinClassNames(
            'group p-4 items-center gap-3',
            !info.isLast && 'border-b border-(--mui-palette-divider)',
            info.isInteractive
              ? faintHoverPressableClass
              : faintBgHoverClass,
          ),
          listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full',
          listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',
          listItemEventTimeClass: 'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
          listItemEventTitleClass: (info) => joinClassNames(
            'grow min-w-0 font-medium whitespace-nowrap overflow-hidden text-(--mui-palette-text-primary)',
            info.event.url && 'group-hover:underline',
          ),

          /* No-Events Screen
          --------------------------------------------------------------------------------------- */

          noEventsClass: 'grow flex flex-col items-center justify-center',
          noEventsInnerClass: 'py-15 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',

          ...userViews?.list,
        },
      }}
      {...restOptions}
    />
  )
}
