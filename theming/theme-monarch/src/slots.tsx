import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import type * as FullCalendarPreact from '@fullcalendar/core/preact'
import { createElement, Fragment } from '@fullcalendar/core/preact'
import { EventCalendarOptionParams, xxsTextClass } from './options-event-calendar.js'

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
              'uppercase',
              params.mutedFgClass,
              data.isNarrow ? xxsTextClass : 'text-xs',
            )}
          >{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 flex flex-row items-center justify-center rounded-full',
              data.isNarrow
                ? 'text-md size-7'
                : 'text-lg size-8',
              data.isToday
                ? (data.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                : (data.hasNavLink && params.mutedHoverPressableGroupClass),
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
