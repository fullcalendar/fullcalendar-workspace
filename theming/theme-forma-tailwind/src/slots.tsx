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
      <Fragment>
        {info.isToday && (
          // thick line, contained by either dayHeaderClass or dayHeaderInnerClass
          <div className={`absolute top-0 inset-x-0 border-t-4 ${params.primaryBorderColorClass} pointer-events-none`} />
        )}
        {info.dayNumberText && (
          <div
            className={joinClassNames(
              info.isToday && 'font-bold',
              info.isNarrow ? 'text-base' : 'text-lg',
            )}
          >{info.dayNumberText}</div>
        )}
        {info.weekdayText && (
          <div className='text-xs'>{info.weekdayText}</div>
        )}
      </Fragment>
    ),
  }
}
