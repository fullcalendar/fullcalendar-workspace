import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import type * as FullCalendarPreact from '@fullcalendar/core/preact'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { EventCalendarOptionParams } from './options-event-calendar.js'

// HACK
;(createElement || Fragment); // import intentionally unused

export interface createSlotsVDom {
  createElement: typeof FullCalendarPreact.createElement
  Fragment: typeof FullCalendarPreact.Fragment
}

export function createSlots(
  { createElement, Fragment }: createSlotsVDom, // masks the module-wide imports
  params: EventCalendarOptionParams,
): CalendarOptions {
  return {

    /* Day Header
    --------------------------------------------------------------------------------------------- */

    dayHeaderContent: (data) => (
      (data.inPopover || !data.dayNumberText || !data.isToday) ? (
        // simple
        // NOTE: wrapping in Fragment prevents Preact VDOM bug. Try upgrading Preact
        <Fragment>{data.text}</Fragment>
      ) : (
        // circle inside
        <Fragment>
          {data.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                (textPart.type === 'day' && data.isToday)
                  // today-circle
                  ? joinClassNames(
                      'first:-ms-1 last:-me-1 size-7 rounded-full font-semibold',
                      'flex flex-row items-center justify-center', // v-align, h-align
                      data.hasNavLink
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

    dayCellTopContent: (data) => (
      !data.isToday ? (
        // ghost-button
        // NOTE: wrapping in Fragment prevents Preact VDOM bug. Try upgrading Preact
        <Fragment>{data.text}</Fragment>
      ) : (
        // circle inside
        <Fragment>
          {data.textParts.map((textPart, i) => (
            <span
              key={i}
              className={joinClassNames(
                'whitespace-pre',
                (textPart.type === 'day' && data.isToday)
                  // today-circle
                  ? joinClassNames(
                      'rounded-full font-semibold',
                      'flex flex-row items-center justify-center', // v-align, h-align
                      data.isNarrow
                        ? 'size-5'
                        : 'size-6 first:-ms-1 last:-me-1',
                      data.hasNavLink
                        ? joinClassNames(
                            params.tertiaryPressableGroupClass,
                            params.outlineWidthGroupFocusClass,
                            params.outlineOffsetClass,
                            params.tertiaryOutlineColorClass,
                          )
                        : params.tertiaryClass,
                    )
                  // normal text
                  : (data.monthText ? params.fgClass : params.mutedFgClass),
              )}
            >{textPart.value}</span>
          ))}
        </Fragment>
      )
    ),
  }
}
