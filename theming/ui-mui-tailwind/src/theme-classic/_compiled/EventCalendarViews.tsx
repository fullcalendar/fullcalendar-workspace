import React from 'react'
import FullCalendar, { type CalendarOptions, joinClassNames } from '@fullcalendar/react'
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

export const getDayClass = (info: { isMajor: boolean, isToday: boolean, isDisabled: boolean}) => joinClassNames(
  'border',
  info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
  info.isDisabled ? faintBgClass :
    info.isToday && 'not-print:bg-[rgba(var(--mui-palette-warning-mainChannel)_/_0.1)]',
)

export const getSlotClass = (info: { isMinor: boolean }) => joinClassNames(
  `border border-(--mui-palette-divider)`,
  info.isMinor && 'border-dotted',
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => joinClassNames(
    `mb-px p-px rounded-sm`,
    info.isNarrow ? 'mx-px' : 'mx-0.5',
    info.isSelected
      ? joinClassNames(mutedBgClass, info.isDragging && 'shadow-sm')
      : (info.isInteractive ? mutedHoverPressableClass : mutedBgHoverClass),
  ),
  listItemEventBeforeClass: (info) => joinClassNames(
    'border-4',
    info.isNarrow ? 'mx-px' : 'mx-1',
  ),
  listItemEventInnerClass: (info) => joinClassNames(
    'flex flex-row items-center py-px gap-0.5',
    info.isNarrow ? xxsTextClass : 'text-xs',
  ),
  listItemEventTimeClass: 'px-px whitespace-nowrap overflow-hidden shrink-1',
  listItemEventTitleClass: 'px-px font-bold whitespace-nowrap overflow-hidden shrink-100',

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (info) => joinClassNames(
    info.isStart && joinClassNames('rounded-s-sm', info.isNarrow ? 'ms-px' : 'ms-0.5'),
    info.isEnd && joinClassNames('rounded-e-sm', info.isNarrow ? 'me-px' : 'me-0.5'),
  ),
  rowEventInnerClass: 'py-px gap-0.5',
  rowEventTimeClass: 'px-px',
  rowEventTitleClass: 'px-px',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => joinClassNames(
    'mb-px border rounded-sm',
    info.isNarrow
      ? `mx-px border-(--mui-palette-primary-main)`
      : 'self-start mx-0.5 border-transparent',
    mutedHoverPressableClass,
  ),
  rowMoreLinkInnerClass: (info) => joinClassNames(
    'p-px',
    info.isNarrow ? xxsTextClass : 'text-xs',
  ),
}

export default function EventCalendarViews({
  views: userViews,
  ...restOptions
}: CalendarOptions) {
  return (
    <FullCalendar

      /* Abstract Event
      ------------------------------------------------------------------------------------------- */

      eventColor="var(--mui-palette-primary-main)"
      eventContrastColor="var(--mui-palette-primary-contrastText)"
      eventClass={(info) => joinClassNames(
        info.isSelected
          ? joinClassNames(
              outlineWidthClass,
              info.isDragging ? 'shadow-lg' : 'shadow-md',
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
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1.5 text-xs',
      )}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventClass="items-center"
      listItemEventBeforeClass="border-(--fc-event-color) rounded-full"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(info) => joinClassNames(
        `group relative border-transparent print:border-(--fc-event-color) bg-(--fc-event-color) print:bg-white ${outlineOffsetClass}`,
        (info.isDragging && !info.isSelected) && 'opacity-75',
      )}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(info) => joinClassNames(
        'mb-px border-y',
        info.isStart && 'border-s',
        info.isEnd && 'border-e',
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
      rowEventTimeClass="font-bold"

      /* Column Event
      ------------------------------------------------------------------------------------------- */

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
          ? 'p-0.5 flex-row items-center gap-1'
          : 'px-0.5 flex-col',
      )}
      columnEventTimeClass={(info) => joinClassNames(
        !info.isShort && 'pt-0.5',
        xxsTextClass,
      )}
      columnEventTitleClass={(info) => joinClassNames(
        !info.isShort &&  'py-0.5',
        (info.isShort || info.isNarrow) ? xxsTextClass : 'text-xs',
      )}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={`${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={`mb-px rounded-sm border border-transparent print:border-black ${strongSolidPressableClass} print:bg-white ring ring-(--mui-palette-background-paper) ${outlineOffsetClass}`}
      columnMoreLinkInnerClass={(info) => joinClassNames(
        'p-0.5',
        info.isNarrow ? xxsTextClass : 'text-xs',
      )}

      /* Day Header
      ------------------------------------------------------------------------------------------- */

      dayHeaderAlign={(info) => info.inPopover ? 'start' : 'center'}
      dayHeaderClass={(info) => joinClassNames(
        'justify-center',
        info.isDisabled && faintBgClass,
        info.inPopover
          ? 'border-b border-(--mui-palette-divider)'
          : joinClassNames(
              'border',
              info.isMajor
                ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
                : 'border-(--mui-palette-divider)',
            ),
      )}
      dayHeaderInnerClass={(info) => joinClassNames(
        'mx-1 my-0.5 flex flex-col',
        info.isNarrow ? xxsTextClass : 'text-sm',
      )}
      dayHeaderDividerClass="border-b border-(--mui-palette-divider)"

      /* Day Cell
      ------------------------------------------------------------------------------------------- */

      dayCellClass={getDayClass}
      dayCellTopClass={(info) => joinClassNames(
        info.isNarrow ? 'min-h-px' : 'min-h-0.5',
        'flex flex-row justify-end',
      )}
      dayCellTopInnerClass={(info) => joinClassNames(
        'mx-1 whitespace-nowrap',
        info.isNarrow
          ? `my-0.5 ${xxsTextClass}`
          : 'my-1 text-sm',
        info.isOther && 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.38)]',
        info.monthText && 'font-bold',
      )}
      dayCellInnerClass={(info) => joinClassNames(info.inPopover && 'p-2')}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55"
      popoverCloseClass={`group absolute top-0.5 end-0.5 ${outlineWidthFocusClass} ${primaryOutlineColorClass}`}
      popoverCloseContent={() => (
        <CloseIcon
          sx={{ fontSize: 18, margin: '1px' }}
          className={pressableIconClass}
        />
      )}

      /* Lane
      ------------------------------------------------------------------------------------------- */

      dayLaneClass={getDayClass}
      dayLaneInnerClass={(info) => joinClassNames(
        info.isStack
          ? 'm-1'
          : info.isNarrow ? 'mx-px' : 'ms-0.5 me-[2.5%]'
      )}
      slotLaneClass={getSlotClass}

      /* List Day
      ------------------------------------------------------------------------------------------- */

      listDayHeaderClass={`-mb-px border-b border-(--mui-palette-divider) ${mutedSolidBgClass} flex flex-row items-center justify-between`}
      listDayHeaderInnerClass="px-3 py-2 text-sm font-bold"

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
      singleMonthHeaderInnerClass="text-base font-bold"

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass="bg-(--mui-palette-background-paper)"
      fillerClass="border border-(--mui-palette-divider) opacity-50"
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
      slotHeaderClass={getSlotClass}

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={`hover:underline ${outlineWidthFocusClass} ${outlineInsetClass} ${primaryOutlineColorClass}`}
      inlineWeekNumberClass={(info) => joinClassNames(
        `absolute top-0 start-0 rounded-ee-sm p-0.5 text-center text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] ${mutedBgClass}`,
        info.isNarrow ? xxsTextClass : 'text-sm',
      )}
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
          tableClass: (info) => joinClassNames(info.multiMonthColumnCount > 1 && 'border-(--mui-palette-divider) border'),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayCellBottomClass: 'min-h-3',

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (info) => joinClassNames(
            'mx-1 my-0.5',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center justify-end',
          allDayHeaderInnerClass: (info) => joinClassNames(
            'mx-1 my-2 text-end',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),
          allDayDividerClass: `border-y border-(--mui-palette-divider) pb-0.5 ${mutedBgClass}`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (info) => joinClassNames(
            'mx-1 my-0.5',
            info.isNarrow ? xxsTextClass : 'text-sm',
          ),
          slotHeaderDividerClass: `border-e border-(--mui-palette-divider)`,

          /* TimeGrid > Now-Indicator
          --------------------------------------------------------------------------------------- */

          nowIndicatorHeaderClass: 'start-0 -mt-[5px] border-y-[5px] border-y-transparent border-s-[6px] border-s-(--mui-palette-error-main)',
          nowIndicatorLineClass: `border-t border-(--mui-palette-error-main)`,

          ...userViews?.timeGrid,
        },
        list: {
          listDayClass: (info) => joinClassNames(!info.isLast && 'border-b border-(--mui-palette-divider)'),

          /* List-View > List-Item Event
          --------------------------------------------------------------------------------------- */

          listItemEventClass: (info) => joinClassNames(
            `group px-3 py-2 gap-3 border-t border-(--mui-palette-divider)`,
            info.isInteractive
              ? joinClassNames(faintHoverPressableClass, outlineInsetClass)
              : 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]',
          ),
          listItemEventBeforeClass: 'border-5',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: '-order-1 shrink-0 w-1/2 max-w-50 whitespace-nowrap overflow-hidden text-ellipsis text-sm',
          listItemEventTitleClass: (info) => joinClassNames(
            'grow min-w-0 whitespace-nowrap overflow-hidden text-sm',
            info.event.url && 'group-hover:underline',
          ),

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
