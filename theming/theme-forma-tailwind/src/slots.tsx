import { CalendarOptions, joinClassNames } from '@fullcalendar/core'
import { Fragment } from 'react'
import { EventCalendarOptionParams } from './options-event-calendar.js'

export function createSlots(
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
