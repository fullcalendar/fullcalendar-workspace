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
      <Fragment>
        {data.weekdayText && (
          <div
            className={joinClassNames(
              'text-xs uppercase',
              params.mutedFgClass,
            )}
          >{data.weekdayText}</div>
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              'm-0.5 rounded-full flex flex-row items-center justify-center',
              data.isNarrow
                ? 'size-7 text-md'
                : 'size-8 text-lg',
              data.isToday
                ? (data.hasNavLink ? params.tertiaryPressableGroupClass : params.tertiaryClass)
                : (data.hasNavLink && params.mutedHoverPressableGroupClass),
              data.hasNavLink && joinClassNames(
                params.outlineWidthGroupFocusClass,
                params.tertiaryOutlineColorClass,
              ),
            )}
          >{data.dayNumberText}</div>
        )}
      </Fragment>
    ),
  }
}
