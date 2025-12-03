import React from 'react'
import { CalendarOptions, DayCellData, joinClassNames } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import CloseIcon from '@mui/icons-material/Close'

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
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_16%,var(--mui-palette-background-paper))]'
export const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass} ${strongestSolidBgActiveClass}`

// muted (8%)
export const mutedBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
export const mutedHoverPressableClass = `${mutedBgHoverClass} focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)] ${mutedBgActiveClass}`
export const mutedHoverPressableGroupClass = `group-hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)] group-focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)] group-active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]`

// faint (4%)
export const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'

// secondary (less-contrasty version of primary)
export const secondaryClass = 'bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.15)] brightness-110'
export const secondaryPressableClass = `${secondaryClass} hover:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.2)] active:bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.3)]`

// tertiary (it's actually MUI's "secondary", like an accent color)
export const tertiaryClass = 'bg-(--mui-palette-secondary-main) text-(--mui-palette-secondary-contrastText)'
export const tertiaryPressableClass = `${tertiaryClass} hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)]`
export const tertiaryPressableGroupClass = `${tertiaryClass} group-hover:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.9)] group-active:bg-[rgba(var(--mui-palette-secondary-mainChannel)_/_0.8)]`

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

export const tallDayCellBottomClass = 'min-h-4'
export const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-px'
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

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
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && 'ms-px',
    data.isEnd && 'me-px',
  ],
  rowEventInnerClass: (data) => data.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? `mx-px border-(--mui-palette-primary-main)`
      : 'mx-0.5 border-transparent',
    mutedHoverPressableClass,
  ],
  rowMoreLinkInnerClass: (data) => (
    data.isNarrow
      ? `px-0.5 py-px ${xxsTextClass}`
      : 'px-1 py-0.5 text-xs'
  ),
}

const filledRightTriangle = (className?: string) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 800 2200"
    preserveAspectRatio="none"
    className={className}
  >
    <polygon points="0,0 66,0 800,1100 66,2200 0,2200" fill="currentColor" />
  </svg>
)

export default function EventCalendarView({
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
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging ? 'shadow-lg' : 'shadow-md',
            )
          : outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}

      /* Background Event
      ------------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--mui-palette-secondary-main)"
      backgroundEventClass="bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)]"
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
          ? mutedBgClass
          : data.isInteractive
            ? mutedHoverPressableClass
            : mutedBgHoverClass,
      ]}
      listItemEventBeforeClass="rounded-full border-(--fc-event-color)"
      listItemEventInnerClass="flex flex-row items-center"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative',
        'border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))] print:bg-white',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (!data.isSelected && data.isDragging) && 'opacity-75',
      ]}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden"
      blockEventTitleClass="whitespace-nowrap overflow-hidden"

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
        `border-x ring ring-(--mui-palette-background-paper)`,
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
          : joinClassNames(
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
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={[
        'mb-px border border-transparent print:border-black rounded-sm',
        `${strongSolidPressableClass} print:bg-white`,
        `ring ring-(--mui-palette-background-paper)`,
      ]}
      columnMoreLinkInnerClass={(data) => (
        data.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs'
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign="center"
      dayHeaderClass={(data) => [
        'justify-center',
        data.isMajor && `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]`,
        (data.isDisabled && !data.inPopover) && faintBgClass,
      ]}
      dayHeaderInnerClass="group mt-2 mx-2 flex flex-col items-center outline-none"
      dayHeaderContent={(data) => (
        <React.Fragment>
          {data.weekdayText && (
            <div
              className={joinClassNames(
                'text-xs uppercase',
                'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
              )}
            >{data.weekdayText}</div>
          )}
          {data.dayNumberText && (
            <div
              className={joinClassNames(
                'm-0.5 rounded-full flex flex-row items-center justify-center',
                data.isNarrow
                  ? 'size-7 text-md'
                  : 'size-8 text-lg',
                data.isToday
                  ? (data.hasNavLink ? tertiaryPressableGroupClass : tertiaryClass)
                  : (data.hasNavLink && mutedHoverPressableGroupClass),
                data.hasNavLink && joinClassNames(
                  outlineWidthGroupFocusClass,
                  tertiaryOutlineColorClass,
                ),
              )}
            >{data.dayNumberText}</div>
          )}
        </React.Fragment>
      )}

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={(data) => [
        'border',
        data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        data.isDisabled && faintBgClass,
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
          ? (data.hasNavLink ? tertiaryPressableClass : tertiaryClass)
          : (data.hasNavLink && mutedHoverPressableClass),
        data.isOther && 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.4)]',
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      dayPopoverFormat={{ day: 'numeric', weekday: 'short' }}
      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-60"
      popoverCloseClass={[
        'group absolute top-2 end-2 size-8 rounded-full',
        'items-center justify-center',
        mutedHoverPressableClass,
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      popoverCloseContent={() => (
        <CloseIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={pressableIconClass}
        />
      )}
      dayLaneClass={(data) => [
        'border',
        data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        data.isDisabled && faintBgClass,
      ]}
      dayLaneInnerClass={(data) => (
        data.isStack
          ? 'm-1'
          : data.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={(data) => [
        `border border-(--mui-palette-divider)`,
        data.isMinor && 'border-dotted',
      ]}
      listDayFormat={{ day: 'numeric' }}
      listDaySideFormat={{ month: 'short', weekday: 'short', forceCommas: true }}
      listDayClass="not-last:border-b border-(--mui-palette-divider) flex flex-row items-start"
      listDayHeaderClass="m-2 shrink-0 w-1/3 max-w-44 min-h-9 flex flex-row items-center gap-2"
      listDayHeaderInnerClass={(data) => (
        !data.level
          ? joinClassNames(
              'h-9 rounded-full flex flex-row items-center text-lg',
              data.text === data.dayNumberText
                ? 'w-9 justify-center'
                : 'px-3',
              data.isToday
                ? (data.hasNavLink ? tertiaryPressableClass : tertiaryClass)
                : (data.hasNavLink && mutedHoverPressableClass)
            )
          : joinClassNames(
              'text-xs uppercase',
              data.hasNavLink && 'hover:underline',
            )
      )}
      listDayEventsClass="grow min-w-0 py-2 gap-1"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.isSticky && `border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)`,
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-3 py-1 rounded-full font-bold',
        data.hasNavLink && mutedHoverPressableClass,
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => (
        data.isSticky && `border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)`
      )}
      fillerClass={(data) => [
        'opacity-50 border',
        data.isHeader ? 'border-transparent' : 'border-(--mui-palette-divider)',
      ]}
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        'absolute flex flex-row items-center whitespace-nowrap',
        data.isNarrow
          ? `top-0.5 start-0 my-px h-4 pe-1 rounded-e-full ${xxsTextClass}`
          : 'top-1.5 start-1 h-6 px-2 rounded-full text-sm',
        data.hasNavLink
          ? secondaryPressableClass
          : secondaryClass,
      ]}
      nonBusinessClass={faintBgClass}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"
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
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayCellBottomClass: getShortDayCellBottomClass,
          tableBodyClass: `border border-(--mui-palette-divider) rounded-sm`,
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
              ? secondaryPressableClass
              : secondaryClass,
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'p-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          allDayDividerClass: `border-b border-(--mui-palette-divider)`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: (data) => [
            'w-2 self-end justify-end',
            `border border-(--mui-palette-divider)`,
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
              : 'border-(--mui-palette-divider)',
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

