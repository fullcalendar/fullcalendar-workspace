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
                ? (data.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                : (data.hasNavLink && params.ghostPressableGroupClass),
              data.hasNavLink && joinClassNames(
                params.tertiaryOutlineColorClass,
                params.outlineWidthGroupFocusClass,
              ),
            )}
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),
  }
}
