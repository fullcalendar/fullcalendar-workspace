import React from 'react'
import FullCalendar, { type CalendarOptions, type DayCellInfo, joinClassNames } from '@fullcalendar/react'
import { EventCalendarCloseIcon } from './icons'

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
const mutedBgActiveClass = 'active:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.08)]'
const mutedPressableClass = `${mutedBgClass} ${strongBgHoverClass} ${strongerBgActiveClass}`
export const mutedHoverPressableClass = `${mutedBgHoverClass} ${strongBgFocusClass} ${strongBgActiveClass}`

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
export const getShortDayCellBottomClass = (info: DayCellInfo) => joinClassNames(
  !info.isNarrow && 'min-h-0.5',
)

export const dayRowCommonClasses: CalendarOptions = {

  /* Day Row > List-Item Event
  ----------------------------------------------------------------------------------------------- */

  listItemEventClass: (info) => joinClassNames(
    'mb-px p-px rounded-sm',
    info.isNarrow ? 'mx-0.5' : 'mx-1',
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
    'order-1 whitespace-nowrap overflow-hidden shrink-1',
  ),
  listItemEventTitleClass: (info) => joinClassNames(
    info.isNarrow ? 'px-px' : 'px-0.5',
    'font-medium whitespace-nowrap overflow-hidden shrink-100',
    info.timeText && 'text-ellipsis',
  ),

  /* Day Row > Row Event
  ----------------------------------------------------------------------------------------------- */

  rowEventClass: (info) => joinClassNames(
    info.isStart && (info.isNarrow ? 'ms-0.5' : 'ms-1'),
    info.isEnd && (info.isNarrow ? 'me-0.5' : 'me-1'),
  ),
  rowEventInnerClass: (info) => info.isNarrow ? 'py-px' : 'py-0.5',

  /* Day Row > More-Link
  ----------------------------------------------------------------------------------------------- */

  rowMoreLinkClass: (info) => joinClassNames(
    'mb-px border rounded-sm',
    info.isNarrow
      ? `mx-0.5 border-(--mui-palette-primary-main) ${mutedHoverPressableClass}`
      : `self-start mx-1 border-transparent ${mutedPressableClass}`,
  ),
  rowMoreLinkInnerClass: (info) => joinClassNames(
    info.isNarrow
      ? `p-px ${xxsTextClass}`
      : 'p-0.5 text-xs',
    'text-(--mui-palette-text-primary)',
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
              info.isDragging && 'shadow-lg',
            )
          : outlineWidthFocusClass,
        tertiaryOutlineColorClass,
      )}

      /* Background Event
      ----------------------------------------------------------------------------------------- */

      backgroundEventColor="var(--mui-palette-secondary-main)"
      backgroundEventClass="not-print:bg-[color-mix(in_oklab,var(--fc-event-color)_15%,transparent)] print:border-1 print:border-(--fc-event-color)"
      backgroundEventTitleClass={(info) => joinClassNames(
        'opacity-50 italic text-(--mui-palette-text-primary)',
        (info.isNarrow || info.isShort)
          ? `p-1 ${xxsTextClass}`
          : 'p-2 text-xs',
      )}

      /* List-Item Event
      ----------------------------------------------------------------------------------------- */

      listItemEventTitleClass="text-(--mui-palette-text-primary)"
      listItemEventTimeClass="text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]"

      /* Block Event
      ----------------------------------------------------------------------------------------- */

      blockEventClass={(info) => joinClassNames(
        'group relative border-transparent print:border-(--fc-event-color) bg-(--fc-event-color) print:bg-white hover:bg-[color-mix(in_oklab,var(--fc-event-color)_92%,var(--fc-event-contrast-color))]',
        info.isInteractive && 'active:bg-[color-mix(in_oklab,var(--fc-event-color)_85%,var(--fc-event-contrast-color))]',
        (info.isDragging && !info.isSelected) && 'opacity-75',
      )}
      blockEventInnerClass="text-(--fc-event-contrast-color) print:text-black"
      blockEventTimeClass="whitespace-nowrap overflow-hidden shrink-1"
      blockEventTitleClass="whitespace-nowrap overflow-hidden shrink-100"

      /* Row Event
      ----------------------------------------------------------------------------------------- */

      rowEventClass={(info) => joinClassNames(
        'mb-px border-y',
        info.isStart && 'rounded-s-sm border-s',
        info.isEnd && 'rounded-e-sm border-e',
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
      rowEventTimeClass={(info) => (
        info.isNarrow ? 'ps-0.5' : 'ps-1'
      )}
      rowEventTitleClass={(info) => joinClassNames(
        info.isNarrow ? 'px-0.5' : 'px-1',
        'font-medium',
      )}

      /* Column Event
      ----------------------------------------------------------------------------------------- */

      columnEventClass={(info) => joinClassNames(
        'border-x ring ring-(--mui-palette-background-paper)',
        info.isStart && joinClassNames('border-t rounded-t-lg', info.isNarrow ? 'mt-px' : 'mt-0.5'),
        info.isEnd && joinClassNames('border-b rounded-b-lg', info.isNarrow ? 'mb-px' : 'mb-0.5'),
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
        (info.isNarrow || info.isShort) ? xxsTextClass : 'text-xs',
      )}
      columnEventTimeClass={(info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'pt-0.5' : 'pt-1')
      )}
      columnEventTitleClass={(info) => joinClassNames(
        !info.isShort && (info.isNarrow ? 'py-0.5' : 'py-1'),
        'font-medium',
      )}

      /* More-Link
      ----------------------------------------------------------------------------------------- */

      moreLinkClass={`${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      moreLinkInnerClass="whitespace-nowrap overflow-hidden"
      columnMoreLinkClass={`my-0.5 border border-transparent print:border-black rounded-md ${strongSolidPressableClass} print:bg-white ring ring-(--mui-palette-background-paper)`}
      columnMoreLinkInnerClass={(info) => joinClassNames(
        info.isNarrow
          ? `p-0.5 ${xxsTextClass}`
          : 'p-1 text-xs',
        'text-(--mui-palette-text-primary)',
      )}

      /* Day Header
      ----------------------------------------------------------------------------------------- */

      dayHeaderClass={(info) => joinClassNames(
        'justify-center',
        info.inPopover ? 'border-b border-(--mui-palette-divider)' :
          info.isMajor && 'border border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]',
      )}
      dayHeaderInnerClass={(info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow ? 'text-xs' : 'text-sm',
        info.inPopover ? joinClassNames(
          'm-1.5 px-1 py-0.5 rounded-sm font-semibold text-(--mui-palette-text-primary)',
          info.hasNavLink && mutedHoverPressableClass,
        ) : !info.dayNumberText ? joinClassNames(
          'mx-0.5 my-1.5 py-0.5 px-1.5 rounded-sm text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
          info.hasNavLink && mutedHoverPressableClass,
        ) : !info.isToday ? joinClassNames(
          'mx-2 my-2.5 h-6 px-1.5 rounded-sm text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
          info.hasNavLink && mutedHoverPressableClass,
        ) : (
          'group mx-2 my-2 h-7 outline-none'
        ),
      )}
      dayHeaderContent={(info) => (
        (info.inPopover || !info.dayNumberText || !info.isToday) ? (
          <>{info.text}</>
        ) : (
          <>
            {info.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  (textPart.type === 'day' && info.isToday)
                    ? joinClassNames(
                        'first:-ms-1 last:-me-1 size-7 rounded-full font-semibold flex flex-row items-center justify-center',
                        info.hasNavLink
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
          </>
        )
      )}

      /* Day Cell
      ----------------------------------------------------------------------------------------- */

      dayCellClass={(info) => joinClassNames(
        'border',
        info.isMajor
          ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]'
          : 'border-(--mui-palette-divider)',
      )}
      dayCellTopClass={(info) => joinClassNames(
        info.isNarrow ? 'min-h-0.5' : 'min-h-1',
        'flex flex-row justify-end',
      )}
      dayCellTopInnerClass={(info) => joinClassNames(
        'flex flex-row items-center',
        info.isNarrow
          ? `my-px h-5 ${xxsTextClass}`
          : 'my-1 h-6 text-sm',
        !info.isToday
          ? joinClassNames(
              'rounded-s-sm whitespace-nowrap',
              !info.isOther && 'font-semibold',
              info.isNarrow ? 'px-1' : 'px-2',
              info.monthText ? 'text-(--mui-palette-text-primary)' : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
              info.hasNavLink && mutedHoverPressableClass,
            )
          : joinClassNames(
              'group outline-none',
              info.isNarrow
                ? 'mx-px'
                : 'mx-2',
            ),
      )}
      dayCellTopContent={(info) => (
        !info.isToday ? (
          <>{info.text}</>
        ) : (
          <>
            {info.textParts.map((textPart, i) => (
              <span
                key={i}
                className={joinClassNames(
                  'whitespace-pre',
                  (textPart.type === 'day' && info.isToday)
                    ? joinClassNames(
                        'rounded-full font-semibold flex flex-row items-center justify-center',
                        info.isNarrow
                          ? 'size-5'
                          : 'size-6 first:-ms-1 last:-me-1',
                        info.hasNavLink
                          ? joinClassNames(
                              tertiaryPressableGroupClass,
                              outlineWidthGroupFocusClass,
                              outlineOffsetClass,
                              tertiaryOutlineColorClass,
                            )
                          : tertiaryClass,
                      )
                    : (info.monthText ? 'text-(--mui-palette-text-primary)' : 'text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]'),
                )}
              >{textPart.value}</span>
            ))}
          </>
        )
      )}
      dayCellInnerClass={(info) => joinClassNames(info.inPopover && 'p-2')}

      /* Popover
      ----------------------------------------------------------------------------------------- */

      popoverClass="text-(--mui-palette-text-primary) bg-(--mui-palette-background-paper) bg-(image:--mui-overlays-8) rounded-(--mui-shape-borderRadius) overflow-hidden shadow-(--mui-shadows-8) m-2 min-w-55 root-reset"
      popoverCloseClass={`group absolute top-1.5 end-1.5 p-0.5 rounded-sm ${mutedHoverPressableClass} ${outlineWidthFocusClass} ${tertiaryOutlineColorClass} button-reset`}
      popoverCloseContent={() => <EventCalendarCloseIcon />}
      dayLaneClass={(info) => joinClassNames(
        'border',
        info.isMajor ? 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)]' : 'border-(--mui-palette-divider)',
        info.isDisabled && faintBgClass,
      )}
      dayLaneInnerClass={(info) => (
        info.isStack
          ? 'm-1'
          : info.isNarrow ? 'mx-px' : 'mx-0.5'
      )}
      slotLaneClass={(info) => joinClassNames(
        'border border-(--mui-palette-divider)',
        info.isMinor && 'border-dotted',
      )}
      listDayClass={(info) => joinClassNames('flex flex-col', !info.isLast && 'border-b border-(--mui-palette-divider)')}
      listDayHeaderClass={`-mb-px border-b border-(--mui-palette-divider) ${faintSolidBgClass} text-(--mui-palette-text-primary) flex flex-row items-center justify-between`}
      listDayHeaderInnerClass={(info) => joinClassNames(
        'm-1.5 px-1.5 py-0.5 rounded-sm text-sm',
        !info.level && 'font-semibold',
        (!info.level && info.isToday)
          ? info.hasNavLink
              ? joinClassNames(tertiaryPressableClass, outlineOffsetClass)
              : tertiaryClass
          : info.hasNavLink && mutedHoverPressableClass,
      )}
      listDayBodyClass="mt-px px-1.5 py-2 gap-2"

      /* Single Month (in Multi-Month)
      ----------------------------------------------------------------------------------------- */

      singleMonthClass={(info) => joinClassNames(
        info.multiMonthColumnCount > 1 && 'm-3',
        (info.multiMonthColumnCount === 1 && !info.isLast) && 'border-b border-(--mui-palette-divider)',
      )}
      singleMonthHeaderClass={(info) => joinClassNames(
        info.multiMonthColumnCount > 1 ? 'pb-2' : 'py-1 border-b border-(--mui-palette-divider) bg-(--mui-palette-background-paper)',
        'items-center',
      )}
      singleMonthHeaderInnerClass={(info) => joinClassNames(
        'px-1.5 py-0.5 rounded-sm text-base text-(--mui-palette-text-primary) font-semibold',
        info.hasNavLink && mutedHoverPressableClass,
      )}

      /* Misc Table
      ----------------------------------------------------------------------------------------- */

      tableBodyClass="bg-(--mui-palette-background-paper)"
      fillerClass="border border-(--mui-palette-divider) opacity-50"
      dayNarrowWidth={100}
      dayHeaderRowClass="border border-(--mui-palette-divider)"
      dayRowClass="border border-(--mui-palette-divider)"
      slotHeaderRowClass="border border-(--mui-palette-divider)"
      slotHeaderInnerClass="text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]"

      /* Misc Content
      ----------------------------------------------------------------------------------------- */

      navLinkClass={`${outlineWidthFocusClass} ${tertiaryOutlineColorClass}`}
      inlineWeekNumberClass={(info) => joinClassNames(
        'absolute start-0 whitespace-nowrap rounded-e-sm text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
        info.isNarrow
          ? `top-0.5 my-px p-0.5 ${xxsTextClass}`
          : 'top-1 p-1 text-xs',
        info.hasNavLink && mutedHoverPressableClass,
      )}
      highlightClass="bg-[rgba(var(--mui-palette-primary-mainChannel)_/_0.1)]"
      nonBusinessClass={faintBgClass}
      nowIndicatorLineClass="-m-px border-1 border-(--mui-palette-error-main)"
      nowIndicatorDotClass="-m-[6px] border-6 border-(--mui-palette-error-main) size-0 rounded-full ring-2 ring-(--mui-palette-background-paper)"

      /* View-Specific Options
      ----------------------------------------------------------------------------------------- */

      views={{
        ...userViews,
        dayGrid: {
          ...dayRowCommonClasses,
          tableHeaderClass: 'bg-(--mui-palette-background-paper)',
          dayHeaderAlign: (info) => info.inPopover ? 'start' : info.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: `border-b border-(--mui-palette-divider)`,
          dayCellBottomClass: getShortDayCellBottomClass,
          ...userViews?.dayGrid,
        },
        multiMonth: {
          ...dayRowCommonClasses,
          tableHeaderClass: (info) => joinClassNames(info.multiMonthColumnCount === 1 && 'bg-(--mui-palette-background-paper)'),
          dayHeaderAlign: (info) => info.inPopover ? 'start' : info.isNarrow ? 'center' : 'end',
          dayHeaderDividerClass: (info) => joinClassNames(info.multiMonthColumnCount === 1 && `border-b border-(--mui-palette-divider)`),
          dayCellBottomClass: getShortDayCellBottomClass,
          viewClass: faintBgClass,
          tableBodyClass: (info) => joinClassNames(info.multiMonthColumnCount > 1 && 'border border-(--mui-palette-divider) rounded-sm overflow-hidden'),
          ...userViews?.multiMonth,
        },
        timeGrid: {
          ...dayRowCommonClasses,
          tableHeaderClass: 'bg-(--mui-palette-background-paper)',
          dayHeaderAlign: (info) => info.inPopover ? 'start' : 'center',
          dayHeaderDividerClass: (info) => joinClassNames(
            'border-b',
            info.options.allDaySlot
              ? 'border-(--mui-palette-divider)'
              : 'border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] not-print:shadow-sm',
          ),
          dayCellBottomClass: tallDayCellBottomClass,

          /* TimeGrid > Week Number Header
          ------------------------------------------------------------------------------------- */

          weekNumberHeaderClass: 'items-center justify-end',
          weekNumberHeaderInnerClass: (info) => joinClassNames(
            'mx-0.5 h-6 px-1.5 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)] flex flex-row items-center rounded-sm',
            info.isNarrow ? 'text-xs' : 'text-sm',
            info.hasNavLink && mutedHoverPressableClass,
          ),

          /* TimeGrid > All-Day Header
          ------------------------------------------------------------------------------------- */

          allDayHeaderClass: 'items-center',
          allDayHeaderInnerClass: (info) => joinClassNames(
            'm-2 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',
            info.isNarrow ? xxsTextClass : 'text-xs',
          ),
          allDayDividerClass: `border-b border-[rgba(var(--mui-palette-text-primaryChannel)_/_0.2)] not-print:shadow-sm`,

          /* TimeGrid > Slot Header
          ------------------------------------------------------------------------------------- */

          slotHeaderClass: 'justify-end',
          slotHeaderInnerClass: (info) => joinClassNames(
            'relative m-2',
            info.isNarrow
              ? `-top-3.5 ${xxsTextClass}`
              : '-top-4 text-xs',
            info.isFirst && 'hidden',
          ),
          slotHeaderDividerClass: `border-e border-(--mui-palette-divider)`,

          ...userViews?.timeGrid,
        },
        list: {
          viewClass: 'bg-(--mui-palette-background-paper)',

          /* List-View > List-Item Event
          ------------------------------------------------------------------------------------- */

          listItemEventClass: (info) => joinClassNames(
            'group py-1 rounded-sm',
            info.isInteractive
              ? joinClassNames(faintHoverPressableClass, outlineInsetClass)
              : 'hover:bg-[rgba(var(--mui-palette-text-primaryChannel)_/_0.04)]',
          ),
          listItemEventBeforeClass: 'w-1.5 bg-(--fc-event-color) rounded-full',
          listItemEventInnerClass: '[display:contents]',
          listItemEventTimeClass: '-order-1 shrink-0 w-1/2 max-w-60 px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-sm',
          listItemEventTitleClass: (info) => joinClassNames(
            'grow min-w-0 px-4 py-2 whitespace-nowrap overflow-hidden text-sm',
            info.event.url && 'group-hover:underline',
          ),

          /* No-Events Screen
          ------------------------------------------------------------------------------------- */

          noEventsClass: 'grow flex flex-col items-center justify-center',
          noEventsInnerClass: 'py-15 text-[rgba(var(--mui-palette-text-primaryChannel)_/_0.6)]',

          ...userViews?.list,
        },
      }}
      {...restOptions}
    />
  )
}
