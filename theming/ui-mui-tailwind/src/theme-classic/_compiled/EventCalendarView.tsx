import React from 'react'
import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import CloseIcon from '@mui/icons-material/Close'

// outline
export const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
export const outlineOffsetClass = 'outline-offset-1'
export const outlineInsetClass = '-outline-offset-3'
export const primaryOutlineColorClass = 'outline-[rgba(var(--mui-palette-primary-mainChannel)_/_0.5)]'

// stronger (20%)
const strongerSolidBgHoverClass = 'hover:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_20%,var(--mui-palette-background-paper))]'

// strongest (25%)
const strongestSolidBgActiveClass = 'active:bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_25%,var(--mui-palette-background-paper))]'

// strong (16%)
const strongSolidBgClass = 'bg-[color-mix(in_oklab,var(--mui-palette-text-primary)_16%,var(--mui-palette-background-paper))]'
export const strongSolidPressableClass = `${strongSolidBgClass} ${strongerSolidBgHoverClass} ${strongestSolidBgActiveClass}`

// muted (8%)
export const mutedBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
export const mutedSolidBgClass = '[background:linear-gradient(rgba(var(--mui-palette-text-primaryChannel)_/_0.08),rgba(var(--mui-palette-text-primaryChannel)_/_0.08))_var(--mui-palette-background-paper)]'
const mutedBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
export const mutedHoverPressableClass = `${mutedBgHoverClass} focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)] ${mutedBgActiveClass}`

// faint (4%)
export const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
export const faintHoverPressableClass = `${faintBgHoverClass} ${faintBgFocusClass} ${mutedBgActiveClass}`

// how MUI does icon color
const pressableIconClass = 'text-(--mui-palette-action-active) group-hover:text-(--mui-palette-text-primary) group-focus-visible:text-(--mui-palette-text-primary)'

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

export const getDayClass = (data: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => joinClassNames(
  'border',
  data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
  data.isDisabled ? faintBgClass :
    data.isToday && 'not-print:bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',
)

export const getSlotClass = (data: { isMinor: boolean }) => joinClassNames(
  `border border-(--mui-palette-divider)`,
  data.isMinor && 'border-dotted',
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    `mb-px p-px rounded-sm`,
    data.isNarrow ? 'mx-px' : 'mx-0.5',
    data.isSelected
      ? joinClassNames(mutedBgClass, data.isDragging && 'shadow-sm')
      : (data.isInteractive ? mutedHoverPressableClass : mutedBgHoverClass),
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
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (data) => [
    data.isStart && joinClassNames('rounded-s-sm', data.isNarrow ? 'ms-px' : 'ms-0.5'),
    data.isEnd && joinClassNames('rounded-e-sm', data.isNarrow ? 'me-px' : 'me-0.5'),
  ],
  rowEventInnerClass: 'py-px gap-0.5',
  rowEventTimeClass: 'px-px',
  rowEventTitleClass: 'px-px',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (data) => [
    'mb-px border rounded-sm',
    data.isNarrow
      ? `mx-px border-(--mui-palette-primary-main)`
      : 'self-start mx-0.5 border-transparent',
    mutedHoverPressableClass,
  ],
  rowMoreLinkInnerClass: (data) => [
    'p-px',
    data.isNarrow ? xxsTextClass : 'text-xs',
  ],
}

export default function EventCalendarView({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <FullCalendar

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventColor="var(--mui-palette-primary-main)"
      eventContrastColor="var(--mui-palette-primary-contrastText)"
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

      backgroundEventColor="var(--mui-palette-secondary-main)"
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
        `ring ring-(--mui-palette-background-paper)`,
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
        `ring ring-(--mui-palette-background-paper)`,
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
        data.isDisabled && faintBgClass,
        data.inPopover
          ? 'border-b border-(--mui-palette-divider)'
          : joinClassNames(
              'border',
              data.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
            ),
      ]}
      dayHeaderInnerClass={(data) => [
        'px-1 py-0.5 flex flex-col',
        data.isNarrow ? xxsTextClass : 'text-sm',
      ]}
      dayHeaderDividerClass="border-b border-(--mui-palette-divider)"

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
        data.isOther && 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.38)]',
        data.monthText && 'font-bold',
      ]}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55"
      popoverCloseClass={[
        'group absolute top-0.5 end-0.5',
        outlineWidthFocusClass,
        primaryOutlineColorClass,
      ]}
      popoverCloseContent={() => (
        <CloseIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={pressableIconClass}
        />
      )}

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
        `border-b border-(--mui-palette-divider) ${mutedSolidBgClass}`,
        'flex flex-row items-center justify-between',
      ]}
      listDayHeaderInnerClass="px-3 py-2 text-sm font-bold"

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-4"
      singleMonthHeaderClass={(data) => [
        data.isSticky && `border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)`,
        data.colCount > 1 ? 'pb-4' : 'py-2',
        'items-center',
      ]}
      singleMonthHeaderInnerClass="font-bold"

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-(--mui-palette-background-paper)'}
      fillerClass="border border-(--mui-palette-divider) opacity-50"
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
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
        `absolute top-0 start-0 rounded-ee-sm p-0.5 text-center`,
        'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
        mutedBgClass,
        data.isNarrow ? xxsTextClass : 'text-sm',
      ]}
      nonBusinessClass={faintBgClass}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"

      /* View-Specific Options
      ------------------------------------------------------------------------------------------- */

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
          tableClass: `border border-(--mui-palette-divider)`,
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: 'min-h-3',

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            'px-1 py-0.5',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (data) => [
            'px-1 py-2 whitespace-pre text-end',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          allDayDividerClass: `border-y border-(--mui-palette-divider) pb-0.5 ${mutedBgClass}`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'px-1 py-0.5',
            data.isNarrow ? xxsTextClass : 'text-sm',
          ],
          slotHeaderDividerClass: `border-e border-(--mui-palette-divider)`,

          /* TimeGrid > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: [
            'start-0 -mt-[5px]',
            'border-y-[5px] border-y-transparent',
            `border-s-[6px] border-s-(--mui-palette-error-main)`,
          ],
          nowIndicatorLineClass: `border-t border-(--mui-palette-error-main)`,

          ...userViews?.timeGrid,
        },
        list: {

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (data) => [
            `group border-b border-(--mui-palette-divider) px-3 py-2 gap-3`,
            data.isInteractive
              ? joinClassNames(faintHoverPressableClass, outlineInsetClass)
              : 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]',
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
          --------------------------------------------------------------------------------------- */

          noEventsClass: `${mutedBgClass} flex flex-col items-center justify-center`,
          noEventsInnerClass: 'sticky bottom-0 py-15',

          ...userViews?.list,
        },
      }}
      {...restOptions}
    />
  )
}

