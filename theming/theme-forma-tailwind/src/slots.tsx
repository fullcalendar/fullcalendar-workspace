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
        {data.isToday && (
          // thick line, contained by either dayHeaderClass or dayHeaderInnerClass
          <div className={`absolute top-0 inset-x-0 border-t-4 ${params.primaryBorderColorClass} pointer-events-none`} />
        )}
        {data.dayNumberText && (
          <div
            className={joinClassNames(
              data.isToday && 'font-bold',
              data.isNarrow ? 'text-md' : 'text-lg',
            )}
          >{data.dayNumberText}</div>
        )}
        {data.weekdayText && (
          <div className='text-xs'>{data.weekdayText}</div>
        )}
      </Fragment>
    ),
  }
}
