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
  const tertiaryButtonGroupClass = joinClassNames(
    params.tertiaryPressableGroupClass,
    params.tertiaryOutlineColorClass,
    params.outlineWidthGroupFocusClass,
  )
  const ghostButtonGroupClass = joinClassNames(
    params.ghostPressableGroupClass,
    params.tertiaryOutlineColorClass,
    params.outlineWidthGroupFocusClass,
  )

  return {
    dayHeaderContent: (data) => (
      <Fragment>
        {data.weekdayText && (
          <div
            className={joinClassNames(
              'uppercase text-xs',
              params.mutedFgClass,
            )}
          >{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 flex flex-row items-center justify-center text-lg size-9 rounded-full',
              data.isToday
                ? (data.hasNavLink ? tertiaryButtonGroupClass : params.tertiaryClass)
                : (data.hasNavLink && ghostButtonGroupClass)
            )}
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),
  }
}
