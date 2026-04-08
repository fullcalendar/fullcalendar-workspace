import { CalendarOptions, joinClassNames } from '@fullcalendar/react'
import { Fragment } from 'react'
import { EventCalendarOptionParams } from './options-event-calendar'

export function createSlots(
  params: EventCalendarOptionParams,
): CalendarOptions {
  return {

    /* Day Header
    --------------------------------------------------------------------------------------------- */

    dayHeaderContent: (info) => (
      (info.inPopover || !info.dayNumberText || !info.isToday) ? (
        // simple
        // NOTE: wrapping in Fragment prevents Preact VDOM bug. Try upgrading Preact
        <Fragment>{info.text}</Fragment>
      ) : (
        // circle inside
        <Fragment>
          {info.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                (textPart.type === 'day' && info.isToday)
                  // today-circle
                  ? joinClassNames(
                      'first:-ms-1 last:-me-1 size-7 rounded-full font-semibold',
                      'flex flex-row items-center justify-center', // v-align, h-align
                      info.hasNavLink
                        ? joinClassNames(
                            params.tertiaryPressableGroupClass,
                            params.outlineWidthGroupFocusClass,
                            params.outlineOffsetClass,
                            params.tertiaryOutlineColorClass,
                          )
                        : params.tertiaryClass,
                    )
                  // normal text
                  : params.mutedFgClass,
              )}
            >{textPart.value}</span>
          ))}
        </Fragment>
      )
    ),

    /* Day Cell
    --------------------------------------------------------------------------------------------- */

    dayCellTopContent: (info) => (
      !info.isToday ? (
        // ghost-button
        // NOTE: wrapping in Fragment prevents Preact VDOM bug. Try upgrading Preact
        <Fragment>{info.text}</Fragment>
      ) : (
        // circle inside
        <Fragment>
          {info.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                (textPart.type === 'day' && info.isToday)
                  // today-circle
                  ? joinClassNames(
                      'rounded-full font-semibold',
                      'flex flex-row items-center justify-center', // v-align, h-align
                      info.isNarrow
                        ? 'size-5'
                        : 'size-6 first:-ms-1 last:-me-1',
                      info.hasNavLink
                        ? joinClassNames(
                            params.tertiaryPressableGroupClass,
                            params.outlineWidthGroupFocusClass,
                            params.outlineOffsetClass,
                            params.tertiaryOutlineColorClass,
                          )
                        : params.tertiaryClass,
                    )
                  // normal text
                  : (info.monthText ? params.fgClass : params.mutedFgClass),
              )}
            >{textPart.value}</span>
          ))}
        </Fragment>
      )
    ),
  }
}
