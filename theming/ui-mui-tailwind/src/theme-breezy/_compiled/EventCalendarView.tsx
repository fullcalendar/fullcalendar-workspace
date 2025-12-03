import React from 'react'
import { CalendarOptions, DayCellData, DayHeaderData, joinClassNames } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import CloseIcon from '@mui/icons-material/Close'

export interface EventCalendarProps extends Omit<CalendarOptions, 'class' | 'className'> {
  className?: string
}

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

export const getNormalDayHeaderBorderClass = (data: DayHeaderData) => (
  !data.inPopover && (
    data.isMajor ? `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]` :
      !data.isNarrow && `border border-(--mui-palette-divider)`
  )
)
export const getMutedDayHeaderBorderClass = (data: DayHeaderData) => (
  !data.inPopover && (
    data.isMajor ? `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]` :
      !data.isNarrow && `border border-(--mui-palette-divider)`
  )
)

export const getNormalDayCellBorderColorClass = (data: DayCellData) => (
  data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)'
)
export const getMutedDayCellBorderColorClass = (data: DayCellData) => (
  data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)'
)

export const tallDayCellBottomClass = 'min-h-3'
export const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

const mutedHoverButtonClass = joinClassNames(
  mutedHoverPressableClass,
  outlineWidthFocusClass,
  primaryOutlineColorClass,
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px',
    data.isNarrow
      ? 'mx-px rounded-sm'
      : 'mx-1 rounded-md',
    data.isSelected
      ? mutedBgClass
      : data.isInteractive
        ? mutedHoverPressableClass
        : mutedBgHoverClass,
  ],
  listItemEventInnerClass: (data) => [
    'flex flex-row items-center justify-between',
    data.isNarrow
      ? `py-px ${xxsTextClass}`
      : 'py-0.5 text-xs',
  ],
  listItemEventTimeClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
    'order-1 whitespace-nowrap overflow-hidden shrink-1',
  ],
  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
    'text-(--mui-palette-text-primary)',
    'font-medium whitespace-nowrap overflow-hidden shrink-100',
    data.timeText && 'text-ellipsis',
  ],

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && (data.isNarrow ? 'ms-0.5' : 'ms-1'),
    data.isEnd && (data.isNarrow ? 'me-0.5' : 'me-1'),
  ],
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border',
    data.isNarrow
      ? `mx-px border-(--mui-palette-primary-main) rounded-sm`
      : 'self-start mx-1 border-transparent rounded-md',
    mutedHoverPressableClass,
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--mui-palette-text-primary)',
  ]
}

export default function EventCalendarView({
  views: userViews,
  ...restOptions
}: EventCalendarProps) {
  return (
    <FullCalendar

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventShortHeight={50}
      eventColor="var(--mui-palette-primary-main)"
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging && 'shadow-md',
            )
          : outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--mui-palette-secondary-main)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]"
      backgroundEventTitleClass={(data) => [
        'opacity-50 italic',
        data.isNarrow
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        'text-(--mui-palette-text-primary)',
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
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && joinClassNames('border-s', data.isNarrow ? 'rounded-s-sm' : 'rounded-s-md'),
        data.isEnd && joinClassNames('border-e', data.isNarrow ? 'rounded-e-sm' : 'rounded-e-md'),
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
        `border-x ring ring-(--mui-palette-background-paper)`,
        data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-1'),
        data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-1'),
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
          : joinClassNames(
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
        primaryOutlineColorClass,
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={(data) => [
        data.isNarrow ? 'my-px' : 'my-1',
        'border border-transparent print:border-black rounded-md',
        `${strongSolidPressableClass} print:bg-white`,
        `ring ring-(--mui-palette-background-paper)`,
      ]}
      columnMoreLinkInnerClass={(data) => [
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        'text-(--mui-palette-text-primary)',
      ]}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(data) => data.inPopover ? 'start' : 'center'}
      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover && 'border-b border-(--mui-palette-divider)',
      ]}
      dayHeaderInnerClass={(data) => [
        'flex flex-row items-center',
        (!data.dayNumberText && !data.inPopover)
          ? joinClassNames(
              'py-1 rounded-sm text-xs',
              data.isNarrow
                ? `px-1 m-1 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]`
                : `px-1.5 m-2 font-semibold text-(--mui-palette-text-primary)`,
              data.hasNavLink && mutedHoverButtonClass,
            )
          : (data.isToday && data.dayNumberText && !data.inPopover)
              ? joinClassNames(
                  'group m-2 outline-none',
                  data.isNarrow ? 'h-6' : 'h-8'
                )
              : joinClassNames(
                  'rounded-sm',
                  data.inPopover
                    ? 'm-2 px-1 py-0.5'
                    : joinClassNames(
                        'mx-2 h-6 px-1.5',
                        data.isNarrow ? 'my-2' : 'my-3'
                      ),
                  data.hasNavLink && mutedHoverButtonClass,
                ),
      ]}
      dayHeaderContent={(data) => (
        (!data.dayNumberText && !data.inPopover) ? (
          <React.Fragment>{data.text}</React.Fragment>
        ) : (
          <React.Fragment>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  data.isNarrow ? 'text-xs' : 'text-sm',
                  textPart.type === 'day'
                    ? joinClassNames(
                        'flex flex-row items-center',
                        !data.isNarrow && 'font-semibold',
                        (data.isToday && !data.inPopover)
                          ? joinClassNames(
                              'mx-0.5 rounded-full justify-center',
                              data.isNarrow ? 'size-6' : 'size-8',
                              data.hasNavLink
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
          </React.Fragment>
        )
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        ((data.isOther || data.isDisabled) && !data.options.businessHours) && faintBgClass,
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
          ? joinClassNames(
              'rounded-full font-semibold',
              data.isNarrow
                ? 'ms-px'
                : 'ms-1',
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
              data.isOther
                ? 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]'
                : (data.monthText ? 'text-(--mui-palette-text-primary)' : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]'),
              data.monthText && 'font-bold',
            ),
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55"
      popoverCloseClass={[
        'group absolute top-2 end-2 p-0.5 rounded-sm',
        mutedHoverButtonClass,
      ]}
      popoverCloseContent={() => (
        <CloseIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={pressableIconClass}
        />
      )}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        data.isDisabled && faintBgClass,
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'mx-1'
      )}
      slotLaneClass={(data) => [
        `border border-(--mui-palette-divider)`,
        data.isMinor && 'border-dotted',
      ]}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDaysClass="my-10 mx-auto w-full max-w-218 px-4"
      listDayClass={[
        `not-last:border-b border-(--mui-palette-divider)`,
        'flex flex-row items-start gap-2',
      ]}
      listDayHeaderClass="my-px shrink-0 w-1/4 max-w-50 py-3.5 flex flex-col items-start"
      listDayHeaderInnerClass={(data) => [
        'my-0.5 py-0.5 px-2 -mx-2 rounded-full text-sm',
        !data.level
          ? joinClassNames(
              data.isToday
                ? joinClassNames(
                    'font-semibold',
                    data.hasNavLink ? primaryPressableClass : primaryClass,
                  )
                : joinClassNames(
                    `font-medium text-(--mui-palette-text-primary)`,
                    data.hasNavLink && mutedHoverPressableClass,
                  )
            )
          : joinClassNames(
              'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
              data.hasNavLink && joinClassNames(
                mutedHoverPressableClass,
                'hover:text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
              ),
            )
      ]}
      listDayEventsClass="my-4 grow min-w-0 border border-(--mui-palette-divider) rounded-md"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.isSticky && `bg-(--mui-palette-background-paper) border-b border-(--mui-palette-divider)`,
        data.colCount > 1 ? 'pb-1' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        `py-1 px-2 rounded-md text-sm font-semibold text-(--mui-palette-text-primary)`,
        data.hasNavLink && mutedHoverPressableClass,
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      fillerClass="border border-(--mui-palette-divider)"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
      slotHeaderInnerClass="text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)] uppercase"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        `absolute top-0 end-0 bg-(--mui-palette-background-paper) text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] whitespace-nowrap rounded-es-md`,
        `border-b border-b-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]`,
        `border-s border-s-(--mui-palette-divider)`,
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
        data.hasNavLink
          ? `${mutedHoverPressableClass} -outline-offset-1`
          : mutedBgHoverClass,
      ]}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"
      nonBusinessClass={faintBgClass}
      nowIndicatorLineClass="-m-px border-1 border-(--mui-palette-error-main)"
      nowIndicatorDotClass={[
        `-m-[6px] border-6 border-(--mui-palette-error-main) size-0 rounded-full`,
        `ring-2 ring-(--mui-palette-background-paper)`,
      ]}

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
          dayHeaderDividerClass: (data) => data.isSticky && `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,
          dayCellClass: getNormalDayCellBorderColorClass,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableHeaderClass: (data) => data.isSticky && 'bg-(--mui-palette-background-paper)',
          tableBodyClass: `border border-(--mui-palette-divider) rounded-md shadow-xs overflow-hidden`,
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderClass: getMutedDayHeaderBorderClass,
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? 'border-(--mui-palette-divider)'
              : `border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,
          ],
          dayCellClass: getMutedDayCellBorderColorClass,
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            `m-1.5 h-6 px-1.5 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] rounded-sm flex flex-row items-center`,
            data.hasNavLink && mutedHoverPressableClass,
            data.isNarrow ? 'text-xs' : 'text-sm',
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => [
            `p-3 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]`,
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'relative px-3 py-2',
            data.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            data.isFirst && 'hidden',
          ],
          slotHeaderDividerClass: `border-e border-(--mui-palette-divider)`,

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            `group not-last:border-b border-(--mui-palette-divider) p-4 items-center gap-3`,
            data.isInteractive
              ? faintHoverPressableClass
              : faintBgHoverClass,
          ],
          listItemEventBeforeClass: 'border-4 border-(--fc-event-color) rounded-full',
          listItemEventInnerClass: 'flex flex-row items-center gap-3 text-sm',
          listItemEventTimeClass: [
            'shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis',
            'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
          ],
          listItemEventTitleClass: (data) => [
            'grow min-w-0 font-medium whitespace-nowrap overflow-hidden',
            'text-(--mui-palette-text-primary)',
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
