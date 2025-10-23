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
    dayHeaderContent: (data) => (
      (!data.dayNumberText || !data.isToday || data.inPopover) ? (
        // simple
        data.text
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
                      'size-7 first:-ms-1 last:-me-1',
                      'flex flex-row items-center justify-center', // h-align-text
                      'rounded-full font-semibold',
                      data.hasNavLink
                        ? joinClassNames(
                            params.tertiaryPressableGroupClass,
                            params.tertiaryOutlineColorClass,
                            params.outlineWidthGroupFocusClass,
                            params.outlineOffsetClass,
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
    dayCellTopContent: (data) => (
      !data.isToday ? (
        // simple
        data.text
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
                      data.isCompact
                        ? 'size-5'
                        : 'size-6 first:-ms-1 last:-me-1',
                      'flex flex-row items-center justify-center', // h-align-text
                      'rounded-full font-semibold',
                      data.hasNavLink
                        ? joinClassNames(
                            params.tertiaryPressableGroupClass,
                            params.tertiaryOutlineColorClass,
                            params.outlineWidthGroupFocusClass,
                            params.outlineOffsetClass,
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
  }
}
