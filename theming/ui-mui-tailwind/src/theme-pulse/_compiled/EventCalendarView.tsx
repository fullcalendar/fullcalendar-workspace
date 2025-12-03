import React from 'react'
import { CalendarOptions, DayCellData, joinClassNames } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import CloseIcon from '@mui/icons-material/Close'

// outline
export const outlineWidthClass = 'outline-3'
export const outlineWidthFocusClass = 'focus-visible:outline-3'
export const outlineWidthGroupFocusClass = 'group-focus-visible:outline-3'
export const outlineOffsetClass = 'outline-offset-1'
export const outlineInsetClass = '-outline-offset-3'
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
export const mutedPressableClass = `${mutedBgClass} hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.12)] active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.16)]`
export const mutedHoverPressableClass = `${mutedBgHoverClass} focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)] ${mutedBgActiveClass}`

// faint (4%)
export const faintBgClass = 'bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgHoverClass = 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
const faintBgFocusClass = 'focus-visible:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]'
export const faintHoverPressableClass = `${faintBgHoverClass} ${faintBgFocusClass} ${mutedBgActiveClass}`
export const faintSolidBgClass = '[background:linear-gradient(rgba(var(--mui-palette-text-primaryChannel)_/_0.04),rgba(var(--mui-palette-text-primaryChannel)_/_0.04))_var(--mui-palette-background-paper)]'

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

export const tallDayCellBottomClass = 'min-h-3'
export const getShortDayCellBottomClass = (data: DayCellData) => (
  !data.isNarrow && 'min-h-0.5'
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (data) => [
    'mb-px p-px rounded-sm',
    data.isNarrow ? 'mx-0.5' : 'mx-1',
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
    'order-1 whitespace-nowrap overflow-hidden shrink-1',
  ],
  listItemEventTitleClass: (data) => [
    data.isNarrow ? 'px-px' : 'px-0.5',
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
    'mb-px border rounded-sm',
    data.isNarrow
      ? `mx-0.5 border-(--mui-palette-primary-main) ${mutedHoverPressableClass}`
      : `self-start mx-1 border-transparent ${mutedPressableClass}`,
  ],
  rowMoreLinkInnerClass: (data) => [
    data.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--mui-palette-text-primary)',
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

      eventShortHeight={50}
      eventColor="var(--mui-palette-primary-main)"
      eventContrastColor="var(--mui-palette-primary-contrastText)"
      eventClass={(data) => [
        data.isSelected
          ? joinClassNames(
              outlineWidthClass,
              data.isDragging && 'shadow-lg',
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
        (data.isNarrow || data.isShort)
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
        'text-(--mui-palette-text-primary)',
      ]}

      /* List-Item Event
      ------------------------------------------------------------------------------------------- */

      listItemEventTitleClass="text-(--mui-palette-text-primary)"
      listItemEventTimeClass="text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]"

      /* Block Event
      ------------------------------------------------------------------------------------------- */

      blockEventClass={(data) => [
        'group relative border-transparent print:border-(--fc-event-color)',
        'bg-(--fc-event-color) print:bg-white',
        'hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        data.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (data.isDragging && !data.isSelected) && 'opacity-75',
      ]}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ------------------------------------------------------------------------------------------- */

      rowEventClass={(data) => [
        'mb-px border-y',
        data.isStart && 'rounded-s-sm border-s',
        data.isEnd && 'rounded-e-sm border-e',
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
      rowEventTimeClass={(data) => (
        data.isNarrow ? 'ps-0.5' : 'ps-1'
      )}
      rowEventTitleClass={(data) => [
        data.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      ]}

      /* Column Event
      ------------------------------------------------------------------------------------------- */

      columnEventClass={(data) => [
        `border-x ring ring-(--mui-palette-background-paper)`,
        data.isStart && joinClassNames('border-t rounded-t-lg', data.isNarrow ? 'mt-px' : 'mt-0.5'),
        data.isEnd && joinClassNames('border-b rounded-b-lg', data.isNarrow ? 'mb-px' : 'mb-0.5'),
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
        (data.isNarrow || data.isShort) ? xxsTextClass : 'text-xs',
      ]}
      columnEventTimeClass={(data) => (
        !data.isShort && (data.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(data) => [
        !data.isShort && (data.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      ]}

      /* More-Link
      ------------------------------------------------------------------------------------------- */

      moreLinkClass={[
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={[
        'my-0.5 border border-transparent print:border-black rounded-md',
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

      dayHeaderClass={(data) => [
        'justify-center',
        data.inPopover ? 'border-b border-(--mui-palette-divider)' :
          data.isMajor && `border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]`,
      ]}
      dayHeaderInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow ? 'text-xs' : 'text-sm',
        data.inPopover ? joinClassNames(
          'm-1.5 px-1 py-0.5 rounded-sm font-semibold',
          'text-(--mui-palette-text-primary)',
          data.hasNavLink && mutedHoverPressableClass,
        ) : !data.dayNumberText ? joinClassNames(
          'mx-0.5 my-1.5 py-0.5 px-1.5 rounded-sm',
          'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
          data.hasNavLink && mutedHoverPressableClass,
        ) : !data.isToday ? joinClassNames(
          'mx-2 my-2.5 h-6 px-1.5 rounded-sm',
          'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
          data.hasNavLink && mutedHoverPressableClass,
        ) : (
          'group mx-2 my-2 h-7 outline-none'
        )
      ]}
      dayHeaderContent={(data) => (
        (data.inPopover || !data.dayNumberText || !data.isToday) ? (
          <React.Fragment>{data.text}</React.Fragment>
        ) : (
          <React.Fragment>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  (textPart.type === 'day' && data.isToday)
                    ? joinClassNames(
                        'first:-ms-1 last:-me-1 size-7 rounded-full font-semibold',
                        'flex flex-row items-center justify-center',
                        data.hasNavLink
                          ? joinClassNames(
                              tertiaryPressableGroupClass,
                              outlineWidthGroupFocusClass,
                              outlineOffsetClass,
                              tertiaryOutlineColorClass,
                            )
                          : tertiaryClass,
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
        data.isMajor
          ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
          : 'border-(--mui-palette-divider)',
      ]}
      dayCellTopClass={(data) => [
        data.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row justify-end',
      ]}
      dayCellTopInnerClass={(data) => [
        'flex flex-row items-center',
        data.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !data.isToday
          ? joinClassNames(
              'rounded-s-sm whitespace-nowrap',
              !data.isOther && 'font-semibold',
              data.isNarrow ? 'px-1' : 'px-2',
              data.monthText ? 'text-(--mui-palette-text-primary)' : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
              data.hasNavLink && mutedHoverPressableClass,
            )
          : joinClassNames(
              'group outline-none',
              data.isNarrow
                ? 'mx-px'
                : 'mx-2',
            )
      ]}
      dayCellTopContent={(data) => (
        !data.isToday ? (
          <React.Fragment>{data.text}</React.Fragment>
        ) : (
          <React.Fragment>
            {data.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  (textPart.type === 'day' && data.isToday)
                    ? joinClassNames(
                        'rounded-full font-semibold',
                        'flex flex-row items-center justify-center',
                        data.isNarrow
                          ? 'size-5'
                          : 'size-6 first:-ms-1 last:-me-1',
                        data.hasNavLink
                          ? joinClassNames(
                              tertiaryPressableGroupClass,
                              outlineWidthGroupFocusClass,
                              outlineOffsetClass,
                              tertiaryOutlineColorClass,
                            )
                          : tertiaryClass,
                      )
                    : (data.monthText ? 'text-(--mui-palette-text-primary)' : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]'),
                )}
              >{textPart.value}</span>
            ))}
          </React.Fragment>
        )
      )}
      dayCellInnerClass={(data) => data.inPopover && 'p-2'}

      /* Popover
      ------------------------------------------------------------------------------------------- */

      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55"
      popoverCloseClass={[
        'group absolute top-1.5 end-1.5 p-0.5 rounded-sm',
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
          : data.isNarrow ? 'mx-px' : 'mx-0.5'
      )}
      slotLaneClass={(data) => [
        `border border-(--mui-palette-divider)`,
        data.isMinor && 'border-dotted',
      ]}
      listDayClass="group/day flex flex-col"
      listDayHeaderClass={[
        `border-b border-(--mui-palette-divider) ${faintSolidBgClass} text-(--mui-palette-text-primary)`,
        'flex flex-row items-center justify-between',
      ]}
      listDayHeaderInnerClass={(data) => [
        'm-1.5 px-1.5 py-0.5 rounded-sm text-sm',
        !data.level && 'font-semibold',
        (!data.level && data.isToday)
          ? data.hasNavLink
              ? joinClassNames(tertiaryPressableClass, outlineOffsetClass)
              : tertiaryClass
          : data.hasNavLink && mutedHoverPressableClass,
      ]}
      listDayEventsClass={`group-not-last/day:border-b border-(--mui-palette-divider) px-1.5 py-2 gap-2`}

      /* Single Month (in Multi-Month)
      ------------------------------------------------------------------------------------------- */

      singleMonthClass="m-3"
      singleMonthHeaderClass={(data) => [
        data.isSticky && `border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)`,
        data.colCount > 1 ? 'pb-2' : 'py-1',
        'items-center',
      ]}
      singleMonthHeaderInnerClass={(data) => [
        'px-1.5 py-0.5 rounded-sm font-semibold',
        data.hasNavLink && mutedHoverPressableClass,
        'text-(--mui-palette-text-primary)',
      ]}

      /* Misc Table
      ------------------------------------------------------------------------------------------- */

      tableHeaderClass={(data) => data.isSticky && 'bg-(--mui-palette-background-paper)'}
      fillerClass="border border-(--mui-palette-divider) opacity-50"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
      slotHeaderInnerClass="text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]"

      /* Misc Content
      ------------------------------------------------------------------------------------------- */

      navLinkClass={[
        outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      ]}
      inlineWeekNumberClass={(data) => [
        `absolute start-0 whitespace-nowrap rounded-e-sm`,
        data.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        data.hasNavLink && mutedHoverPressableClass,
        'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
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
          dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: `border-b border-(--mui-palette-divider)`,
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : data.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: (data) => data.isSticky && `border-b border-(--mui-palette-divider)`,
          dayCellBottomClass: getShortDayCellBottomClass,
          viewClass: faintBgClass,
          tableBodyClass: `border border-(--mui-palette-divider) bg-(--mui-palette-background-paper) rounded-sm overflow-hidden`,
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          dayHeaderAlign: (data) => data.inPopover ? 'start' : 'center',
          dayHeaderDividerClass: (data) => [
            'border-b',
            data.options.allDaySlot
              ? 'border-(--mui-palette-divider)'
              : `border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`
          ],
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          --------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (data) => [
            `mx-0.5 h-6 px-1.5 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] flex flex-row items-center rounded-sm`,
            data.isNarrow ? 'text-xs' : 'text-sm',
            data.hasNavLink && mutedHoverPressableClass,
          ],

          /* TimeGrid > All-Day Header
          --------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (data) => [
            `p-2 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]`,
            data.isNarrow ? xxsTextClass : 'text-xs',
          ],
          allDayDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] shadow-sm`,

          /* TimeGrid > Slot Header
          --------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (data) => [
            'relative p-2',
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
            'group py-1 rounded-sm',
            data.isInteractive
              ? joinClassNames(faintHoverPressableClass, outlineInsetClass)
              : 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]',
          ],
          listItemEventBeforeClass: 'w-1.5 bg-(--fc-event-color) rounded-full',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: [
            '-order-1 shrink-0 w-1/2 max-w-60 px-4 py-2',
            'whitespace-nowrap overflow-hidden text-ellipsis text-sm',
          ],
          listItemEventTitleClass: (data) => [
            'grow min-w-0 px-4 py-2 whitespace-nowrap overflow-hidden text-sm',
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

